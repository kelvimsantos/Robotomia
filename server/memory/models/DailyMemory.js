import mongoose from "mongoose";

const HighlightSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  emotionalImpact: {
    type: String,
    default: "neutral"
  }
}, { _id: false });

const DailyMemorySchema = new mongoose.Schema({
  date: {
    type: String,
    required: true
  },

  moodSummary: {
    happiness: { type: Number, default: 0 },
    stress: { type: Number, default: 0 },
    energy: { type: Number, default: 0 },
  },

  highlights: [HighlightSchema],

  personalityChanges: {
    likesAdded: { type: [String], default: [] },
    dislikesAdded: { type: [String], default: [] },
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("DailyMemory", DailyMemorySchema);
