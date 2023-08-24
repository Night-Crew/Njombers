import { EventEmitter } from "events";
import fs from "fs";

const fileName = "state.json";

const highScoreState = {
  // No highscore has been achieved in the current streak
  NO_HIGHSCORE: 0,

  // The first highscore has been achieved in the current streak
  FIRST_HIGHSCORE: 1,

  // All new numbers are highscores
  HIGHSCORES: 2,
};

class State extends EventEmitter {
  #lastResetAt = null;
  #lastResetMessageId = null;

  #currentNumber = 0;
  #best = 0;
  #highScoreState = highScoreState.NO_HIGHSCORE;

  set currentNumber(number) {
    this.#currentNumber = number;
    if (this.#currentNumber > this.#best) {
      this.#best = this.#currentNumber;
    }
    this.emitUpdate();
  }

  get currentNumber() {
    return this.#currentNumber;
  }

  set lastResetAt(value) {
    this.#lastResetAt = value;
    this.persist();
  }

  get lastResetAt() {
    return this.#lastResetAt;
  }

  set lastResetMessageId(value) {
    this.#lastResetMessageId = value;
    this.persist();
  }

  get lastResetMessageId() {
    return this.#lastResetMessageId;
  }

  set best(number) {
    this.#best = number;
    this.emitUpdate();
  }

  get best() {
    return this.#best;
  }

  increment() {
    this.#currentNumber += 1;
    if (this.#currentNumber > this.#best) {
      this.#best = this.#currentNumber;
      if (this.#highScoreState === highScoreState.NO_HIGHSCORE) {
        this.#highScoreState = highScoreState.FIRST_HIGHSCORE;
        return true;
      } else if (this.#highScoreState === highScoreState.FIRST_HIGHSCORE) {
        this.#highScoreState = highScoreState.HIGHSCORES;
      }
    }
    this.emitUpdate();
    return false;
  }

  reset(messageId) {
    this.#lastResetAt = new Date();
    this.#currentNumber = 0;
    this.#lastResetMessageId = messageId;
    this.emitUpdate();
  }

  toJSON() {
    return JSON.stringify(
      {
        currentNumber: this.#currentNumber,
        best: this.#best,
        lastResetAt: this.#lastResetAt,
        lastResetMessageId: this.#lastResetMessageId,
      },
      null,
      2,
    );
  }

  async emitUpdate() {
    this.persist();
    this.emit("update", {
      currentNumber: this.#currentNumber,
      best: this.#best,
    });
  }

  async persist() {
    fs.promises.writeFile(
      fileName,
      JSON.stringify({
        best: this.#best,
        lastResetAt: this.#lastResetAt?.getTime(),
        lastResetMessageId: this.#lastResetMessageId,
      }),
    );
  }

  async loadState() {
    try {
      const data = await fs.promises.readFile(fileName, "utf-8");
      const previousState = JSON.parse(data);
      this.#best = previousState.best ?? 0;
      this.#lastResetAt = previousState.lastResetAt
        ? new Date(previousState.lastResetAt)
        : null;
      this.#lastResetMessageId = previousState.lastResetMessageId ?? null;
      console.log(
        `Loaded previous state, current number is with a record of ${
          this.#best
        }`,
      );
    } catch (error) {
      console.log("No previous state found");
    }
  }
}

export default new State();
