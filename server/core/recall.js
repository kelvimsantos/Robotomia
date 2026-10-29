// server/core/recall.js
// 🧠 RECALL ESPONTÂNEO (comportamento humano): quando o usuário NÃO está
// perguntando explicitamente por memória, o Brain ainda procura por TAG nas
// memórias IMPORTANTES para descobrir a DATA/HORA reais do momento e, então,
// confere o CONTEXTO COMPLETO resumido salvo na tabela de memórias de contexto.
import {
  loadImportantMemoriesByTags,
  loadContextMemoriesByTags
} from "../memory/persistence.js";

const STOPWORDS = new Set([
  "para", "porque", "quando", "sobre", "coisa", "quem", "como", "onde",
  "você", "vocês", "estou", "está", "estão", "estamos", "minha", "minhas",
  "meu", "meus", "nossa", "nosso", "muito", "pouco", "tudo", "todo", "essa",
  "esse", "isso", "saber", "fazer", "gosta", "quer", "pode", "deve",
  "precisa", "também", "ainda", "agora", "depois", "então", "mas", "geral",
  "lembra", "lembro", "lembrar", "memória", "memorias", "memoria", "conta",
  "fala", "dizer", "sendo", "estava", "estiver", "temos", "teria", "ficar",
  "lembrabas", "lembras", "falamos", "falam", "hablamos", "recuerdas", "recuerdan"
]);

// 🔎 Limpa e normaliza as tags extraídas do texto (remove ruído/stopwords)
export function cleanTags(tags) {
  if (!Array.isArray(tags)) return [];
  return [...new Set(
    (tags || [])
      .map((t) => String(t || "").toLowerCase().trim())
      .filter((t) => t.length > 3 && !STOPWORDS.has(t))
  )].slice(0, 4);
}

// 🧠 Recupera lembranças relacionadas às tags da mensagem:
//   - busca memórias IMPORTANTES por tag → pega a DATA real do momento;
//   - para cada uma, traz o resumo do CONTEXTO completo (tabela de contexto);
//   - se nada importante, faz um "recall suave" direto da tabela de contexto.
export async function recallByTags(tags, limit = 2) {
  try {
    const clean = cleanTags(tags);
    if (clean.length === 0) return { found: false, items: [] };

    const important = await loadImportantMemoriesByTags(clean, 4);
    const contextHits = await loadContextMemoriesByTags(clean, 4);

    const items = [];

    // Para cada memória importante encontrada, usa a data do momento e o
    // contexto resumido correspondente (se existir).
    for (const imp of important) {
      const tag = clean.find((t) => (imp.topics || []).some((p) => String(p).toLowerCase() === t)) || clean[0];
      const ctx = contextHits.find((c) => String(c.tag).toLowerCase() === String(tag).toLowerCase())
        || contextHits.find((c) => clean.includes(String(c.tag).toLowerCase()));
      items.push({
        tag,
        fromImportant: true,
        date: imp.createdAt || imp.recordedAt || null,
        snippet: `${String(imp.user || "").substring(0, 90)} → ${String(imp.bot || "").substring(0, 90)}`,
        contextSummary: ctx ? ctx.summary : null,
        contextDate: ctx ? ctx.date : null
      });
    }

    // Recall suave: nada importante, mas o assunto já tem contexto salvo
    if (items.length === 0) {
      for (const ctx of contextHits) {
        items.push({
          tag: ctx.tag,
          fromImportant: false,
          date: ctx.date || null,
          snippet: null,
          contextSummary: ctx.summary,
          contextDate: ctx.date
        });
      }
    }

    return { found: items.length > 0, items: items.slice(0, limit) };
  } catch (e) {
    console.error("❌ Erro no recall:", e.message);
    return { found: false, items: [] };
  }
}
