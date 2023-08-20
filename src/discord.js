// Require the necessary discord.js classes
import { Client, Events, GatewayIntentBits, REST, Routes } from "discord.js";
import { config } from "./config.js";
import { checkValidity } from "./rules.js";
import state from "./state.js";
import { Queue } from "./queue.js";

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
    streakNumber
  );

  client.on(Events.MessageCreate, (message) => {
    messagesQueue.push(async () => {
      // Ignore messages from other channels
      if (message.channelId !== config.channelId) return;
      // Ignore messages from bots
      if (message.author.bot) return;
      console.log("received", message.content, "from", message.author.id);
      try {
        checkValidity(message, lastMessages);
        state.increment();
      } catch (error) {
        state.reset();
        console.warn(error.message);
        await message.react("❌");
        // Post errors in debug channel with a link to the message
        await debugChannel.send(`${error.message} ${message.url}`);
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
