## Why

As abas Diários, Tarefas e Hábitos ainda usam o Mapa em CSS com arte provisória. A ideia é reaproveitar os cenários do QG: o personagem escolhido anda enquanto o cenário rola atrás, dando a sensação de caminhada. A praia vem primeiro, para refinar o efeito antes dos outros cenários.

## What Changes

- Protocolo: `sceneKindSchema` ganha `journey` (`qg`, `journey` e `map`). `INIT` com `scene: 'journey'` usa `sceneKey` como id do cenário, `timeOfDay` como hora e `character` como no QG. Os demais campos e mensagens não mudam.
- Banner: o motor do QG ganha o modo jornada (`QgState.journey`, `QgState.stop`). O personagem começa no lado esquerdo, virado para a direita, e o cenário rola para a esquerda (andar 34 px/s). O progresso do capítulo vira uma de 6 paradas; ao marcar um item que muda de parada, o personagem corre até ela (cenário acelera para 80 px/s), fica ali e volta a andar. Na última parada a caminhada e o cenário param e um portal abre no lado direito. Um cenário implementa `journey(env)`; sem ele, a jornada mostra o cenário parado com o personagem andando no lugar. Hoje só a praia tem `journey`, com trechos variados (cadeira e canga, duas cadeiras, canga com cooler).
- App: nova preferência `storyScenario` (cenário da história principal, só neste aparelho), escolhida em Home > Ambiente logo abaixo do cenário do QG; as abas passam a enviar `scene: 'journey'`. O cenário "Topo do prédio" passa a se chamar "Cidade" (QG e história). A cabana não existe como cenário da história.
- App: itens de exemplo (5 diários, 5 tarefas, 5 hábitos) criados uma vez, na primeira abertura sem nenhum item, pela API existente (`POST /items`).

## Impact

- `packages/contracts` (enum), `apps/banner` (motor, cena, controlador, laboratório com modo "Jornada"), `apps/mobile` (store, controles, TabScreen, exemplos). Sem migration e sem rota nova na API. Bundle em 732 KB (limite 1,5 MB), com a animação de andar embutida.

## Segurança

Sem rede no banner, sem estado persistente e sem mensagem nova. Cenário desconhecido cai no padrão. Os itens de exemplo passam pela mesma validação de qualquer item criado pelo usuário.

## Fora do escopo

Jornada dos outros seis cenários, a cena Mapa em CSS (segue no banner até a remoção) e o que acontece ao atravessar o portal.
