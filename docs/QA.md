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

## 4c. Jornada das abas (Diários, Tarefas, Hábitos)
- [ ] O banner mostra o personagem escolhido andando no lado esquerdo; na praia, o mar, a ilha, a areia e os objetos passam atrás dele, variando (cadeira e canga, duas cadeiras, canga com cooler).
- [ ] Home > Ambiente mostra "Cenário da história principal" abaixo do cenário do QG, sem a cabana e com "Cidade" no lugar de "Topo do prédio".
- [ ] Trocar o cenário da história muda as três abas; a hora (automática ou fixa) vale na jornada.
- [ ] Marcar um item que muda de parada faz o personagem correr até a parada (cenário acelera) e voltar a andar ali; são até 6 paradas.
- [ ] Na última parada o personagem e o cenário param e um portal aparece no lado direito.
- [ ] Na primeira abertura sem itens aparecem 5 diários, 5 tarefas e 5 hábitos de exemplo e um toast avisa.

## 4b. QG da Home (cenário e personagem)
- [ ] A Home mostra o QG (cenário parado com o personagem) e o personagem salvo, com a hora do aparelho (manhã, tarde ou noite).
- [ ] "Ambiente" na Home abre cenário e hora; trocar muda o banner na hora e mostra toast; o valor continua depois de fechar o app.
- [ ] "Personagem" abre a edição com a prévia fixa no topo; cada opção (corpo, pele, cabelo e cor, roupa, calça, calçado e cores) muda a prévia.
- [ ] Nome e título ficam por último no formulário; salvar mostra toast e a Home já mostra o novo visual.
- [ ] Fazer um check na Home faz o personagem comemorar; fechar o capítulo escurece e abre o modal depois.
- [ ] Em aparelho de entrada, o QG roda fluido (cerca de 30 quadros por segundo) e para em segundo plano e com "reduzir movimento".
- [ ] Créditos (Configurações) lista a arte LPC com autor e licença.

## 5. Perfil
- [ ] Nível, EXP, moedas, conquistas (progresso e estado), Minha história (check, borda roxa, cadeado).
- [ ] Personalizar personagem: cosmético liberado por conquista aparece disponível.
- [ ] Configurações: trocar o fuso muda o "hoje"; lembrete aceita HH:MM; categorias (limite de 10, destino ao excluir).

## 6. Estados e acessibilidade
- [ ] Listas mostram skeleton ao carregar, vazio com dica e erro com "Tentar de novo".
- [ ] Alvos de toque de 44 pt; rótulos lidos pelo leitor de tela (TalkBack/VoiceOver) nos checks e botões.
- [ ] Fonte maior do sistema (até 130%) não corta textos.

## 7. Portão da loja: feedback de toda ação (RN-FB)

Bloqueia o envio às lojas. Percorra **cada tela e cada botão** e confirme, com a API ligada e também desligada (ou em modo avião):

- [ ] Ao tocar, o botão mostra carregando (e não aceita segundo toque) ou a tela muda na hora.
- [ ] Sucesso: aparece toast de sucesso ou uma mudança visível e óbvia.
- [ ] Erro (sem rede, API fora, dado inválido): aparece toast de erro com texto claro; o botão volta ao normal.
- [ ] Formulário inválido (campos vazios, senha fraca, termos não aceitos): cada campo mostra sua mensagem e o toast avisa; o botão nunca "não faz nada".
- [ ] Telas e botões cobertos: cadastro, login, entrar com Google/Apple, esqueci a senha, nova senha, tutorial, personagem, escolha de história, criar/editar/excluir item, check e desfazer, categorias (criar, renomear, excluir), configurações (fuso, lembrete), excluir conta, sair, botões "Tentar de novo".
- [ ] Nenhuma tela fica parada sem resposta depois de um toque. Se achar uma, é bloqueio.
