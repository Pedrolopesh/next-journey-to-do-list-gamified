# Fase 5 — Loop completo (Marco 2): registro de conclusão

- Início: 2026-10-09
- Fim: 2026-10-09
- Status: concluída em código; falta o teste de ponta a ponta em aparelho com a API hospedada

## Critérios de pronto (Marco 2)

| Critério | Evidência |
|---|---|
| Pessoa nova faz onboarding, cria personagem, escolhe história, cria itens dos três tipos, marca, desfaz, sobe de nível e conclui um capítulo | API: 68 e2e cobrem cada passo (inclusive concluir capítulo e história, nível e conquistas); app: telas de todo o fluxo, bundle Android gerado e `expo-doctor` 21/21; roteiro manual em `docs/QA.md` |
| RFs da matriz atribuídos às Fases 4 e 5 | RF-01 a 07, 09 a 21, 23 a 25, 27 a 30, 32 a 38 atendidos; RF-03 e RF-04 prontos no código, dependem dos client ids (Fase 0); RF-22 e RF-26 (desejáveis) ficam para depois |
| CI verde | `turbo run lint typecheck test build` (16 tarefas), 68 e2e com Postgres de serviço e varredura de segurança |

## Passos

| Passo | O que significa | Estado |
|---|---|---|
| 1 | Login com Google e Apple (ID token validado no servidor) | feito; precisa dos client ids da Fase 0 para testar com contas reais |
| 2 | Onboarding: tutorial, personagem, história; retoma do passo onde parou | feito |
| 3 | Personagem com prévia no banner e cosméticos de conquista | feito |
| 4 | Histórias: catálogo, escolha e troca preservando o progresso | feito (5 histórias, 25 capítulos provisórios) |
| 5 | CRUD de itens (criar, editar, excluir logicamente) | feito; "arquivar" não está em nenhum RF e não foi implementado |
| 6 a 8 | Tarefas, diários (atraso, sequência, badge) e hábitos (sem limite, contadores) | feito |
| 9 | Desfazer só no mesmo dia, com mensagens claras | feito |
| 10 | Progressão: barra no topo, transição de capítulo, modais de nível, conquista e capítulo | feito |
| 11 | Perfil, conquistas, minha história e configurações | feito |
| 12 | Fuso horário no cadastro e alterável | feito |
| 13 | Todos os textos em i18next (pt-BR) | feito |
| 14 | Estados: skeleton, vazio e erro nas listas | feito |
| 15 | Testes e2e da API, de componente e roteiro de regressão | feito (`docs/QA.md`) |
| 16 | Revisão do `game_config` inicial | valores mantidos (ADR-0004) |
| 17 a 22 | Recuperação de senha, categorias, conquistas, Home agregada, Minha história, aceite de termos | feito |

## Desvios do plano

- Pré-requisito de design: Conquistas, Minha história, Categorias e Configurações foram feitas com o design system existente (tokens e componentes), sem tela no Figma ainda. Revisar quando as telas forem desenhadas.
- Prazo de tarefa por atalhos, sem seletor de data.
- O personagem usa a combinação de chaves LPC; a arte final (sprites) é da Fase 6.

## Pendências herdadas

- Client ids do Google e da Apple (Fase 0) para validar o login social de ponta a ponta.
- Teste em aparelho físico contra a API hospedada (VPS auditada).
- Medição do banner e ADR-0003 (obrigatório antes de concluir todas as implementações).
- Notificações locais, fila offline e verificação de e-mail no cadastro (Fase 7).
