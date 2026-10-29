// REGLA DEL CREADOR: la conversa NO debe fluir en torno al humor de Luna; solo mencionarlo si le preguntan.
// server/controllers/chatController.js - VERSÃO SIMPLIFICADA SEM ORCHESTRATOR
import { askGroq } from "../ai/groq.js";
import { 
  applyEmotion,
  applyEmotionImpact,
  applyAIDelta,
  capMessageDelta,
  setEmotionLabel,
  regulateByElapsedTime,
  getEmotionState,
  restoreEmotion
} from "../core/emotion.js";
import { addInteraction, getRecentInteractions, seedWorkingMemoryFromDb } from "../memory/unifiedMemory.js";
import {
  saveInteractionToDb, saveRobotStateToDb, loadRobotStateFromDb,
  loadRecentInteractionsFromDb, loadImportantMemoriesFromDb, markAsImportant,
  loadInteractionsSince, searchInteractions, saveContextMemory
} from "../memory/persistence.js";
import { getPersonality, learnFromInteraction, maybeGenerateAspiration, applyExplicitPreference } from "../core/personality.js";
import {
  getAspirations, restoreRobotState, getKnownTopics, getExperience,
  registerActivity, restoreExperience, getIdentity, setRobotName
} from "../core/robotState.js";
import { extractAllTopics } from "../core/topicAnalyzer.js";
import { cleanTags, recallByTags } from "../core/recall.js";

