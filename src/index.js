import state from "./state.js";
import { initClient, updateState } from "./discord.js";

await state.loadState();

async function newNumber({ currentNumber, best }) {
  const stateString = `Current: ${currentNumber} Best: ${best}`;
  updateState(stateString);
}

await initClient();
newNumber({ currentNumber: state.currentNumber, best: state.best });

state.on("update", newNumber);
