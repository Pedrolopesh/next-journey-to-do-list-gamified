# Intera — Design no Figma (registro e guia de retomada)

> **Onde ficam as regras:** padrões de UI e armadilhas vivem em `.claude/skills/intera-figma/SKILL.md` (lido a cada sessão); a checagem automática está em `audit.js` (status bar, voltar em y=53, emoji, texto padrão, dificuldade fora do Chip, nomes suspeitos). Este arquivo é o **registro** (ids, histórico, pendências). Ao decidir algo novo com o usuário: atualizar SKILL.md + audit.js + aqui, **na mesma rodada**.

Documento **próprio do app Intera** (separado de `FIGMA-LELUME.md`, que é do Lêlume). Registra o diagnóstico, o que foi padronizado, as regras do design system e como retomar.

- **Arquivo Figma:** "Itera — Design System" · file key `TWYTMAkgcTFcS3ZfeM01Vd`
  https://www.figma.com/design/TWYTMAkgcTFcS3ZfeM01Vd/
  > **Nome final: Next Journey** (confirmado em 2026-10-02). A Splash (`5:18`) já foi trocada de "Intera" para "Next Journey". Pendente: renomear o arquivo "Itera — Design System" manualmente no Figma (a API de plugin não renomeia o arquivo) e decidir sobre os posts da página Social Midia, que ainda dizem "Intera". Onde este documento diz Intera, leia Next Journey.
- **Skill do projeto:** `.claude/skills/intera-figma/` (`SKILL.md`, `audit.js`)
- **Primeira aplicação do processo:** 2026-09-30 (mesmo método usado no Lêlume: backup → fundação → componentes → telas → auditoria → documentação)

## 1. Mapa do arquivo

| Página | ID | Conteúdo |
|---|---|---|
| Design System | `0:1` | Documentação visual: `Color Palette` `2:77`, `Typography` `2:204`, `Spacing & Radius` `2:230`, `Icons` `6:2` (Tabler 24×24, traço 1,75), `Pixel Art Assets` `6:173` (personagem LPC 64×64, ícones de conquista 32×32, banners 390×180/220, miniaturas de história 335×120, avatar 40×40) |
| Components | `2:2` | 30 componentes (lista abaixo + `Coin Idle` `101:1335`, `Chapter Caption` `102:37`, `Tip Card` `102:52`, `Player Header Card`) |
| Screens | `2:3` | 19 telas 390×844 (`01`, `03`–`17`, `19`, `20`, `22` + `09b`; **não existem `02`, `18` e `21`** — removidas a pedido; a `07 Escolha da História` tem 1117 de altura) + retângulos `image …`/`…_105_c` à esquerda (**referências de screenshot**, não são telas) |
| Icons | `67:768` | Vazia |
| **Rascunho** | `76:1306` (seção) | Backup das 21 telas **antes** da padronização (2026-09-30) |

### Telas (ids)
01 Splash `5:12` · 03 Cadastro `5:40` · 04 Login `5:86` · 05 Tutorial `5:121` · 06 Criação do Personagem `5:161` · 07 Escolha da História `5:198` · 08 Home `5:242` · 09 Diários `5:335` · 10 Tarefas `5:443` · 11 Hábitos `5:537` · 12 Perfil `5:628` · 13 Novo Item `5:718` · 14 Editar Item `5:757` · 15 Capítulo Concluído `5:808` · 16 Nível `5:827` · 17 Fim de História `5:837` · 18 Estados Vazios `5:866` · 19 Estado Offline `5:915` · 20 Toast `5:985` · 22 Esqueci Minha Senha `5:1084` · **09b Diário Concluído `104:1321`**. (Removidas: 18 Estados Vazios `5:866`, 21 Exclusão de Conta `5:1056` — originais no Rascunho `76:1306`.)

