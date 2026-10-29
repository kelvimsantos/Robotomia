// server/memory/models/InteractionMemory.js
// 🧠 Memória de INTERAÇÕES: cada conversa é um "momento" com data.
// Permite recuperar últimas memórias, buscar por data e marcar momentos importantes.
import mongoose from "mongoose";

const InteractionMemorySchema = new mongoose.Schema(
  {
    user: { type: String, required: true },
    bot: { type: String, required: true },
    emotion: { type: String, default: "NEUTRAL" },
    mood: {
      happiness: { type: Number, default: 50 },
      stress: { type: Number, default: 50 },
      energy: { type: Number, default: 50 }
    },
    topics: { type: [String], default: [] },
    important: { type: Boolean, default: false }
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

InteractionMemorySchema.index({ createdAt: -1 });

export default mongoose.model("InteractionMemory", InteractionMemorySchema);