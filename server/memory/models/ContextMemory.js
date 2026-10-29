// server/memory/models/ContextMemory.js
// 🧩 TABELA DE MEMÓRIAS DE CONTEXTO: guarda o RESUMO do contexto completo por
// assunto/tag, sempre com a DATA e o HORÁRIO reais em que o momento aconteceu.
//
// Fluxo de "lembrar de forma humana":
//   1) o usuário fala algo;
//   2) o Brain busca por TAG nas memórias IMPORTANTES para descobrir a data/hora;
//   3) em seguida confere o CONTEXTO COMPLETO resumido salvo AQUI (por tag).
import mongoose from "mongoose";

const ContextMemorySchema = new mongoose.Schema(
  {
    tag: { type: String, required: true, index: true },        // assunto/etiqueta
    summary: { type: String, required: true },                 // resumo do contexto completo
    fullContext: { type: mongoose.Schema.Types.Mixed, default: {} },
    mood: {
      happiness: { type: Number, default: 50 },
      stress: { type: Number, default: 50 },
      energy: { type: Number, default: 50 },
      emotion: { type: String, default: "NEUTRAL" }
    },
    date: { type: Date, default: Date.now },                   // data/hora real do contexto
    sourceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "InteractionMemory" }],
    important: { type: Boolean, default: false }
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

ContextMemorySchema.index({ tag: 1, date: -1 });

export default mongoose.model("ContextMemory", ContextMemorySchema);
