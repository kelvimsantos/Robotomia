import DailyMemory from "./models/DailyMemory.js";

export async function saveDailyMemory(summary) {
  const memory = new DailyMemory({
    date: summary.date,
    moodSummary: summary.mood,
    highlights: summary.highlights,
    personalityChanges: {
      likesAdded: [],
      dislikesAdded: []
    }
  });

  await memory.save();
}

export async function getRecentMemories(limit = 3) {
  return DailyMemory
    .find()
    .sort({ createdAt: -1 })
    .limit(limit);
}