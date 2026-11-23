# Execução da Fase 1 — Brain + Memory

Este checklist transforma a visão de `ARQUITETURA.md`, `ideia.md` e `PLAN_ROBOTOMIA.md` em entregas pequenas e verificáveis. A regra é evoluir sobre o sistema atual: preservar rotas e formatos existentes, adicionar testes antes de refatorações maiores e migrar estado em etapas.

## Princípios de implementação

- [x] Manter o Brain independente de hardware físico.
- [x] Manter canais (web/Alexa) como interfaces do mesmo Brain.
- [x] Separar estado em memória RAM e persistência MongoDB.
- [ ] Antes de cada alteração, mapear os consumidores atuais e preservar compatibilidade.
- [ ] Adicionar testes de regressão antes de substituir comportamento existente.
- [ ] Fazer mudanças pequenas, revisáveis e reversíveis; não reescrever módulos inteiros sem necessidade.
- [ ] Nunca deixar a IA alterar estado, preferências ou ferramentas sem validação determinística.
- [ ] Deixar cálculos de humor, limites, datas e validações no código; usar a IA para interpretar contexto e propor conteúdo estruturado.
- [ ] Evitar consultas repetidas ao banco: usar caches em RAM para estado e contexto recente, persistindo em pontos definidos e consultando memória longa quando a intenção ou a relevância justificar.
- [ ] Documentar o que é estimativa e o que é fato observado. Tempo de conversa/afinidade não deve ser apresentado como domínio comprovado de conhecimento.

## Estado atual já disponível

- [x] Express API e fluxo de chat em `server/controllers/chatController.js`.
- [x] Estado emocional com limites e regulação temporal em `server/core/emotion.js`.
- [x] Identidade, traços, gostos, desgostos, aspirações e tópicos em `server/core/robotState.js`.
- [x] Preferências explícitas e aprendizado de tópicos em `server/core/personality.js`.
- [x] Memória de trabalho em RAM em `server/memory/unifiedMemory.js`.
- [x] Interações com data, tópicos, estado e importância no MongoDB.
- [x] Memória importante e memória contextual por tags.
- [x] Restauração inicial do estado e das interações recentes do MongoDB.
- [x] Fallback offline do provedor de IA.
- [x] Endpoint de saúde `/health`.
- [ ] Testes automatizados que protejam esses fluxos. (A existência de scripts de teste manuais não equivale a uma suíte de regressão.)

## Etapa 1 — Linha de base e segurança

- [ ] Adicionar testes de regressão para humor, identidade, personalidade, persistência e rotas.
- [ ] Registrar o contrato atual das APIs e testar compatibilidade de respostas.
- [ ] Verificar `.gitignore`, `.env.example`, arquivos rastreados e dependências comprometidas; nunca remover dados sem revisão.
- [ ] Garantir validação de payload e limites para todas as rotas que mudam estado.
- [ ] Adicionar logs estruturados sem chaves, prompts sensíveis ou conteúdo desnecessário.
- [ ] Verificar configuração e saúde do deploy sem alterar os valores secretos existentes.

## Etapa 2 — Estado em RAM como fonte operacional

- [ ] Definir um único serviço de estado em memória para identidade, humor, personalidade, experiência e módulos.
- [ ] Manter os modelos MongoDB como persistência e recuperação, não fazer leitura do banco a cada consulta comum.
- [ ] Preservar compatibilidade com os módulos atuais por adaptadores temporários.
- [ ] Definir validação, valores padrão e limites para estado carregado do banco.
- [ ] Persistir estado após mudanças relevantes e em intervalos/eventos seguros, evitando escritas desnecessárias.
- [ ] Tratar falha de MongoDB como modo degradado; não perder disponibilidade do chat.
- [ ] Migrar ou desativar `server/core/robotMind.js` somente depois de confirmar referências e cobertura de testes.

## Etapa 3 — Humor com cálculo local e validação

- [x] Manter humor numérico e limitado no backend.
- [x] Usar decaimento temporal e limites por mensagem no motor atual.
- [ ] Tornar o cálculo determinístico e cobrir limites, tempo decorrido, dados inválidos e casos extremos com testes.
- [ ] Separar impacto detectado localmente da sugestão de tom/emoção retornada pela IA.
- [ ] Validar enum de emoção e cada campo numérico antes de aceitar qualquer sugestão da IA.
- [ ] Garantir que JSON inválido ou resposta vazia não mude estado/persona.
- [ ] Definir calibração e regras para evitar que uma única mensagem crie mudanças permanentes de personalidade.
- [ ] Testar a persistência e restauração do timestamp real para a regulação após reinicialização.

## Etapa 4 — Memória curta, longa e recuperação

