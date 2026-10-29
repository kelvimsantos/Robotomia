# 🤖 Robotomia

Robô com estado emocional, memória persistente (Mongo) e personalidade em evolución — "LunaTech".

> Parte da plataforma **ROBOT AI PLATFORM**: um cérebro de IA independente do corpo físico, que
> adquiere capacidades por módulos ativáveis (vision, voz, navegação, YouTube, Alexa...).

## Estado atual (Fase 1 — Brain + Memory)

- ✅ Chat `POST /chat` (Groq, fallback offline)
- ✅ Motor emocional (felicidade / estrés / energia) com calibração
- ✅ Personalidade: traços, gustos, aversións, aspiraciones, knownTopics
- ✅ Memória persistente: interações com data, momentos importantes, contexto por tag
- ✅ **Recall espontâneo**: busca por tag nas memórias importantes e confiere o contexto completo resumido na tabela de memórias de contexto
- ✅ Identidade/nome configurable: `GET/PUT /api/profile/name`

## Documentação

- [`ideia.md`](./ideia.md) — especificação geral e roadmap (ROBOT AI PLATFORM)
- [`PLAN_ROBOTOMIA.md`](./PLAN_ROBOTOMIA.md) — plan vivo do projeto
- [`ALEXA_SKILL.md`](./ALEXA_SKILL.md) — skill de Alexa paso a paso (falar com o robô pela voz)

## Ejecutar

```bash
npm install
npm run dev   # desenvolvimento (nodemon)
npm start     # produção

# .env:
# GROQ_API_KEY=...
# MONGO_URI=mongodb://localhost:27017/robotomia
```

## API (resumen)

| Método | Ruta | Função |
|---|---|---|
| `POST` | `/chat` | conversar |
| `GET` | `/api/current-state` | humor + personalidad + identidad |
| `GET` | `/api/profile` · `PUT /api/profile/name` | identidade (nome escolhido) |
| `GET` | `/api/memories` | últimas memórias / por data |
| `POST` | `/api/memories/:id/importante` | marca momento importante |
| `GET` | `/api/memories/importantes` | momentos importantes (por data) |
| `GET` | `/api/memory-types` | catálogo de tipos de memória |
| `GET` | `/api/context-memories?tag=` | resúmenes de contexto por tag |
| `POST` | `/api/alexa/skill` | endpoint del skill de Alexa (voz → Brain) |
| `GET` | `/api/alexa/status` | estado del módulo Alexa |