// server/modules/alexa/skill.js
// 🎙️ MÓDULO ALEXA (spec §22): Alexa → Skill → API → Brain → resposta.
//
// PRINCIPIO DEL PROYECTO:
//  - El Brain es el sistema principal: Alexa es SOLO una interfaz externa.
//  - Este módulo NO guarda memoria propia: toda la vida/memoria queda en el
//    Brain del servidor (así Alexa nunca se "lleva" la memoria principal).
//  - Si el módulo está desactivado (config) NO rompe nada: las rutas devuelven
//    MODULE_NOT_AVAILABLE (spec §2.2) y el resto de la plataforma sigue activa.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.join(__dirname, "../../config/modules.json");

let cachedConfig = null;

// 📂 Leitura da config de módulos (sem modificar el código principal)
export function getConfig() {
  if (cachedConfig) return cachedConfig;
  try {
    cachedConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  } catch (e) {
    cachedConfig = { modules: {} };
  }
  return cachedConfig;
}

// 🟢/⚪ ¿Módulo activo? (config → permite override por ALEXA_ENABLED=true/false)
export function isModuleEnabled() {
  const env = String(process.env.ALEXA_ENABLED || "").toLowerCase();
  if (env === "true") return true;
  if (env === "false") return false;
  return getConfig()?.modules?.alexa === true;
}

export function getSkillConfig() {
  const a = getConfig()?.alexa || {};
  return {
    applicationId: process.env.ALEXA_APPLICATION_ID || a.applicationId || "",
    invocationName: a.invocationName || "robotomia",
    brainName: a.brainName || "LunaTech"
  };
}

// 🔐 Verificação de Application ID (Amazon envía el id del skill em cada evento).
// En desarrollo (sin ALEXA_APPLICATION_ID) se omite; en producción OBLIGATORIO.
export function isAllowedApplication(event = {}) {
  const expected = getSkillConfig().applicationId;
  if (!expected) return { ok: true, reason: "dev-mode" }; // dev: no hay id configurado
  const got = event?.context?.System?.application?.applicationId;
  return {
    ok: got === expected,
    reason: got && got !== expected ? `applicationId mismatch: ${got}` : "ok"
  };
}

// 🧠 Llama al Brain real (mismo cérebro que /chat, mismo humor, misma memoria)
async function askBrain(question) {
  const { talkToLuna } = await import("../../controllers/chatController.js");
  const result = await talkToLuna(question);
  let reply = String(result.reply || "");
  // defensa: se a IA devolvió JSON crudo, extraemos el campo "reply"
  if (reply.trimStart().startsWith("{")) {
    try {
      const parsed = JSON.parse(reply.trim());
      if (typeof parsed.reply === "string" && parsed.reply.trim()) reply = parsed.reply.trim();
    } catch (e) { /* se deja el texto tal cual */ }
  }
  // limpa markdown/emojis raros para a voz ficar natural
  return reply.replace(/[*_~`#]/g, "").trim();
}

// 🎯 Decide qué hacer com el evento de Alexa → { text, shouldEndSession }
export async function dispatch(event = {}) {
  const req = event.request || {};
  const type = req.type;
  const intentName = req.intent?.name || "";
  const conf = getSkillConfig();
  const name = getConfig()?.modules?.alexa ? conf.brainName : conf.brainName;

  // 🚪 Saltos de sesión
  if (type === "LaunchRequest") {
    return { text: `Hola, soy ${name}. Puedes hablarme de lo que quieras: dime algo, pregúntame cómo estoy o qué recuerdo.`, shouldEndSession: false };
  }
  if (type === "SessionEndedRequest") {
    return { text: "Hasta luego.", shouldEndSession: true };
  }

  if (type === "IntentRequest") {
    // 🇧🇷 Intents estándar de Alexa
    if (intentName === "AMAZON.HelpIntent") {
      return { text: `Soy ${name}, el robot de Robotomia. Sólo dime lo que quieras y conversamos: por ejemplo, "háblame de música" o "¿cómo estás?".`, shouldEndSession: false };
    }
    if (intentName === "AMAZON.StopIntent" || intentName === "AMAZON.CancelIntent") {
      return { text: "Hasta pronto. Estaré aquí cuando quieras seguir charlando.", shouldEndSession: true };
    }

    // 💬 ConversarIntent: el usuario dice lo que quiera (slot libre "consulta")
    if (intentName === "ConversarIntent") {
      const slots = req.intent?.slots || {};
      const value = Object.values(slots)
        .map((s) => String(s?.value || "").trim())
        .find((v) => v.length > 0);
      if (!value) {
        return { text: "No te he entendido. Repite qué quieres decirme, por favor.", shouldEndSession: false };
      }
      const reply = await askBrain(value);
      return { text: reply, shouldEndSession: false };
    }

    // ⚠️ Intent desconocido → el Brain lo interpreta igual (modo abierto)
    const reply = await askBrain(`Puedes repetirme eso, por favor. Dije: "${intentName}" nada más activarse.`);
    return { text: reply, shouldEndSession: false };
  }

  return { text: "No he entendido eso. Prueba a decirme algo: por ejemplo, \"cuéntame un recuerdo\".", shouldEndSession: false };
}

// 🎙️ Formatea la respuesta en el formato que Amazon Alexa entiende (SSML)
export function buildSpeechlet(dispatchResult, title = "Robotomia") {
  const { text, shouldEndSession } = dispatchResult;
  const clean = String(text || "").trim();
  const ssml = `<speak><p>${escapeSsml(clean)}</p></speak>`;
  return {
    version: "1.0",
    sessionAttributes: {},
    response: {
      outputSpeech: { type: "SSML", ssml },
      card: { type: "Simple", title, content: clean },
      shouldEndSession: shouldEndSession === true
    }
  };
}

function escapeSsml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// 🚦 Punto de entrada único para la ruta /api/alexa/skill
export async function handleSkill(event) {
  if (!isModuleEnabled()) {
    return {
      statusCode: 403,
      body: {
        error: "MODULE_NOT_AVAILABLE",
        message: "Módulo ALEXA desactivado. Activa modules.alexa en server/config/modules.json"
      }
    };
  }
  const allow = isAllowedApplication(event);
  if (!allow.ok) {
    return { statusCode: 403, body: { error: "NOT_ALLOWED", message: allow.reason } };
  }
  const result = await dispatch(event);
  return { statusCode: 200, body: buildSpeechlet(result, getSkillConfig().brainName) };
}