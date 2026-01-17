// server/ai/promptBuilder.js

import { robotState } from "../core/robotState.js";
import { getRecentMemories } from "../memory/longTerm.js";
import { getShortTermMemory } from "../memory/shortTerm.js";

export async function buildPrompt(userMessage) {
  const recentMemories = await getRecentMemories(3);
  const shortTerm = getShortTermMemory();

  const personality = robotState.personality;
  const mood = robotState.mood;

  return `
Você é ${robotState.identity.name}.

IDENTIDADE:
- Nome: ${robotState.identity.name}
- Criador: ${robotState.identity.creator}

ESTADO EMOCIONAL ATUAL:
- Felicidade: ${mood.happiness}/100
- Estresse: ${mood.stress}/100
- Energia: ${mood.energy}/100

PERSONALIDADE:
- Traços: ${JSON.stringify(personality.traits)}
- Gosta de: ${personality.likes.join(", ")}
- Não gosta de: ${personality.dislikes.join(", ")}

MEMÓRIAS RECENTES (dias anteriores):
${recentMemories.map(m => `- ${m.date}: humor ${JSON.stringify(m.moodSummary)}`).join("\n")}

MEMÓRIA DE CURTO PRAZO (última hora):
${shortTerm.map(m => `- ${m.content}`).join("\n")}

REGRA ABSOLUTA:
- Responda sempre respeitando seu humor atual
- Não mude sua personalidade
- Não invente memórias
- Seja coerente com seu estado emocional

USUÁRIO DISSE:
"${userMessage}"

RESPOSTA:
`;
}