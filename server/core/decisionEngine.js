// server/core/decisionEngine.js
import { robotState } from "./robotState.js";

export function applyEmotionalImpact(event) {
  const { type, intensity = 1 } = event;

  switch (type) {
    case "positive_interaction":
      robotState.mood.happiness += 5 * intensity;
      robotState.mood.stress -= 3 * intensity;
      break;

    case "negative_interaction":
      robotState.mood.happiness -= 6 * intensity;
      robotState.mood.stress += 5 * intensity;
      break;

    case "ignored":
      robotState.mood.happiness -= 4;
      robotState.mood.stress += 6;
      break;
  }

  normalizeMood();
}

function normalizeMood() {
  for (const key in robotState.mood) {
    robotState.mood[key] = Math.max(
      0,
      Math.min(100, robotState.mood[key])
    );
  }

  robotState.lastUpdated = new Date();
}