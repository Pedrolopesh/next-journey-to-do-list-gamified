import {
  type AppToBannerMessage,
  BANNER_PROTOCOL_VERSION,
  type BannerToAppMessage,
  createErrorMessage,
} from '@nextjourney/contracts';

import type { QgScene } from '../qg/scene';
import { FADE_MS, HERO_MOVE_MS, type MapScene } from './scene/map';

type Options = {
  scene: MapScene;
  /** HQ scene (Home). Without it, INIT with the HQ scene answers ERROR. */
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

/** Banner message machine: receives from the app, updates the scene and replies. */
export function createBannerController({ scene, qg, root, send, bannerVersion }: Options) {
  let transitionTimers: ReturnType<typeof setTimeout>[] = [];
  let active: 'map' | 'qg' = 'map';

  const later = (fn: () => void, ms: number): void => {
    transitionTimers.push(setTimeout(fn, ms));
  };

  const chapterTransition = (): void => {
    transitionTimers.forEach(clearTimeout);
    transitionTimers = [];
    // 1) character reaches the left edge, 2) fade to black, 3) new scene enters from the right
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

  /** There is no race in the HQ: it fades out, comes back and notifies the app, with the same timings as the Map. */
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
    /** The app only sends INIT after receiving this READY. */
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
