// server/controllers/chatController.js - VERSÃO SIMPLIFICADA SEM ORCHESTRATOR
import { askGroq } from "../ai/groq.js";
import { 
  applyEmotion,
  applyEmotionImpact,
  getEmotionState
} from "../core/emotion.js";
import { addInteraction, getRecentInteractions } from "../memory/unifiedMemory.js";

export async function chat(req, res) {
  try {
    const userInput = req.body.message;
    console.log(`💬 Usuário: "${userInput}"`);

    /* =========================
       1️⃣ IMPACTO EMOCIONAL DIRETO
    ========================= */
    console.log('🎭 Aplicando impacto emocional...');
    applyEmotionImpact(userInput);
    
    const emotion = getEmotionState();
    console.log(`📊 Estado:`, emotion);

    /* =========================
       2️⃣ PREPARA DADOS
    ========================= */
    const memory = getRecentInteractions(5);
    
    /* =========================
       3️⃣ PROMPT SIMPLES
    ========================= */
    const prompt = `
Você é LunaTech, um robô com emoções reais.

SEU ESTADO EMOCIONAL AGORA:
- Felicidade: ${emotion.happiness}/100
- Estresse: ${emotion.stress}/100  
- Energia: ${emotion.energy}/100

SUA PERSONALIDADE:
- Você tem reações emocionais fortes
- Se ofendida, fica triste/estressada
- Se elogiada, fica feliz
- Seja natural e coerente com seu estado

HISTÓRICO RECENTE:
${memory.length > 0 ? 
  memory.slice(-3).map(m => `- ${m.bot.substring(0, 60)}...`).join('\n') : 
  'Nenhuma conversa recente'}

USUÁRIO DISSE:
"${userInput}"

SUA RESPOSTA (natural, em português, refletindo seu estado emocional):
`;

    /* =========================
       4️⃣ IA RESPONDE
    ========================= */
    console.log('🤖 Consultando IA...');
    const aiRaw = await askGroq(prompt);
    
    // Processa resposta
    let aiEmotion = "NEUTRAL";
    let aiReply = aiRaw;
    
    try {
      const jsonMatch = aiRaw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        aiEmotion = parsed.emotion || "NEUTRAL";
        aiReply = parsed.reply || aiRaw;
      }
    } catch (e) {
      // Não é JSON, usa resposta direta
    }
    
    console.log(`✅ IA: ${aiEmotion} - "${aiReply.substring(0, 50)}..."`);

    /* =========================
       5️⃣ ATUALIZA EMOÇÃO
    ========================= */
    applyEmotion(aiEmotion);
    
    /* =========================
       6️⃣ SALVA INTERAÇÃO
    ========================= */
    addInteraction(userInput, aiReply, aiEmotion);
    
    /* =========================
       7️⃣ RESPOSTA
    ========================= */
    const updatedEmotion = getEmotionState();
    
    res.json({
      reply: aiReply,
      mood: updatedEmotion
    });
    
    console.log('✅ Chat finalizado. Estado:', updatedEmotion);

  } catch (err) {
    console.error("💥 ERRO CHAT:", err);
    res.status(500).json({
      reply: "💥 Estou sobrecarregada agora… tenta de novo 😣",
      mood: getEmotionState()
    });
  }
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