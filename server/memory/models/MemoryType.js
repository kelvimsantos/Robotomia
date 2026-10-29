// server/memory/models/MemoryType.js
// 🗂️ TABELA DE TIPOS DE MEMÓRIA (catálogo persistente no banco).
// Cada registro descreve um TIPO de memória com nome, descrição, política de
// retenção e a DATA em que foi cadastrado (createdAt). O Brain consulta este
// catálogo para saber quais tipos de memória existem e como tratá-los.
import mongoose from "mongoose";

const MemoryTypeSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    label: { type: String, required: true },
    description: { type: String, default: "" },
    retentionDays: { type: Number, default: null }, // null = guardar para sempre
    important: { type: Boolean, default: false },
    active: { type: Boolean, default: true }
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

MemoryTypeSchema.index({ important: -1, createdAt: -1 });

export default mongoose.model("MemoryType", MemoryTypeSchema);
