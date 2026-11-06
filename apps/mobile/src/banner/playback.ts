/**
 * The banner only animates with the app in the foreground, without the "reduce motion" preference and with the
 * screen in focus (out-of-focus tabs stay mounted but paused, to save battery).
 */
export function shouldPlay(appState: string, reduceMotion: boolean, focused = true): boolean {
  return appState === 'active' && !reduceMotion && focused;
}
