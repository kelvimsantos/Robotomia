// server/core/emotion.js

// Estado emocional em memória (fonte da verdade)
let emotionState = {
  happiness: 50,
  stress: 50,
  energy: 50,
  emotion: "NEUTRAL"
};

// 🎭 Mapa de emoções → impacto
const EMOTION_MAP = {
  JOY:       { happiness: +15, stress: -10, energy: +10 },
  CURIOSITY: { happiness: +5,  stress: -5,  energy: +5  },
  ANGER:     { happiness: -15, stress: +20, energy: -5  },
  SADNESS:   { happiness: -20, stress: +10, energy: -10 },
  SHAME:     { happiness: -10, stress: +15, energy: -5  },
  NEUTRAL:   { happiness: 0,   stress: 0,   energy: 0   }
};

// 🧠 Aplica emoção vinda da IA
export function applyEmotion(emotionName) {
  const impact = EMOTION_MAP[emotionName] || EMOTION_MAP.NEUTRAL;

  emotionState.happiness += impact.happiness;
  emotionState.stress += impact.stress;
  emotionState.energy += impact.energy;
  emotionState.emotion = emotionName;

  clampEmotion();
}

// 💥 Impacto direto do TEXTO DO USUÁRIO
export function applyEmotionImpact(text) {
  const lower = text.toLowerCase();

  if (lower.match(/idiota|burra|lixo|porra|merda|foda-se/)) {
    emotionState.happiness -= 15;
    emotionState.stress += 20;
  }

  if (lower.match(/obrigado|amo|gosto|legal|fofa/)) {
    emotionState.happiness += 15;
    emotionState.stress -= 10;
  }

  clampEmotion();
}

// 🧘 Recuperação natural lenta
export function regulateEmotion() {
  emotionState.stress -= 1;
  emotionState.energy += 0.5;

  clampEmotion();
}

// 📊 Retorna estado atual (UI + backend)
export function getEmotionState() {
  return { ...emotionState };
}

// 🔒 Mantém valores entre 0 e 100
function clampEmotion() {
  emotionState.happiness = Math.max(0, Math.min(100, emotionState.happiness));
  emotionState.stress = Math.max(0, Math.min(100, emotionState.stress));
  emotionState.energy = Math.max(0, Math.min(100, emotionState.energy));
}
