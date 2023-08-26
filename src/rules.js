export function checkValidity(
  message,
  previousMessages,
  currentNumber,
  config,
) {
  let reasons = [];

  // - Any person posts with fewer than 5 unique people posting before them. This carries over restarts.
  {
    let reversedMessages = previousMessages.slice().reverse();
    for (const [idx, previousMessage] of reversedMessages.entries()) {
      if (previousMessage.author.id === message.author.id) {
        const messagesCount = reversedMessages.slice(0, idx).length;
        const authorsCount = new Set(
          reversedMessages.slice(0, idx).map((m) => m.author.id),
        ).size;

        // There enough unique authors in between
        if (authorsCount >= config.uniqueUsers) break;

        reasons.push({
          reason: "too-few-unique-people",
          messagesCount: messagesCount,
          authorsCount: authorsCount,
        });
        break;
      }
    }
  }

  // - The post must start with the number. Main number cannot be spelt out.
  {
    if (!/^\d/g.test(message.content)) {
      reasons.push({ reason: "no-number" });
    }
  }

  // (Custom rule for readability) — The number cannot start with a zero.
  {
    const match = message.content.match(/^0/);
    if (match) {
      reasons.push({ reason: "leading-zero" });
    }
  }

  // Any other characters must be clearly separated from the main number with a space!
  {
    const match = message.content.match(/^(\d+)([^\s])?/);
    if (match) {
      const [, number, extra] = match;
      if (extra) {
        reasons.push({
          reason: "trailing-character",
          character: extra,
          number,
        });
      }
    }
  }

  // - The wrong number is posted.
  {
    const match = message.content.match(/^(\d+\s)|(^\d+)$/);
    if (match) {
      const number = Number(match[0]);
      if (currentNumber + 1 !== number) {
        reasons.push({
          reason: "wrong-number",
          expected: currentNumber + 1,
          actual: number,
        });
      }
    }
  }

  // - No foreign languages or posts deemed 'not clear by the other members. The exact number must be clearly visible fully!
  // - You are not allowed to spell out the number by using emojis.

  // - A message is edited/deleted since that chain started.
  // TODO: Implement this

  return Object.assign(
    { valid: reasons.length === 0 },
    reasons.length > 0
      ? { reasons }
      : { number: Number(message.content.match(/^\d+/)[0]) },
  );
}