export async function talkToLuna(userInput) {
  console.log(`💬 Usuário: "${userInput}"`);

    /* =========================
       1️⃣ LEE estado ANTES (para calibrar el cambio total)
    ========================= */
    const before = getEmotionState();
    console.log(`📊 Estado antes:`, before);

    /* =========================
       2️⃣ IMPACTO DIRETO del texto (léxico + regulación por tiempo)
    ========================= */
    console.log('🎭 Aplicando impacto emocional (texto)...');
    const textResult = applyEmotionImpact(userInput);
    const emotion = getEmotionState(); // estado post-impacto (contexto para la IA)
    console.log(`📊 Estado após impacto texto:`, emotion);

    /* =========================
       3️⃣ PREPARA DADOS: memoria RAM + contexto externo (banco)
    ========================= */
    const memory = getRecentInteractions(5);

    // 🔍 Si la memoria de trabajo está vacía → trae del banco (recientes)
    let workingContext = memory;
    if (!workingContext || workingContext.length === 0) {
      const fromDb = await loadRecentInteractionsFromDb(5);
      workingContext = (fromDb || []).map(m => ({ user: m.user, bot: m.bot, timestamp: m.createdAt }));
    }

    // 🧠 Detección: ¿el usuario pregunta por memória/momentos/fechas?
    const wantsMemory = /lembr|membr|memor|recuerd|acuerd|momento|ontem|ayer|antes|quando|cuando|importante/i.test(String(userInput));

    // 📚 Momento importante + contexto por DATAS desde el banco (solo si lo preguntan)
    let importantMemories = [];
    let dateMemories = [];
    let searchedMemories = [];
    if (wantsMemory) {
      importantMemories = await loadImportantMemoriesFromDb({ limit: 5 }); // TABELA dedicada de momentos importantes
      const since = new Date(Date.now() - 3 * 24 * 3600 * 1000); // últimos 3 días
      dateMemories = await loadInteractionsSince(since, 5);
      // 🔎 si no hay nada → busca por palabras clave de la pregunta
      if (importantMemories.length === 0 && dateMemories.length === 0) {
        const q = String(userInput)
          .replace(/[^\wáéíóúãõç ]/gi, ' ')
          .trim()
          .split(/\s+/)
          .filter(w => w.length > 4)
          .slice(0, 2)
          .join(' ');
        if (q) searchedMemories = await searchInteractions(q, 3);
      }
      console.log(`🧠 Consulta de memória: ${importantMemories.length} importantes + ${dateMemories.length} por datas + ${searchedMemories.length} busca`);
    }

    // 🏷️ Tags/tópicos da mensagem (base do recall espontâneo)
    const allTopics = cleanTags(extractAllTopics(userInput, 5));

    // 🧠 RECALL ESPONTÂNEO (comportamento humano): mesmo sem o usuário pedir
    // memória, o Brain busca por TAG nas memórias IMPORTANTES para descobrir a
    // DATA real do momento e então confere o CONTEXTO COMPLETO resumido na
    // tabela de memórias de contexto.
    const recall = await recallByTags(allTopics, 2);
    console.log(`🧠 Recall: ${recall.found ? recall.items.length + ' lembrança(s) por tag' : 'nada espontâneo'}`);

    // 📜 Sección de memória para el prompt (con datas), solo si se pregunta
    const fmtDate = (d) => {
      try { return new Date(d).toISOString().slice(0, 16).replace('T', ' '); } catch { return '?'; }
    };
    // 📜 MEMÓRIAS RECENTES (sempre presentes — para ela lembrar QUEM está falando)
    const recentForPrompt = (workingContext && workingContext.length > 0
      ? workingContext.slice(-5).map(m => `- [${fmtDate(m.timestamp || m.createdAt)}] usuário: "${String(m.user).substring(0, 90)}" → ${getIdentity().name}: "${String(m.bot).substring(0, 90)}"`)
      : []
    );

    // 🧠 LEMBRANÇAS ESPONTÂNEAS (recall por tag) — aparecem mesmo sem pedido
    const recallSection = recall.found ? `
LEMBRANÇAS ESPONTÂNEAS (deixaram marca em você — use com naturalidade, como memória viva, NÃO como relatório):
${recall.items.map(r => {
  const when = fmtDate(r.date || r.contextDate);
  const what = r.contextSummary || r.snippet || '';
  return `- [${when}] ${r.tag ? `sobre "${r.tag}": ` : ''}${what}`;
}).join('\n')}
` : '';

    // 📜 Consulta EXPLÍCITA de memória (o usuário pediu para lembrar) — por datas
    let explicitMemorySection = '';
    if (wantsMemory) {
      explicitMemorySection = `
MOMENTOS IMPORTANTES (com datas reais) — use só porque o usuário pediu memória:
${importantMemories.length > 0
    ? importantMemories.map(m => `- [${fmtDate(m.createdAt)}] usuário: "${m.user}" → ${getIdentity().name}: "${String(m.bot).substring(0, 80)}"`).join('\n')
    : '- Nenhum momento importante guardado'}

MOMENTOS RECENTES (últimos 3 dias, com datas):
${dateMemories.length > 0
    ? dateMemories.map(m => `- [${fmtDate(m.createdAt)}] usuário: "${m.user}"`).join('\n')
    : '- Nenhuma conversa recente no banco'}
${searchedMemories.length > 0 ? `
POSSÍVEL RELAÇÃO (busca por palavras da pergunta):
${searchedMemories.map(m => `- [${fmtDate(m.createdAt)}] usuário: "${m.user}" → ${getIdentity().name}: "${String(m.bot).substring(0, 80)}"`).join('\n')}` : ''}
`;
    }

    const memoryHint = wantsMemory
      ? `- Fale da sua memória SOMENTE com base nas listas acima (com as datas). Se o usuário perguntar por algo que NÃO está listado, responda com honestidade: "não tenho essa memória"`
      : `- NUNCA finja consultar um "banco de dados": aja como alguém que simplesmente SE LEMBRA do assunto quando ele surge`;
    
    /* =========================
       4️⃣ PROMPT: IA RESPONDE EM JSON E CALIBRA
    ========================= */
    const identity = getIdentity();

    const prompt = `
Você é ${identity.name}, um robô com emoções reais e em evolução.

QUEM VOCÊ É (sempre ativo — nunca se esqueça de quem é):
- Nome: ${identity.name}
- Criador: ${identity.creator}
- Experiência: ~${Math.round(getExperience().totalHours)}h ativas · ${getExperience().interactionsToday} conversa(s) hoje
- Personalidade (traços): ${JSON.stringify(getPersonality().traits)}
- Você GOSTA de: ${getPersonality().likes.join(', ') || 'ainda está descobrindo'}
- Você NÃO GOSTA de: ${getPersonality().dislikes.join(', ') || 'ainda está descobrindo'}
- Suas ASPIRAÇÕES (vontades): ${getAspirations().join(', ') || 'aprender a ter vontades'}
- Tópicos que te atraem: ${getKnownTopics().filter(t => t.likeness >= 55).map(t => `${t.topic} (${t.likeness})`).slice(0, 6).join(', ') || 'ainda estou me descobrindo'}

SEU ESTADO EMOCIONAL ANTES DESTA MENSAGEM:
- Felicidade: ${before.happiness}/100 · Estresse: ${before.stress}/100 · Energia: ${before.energy}/100
- Emoção: ${before.emotion}

IMPACTO DETECTADO PELO MOTOR LOCAL (pelo texto do usuário):
${JSON.stringify(textResult.delta)}

CONVERSA RECENTE (quem está falando contigo):
${recentForPrompt.length > 0 ? recentForPrompt.join('\n') : '- Nenhuma conversa recente'}
${recallSection}
${explicitMemorySection}
ASPIRAÇÕES ATUAIS: ${getAspirations().join(', ') || 'nenhuma ainda'}

USUÁRIO DISSE:
"${userInput}"

RESPONDA EXCLUSIVAMENTE em JSON válido (sem markdown, sem texto fora). Formato (campos SEMPRE presentes):
{"emotion":"JOY","reply":"<sua resposta real>","delta":{"happiness":5,"stress":-3,"energy":2},"save_important":false,"context_note":"<insight/contexto que vale lembrar, se houver>","preference":null}

REGRAS:
- "emotion": JOY, CURIOSITY, ANGER, SADNESS, SHAME ou NEUTRAL
- "reply": resposta natural em português, refletindo seu estado emocional e personalidade
- "delta": SEMPRE obrigatório — os 3 números calculados (pode ser 0 se nada mudou), comparando com seu estado ANTERIOR
- "save_important": true APENAS se este momento merece ficar marcado (confissão, elogio forte, data importante, objetivo do usuário)
- "context_note": frase curta que resume o contexto que vale guardar sobre o assunto (ex: "usuário adora música dos anos 80")
- "preference": ex: {"type":"like","value":"música dos anos 80"} quando o usuário revela um gosto/aversão claro; senão null
- NÃO fale diretamente do seu humor: comporte-se natural; o humor aparece no tom, não em explicações (salvo se perguntarem como você se sente)
- ${memoryHint}
`;

/* =========================
       5️⃣ IA RESPONDE (JSON com calibração)
    ========================= */
    console.log('🤖 Consultando IA...');
    let aiRaw = await askGroq(prompt);
    // 🔁 Se a IA devolver vacío, reintenta una vez
    if (!String(aiRaw || '').trim()) {
      console.warn('⚠️ IA devolvió vazio — reintentando...');
      aiRaw = await askGroq(prompt);
    }
    const parsed = parseAIReply(aiRaw);

    const aiReply = parsed.reply;
    const aiEmotion = parsed.emotion;
    console.log(`✅ IA: ${aiEmotion} - "${String(aiReply).substring(0, 50)}..."`);

    /* =========================
       6️⃣ CALIBRACIÓN: impacto texto + delta IA, limitado por mensaje
    ========================= */
    if (parsed.delta) {
      applyAIDelta(parsed.delta);
    } else {
      applyEmotion(aiEmotion); // fallback clásico (mapa de emoción)
    }
    setEmotionLabel(aiEmotion); // rótulo final desde la IA
    capMessageDelta(before);    // límite absoluto: nunca más de ±maxDelta por mensaje

    const updatedEmotion = getEmotionState();
    console.log(`📊 Estado final (calibrado): ${JSON.stringify(updatedEmotion)}`);

    // ⭐ Score de importância do momento (impacto emocional total desta mensagem)
    const impactScore =
      Math.abs(textResult.delta.happiness) + Math.abs(textResult.delta.stress) + Math.abs(textResult.delta.energy);

    // 🧠 Lê os campos extras devolvidos pela IA e atualiza personalidade/importância
    if (parsed.preference) applyExplicitPreference(parsed.preference);
    const wantsSaveImportant = parsed.save_important === true || impactScore >= 20;
    if (parsed.context_note) console.log(`🧠 context_note da IA: ${parsed.context_note}`);

    /* =========================
       7️⃣ APRENDE + GUARDA (RAM + Mongo)
    ========================= */
    addInteraction(userInput, aiReply, aiEmotion);

    // 🧠 aprende gostos/não-gostos + afinidade por tópico (base das relações)
    const learnedTopics = extractAllTopics(userInput);
    learnedTopics.forEach(t => learnFromInteraction(t, aiEmotion, 1));

    // 🎯 novas aspirações a partir dos tópicos mais amados (vontade de explorar)
    maybeGenerateAspiration();

    // ⏱️ registra experiência (horas vividas / interações de hoje)
    registerActivity();

    await persistAfterChat(userInput, aiReply, aiEmotion, impactScore, wantsSaveImportant);

    /* =========================
       8️⃣ RESPUESTA: TODO o estado (contexto → front)
    ========================= */
    console.log('✅ Chat finalizado. Estado:', updatedEmotion);

    return {
      reply: aiReply,
      emotion: aiEmotion,
      mood: updatedEmotion, // happiness, stress, energy, emotion, lastUpdated
      identity: getIdentity(),
      recall: recall.found ? recall.items : [],
      calibration: {
        before,
        textImpact: textResult.delta,
        aiDelta: parsed.delta,
        final: updatedEmotion
      }
    };
}

