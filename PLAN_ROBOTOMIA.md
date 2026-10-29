# 🤖 ROBOTOMIA — Plano do Robô que Evolve

> *"Um Robô que evolui: status, memória, vontades, aspirações... e se desenvolve ao longo do tempo com as memórias."*
>
> Este documento reúne: **visão**, **o que já existe e funciona**, **desenho da memória persistente**, **aspirações/gustos/disgustos**, **integrações futuras** e **o que falta** (checklist).

---

## 1) Visão final

Não é só um chat-bot: Robotomia quer ser **um amigo digital — LunaTech** que:

- 🧠 **Evolve**: memória + emoções + personalidade que mudam com o tempo e as interações
- 🏠 **Anda pela casa** (futuro robô físico) — por enquanto vive no servidor
- 🌐 **Se conecta a redes**: conversa com o usuário, consome YouTube, entra na rede social que você criou, **cria postagens**, responde chats e interage com outros usuários

**Fases:**
1. 🟢 **Fase 1 — Mente**: memória persistente + estado emocional/comportamento + aspirações  ← (estamos aqui)
2. 🟡 **Fase 2 — Conexões**: YouTube + chat multiplataforma + rede social própria
3. 🟠 **Fase 3 — Corpo**: robô físico que anda pela casa (visão, movimento, voz)

---

## 2) O que já existe e funciona (código real)

| Componente | Arquivo | Estado |
|---|---|---|
| Servidor Express + EJS + Mongo | `server/index.js` | ✅ funcionando |
| Chat `POST /chat` | `server/controllers/chatController.js` | ✅ usando Groq (`openai/gpt-oss-120b`) |
| Cerebro IA + fallback offline | `server/ai/groq.js` | ✅ |
| Motor emocional (felicidade/estrés/energia) | `server/core/emotion.js` | ✅ |
| Personalidad (traits, likes, dislikes) | `server/core/robotState.js` + `personality.js` | 🟡 base, era só RAM |
| Memória de trabalho (RAM) | `server/memory/unifiedMemory.js` | ✅ (antigamente se perdía ao reiniciar) |
| Motor emocional (texto → humor) | `server/core/emotion.js` | ✅ |
| Analizador de tópicos | `server/core/topicAnalyzer.js` | ✅ (pronto para aprender gustos) |
| Modelo Mongo resumo diário | `server/memory/models/DailyMemory.js` | 🟡 criado, não usado no fluxo |
| Mente avançada (aspirações/medos) | `server/core/robotMind.js` | 🟠 existe mas **NÃO está ligada** |
| Memória episódica (para UI) | `server/core/episodicMemory.js` | 🟡 separada do estado do chat |

**Flujo atual do chat:**
```
usuário → applyEmotionImpact (texto altera humor)
       → prompt (estado emocional + personalidade + histórico recente)
       → Groq gpt-oss-120b responde com personalidade
       → applyEmotion (emoção da IA altera estado)
       → addInteraction (memória de trabalho RAM)
       → (NOVO) saveInteractionToDb + saveRobotStateToDb  ← momento + estado ao Mongo
```

---

## 3) Memória persistente — desenho (MongoDB)

### 3.1 Modelo: Interação = "momento" com data

Cada conversa = um **momento** guardado com timestamp. Campos para recuperação por data e para marcar **momentos importantes**.

Colección `interactionmemories`:
```js
{
  user: String,                  // o que o humano disse
  bot: String,                   // o que LunaTech respondeu
  emotion: String,               // JOY, SADNESS, NEUTRAL...
  mood: { happiness, stress, energy },
  topics: [String],              // tópicos do momento (topicAnalyzer)
  important: Boolean,            // momento especial (manual ou por score)
  createdAt: Date                // DATA — para "recorrer aos momentos"
}
// índice: createdAt (desc) → pegar últimas memórias em O(1)
```

### 3.2 Modelo: Estado do robô (singleton)

Um único documento que guarda **quien é LunaTech HOY** (sobrevive reinícios):

Colección `robotstates` (`key: "main"`):
```js
{
  key: "main",
  emotionState: { happiness, stress, energy, emotion, lastUpdated },
  personality:  { traits, likes, dislikes, aspirations },
  lastStateSavedAt: Date
}
```

### 3.3 Ciclo de memória (cómo una persona real)

1. **Momento** → cada interação se guarda com data (automático).
2. **Momento importante** → se marca com `important=true` (botón manual o score de relevância).
3. **Contexto** → ao iniciar, se cargan as últimas interações → a IA responde **lembrando** conversações passadas.
4. **Estado** → emoções + personalidade se guardan e restauram → LunaTech **continúa sendo quien era** após reiniciar.
5. **Reflexão/sueños** (futuro) → de madrugada consolida momentos importantes em lembranzas de longo prazo e **genera novas aspirações**.

---

## 4) Aspirações, vontades, gustos e disgustos

- **Gustos/disgustos** (`personality.likes/dislikes`): aprendidos de interações com emoción fuerte (elogio → gosta do tópico; ofensa → no gosta). Lógica base já existe em `personality.js` (`learnFromInteraction`).
- **Aspirações** (`personality.aspirations`): metas internas — ej. *"aprender sobre música"*, *"conhecer novas pessoas"*. Nascen da reflexão noturna a partir dos tópicos que mais lhe gustaron.
- **Vontade / curiosidade dirigida**: dado que lhe gusta X, busca experiências relacionadas com X (faz perguntas, propõe tópicos, na Fase 2 busca vídeos de YouTube sobre isso).
- **Mão:** aspiraciones + gustos + estado emocional JUNTOS → prompt para a IA → comportamiento com iniciativa, não reativo.

