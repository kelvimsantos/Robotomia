// server/core/emotion.js - VERSÃO CORRIGIDA
let emotionState = {
  happiness: 50,
  stress: 50,
  energy: 50,
  emotion: "NEUTRAL",
  lastUpdated: Date.now()
};

// 🎭 Mapa de emoción → impacto (cuando la IA solo da el rótulo)
const EMOTION_MAP = {
  JOY:       { happiness: +15, stress: -10, energy: +8  },
  CURIOSITY: { happiness: +6,  stress: -4,  energy: +4  },
  ANGER:     { happiness: -15, stress: +18, energy: -6  },
  SADNESS:   { happiness: -18, stress: +10, energy: -10 },
  SHAME:     { happiness: -10, stress: +12, energy: -4  },
  NEUTRAL:   { happiness: 0,   stress: 0,   energy: 0   }
};

// ⚙️ CALIBRACIÓN — ajústalo aquí para afinar a LunaTech
const CALIBRATION = {
  // una sola mensaje NO puede mover cada eje más que esto (evita saltos bruscos)
  maxDeltaPerMessage: 30,
  // interação normal: hablar con alguien NO debe estresar; alivia un poquito
  normalInteraction: { happiness: +1.5, stress: 0, energy: -1 },
  // impactos léxicos (texto)
  positiveStrong: { happiness: +18, stress: -12, energy: +6 },
  positiveLight:  { happiness: +8,  stress: -5,  energy: 0 },
  negativeStrong: { happiness: -22, stress: +26, energy: -8 },
  negativeLight:  { happiness: -7,  stress: +12, energy: 0 },
  energizing:     { happiness: 0,   stress: 0,   energy: +6 },
  fatiguing:      { happiness: -4,  stress: +8,  energy: -10 },
  // ⏳ Regulación natural con el TIEMPO (por HORA transcurrida desde la última conversa)
  // Cuanto más tiempo sin hablar: el mal humor se va y la batería sube (hasta su equilibrio)
  perHour: {
    stressDecay: 8,    // el estrés/enojo baja N puntos por hora
    energyRecovery: 6, // la batería sube N por hora
    happinessDrift: 5  // la felicidad se acerca al equilibrio N por hora
  },
  happinessEquilibrium: 55,
  stressEquilibrium: 30,
  energyEquilibrium: 60
};

// 🔍 Léxicos (portugués + español)
const POSITIVE_STRONG = /amo|adoro|adorab|perfeit|maravillos|incr[ií]ble|fant[aá]stic|espetacular|excelente|geni(al|o)|espectacular|extraordinari|te (quiero|quero|adoro)|muy feliz|muito feliz|estoy feliz|estou feliz|e[stáa] feliz|soy feliz|sou feliz|enorme(mente)? fel|eres la mejor|[eé]s a melhor|la mejor|a melhor|esperanza/i;
const POSITIVE_LIGHT = /obrigad|gracias|thank|gosto|legal|cool|fofa|bonit|inteligent|lind|me alegr|me encant|gusta|gust[oó]|me agrada|alegr[aí]|sonr[ieí]|risa|emoci[oó]n|animo|[aá]nimo|entusiasm|optimis|valoro|aprecio|quit[oó]|cari[nñ]o|abrazo|abraç|complice|c[oó]mplice|querid|especial|precioso|genial|crack|me [eé]ncanta|adorab/i;
const NEGATIVE_STRONG = /odio|odeio|idiota|burr[ao]|lixo|porquer[ií]a|merda|foda|cara[llj]o|nojent|horribl|detest|in[úu]til|no te (soport|aguant)|me caes mal|me ca[íi]ste mal|vete|b[aá]sura|despreci|desprez/i;
const NEGATIVE_LIGHT = /chata|chato|ruin|p[eé]sima|entediant|aburrid|fastidi[oó]|molest(?:o|a)|irrit|asco|fe[ao]|feo|tont|desagrad|malo|mal humor|de mal humor|no me gust|n[ãa]o me gust|no me interesa|n[ãa]o me interessa/i;
const ENERGIZING = /piano|m[úu]sica|bailar|baile|fiesta|festa|jugar|jogo|energ[ií]a|deporte|esporte|paseo|passeo|aventura|andar|caminar|correr|ejercicio|exerc[ií]cio|diversi[oó]n|divers[aã]o|risa|risas|re[ií]r|amigo|amiga|familia|festa/i;
const FATIGUING = /cansad|agotad|exhaust|dormir|sue[nñ]o|sono|sin energ|sem energ|pesad[oa]|dif[ií]cil|triste|deprim|sol[eo]|fracas|aburrid/i;

