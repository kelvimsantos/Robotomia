// list-models.js
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '.env') });

async function listModels() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('❌ API Key não configurada no .env');
      return;
    }

    console.log('🔍 Listando modelos disponíveis para sua API Key...');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Erro:', error);
      return;
    }
    
    const data = await response.json();
    
    console.log(`\n✅ ${data.models?.length || 0} modelos encontrados:\n`);
    
    if (data.models && data.models.length > 0) {
      data.models.forEach(model => {
        console.log(`📦 NOME: ${model.name}`);
        console.log(`   Versão: ${model.version}`);
        console.log(`   Display: ${model.displayName}`);
        console.log(`   Descrição: ${model.description}`);
        console.log(`   Suporta generateContent: ${model.supportedGenerationMethods?.includes('generateContent') ? '✅' : '❌'}`);
        console.log('---');
      });
      
      // Mostrar só os que suportam generateContent
      console.log('\n🎯 Modelos que suportam generateContent:');
      const generateContentModels = data.models.filter(m => 
        m.supportedGenerationMethods?.includes('generateContent')
      );
      
      generateContentModels.forEach(model => {
        console.log(`• ${model.name} (${model.displayName})`);
      });
      
    } else {
      console.log('Nenhum modelo encontrado.');
    }
    
  } catch (error) {
    console.error('💥 Erro:', error.message);
  }
}

listModels();