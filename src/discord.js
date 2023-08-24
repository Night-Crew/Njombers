// Require the necessary discord.js classes
import { Client, Events, GatewayIntentBits, REST, Routes } from "discord.js";
import { config } from "./config.js";
import { checkValidity } from "./rules.js";
import state from "./state.js";
import { Queue } from "./queue.js";
import pkg from "../package.json" assert { type: "json" };

let client;

const lenghtOfMessageCache = config.uniqueUsers * 2 + 5;
const discordRestVersion = "10";

let lastMessages = [];

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

  const lastMessagesCollection = await channel.messages.fetch({
    limit: lenghtOfMessageCache,
  });
  lastMessages = Array.from(lastMessagesCollection.values())
    .filter((message) => !message.author.bot)
    .slice(0, config.uniqueUsers);

  for (const message of lastMessages) {
    console.log(message.author.id, message.content);
  }

  // Check if it's a correct streak
  let streakNumber = Number(lastMessages?.[0]?.content) || 0;
  const streakCheckMessages = lastMessages.slice(1).reverse();
  let validStreak = true;
  for (let index = 0; index < streakCheckMessages.length; index++) {
    const message = streakCheckMessages[index];
    try {
      // Check without the current message when checking for unique users
      const lastMessagesCleaned = lastMessages.slice(index, index + 1);
      for (const previousMessage of lastMessagesCleaned) {
        if (previousMessage.author.id === message.author.id) {
          const previousNames = lastMessagesCleaned
            .map((message) => message.author.id)
            .join(", ");
          console.warn("previous IDs", previousNames);
          throw new Error("Too few unique people");
        }
      }
      streakNumber += 1;
    } catch (error) {
      console.warn(error.message);
      validStreak = false;
    }
  }
  if (validStreak) {
    state.currentNumber = streakNumber;
  }
  console.log(
    "Continuing on previous messages where it ended on ",
    streakNumber,
  );

  client.on(Events.MessageCreate, (message) => {
    messagesQueue.push(async () => {
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
        lastMessages.pop();
        lastMessages.unshift(message);

        return;
      }

      let validationResult = checkValidity(
        message,
        lastMessages,
        state.currentNumber,
      );

      if (validationResult.valid) {
        state.increment();
      } else {
        state.reset();
        await message.react("❌");

        let responsesByType = {
          "no-number": [
            "Bericht start niet met een getal. Foei!",
            "Ai, de getallekes waren op vanochtend precies.",
            "Waar is het getal? Ik zie het niet!",
            "Voor mij 100gram prepare alstublieft. Oh, en een getal in uw bericht.",
            `Wist je dat \`${message.content[0]}\` geen getal is? Dus ja, dat is dan fout.`,
          ],
          "leading-zero": [
            "Bericht begint met een `0`. Nie goe!",
            "Nee, nee, nee, een `0` is nie goe!",
            "Een `0`? Vooraan? Ja dat is fout.",
            "Dat is een `0` vooraan. Dat is jammer.",
          ],
          "trailing-character": ({ character, number }) => [
            `Extra karakter \`${character}\` gevonden na het getal \`${number}\`.`,
            `Er staat een \`${character}\` na het getal \`${number}\`. Wat doet dat daar eigenlijk?`,
            `Waarom staat er een \`${character}\` na het getal \`${number}\`?`,
            `Maar wat doet die \`${character}\` daar nu na \`${number}\`?`,
            `Hallo bakker, voor mij \`${number}${character}\` ${
              number === 1 ? "brood" : "broden"
            } alstublieft. Dat verstaat die mens toch niet?`,
          ],
          "wrong-number": ({ expected, actual }) => [
            `Fout getal, ik had een \`${expected}\` verwacht, maar zag een \`${actual}\`. Dat is niet zo goed geteld!`,
            `Oei, ik had een \`${expected}\` verwacht, maar zag een \`${actual}\`.`,
            `Wist je dat na \`${
              expected - 1
            }\` het getalletje \`${expected}\` komt? En dus niet \`${actual}\`.`,
            `Jammer maar helaas pindakaas, ik had een \`${expected}\` verwacht, maar zag een \`${actual}\`.`,
            `Seg vriendschap, \`${
              expected - 1
            } + 1\` is \`${expected}\` en niet \`${actual}\`.`,
          ],
          "too-few-unique-people": ({ count }) => [
            `Oei, er zaten maar \`${count}\` ${
              count === 1 ? "bericht" : "berichten"
            } tussen dit bericht en jouw laatste bericht.`,
            `Hebde gij leren tellen in de zwemschool? Er ${
              count === 1 ? "zit" : "zitten"
            } hier maar \`${count}\` ${
              count === 1 ? "bericht" : "berichten"
            } tussen dit en uw laatste bericht.`,
            `Goed gedaan! Maar wel fout. Helaas. Er ${
              count === 1 ? "zit" : "zitten"
            } maar \`${count}\` ${
              count === 1 ? "bericht" : "berichten"
            } tussen dit en uw laatste bericht.`,
            `NOOOOOOOOOOOOOOOOO! Kijk eens wanneer uw laatste bericht was. Yep, dat was maar \`${count}\` ${
              count === 1 ? "bericht" : "berichten"
            } geleden.`,
          ],
        };

        let responses = responsesByType[validationResult.reason];
        if (typeof responses === "function") {
          responses = responses(validationResult);
        }

        let response = responses[Math.floor(Math.random() * responses.length)];
        await message.reply(response);
      }
      lastMessages.pop();
      lastMessages.unshift(message);
    });
  });

  const commands = [
    {
      name: "overridenumber",
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
      name: "overridebest",
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
      // Version
    } else if (interaction.commandName === commands[2].name) {
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
