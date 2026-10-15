import { describe, expect, it } from 'vitest';

import {
  BANNER_PROTOCOL_VERSION,
  createErrorMessage,
  lpcLookSchema,
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

describe('aparência LPC detalhada (look)', () => {
  const look = {
    bodyType: 'female',
    skin: 'amber',
    hair: 'hair-bob',
    hairColor: 'dark_brown',
    torso: 'torso-tshirt',
    torsoColor: 'blue',
    legs: 'legs-pants',
    legsColor: 'navy',
    feet: null,
    feetColor: 'brown',
  };

  it('INIT aceita a cena journey e recusa cena desconhecida', () => {
    const init = (scene: string) => ({
      v: 1,
      type: 'INIT',
      payload: { scene, sceneKey: 'beach', progress: 0, timeOfDay: 'night', character },
    });
    expect(parseAppToBannerMessage(init('journey')).ok).toBe(true);
    expect(parseAppToBannerMessage(init('espaco')).ok).toBe(false);
  });

  it('INIT aceita o personagem com look e sem look', () => {
    const base = {
      v: 1,
      type: 'INIT',
      payload: { scene: 'qg', sceneKey: 'castle', progress: 0, timeOfDay: 'night' },
    };
    expect(parseAppToBannerMessage({ ...base, payload: { ...base.payload, character } }).ok).toBe(
      true,
    );
    expect(
      parseAppToBannerMessage({
        ...base,
        payload: { ...base.payload, character: { ...character, look } },
      }).ok,
    ).toBe(true);
  });

  it('rejeita look com chave fora do padrão (nada de caminho ou texto livre)', () => {
    expect(lpcLookSchema.safeParse({ ...look, hair: '../etc/passwd' }).success).toBe(false);
    expect(lpcLookSchema.safeParse({ ...look, skin: 'A B' }).success).toBe(false);
    expect(lpcLookSchema.safeParse({ ...look, bodyType: 'robot' }).success).toBe(false);
    expect(lpcLookSchema.safeParse({ ...look, hairColor: 'x'.repeat(41) }).success).toBe(false);
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
