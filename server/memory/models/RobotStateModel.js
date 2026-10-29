// server/memory/models/RobotStateModel.js
// 🧠 ESTADO PERSISTENTE do robô (documento único "main"):
// emoções + personalidad (traits, likes, dislikes, aspiraciones).
import mongoose from "mongoose";

const RobotStateSchema = new mongoose.Schema(
  {
    key: { type: String, default: "main", unique: true, index: true },
    identity: {
      name: { type: String, default: "Luna" },
      creator: { type: String, default: "Você" }
    },
    emotionState: {
      happiness: { type: Number, default: 50 },
      stress: { type: Number, default: 50 },
      energy: { type: Number, default: 50 },
      emotion: { type: String, default: "NEUTRAL" },
      lastUpdated: { type: Date, default: Date.now }
    },
    personality: {
      traits: { type: mongoose.Schema.Types.Mixed, default: {} },
      likes: { type: [String], default: [] },
      dislikes: { type: [String], default: [] },
      aspirations: { type: [String], default: [] },
      knownTopics: {
        type: [{ topic: String, likeness: Number, interactions: Number }],
        default: []
      }
    },
    experience: {
      totalHours: { type: Number, default: 0 },
      interactionsToday: { type: Number, default: 0 }
    }
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "lastStateSavedAt" } }
);

export default mongoose.model("RobotState", RobotStateSchema);