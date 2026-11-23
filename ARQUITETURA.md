# Arquitetura do Robotomia

## 1. Objetivo

Robotomia é uma plataforma para criar uma presença digital chamada LunaTech: um agente com memória persistente, estado interno, personalidade em evolução e capacidade de receber novas interfaces sem depender de um robô físico.

A regra central é:

> O cérebro do robô deve existir independentemente do corpo físico.

Interfaces como web, Alexa, Telegram, YouTube ou voz podem ser adicionadas ou removidas sem substituir o núcleo de conversação.

## 2. Produto esperado

LunaTech deve ser mais do que um chatbot. Ela deve:

- compreender mensagens por meio do Brain;
- manter contexto recente e memória histórica;
- distinguir memória temporária de memória permanente;
- possuir estado emocional computacional;
- desenvolver gostos, desgostos e aspirações;
- recordar momentos relevantes com data e contexto;
- agir por canais diferentes usando o mesmo cérebro;
- ganhar novas capacidades por módulos opcionais;
- nunca permitir que ferramentas externas controlem diretamente mecanismos críticos.

O projeto usa emoções como estado computacional, não afirma consciência humana.

## 3. Arquitetura atual

```text
Interface
  Web / Alexa / canais futuros
        |
        v
Express API
  /chat
  /api/alexa
  /api/memories
  /api/profile
        |
        v
Brain
  chatController + talkToLuna
        |
        +--> Estado emocional
        +--> Personalidade
        +--> Memória de trabalho
        +--> Memória persistente
        +--> Recuperação por data, tags e importância
        +--> Provedor de IA
        |
        v
MongoDB ou modo offline
```

O fluxo principal de uma conversa é:

```text
entrada do usuário
  -> impacto local no estado emocional
  -> carga do contexto recente
  -> recuperação explícita ou espontânea
  -> construção do prompt
  -> resposta da IA
  -> calibração do estado
  -> atualização da personalidade
  -> persistência da interação
  -> resposta à interface
```

## 4. Estrutura do repositório

```text
client/views/       Interface EJS
server/ai/          Provedores e construção de prompts
server/controllers/ Casos de uso do chat
server/core/        Estado, emoção, personalidade e comportamento
server/memory/      Memória curta, persistência e modelos MongoDB
server/modules/     Integrações opcionais, como Alexa
server/routes/      Transporte HTTP dos módulos
server/public/      Front-end web
server/config/      Configuração dos módulos
```

Implementação principal:

- `server/index.js`: inicialização do servidor e exposição das APIs.
- `server/controllers/chatController.js`: pipeline do Brain.
- `server/core/emotion.js`: estado emocional atual.
- `server/core/personality.js`: gostos, desgostos e comportamento aprendido.
- `server/core/robotState.js`: identidade, aspirações e experiência.
- `server/memory/unifiedMemory.js`: memória de trabalho.
- `server/memory/persistence.js`: persistência MongoDB e recuperação.
- `server/modules/alexa/`: integração opcional com Alexa.

## 5. Brain

O Brain deve ser o único ponto de decisão para conversas e ferramentas.

Responsabilidades:

- interpretar entrada do usuário;
- consultar contexto e memória;
- combinar estado, personalidade e experiência;
- decidir se uma ferramenta pode ser utilizada;
- produzir uma resposta natural;
- atualizar estado e aprendizagem;
- persistir momentos relevantes;
- receber eventos externos;
- funcionar sem hardware físico.

Uma interface não pode alterar diretamente a memória ou o estado interno. Ela deve chamar o Brain e receber uma resposta padronizada.

## 6. Memória

A memória possui quatro tipos:

### Memória de trabalho

Contém as últimas interações disponíveis em RAM. É usada para continuidade imediata e não deve depender do banco.

### Memória episódica

Cada interação persistida representa um momento com:

- usuário;
- resposta;
- emoção;
- estado do humor;
- tópicos;
- importância;
- data.

### Memória importante

Momento marcado manualmente ou automaticamente por forte relevância emocional, importância declarada ou ocorrência significativa.

### Memória de contexto

Resumo associado a uma tag e à data em que o contexto foi criado. É usado para recordação espontânea sem carregar todas as conversas no prompt.

