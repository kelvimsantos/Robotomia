// server/core/emotion.js - VERSÃO CORRIGIDA
let emotionState = {
  happiness: 50,
  stress: 50,
  energy: 50,
  emotion: "NEUTRAL",
  lastUpdated: Date.now()
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
  console.log(`🎭 Aplicando emoção: ${emotionName}`);
  
  const impact = EMOTION_MAP[emotionName] || EMOTION_MAP.NEUTRAL;
  
  emotionState.happiness += impact.happiness;
  emotionState.stress += impact.stress;
  emotionState.energy += impact.energy;
  emotionState.emotion = emotionName;
  emotionState.lastUpdated = Date.now();
  
  clampEmotion();
  
  console.log(`📊 Novo estado:`, emotionState);
}

// 💥 Impacto direto do TEXTO DO USUÁRIO (VERSÃO MELHORADA)
export function applyEmotionImpact(text) {
  if (!text || typeof text !== 'string') return;
  
  console.log(`📝 Analisando impacto emocional: "${text.substring(0, 50)}..."`);
  
  const lower = text.toLowerCase();
  let changed = false;
  
  // 🔴 OFENSAS FORTES (impacto NEGATIVO grande)
  if (lower.match(/idiota|burra|lixo|porra|merda|foda-se|caralho|odeio|nojenta|horrível/)) {
    emotionState.happiness -= 25; // MAIS impacto!
    emotionState.stress += 30;    // MAIS estresse!
    emotionState.energy -= 10;    // Perde energia
    changed = true;
    console.log('💥 OFENSA DETECTADA: Impacto NEGATIVO FORTE');
  }
  
  // 🔴 OFENSAS LEVES
  else if (lower.match(/chata|chato|ruim|pessima|entediante/)) {
    emotionState.happiness -= 10;
    emotionState.stress += 15;
    changed = true;
    console.log('😠 Ofensa leve detectada');
  }
  
  // 🟢 ELOGIOS FORTES
  if (lower.match(/amo|adoro|perfeita|maravilhosa|incrível|fantástica|espetacular/)) {
    emotionState.happiness += 20; // MAIS impacto positivo!
    emotionState.stress -= 15;
    emotionState.energy += 10;
    changed = true;
    console.log('💖 ELOGIO FORTE: Impacto POSITIVO');
  }
  
  // 🟢 ELOGIOS LEVES  
  else if (lower.match(/obrigado|obrigada|gosto|legal|fofa|bonita|inteligente/)) {
    emotionState.happiness += 10;
    emotionState.stress -= 8;
    changed = true;
    console.log('😊 Elogio leve detectado');
  }
  
  // 🔵 PERGUNTAS/INTERAÇÕES NORMAIS (pequeno impacto)
  if (!changed && text.length > 3) {
    emotionState.energy -= 1; // Gasta um pouquinho de energia
    emotionState.stress += 0.5; // Leve estresse por interação
    console.log('😐 Interação normal');
  }
  
  emotionState.lastUpdated = Date.now();
  clampEmotion();
  
  console.log(`📊 Estado após impacto:`, emotionState);
}

// 🧘 Recuperação natural lenta (SÓ CHAMAR MANUALMENTE ou por timer)
export function regulateEmotion() {
  console.log('🌙 Regulação natural...');
  
  // Recuperação MUITO LENTA
  emotionState.stress = Math.max(0, emotionState.stress - 0.2);
  emotionState.energy = Math.min(100, emotionState.energy + 0.1);
  
  // Felicidade tende ao neutro (50) BEM devagar
  if (emotionState.happiness < 50) {
    emotionState.happiness += 0.1;
  } else if (emotionState.happiness > 50) {
    emotionState.happiness -= 0.1;
  }
  
  emotionState.lastUpdated = Date.now();
  clampEmotion();
  
  console.log(`📊 Após regulação:`, emotionState);
}

// 📊 Retorna estado atual
export function getEmotionState() {
  return { ...emotionState };
}

// 💾 Carrega do banco
export function loadEmotionFromDB(data) {
  if (!data) return;
  
  emotionState = {
    happiness: data.moodSummary?.happiness ?? 50,
    stress: data.moodSummary?.stress ?? 50,
    energy: data.moodSummary?.energy ?? 50,
    emotion: "NEUTRAL",
    lastUpdated: Date.now()
  };
  
  console.log('📂 Emoções carregadas do DB:', emotionState);
}

// 🔒 Mantém valores entre 0 e 100
function clampEmotion() {
  emotionState.happiness = Math.max(0, Math.min(100, emotionState.happiness));
  emotionState.stress = Math.max(0, Math.min(100, emotionState.stress));
  emotionState.energy = Math.max(0, Math.min(100, emotionState.energy));
}

// 🌟 NOVO: Estado para UI
export function getEmotionForUI() {
  return {
    happiness: Math.round(emotionState.happiness),
    stress: Math.round(emotionState.stress),
    energy: Math.round(emotionState.energy),
    emotion: emotionState.emotion,
    lastUpdate: new Date(emotionState.lastUpdated).toLocaleTimeString()
  };
}