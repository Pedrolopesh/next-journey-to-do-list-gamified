import { createMapScene } from './scene/map';

const banner = document.getElementById('banner');
if (!banner) throw new Error('Elemento #banner não encontrado');

const scene = createMapScene(banner);
// Posição inicial de teste (a posição real chega do app em INIT, passo 11 da Fase 2)
scene.setProgress(0);

// Só para o painel de debug (dev.html) no desenvolvimento
if (import.meta.env.DEV) {
  (window as unknown as { __scene: typeof scene }).__scene = scene;
}
