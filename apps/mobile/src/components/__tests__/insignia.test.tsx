import { INSIGNIA_PALETTE, INSIGNIAS } from '@nextjourney/insignias';
import { render } from '@testing-library/react-native';

import { Insignia, pathsByColor } from '../pixel-art';

describe('Insignia', () => {
  it('draws a known badge and ignores a name that does not exist', async () => {
    expect(Object.keys(INSIGNIAS)).toContain('pegada');
    await render(<Insignia glyph="pegada" size={48} />);
    await render(<Insignia glyph="nao-existe" size={48} />);
  });

  it('merges pixels by color: few paths and no pixel lost', () => {
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
