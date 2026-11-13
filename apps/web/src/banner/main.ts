import { createQgScene } from '../qg/scene';
import { listenToApp, sendToApp } from './bridge';
import { createBannerController } from './controller';
import { createMapScene } from './scene/map';

const root = document.getElementById('banner');
if (!root) throw new Error('Elemento #banner não encontrado');

const scene = createMapScene(root);
const qg = createQgScene(root);
const controller = createBannerController({
  scene,
  qg,
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

// Neutral initial position; the real position arrives from the app in INIT
scene.setProgress(0, { animate: false });

// Tells the app it is ready. The app only sends INIT after this.
controller.start();
