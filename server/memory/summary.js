import DailyMemory from "./models/DailyMemory.js";
import { getWorkingMemory, clearWorkingMemory } from "./workingMemory.js";

let lastSummary = Date.now();

export async function saveDailySummaryIfNeeded() {
  const oneHour = 60 * 60 * 1000;

  if (Date.now() - lastSummary < oneHour) return;

  const traces = getWorkingMemory();
  if (traces.length === 0) return;

  await DailyMemory.findOneAndUpdate(
    { date: new Date().toISOString().slice(0, 10) },
    {
      $push: {
        highlights: {
          type: "summary",
          content: `Resumo automático: ${traces.length} interações relevantes`,
          emotionalImpact: "neutral"
        }
      }
    },
    { upsert: true }
  );

  clearWorkingMemory();
  lastSummary = Date.now();
}
