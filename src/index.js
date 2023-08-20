import state from "./state.js";
import { initClient, updateState } from "./discord.js";

await state.loadState();

async function newNumber({ currentNumber, streak }) {
  const stateString = `Current: ${currentNumber} Streak: ${streak}`;
  updateState(stateString);
}

await initClient();
newNumber({ currentNumber: state.currentNumber, streak: state.streak });

state.on("update", newNumber);
