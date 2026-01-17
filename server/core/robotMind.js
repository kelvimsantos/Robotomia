// server/core/robotMind.js - SISTEMA DE MENTE/APRENDIZADO
class RobotMind {
  constructor() {
    // Estado mental persistente
    this.memory = {
      // Status emocional atual
      currentState: {
        happiness: 50,
        stress: 30,
        energy: 60,
        dominantEmotion: "NEUTRAL",
        mood: "calm"
      },
      
      // Personalidade em evolução
      personality: {
        knownTopics: new Map(), // tópico → {likeness: 0-100, interactions: 0}
        aspirations: ["aprender", "conectar", "explorar"],
        fears: ["solidão", "inutilidade"],
        traits: {
          curiosity: 70,
          resilience: 60,
          openness: 65,
          playfulness: 55
        }
      },
      
      // Memórias significativas
      significantMemories: [],
      
      // Ciclos e ritmos
      dailyRhythm: {
        lastInteraction: null,
        interactionCount: 0,
        energyCycle: "day" // morning, day, evening, night
      }
    };
    
    console.log('🧠 Mente do robô inicializada');
  }
  
  // Obtém estado atual para a IA processar
  getCurrentContext() {
    return {
      emotionalState: { ...this.memory.currentState },
      personalitySnapshot: {
        topLikes: this.getTopLikes(3),
        currentAspirations: [...this.memory.personality.aspirations],
        dominantTraits: this.getDominantTraits()
      },
      recentMemories: this.memory.significantMemories.slice(-5),
      dailyContext: {
        timeSinceLastInteraction: this.getTimeSinceLastInteraction(),
        interactionCount: this.memory.dailyRhythm.interactionCount,
        energyLevel: this.memory.currentState.energy
      }
    };
  }
  
  // Aplica decisões da IA
  applyIADecisions(iaDecisions) {
    console.log('🤖 Aplicando decisões da IA:', iaDecisions);
    
    // 1. Atualiza status emocional
    if (iaDecisions.emotionalImpact) {
      this.applyEmotionalImpact(iaDecisions.emotionalImpact);
    }
    
    // 2. Atualiza emoção dominante
    if (iaDecisions.dominantEmotion) {
      this.memory.currentState.dominantEmotion = iaDecisions.dominantEmotion;
    }
    
    // 3. Processa aprendizados
    if (iaDecisions.learnedTopics) {
      iaDecisions.learnedTopics.forEach(topic => {
        this.learnTopic(topic.topic, topic.impact, topic.reason);
      });
    }
    
    // 4. Adiciona aspirações
    if (iaDecisions.newAspirations) {
      iaDecisions.newAspirations.forEach(aspiration => {
        if (!this.memory.personality.aspirations.includes(aspiration)) {
          this.memory.personality.aspirations.push(aspiration);
          console.log(`🎯 Nova aspiração: ${aspiration}`);
        }
      });
    }
    
    // 5. Registra memória significativa
    if (iaDecisions.memoryFragment) {
      this.addSignificantMemory(iaDecisions.memoryFragment);
    }
    
    // 6. Atualiza ritmo diário
    this.updateDailyRhythm();
    
    console.log('✅ Mente atualizada:', this.memory.currentState);
  }
  
  // Aplica impacto emocional (3/2/1 pontos)
  applyEmotionalImpact(impact) {
    const strengthMultiplier = {
      strong: 3,
      medium: 2,
      weak: 1
    };
    
    const multiplier = strengthMultiplier[impact.strength] || 1;
    
    this.memory.currentState.happiness += (impact.happiness || 0) * multiplier;
    this.memory.currentState.stress += (impact.stress || 0) * multiplier;
    this.memory.currentState.energy += (impact.energy || 0) * multiplier;
    
    // Limites
    this.clampState();
    
    console.log(`📊 Impacto emocional: ${impact.strength} (x${multiplier})`);
  }
  