### Componentes (página Components)
Conjuntos (variantes): `Button` `2:404` (Variant × Size × State) · `Social Button` `2:475` (Provider=Apple|Google) · `Progress Bar` `2:486` · `Story Card` `18:22` · `Toast` `18:52` · `Difficulty Selector` `18:74` · `Week Day Selector` `18:120` · `Input` `21:37` (State × Type) · `Chip` `21:62` · `Task Item` `21:93` · `Daily Item` `21:123` · `Habit Item` `21:146` · `Banner` `21:165` (`Variant=Standard` 358×260 e `Variant=Home` 358×300) · `Check` `21:178`.
Componentes simples: `FAB` `17:2` · `Bottom Navigation` `17:6` · `Screen Header` `17:47` · `Level Up Modal` `17:55` · `Player Header` `17:91` · `Empty State` `17:101` · `Skeleton List` `17:117` · `Network Error` `17:138` · `Offline Indicator` `17:152` · `Bottom Sheet` `18:23` · `Appearance Selector` `21:179` · `Back Button` `52:781`.

## 2. Tokens

**Tema escuro** (coleção `Color`, modo único "Dark"). **Cores:** `bg/base #1a1a2e` · `bg/surface #16213e` · `bg/raised #0f3460` · `bg/sunken #12122a` · `brand/primary #7c3aed` · `brand/primary-light #a78bfa` · `brand/primary-dark #5b21b6` · `brand/gold #f59e0b` · `text/primary #f1f5f9` · `text/secondary #94a3b8` · `text/muted #94a3b8` · `text/on-primary #fff` · `border/subtle #1e293b` · `border/strong #334155` · `success #10b981` · `warning #f59e0b` · `danger #ef4444` · `info #3b82f6` · `easy/medium/hard` · `biome/{empreendedor,estudante,guerreiro,explorador,lenda}`.
> Várias variáveis têm **o mesmo valor** (`text/secondary = text/muted`, `brand/gold = warning = medium`, `brand/primary = biome/lenda`, `success = easy`…). Ao ligar uma cor pelo valor, **vale a primeira da lista** (ex.: `brand/primary`). Se o significado importar, escolha a variável semântica certa manualmente.

**Espaçamento** `space/4,8,12,16,20,24,32,40` + `space/screen-margin 16` · **Raio** `radius/sm 8, md 12, lg 16, pill 999, button 10, card 12` · **Tamanho** `size/touch-target 44`, `safe-area/top 47`, `safe-area/bottom 34`, `nav-bar-height 84`, `fab-size 52`, `input-height 48`, `button-height/L 50, M 40`, `check-size 28`, `icon-size 24`, `avatar-size 40`, `chip-height 24`, `progress-thin 4`, `progress-thick 12`.

**Text styles (21):** `display` Inter Bold 28 · `h1` SemiBold 22 · `h2` SemiBold 18 · `h3` SemiBold 16 · `body` Regular 14 · `body-strong` SemiBold 14 · `body-medium` Medium 14 · `body-lg` Regular 15 · `body-lg-medium` Medium 15 · `body-lg-strong` SemiBold 15 · `body-sm` Regular 13 · `body-sm-medium` Medium 13 · `caption` Medium 12 · `caption-regular` Regular 12 · `caption-strong` SemiBold 12 · `label-sm` SemiBold 11 (**sem** caixa alta) · `overline` SemiBold 11 (**MAIÚSCULAS, 4%**) · `micro` Medium 10 · `micro-strong` SemiBold 10 · `micro-regular` Regular 10 · `pixel-lg` Press Start 2P 14 · `pixel-sm` Press Start 2P 10. (Os 9 de `caption-strong` em diante, exceto `overline`/`pixel-*`, foram criados em 2026-09-30.) **Sem effect styles e sem paint styles.**

## 3. Diagnóstico (auditoria de 2026-09-30) e o que foi feito

