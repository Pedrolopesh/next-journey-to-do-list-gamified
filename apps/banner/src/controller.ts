import {
  type AppToBannerMessage,
  BANNER_PROTOCOL_VERSION,
  type BannerToAppMessage,
  createErrorMessage,
} from '@nextjourney/contracts';

import type { QgScene } from './qg/scene';
import { FADE_MS, HERO_MOVE_MS, type MapScene } from './scene/map';

type Options = {
  scene: MapScene;
  /** Cena do QG (Home). Sem ela, INIT com a cena QG responde ERROR. */
  qg?: Pick<
    QgScene,
    | 'show'
    | 'hide'
    | 'setScene'
    | 'setJourney'
    | 'setTime'
    | 'setCharacter'
    | 'celebrate'
    | 'setProgress'
    | 'pause'
    | 'resume'
    | 'fadeOut'
    | 'fadeIn'
  >;
  root: HTMLElement;
  send: (message: BannerToAppMessage) => void;
  bannerVersion: string;
};

/** Máquina de mensagens do banner: recebe do app, atualiza a cena e responde. */
export function createBannerController({ scene, qg, root, send, bannerVersion }: Options) {
  let transitionTimers: ReturnType<typeof setTimeout>[] = [];
  let active: 'map' | 'qg' = 'map';

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

  /** No QG não há corrida: escurece, volta e avisa o app, com os mesmos tempos do Mapa. */
  const qgChapterTransition = (): void => {
    transitionTimers.forEach(clearTimeout);
    transitionTimers = [];
    qg?.fadeOut();
    later(() => {
      qg?.setProgress(0, { animate: false });
      qg?.fadeIn();
    }, FADE_MS);
    later(() => {
      send({ v: BANNER_PROTOCOL_VERSION, type: 'CHAPTER_TRANSITION_DONE' });
    }, FADE_MS * 2);
  };

  return {
    /** O app só envia INIT depois de receber este READY. */
    start(): void {
      send({ v: BANNER_PROTOCOL_VERSION, type: 'READY', payload: { bannerVersion } });
    },

    handleMessage(message: AppToBannerMessage): void {
      switch (message.type) {
        case 'INIT': {
          if (message.payload.scene === 'qg' || message.payload.scene === 'journey') {
            if (!qg) {
              send(createErrorMessage('UNSUPPORTED_SCENE', 'Cena QG indisponível neste banner'));
              return;
            }
            active = 'qg';
            root.dataset.sceneKey = message.payload.sceneKey;
            root.dataset.timeOfDay = message.payload.timeOfDay;
            qg.setJourney(message.payload.scene === 'journey');
            qg.setScene(message.payload.sceneKey);
            qg.setProgress(message.payload.progress, { animate: false });
            qg.setTime(message.payload.timeOfDay);
            qg.setCharacter(message.payload.character);
            qg.show();
            root.dataset.ready = '1';
            return;
          }
          active = 'map';
          qg?.hide();
          root.dataset.scene = message.payload.scene;
          root.dataset.sceneKey = message.payload.sceneKey;
          root.dataset.timeOfDay = message.payload.timeOfDay;
          scene.setProgress(message.payload.progress, { animate: false });
          root.dataset.ready = '1';
          return;
        }
        case 'ITEM_CHECKED':
          if (active === 'qg') qg?.celebrate(message.payload.progress);
          else scene.run(message.payload.progress);
          return;
        case 'CHAPTER_COMPLETED':
          if (active === 'qg') {
            qgChapterTransition();
            return;
          }
          root.dataset.sceneKey = message.payload.nextSceneKey;
          chapterTransition();
          return;
        case 'SET_CHARACTER':
          root.dataset.character = JSON.stringify(message.payload.character);
          qg?.setCharacter(message.payload.character);
          return;
        case 'SET_TIME_OF_DAY':
          root.dataset.timeOfDay = message.payload.timeOfDay;
          qg?.setTime(message.payload.timeOfDay);
          return;
        case 'PAUSE':
          scene.pause();
          qg?.pause();
          return;
        case 'RESUME':
          scene.resume();
          qg?.resume();
          return;
      }
    },

    handleInvalid(error: string): void {
      send(createErrorMessage('INVALID_MESSAGE', error));
    },
  };
}