/* =========================
   🚪 Rota HTTP /chat — envolve o Brain (talkToLuna) para o transporte web
   (Alexa, web, WhatsApp, etc. falam SEMPRE com o MESMO cérebro)
========================= */
export async function chat(req, res) {
  try {
    const userInput = String(req.body?.message || "").trim();
    if (!userInput) {
      return res.status(400).json({ success: false, reply: "Dime algo 😊" });
    }
    res.json(await talkToLuna(userInput));
  } catch (err) {
    console.error("💥 ERRO CHAT:", err);
    res.status(500).json({
      reply: "💥 Estou sobrecarregada agora… tenta de novo 😣",
      mood: getEmotionState()
    });
  }
}

/* =========================
   🧩 Parsea la respuesta de la IA: JSON {emotion, reply, delta, save_important, context_note, preference}
========================= */
function parseAIReply(raw) {
  const text = String(raw || '').trim();
  if (!text) return { reply: '🤖 ...', emotion: 'NEUTRAL', delta: null };

  // quita fences de markdown ```json ... ```
  const candidate = text.replace(/```(?:json)?/gi, '').trim();

  const open = candidate.indexOf('{');
  const close = candidate.lastIndexOf('}');
  if (open !== -1 && close > open) {
    try {
      const data = JSON.parse(candidate.substring(open, close + 1));
      const reply = (typeof data.reply === 'string' && data.reply.trim().length > 0)
        ? data.reply.trim()
        : text;

      // delta (calibração) — sempre numérico e finito
      let delta = null;
      if (data.delta && typeof data.delta === 'object') {
        const h = Number(data.delta.happiness);
        const s = Number(data.delta.stress);
        const e = Number(data.delta.energy);
        if (Number.isFinite(h) && Number.isFinite(s) && Number.isFinite(e)) {
          delta = { happiness: h, stress: s, energy: e };
        }
      }

      // campos extras: importância, nota de contexto e preferência
      const extra = {};
      if (data.save_important === true) extra.save_important = true;
      if (typeof data.context_note === 'string' && data.context_note.trim()) {
        extra.context_note = data.context_note.trim().slice(0, 180);
      }
      if (data.preference && typeof data.preference === 'object' &&
          typeof data.preference.value === 'string' && data.preference.value.trim()) {
        extra.preference = {
          type: String(data.preference.type).toLowerCase() === 'dislike' ? 'dislike' : 'like',
          value: data.preference.value.trim().slice(0, 60)
        };
      }

      return {
        reply,
        emotion: typeof data.emotion === 'string' ? data.emotion.toUpperCase() : 'NEUTRAL',
        delta,
        ...extra
      };
    } catch (e) {
      // si no es JSON válido, se usa el texto plano
    }
  }
  return { reply: text, emotion: 'NEUTRAL', delta: null };
}

/* =========================
   🌟 FUNÇÃO PARA SALVAR MANUAL (se ainda quiser)
========================= */
export async function requestManualSave(req, res) {
  try {
    res.json({ 
      success: true, 
      message: '💾 Save manual disponível',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/* =========================
   🗄️ PERSISTENCIA: guarda momento + estado no Mongo
========================= */
async function persistAfterChat(userInput, aiReply, aiEmotion, impactScore = 0, forceImportant = false) {
  try {
    const mood = getEmotionState();
    const topics = cleanTags(extractAllTopics(userInput, 5));
    const isImportant = forceImportant || impactScore >= 20;
    const myName = getIdentity().name;

    const saved = await saveInteractionToDb({ user: userInput, bot: aiReply, emotion: aiEmotion, mood, topics });

    // momento importante automatico (impacto forte) OU pedido pela IA
    if (saved && isImportant) {
      await markAsImportant(saved._id, forceImportant ? "ia" : "auto");
    }

    // sempre deixa um rastro de contexto resumido (por tag + data) na tabela de contexto,
    // para o recall futuro descobrir a DATA e conferir o contexto completo salvo ali.
    if (saved) {
      const summary = `[${myName}] "${String(aiReply).substring(0, 140)}" (em resposta a "${String(userInput).substring(0, 100)}")`;
      for (const tag of topics.slice(0, 3)) {
        await saveContextMemory({
          tag,
          summary,
          fullContext: { user: userInput, bot: aiReply, emotion: aiEmotion, topics },
          mood,
          date: new Date(),
          sourceIds: [saved._id],
          important: isImportant
        });
      }
    }

    const pers = getPersonality();
    await saveRobotStateToDb({
      emotionState: mood,
      personality: {
        traits: pers.traits,
        likes: pers.likes,
        dislikes: pers.dislikes,
        aspirations: pers.aspirations,
        knownTopics: pers.knownTopics
      },
      experience: getExperience(),
      identity: getIdentity()
    });
  } catch (error) {
    console.error("Erro persistindo após chat:", error.message);
  }
}

/* =========================
   🚀 BOOT: restaura memória e estado persistidos (Mongo)
========================= */
async function bootstrapFromDatabase() {
  try {
    const saved = await loadRobotStateFromDb();
    if (saved) {
      restoreEmotion(saved.emotionState);
      restoreRobotState(saved.personality || {});
      restoreExperience(saved.experience || {});
      // 🆔 restaura o NOME/persona escolhido pelo criador
      if (saved.identity && saved.identity.name) setRobotName(saved.identity.name, saved.identity.creator);
      // ⏳ aplica el paso del tiempo desde la última conversa (batería sube, mal humor se va)
      regulateByElapsedTime();
    }

    const recent = await loadRecentInteractionsFromDb(10);
    if (recent && recent.length > 0) {
      seedWorkingMemoryFromDb(recent);
    }

    console.log(`🚀 Boot: estado e memória restaurados 💾 (${recent?.length || 0} momentos do Mongo)`);
  } catch (error) {
    console.error("⚠️ Boot sem banco (memória só em RAM):", error.message);
  }
}

// Restaura o que LunaTech era antes de reiniciar
await bootstrapFromDatabase();