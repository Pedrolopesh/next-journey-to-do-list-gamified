import { describe, expect, it } from 'vitest';

import {
  BANNER_PROTOCOL_VERSION,
  createErrorMessage,
  parseAppToBannerMessage,
  parseBannerToAppMessage,
} from './banner-protocol';

const character = { skin: 'light', hair: 'short-brown', outfit: 'tunic-purple' };

describe('protocolo app -> banner', () => {
  it('aceita INIT válido (objeto ou string JSON)', () => {
    const msg = {
      v: 1,
      type: 'INIT',
      payload: {
        scene: 'map',
        character,
        sceneKey: 'forest-1',
        progress: 0.25,
        timeOfDay: 'night',
      },
    };
    expect(parseAppToBannerMessage(msg).ok).toBe(true);
    expect(parseAppToBannerMessage(JSON.stringify(msg)).ok).toBe(true);
  });

  it('aceita PAUSE e RESUME sem payload', () => {
    expect(parseAppToBannerMessage({ v: 1, type: 'PAUSE' }).ok).toBe(true);
    expect(parseAppToBannerMessage({ v: 1, type: 'RESUME' }).ok).toBe(true);
  });

  it('rejeita progress fora de 0..1', () => {
    expect(
      parseAppToBannerMessage({ v: 1, type: 'ITEM_CHECKED', payload: { progress: 1.2 } }).ok,
    ).toBe(false);
    expect(
      parseAppToBannerMessage({ v: 1, type: 'ITEM_CHECKED', payload: { progress: -0.1 } }).ok,
    ).toBe(false);
  });

  it('rejeita versão desconhecida, tipo desconhecido e lixo', () => {
    expect(parseAppToBannerMessage({ v: 2, type: 'PAUSE' }).ok).toBe(false);
    expect(parseAppToBannerMessage({ v: 1, type: 'FOO' }).ok).toBe(false);
    expect(parseAppToBannerMessage('não é json').ok).toBe(false);
    expect(parseAppToBannerMessage(undefined).ok).toBe(false);
  });
});

describe('protocolo banner -> app', () => {
  it('aceita READY, CHAPTER_TRANSITION_DONE e ERROR', () => {
    expect(
      parseBannerToAppMessage({ v: 1, type: 'READY', payload: { bannerVersion: '0.0.0' } }).ok,
    ).toBe(true);
    expect(parseBannerToAppMessage({ v: 1, type: 'CHAPTER_TRANSITION_DONE' }).ok).toBe(true);
    expect(parseBannerToAppMessage(createErrorMessage('INVALID_MESSAGE', 'x')).ok).toBe(true);
  });

  it('createErrorMessage usa a versão do protocolo', () => {
    expect(createErrorMessage('X', 'y').v).toBe(BANNER_PROTOCOL_VERSION);
  });
});
