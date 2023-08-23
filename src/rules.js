export function checkValidity(message, previousMessages, currentNumber) {
  // - The post must start with the number. Main number cannot be spelt out.
  {
    if (!/^\d/g.test(message.content)) {
      throw new Error(
        `Message "${message.content}" does not start with a number.`,
      );
    }
  }

  // Any other characters must be clearly separated from the main number with a space!
  {
    const match = message.content.match(/^(\d+)([^\s])?/);
    if (match) {
      const [, number, extra] = match;
      if (extra) {
        throw new Error(
          `Extra character "${extra}" found after number "${number}".`,
        );
      }
    }
  }

  // - The wrong number is posted.
  {
    const match = message.content.match(/^(\d+\s)|(^\d+)$/);
    const number = !match ? 0 : Number(match[0]);
    if (currentNumber + 1 !== number) {
      throw new Error(
        `Wrong number, expected "${currentNumber + 1}" got "${number}".`,
      );
    }
  }

  // - No foreign languages or posts deemed 'not clear by the other members. The exact number must be clearly visible fully!
  // - You are not allowed to spell out the number by using emojis.

  // - A message is edited/deleted since that chain started.
  // TODO: Implement this

  // - Any person posts with fewer than 5 unique people posting before them. This carries over restarts.
  for (const [idx, previousMessage] of previousMessages.entries()) {
    if (previousMessage.author.id === message.author.id) {
      const previousNames = previousMessages
        .map((message) => message.author.id)
        .join(", ");
      console.warn("previous IDs", previousNames);
      const messagesInBetween = previousMessages.slice(idx + 1).length;
      throw new Error(
        `There are only "${messagesInBetween}" messages between this message and the last message from "${message.author.displayName}".`,
      );
    }
  }
}
