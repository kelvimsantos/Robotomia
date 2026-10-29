// server/memory/persistence.js
// 🗄️ Persistência em MongoDB: guarda e restaura memória e estado do robô.
import InteractionMemory from "./models/InteractionMemory.js";
import RobotState from "./models/RobotStateModel.js";
import ImportantMemory from "./models/ImportantMemory.js";
import ContextMemory from "./models/ContextMemory.js";
import MemoryType from "./models/MemoryType.js";

// ---------- INTERAÇÕES (momentos) ----------

// 💾 Guarda uma interação = "momento" com data
export async function saveInteractionToDb({ user, bot, emotion, mood, topics = [] }) {
  try {
    const doc = await InteractionMemory.create({
      user,
      bot,
      emotion: emotion || "NEUTRAL",
      mood: mood || { happiness: 50, stress: 50, energy: 50 },
      topics,
      important: false
    });
    console.log(`🗄️ Momento guardado no Mongo (#${doc._id})`);
    return doc;
  } catch (error) {
    console.error("❌ Erro ao guardar interação no Mongo:", error.message);
    return null;
  }
}

// 📤 Últimas memórias (as más recentes primeiro)
export async function loadRecentInteractionsFromDb(limit = 20) {
  try {
    return await InteractionMemory.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  } catch (error) {
    console.error("❌ Erro ao carregar memórias do Mongo:", error.message);
    return [];
  }
}

