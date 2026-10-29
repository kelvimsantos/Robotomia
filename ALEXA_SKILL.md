# 🎙️ ALEXA SKILL — Falar com o Robô (LunaTech) através da Alexa

> **Roadmap da spec (sección 22 — MÓDULO ALEXA)**
>
> ```
> Alexa  →  Alexa Skill  →  API (/api/alexa/skill)  →  Brain (talkToLuna)  →  resposta
> ```
>
> **Regra de projeto:** o Brain é o sistema principal. Alexa é SÓ uma interface
> externa — **não guarda memória própria** e **não rouba a memória principal**
> do sistema. Toda a vida/humor/memória continua no servidor.

---

## ✅ O que já está implementado (código real)

| Ficheiro | O que faz |
|---|---|
| `server/config/modules.json` | Mapa de módulos (`alexa: true/false`). Inactivo → não rompe nada (spec §2.1/§30) |
| `server/modules/alexa/skill.js` | Lógica do skill: validação de Application ID, intents, resposta SSML, chamada ao Brain |
| `server/routes/alexa.routes.js` | `POST /api/alexa/skill` (endpoint que Amazon invoca) + `GET /api/alexa/status` |
| `server/controllers/chatController.js` | Refactor: o pipeline vive em `talkToLuna(userInput)` — usado por `/chat` **e** pelo skill (o MESMO cérebro) |
| `testAlexa.js` | Cliente de teste: simula eventos de Alexa contra o servidor local |

**Intents suportados por este módulo:**
- `LaunchRequest` → saludo
- `ConversarIntent` → o usuário diz o que quiera (slot libre) → **Brain real** (Groq + memeoria + humor + personalidade)
- `AMAZON.HelpIntent` / `AMAZON.StopIntent` / `AMAZON.CancelIntent` → ayuda / despedida
- SessionEnded → cierre correcto

**Seguridad ya activa:**
- Application ID verificado se `ALEXA_APPLICATION_ID` está definido (en dev se omite)
- Módulo desactivado → `403 MODULE_NOT_AVAILABLE` (spec §2.2)

---

## 0) Pré-requisitos

1. **Cuenta Amazon Developer**: https://developer.amazon.com (gratis)
2. **Este servidor Robotomia** corriendo y accesible por HTTPS desde Internet
   (local ok con **ngrok**; producción usa tu propio dominio HTTPS)
3. Node.js ≥ 18 (por `fetch`) — ya lo usa el proyecto

---

## 1) Configurar el proyecto

```bash
cd /workspaces/codespaces-react/Robotomia
```

`server/config/modules.json` — activa el módulo (ya está en `true`):

```json
{
  "modules": { "alexa": true },
  "alexa": {
    "applicationId": "",        // se rellena con el ID de tu skill (paso 7)
    "invocationName": "robotomia",
    "brainName": "LunaTech"
  }
}
```

Variables de entorno (`.env` u export):

```bash
ALEXA_ENABLED=true
ALEXA_APPLICATION_ID=amzn1.ask.skill.XXXXXXXX        # ID real de tu skill
MONGO_URI=mongodb://localhost:27017/robotomia         # opcional, para memoria persistente
GROQ_API_KEY=...                                       # el cerebro IA
```

Comprueba que el módulo responde:

```bash
curl http://localhost:4123/api/alexa/status
# → { "success": true, "module": "alexa", "enabled": true, ... }
```

---

## 2) Endpoint HTTPS (necesario para Alexa)

Alexa exige HTTPS. Durante el desarrollo, lo más rápido es abrir un túnel:

```bash
ngrok http 4123
# → https://xxxxxxxx.ngrok-free.app  ← anota esta URL
```

El endpoint de tu skill será:

```
https://xxxxxxxx.ngrok-free.app/api/alexa/skill
```

> En producción: sube el servidor a un dominio con HTTPS (Railway, Render, una
> VPS con Caddy/nginx...) y usa esa URL. CERO cambios de código necesarios.

---

## 3) Crear el Skill en Alexa Developer Console

1. Entra en https://developer.amazon.com → **Alexa Skills Kit** → **Create a Skill**.
2. **Skill name**: `Robotomia` (o el que quieras).
3. **Default Language**: `Spanish (ES)` si hablas en español (o `Portuguese (BR)`).
4. **Choose a model**: `Custom` (no usamos plantillas).
5. **Choose a host**: `Other` (el backend lo corre nuestro servidor).
6. **Invocation name**: `robotomia` (ej.: *"Alexa, abre robotomia"*).
7. Guarda → ve a la pestaña **Build > Custom > Interaction Model**.

---

## 4) Modelo de interacción (Intents + utterances)

**A. Intent custom — ConversarIntent** (slot LIBRE para que el usuario diga lo que quiera).

Ve a `Build → Interaction Model → Custom Intents → Add`, llámalo `ConversarIntent`
y usa estas sample utterances:

```
{consulta}
habla con consulta {consulta}
dile {consulta}
y ahora {consulta}
otra cosa {consulta}
quiero contarte que {consulta}
que piensas de {consulta}
hablame de {consulta}
```

> El slot `{consulta}` usa un **custom slot type** llamado `CONSULTA`: créalo (botón
> "+") y déjalo **vacío** (free-form) para que capture texto libre.

**B. Intents estándar de Amazon** (aparecen en `EnglishBuiltinIntents` / añade los que uses):

```
AMAZON.HelpIntent
AMAZON.StopIntent
AMAZON.CancelIntent
```

**C. JSON del modelo de interacción (resumen, para pegar en "Code Editor" si prefieres):**

