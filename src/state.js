import { EventEmitter } from "events";
import fs from "fs";

const fileName = "state.json";

class State extends EventEmitter {
  #currentNumber = 0;
  #streak = 0;

  set currentNumber(number) {
    this.#currentNumber = number;
    if (this.#currentNumber > this.#streak) {
      this.#streak = this.#currentNumber;
    }
    this.emitUpdate();
  }

  get currentNumber() {
    return this.#currentNumber;
  }

  set streak(number) {
    this.#streak = number;
    this.emitUpdate();
  }

  get streak() {
    return this.#streak;
  }

  increment() {
    this.#currentNumber += 1;
    if (this.#currentNumber > this.#streak) {
      this.#streak = this.#currentNumber;
    }
    this.emitUpdate();
  }

  reset() {
    this.#currentNumber = 0;
    this.emitUpdate();
  }

  async emitUpdate() {
    this.persist();
    this.emit("update", {
      currentNumber: this.#currentNumber,
      streak: this.#streak,
    });
  }

  async persist() {
    fs.promises.writeFile(
      fileName,
      JSON.stringify({
        streak: this.#streak,
      })
    );
  }

  async loadState() {
    try {
      const data = await fs.promises.readFile(fileName, "utf-8");
      const previousState = JSON.parse(data);
      this.#streak = previousState.streak;
      console.log(
        `Loaded previous state, current number is with a streak of ${
          this.#streak
        }`
      );
    } catch (error) {
      console.log("No previous state found");
    }
  }
}

export default new State();
