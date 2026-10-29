// server/core/personality.js - VERSÃO COMPLETA (aprendizado real)
import { robotState, bumpKnownTopic, getKnownTopics } from "./robotState.js";

// Função para obter personalidade atual (traços + gostos + aspirações + conhecimento)
export function getPersonality() {
  return {
    traits: { ...robotState.personality.traits },
    likes: [...robotState.personality.likes],
    dislikes: [...robotState.personality.dislikes],
    aspirations: [...robotState.personality.aspirations],
    knownTopics: getKnownTopics(),
    lastUpdated: robotState.lastUpdated
  };
}

// 🧠 Aprende de verdade com a interação: tópico + emoção → gosto/não-gosto + afinidade
export function learnFromInteraction(topic, emotion, intensity = 1) {
  if (!topic || !emotion) return;
  const e = String(emotion).toUpperCase();
  const positive = e === "JOY" || e === "CURIOSITY";
  const negative = e === "ANGER" || e === "SADNESS" || e === "SHAME";

  console.log(`🧠 Aprendendo: ${topic} (${e}, força ${intensity})`);

  // afinidade determinística no tópico (base das relações)
  const likeDelta = positive ? 8 * intensity : negative ? -10 * intensity : 1 * intensity;
  bumpKnownTopic(topic, likeDelta);

  if (positive && !robotState.personality.likes.includes(topic)) {
    robotState.personality.likes.push(topic);
    robotState.personality.likes = robotState.personality.likes.slice(-12);
    console.log(`✅ LunaTech agora GOSTA de: ${topic}`);
  }
  if (negative && !robotState.personality.dislikes.includes(topic)) {
    robotState.personality.dislikes.push(topic);
    robotState.personality.dislikes = robotState.personality.dislikes.slice(-12);
    console.log(`❌ LunaTech agora NÃO gosta de: ${topic}`);
  }

  robotState.lastUpdated = new Date();
}

// 💥 Preferência explícita devolvida pela IA (ex: usuário revela que ama algo)
export function applyExplicitPreference({ type, value } = {}) {
  if (!value || typeof value !== "string") return null;
  const v = value.trim().toLowerCase();
  if (!v) return null;
  const t = String(type || "").toLowerCase();

  if (t === "dislike") {
    if (!robotState.personality.dislikes.includes(v)) {
      robotState.personality.dislikes.push(v);
      robotState.personality.dislikes = robotState.personality.dislikes.slice(-12);
      console.log(`💥 Preferência registrada (não gosta): ${v}`);
    }
    bumpKnownTopic(v, -8);
    robotState.lastUpdated = new Date();
    return { type: "dislike", value: v };
  }

  // like (padrão): vira um gosto + afinidade
  if (!robotState.personality.likes.includes(v)) {
    robotState.personality.likes.push(v);
    robotState.personality.likes = robotState.personality.likes.slice(-12);
    console.log(`💥 Preferência registrada (gosta): ${v}`);
  }
  bumpKnownTopic(v, 8);
  robotState.lastUpdated = new Date();
  return { type: "like", value: v };
}

// 🎯 Gera novas aspirações a partir do que mais gosta (tópico com afinidade alta =
// vontade de explorar mais sobre ele)
export function maybeGenerateAspiration() {
  const aspirations = robotState.personality.aspirations;
  const candidates = getKnownTopics().filter(t => t.likeness >= 60 && t.interactions >= 2);

  candidates.forEach(t => {
    const idea = `explorar mais sobre ${t.topic}`;
    if (!aspirations.includes(idea)) {
      aspirations.push(idea);
      console.log(`🎯 Nova aspiração gerada: ${idea}`);
    }
  });

  if (aspirations.length > 12) {
    robotState.personality.aspirations = aspirations.slice(-12);
  }
  robotState.lastUpdated = new Date();
}