```json
{
  "interactionModel": {
    "languageModel": {
      "invocationName": "robotomia",
      "intents": [
        { "name": "AMAZON.HelpIntent", "samples": [] },
        { "name": "AMAZON.StopIntent", "samples": [] },
        { "name": "AMAZON.CancelIntent", "samples": [] },
        {
          "name": "ConversarIntent",
          "slots": [ { "name": "consulta", "type": "CONSULTA" } ],
          "samples": [
            "{consulta}",
            "habla con consulta {consulta}",
            "dile {consulta}",
            "y ahora {consulta}",
            "otra cosa {consulta}",
            "quiero contarte que {consulta}",
            "que piensas de {consulta}",
            "hablame de {consulta}"
          ]
        }
      ],
      "types": [ { "name": "CONSULTA", "values": [] } ]
    }
  }
}
```

Pulsa **Save Model** y luego **Build Model** (arriba).

---

## 5) Conectar el endpoint (https)

En la consola del skill, pestaña **Endpoint**:
1. **Service Endpoint Type**: `HTTPS`.
2. **Default Region**: pega tu URL de ngrok/producción:
   ```
   https://xxxxxxxx.ngrok-free.app/api/alexa/skill
   ```
3. **SSL Certificate Type**: como usamos ngrok → `My development security certificate is a wildcard certificate` (ngrok ya da HTTPS válido). En producción con tu dominio: `Wildcard` o `Trusted`.
4. Guarda.

Marca en `Permissions`: no pedimos ninguna especial (solo conversación). Si en el futuro quieres nombre/usuario de Alexa, activa las que necesites (spec §26: permisos por separado).

---

## 6) Probar

**6.1 — Simulador de la consola** (sin dispositivo físico):
Pestaña **Test** → escribe/desactiva "Alexa, abre..." y escribe:

```
habla con consulta hola, quien eres
```

Si todo va bien, Alexa responde con la voz de LunaTech hablándote **con su humor y personalidad reales**.

**6.2 — Dispositivo físico:**
```
"Alexa, abre robotomia"
"Alexa, dile que le recuerdas de cuando hablamos de música"
"Alexa, abre robotomia y pregunta quién soy"
```

Cada turno llama al Brain: el recuerdo de la conversación de ayer sirve hoy, porque
la **memoria vive en el servidor** (Mongo), no en la Alexa.

**6.3 — Probar local sin Amazon** (mientras desarrollas):

```bash
cd /workspaces/codespaces-react/Robotomia
node testAlexa.js           # ConversarIntent con el Brain real (Groq + memoria)
node testAlexa.js help      # AMAZON.HelpIntent
node testAlexa.js stop      # AMAZON.StopIntent
node testAlexa.js wrong     # app-id incorrecta → debe dar 403
```

o con curl:

```bash
curl -X POST http://localhost:4123/api/alexa/skill \
  -H 'Content-Type: application/json' \
  -d '{"context":{"System":{"application":{"applicationId":"amzn1.ask.skill.demo"}}},
       "request":{"type":"IntentRequest","intent":{"name":"ConversarIntent",
         "slots":{"consulta":{"name":"consulta","value":"que recuerdas de nosotros"}}}}}'
```

---

## 7) Seguridad en producción (importante)

1. **Application ID** (ya implementado): pon tu ID real en `.env`:
   ```bash
   ALEXA_APPLICATION_ID=amzn1.ask.skill.TUIDADAVERDADERO
   ```
   Cualquier petición con otro ID → `403 NOT_ALLOWED`.

2. **Firma de Amazon (recomendado)**: en producción, valida que la petición viene
   de verdad de Amazon con el paquete **`alexa-verifier-middleware`** (firma
   criptográfica + certificado). Hoy el endpoint acepta sin verificar firma para
   desarrollo; añádelo así:
   ```bash
   npm i alexa-verifier-middleware
   ```
   ```js
   import { verify } from "alexa-verifier-middleware";
   app.post("/api/alexa/skill", verify(async (req, res) => { ... }));
   ```
   (spec §35: la IA nunca controla mecanismos críticos sin una capa de seguridad local).

3. **No guardes nada del skill en la skill**: la memoria/personalidad viven en el
   Brain. Alexa es un altavoz/interface, no el cerebro.

---

## Troubleshooting

| Síntoma | Causa | Solución |
|---|---|---|
| `502` en el endpoint de la consola | ngrok caído o URL sin `/api/alexa/skill` | reinicia ngrok y copia la URL completa |
| `403 NOT_ALLOWED` | Application ID distinto al de tu skill | copia el ID real de la consola a `ALEXA_APPLICATION_ID` |
| `403 MODULE_NOT_AVAILABLE` | `modules.alexa: false` | pon `true` en `server/config/modules.json` |
| Alexa dice "no entiendo" | Los utterances del intent no cubren la frase | añade más sample utterances + re-build |
| Respuestas lentas (10s+) | Llamada a Groq | normal ~2–5s; revisa `GROQ_API_KEY` y red |
| El recurdo no aparece | La memoria estaba en RAM y se reinició sin Mongo | levanta Mongo (`docker run -d --name robotomia-mongo -p 27017:27017 mongo:7`) |

---

## Próximos pasos (roadmap spec §22)

- [ ] Verificación de firma de Amazon activada por defecto (`alexa-verifier`)
- [ ] Intent propio "Memoria": *"Alexa, pregunta qué recuerdas de X"* → consulta directa a `/api/memories`
- [ ] Nombre del usuario (skill persona) con permiso `alexa:profile` (spec §26)
- [ ] Voz local / TTS custom (spec §16/§17) cuando exista hardware
- [ ] Integrar el **Event Bus** (spec §27): publicar `alexa.intent.received` para que otros módulos reaccionen