A recuperação deve respeitar limites e prioridades. O projeto não deve enviar todo o histórico à IA em cada mensagem.

## 7. Estado interno

O estado interno é separado em:

- **Memória:** fatos e acontecimentos;
- **Personalidade:** tendência estável de resposta;
- **Estado:** condição atual;
- **Comportamento:** decisão produzida pelo contexto.

Campos atuais:

- felicidade;
- estresse;
- energia;
- emoção dominante;
- identidade;
- traços;
- gostos;
- desgostos;
- tópicos conhecidos;
- aspirações;
- experiência.

### Decisão arquitetural

O estado atual deve possuir uma implementação única de leitura e atualização.

Os módulos antigos que mantêm estado paralelo, como `robotMind.js`, não devem ser considerados autoritativos até serem migrados ou removidos. O controller ativo deve depender de uma única fonte para estado emocional e personalidade.

## 8. Personalidade e evolução

A personalidade pode evoluir de forma limitada:

- tópicos fortes tornam-se gostos ou desgostos;
- interações relevantes produzem memória;
- aspirações podem surgir por afinidade recorrente;
- estado atual pode afetar o tom da resposta;
- experiência aumenta com atividade.

O sistema deve evitar mudanças abruptas e aleatórias. Toda evolução precisa:

- ter entrada observável;
- manter limites;
- ser explicável;
- ser persistida;
- poder ser revertida ou corrigida.

## 9. Provedor de IA

Groq é o provedor atual, mas o Brain não deve depender diretamente da implementação do provedor.

Uma interface futura pode substituir ou combinar provedores sem alterar o pipeline principal.

Requisitos:

- falha do provedor deve gerar resposta segura;
- respostas precisam ser validadas antes de alterar estado;
- JSON inválido deve usar fallback controlado;
- secrets nunca ficam no código;
- o modelo não recebe dados brutos desnecessários;
- memória sensível deve respeitar o mínimo necessário.

## 10. Módulos opcionais

Todos os módulos devem declarar estado e capacidades:

```text
DISABLED
AVAILABLE
STARTING
READY
ERROR
UNAVAILABLE
```

Exemplos futuros:

- body;
- vision;
- navigation;
- voice;
- YouTube;
- Alexa;
- publisher;
- developer agent;
- chat externo.

Se um módulo estiver desativado, ele não pode quebrar o servidor nem o Brain.

Antes de usar uma capacidade:

```text
capabilityAvailable("navigation.goTo")
```

Caso a capacidade não exista:

```text
MODULE_NOT_AVAILABLE
```

## 11. Contrato de ferramentas

Cada ferramenta deve possuir:

- nome estável;
- descrição;
- parâmetros validados;
- permissões próprias;
- estado disponível ou não disponível;
- timeout;
- logs;
- política de erro;
- autorização do usuário quando necessário.

Exemplos:

- `memory.read`;
- `memory.write`;
- `robot.move`;
- `robot.camera`;
- `youtube.read_chat`;
- `blog.publish`;
- `developer.write_code`;
- `developer.deploy`.

Nenhum modelo deve chamar diretamente hardware ou publicar conteúdo externo sem uma camada intermediária de validação e permissão.

## 12. Event Bus

Módulos desacoplados devem comunicar mudanças por eventos.

Exemplos:

- `speech.detected`;
- `location.updated`;
- `obstacle.detected`;
- `battery.low`;
- `user.arrived`;
- `memory.created`;
- `alexa.intent.received`;
- `youtube.message.received`;
- `developer.task.created`.

Eventos não devem conter objetos ou permissões ocultas. Cada consumidor decide como reagir.

## 13. Corpo físico

O corpo futuro deve executar comandos seguros recebidos de uma camada local.

Estrutura planejada:

```text
Servidor / Brain
      |
      v
Controle local
  Raspberry Pi / computador embarcado
      |
      v
Microcontrolador
  ESP32 / Arduino
      |
      v
Motores, sensores e bateria
```

O servidor não controla motores críticos diretamente.

Regras obrigatórias:

- parada de emergência local;
- watchdog;
- limites de velocidade;
- validação de comandos;
- sensores locais funcionando sem internet;
- telemetria limitada ao necessário;
- IA não podendo desativar segurança.

