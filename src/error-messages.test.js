import { describe, test, expect } from "vitest";
import { errorMessages } from "./error-messages";

describe("Error messages", () => {
  for (let [key, messages] of Object.entries(errorMessages)) {
    test(`should produce error messages for ${key}`, () => {
      const contexts = (() => {
        if (key === "no-number") {
          return [{ message: { content: "this is a test message" } }];
        }

        if (key === "leading-zero") {
          return [{ raw: "0123", number: 123 }];
        }

        if (key === "trailing-character") {
          return [
            { character: "?", number: 0 },
            { character: "?", number: 1 },
            { character: "?", number: 2 },
            { character: "?", number: 123 },
          ];
        }

        if (key === "wrong-number") {
          return [
            { expected: 1, actual: 2, message: { author: "Alice" } },
            { expected: 2, actual: 1, message: { author: "Alice" } },
            { expected: 123, actual: 321, message: { author: "Alice" } },
          ];
        }

        if (key === "too-few-unique-people") {
          return [
            { messagesCount: 1, authorsCount: 1 },
            { messagesCount: 2, authorsCount: 1 },
            { messagesCount: 2, authorsCount: 2 },
            { messagesCount: 8, authorsCount: 4 },
          ];
        }

        return [{}];
      })();

      for (let context of contexts) {
        expect(
          typeof messages === "function" ? messages(context) : messages,
        ).toMatchSnapshot();
      }
    });
  }
});