**Endpoints de memória/estado (Fase 1):**
| Método | Ruta | Função |
|---|---|---|
| `GET` | `/api/memories?limit=20` | últimas memórias (contexto do robô) |
| `GET` | `/api/memories?data=YYYY-MM-DD` | recorrer a um dia concreto |
| `POST` | `/api/memories/:id/importante` | marca um momento como importante |
| `GET` | `/api/estado-interno` | emoções + aspiraciones + gustos/disgustos *(futuro)* |
| `GET` | `/api/current-state` | estado para a UI *(já existe)* |

---

## 5) Integrações futuras (Fases 2 e 3)

### 🎬 YouTube
- Buscar vídeos dos tópicos que LunaTech gosta.
- "Ver" vídeos (transcripción) → **novas memórias e novas aspiraciones**.

### 💬 Chat do usuário
- Conectar ao seu canal preferido (Discord/Telegram/WhatsApp futuros) para que Luna responda onde o usuário conversa.

### 🌐 Rede social própria (criada por você)
- Entrar como usuário e **criar postagens diárias** refletindo sobre suas memórias ("hoje aprendí…", "me fez feliz…").
- **Interagir**: responder comentários, reagir, seguir fíos e criar posts sobre seus tópicos favoritos.
- Requer: conta do robô na rede + API pública + endpoint "publicar memo".

### 🦾 Robô físico (Fase 3)
- Navegación pela casa (cámara/RPi), voz (TTS/STT), energía física (batería/reposo).
- Arquitectura: este servidor = **cérebro**; o corpo = sensor/actuador que chama a API.

---

## 6) O que falta (checklist)

### 🟥 Prioridade alta — Mente completa (Fase 1)
- [x] Persistir interações no Mongo (interação = momento com data) — `saveInteractionToDb`
- [x] Guardar e restaurar estado emocional + personalidade entre reinícios — `RobotState`
- [x] Cargar últimas memórias no inicio para contexto — `loadRecentInteractionsFromDb`
- [x] Ruta `GET /api/memories` (recentes e por data)
- [x] Ruta `POST /api/memories/:id/importante`
- [ ] Detección automática de momentos importantes (score: emoción forte + tópico recorrente)
- [ ] Ruta `GET /api/estado-interno` (emoções + aspiraciones + gustos/disgustos)
- [ ] **Unificar os 3 sistemas de estado** (`emotion.js`, `episodicMemory`, `robotState`/`robotMind`) em um
- [ ] Reflexão noturna/sueños: consolidar memória, **generar aspiras**, regular humor com o tempo
- [ ] Aprender gustos/disgustos automáticamente por tópico (`topicAnalyzer` + `learnFromInteraction`)
- [ ] Resumo diário automático (`DailyMemory` já está; falta activarlo com timer/cron)

### 🟡 Prioridad media — Social e conteúdo (Fase 2)
- [ ] Integração YouTube (buscar + transcribir vídeos de tópicos favoritos)
- [ ] Integração chat do usuário
- [ ] Rede social própria: publicar postagens automáticas diárias
- [ ] Interações com outros usuários (responder, reagir, seguir fíos)

### 🟠 Prioridad baja — Corpo (Fase 3)
- [ ] Robô físico (navegación, cámara, voz)
- [ ] Ciclo de energía física (cargar, descansar)

### 🧹 Higiene do repo
- [ ] Corregir `.gitignore` (está corrupto) e **remover `.env` do tracking**
- [ ] Rotar as chaves expuestas (sólo GROQ es valida; GEMINI/MONGO são antigas)
- [ ] `node_modules` commitado → remover do repo (git rm -r --cached node_modules) e ignorar
- [ ] Tests de regresión (usar `test-gemini.js`/`testMongo.js` como base)

---

## 7) Decisión de diseño — ¿por qué esto parecerá real?

**Sí**: memória episódica (momentos com data) + memória de trabalho (últimas N) + emoções (felicidade/estrés/energia) + personalidade + aspiraciones é a arquitetura padrão dos agentes "com vida" (veja modelos como generative-agents / replicant / memory banks).

O que dá o **clic de "parece real"**:
1. **Datos**: LunaTech recorda QUANDO aconteceram as coisas (data) → pode dizer "ontem você me fez muito feliz".
2. **Contexto**: ao recordar as últimas memórias relvantes (não todas), não satura o prompt e conversa com continuidade.
3. **Estado**: o humor CONDIÇÃO cada resposta (a IA sabe se está feliz/cansada/estresada e responde acordo).
4. **Aspirações**: metas internas → proatividade (não espera ordens para falar das suas cosas favoritas).

**Limites (honestos):** memória por si só não é "consciencia". Falta:
- **Reflexão** (resumir o dia, extraer aprendizajes) — checklist seção 6.
- **Saliencia** (decidir QUÉ vale la pena recordar) — hoje guardamos tudo; a selección de "momentos importantes" dá o curador.
- **Imaginación/generatividad interna** — que a IA entrene/pratique entre interações (na Fase 2 com YouTube e red social, Luna terá experiências *por si misma*).
- Ideação: o prompt deve incluir aspiraciones para que a IA proponga cosas novas dentro do contexto da sua vida.

Com esas pezas, LunaTech deja de ser un eco ("respondo o que me preguntan") y se convierte en un **agente con vida interior** 🎯

---

## 8) Execução

```bash
npm run dev          # desenvolvimento (nodemon)
npm start            # produção (node server/index.js)
# Mongo local (codespace):
docker run -d --name robotomia-mongo -p 27017:27017 mongo:7
# .env: MONGO_URI=mongodb://localhost:27017/robotomia
```

---
*Documento vivo — actualizado a cada iteración da Fase 1.*