import { describe, test, expect } from "vitest";
import { checkValidity } from "./rules";

describe("valid", () => {
  test("a correct number is valid", () => {
    expect(() => checkValidity({ content: "1" }, [], 0)).not.toThrowError();
  });

  test("a number with a space after it is valid", () => {
    expect(() => checkValidity({ content: "1 " }, [], 0)).not.toThrowError();
  });

  test("a number with a space and a message after it is valid", () => {
    expect(() =>
      checkValidity({ content: "1 a message can go here" }, [], 0),
    ).not.toThrowError();
  });
});

describe("invalid", () => {
  test("a non-number message is invalid", () => {
    expect(() =>
      checkValidity({ content: "something" }, [], 0),
    ).toThrowErrorMatchingInlineSnapshot(
      '"Message does not start with a number."',
    );
  });

  test("a number with leading zeroes is invalid", () => {
    expect(() =>
      checkValidity({ content: "001" }, [], 0),
    ).toThrowErrorMatchingInlineSnapshot(
      '"Message starts with a zero."',
    );
  });

  test("a character before a number is invalid", () => {
    expect(() =>
      checkValidity({ content: " 1" }, [], 0),
    ).toThrowErrorMatchingInlineSnapshot(
      '"Message does not start with a number."',
    );
  });

  test("a non-space character after a number is invalid", () => {
    expect(() =>
      checkValidity({ content: "1?" }, [], 0),
    ).toThrowErrorMatchingInlineSnapshot(
      '"Extra character \\"?\\" found after number \\"1\\"."',
    );
  });

  test("posting the wrong number is invalid", () => {
    expect(() =>
      checkValidity({ content: "2" }, [], 0),
    ).toThrowErrorMatchingInlineSnapshot(
      '"Wrong number, expected \\"1\\" got \\"2\\"."',
    );
  });

  test("posting the same number as the previous number is invalid (double post)", () => {
    expect(() =>
      checkValidity({ content: "2" }, [], 2),
    ).toThrowErrorMatchingInlineSnapshot(
      '"Wrong number, expected \\"3\\" got \\"2\\"."',
    );
  });

  test("posting a number below the current number is invalid", () => {
    expect(() =>
      checkValidity({ content: "1" }, [], 2),
    ).toThrowErrorMatchingInlineSnapshot(
      '"Wrong number, expected \\"3\\" got \\"1\\"."',
    );
  });

  test("posting within 5 messages of your last message is invalid (4)", () => {
    expect(() =>
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
    ).toThrowErrorMatchingInlineSnapshot(
      '"There are only \\"4\\" message(s) between this message and the last message from \\"Alice\\"."',
    );
  });

  test("posting within 5 messages of your last message is invalid (3)", () => {
    expect(() =>
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
    ).toThrowErrorMatchingInlineSnapshot(
      '"There are only \\"3\\" message(s) between this message and the last message from \\"Bob\\"."',
    );
  });

  test("posting within 5 messages of your last message is invalid (2)", () => {
    expect(() =>
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
    ).toThrowErrorMatchingInlineSnapshot(
      '"There are only \\"2\\" message(s) between this message and the last message from \\"Charlie\\"."',
    );
  });

  test("posting within 5 messages of your last message is invalid (1)", () => {
    expect(() =>
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
    ).toThrowErrorMatchingInlineSnapshot(
      '"There are only \\"1\\" message(s) between this message and the last message from \\"Dave\\"."',
    );
  });

  test("posting within 5 messages of your last message is invalid (0)", () => {
    expect(() =>
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
    ).toThrowErrorMatchingInlineSnapshot(
      '"There are only \\"0\\" message(s) between this message and the last message from \\"Erin\\"."',
    );
  });
});
