// server/routes/alexa.routes.js
// 🎙️ Rutas del módulo ALEXA:
//   POST /api/alexa/skill  → endpoint HTTPS que Amazon Alexa invoca
//   GET  /api/alexa/status → estado del módulo (debug)
import express from "express";
import { handleSkill, isModuleEnabled, getSkillConfig, getConfig } from "../modules/alexa/skill.js";

const router = express.Router();

router.post("/skill", async (req, res) => {
  try {
    const result = await handleSkill(req.body || {});
    res.status(result.statusCode).json(result.body);
  } catch (err) {
    console.error("💥 ERRO ALEXA SKILL:", err.message);
    res.status(500).json({
      version: "1.0",
      response: {
        outputSpeech: { type: "SSML", ssml: "<speak>Lo siento, tuve un problema interno. Inténtalo de nuevo.</speak>" },
        shouldEndSession: true
      }
    });
  }
});

router.get("/status", (req, res) => {
  const conf = getConfig();
  res.json({
    success: true,
    module: "alexa",
    enabled: isModuleEnabled(),
    applicationId: getSkillConfig().applicationId || "(no configurado — modo dev sin validación)",
    invocationName: getSkillConfig().invocationName,
    modules: conf.modules || {}
  });
});

export default router;