// server/routes/chat.routes.js

import express from "express";
import { buildPrompt } from "../ai/promptBuilder.js";
import { askGemini } from "../ai/gemini.js";
import { addShortTermMemory } from "../memory/shortTerm.js";
import { applyEmotionalImpact } from "../core/decisionEngine.js";

const router = express.Router();

router.post("/chat", async (req, res) => {
  const { message } = req.body;

  // 1️⃣ registra memória curta
  addShortTermMemory({
    type: "conversation",
    content: message,
    emotionalImpact: "neutral"
  });

  // 2️⃣ impacto emocional simples (depois refinamos)
  applyEmotionalImpact({ type: "positive_interaction" });

  // 3️⃣ constrói prompt consciente
  const prompt = await buildPrompt(message);

  // 4️⃣ pergunta pra IA
  const reply = await askGemini(prompt);

  res.json({ reply });
});

export default router;