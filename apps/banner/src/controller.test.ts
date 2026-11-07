import { type BannerToAppMessage, parseAppToBannerMessage } from '@nextjourney/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createBannerController } from './controller';
import { createMapScene, FADE_MS, HERO_MOVE_MS } from './scene/map';

const character = { skin: 'light', hair: 'short-brown', outfit: 'tunic-purple' };

function setup() {
  document.body.innerHTML = `
    <div id="banner"><div class="scene">
      <div class="hero" id="hero"><div class="hero-strip"></div></div>
      <div class="fade" id="fade"></div>
    </div></div>`;
  const root = document.getElementById('banner') as HTMLElement;
  const sent: BannerToAppMessage[] = [];
  const scene = createMapScene(root);
  const controller = createBannerController({
    scene,
    root,
    send: (message) => sent.push(message),
    bannerVersion: '9.9.9',
  });
  const receive = (raw: unknown): void => {
    const result = parseAppToBannerMessage(raw);
    if (result.ok) controller.handleMessage(result.message);
    else controller.handleInvalid(result.error);
  };
  return { root, sent, controller, receive };
}

describe('banner controller', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends READY with the version on start', () => {
    const { controller, sent } = setup();
    controller.start();
    expect(sent).toEqual([{ v: 1, type: 'READY', payload: { bannerVersion: '9.9.9' } }]);
  });

  it('INIT positions the character by progress and stores the scene', () => {
    const { root, receive } = setup();
    receive({
      v: 1,
      type: 'INIT',
      payload: { scene: 'map', character, sceneKey: 'forest-1', progress: 1, timeOfDay: 'night' },
    });
    expect(root.dataset.sceneKey).toBe('forest-1');
    expect(document.getElementById('hero')?.style.getPropertyValue('--hero-x')).toBe('0px');
  });

  it('the banner only becomes visible (data-ready) after the first INIT', () => {
    const { root, receive } = setup();
    expect(root.dataset.ready).toBeUndefined();
    receive({
      v: 1,
      type: 'INIT',
      payload: { scene: 'map', character, sceneKey: 'forest-1', progress: 0, timeOfDay: 'night' },
    });
    expect(root.dataset.ready).toBe('1');
  });

  it('INIT with the HQ scene answers ERROR (not supported yet)', () => {
    const { receive, sent } = setup();
    receive({
      v: 1,
      type: 'INIT',
      payload: { scene: 'qg', character, sceneKey: 'hq', progress: 0, timeOfDay: 'morning' },
    });
    expect(sent[0]).toMatchObject({ type: 'ERROR', payload: { code: 'UNSUPPORTED_SCENE' } });
  });

  it('ITEM_CHECKED starts the run and goes back to walking after 5 s', () => {
    const { root, receive } = setup();
    receive({ v: 1, type: 'ITEM_CHECKED', payload: { progress: 0.5 } });
    expect(root.classList.contains('running')).toBe(true);
    vi.advanceTimersByTime(5000);
    expect(root.classList.contains('running')).toBe(false);
  });

  it('PAUSE and RESUME control the paused class', () => {
    const { root, receive } = setup();
    receive({ v: 1, type: 'PAUSE' });
    expect(root.classList.contains('paused')).toBe(true);
    receive({ v: 1, type: 'RESUME' });
    expect(root.classList.contains('paused')).toBe(false);
  });

  it('CHAPTER_COMPLETED fades and sends CHAPTER_TRANSITION_DONE at the end', () => {
    const { root, receive, sent } = setup();
    receive({ v: 1, type: 'CHAPTER_COMPLETED', payload: { nextSceneKey: 'forest-2' } });
    expect(root.dataset.sceneKey).toBe('forest-2');
    vi.advanceTimersByTime(HERO_MOVE_MS);
    expect(document.getElementById('fade')?.classList.contains('visible')).toBe(true);
    expect(sent).toHaveLength(0);
    vi.advanceTimersByTime(FADE_MS * 2);
    expect(document.getElementById('fade')?.classList.contains('visible')).toBe(false);
    expect(sent).toEqual([{ v: 1, type: 'CHAPTER_TRANSITION_DONE' }]);
  });

  it('an invalid message becomes ERROR and does not change the scene', () => {
    const { root, receive, sent } = setup();
    receive({ v: 1, type: 'ITEM_CHECKED', payload: { progress: 7 } });
    receive('lixo');
    expect(sent).toHaveLength(2);
    expect(sent[0]).toMatchObject({ type: 'ERROR', payload: { code: 'INVALID_MESSAGE' } });
    expect(root.classList.contains('running')).toBe(false);
  });

  describe('HQ scene (Home)', () => {
    function setupQg() {
      setup(); // only to build the DOM
      const calls: string[] = [];
      const qg = {
        show: () => calls.push('show'),
        hide: () => calls.push('hide'),
        setScene: (id: string) => calls.push(`scene:${id}`),
        setJourney: (journey: boolean) => calls.push(`journey:${journey}`),
        setTime: (time: string) => calls.push(`time:${time}`),
        setCharacter: () => calls.push('character'),
        setProgress: (progress: number) => calls.push(`progress:${progress}`),
        celebrate: (progress: number) => calls.push(`celebrate:${progress}`),
        pause: () => calls.push('pause'),
        resume: () => calls.push('resume'),
        fadeOut: () => calls.push('fadeOut'),
        fadeIn: () => calls.push('fadeIn'),
      };
      const sent: BannerToAppMessage[] = [];
      const root = document.getElementById('banner') as HTMLElement;
      const controller = createBannerController({
        scene: createMapScene(root),
        qg,
        root,
        send: (message) => sent.push(message),
        bannerVersion: '9.9.9',
      });
      const receive = (raw: unknown): void => {
        const result = parseAppToBannerMessage(raw);
        if (result.ok) controller.handleMessage(result.message);
        else controller.handleInvalid(result.error);
      };
      return { root, calls, sent, receive };
    }

    const init = {
      v: 1,
      type: 'INIT',
      payload: { scene: 'qg', character, sceneKey: 'castle', progress: 0, timeOfDay: 'night' },
    };

    it('INIT qg configures scenery, time and character and shows the HQ', () => {
      const { calls, root, receive, sent } = setupQg();
      receive(init);
      expect(calls).toEqual([
        'journey:false',
        'scene:castle',
        'progress:0',
        'time:night',
        'character',
        'show',
      ]);
      expect(root.dataset.sceneKey).toBe('castle');
      expect(sent).toHaveLength(0);
    });

    it('INIT journey starts the journey (character walks and the scenery scrolls)', () => {
      const { calls, receive } = setupQg();
      receive({ ...init, payload: { ...init.payload, scene: 'journey', sceneKey: 'beach' } });
      expect(calls).toEqual([
        'journey:true',
        'scene:beach',
        'progress:0',
        'time:night',
        'character',
        'show',
      ]);
    });

    it('SET_TIME_OF_DAY and SET_CHARACTER reach the HQ', () => {
      const { calls, receive } = setupQg();
      receive(init);
      calls.length = 0;
      receive({ v: 1, type: 'SET_TIME_OF_DAY', payload: { timeOfDay: 'morning' } });
      receive({ v: 1, type: 'SET_CHARACTER', payload: { character } });
      expect(calls).toEqual(['time:morning', 'character']);
    });

    it('ITEM_CHECKED in the HQ makes the character celebrate instead of running on the Map', () => {
      const { calls, root, receive } = setupQg();
      receive(init);
      receive({ v: 1, type: 'ITEM_CHECKED', payload: { progress: 0.4 } });
      expect(calls).toContain('celebrate:0.4');
      expect(root.classList.contains('running')).toBe(false);
    });

    it('CHAPTER_COMPLETED in the HQ fades out, comes back and sends CHAPTER_TRANSITION_DONE', () => {
      const { calls, receive, sent } = setupQg();
      receive(init);
      receive({ v: 1, type: 'CHAPTER_COMPLETED', payload: { nextSceneKey: 'x' } });
      expect(calls).toContain('fadeOut');
      expect(sent).toHaveLength(0);
      vi.advanceTimersByTime(FADE_MS);
      expect(calls).toContain('fadeIn');
      vi.advanceTimersByTime(FADE_MS);
      expect(sent).toEqual([{ v: 1, type: 'CHAPTER_TRANSITION_DONE' }]);
    });

    it('PAUSE and RESUME also control the HQ', () => {
      const { calls, receive } = setupQg();
      receive({ v: 1, type: 'PAUSE' });
      receive({ v: 1, type: 'RESUME' });
      expect(calls).toEqual(['pause', 'resume']);
    });

    it('going back to the Map hides the HQ', () => {
      const { calls, receive } = setupQg();
      receive(init);
      receive({
        v: 1,
        type: 'INIT',
        payload: {
          scene: 'map',
          character,
          sceneKey: 'story-1-chapter-1',
          progress: 0.2,
          timeOfDay: 'night',
        },
      });
      expect(calls).toContain('hide');
    });
  });
});
