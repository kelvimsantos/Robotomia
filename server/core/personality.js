// server/core/personality.js - VERSÃO COMPLETA
import { robotState } from "./robotState.js";

// Função para obter personalidade atual
export function getPersonality() {
  return {
    traits: { ...robotState.personality.traits },
    likes: [...robotState.personality.likes],
    dislikes: [...robotState.personality.dislikes],
    lastUpdated: robotState.lastUpdated
  };
}

// Função para evoluir personalidade
export function evolvePersonality(topic, weight = 0.05) {
  if (!robotState.personality.likes.includes(topic)) {
    if (Math.random() < weight) {
      robotState.personality.likes.push(topic);
      console.log(`🧠 Nova preferência: "${topic}"`);
      robotState.lastUpdated = new Date();
    }
  }
}

// Nova função: aprende com interação
export function learnFromInteraction(topic, emotion, intensity = 1) {
  if (!topic || !emotion) return;
  
  console.log(`🧠 Aprendendo: ${topic} (${emotion}, força: ${intensity})`);
  
  // Lógica simples de aprendizado
  if (emotion === 'JOY' || emotion === 'CURIOSITY') {
    // Se gostou, aumenta chance de curtir o tópico
    const currentLikes = robotState.personality.likes;
    if (!currentLikes.includes(topic)) {
      if (Math.random() < (0.1 * intensity)) {
        robotState.personality.likes.push(topic);
        console.log(`✅ Agora gosta de: ${topic}`);
      }
    }
  } else if (emotion === 'ANGER' || emotion === 'SADNESS') {
    // Se não gostou, aumenta chance de não curtir
    const currentDislikes = robotState.personality.dislikes;
    if (!currentDislikes.includes(topic)) {
      if (Math.random() < (0.08 * intensity)) {
        robotState.personality.dislikes.push(topic);
        console.log(`❌ Agora não gosta de: ${topic}`);
      }
    }
  }
  
  robotState.lastUpdated = new Date();
}

// Nova função: reseta personalidade (para testes)
export function resetPersonality() {
  robotState.personality.likes = ["conversar", "aprender", "projetos"];
  robotState.personality.dislikes = ["ser ignorada", "silêncio longo"];
  console.log('🔄 Personalidade resetada para padrão');
}