| Achado | Antes | Depois |
|---|---|---|
| Variáveis com `ALL_SCOPES`, sem code syntax | 59 / 59 | Escopos por tipo (cores de texto → `TEXT_FILL`, `bg/*` → fills, `border/*` → traço+fill, Spacing → `GAP`, Radius → `CORNER_RADIUS`, Size → `WIDTH_HEIGHT`) e code syntax WEB `var(--nome-com-hifens)` |
| FAB passando da borda direita (x=355+52 > 390) | 3 telas (Diários, Tarefas, Hábitos) | `x = 390 − 16 − 52 = 322` |
| Componentes desenhados à mão (frames soltos) | 5× `Banner` (Diários, Tarefas, Hábitos, Estado Offline, Toast) | Instâncias de `Banner / Variant=Standard` (imagem de capa e progresso copiados; placeholder oculto) |
| Textos sem text style | 83 nas telas (+ componentes) | 1 não-emoji restante nas telas; componentes padronizados |
| Cores fixas | 173 nas telas; 361+ nos componentes | Ligadas às variáveis quando o valor é idêntico e a opacidade é 100% (restam só overlays com opacidade e pretos de emoji) |
| Texto padrão do componente vazando | `Rótulo` / `Placeholder` em **13 Novo Item** e **06 Criação do Personagem** | 13: rótulo interno oculto (já existe o rótulo externo) + placeholders "Ex.: Enviar relatório mensal" / "Detalhes da tarefa (opcional)"; 06: "Nome do personagem" / "Como você quer ser chamado?" — **textos propostos, confirmar** |

Estado final da auditoria nas 21 telas: **overflow 0 · componentes soltos 0 · 95 instâncias**. Fonte: `audit.js`.

## 4. Pendências e decisões em aberto
- **Placeholders de imagem (intencionais, "substituir por sprites reais"):** logo da Splash (96×96, `Logo Placeholder` `5:15`), ilustração do Tutorial, avatar do Perfil; existem assets prontos na página Design System (`Avatar`, `Character`, `Banners`, `Story Thumbnails`). A marca na Splash está como "QuestLife" (fonte pixel).
- **Player Header:** a Home usa o novo componente `Player Header Card` (card com margem, nível, moedas `Coin Idle`, EXP). O antigo `Player Header` (358×56) ainda é usado em 19/20 — decidir se migra para o Card ou se vira variante.
- **FAB cobre o conteúdo** da lista (badges de dificuldade à direita) em Diários/Tarefas/Hábitos/Home: padrão de FAB flutuante, mas avaliar `padding-bottom` da lista ou mover o FAB.
- **Line-height:** os styles do sistema usam altura de linha fixa (ex. `body` 20px, `h2` 24px); nós antes com `auto` passaram a seguir o sistema (até +3px de altura de texto). Conferir telas densas.
- ~~Telas sem barra de status~~ → resolvido em 2026-09-30 (instância `Status Bar` em todas; ver §7).
- Não há `02` na numeração; `07 Escolha da História` (1117) é rolável por design?
- Código/Code Connect não configurado.

## 5. Armadilhas (já ocorreram aqui)
1. **Opacidade some quando a cor está ligada a variável** → não ligar paints com opacidade < 1 (overlays, `@0.15` etc.).
2. **Estilo com caixa alta/espaçamento muda o texto:** `overline` (UPPER, 4%) foi aplicado por engano em textos de 11px que eram em caixa normal (badges). Antes de aplicar um style em lote, **compare `textCase`, `letterSpacing`, `lineHeight`** com o original (o backup no Rascunho serve de gabarito). Para 11px SemiBold sem caixa alta use `label-sm`.
3. **`findAll` não inclui o próprio nó:** ao padronizar um componente, trate também o nó raiz e cada variante (`COMPONENT_SET.children`), senão as instâncias ficam sem a cor ligada.
4. Dentro de instância não se sobrescreve `x/y/rotation`; sobrescreve-se texto, visibilidade, fills e tamanho.
5. Antes de apagar/substituir, comparar com o backup do Rascunho; paints precisam preservar `visible`/`opacity` (passar o paint original a `setBoundVariableForPaint`).
6. Erro no meio do script desfaz o script inteiro: usar guardas de idempotência.

## 6. Como retomar numa nova conversa
> "Estou continuando o trabalho de layout do app Intera no Figma. Leia `FIGMA-INTERA.md` e use o skill `intera-figma`. Arquivo `TWYTMAkgcTFcS3ZfeM01Vd`. Quero [ajustar tela X / criar componente Y / auditar tudo]."

