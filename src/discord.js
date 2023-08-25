// Require the necessary discord.js classes
import { Client, Events, GatewayIntentBits, REST, Routes } from "discord.js";
import { config } from "./config.js";
import { checkValidity, findStreak } from "./rules.js";
import state from "./state.js";
import { Queue } from "./queue.js";
import pkg from "../package.json" assert { type: "json" };
import { errorMessages, errorNames } from "./error-messages.js";
import { formatDistance, differenceInMinutes } from "date-fns";
import nl from "date-fns/locale/nl-BE/index.js";

let client;

const lengthOfMessageCache = config.uniqueUsers * 2 + 5;
const discordRestVersion = "10";

class RecentMessages {
  #uniqueUsers = 0;
  #messages = [];

  constructor(uniqueUsers) {
    this.#uniqueUsers = uniqueUsers;
    this.#messages = [];
  }

  add(message) {
    this.#messages.unshift(message);

    if (this.#messages.length >= this.#uniqueUsers) {
      this.#resize();
    }
  }

  messages() {
    return this.#messages.slice().reverse();
  }

  #resize() {
    // We want `config.uniqueUsers` amount of messages, but if somebody adds multiple posts, then we
    // want to ensure that we have at least `config.uniqueUsers` unique users.
    let authors = new Set();

    for (let [idx, message] of this.#messages.entries()) {
      authors.add(message.author.id);

      if (authors.size > this.#uniqueUsers) {
        this.#messages.splice(idx + 1);
        break;
      }
    }
  }
}

const messagesQueue = new Queue();

