
// server/core/episodicMemory.js - MEMÓRIA EPISÓDICA COMPLETA

class EpisodicMemory {
  constructor() {
    console.log('🧠 EpisodicMemory inicializada');
    
    // Estado inicial
    this.temporaryMemories = [];
    this.currentState = {
      emotional: { happiness: 50, stress: 30, energy: 60 },
      mood: "NEUTRAL",
      environment: "normal"
    };
  }
  
  // Métodos básicos para começar
  createMemory(userInput, iaDecisions, robotReply) {
    const memory = {
      timestamp: new Date(),
      userInput,
      robotReply,
      emotionalState: { ...this.currentState.emotional },
      mood: this.currentState.mood
    };
    
    this.temporaryMemories.push(memory);
    console.log(`💾 Memória criada: ${this.temporaryMemories.length} no total`);
    
    // Atualiza estado atual baseado nas decisões da IA
    if (iaDecisions.emotionalImpact) {
      this.updateEmotionalState(iaDecisions.emotionalImpact);
    }
    
    return memory;
  }
  
  updateEmotionalState(impact) {
    const multiplier = { strong: 3, medium: 2, weak: 1 }[impact.strength] || 1;
    
    this.currentState.emotional.happiness += (impact.happiness || 0) * multiplier;
    this.currentState.emotional.stress += (impact.stress || 0) * multiplier;
    this.currentState.emotional.energy += (impact.energy || 0) * multiplier;
    
    // Limites
    this.currentState.emotional.happiness = Math.max(0, Math.min(100, this.currentState.emotional.happiness));
    this.currentState.emotional.stress = Math.max(0, Math.min(100, this.currentState.emotional.stress));
    this.currentState.emotional.energy = Math.max(0, Math.min(100, this.currentState.emotional.energy));
    
    // Atualiza humor baseado na felicidade
    if (this.currentState.emotional.happiness > 70) this.currentState.mood = "JOY";
    else if (this.currentState.emotional.happiness < 30) this.currentState.mood = "SADNESS";
    else if (this.currentState.emotional.stress > 70) this.currentState.mood = "STRESSED";
    else this.currentState.mood = "NEUTRAL";
  }
  
  getCurrentStateForUI() {
    return {
      happiness: Math.round(this.currentState.emotional.happiness),
      stress: Math.round(this.currentState.emotional.stress),
      energy: Math.round(this.currentState.emotional.energy),
      mood: this.currentState.mood,
      environment: this.currentState.environment,
      memoryCount: this.temporaryMemories.length
    };
  }
  
  createDailySummary() {
    return {
      date: new Date().toISOString().slice(0, 10),
      totalMemories: this.temporaryMemories.length,
      emotionalState: { ...this.currentState.emotional },
      mood: this.currentState.mood
    };
  }
  
  clearTemporaryMemories() {
    const count = this.temporaryMemories.length;
    this.temporaryMemories = [];
    return count;
  }
  
  loadFromDatabase(data) {
    if (data && data.emotionalState) {
      this.currentState.emotional = data.emotionalState;
      console.log('🧠 Estado carregado do banco');
    }
  }
}

// 🌟 EXPORT CORRETO:
export const episodicMemory = new EpisodicMemory();
export default episodicMemory;
