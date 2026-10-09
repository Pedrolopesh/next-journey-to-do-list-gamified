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

describe('controlador do banner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('envia READY com a versão ao iniciar', () => {
    const { controller, sent } = setup();
    controller.start();
    expect(sent).toEqual([{ v: 1, type: 'READY', payload: { bannerVersion: '9.9.9' } }]);
  });

  it('INIT posiciona o personagem pelo progress e guarda a cena', () => {
    const { root, receive } = setup();
    receive({
      v: 1,
      type: 'INIT',
      payload: { scene: 'map', character, sceneKey: 'forest-1', progress: 1, timeOfDay: 'night' },
    });
    expect(root.dataset.sceneKey).toBe('forest-1');
    expect(document.getElementById('hero')?.style.getPropertyValue('--hero-x')).toBe('0px');
  });

  it('INIT com a cena QG responde ERROR (ainda não suportada)', () => {
    const { receive, sent } = setup();
    receive({
      v: 1,
      type: 'INIT',
      payload: { scene: 'qg', character, sceneKey: 'hq', progress: 0, timeOfDay: 'morning' },
    });
    expect(sent[0]).toMatchObject({ type: 'ERROR', payload: { code: 'UNSUPPORTED_SCENE' } });
  });

  it('ITEM_CHECKED liga a corrida e volta à caminhada depois de 5 s', () => {
    const { root, receive } = setup();
    receive({ v: 1, type: 'ITEM_CHECKED', payload: { progress: 0.5 } });
    expect(root.classList.contains('running')).toBe(true);
    vi.advanceTimersByTime(5000);
    expect(root.classList.contains('running')).toBe(false);
  });

  it('PAUSE e RESUME controlam a classe paused', () => {
    const { root, receive } = setup();
    receive({ v: 1, type: 'PAUSE' });
    expect(root.classList.contains('paused')).toBe(true);
    receive({ v: 1, type: 'RESUME' });
    expect(root.classList.contains('paused')).toBe(false);
  });

  it('CHAPTER_COMPLETED faz o fade e avisa CHAPTER_TRANSITION_DONE no fim', () => {
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

  it('mensagem inválida vira ERROR e não altera a cena', () => {
    const { root, receive, sent } = setup();
    receive({ v: 1, type: 'ITEM_CHECKED', payload: { progress: 7 } });
    receive('lixo');
    expect(sent).toHaveLength(2);
    expect(sent[0]).toMatchObject({ type: 'ERROR', payload: { code: 'INVALID_MESSAGE' } });
    expect(root.classList.contains('running')).toBe(false);
  });
});
