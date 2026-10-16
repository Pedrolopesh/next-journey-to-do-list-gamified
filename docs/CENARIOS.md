# Cenários do banner: regras de construção e de checagem

Vale para criar, mudar ou revisar qualquer cenário em `apps/banner/src/qg/scenes` (QG parado e jornada com o cenário rolando) e seus níveis. Cada regra abaixo vem de um defeito que já apareceu e foi corrigido; o objetivo é não repeti-lo. Lido junto com `AGENTS.md`.

## 1. Como um cenário é montado

- Quadro lógico de 390×220 px (`SCENE_W`, `SCENE_H`). O personagem fica com os pés em `groundY` do cenário.
- `back` (QG) e `journey` (jornada, rola com `env.scroll`) desenham o cenário. `front` desenha o que fica na frente do personagem no QG.
- **Níveis** (1 a 5, um por capítulo da história): `levels`, `levelInfo` (nome, descrição e lista do que muda), `levelBack`, `levelFront`, `levelLights`, e as pessoas em `extrasFor` (QG) e `journeyExtrasFor` (jornada). O nível 1 é o cenário base; os seguintes só acrescentam ou trocam coisas. Nunca remova do nível 1 o que o app já usa.
- Objetos de nível vivem num arquivo `<cenario>-levels.ts`, com listas de posições separadas para o QG e para a jornada (a jornada usa posições do mundo e um ciclo).
- Tudo que aparece no laboratório (`#cenarios`) vem de `SceneDef`; o laboratório não tem lista própria de níveis.

## 2. Profundidade (o erro mais repetido)

1. **Ordem de desenho é pela altura dos pés (`y`).** Quem tem os pés acima da linha do personagem fica atrás dele; quem tem os pés abaixo, na frente. O motor já ordena os figurantes; objetos de cenário com `y` abaixo de `groundY` vão em `levelFront`, os demais em `levelBack`.
2. **Quem passa pelo personagem usa uma faixa própria.** Pessoas e coisas que andam não podem dividir a mesma altura dos pés com quem está parado ou com o personagem: separe por pelo menos 12 px. Caminhantes em faixas diferentes (e velocidades diferentes) para não andarem grudados.
3. **Fundo é mais alto na tela, frente é mais baixa.** Para parecer mais ao fundo: pés mais acima, tamanho menor e movimento mais lento (paralaxe), nunca só mover.
4. **Nada fica em cima de outra coisa sem ser de propósito.** Conferir sobreposição entre: fogueira e bar, poste e casal, quiosque e palmeira, candelabro e armadura, banco e pessoa.
5. **Coisas em terra não ficam na água.** Prédios, postes e casas precisam de chão: calçada, rua, margem ou areia. Um prédio com a base dentro de um lago ou do mar é defeito. Se o fundo é cidade ao lado da água, desenhe a margem e a rua entre eles.

## 3. Movimento e animação

1. **Posição sempre inteira.** Arredonde `x` e `y` antes de desenhar (`Math.round`), principalmente nas formas em vetor (traços e arcos): posição fracionária treme ao rolar.
2. **A fase de uma animação nunca depende da posição na tela.** `Math.sin(t + x)` com `x` que muda ao rolar faz o objeto ondular rápido enquanto o personagem anda. Use uma fase fixa por objeto (índice, `lean`, semente).
3. **Balanço suave e curto.** Folhas, bandeiras e chamas: amplitude de 1 px ou menos, período de vários segundos. Prefira passos discretos de 1 px a movimento fracionário.
4. **Objetos raros têm ciclo longo.** O que é grande ou chamativo (píer, fogueira com a turma, ponte, ponto de ônibus) usa um ciclo de 1800 px ou mais; senão parece que aparece o tempo todo. Dois objetos que não podem se encontrar (fogueira e bar) andam no mesmo ciclo, com distância fixa entre eles.
5. **Camadas distantes rolam devagar** (fator 0,03 a 0,5), cada uma com ciclo próprio. Objetos presos a um mesmo grupo (píer e barcos amarrados) rolam com o mesmo fator.
6. **Ao dar a volta no ciclo, o objeto some fora da tela** (use `scrolled`, que tem margem de 100 px) e nunca no meio dela.
7. **Veículos andam na pista e na direção dos faróis.** Carro e ônibus têm frente, traseira, rodas nas pontas e vão no sentido da frente.

## 4. Desenho de objetos reconhecíveis

- Cada objeto precisa ser lido de relance. Ônibus: carroceria longa, fileira de janelas, para-brisa grande, porta, letreiro, duas rodas em cavas escuras, para-choque. Torre: lados com perspectiva e janelas em grade. Bandeirinhas presas em algo (nunca soltas no ar).
- Contorno escuro de 1 px nos objetos principais, luz em cima e sombra embaixo.
- Escala: um adulto tem cerca de 44 px de altura. Quiosque, bar e carro são maiores que isso; banco e poste têm que ter proporção.
- Janelas, tijolos, folhas e pedras seguem uma semente fixa por objeto (nunca `Math.random()` no quadro).

## 5. Pessoas e figurantes

- No QG, `extrasFor`; na jornada, `journeyExtrasFor` (posições do mundo, `drift` para quem anda, `period` próprio para quem acompanha um objeto raro).
- Pelo menos 3 ou 4 pessoas por nível na jornada a partir do nível 2, entre paradas e caminhando; no mínimo duas junto de um ponto de reunião (fogueira, mesa), uma delas olhando para o ponto.
- Quem fica junto de um objeto fica **mais ao fundo** que o caminho do personagem.

## 6. Luz e hora do dia

- Cada nível precisa ficar certo de manhã, à tarde e à noite. Luzes só acendem à noite, exceto o que é fogo ou lâmpada de dentro.
- Luzes seguem a posição na tela do objeto (inclusive na jornada) e usam o mesmo ciclo dele.

## 7. Desempenho

- Orçamento de ordem de grandeza: algumas centenas de retângulos e algumas dezenas de traços por quadro. Evite criar objetos ou gradientes novos a cada quadro; guarde o que não muda.
- O motor limita os quadros por segundo; não dependa de passos de tempo fixos.

## 8. Protocolo de checagem (obrigatório antes de dizer que um cenário ou nível está pronto)

Fazer no laboratório (`pnpm --filter @nextjourney/banner exec vite --port 5173`, depois `http://localhost:5173/lab.html#cenarios`):

1. Para cada nível: **QG nas três horas** (manhã, tarde, noite).
2. Para cada nível: **jornada em pelo menos 3 momentos distintos** (o personagem andando por alguns segundos entre as capturas), e de dia e de noite. Um único quadro não prova nada: os defeitos de profundidade e de ciclo só aparecem quando as coisas se cruzam.
3. Olhar de propósito: prédio ou objeto na água; objeto sobre objeto; pessoa sobre o personagem fora de ordem; objeto que aparece o tempo todo; tremida; elemento cortado na borda; veículo com forma estranha; luz no lugar errado.
4. Conferir que o nível 1 continua igual ao que o app usa.
5. `pnpm exec turbo run lint typecheck test build` (16 de 16) e `FULL=1 pnpm run security:full` antes de qualquer PR.
6. Relatar ao Pedro o que foi visto e o que não foi.

Testes automáticos: `scenes.test.ts` confere que todo cenário com níveis tem `levelInfo` completo, e `extras.test.ts` cobre as posições dos figurantes.
