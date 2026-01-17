// test-gemini.js
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Configurar dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '.env') });

// Importar sua função
import { askGemini } from './server/ai/gemini.js';

async function runTest() {
  console.log('🧪 Testando Gemini API...');
  console.log('==========================');
  
  console.log('🔑 API Key:', process.env.GEMINI_API_KEY ? '***' + process.env.GEMINI_API_KEY.slice(-4) : 'NÃO CONFIGURADA');
  console.log('🌐 API URL:', process.env.GEMINI_API_URL || 'Usando padrão');
  
  try {
    console.log('\n📤 Enviando prompt de teste...');
    const resposta = await askGemini("Olá! Responda apenas com 'CONEXÃO OK!'");
    
    console.log('\n✅ TESTE CONCLUÍDO!');
    console.log('📝 Resposta:', resposta);
    
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
    console.error(error.stack);
  }
}

runTest();