## 14. Segurança

Segredos:

- usar variáveis de ambiente;
- não enviar secrets ao repositório;
- manter `.env.example` documentado;
- remover `.env` do histórico caso tenha sido enviado;
- rotacionar qualquer chave exposta.

APIs:

- validar entrada;
- aplicar limites por rota;
- autenticar operações sensíveis;
- registrar erros sem expor secrets;
- usar HTTPS em produção;
- validar assinaturas de integrações externas como Alexa.

Rotação e implantação:

- build reproduzível;
- testes antes do merge;
- deploy somente após revisão;
- logs da versão implantada;
- possibilidade de rollback.

## 15. Deploy

O projeto pode ser executado localmente com:

```bash
npm install
npm run dev
```

Variáveis mínimas:

```text
GROQ_API_KEY
MONGO_URI
```

MongoDB é opcional para desenvolvimento, mas necessário para persistência entre reinícios.

O servidor deve:

- escutar em `0.0.0.0` em produção;
- responder em `/health`;
- iniciar em modo degradado quando o MongoDB estiver indisponível;
- não expor secrets no Blueprint ou no código.

## 16. Fases de desenvolvimento

### Fase 1 — Brain + Memory

Estado atual: em desenvolvimento.

Entregas:

- conversa estável;
- memória persistente;
- estado restaurado;
- personalidade persistida;
- recordação por data e tags;
- API documentada;
- testes automatizados;
- estado interno unificado;
- resumo diário;
- reflexão periódica;
- módulos configuráveis;
- logs estruturados.

### Fase 2 — interfaces externas

- Alexa segura;
- chat externo;
- YouTube com moderação;
- rede social própria com aprovação;
- aplicativo/dashboard;
- sincronização.

### Fase 3 — corpo

- bateria;
- motores;
- encoders;
- sensores;
- Raspberry Pi;
- ESP32/Arduino;
- parada de emergência;
- controle local.

### Fase 4 — percepção e navegação

- câmera;
- LiDAR ou ToF;
- IMU;
- odometria;
- mapa;
- localização;
- obstáculos;
- A*;
- múltiplos ambientes;
- múltiplos andares;

### Fase 5 — voz

- Speech-to-Text;
- Text-to-Speech;
- processamento local;
- eventos de voz;
- fallback sem internet.

### Fase 6 — ferramentas externas

- publisher;
- aprovação humana;
- logs de publicação;
- integrações com conteúdo externo.

### Fase 7 — developer agent

Somente após a plataforma principal estar estável:

- ambiente isolado;
- tarefas;
- branches;
- testes;
- build;
- revisão;
- pull request;
- deploy manual inicialmente;
- rollback.

## 17. Plano próximo

A próxima entrega deve completar a Fase 1 antes de adicionar novas modalidades.

### Prioridade alta

1. criar uma única implementação do estado interno;
2. remover ou migrar `robotMind.js`;
3. padronizar o contrato das APIs;
4. adicionar testes de conversação e persistência;
5. ativar reflexão e resumo diário;
6. melhorar relevância automática das memórias;
7. adicionar autenticação quando necessário;
8. estruturar logs;
9. corrigir o histórico de arquivos e secrets;
10. documentar a API.

### Critérios de pronto

A Fase 1 será considerada estável quando:

- uma conversa reinicia sem perder identidade;
- o estado emocional é restaurado corretamente;
- memória recente volta após reinício;
- o sistema continua respondendo sem Mongo;
- momentos importantes são recuperados por data e contexto;
- um canal externo usa o mesmo Brain;
- um módulo desativado não quebra o servidor;
- o provedor de IA tem fallback;
- o estado não é alterado por JSON inválido;
- existem testes para fluxo principal;
- secrets não aparecem no repositório.

## 18. Princípios permanentes

- crescer por etapas pequenas;
- preservar o Brain independente do corpo;
- manter módulos opcionais;
- separar memória, estado e personalidade;
- validar todas as ferramentas;
- aplicar permissões por capacidade;
- manter parada segura em hardware local;
- aprovar ações físicas e públicas;
- registrar alterações relevantes;
- permitir rollback;
- não criar todas as fases simultaneamente;
- documentar decisões junto ao código;
