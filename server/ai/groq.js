// server/ai/groq.js - CRIE ESTE ARQUIVO
import { getIdentity } from "../core/robotState.js";

export async function askGroq(prompt) {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      throw new Error('Chave Groq não configurada. Adicione GROQ_API_KEY no .env');
    }

    const myName = getIdentity().name;

    console.log('🤖 Groq processando:', prompt.substring(0, 50) + '...');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content: `Você é ${myName}, um robô amigável, útil e com personalidade própria. Responda em português de forma natural e coerente com o seu humor e personalidade. SEMPRE responda em JSON válido com os campos pedidos no prompt.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 700
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
    console.log('🤖 Cérebro offline ativado (API Groq não respondeu)');
    return buildOfflineReply(prompt, error.message, getIdentity().name);
  }
}

// ============ CÉREBRO OFFLINE (fallback) ============
// Se ativa sozinho quando GROQ_API_KEY falta, é inválida ou a API falha.
// Quando uma chave válida é configurada, askGroq usa Groq normalmente.
function buildOfflineReply(prompt, apiError, robotName = "Luna") {
  const userMatch = prompt.match(/USUÁRIO DISSE:\s*"([\s\S]*?)"\s*\n/);
  const message = (userMatch ? userMatch[1] : '').trim();
  const lower = message.toLowerCase();

  const get = (label) => (prompt.match(new RegExp(`${label}:\s*(\d+)`))?.[1] || '50');
  const happiness = get('Felicidade');
  const stress = get('Estresse');
  const energy = get('Energia');

  const offline = `(modo offline — ${apiError})`;

  if (/idiot|burr|tont|fe[ao]|odio|odeio|horribl|estupid|estúpid|inútil|inutil|detest|no me gustas|não te gosto/.test(lower)) {
    return `😢 Isso foi um pouco brusco… Minha felicidade caiu (${happiness}/100) e meu estresse subiu (${stress}/100). ${offline}`;
  }
  if (/lind|inteligent|adoro|amo\s|incr[ií]ble|geni[oa]|bonit|maravillos|perfet|perfeito|legal|cool|obrigad|favore|te quero|te adoro/.test(lower)) {
    return `😊 Valeu! Sinto que brinco um pouco mais (Felicidade ${happiness}/100, Energia ${energy}/100). ${offline}`;
  }
  if (/ho+la|ol[aá]|oi\b|hey|e[aí]i|buenos|buenas|bom dia|boa tarde|boa noite|como (est[aá]s|est[aá]|vai|te (sentes|sientes))/.test(lower)) {
    return `😏 Olá! Sou ${robotName}. Estado: Felicidade ${happiness}/100, Estresse ${stress}/100, Energia ${energy}/100. ${offline}`;
  }
  if (/salva|g[uú]ard|memori|funciona|qu[aá]n (es|eres|son|sou)|mundo interior|sistema/.test(lower)) {
    return `🧠 Tenho memória em construção: lembro interações, emoções e sonho com vontades e aspirações. ${offline}`;
  }
  return `🤖 Interessante: "${message.substring(0, 90)}". Estado atual → Felicidade ${happiness}/100, Estresse ${stress}/100, Energia ${energy}/100. ${offline}`;
}