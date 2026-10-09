/** O banner só anima com o app em primeiro plano e sem a preferência "reduzir movimento". */
export function shouldPlay(appState: string, reduceMotion: boolean): boolean {
  return appState === 'active' && !reduceMotion;
}