Checklist quando algo sair errado: rodar `audit.js` → conferir armadilhas 1–3 → conferir se o elemento deveria ser instância → comparar com o backup do Rascunho.

## 6. Mapas/cenários por jornada (2026-09-30)
- Os mapas corretos são os 5 retângulos `Banner` (358×80, fill IMAGE) da tela `07 Escolha da História` (de cima para baixo: Empreendedor `53:781`, Estudante `53:782`, Guerreiro `53:783`, Explorador `53:784`, Lenda `53:785`).
- Como o app mostra a jornada do Empreendedor, aplicado o mapa do Empreendedor (hash `cd75bbd3…`, scaleMode FILL) nos `banner-image` das instâncias de Banner em 09 Diários, 10 Tarefas, 11 Hábitos, 19 Offline, 20 Toast e no `Banner Area` (`37:899`) da 08 Home. O componente `Banner` não guarda a imagem (só as instâncias).
- Não alterado: fundo da 06 Criação do Personagem (é a tela de customização, não um mapa).
- Trocar de jornada = trocar o fill IMAGE do `banner-image` pelo hash do mapa correspondente.

### 6.1 Run Scene vertical (2026-09-30)
- `Run Scene — Empreendedor` (`86:769`, página Screens, x≈2700): 390×844, recorte vertical do mapa do Empreendedor (imagem 1024² escalada a 1500, offset -540/-312) + fades topo/base, 8 `speed-line` e corredor (`runner` = `walk-frame-2` ×1,5 com 2 `runner-trail-*` em opacidade para efeito de movimento).
- Home: `Banner Area` (`37:899`) contém um clone `run-scene` (y=-520, `layoutPositioning=ABSOLUTE`, fades ocultos). Banners de Diários/Tarefas/Hábitos/Offline/Toast: fill `CROP` do mapa original (hash `cd75bbd3…`, transform `[[.34,0,.33],[0,.34*h/w,.55]]`).
- Armadilha: `figma.createImage(bytes)` NÃO persiste entre chamadas e não renderizou (fill em branco) — não usar export→imagem; usar o hash original ou clonar o frame.

## 7. Rodada de 2026-09-30 (status bar, back, badges, perfil)
- **Telas removidas:** 18 Estados Vazios e 21 Exclusão de Conta (originais seguem no backup do Rascunho). A linha "Excluir conta" também saiu do Perfil.
- **Status Bar:** instância da biblioteca (`Status Bar`, variante `Theme=Dark` = ícones brancos), 390×47, em todas as telas (substitui o frame vazio de 47px; em 13/15/16 fica absoluta sobre o modal; em 17/19/20/22 inserida no topo).
- **Back Button** (`52:781`): 44×44, círculo "glass" (branco 10% + borda 18% + blur/sombra), chevron 10×18 traço 2,5 arredondado. `Left/Right Action` do Screen Header agora 44. Padrão do topo: status bar 47 → back em y=53, x=16 (verificado nas 8 telas com voltar).
- **Badges de dificuldade:** `Chip` (Easy/Medium/Hard) restilizado (24px, pill, tint 14% + borda 35% + ponto, `label-sm`) e usado dentro de Task/Daily/Habit Item como instância aninhada `difficulty-chip` (trocar com `setProperties({Type:'Easy'|'Medium'|'Hard'})`). Os botões de Difficulty Selector (13/14) são outro componente e não foram alterados.
- **Home:** emojis → ícones (calendar-check, list-check, flame), avatar = cabeça do `avatar-40x40`; `Daily Item` usa ícone `flame` no lugar do 🔥.
- **12 Perfil:** reconstruído (hero card com avatar, Nv., chip da jornada, barra de EXP e moedas; 3 stats; 4 conquistas com sprites; lista de configurações com ícones e "Sair").
- **22 Esqueci Minha Senha:** aviso de e-mail enviado virou bottom sheet (backdrop 60% + sheet derivado do `Bottom Sheet`, desanexado).
- Armadilhas: screenshots do `get_screenshot` às vezes vêm de antes da edição (repetir); um script renomeou o frame 09 para "q" (restaurado) — conferir nomes após lotes grandes; `createImage` não persiste.

