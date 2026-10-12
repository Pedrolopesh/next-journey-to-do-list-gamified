# Créditos

Toda arte e todo som usados no Next Journey precisam estar listados aqui, com autor, licença e link.
O script `pnpm --filter @nextjourney/banner validate:assets` valida limites técnicos; a conferência
das licenças abaixo é manual e obrigatória antes de congelar a arte (Fase 6, passo 6).

## Arte atual

A cena Mapa do banner (usada nas abas de itens) ainda usa **placeholders originais do projeto** (formas simples em SVG), sem terceiros, a serem trocados pela arte final. A cena QG (Home) usa a arte LPC listada abaixo.

| Asset                                                          | Autor   | Licença | Origem           |
| -------------------------------------------------------------- | ------- | ------- | ---------------- |
| `layer-far`, `layer-mid`, `layer-ground`, `walker-placeholder` | Projeto | MIT     | Este repositório |

## Arte LPC (Liberated Pixel Cup)

> **Licença em destaque:** só entra arte LPC disponível em **CC0, OGA-BY 3.0 ou CC-BY**. Arte apenas CC-BY-SA ou GPL fica de fora (obrigaria compartilhar derivados). OGA-BY e CC-BY exigem **crédito aos autores**.
>
> O laboratório do personagem e da cabana (`apps/banner/lab`) usa arte LPC; a lista completa, com autores, licença usada e links, está em [`apps/banner/lab/CREDITS-LPC.md`](apps/banner/lab/CREDITS-LPC.md) (gerada pelo script de importação).

Os assets LPC já importados (camadas do personagem e tiles de cenário) estão em
[`apps/banner/lab/CREDITS-LPC.md`](apps/banner/lab/CREDITS-LPC.md), com autor, licença usada e link por arquivo:

| Grupo                                                   | Autor                                | Licença usada     | Link                                                                                                                                |
| ------------------------------------------------------- | ------------------------------------ | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Camadas do personagem (corpo, cabelo, roupas, calçados) | vários, listados em `CREDITS-LPC.md` | OGA-BY 3.0 ou CC0 | [Universal LPC Spritesheet Character Generator](https://github.com/liberatedpixelcup/Universal-LPC-Spritesheet-Character-Generator) |
| Tiles de cenário (`tileset/original/Sharm`)             | Lanea Zimmerman (Sharm)              | CC-BY 3.0         | [LPC Base Assets](https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles)                            |

Os demais elementos dos cenários (trono, cerca, helicóptero, postes, cabana, braseiros e similares) são
desenhados em código por este projeto, sem arte de terceiros.

Regras:

- Mantenha o texto de atribuição exato que o autor pede.
- CC-BY-SA e GPL têm obrigações de compartilhamento: confira a compatibilidade com a distribuição nas
  lojas (App Store e Google Play) antes de usar o asset.
- Arte derivada de um asset CC-BY-SA continua CC-BY-SA.
