// testAlexa.js — envia eventos de skill de Alexa al servidor local y muestra la respuesta.
// Uso:
//   node testAlexa.js                       → intent "ConversarIntent" com slot libre
//   node testAlexa.js help                  → AMAZON.HelpIntent
//   node testAlexa.js stop                  → AMAZON.StopIntent
//   node testAlexa.js wrong                 → applicationId incorrecta (debe dar 403 en prod)
//   BASE_URL=http://127.0.0.1:4123 node testAlexa.js
const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:4123";
const APP_ID = process.env.ALEXA_APPLICATION_ID || "amzn1.ask.skill.demo";

const mode = process.argv[1] || "talk";

function buildEvent(intentName, slots = {}) {
  return {
    version: "1.0",
    session: { sessionId: "test-session", application: { applicationId: APP_ID } },
    context: {
      System: {
        application: { applicationId: APP_ID },
        user: { userId: "test-user" }
      }
    },
    request: {
      type: "IntentRequest",
      requestId: "test-" + Date.now(),
      locale: "es-ES",
      intent: { name: intentName, slots }
    }
  };
}

async function run(payload, label) {
  console.log(`\n== ${label} ==`);
  const res = await fetch(`${BASE_URL}/api/alexa/skill`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  console.log("HTTP", res.status);
  if (data.error) {
    console.log("ERROR:", data.error, "—", data.message || data.error);
  } else {
    console.log("SPEECHLET:", data.response?.outputSpeech?.ssml || "(nada)");
    console.log("endSession:", data.response?.shouldEndSession);
  }
}

try {
  if (mode === "help") {
    await run(buildEvent("AMAZON.HelpIntent"), "HelpIntent");
  } else if (mode === "stop") {
    await run(buildEvent("AMAZON.StopIntent"), "StopIntent");
  } else if (mode === "wrong") {
    const ev = buildEvent("ConversarIntent", {});
    ev.context.System.application.applicationId = "amzn1.ask.skill.hacker";
    await run(ev, "Application ID INCORRECTA (debe fallar con 403)");
  } else {
    await run(
      buildEvent("ConversarIntent", { consulta: { name: "consulta", value: "que te parece el jazz y que recuerdas de musica" } }),
      "ConversarIntent → Brain (Groq + memoria)"
    );
  }
} catch (e) {
  console.error("❌ No se pudo conectar. ¿Está el servidor corriendo en", BASE_URL, "?", e.message);
  process.exit(1);
}