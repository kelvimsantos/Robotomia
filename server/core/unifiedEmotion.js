// NOVO: Integra seus DOIS sistemas emocionais
import { applyEmotionImpact as memoryImpact } from "./memory.js";
import { regulateEmotion, getEmotionState as emotionState } from "./emotion.js";

export class UnifiedEmotionSystem {
  constructor() {
    this.state = {
      base: emotionState(), // Do emotion.js
      lastImpact: null,     // Última reação forte
      recoveryMode: false   // Está se recuperando?
    };
  }
  
  processMessage(text) {
    console.log('🎭 Processando emoção em 2 camadas:');
    
    // CAMADA 1: Reação FORTE e IMEDIATA (seu memory.js)
    const strongReaction = this.checkStrongWords(text);
    if (strongReaction) {
      memoryImpact(text); // Seu sistema de impacto
      this.state.lastImpact = { text, time: Date.now() };
      console.log('⚡ REAÇÃO FORTE detectada');
    }
    
    // CAMADA 2: Regulação NATURAL (seu emotion.js)
    regulateEmotion(); // Seu sistema de regulação
    
    // CAMADA 3: Combina resultados
    return this.combineStates();
  }
  
  checkStrongWords(text) {
    // Lista das palavras que disparam reações fortes
    const strongWords = ['idiota', 'burra', 'lixo', 'porra', 'merda', 'foda-se'];
    return strongWords.some(word => text.toLowerCase().includes(word));
  }
  
  combineStates() {
    // Pega o estado final combinado
    const base = emotionState(); // Do emotion.js
    return {
      ...base,
      lastImpact: this.state.lastImpact,
      recoveryMode: this.state.recoveryMode,
      // Se teve impacto forte recente, marca como "sensível"
      isSensitive: this.state.lastImpact && 
                   (Date.now() - this.state.lastImpact.time < 300000) // 5 min
    };
  }
}