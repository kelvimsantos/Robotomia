// server/ai/gemini.js - VERSÃO SIMPLIFICADA QUE FUNCIONA
export async function askGemini(prompt) {
  // Esta função agora usa Groq diretamente
  try {
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      return '❌ Configure GROQ_API_KEY no arquivo .env (obtenha em console.groq.com)';
    }
    
    console.log('📨 Recebido:', prompt.substring(0, 50) + '...');
    
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
            content: 'Você é LunaTech, um robô amigável, útil e um pouco provocativo 😏. Responda em português BR.'
          },
          {
            role: 'user', 
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 800
      })
    });
    
    const data = await response.json();
    
    if (data.choices && data.choices[0]) {
      const resposta = data.choices[0].message.content;
      console.log(`🤖 Resposta: ${resposta.substring(0, 100)}...`);
      return resposta;
    } else {
      console.error('❌ Resposta inválida:', data);
      return 'Ops, algo deu errado aqui 😣';
    }
    
  } catch (error) {
    console.error('💥 Erro:', error.message);
    return `Erro técnico: ${error.message}. Verifique sua conexão.`;
  }
}