// 📅 Memórias de um dia concreto: ?date=YYYY-MM-DD
export async function loadInteractionsByDate(dateStr, limit = 50) {
  try {
    const start = new Date(`${dateStr}T00:00:00Z`);
    const end = new Date(`${dateStr}T23:59:59Z`);
    return await InteractionMemory.find({ createdAt: { $gte: start, $lte: end } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  } catch (error) {
    console.error("❌ Erro ao buscar memórias por data:", error.message);
    return [];
  }
}

// ⭐ Marca um momento como importante
export async function markInteractionImportant(id) {
  try {
    return await InteractionMemory.findByIdAndUpdate(
      id,
      { $set: { important: true } },
      { new: true }
    );
  } catch (error) {
    console.error("❌ Erro ao marcar momento importante:", error.message);
    return null;
  }
}

// ---------- ESTADO DO ROBÔ (singleton "main") ----------

// 💾 Guarda emoções + personalidade + experiência (+ identidade) atuais
export async function saveRobotStateToDb({ emotionState, personality, experience, identity }) {
  try {
    const $set = { emotionState, personality };
    if (experience) $set.experience = experience;
    if (identity) $set.identity = identity;
    await RobotState.findOneAndUpdate(
      { key: "main" },
      { $set },
      { upsert: true, new: true }
    );
    console.log("🗄️ Estado emocional/personalidade/experiência/identidade guardados no Mongo");
    return true;
  } catch (error) {
    console.error("❌ Erro ao guardar estado no Mongo:", error.message);
    return false;
  }
}

// 📤 Carga o último estado guardado
export async function loadRobotStateFromDb() {
  try {
    return await RobotState.findOne({ key: "main" }).lean();
  } catch (error) {
    console.error("❌ Erro ao carregar estado do Mongo:", error.message);
    return null;
  }
}
// ⭐ Marca um momento como importante E COPIA para a tabela dedicada
// (ImportantMemory) com a data original e o contexto completo.
export async function markAsImportant(id, reason = "manual") {
  try {
    const source = await InteractionMemory.findByIdAndUpdate(
      id,
      { $set: { important: true } },
      { new: true }
    ).lean();
    if (!source) return null;

    const exists = await ImportantMemory.findOne({ sourceId: id });
    if (!exists) {
      await ImportantMemory.create({
        user: source.user,
        bot: source.bot,
        emotion: source.emotion,
        mood: source.mood,
        topics: source.topics || [],
        sourceId: source._id,
        reason,
        createdAt: source.createdAt // preserva a DATA original do momento
      });
      console.log(`⭐ Momento importante (#${id}) copiado para a tabela dedicada`);
    }
    return source;
  } catch (error) {
    console.error("❌ Erro ao marcar momento importante:", error.message);
    return null;
  }
}

// 📤 Lê da TABELA DE MOMENTOS IMPORTANTES (resgatável por data): { limit, date }
export async function loadImportantMemoriesFromDb({ limit = 10, date } = {}) {
  try {
    const filter = {};
    if (date) {
      const start = new Date(`${date}T00:00:00Z`);
      const end = new Date(`${date}T23:59:59Z`);
      filter.createdAt = { $gte: start, $lte: end };
    }
    return await ImportantMemory.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  } catch (error) {
    console.error("❌ Erro ao cargar momentos importantes:", error.message);
    return [];
  }
}

// 📅 MomentoS DESDE una fecha (contexto temporal del banco)
export async function loadInteractionsSince(dateFrom, limit = 10) {
  try {
    return await InteractionMemory.find({ createdAt: { $gte: new Date(dateFrom) } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  } catch (error) {
    console.error("❌ Erro ao cargar momentos desde fecha:", error.message);
    return [];
  }
}

// 🔎 Búsqueda de texto en las memorias (¿te acuerdas de cuando hablamos de X?)
export async function searchInteractions(query, limit = 3) {
  try {
    const rx = new RegExp(String(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    return await InteractionMemory.find({ $or: [{ user: rx }, { bot: rx }] })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  } catch (error) {
    console.error("❌ Erro na búsqueda de memoria:", error.message);
    return [];
  }
}

// ---------- TIPOS DE MEMÓRIA (catálogo) ----------

// 🗂️ Garante que a tabela de TIPOS DE MEMÓRIA exista com os tipos padrão.
// Cada tipo tem nome, descrição, retenção e a data em que foi cadastrado.
export async function seedMemoryTypes() {
  const defaults = [
    { key: "conversation", label: "Conversa", description: "Interações comuns com o usuário", retentionDays: 30, important: false },
    { key: "important", label: "Momento importante", description: "Momentos marcantes com contexto completo e data original", retentionDays: null, important: true },
    { key: "context", label: "Contexto", description: "Resumo do contexto completo por assunto/tag, com data e hora", retentionDays: 90, important: false },
    { key: "summary", label: "Resumo diário", description: "Resumo automático do dia (reflexões)", retentionDays: null, important: false },
    { key: "preference", label: "Preferência", description: "Gostos e aversões aprendidos com o tempo", retentionDays: null, important: false },
    { key: "event", label: "Acontecimento", description: "Eventos e fatos relevantes do ambiente", retentionDays: 180, important: false }
  ];
  try {
    for (const t of defaults) {
      await MemoryType.findOneAndUpdate({ key: t.key }, { $set: t }, { upsert: true, new: true });
    }
    console.log("🗂️ Tipos de memória garantidos no banco");
    return true;
  } catch (error) {
    console.error("❌ Erro ao garantir tipos de memória:", error.message);
    return false;
  }
}

export async function listMemoryTypes() {
  try {
    return await MemoryType.find().sort({ important: -1, createdAt: -1 }).lean();
  } catch (error) {
    console.error("❌ Erro ao listar tipos de memória:", error.message);
    return [];
  }
}

// ---------- MEMÓRIA DE CONTEXTO (resumo completo por tag, com data) ----------

// 🧩 Salva o resumo do CONTEXTO completo de um assunto/tag com a data real.
export async function saveContextMemory({ tag, summary, fullContext = {}, mood = null, date = new Date(), sourceIds = [], important = false }) {
  try {
    if (!tag || !summary) return null;
    const doc = await ContextMemory.create({
      tag: String(tag).toLowerCase().trim().slice(0, 60),
      summary: String(summary).slice(0, 500),
      fullContext,
      mood: mood || { happiness: 50, stress: 50, energy: 50, emotion: "NEUTRAL" },
      date: date || new Date(),
      sourceIds: sourceIds || [],
      important
    });
    console.log(`🧩 Contexto salvo [${tag}] · ${String(summary).substring(0, 50)}...`);
    return doc;
  } catch (error) {
    console.error("❌ Erro ao salvar contexto:", error.message);
    return null;
  }
}

// 📤 Lê os resumos de contexto por tags (mais recentes primeiro)
export async function loadContextMemoriesByTags(tags, limit = 4) {
  try {
    if (!Array.isArray(tags) || tags.length === 0) return [];
    const pattern = tags
      .map((t) => String(t).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");
    return await ContextMemory.find({ tag: { $regex: new RegExp(pattern, "i") } })
      .sort({ date: -1 })
      .limit(limit)
      .lean();
  } catch (error) {
    console.error("❌ Erro ao carregar contextos por tag:", error.message);
    return [];
  }
}

// 📤 Lê o resumo de contexto mais recente de uma tag específica
export async function loadContextMemoryByTag(tag, limit = 3) {
  try {
    if (!tag) return [];
    return await ContextMemory.find({ tag: String(tag).toLowerCase().trim() })
      .sort({ date: -1 })
      .limit(limit)
      .lean();
  } catch (error) {
    console.error("❌ Erro ao carregar contexto por tag:", error.message);
    return [];
  }
}

// ⭐ Busca nas MEMÓRIAS IMPORTANTES por TAG (para descobrir a data real do momento)
export async function loadImportantMemoriesByTags(tags, limit = 4) {
  try {
    if (!Array.isArray(tags) || tags.length === 0) return [];
    const pattern = tags
      .map((t) => String(t).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");
    return await ImportantMemory.find({ topics: { $regex: new RegExp(pattern, "i") } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  } catch (error) {
    console.error("❌ Erro ao buscar importantes por tag:", error.message);
    return [];
  }
}