## 1. Contratos e domínio (testes primeiro)

- [x] 1.1 `gameConfigSchema`: trocar `levelExpSlope/levelExpOffset` por `levelExpTable` e `undoCoinPenalty`; padrão com 200..1000 e 3, 5, 10, 15, 20; atualizar `contracts.test.ts`
- [x] 1.2 `expParaNivel` pela tabela (teto no último valor) e testes
- [x] 1.3 `desfazerCheck`: sem trava de dia e capítulo; EXP intacto; perda de moedas por capítulo; testes por propriedade atualizados
- [x] 1.4 `aplicarCheck`: capítulo para no último e história concluída; nível segue; testes

## 2. API

- [x] 2.1 `checks.service`: EXP 0 no recheck do mesmo item e dia; desfazer sem trava, recalculando `lastCheckedOn` e sequência; resultado com `coinsGained` negativo
- [x] 2.2 Seed do `game_config` com os valores novos; e2e (marcar, desmarcar, rechecar, outro dia, capítulo fechado, IDOR)
- [x] 2.3 Conquistas continuam avaliadas depois do desfazer (sem revogar)

## 3. App

- [x] 3.1 Toast de marcar com EXP e moedas (inclui "+0 EXP") e toast amarelo de desmarcar (`warning`) com i18n
- [x] 3.2 `use-check-flow`: desfazer sem mover o personagem e sem travas; limitar cena ao capítulo 5
- [x] 3.3 `journeyView`: história concluída fica no fim, sem portal
- [x] 3.4 Atualizar testes do mobile

## 4. Laboratório e docs

- [x] 4.1 Página "Moedas e EXP" lê os valores do contrato
- [x] 4.2 `docs/REQUISITOS.MD` e `docs/COMO-FUNCIONA.md` com a regra nova

## 5. Verificação

- [x] 5.1 lint, typecheck, test, build, e2e e `security:full`
- [ ] 5.2 Conferir no emulador: marcar, desmarcar (aviso amarelo), recheck com +0 EXP
