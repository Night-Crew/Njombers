import state from "./state.js";

export function checkValidity(message, previousMessages, currentNumber) {
  const number = parseMessage(message);

  if (currentNumber === 0 && number !== 1) {
    throw new Error("First message must be 1");
  }

  // - The wrong number is posted.
  // - No foreign languages or posts deemed 'not clear by the other members. The exact number must be clearly visible fully!
  // - The post must start with the number. Main number cannot be spelt out.
  // - Any other characters must be clearly separated from the main number with a space!
  // - You are not allowed to spell out the number by using emojis.

  // - A message is edited/deleted since that chain started.
  // TODO: Implement this

  // - Any person posts with fewer than 5 unique people posting before them. This carries over restarts.
  for (const previousMessage of previousMessages) {
    if (previousMessage.author.id === message.author.id) {
      const previousNames = previousMessages
        .map((message) => message.author.id)
        .join(", ");
      console.warn("previous IDs", previousNames);
      throw new Error("Too few unique people");
    }
  }
}

function parseMessage(message) {
  const match = message.content.match(/^(\d+\s)|(^\d+)$/);
  if (!match) return 0;
  return Number(match[0]);
}
