import { describe, expect, it } from 'vitest';

import { mix, rgba, softGlow, softGlowOutline } from './glow';

describe('brilho suave', () => {
  it('converte hex em rgba e mistura cores', () => {
    expect(rgba('#7c3aed', 0.5)).toBe('rgba(124, 58, 237, 0.5)');
    expect(mix('#000000', '#ffffff', 0)).toBe('#000000');
    expect(mix('#000000', '#ffffff', 1)).toBe('#ffffff');
    expect(mix('#7c3aed', '#16213e', 0.18)).toBe('#6a36ce');
  });

  it('em repouso tem realce, sombra e halo; apertado encurta o brilho', () => {
    const rest = softGlow('#7c3aed');
    const pressed = softGlow('#7c3aed', { pressed: true });
    expect(rest.boxShadow).toHaveLength(3);
    expect(pressed.boxShadow).toHaveLength(3);
    expect(JSON.stringify(rest.boxShadow)).not.toBe(JSON.stringify(pressed.boxShadow));
    expect(rest.experimental_backgroundImage).toContain('linear-gradient');
  });

  it('a força reduz o halo e é limitada entre 0 e 1', () => {
    const weak = JSON.stringify(softGlow('#7c3aed', { strength: 0.2 }).boxShadow);
    const strong = JSON.stringify(softGlow('#7c3aed', { strength: 5 }).boxShadow);
    expect(weak).not.toBe(strong);
    expect(strong).toBe(JSON.stringify(softGlow('#7c3aed').boxShadow));
  });

  it('o contornado tem borda na cor e halo; apertado enche e encurta o brilho', () => {
    const rest = softGlowOutline('#7c3aed');
    const pressed = softGlowOutline('#7c3aed', { pressed: true });
    expect(rest.borderWidth).toBe(1.5);
    expect(rest.borderColor).toBe('rgba(124, 58, 237, 0.75)');
    expect(pressed.borderColor).toBe('rgba(124, 58, 237, 0.95)');
    expect(rest.boxShadow).toHaveLength(3);
    expect(JSON.stringify(rest.boxShadow)).not.toBe(JSON.stringify(pressed.boxShadow));
  });
});
