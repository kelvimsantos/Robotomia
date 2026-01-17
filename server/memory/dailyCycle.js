// server/memory/dailyCycle.js
import { getShortTermMemory, clearShortTermMemory } from "./shortTerm.js";
import { robotState } from "../core/robotState.js";

export function closeDay() {
  const memories = getShortTermMemory();

  const summary = {
    date: new Date().toDateString(),
    mood: { ...robotState.mood },
    highlights: memories.slice(0, 5),
  };

  clearShortTermMemory();

  return summary; // depois isso vai pro banco
}