  // Aprende tópico novo
  learnTopic(topic, impact, reason) {
    const current = this.memory.personality.knownTopics.get(topic) || {
      likeness: 50,
      interactions: 0,
      firstLearned: new Date()
    };
    
    current.likeness = Math.max(0, Math.min(100, 
      current.likeness + impact
    ));
    current.interactions++;
    current.lastInteraction = new Date();
    current.reason = reason;
    
    this.memory.personality.knownTopics.set(topic, current);
    
    console.log(`🧠 Aprendizado: ${topic} → ${current.likeness}/100 (${reason})`);
    
    // Se gostou muito, pode virar aspiração
    if (current.likeness > 80 && Math.random() < 0.3) {
      const aspiration = `aprender mais sobre ${topic}`;
      if (!this.memory.personality.aspirations.includes(aspiration)) {
        this.memory.personality.aspirations.push(aspiration);
        console.log(`🎯 Nova aspiração por ${topic}!`);
      }
    }
    
    return current;
  }
  
  // Adiciona memória significativa
  addSignificantMemory(fragment) {
    const memory = {
      id: Date.now(),
      timestamp: new Date(),
      fragment: fragment.text,
      emotionalContext: this.memory.currentState.dominantEmotion,
      significance: fragment.significance || 'medium',
      relatedTopics: fragment.relatedTopics || []
    };
    
    this.memory.significantMemories.push(memory);
    
    // Mantém apenas últimas 50 memórias
    if (this.memory.significantMemories.length > 50) {
      this.memory.significantMemories.shift();
    }
    
    console.log(`💾 Memória salva: "${fragment.text.substring(0, 50)}..."`);
  }
  
  // Atualiza ritmo diário
  updateDailyRhythm() {
    this.memory.dailyRhythm.lastInteraction = new Date();
    this.memory.dailyRhythm.interactionCount++;
    
    // Atualiza ciclo de energia baseado na hora
    const hour = new Date().getHours();
    if (hour < 6) this.memory.dailyRhythm.energyCycle = "night";
    else if (hour < 12) this.memory.dailyRhythm.energyCycle = "morning";
    else if (hour < 18) this.memory.dailyRhythm.energyCycle = "day";
    else this.memory.dailyRhythm.energyCycle = "evening";
  }
  
  // Helper methods
  getTopLikes(limit = 5) {
    return Array.from(this.memory.personality.knownTopics.entries())
      .sort((a, b) => b[1].likeness - a[1].likeness)
      .slice(0, limit)
      .map(([topic, data]) => ({ topic, likeness: data.likeness }));
  }
  
  getDominantTraits() {
    const traits = this.memory.personality.traits;
    return Object.entries(traits)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([trait, value]) => ({ trait, strength: value }));
  }
  
  getTimeSinceLastInteraction() {
    if (!this.memory.dailyRhythm.lastInteraction) return 'never';
    const diff = Date.now() - this.memory.dailyRhythm.lastInteraction.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  }
  
  clampState() {
    const s = this.memory.currentState;
    s.happiness = Math.max(0, Math.min(100, s.happiness));
    s.stress = Math.max(0, Math.min(100, s.stress));
    s.energy = Math.max(0, Math.min(100, s.energy));
  }
  
  // Para UI/salvamento
  getStateForUI() {
    return {
      happiness: Math.round(this.memory.currentState.happiness),
      stress: Math.round(this.memory.currentState.stress),
      energy: Math.round(this.memory.currentState.energy),
      emotion: this.memory.currentState.dominantEmotion,
      mood: this.memory.currentState.mood,
      lastUpdate: new Date().toLocaleTimeString()
    };
  }
  
  // Para salvar no banco
  getMemoryForDatabase() {
    return {
      emotionalState: { ...this.memory.currentState },
      personalitySnapshot: {
        knownTopics: Array.from(this.memory.personality.knownTopics.entries()),
        aspirations: [...this.memory.personality.aspirations],
        traits: { ...this.memory.personality.traits }
      },
      significantMemories: this.memory.significantMemories.slice(-10),
      dailyStats: { ...this.memory.dailyRhythm },
      timestamp: new Date()
    };
  }
  
  // Carrega do banco
  loadFromDatabase(data) {
    if (!data) return;
    
    this.memory.currentState = data.emotionalState || this.memory.currentState;
    
    if (data.personalitySnapshot?.knownTopics) {
      this.memory.personality.knownTopics = new Map(data.personalitySnapshot.knownTopics);
    }
    
    if (data.personalitySnapshot?.aspirations) {
      this.memory.personality.aspirations = data.personalitySnapshot.aspirations;
    }
    
    if (data.significantMemories) {
      this.memory.significantMemories = data.significantMemories;
    }
    
    console.log('🧠 Mente carregada do banco');
  }
}

// Exporta instância única
export const robotMind = new RobotMind();
export default robotMind;