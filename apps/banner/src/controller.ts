import {
  type AppToBannerMessage,
  BANNER_PROTOCOL_VERSION,
  type BannerToAppMessage,
  createErrorMessage,
} from '@nextjourney/contracts';

import { FADE_MS, HERO_MOVE_MS, type MapScene } from './scene/map';

type Options = {
  scene: MapScene;
  root: HTMLElement;
  send: (message: BannerToAppMessage) => void;
  bannerVersion: string;
};

/** Máquina de mensagens do banner: recebe do app, atualiza a cena e responde. */
export function createBannerController({ scene, root, send, bannerVersion }: Options) {
  let transitionTimers: ReturnType<typeof setTimeout>[] = [];

  const later = (fn: () => void, ms: number): void => {
    transitionTimers.push(setTimeout(fn, ms));
  };

  const chapterTransition = (): void => {
    transitionTimers.forEach(clearTimeout);
    transitionTimers = [];
    // 1) personagem chega à borda esquerda, 2) fade para preto, 3) nova cena entra pela direita
    scene.setProgress(1);
    later(() => {
      scene.fadeOut();
    }, HERO_MOVE_MS);
    later(() => {
      scene.setProgress(0, { animate: false });
      scene.fadeIn();
    }, HERO_MOVE_MS + FADE_MS);
    later(
      () => {
        send({ v: BANNER_PROTOCOL_VERSION, type: 'CHAPTER_TRANSITION_DONE' });
      },
      HERO_MOVE_MS + FADE_MS * 2,
    );
  };

  return {
    /** O app só envia INIT depois de receber este READY. */
    start(): void {
      send({ v: BANNER_PROTOCOL_VERSION, type: 'READY', payload: { bannerVersion } });
    },

    handleMessage(message: AppToBannerMessage): void {
      switch (message.type) {
        case 'INIT': {
          if (message.payload.scene !== 'map') {
            send(
              createErrorMessage(
                'UNSUPPORTED_SCENE',
                `Cena ainda não suportada: ${message.payload.scene}`,
              ),
            );
            return;
          }
          root.dataset.scene = message.payload.scene;
          root.dataset.sceneKey = message.payload.sceneKey;
          root.dataset.timeOfDay = message.payload.timeOfDay;
          scene.setProgress(message.payload.progress, { animate: false });
          return;
        }
        case 'ITEM_CHECKED':
          scene.run(message.payload.progress);
          return;
        case 'CHAPTER_COMPLETED':
          root.dataset.sceneKey = message.payload.nextSceneKey;
          chapterTransition();
          return;
        case 'SET_CHARACTER':
          root.dataset.character = JSON.stringify(message.payload.character);
          return;
        case 'SET_TIME_OF_DAY':
          root.dataset.timeOfDay = message.payload.timeOfDay;
          return;
        case 'PAUSE':
          scene.pause();
          return;
        case 'RESUME':
          scene.resume();
          return;
      }
    },

    handleInvalid(error: string): void {
      send(createErrorMessage('INVALID_MESSAGE', error));
    },
  };
}
