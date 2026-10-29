export const robotState = {
  identity: {
    name: "Luna",
    age: 1, // idade simbólica (dias depois)
    creator: "Você",
  },

  mood: {
    happiness: 70,   // 0 a 100
    stress: 20,      // 0 a 100
    energy: 80,      // 0 a 100
  },

  personality: {
    traits: {
      curious: 0.8,
      friendly: 0.7,
      stubborn: 0.3,
      playful: 0.6,
    },
    likes: ["conversar", "aprender", "projetos"],
    dislikes: ["ser ignorada", "silêncio longo"],
    aspirations: ["aprender", "conectar", "explorar"],
    knownTopics: [], // { topic, likeness (0-100), interactions }
  },

  lastUpdated: new Date(),
  lastActivityAt: new Date(),
};

// 🧠 Restaura personalidade + aspiraciones desde o banco (Mongo)
export function restoreRobotState({ traits, likes, dislikes, aspirations, knownTopics } = {}) {
  if (traits) robotState.personality.traits = traits;
  if (likes) robotState.personality.likes = likes;
  if (dislikes) robotState.personality.dislikes = dislikes;
  if (aspirations) robotState.personality.aspirations = aspirations;
  if (knownTopics) robotState.personality.knownTopics = knownTopics;
  robotState.lastUpdated = new Date();
  console.log("🧠 Personalidade restaurada desde o banco:", robotState.personality);
}

// 🆔 Identidade (nome/persona) — o criador pode escolher quando quiser
export function getIdentity() {
  return { ...robotState.identity, lastUpdated: robotState.lastUpdated };
}

// 🆔 Define um novo nome (e opcionalmente novo criador) para o robô
export function setRobotName(name, creator) {
  const clean = String(name || "").trim();
  if (clean) {
    robotState.identity.name = clean;
    if (creator && String(creator).trim()) robotState.identity.creator = String(creator).trim();
    robotState.lastUpdated = new Date();
    console.log(`🆔 Novo nome definido: ${robotState.identity.name}`);
  }
  return { ...robotState.identity };
}

// 🎯 Devuelve aspiraciones actuales
export function getAspirations() {
  return [...robotState.personality.aspirations];
}

// 📚 Tópicos conhecidos (afinidade + nº de interações)
export function getKnownTopics() {
  return (robotState.personality.knownTopics || []).map(t => ({ ...t }));
}

// 📈 Soma uma interação/comoção a um tópico (base das relações e vontades)
export function bumpKnownTopic(topic, likenessDelta = 0) {
  if (!topic) return null;
  const list = robotState.personality.knownTopics || (robotState.personality.knownTopics = []);
  let found = list.find(t => t.topic === topic);
  if (found) {
    found.likeness = Math.max(0, Math.min(100, Number(found.likeness || 50) + likenessDelta));
    found.interactions = Number(found.interactions || 0) + 1;
  } else {
    found = { topic, likeness: Math.max(0, Math.min(100, 50 + likenessDelta)), interactions: 1 };
    list.push(found);
  }
  robotState.lastUpdated = new Date();
  return { ...found };
}

// ⏱️ Experiência: horas acumuladas + interações de hoje ("horas vividas e pensadas")
const experience = { totalHours: 0, interactionsToday: 0, _day: "" };

export function registerActivity() {
  const now = Date.now();
  const last = robotState.lastActivityAt ? new Date(robotState.lastActivityAt).getTime() : now;
  const elapsedHours = Math.max(0, (now - last) / 3600000);
  experience.totalHours += elapsedHours;

  const today = new Date().toISOString().slice(0, 10);
  if (experience._day !== today) {
    experience._day = today;
    experience.interactionsToday = 0;
  }
  experience.interactionsToday += 1;
  robotState.lastActivityAt = new Date();
  robotState.lastUpdated = new Date();
  return getExperience();
}

export function getExperience() {
  return { totalHours: Math.round(experience.totalHours * 10) / 10, interactionsToday: experience.interactionsToday };
}

export function restoreExperience(saved = {}) {
  if (!saved) return;
  experience.totalHours = Number(saved.totalHours || 0);
  experience.interactionsToday = Number(saved.interactionsToday || 0);
  console.log(`⏱️ Experiência restaurada: ${experience.totalHours}h, ${experience.interactionsToday} hoje`);
}