- [x] Usar memória de trabalho em RAM para interações recentes.
- [x] Persistir episódios com data, tópicos, humor e resposta.
- [x] Separar momentos importantes e resumos de contexto por tag.
- [x] Recuperar memórias recentes no início e limitar o histórico enviado ao prompt.
- [ ] Definir política de seleção: contexto recente, memória relevante, data explícita e importância.
- [ ] Validar e normalizar datas, intervalos e fuso horário; não aceitar datas inválidas silenciosamente.
- [ ] Criar índices adequados para consultas por data, importância e tópicos.
- [ ] Reduzir consultas repetidas com cache curto de recall por tags e invalidação após novas memórias.
- [ ] Consultar memória longa sob demanda ou quando as palavras-chave/tópicos indicarem relevância, com limite de resultados.
- [ ] Evitar falso recall: a resposta deve distinguir memória encontrada de inferência; se não houver evidência, admitir que não lembra.
- [ ] Definir retenção, exclusão e proteção de dados pessoais.

## Etapa 5 — Gostos, desgostos, vontades e aspirações

- [x] Expor gostos, desgostos, traços e aspirações no contexto da IA.
- [x] Registrar preferências explícitas e afinidade por tópicos.
- [ ] Dar mais peso a declarações explícitas do usuário do que a inferências emocionais.
- [ ] Guardar evidências, contagens e confiança da inferência; não converter uma única emoção em preferência permanente.
- [ ] Evitar que um gosto e um desgosto contraditórios coexistam sem contexto ou revisão.
- [ ] Criar regras determinísticas de evolução, limites e expiração/revisão de aspirações.
- [ ] Explicar à IA que aspiração é orientação de conversa, não autorização para executar ações externas.

## Etapa 6 — Assuntos e familiaridade baseada em atividade

- [ ] Normalizar palavras-chave em português e remover stopwords/ruído com testes.
- [ ] Associar cada interação a um conjunto limitado de tópicos e à data.
- [ ] Medir interações e tempo estimado de atenção por tópico com limites e política explícita para pausas.
- [ ] Não tratar intervalo entre mensagens como tempo real de estudo; registrar como estimativa de engajamento.
- [ ] Calcular assuntos mais recorrentes/se aprofundados com sinais combinados: tempo estimado, frequência, recência e afinidade.
- [ ] Expor ao prompt apenas um resumo pequeno dos tópicos relevantes, incluindo confiança e recência.
- [ ] Usar linguagem honesta: “assunto mais conversado” ou “maior familiaridade estimada”, não afirmar domínio técnico sem evidência.
- [ ] Persistir métricas no estado/tópico sem quebrar documentos antigos; adicionar defaults e migração compatível.

## Etapa 7 — Contrato de contexto para a IA

- [ ] Criar um construtor de contexto testável, independente de HTTP e de acesso ao banco.
- [ ] Enviar somente: mensagem atual, estado validado, traços/preferências, experiência, poucos tópicos e memórias selecionadas.
- [ ] Separar instruções estáveis, contexto recuperado e pedido do usuário para reduzir ambiguidades.
- [ ] Definir esquema versionado de saída estruturada e validar cada campo.
- [ ] Tratar resposta da IA como proposta: cálculos, permissões, persistência e ações são controlados pelo backend.
- [ ] Limitar tamanho de mensagens, memória e resposta para proteger latência e custos.
- [ ] Ter fallback consistente quando o provedor falhar ou retornar conteúdo fora do esquema.

## Etapa 8 — Fechamento da Fase 1

- [ ] Testes unitários e de integração passam localmente.
- [ ] Conversas e estado sobrevivem a reinicialização com MongoDB disponível.
- [ ] Chat segue funcionando em modo degradado sem MongoDB.
- [ ] Web e Alexa usam o mesmo pipeline e mantêm contratos compatíveis.
- [ ] Memória por data/tag retorna evidências corretas e não inventa fatos.
- [ ] Estado em RAM evita leituras repetidas de estado no banco.
- [ ] Preferências e familiaridade evoluem de forma gradual, explicável e persistente.
- [ ] Logs e respostas não expõem secrets.
- [ ] README e documentação descrevem exatamente o comportamento implementado.
- [ ] Revisão final confirma que nenhuma rota ou integração existente foi removida acidentalmente.

## Próximo incremento recomendado

1. Criar testes de regressão para o fluxo atual antes de refatorar.
2. Medir e registrar chamadas atuais ao Mongo para definir cache/invalidação sem adivinhar.
3. Consolidar estado operacional em RAM mantendo Mongo como persistência.
4. Formalizar o construtor de contexto e o esquema validado da resposta da IA.
5. Implementar métricas de assuntos como estimativas e só então apresentá-las como familiaridade.
