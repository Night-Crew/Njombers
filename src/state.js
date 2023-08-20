import { EventEmitter } from "events";
import fs from "fs";

const fileName = "state.json";

class State extends EventEmitter {
  #currentNumber = 0;
  #best = 0;

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
      best: this.#best,
    });
  }

  async persist() {
    fs.promises.writeFile(
      fileName,
      JSON.stringify({
        best: this.#best,
      }),
    );
  }

  async loadState() {
    try {
      const data = await fs.promises.readFile(fileName, "utf-8");
      const previousState = JSON.parse(data);
      this.#best = previousState.best;
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
