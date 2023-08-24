import { describe, test, expect } from "vitest";
import { checkValidity } from "./rules";

describe("valid", () => {
  test("a correct number is valid", () => {
    expect(checkValidity({ content: "1" }, [], 0)).toMatchInlineSnapshot(
      `
      {
        "valid": true,
      }
    `,
    );
  });

  test("a number with a space after it is valid", () => {
    expect(checkValidity({ content: "1 " }, [], 0)).toMatchInlineSnapshot(
      `
      {
        "valid": true,
      }
    `,
    );
  });

  test("a number with a space and a message after it is valid", () => {
    expect(
      checkValidity({ content: "1 a message can go here" }, [], 0),
    ).toMatchInlineSnapshot(`
      {
        "valid": true,
      }
    `);
  });
});

describe("invalid", () => {
  test("a non-number message is invalid", () => {
    expect(
      checkValidity({ content: "something" }, [], 0),
    ).toMatchInlineSnapshot(`
      {
        "reason": "no-number",
        "valid": false,
      }
    `);
  });

  test("a number with leading zeroes is invalid", () => {
    expect(checkValidity({ content: "001" }, [], 0)).toMatchInlineSnapshot(
      `
      {
        "reason": "leading-zero",
        "valid": false,
      }
    `,
    );
  });

  test("a character before a number is invalid", () => {
    expect(checkValidity({ content: " 1" }, [], 0)).toMatchInlineSnapshot(
      `
      {
        "reason": "no-number",
        "valid": false,
      }
    `,
    );
  });

  test("a non-space character after a number is invalid", () => {
    expect(checkValidity({ content: "1?" }, [], 0)).toMatchInlineSnapshot(
      `
      {
        "character": "?",
        "number": "1",
        "reason": "trailing-character",
        "valid": false,
      }
    `,
    );
  });

  test("posting the wrong number is invalid", () => {
    expect(checkValidity({ content: "2" }, [], 0)).toMatchInlineSnapshot(
      `
      {
        "actual": 2,
        "expected": 1,
        "reason": "wrong-number",
        "valid": false,
      }
    `,
    );
  });

  test("posting the same number as the previous number is invalid (double post)", () => {
    expect(checkValidity({ content: "2" }, [], 2)).toMatchInlineSnapshot(
      `
      {
        "actual": 2,
        "expected": 3,
        "reason": "wrong-number",
        "valid": false,
      }
    `,
    );
  });

  test("posting a number below the current number is invalid", () => {
    expect(checkValidity({ content: "1" }, [], 2)).toMatchInlineSnapshot(
      `
      {
        "actual": 1,
        "expected": 3,
        "reason": "wrong-number",
        "valid": false,
      }
    `,
    );
  });

  test("posting within 5 messages of your last message is invalid (4)", () => {
    expect(
      checkValidity(
        { content: "6", author: { id: "alice", displayName: "Alice" } },
        [
          { content: "5", author: { id: "erin", displayName: "Erin" } },
          { content: "4", author: { id: "dave", displayName: "Dave" } },
          { content: "3", author: { id: "charlie", displayName: "Charlie" } },
          { content: "2", author: { id: "bob", displayName: "Bob" } },
          { content: "1", author: { id: "alice", displayName: "Alice" } },
        ],
        5,
      ),
    ).toMatchInlineSnapshot(`
      {
        "count": 4,
        "reason": "too-few-unique-people",
        "valid": false,
      }
    `);
  });

  test("posting within 5 messages of your last message is invalid (3)", () => {
    expect(
      checkValidity(
        { content: "6", author: { id: "bob", displayName: "Bob" } },
        [
          { content: "5", author: { id: "erin", displayName: "Erin" } },
          { content: "4", author: { id: "dave", displayName: "Dave" } },
          { content: "3", author: { id: "charlie", displayName: "Charlie" } },
          { content: "2", author: { id: "bob", displayName: "Bob" } },
          { content: "1", author: { id: "alice", displayName: "Alice" } },
        ],
        5,
      ),
    ).toMatchInlineSnapshot(`
      {
        "count": 3,
        "reason": "too-few-unique-people",
        "valid": false,
      }
    `);
  });

  test("posting within 5 messages of your last message is invalid (2)", () => {
    expect(
      checkValidity(
        { content: "6", author: { id: "charlie", displayName: "Charlie" } },
        [
          { content: "5", author: { id: "erin", displayName: "Erin" } },
          { content: "4", author: { id: "dave", displayName: "Dave" } },
          { content: "3", author: { id: "charlie", displayName: "Charlie" } },
          { content: "2", author: { id: "bob", displayName: "Bob" } },
          { content: "1", author: { id: "alice", displayName: "Alice" } },
        ],
        5,
      ),
    ).toMatchInlineSnapshot(`
      {
        "count": 2,
        "reason": "too-few-unique-people",
        "valid": false,
      }
    `);
  });

  test("posting within 5 messages of your last message is invalid (1)", () => {
    expect(
      checkValidity(
        { content: "6", author: { id: "dave", displayName: "Dave" } },
        [
          { content: "5", author: { id: "erin", displayName: "Erin" } },
          { content: "4", author: { id: "dave", displayName: "Dave" } },
          { content: "3", author: { id: "charlie", displayName: "Charlie" } },
          { content: "2", author: { id: "bob", displayName: "Bob" } },
          { content: "1", author: { id: "alice", displayName: "Alice" } },
        ],
        5,
      ),
    ).toMatchInlineSnapshot(`
      {
        "count": 1,
        "reason": "too-few-unique-people",
        "valid": false,
      }
    `);
  });

  test("posting within 5 messages of your last message is invalid (0)", () => {
    expect(
      checkValidity(
        { content: "6", author: { id: "erin", displayName: "Erin" } },
        [
          { content: "5", author: { id: "erin", displayName: "Erin" } },
          { content: "4", author: { id: "dave", displayName: "Dave" } },
          { content: "3", author: { id: "charlie", displayName: "Charlie" } },
          { content: "2", author: { id: "bob", displayName: "Bob" } },
          { content: "1", author: { id: "alice", displayName: "Alice" } },
        ],
        5,
      ),
    ).toMatchInlineSnapshot(`
      {
        "count": 0,
        "reason": "too-few-unique-people",
        "valid": false,
      }
    `);
  });
});
