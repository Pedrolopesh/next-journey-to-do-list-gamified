# Roteiro manual de regressão

Roda antes de cada release e depois de mudanças grandes. Pré-requisitos: API local no ar com o seed aplicado (`pnpm --filter @nextjourney/api db:deploy && db:seed`), app em development build (emulador Android ou aparelho).

Marque cada item e anote data, versão e aparelho no `docs/DIARIO.md`.

## 1. Conta e sessão
- [ ] Cadastro com senha fraca: o checklist mostra o que falta e o botão não envia.
- [ ] Cadastro válido leva ao onboarding. E-mail repetido mostra mensagem genérica.
- [ ] Login com senha errada e com e-mail inexistente mostram a mesma mensagem.
- [ ] Fechar e abrir o app mantém o login (splash enquanto verifica).
- [ ] Sair (Perfil) volta ao login e não deixa dados da conta anterior.
- [ ] Esqueci a senha: sempre confirma o envio; o link abre a tela de nova senha e a senha antiga para de valer.
- [ ] Com Google/Apple configurados: login cria a conta no primeiro acesso e entra na mesma conta depois.

## 2. Onboarding
- [ ] Tutorial de 3 slides, pulável; não reaparece depois.
- [ ] Fechar o app no meio e reabrir retoma do passo onde parou.
- [ ] Personagem: a prévia muda ao escolher; itens bloqueados não podem ser escolhidos.
- [ ] História: 5 opções; as abas só liberam depois de escolher.

## 3. Itens
- [ ] Criar diário (dias da semana), tarefa (prazo rápido) e hábito; categoria e dificuldade.
- [ ] Editar e excluir (exclusão some da lista e mantém o EXP já ganho).
- [ ] Diários: atrasados no topo; sequência aparece; badge de pendentes na aba.
- [ ] Tarefas: agrupadas por categoria; filtro por pills; tarefa marcada sai da lista.
- [ ] Hábitos: marcar várias vezes; contadores de hoje e da semana.

## 4. Check, progressão e banner
- [ ] O check responde na hora (menos de 100 ms) e vibra; o toast mostra o EXP.
- [ ] O banner corre e avança; ao fechar o capítulo escurece e o modal do capítulo abre depois.
- [ ] Subir de nível abre o modal de nível; uma conquista abre o modal de conquista; os modais saem um de cada vez.
- [ ] Desfazer no mesmo dia devolve EXP e moedas; no capítulo fechado mostra o aviso.
- [ ] Sem internet, o check mostra erro claro e o item volta ao estado anterior (a fila offline é da Fase 7).

## 5. Perfil
- [ ] Nível, EXP, moedas, conquistas (progresso e estado), Minha história (check, borda roxa, cadeado).
- [ ] Personalizar personagem: cosmético liberado por conquista aparece disponível.
- [ ] Configurações: trocar o fuso muda o "hoje"; lembrete aceita HH:MM; categorias (limite de 10, destino ao excluir).

## 6. Estados e acessibilidade
- [ ] Listas mostram skeleton ao carregar, vazio com dica e erro com "Tentar de novo".
- [ ] Alvos de toque de 44 pt; rótulos lidos pelo leitor de tela (TalkBack/VoiceOver) nos checks e botões.
- [ ] Fonte maior do sistema (até 130%) não corta textos.
