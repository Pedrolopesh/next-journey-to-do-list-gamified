## Why

As abas Diários, Tarefas e Hábitos ainda usam o Mapa em CSS com arte provisória. A ideia é reaproveitar os cenários do QG: o personagem escolhido anda para a esquerda enquanto o cenário rola atrás, dando a sensação de caminhada. A praia vem primeiro, para refinar o efeito antes dos outros cenários.

## What Changes

- Protocolo: `sceneKindSchema` ganha `journey` (`qg`, `journey` e `map`). `INIT` com `scene: 'journey'` usa `sceneKey` como id do cenário, `timeOfDay` como hora e `character` como no QG. Os demais campos e mensagens não mudam.
- Banner: o motor do QG ganha o modo jornada (`QgState.journey`): personagem andando virado para a esquerda, cenário com `scroll` que avança com a animação (andar 34 px/s, correr 72 px/s ao comemorar um check). Um cenário implementa `journey(env)`; sem ele, a jornada mostra o cenário parado com o personagem andando no lugar. Hoje só a praia tem `journey`.
- App: nova preferência `storyScenario` (cenário da história principal, só neste aparelho), escolhida em Home > Ambiente logo abaixo do cenário do QG; as abas passam a enviar `scene: 'journey'`. O cenário "Topo do prédio" passa a se chamar "Cidade" (QG e história). A cabana não existe como cenário da história.
- App: itens de exemplo (5 diários, 5 tarefas, 5 hábitos) criados uma vez, na primeira abertura sem nenhum item, pela API existente (`POST /items`).

## Impact

- `packages/contracts` (enum), `apps/banner` (motor, cena, controlador, laboratório com modo "Jornada"), `apps/mobile` (store, controles, TabScreen, exemplos). Sem migration e sem rota nova na API. Bundle em 732 KB (limite 1,5 MB), com a animação de andar embutida.

## Segurança

Sem rede no banner, sem estado persistente e sem mensagem nova. Cenário desconhecido cai no padrão. Os itens de exemplo passam pela mesma validação de qualquer item criado pelo usuário.

## Fora do escopo

Jornada dos outros seis cenários, a cena Mapa em CSS (segue no banner até a remoção) e a posição do personagem pelo progresso do capítulo.
