export function findStreak(messages) {
  // No messages yet
  if (messages.length === 0) {
    return { valid: true, number: 0, message: null };
  }

  // Most recent message is from a bot
  if (messages[0].author.bot) {
    return { valid: true, number: 1, message: null };
  }

  // Most recent message is not valid
  const match = messages[0].content.match(/^\d+/);
  if (!match) {
    return { valid: false, reason: "no-number", message: messages[0] };
  }

  // Let's verify the most recent messages
  const potentialStreakNumber = Number(match[0]);
  for (let [idx, message] of messages.entries()) {
    // Once we see a bot message, then we know that we don't care about the messages before it.
    if (message.author.bot) break;

    const expected = potentialStreakNumber - idx - 1;
    if (expected === 0) break; // We started a new chain, we don't care about the messages before it.

    const validationResult = checkValidity(
      message,
      messages.slice(idx),
      expected,
    );

    if (!validationResult.valid) {
      return { ...validationResult, message };
    }
  }

  // All good
  return { valid: true, number: potentialStreakNumber, message: messages[0] };
}

export function checkValidity(message, previousMessages, currentNumber) {
  let reasons = [];

  // - Any person posts with fewer than 5 unique people posting before them. This carries over restarts.
  {
    let reversedMessages = previousMessages.slice().reverse();
    for (const [idx, previousMessage] of reversedMessages.entries()) {
      if (previousMessage.author.id === message.author.id) {
        const messagesInBetween = reversedMessages.slice(0, idx).length;
        reasons.push({
          reason: "too-few-unique-people",
          messagesCount: messagesInBetween,
          authorsCount: new Set(
            reversedMessages.slice(0, idx).map((m) => m.author.id),
          ).size,
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
    const number = !match ? 0 : Number(match[0]);
    if (currentNumber + 1 !== number) {
      reasons.push({
        reason: "wrong-number",
        expected: currentNumber + 1,
        actual: number,
      });
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
