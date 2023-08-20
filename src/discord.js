// Require the necessary discord.js classes
import { Client, Events, GatewayIntentBits, REST, Routes } from "discord.js";
import { config } from "./config.js";
import { checkValidity } from "./rules.js";
import state from "./state.js";

let client;

const lenghtOfMessageCache = config.uniqueUsers * 2 + 5;
const discordRestVersion = "10";

let lastMessages = [];

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
      checkValidity(
        message,
        lastMessages.slice(index, index + 1),
        streakNumber
      );
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

  client.on(Events.MessageCreate, async (message) => {
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
      name: "overridestreak",
      description: "Override the number streak",
      options: [
        {
          name: "streak",
          description: "The streak to override to",
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
    // Override streak
    else if (interaction.commandName === commands[1].name) {
      const streak = Number(interaction.options.get("streak")?.value);
      if (isNaN(streak)) {
        await interaction.reply("Not a number");
        return;
      }
      state.streak = streak;
      await interaction.reply(`Streak overridden to ${streak}`);
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
