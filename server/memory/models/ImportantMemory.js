// server/memory/models/ImportantMemory.js
// ⭐ TABELA DEDICADA DE MOMENTOS IMPORTANTES (separada das interações comuns).
// Guarda o CONTEXTO COMPLETO: o que foi dito, a resposta, humor, tópicos,
// com a DATA ORIGINAL do momento — para LunaTech "resgatar" por data/contexto.
import mongoose from "mongoose";

const ImportantMemorySchema = new mongoose.Schema(
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
    sourceId: { type: mongoose.Schema.Types.ObjectId }, // registro original em interactionmemories
    reason: { type: String, default: "auto" },          // manual | auto
    createdAt: { type: Date, default: Date.now }        // DATA original do momento
  },
  { timestamps: { createdAt: "recordedAt", updatedAt: false } }
);

ImportantMemorySchema.index({ createdAt: -1 });
ImportantMemorySchema.index({ topics: 1 });

export default mongoose.model("ImportantMemory", ImportantMemorySchema);