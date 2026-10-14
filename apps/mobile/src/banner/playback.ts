/**
 * O banner só anima com o app em primeiro plano, sem a preferência "reduzir movimento" e com a
 * tela em foco (abas fora de foco ficam montadas, mas paradas, para não gastar bateria).
 */
export function shouldPlay(appState: string, reduceMotion: boolean, focused = true): boolean {
  return appState === 'active' && !reduceMotion && focused;
}