## 8. Home v2 + tela de recompensa (2026-10-01)
- **Novos componentes (Components):** `Coin Idle` (`101:1335`, moeda pixel-art 24×24, 4 frames de giro; usar `Frame=1` como estático), `Chapter Caption` (`102:37`, legenda "Cap. N + barra + %" sobre o banner, fundo `bg/base`, borda e sombra), `Tip Card` (`102:52`, `Type=Dica|Motivação`).
- **08 Home:** Player Header virou card (margem 16, raio 16, borda, sombra; pílula "Nv." + pílula de moedas com `Coin Idle`; "Faltam 65 EXP"); `Chapter Caption` no lugar da barra roxa; seção "Dicas para você" (carrossel de `Tip Card`) antes de "Próximos itens".
- **09b Diário Concluído** (`104:1321`, logo à direita da 09): 1º diário em `State=Done`, backdrop + `Reward Sheet` (cabeçalho dourado com troféu, XP +15, moedas +5, história +8% com barra 30%→38%, botões Continuar / Ver minha história). Telas 10–12 deslocadas +430 em x.
- Perfil: moeda do hero agora é `Coin Idle`.

- `Chapter Caption` (2026-10-01): barra 366×30 com laterais em diagonal (vetor `slant-bg`, recorte 8px), colada no rodapé do banner (`y = altura do banner − 30`), `x=12`.
- `Chapter Caption`: corrigido para **trapézio sem borda** (vértices `(10,0) (W-10,0) (W,H) (0,H)`), padding lateral 24.
- 13 Novo Item / 14 Editar Item: linha de dificuldade desenhada à mão substituída por instância de `Difficulty Selector` (novo componente com estrelas; 13=`Medium`, 14=`Hard`).

## 9. Protótipo navegável (2026-10-01)
**Pontos de partida (flows):** App (01 Splash), Home (08), Estado offline (19).
**Mapa:** 01 → e-mail 04 · registrar 03 · social 05 | 03 → 05 | 04 → Entrar 08 · Esqueci 22 · Criar conta 03 | 05 → 06 → 07 → 08 | 08 → FAB 13 · Daily 09b · Task 14 · Habit 20 (toast) · Cap. caption 15 · header 12 | 09/10/11 → FAB 13 · item 14 (1º diário da 09 → 09b) · voltar 08 | 09b → Continuar 09 · Ver história 15 · fechar 09 | 12 → Editar personagem 06 · Trocar história 07 · Sair 04 | 13 → Salvar 08 · tocar fora (voltar) | 14 → Salvar/Arquivar/Excluir 10 · voltar | 15 → 16 → 17 → 07 / 12 | 19 → Tentar de novo 08 | 20 → toast 08 | 22 → Enviar link 22b | 22b → Voltar ao login 04 · tocar fora 22. Abas do Bottom Navigation levam a 08/09/10/11/12 em todas as telas que as têm.
**Scroll:** 08 Home e 07 (vertical; status bar, FAB, nav e CTA fixos), `Tips Carousel` da Home (horizontal). Novas telas: `22b E-mail Enviado` (`115:1932`); a 22 passou a ser só o formulário.
**Limitações:** não existe uma ação de "entrar offline" — a 19 só é alcançável pelo ponto de partida próprio; a 20 pelo toque no hábito da Home.

## 10. Página "Social Midia" (2026-10-01)
Carrossel LinkedIn #1 (6 slides 1080×1350 + legenda) montado com clones das telas e do `Coin Idle` (cores da marca; Press Start 2P no logo/números). Texto também em `social-media/linkedin-01-construindo-o-intera.md`. Regras: telas clonadas **sem reações** de protótipo; manter números do post em sincronia com o arquivo (21 telas, 30 componentes, 59 variáveis).
- Post #2 (origem/ideia) na mesma página, linha abaixo do #1 (frames `P2 Slide N`, legenda `P2 Legenda`); texto em `social-media/linkedin-02-a-ideia-por-tras-do-intera.md`. Ordem sugerida: #2 (origem) antes do #1 (bastidores).
