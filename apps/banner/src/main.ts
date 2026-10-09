import { listenToApp, sendToApp } from './bridge';
import { createBannerController } from './controller';
import { createMapScene } from './scene/map';

const root = document.getElementById('banner');
if (!root) throw new Error('Elemento #banner não encontrado');

const scene = createMapScene(root);
const controller = createBannerController({
  scene,
  root,
  send: sendToApp,
  bannerVersion: __BANNER_VERSION__,
});

listenToApp(
  (message) => {
    controller.handleMessage(message);
  },
  (error) => {
    controller.handleInvalid(error);
  },
);

// Posição inicial neutra; a posição real chega do app em INIT
scene.setProgress(0, { animate: false });

// Avisa o app que está pronto. O app só envia INIT depois disso.
controller.start();
