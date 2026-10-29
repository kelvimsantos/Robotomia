// server/memory/unifiedMemory.js - SISTEMA DE MEMÓRIA UNIFICADA
import DailyMemory from "./models/DailyMemory.js";
import { getEmotionState } from "../core/emotion.js";
import { getPersonality } from "../core/personality.js";

// Memória de trabalho (últimas interações)
let workingMemory = [];
const MAX_WORKING_MEMORY = 20;

// ============ FUNÇÕES PRINCIPAIS ============
export function addInteraction(userInput, botResponse, emotion) {
  const interaction = {
    timestamp: new Date(),
    user: userInput,
    bot: botResponse,
    emotion: emotion,
    moodSnapshot: getEmotionState()
  };
  
  // Adiciona à memória de trabalho
  workingMemory.push(interaction);
  
  // Mantém limite
  if (workingMemory.length > MAX_WORKING_MEMORY) {
    workingMemory.shift();
  }
  
  console.log(`💾 Memória: ${workingMemory.length}/${MAX_WORKING_MEMORY} interações`);
  return interaction;
}

export function getRecentInteractions(limit = 10) {
  return workingMemory.slice(-limit);
}

// 🧠 Restaura a memória de trabalho desde o Mongo (últimas interações)
export function seedWorkingMemoryFromDb(interactions) {
  if (!Array.isArray(interactions) || interactions.length === 0) return;

  workingMemory = interactions
    .slice(-MAX_WORKING_MEMORY)
    .reverse() // do mais antigo ao mais recente
    .map((i) => ({
      timestamp: i.createdAt ? new Date(i.createdAt) : new Date(),
      user: i.user,
      bot: i.bot,
      emotion: i.emotion || "NEUTRAL",
      moodSnapshot: {
        happiness: i.mood?.happiness ?? 50,
        stress: i.mood?.stress ?? 50,
        energy: i.mood?.energy ?? 50
      }
    }));

  console.log(`🧠 Memoria de trabalho restaurada: ${workingMemory.length} interações`);
}

export function clearWorkingMemory() {
  workingMemory = [];
  console.log('🧹 Memória de trabalho limpa');
}

export function getAllInteractions() {
  return [...workingMemory];
}

// ============ RESUMO DIÁRIO ============
export async function saveDailySummary() {
  const today = new Date().toISOString().slice(0, 10);
  const emotion = getEmotionState();
  const personality = getPersonality();
  
  // Filtra interações de hoje
  const todaysInteractions = workingMemory.filter(i => 
    new Date(i.timestamp).toISOString().slice(0, 10) === today
  );
  
  // Extrai destaques
  const highlights = todaysInteractions
    .slice(-10) // Últimas 10 do dia
    .map(i => ({
      type: 'interaction',
      content: `${i.user.substring(0, 50)}... → ${i.emotion}`,
      emotionalImpact: i.emotion,
      timestamp: i.timestamp
    }));
  
  // Calcula humor médio do dia
  const avgMood = calculateAverageMood(todaysInteractions);
  
  // Salva no banco
  const dailyMemory = new DailyMemory({
    date: today,
    moodSummary: {
      happiness: avgMood.happiness || emotion.happiness,
      energy: avgMood.energy || emotion.energy,
      stress: avgMood.stress || emotion.stress
    },
    highlights: highlights,
    personalityChanges: {
      likesAdded: [],
      dislikesAdded: []
    },
    metadata: {
      interactionCount: todaysInteractions.length,
      firstInteraction: todaysInteractions[0]?.timestamp,
      lastInteraction: todaysInteractions[todaysInteractions.length - 1]?.timestamp
    }
  });
  
  try {
    await dailyMemory.save();
    console.log(`📅 Resumo diário salvo: ${todaysInteractions.length} interações`);
    
    // Limpa apenas as interações de hoje (opcional)
    // workingMemory = workingMemory.filter(i => 
    //   new Date(i.timestamp).toISOString().slice(0, 10) !== today
    // );
    
    return dailyMemory;
  } catch (error) {
    console.error('❌ Erro ao salvar resumo:', error);
    return null;
  }
}

// ============ FUNÇÕES AUXILIARES ============
function calculateAverageMood(interactions) {
  if (!interactions || interactions.length === 0) {
    return { happiness: 50, energy: 50, stress: 50 };
  }
  
  const sum = interactions.reduce((acc, i) => {
    const mood = i.moodSnapshot;
    return {
      happiness: acc.happiness + (mood?.happiness || 50),
      energy: acc.energy + (mood?.energy || 50),
      stress: acc.stress + (mood?.stress || 50)
    };
  }, { happiness: 0, energy: 0, stress: 0 });
  
  const count = interactions.length;
  return {
    happiness: Math.round(sum.happiness / count),
    energy: Math.round(sum.energy / count),
    stress: Math.round(sum.stress / count)
  };
}

export async function getMemoriesByEmotion(emotion, limit = 5) {
  try {
    const memories = await DailyMemory.find({
      'highlights.emotionalImpact': emotion
    }).limit(limit);
    
    return memories;
  } catch (error) {
    console.error('❌ Erro ao buscar memórias por emoção:', error);
    return [];
  }
}

export async function getMemoryByDate(date) {
  try {
    return await DailyMemory.findOne({ date });
  } catch (error) {
    console.error('❌ Erro ao buscar memória por data:', error);
    return null;
  }
}

export async function getRecentMemories(limit = 5) {
  try {
    return await DailyMemory.find()
      .sort({ createdAt: -1 })
      .limit(limit);
  } catch (error) {
    console.error('❌ Erro ao buscar memórias recentes:', error);
    return [];
  }
}

// Função de compatibilidade (para promptBuilder.js)
export function getWorkingMemory() {
  return getRecentInteractions(20);
}