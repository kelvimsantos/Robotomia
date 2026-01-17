// server/core/emotionOrchestrator.js - VERSÃO CORRIGIDA
import { 
  applyEmotionImpact,
  getEmotionState 
} from "./emotion.js";

// NÃO importa regulateEmotion aqui!

class EmotionOrchestrator {
  processInput(userInput) {
    const lowerInput = userInput.toLowerCase();
    
    // Aplica impacto NORMAL
    applyEmotionImpact(userInput);
    
    const emotion = getEmotionState();
    
    // SÓ aplica regulação se NÃO for palavra forte
    const strongWords = ['idiota', 'burra', 'lixo', 'porra', 'merda', 'foda-se'];
    const hasStrongWord = strongWords.some(word => lowerInput.includes(word));
    
    if (!hasStrongWord) {
      // Regulação leve apenas para entradas neutras
      emotion.stress = Math.max(0, emotion.stress - 0.5);
      emotion.energy = Math.min(100, emotion.energy + 0.3);
    }
    
    return {
      systemUsed: 'emotion.js',
      reaction: hasStrongWord ? 'strong' : 'normal',
      finalState: emotion
    };
  }
}