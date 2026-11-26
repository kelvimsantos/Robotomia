# Robotomia

Um robô que evolui: contendo status, memórias, vontades e aspirações, e se desenvolve ao longo do tempo com as memórias.

## O que ele faz

- **Conversa por texto ou voz**: você digita ou fala pelo microfone (a fala é transformada em texto automaticamente).
- **Fala de volta**: com o botão de voz ativado, o robô responde falando em português.
- **Evolui**: cada conversa vira uma memória salva e altera energia, humor, conhecimento e autonomia dele.
- **Tem aspirações**: quando o conhecimento enche, ele ganha uma aspiração nova.

## Rodar localmente

```bash
npm install
npm run dev
```

Configure as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no arquivo `.env`.

## Notas sobre a voz

- A voz usa recursos do próprio navegador (Web Speech API) — não precisa de servidor de áudio.
- O microfone exige HTTPS (funciona no Render e em qualquer hospedagem com https).
- Reconhecimento de fala funciona melhor no Chrome/Edge; no Firefox, use o teclado.
