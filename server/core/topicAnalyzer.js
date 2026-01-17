
// server/core/topicAnalyzer.js
export function extractMainTopic(text) {
  if (!text || typeof text !== 'string') return 'geral';
  
  // Remove pontuação e converte para minúsculas
  const cleanText = text.toLowerCase()
    .replace(/[^\w\sáéíóúãõâêîôûàèìòùç]/g, ' ')
    .trim();
  
  if (!cleanText) return 'geral';
  
  // Divide em palavras
  const words = cleanText.split(/\s+/)
    .filter(w => w.length > 3);
  
  // Palavras comuns em português
  const commonWords = [
    'como', 'qual', 'quem', 'onde', 'porque', 'sobre', 'quando',
    'para', 'isso', 'aquele', 'muito', 'pouco', 'todo', 'tudo',
    'sobre', 'sobre', 'sobre', 'estou', 'está', 'estão', 'estamos',
    'você', 'vocês', 'nosso', 'nossa', 'seus', 'suas', 'minha', 'meu',
    'tem', 'têm', 'tinha', 'ter', 'ser', 'estar', 'ficar', 'fazer',
    'pode', 'deve', 'precisa', 'quer', 'gosta', 'odeia', 'amo', 'adoro'
  ];
  
  // Encontra primeira palavra não-comum
  for (const word of words) {
    if (!commonWords.includes(word)) {
      return word;
    }
  }
  
  // Se todas forem comuns, retorna a mais longa
  if (words.length > 0) {
    return words.reduce((longest, current) => 
      current.length > longest.length ? current : longest
    );
  }
  
  return 'geral';
}

export function extractAllTopics(text, limit = 3) {
  if (!text || typeof text !== 'string') return [];
  
  const cleanText = text.toLowerCase()
    .replace(/[^\w\sáéíóúãõâêîôûàèìòùç]/g, ' ')
    .trim();
  
  const words = cleanText.split(/\s+/)
    .filter(w => w.length > 3);
  
  const commonWords = [
    'como', 'qual', 'quem', 'onde', 'porque', 'sobre', 'quando',
    'para', 'isso', 'aquele', 'muito', 'pouco', 'todo', 'tudo'
  ];
  
  const uniqueTopics = [...new Set(
    words.filter(w => !commonWords.includes(w))
  )];
  
  return uniqueTopics.slice(0, limit);
}

// Nova função: detecta tipo de tópico
export function detectTopicType(text) {
  const lower = text.toLowerCase();
  
  if (lower.includes('tecnologia') || lower.includes('computador') || 
      lower.includes('programação') || lower.includes('código')) {
    return 'tecnologia';
  }
  
  if (lower.includes('música') || lower.includes('cantar') || 
      lower.includes('banda') || lower.includes('som')) {
    return 'música';
  }
  
  if (lower.includes('filme') || lower.includes('série') || 
      lower.includes('cinema') || lower.includes('netflix')) {
    return 'entretenimento';
  }
  
  if (lower.includes('comida') || lower.includes('restaurante') || 
      lower.includes('fome') || lower.includes('comer')) {
    return 'comida';
  }
  
  if (lower.includes('emoção') || lower.includes('sentimento') || 
      lower.includes('triste') || lower.includes('feliz')) {
    return 'emoções';
  }
  
  return 'geral';
}