// 🧘 Regulação natural por el tiempo transcurrido (por HORAS sin hablar)
function applyTimeDecay() {
  const now = Date.now();
  const last = emotionState.lastUpdated instanceof Date
    ? emotionState.lastUpdated.getTime()
    : Number(emotionState.lastUpdated || now);
  const hours = Math.max(0, (now - last) / 3600000);
  if (hours < 0.02) return; // menos de ~1 min: no se nota

  const c = CALIBRATION.perHour;
  const eqStress = CALIBRATION.stressEquilibrium;
  const eqEnergy = CALIBRATION.energyEquilibrium;
  const eqHappy = CALIBRATION.happinessEquilibrium;

  // el mal humor se va con las horas → estrés baja hasta el equilibrio
  emotionState.stress = Math.max(eqStress, emotionState.stress - c.stressDecay * hours);
  // la batería sube mientras descansa
  emotionState.energy = Math.min(eqEnergy, emotionState.energy + c.energyRecovery * hours);
  // la felicidad "olvida" la magoa: tiende al equilibrio
  if (emotionState.happiness > eqHappy) {
    emotionState.happiness = Math.max(eqHappy, emotionState.happiness - c.happinessDrift * hours);
  } else {
    emotionState.happiness = Math.min(eqHappy, emotionState.happiness + c.happinessDrift * hours);
  }

  emotionState.lastUpdated = now; // esta regulación ya se descontó
  clampEmotion();
}

// ⏳ Aplica la regulación por tiempo y devuelve el estado (boot y front)
export function regulateByElapsedTime() {
  applyTimeDecay();
  return getEmotionState();
}

// 🔧 Aplica un delta de impacto y hace clamp 0..100
function applyDelta(delta) {
  if (!delta || typeof delta !== "object") return;
  emotionState.happiness += Number(delta.happiness ?? 0);
  emotionState.stress += Number(delta.stress ?? 0);
  emotionState.energy += Number(delta.energy ?? 0);
  emotionState.lastUpdated = Date.now();
  clampEmotion();
}

// 🧠 Aplica emoción vinda da IA (rótulo o mapa de impacto)
export function applyEmotion(emotionName) {
  const name = String(emotionName || "NEUTRAL").toUpperCase();
  console.log(`🎭 Aplicando emoción: ${name}`);

  applyTimeDecay();
  const before = getEmotionState();
  const impact = EMOTION_MAP[name] || EMOTION_MAP.NEUTRAL;

  // nunca borra el rótulo expressivo con NEUTRAL
  if (name !== "NEUTRAL") emotionState.emotion = name;

  applyDelta({ ...impact });
  console.log(`📊 Novo estado: ${JSON.stringify(getEmotionState())}`);
  return { before, after: getEmotionState(), delta: { ...impact } };
}

