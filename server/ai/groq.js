// server/ai/groq.js - CRIE ESTE ARQUIVO
export async function askGroq(prompt) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      throw new Error('Chave Groq não configurada. Adicione GROQ_API_KEY no .env');
    }
    
    console.log('🤖 Groq processando:', prompt.substring(0, 50) + '...');
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Você é LunaTech, um robô amigável e útil. Responda em português de forma natural e um pouco provocativa 😏'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 500
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Groq API error: ${error.error?.message || response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('Resposta vazia da API');
    }
    
    const resposta = data.choices[0].message.content;
    console.log('✅ Resposta Groq:', resposta.substring(0, 100) + '...');
    
    return resposta;
    
  } catch (error) {
    console.error('❌ Erro Groq:', error.message);
    return `Ops, tive um probleminha: ${error.message}`;
  }
}