// Create a new client instance
export async function initClient() {
  if (client) {
    throw new Error("Client already initialized");
  }

  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
    ],
  });

  const rest = new REST({ version: discordRestVersion }).setToken(config.token);

  // When the client is ready, run this code (only once)
  // We use 'c' for the event parameter to keep it separate from the already defined 'client'
  client.once(Events.ClientReady, (c) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
  });

  // Log in to Discord with your client's token
  await client.login(config.token);

  const channel = await client.channels.fetch(config.channelId);
  const debugChannel = await client.channels.fetch(config.debugChannelId);

  if (!channel) {
    throw new Error("Channel not found");
  }

  if (!channel.isTextBased()) {
    throw new Error("Channel is not text based");
  }

  if (!debugChannel) {
    throw new Error("Debug channel not found");
  }

  if (!debugChannel.isTextBased()) {
    throw new Error("Debug channel is not text based");
  }

  async function handleMessage(message) {
    // Ignore messages from other channels
    if (message.channelId !== config.channelId) return;

    // Ignore messages from bots
    if (message.author.bot) {
      // Keep the last messages up to date including the bot message itself. Otherwise you can run
      // into this scenario:
      // 1. Alice posts   1
      // 2. Bob posts     2
      // 3. Charlie posts 3
      // 4. Dave posts    4
      // 5. Eve posts     6 (wrong)
      // 6. Bot posts something about Eve being wrong
      // 7. Alice posts   1 (including the bot, there are 5 messages in between; excluding the bot there are 4)
      mostRecentMessages.add(message);
      return;
    }

    const validationResult = checkValidity(
      message,
      mostRecentMessages.messages(),
      state.currentNumber,
      config,
    );

    if (validationResult.valid) {
      const highscore = state.increment();
      if (highscore) {
        await Promise.allSettled([
          message.react("🎉"),
          message.react("👏"),
          message.react("🥳"),
        ]);
      }
    } else {
      let errors = validationResult.reasons.map((reason) => {
        let responses = errorMessages[reason.reason];
        if (typeof responses === "function") {
          responses = responses({ ...reason, message });
        }

        return {
          reason: reason.reason,
          response: responses[Math.floor(Math.random() * responses.length)],
        };
      });

      let response =
        errors.length === 1
          ? errors[0].response
          : errors
              .map(
                (e) =>
                  `- _${
                    errorNames[e.reason][
                      Math.floor(Math.random() * errorNames[e.reason].length)
                    ]
                  }_ — ${e.response}`,
              )
              .join("\n");

      if (errors.length > 1) {
        let responses = [
          `Kijk, een foutje maken dat is menselijk. Maar dit? \`${errors.length}\` fouten in één bericht? ${message.author} toch! 😱`,
          `Ik weet niet wat ik hierop moet zeggen. Ik ben sprakeloos. ${message.author} heeft \`${errors.length}\` fouten gemaakt in één bericht. 😶`,
          `Ik probeer hier alles mooi te tellen en te controleren en dan krijg ik dit. \`${errors.length}\` fouten in één bericht. ${message.author} toch! 😭`,
          "Ik word hier niet genoeg voor betaald, hoe kunt ge ook zoveel fouten maken in één bericht?",
          "'T is hier wel warm in de computer, maar toch niet zo warm dat ge zoveel fouten moet maken in één bericht, toch?",
          `Kom eens scheidsrechterke spelen they said, it will be fun they said. En dan komt ge dit tegen.`,
          `Ik heb het al gezegd, ik heb het al gezegd, ik heb het al 1000 keer gezegd. Maar nee, ${message.author} wilt de regeltjes niet lezen. En dan krijgde dit.`,
          `Ge hebt hier gene PhD voor nodig om te zien dat dit niet klopt. ${message.author} toch?`,
          `Hup, weg sfeer. \`${errors.length}\` fouten, ja hallo.`,
          `Dat is hier blijkbaar allemaal normaal. Ik ga naar huis. Tellen jullie maar opnieuw.`,
        ];

        response = `${
          responses[Math.floor(Math.random() * responses.length)]
        }\n\n${response}`;
      }

      let timeDiff =
        state.lastResetAt &&
        differenceInMinutes(message.createdTimestamp, state.lastResetAt) >= 15
          ? formatDistance(message.createdTimestamp, state.lastResetAt, {
              locale: nl,
            })
          : null;

      if (timeDiff) {
        let responses = [
          `Het is al ${timeDiff} geleden dat we nog eens opnieuw moesten beginnen.`,
          `${timeDiff} aan werk voor niets.`,
          `${timeDiff} aan werk in de vuilbak.`,
        ];

        response = `${
          responses[Math.floor(Math.random() * responses.length)]
        } ${response}`;
      }

      if (state.currentNumber === state.best && state.best > 0) {
        response += `\n\nWel een nieuw record 🥳! We zijn tot \`${state.currentNumber}\` geraakt. Applausje voor iedereen! 🎉 (Behalve voor ${message.author})`;
      } else {
        response += `\n\nWe zijn tot \`${state.currentNumber}\` geraakt. Het beste tot nu toe was \`${state.best}\`.`;
      }

      state.reset(message.id);

      await message.react("❌");
      await message.reply(response);
    }

    mostRecentMessages.add(message);
  }

  // Get all messages since the last reset
  let messagesCache = state.lastResetMessageId
    ? new Set(
        (
          await channel.messages.fetch({ after: state.lastResetMessageId })
        ).values(),
      )
    : new Set([]);

  // If we don't have enough messages yet (because we need to guarantee that there are X unique
  // messages in between), fetch more messages (up to the limit)
  if (messagesCache.size < lengthOfMessageCache) {
    // Get the minimum amount of messages to start with
    let additionalMessages = await channel.messages.fetch({
      limit: lengthOfMessageCache - messagesCache.size,
    });

    for (const message of additionalMessages.values()) {
      messagesCache.add(message);
    }
  }

  const mostRecentMessages = new RecentMessages(config.uniqueUsers);

  // Only get the last X messages, and stop early instead of going through _all_ messages since the
  // reset.
  let combinedMessages = Array.from(messagesCache).sort(
    (a, z) => z.position - a.position,
  );

  for (const message of Array.from(combinedMessages.values()).reverse()) {
    mostRecentMessages.add(message);
  }

  // Find current streak
  const streak = findStreak(Array.from(messagesCache.values()), config);
  if (streak.valid) {
    state.currentNumber = streak.number - 1;
  } else {
    state.currentNumber = 0;
  }

  if (streak.message) {
    handleMessage(streak.message);
  }

  console.log("Continuing from streak:", state.currentNumber);

  client.on(Events.MessageUpdate, (_oldMessage, message) => {
    messagesQueue.push(async () => {
      // Ignore messages from other channels
      if (message.channelId !== config.channelId) return;

      // Sometimes messages are updated (when embeds are loaded or removed), but they don't count as
      // "edited".
      if (message.editedTimestamp === null) return;

      // Check if the original message was created in a previous chain. If so, ignore it.
      const createdAt = new Date(message.createdTimestamp);
      if (createdAt < state.lastResetAt) {
        return;
      }

      const responses = errorMessages["message-edited"];
      const response = responses[Math.floor(Math.random() * responses.length)];
      const botMessage = await message.reply(response);
      await message.react("❌");

      state.reset(botMessage.id);
    });
  });

  client.on(Events.MessageCreate, (message) => {
    messagesQueue.push(() => handleMessage(message));
  });

  const commands = [
    {
      name: "override-current",
      description: "Override the current number",
      options: [
        {
          name: "number",
          description: "The number to override to",
          type: 4,
          required: true,
        },
      ],
    },
    {
      name: "override-best",
      description: "Override the best number streak",
      options: [
        {
          name: "best",
          description: "The best number streak to override to",
          type: 4,
          required: true,
        },
      ],
    },
    {
      name: "override-last-reset-message-id",
      description: "Override the last reset message id",
      options: [
        {
          name: "message-id",
          description: "The last reset message id to override to",
          type: 3,
          required: true,
        },
      ],
    },
    {
      name: "print-state",
      description: "Print the state of the Njombers bot",
    },
    {
      name: "version",
      description: "Get the version of the bot",
    },
  ];

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    // Only allow admins to use these commands
    if (!config.adminIds.includes(interaction.user.id)) {
      await interaction.reply("You are not allowed to use this command");
      return;
    }

    // Override number
    if (interaction.commandName === commands[0].name) {
      const number = Number(interaction.options.get("number")?.value);
      if (isNaN(number)) {
        await interaction.reply("Not a number");
        return;
      }
      state.currentNumber = number;
      await interaction.reply(`Number overridden to ${number}`);
    }

    // Override best
    else if (interaction.commandName === commands[1].name) {
      const best = Number(interaction.options.get("best")?.value);
      if (isNaN(best)) {
        await interaction.reply("Not a number");
        return;
      }
      state.best = best;
      await interaction.reply(`Best overridden to ${best}`);
    }

    // Override last reset message id
    else if (interaction.commandName === commands[2].name) {
      const id = interaction.options.get("message-id")?.value ?? null;
      const message = await channel.messages.fetch(id);
      if (!message) {
        await interaction.reply("Message not found");
        return;
      }
      // Fetch all messages since the last reset message
      channel.messages.fetch({
        after: id,
      });
      state.lastResetMessageId = id;
      state.lastResetAt = new Date(message.createdTimestamp);
      await interaction.reply(
        `Last reset message id overridden to ${message.url}`,
      );
    }

    // Print current state
    else if (interaction.commandName === commands[3].name) {
      await interaction.reply(["```json", state.toJSON(), "```"].join("\n"));
    }

    // Version
    else if (interaction.commandName === commands[4].name) {
      await interaction.reply(`Version: ${pkg.version}`);
    }
  });

  await rest.put(Routes.applicationCommands(config.clientId), {
    body: commands,
  });
}

export async function updateState(stateString) {
  const clientUser = client.user;
  if (!clientUser) {
    throw new Error("Client not initialized");
  }
  await clientUser.setActivity(stateString);
}