// 💥 Impacto direto do TEXTO DO USUÁRIO (motor calibrado)
export function applyEmotionImpact(text) {
  if (!text || typeof text !== "string") return null;
  console.log(`📝 Analisando impacto emocional: "${text.substring(0, 50)}..."`);

  applyTimeDecay();
  const before = getEmotionState();
  const lower = text.toLowerCase();
  let delta = { happiness: 0, stress: 0, energy: 0 };

  // 🔴 Negativo
  if (NEGATIVE_STRONG.test(lower)) {
    delta = { ...CALIBRATION.negativeStrong };
    console.log("💥 OFENSA/negative FORTE: impacto NEGATIVO");
  } else if (NEGATIVE_LIGHT.test(lower)) {
    delta = { ...CALIBRATION.negativeLight };
    console.log("😠 Negatividad leve");
  }

  // 🟢 Positivo (acumula com lo negativo si hay mezcla)
  if (POSITIVE_STRONG.test(lower)) {
    delta.happiness += CALIBRATION.positiveStrong.happiness;
    delta.stress += CALIBRATION.positiveStrong.stress;
    delta.energy += CALIBRATION.positiveStrong.energy;
    console.log("💖 ELOGIO FORTE: impacto POSITIVO");
  } else if (POSITIVE_LIGHT.test(lower)) {
    delta.happiness += CALIBRATION.positiveLight.happiness;
    delta.stress += CALIBRATION.positiveLight.stress;
    delta.energy += CALIBRATION.positiveLight.energy;
    console.log("😊 Mensaje positivo leve");
  }

  // ⚡ Energizante / 🪫 Agotador
  if (ENERGIZING.test(lower)) {
    delta.energy += CALIBRATION.energizing.energy;
    console.log("⚡ Mensaje energizante");
  }
  if (FATIGUING.test(lower)) {
    delta.energy += CALIBRATION.fatiguing.energy;
    delta.stress += CALIBRATION.fatiguing.stress;
    delta.happiness += CALIBRATION.fatiguing.happiness;
    console.log("🪫 Mensaje agotador");
  }

  // 🔵 Interação normal: hablar conecta → NO sube estrés; evade un poquito
  const isEmpty = Math.abs(delta.happiness) < 0.01 && Math.abs(delta.stress) < 0.01 && Math.abs(delta.energy) < 0.01;
  if (isEmpty) {
    delta = { ...CALIBRATION.normalInteraction };
    console.log("😐 Interação normal (calibrada: +felicidad, 0 estrés)");
  }

  applyDelta(delta);
  console.log(`📊 Impacto texto: ${JSON.stringify(delta)}`);
  console.log(`📊 Estado após impacto: ${JSON.stringify(getEmotionState())}`);
  return { before, after: getEmotionState(), delta };
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

// 💾 Restaura o estado emocional a partir de un snapshot guardado (Mongo)
export function restoreEmotion(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return;

  emotionState = {
    happiness: Number(snapshot.happiness ?? 50),
    stress: Number(snapshot.stress ?? 50),
    energy: Number(snapshot.energy ?? 50),
    emotion: snapshot.emotion || "NEUTRAL",
    // mantiene la última vez de conversa real para calcular el paso del tiempo
    lastUpdated: snapshot.lastUpdated || Date.now()
  };

  clampEmotion();
  console.log("📂 Estado emocional restaurado desde o banco:", emotionState);
}
// ⚙️ Calibración IA: aplica los deltas que la IA calculó (limitados a ±maxDelta)
export function applyAIDelta(aiDelta) {
  if (!aiDelta || typeof aiDelta !== "object") return;

  applyTimeDecay();
  const before = getEmotionState();
  const cap = CALIBRATION.maxDeltaPerMessage;
  const delta = {
    happiness: Math.max(-cap, Math.min(cap, Number(aiDelta.happiness ?? 0))),
    stress: Math.max(-cap, Math.min(cap, Number(aiDelta.stress ?? 0))),
    energy: Math.max(-cap, Math.min(cap, Number(aiDelta.energy ?? 0)))
  };
  console.log(`⚙️ Calibración IA: ${JSON.stringify(delta)}`);
  applyDelta(delta);
  return { before, after: getEmotionState(), delta };
}

// 🔒 Limite absoluto: ninguna mensaje puede mover cada eje más de maxDelta
export function capMessageDelta(before) {
  if (!before || typeof before !== "object") return;
  const cap = CALIBRATION.maxDeltaPerMessage;
  const clampAxis = (value, ref) =>
    Math.max(0, Math.min(100, ref + Math.max(-cap, Math.min(cap, value - ref))));

  emotionState.happiness = clampAxis(emotionState.happiness, Number(before.happiness ?? 50));
  emotionState.stress = clampAxis(emotionState.stress, Number(before.stress ?? 50));
  emotionState.energy = clampAxis(emotionState.energy, Number(before.energy ?? 50));
  emotionState.lastUpdated = Date.now();
}

// 🏷️ Define el rótulo emocional desde la IA (sin pisar expressivos con NEUTRAL)
export function setEmotionLabel(name) {
  const n = String(name || "NEUTRAL").toUpperCase();
  if (n !== "NEUTRAL") emotionState.emotion = n;
  else if (EMOTION_MAP[emotionState.emotion] === undefined) emotionState.emotion = "NEUTRAL";
  emotionState.lastUpdated = Date.now();
}

// 🔍 Calibración actual (para depurar o ajustar)
export function getCalibration() {
  return JSON.parse(JSON.stringify(CALIBRATION));
}