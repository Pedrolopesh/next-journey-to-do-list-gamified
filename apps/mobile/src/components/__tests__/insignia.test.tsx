import { INSIGNIA_PALETTE, INSIGNIAS } from '@nextjourney/insignias';
import { render } from '@testing-library/react-native';

import { Insignia, pathsByColor } from '../pixel-art';

describe('Insignia', () => {
  it('desenha uma insígnia conhecida e ignora um nome que não existe', async () => {
    expect(Object.keys(INSIGNIAS)).toContain('pegada');
    await render(<Insignia glyph="pegada" size={48} />);
    await render(<Insignia glyph="nao-existe" size={48} />);
  });

  it('junta os pixels por cor: poucos traçados e nenhum pixel perdido', () => {
    const rows = INSIGNIAS.pegada;
    const paths = pathsByColor(rows, INSIGNIA_PALETTE);
    const pixels = rows.join('').replaceAll('.', '').length;
    const drawn = paths.reduce(
      (sum, p) =>
        sum +
        (p.d.match(/h(\d+)v1/g) ?? []).reduce(
          (n, run) => n + Number(/h(\d+)/.exec(run)?.[1] ?? 0),
          0,
        ),
      0,
    );
    expect(drawn).toBe(pixels);
    expect(paths.length).toBeLessThan(15);
    expect(pathsByColor([], INSIGNIA_PALETTE)).toEqual([]);
  });
});
