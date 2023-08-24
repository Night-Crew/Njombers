export function checkValidity(message, previousMessages, currentNumber) {
  // - The post must start with the number. Main number cannot be spelt out.
  {
    if (!/^\d/g.test(message.content)) {
      return { valid: false, reason: "no-number" };
    }
  }

  // (Custom rule for readability) — The number cannot start with a zero.
  {
    const match = message.content.match(/^0/);
    if (match) {
      return { valid: false, reason: "leading-zero" };
    }
  }

  // Any other characters must be clearly separated from the main number with a space!
  {
    const match = message.content.match(/^(\d+)([^\s])?/);
    if (match) {
      const [, number, extra] = match;
      if (extra) {
        return {
          valid: false,
          reason: "trailing-character",
          character: extra,
          number,
        };
      }
    }
  }

  // - The wrong number is posted.
  {
    const match = message.content.match(/^(\d+\s)|(^\d+)$/);
    const number = !match ? 0 : Number(match[0]);
    if (currentNumber + 1 !== number) {
      return {
        valid: false,
        reason: "wrong-number",
        expected: currentNumber + 1,
        actual: number,
      };
    }
  }

  // - No foreign languages or posts deemed 'not clear by the other members. The exact number must be clearly visible fully!
  // - You are not allowed to spell out the number by using emojis.

  // - A message is edited/deleted since that chain started.
  // TODO: Implement this

  // - Any person posts with fewer than 5 unique people posting before them. This carries over restarts.
  for (const [idx, previousMessage] of previousMessages.entries()) {
    if (previousMessage.author.id === message.author.id) {
      const messagesInBetween = previousMessages.slice(0, idx).length;
      return {
        valid: false,
        reason: "too-few-unique-people",
        count: messagesInBetween,
      };
    }
  }

  return { valid: true };
}
