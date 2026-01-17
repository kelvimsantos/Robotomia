// test-groq-immediate.js
import dotenv from 'dotenv';
dotenv.config();

async function testGroq() {
  console.log('🚀 TESTE IMEDIATO GROQ');
  console.log('=' .repeat(40));
  
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey || apiKey === '') {
    console.log(`
❌ ERRO: Chave Groq não configurada!

PASSO A PASSO:
1. Acesse: https://console.groq.com/
2. Registre com Google (30 segundos)
3. Vá em "API Keys" → "Create API Key"
4. Copie a chave (começa com gsk_)
5. Cole no arquivo .env:



6. Execute novamente: node test-groq-immediate.js
    `);
    return;
  }
  
  console.log('🔑 Chave:', apiKey.substring(0, 10) + '...');
  console.log('📤 Enviando teste...');
  
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ 
          role: 'user', 
          content: 'Responda apenas com a palavra "FUNCIONOU"' 
        }],
        max_tokens: 10
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅✅✅ GROQ FUNCIONANDO PERFEITAMENTE!');
      console.log('Resposta:', data.choices[0].message.content);
      console.log('\n🎉 PRONTO PARA USAR! Agora seu robô vai funcionar!');
    } else {
      console.log('❌ Erro:', data.error?.message || 'Desconhecido');
    }
    
  } catch (error) {
    console.log('💥 Erro de conexão:', error.message);
  }
}

testGroq();