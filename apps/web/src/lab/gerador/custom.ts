/**
 * Props drawn in code, for what the free sheets do not have. Every function draws upwards from
 * the foot point (x in the middle, y at the base), in whole pixels and flat colors, to sit next
 * to the pixel art of the sheets.
 */

type Ctx = CanvasRenderingContext2D;
export type CustomDraw = (ctx: Ctx, x: number, y: number) => void;

const r = (ctx: Ctx, color: string, x: number, y: number, w: number, h: number): void => {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
};

const shadow = (ctx: Ctx, x: number, y: number, w: number): void => {
  r(ctx, 'rgba(0,0,0,0.22)', x - w / 2, y - 2, w, 4);
};

const tombstone =
  (kind: number): CustomDraw =>
  (ctx, x, y) => {
    shadow(ctx, x, y, 22);
    if (kind === 2) {
      // Cross
      r(ctx, '#6f7480', x - 3, y - 30, 6, 30);
      r(ctx, '#6f7480', x - 10, y - 23, 20, 6);
      r(ctx, '#9aa0ad', x - 3, y - 30, 2, 30);
      r(ctx, '#9aa0ad', x - 10, y - 23, 20, 2);
      return;
    }
    const h = kind === 0 ? 24 : 18;
    r(ctx, '#5b606c', x - 9, y - h, 18, h);
    r(ctx, '#5b606c', x - 7, y - h - 3, 14, 3);
    r(ctx, '#8c93a1', x - 9, y - h, 3, h);
    r(ctx, '#8c93a1', x - 7, y - h - 3, 12, 2);
    r(ctx, '#3d414b', x - 4, y - h + 6, 9, 2);
    r(ctx, '#3d414b', x - 4, y - h + 10, 7, 2);
    r(ctx, '#4d7a3c', x - 10, y - 3, 5, 3);
  };

const sandbags: CustomDraw = (ctx, x, y) => {
  shadow(ctx, x, y, 50);
  for (let row = 0; row < 3; row++) {
    const count = 3 - (row === 2 ? 1 : 0);
    const off = row % 2 ? 8 : 0;
    for (let i = 0; i < count; i++) {
      const bx = x - 24 + off + i * 16;
      const by = y - 9 - row * 8;
      r(ctx, '#8d7b52', bx, by, 15, 8);
      r(ctx, '#b3a06e', bx + 1, by, 13, 3);
      r(ctx, '#5f5236', bx, by + 7, 15, 1);
    }
  }
};

const target: CustomDraw = (ctx, x, y) => {
  shadow(ctx, x, y, 18);
  r(ctx, '#6b4a28', x - 2, y - 14, 4, 14);
  r(ctx, '#e9e4d6', x - 10, y - 36, 20, 22);
  r(ctx, '#c0392b', x - 7, y - 33, 14, 16);
  r(ctx, '#e9e4d6', x - 4, y - 30, 8, 10);
  r(ctx, '#c0392b', x - 2, y - 27, 4, 4);
};

const wreck: CustomDraw = (ctx, x, y) => {
  shadow(ctx, x, y, 66);
  r(ctx, '#5a3b32', x - 30, y - 16, 60, 12);
  r(ctx, '#7a4a3a', x - 30, y - 16, 60, 3);
  r(ctx, '#4a3029', x - 16, y - 27, 30, 11);
  r(ctx, '#27323d', x - 13, y - 25, 11, 8);
  r(ctx, '#27323d', x + 1, y - 25, 10, 8);
  r(ctx, '#8a8f98', x - 9, y - 25, 3, 3);
  r(ctx, '#1c1c20', x - 24, y - 8, 12, 8);
  r(ctx, '#1c1c20', x + 12, y - 8, 12, 8);
  r(ctx, '#3a3a40', x - 21, y - 6, 6, 4);
  r(ctx, '#a0522d', x - 6, y - 14, 8, 4);
  r(ctx, '#a0522d', x + 18, y - 15, 6, 3);
};

const barricade: CustomDraw = (ctx, x, y) => {
  shadow(ctx, x, y, 50);
  for (const dx of [-20, 0, 20]) {
    r(ctx, '#5c4226', x + dx - 2, y - 26, 4, 26);
    r(ctx, '#7d5c36', x + dx - 2, y - 26, 2, 26);
    r(ctx, '#3d2b18', x + dx - 3, y - 29, 6, 3);
  }
  r(ctx, '#6e5030', x - 26, y - 21, 52, 5);
  r(ctx, '#8b683f', x - 26, y - 21, 52, 2);
  r(ctx, '#6e5030', x - 26, y - 11, 52, 5);
  r(ctx, '#8b683f', x - 26, y - 11, 52, 2);
};

const bones: CustomDraw = (ctx, x, y) => {
  r(ctx, '#e4dcc8', x - 8, y - 4, 16, 3);
  r(ctx, '#e4dcc8', x - 10, y - 5, 3, 5);
  r(ctx, '#e4dcc8', x + 7, y - 5, 3, 5);
  r(ctx, '#e4dcc8', x - 3, y - 13, 8, 7);
  r(ctx, '#2a2a30', x - 2, y - 11, 2, 2);
  r(ctx, '#2a2a30', x + 2, y - 11, 2, 2);
};

const portal: CustomDraw = (ctx, x, y) => {
  shadow(ctx, x, y, 44);
  r(ctx, '#5b606c', x - 22, y - 50, 8, 50);
  r(ctx, '#5b606c', x + 14, y - 50, 8, 50);
  r(ctx, '#5b606c', x - 22, y - 58, 44, 9);
  r(ctx, '#8c93a1', x - 22, y - 58, 44, 2);
  r(ctx, '#8c93a1', x - 22, y - 50, 2, 50);
  r(ctx, '#8c93a1', x + 14, y - 50, 2, 50);
  r(ctx, '#3b1d6e', x - 14, y - 49, 28, 49);
  r(ctx, '#6b3fd0', x - 11, y - 45, 22, 41);
  r(ctx, '#a98bff', x - 6, y - 38, 12, 28);
  r(ctx, '#e6dcff', x - 2, y - 30, 4, 14);
  r(ctx, '#7be0ff', x - 21, y - 40, 2, 2);
  r(ctx, '#7be0ff', x + 19, y - 22, 2, 2);
};

const torch: CustomDraw = (ctx, x, y) => {
  r(ctx, '#3d2b18', x - 2, y - 26, 4, 26);
  r(ctx, '#5c4226', x - 2, y - 26, 2, 26);
  r(ctx, '#2a2a30', x - 4, y - 29, 8, 4);
  r(ctx, '#e25822', x - 4, y - 38, 8, 9);
  r(ctx, '#f5a623', x - 2, y - 36, 5, 7);
  r(ctx, '#fff2a8', x - 1, y - 33, 2, 4);
};

const flame: CustomDraw = (ctx, x, y) => {
  r(ctx, '#7a1c0e', x - 9, y - 6, 18, 6);
  r(ctx, '#e25822', x - 7, y - 18, 14, 14);
  r(ctx, '#e25822', x - 3, y - 26, 7, 8);
  r(ctx, '#f5a623', x - 4, y - 15, 9, 11);
  r(ctx, '#f5a623', x - 1, y - 21, 4, 6);
  r(ctx, '#fff2a8', x - 2, y - 10, 4, 6);
};

const crystal =
  (color: [string, string, string]): CustomDraw =>
  (ctx, x, y) => {
    shadow(ctx, x, y, 24);
    r(ctx, color[1], x - 4, y - 28, 8, 28);
    r(ctx, color[0], x - 4, y - 28, 3, 28);
    r(ctx, color[2], x - 2, y - 32, 4, 4);
    r(ctx, color[1], x - 12, y - 16, 6, 16);
    r(ctx, color[0], x - 12, y - 16, 2, 16);
    r(ctx, color[1], x + 6, y - 20, 6, 20);
    r(ctx, color[2], x + 10, y - 20, 2, 20);
  };

const signpost: CustomDraw = (ctx, x, y) => {
  shadow(ctx, x, y, 14);
  r(ctx, '#5c4226', x - 2, y - 30, 4, 30);
  r(ctx, '#8b683f', x - 14, y - 30, 26, 9);
  r(ctx, '#a57a48', x - 14, y - 30, 26, 2);
  r(ctx, '#8b683f', x + 12, y - 28, 3, 5);
  r(ctx, '#3d2b18', x - 10, y - 26, 16, 1);
  r(ctx, '#8b683f', x - 10, y - 18, 22, 8);
  r(ctx, '#3d2b18', x - 6, y - 14, 14, 1);
};

const well: CustomDraw = (ctx, x, y) => {
  shadow(ctx, x, y, 40);
  r(ctx, '#6f7480', x - 16, y - 16, 32, 16);
  r(ctx, '#9aa0ad', x - 16, y - 16, 32, 3);
  r(ctx, '#4b505b', x - 16, y - 8, 32, 1);
  r(ctx, '#1f3b57', x - 12, y - 14, 24, 4);
  r(ctx, '#5c4226', x - 15, y - 40, 3, 26);
  r(ctx, '#5c4226', x + 12, y - 40, 3, 26);
  r(ctx, '#8f3f2b', x - 20, y - 48, 40, 9);
  r(ctx, '#b5553a', x - 20, y - 48, 40, 3);
  r(ctx, '#3d2b18', x - 1, y - 39, 2, 14);
  r(ctx, '#7d5c36', x - 4, y - 26, 8, 7);
};

const stall =
  (cloth: [string, string]): CustomDraw =>
  (ctx, x, y) => {
    shadow(ctx, x, y, 56);
    r(ctx, '#5c4226', x - 26, y - 44, 3, 44);
    r(ctx, '#5c4226', x + 23, y - 44, 3, 44);
    r(ctx, '#7d5c36', x - 26, y - 20, 52, 14);
    r(ctx, '#a57a48', x - 26, y - 20, 52, 3);
    for (let i = 0; i < 7; i++) {
      r(ctx, cloth[i % 2] as string, x - 28 + i * 8, y - 56, 8, 14);
      r(ctx, cloth[i % 2] as string, x - 27 + i * 8, y - 42, 6, 2);
    }
    r(ctx, 'rgba(0,0,0,0.25)', x - 28, y - 44, 56, 2);
    r(ctx, '#d94f3d', x - 18, y - 25, 6, 5);
    r(ctx, '#e8b23a', x - 8, y - 25, 6, 5);
    r(ctx, '#6fa84a', x + 2, y - 25, 6, 5);
    r(ctx, '#d94f3d', x + 12, y - 25, 6, 5);
  };

const lamppost: CustomDraw = (ctx, x, y) => {
  shadow(ctx, x, y, 12);
  r(ctx, '#2a2a30', x - 3, y - 4, 6, 4);
  r(ctx, '#3a3a44', x - 1, y - 52, 3, 50);
  r(ctx, '#2a2a30', x - 6, y - 64, 12, 3);
  r(ctx, '#f5d76e', x - 5, y - 61, 10, 9);
  r(ctx, '#fff6c8', x - 2, y - 59, 4, 5);
  r(ctx, '#2a2a30', x - 6, y - 52, 12, 2);
};

const bench: CustomDraw = (ctx, x, y) => {
  shadow(ctx, x, y, 34);
  r(ctx, '#5c4226', x - 14, y - 8, 3, 8);
  r(ctx, '#5c4226', x + 11, y - 8, 3, 8);
  r(ctx, '#8b683f', x - 16, y - 12, 32, 5);
  r(ctx, '#a57a48', x - 16, y - 12, 32, 2);
  r(ctx, '#7d5c36', x - 16, y - 22, 32, 4);
  r(ctx, '#5c4226', x - 15, y - 22, 2, 12);
  r(ctx, '#5c4226', x + 13, y - 22, 2, 12);
};

const tent =
  (cloth: [string, string]): CustomDraw =>
  (ctx, x, y) => {
    shadow(ctx, x, y, 60);
    for (let i = 0; i < 18; i++) {
      const w = 6 + i * 3;
      r(ctx, cloth[0], x - w / 2, y - 38 + i * 2, w, 2);
    }
    for (let i = 0; i < 18; i++) r(ctx, cloth[1], x - (6 + i * 3) / 2, y - 38 + i * 2, 3, 2);
    r(ctx, '#1d1a24', x - 6, y - 20, 12, 20);
    r(ctx, '#1d1a24', x - 3, y - 26, 6, 6);
    r(ctx, '#5c4226', x - 1, y - 44, 2, 8);
  };

const statue: CustomDraw = (ctx, x, y) => {
  shadow(ctx, x, y, 34);
  r(ctx, '#6f7480', x - 14, y - 14, 28, 14);
  r(ctx, '#9aa0ad', x - 14, y - 14, 28, 3);
  r(ctx, '#858b98', x - 7, y - 40, 14, 26);
  r(ctx, '#a9afbb', x - 7, y - 40, 4, 26);
  r(ctx, '#858b98', x - 5, y - 50, 10, 10);
  r(ctx, '#a9afbb', x - 5, y - 50, 3, 10);
  r(ctx, '#858b98', x + 7, y - 44, 4, 20);
  r(ctx, '#c9ceda', x + 8, y - 60, 2, 18);
};

const board: CustomDraw = (ctx, x, y) => {
  shadow(ctx, x, y, 40);
  r(ctx, '#5c4226', x - 17, y - 38, 3, 38);
  r(ctx, '#5c4226', x + 14, y - 38, 3, 38);
  r(ctx, '#8b683f', x - 20, y - 40, 40, 26);
  r(ctx, '#3d2b18', x - 20, y - 40, 40, 2);
  r(ctx, '#f1e6c4', x - 16, y - 36, 10, 12);
  r(ctx, '#f1e6c4', x - 3, y - 34, 9, 10);
  r(ctx, '#e6c97a', x + 8, y - 36, 9, 13);
  r(ctx, '#c0392b', x - 12, y - 37, 2, 2);
  r(ctx, '#c0392b', x + 1, y - 35, 2, 2);
  r(ctx, '#3a6fd0', x + 12, y - 37, 2, 2);
};

const banner =
  (color: [string, string]): CustomDraw =>
  (ctx, x, y) => {
    r(ctx, '#c9a23a', x - 9, y - 58, 18, 3);
    r(ctx, color[0], x - 7, y - 55, 14, 34);
    r(ctx, color[1], x - 7, y - 55, 3, 34);
    r(ctx, color[0], x - 7, y - 21, 5, 5);
    r(ctx, color[0], x + 2, y - 21, 5, 5);
    r(ctx, '#f0d878', x - 2, y - 44, 4, 8);
    r(ctx, '#f0d878', x - 4, y - 42, 8, 3);
  };

const throne: CustomDraw = (ctx, x, y) => {
  shadow(ctx, x, y, 44);
  r(ctx, '#6f7480', x - 26, y - 8, 52, 8);
  r(ctx, '#9aa0ad', x - 26, y - 8, 52, 2);
  r(ctx, '#6f7480', x - 20, y - 14, 40, 6);
  r(ctx, '#c9a23a', x - 12, y - 60, 24, 46);
  r(ctx, '#f0d878', x - 12, y - 60, 4, 46);
  r(ctx, '#8f1d2c', x - 8, y - 54, 16, 32);
  r(ctx, '#c9a23a', x - 16, y - 30, 5, 16);
  r(ctx, '#c9a23a', x + 11, y - 30, 5, 16);
  r(ctx, '#8f1d2c', x - 10, y - 22, 20, 8);
  r(ctx, '#f0d878', x - 3, y - 66, 6, 6);
};

const pillar: CustomDraw = (ctx, x, y) => {
  shadow(ctx, x, y, 26);
  r(ctx, '#6f7480', x - 11, y - 8, 22, 8);
  r(ctx, '#858b98', x - 7, y - 70, 14, 62);
  r(ctx, '#a9afbb', x - 7, y - 70, 4, 62);
  r(ctx, '#5b606c', x + 4, y - 70, 3, 62);
  r(ctx, '#6f7480', x - 11, y - 78, 22, 8);
  r(ctx, '#9aa0ad', x - 11, y - 78, 22, 2);
};

const cage: CustomDraw = (ctx, x, y) => {
  shadow(ctx, x, y, 34);
  r(ctx, '#2a2a30', x - 16, y - 4, 32, 4);
  r(ctx, '#2a2a30', x - 16, y - 44, 32, 4);
  for (let i = 0; i < 6; i++) {
    r(ctx, '#6f7480', x - 15 + i * 6, y - 40, 2, 36);
    r(ctx, '#9aa0ad', x - 15 + i * 6, y - 40, 1, 36);
  }
};

const rubble: CustomDraw = (ctx, x, y) => {
  r(ctx, '#6f7480', x - 14, y - 8, 12, 8);
  r(ctx, '#9aa0ad', x - 14, y - 8, 12, 2);
  r(ctx, '#5b606c', x - 2, y - 12, 14, 12);
  r(ctx, '#858b98', x - 2, y - 12, 14, 3);
  r(ctx, '#6f7480', x + 10, y - 5, 8, 5);
  r(ctx, '#8f3f2b', x - 8, y - 3, 6, 3);
};

export const CUSTOM = {
  tombA: tombstone(0),
  tombB: tombstone(1),
  cross: tombstone(2),
  sandbags,
  target,
  wreck,
  barricade,
  bones,
  portal,
  torch,
  flame,
  crystalBlue: crystal(['#bfe9ff', '#4aa3e0', '#e9f8ff']),
  crystalRed: crystal(['#ffc2b0', '#d0402b', '#ffe6dc']),
  crystalGreen: crystal(['#c8ffd0', '#3fae5a', '#ecfff0']),
  signpost,
  well,
  stallRed: stall(['#c0392b', '#f1e6c4']),
  stallBlue: stall(['#2f6fb5', '#f1e6c4']),
  stallGreen: stall(['#3f8f4f', '#f1e6c4']),
  lamppost,
  bench,
  tentBrown: tent(['#a8875a', '#c9a878']),
  tentGreen: tent(['#4f7a52', '#6a9a6c']),
  tentGrey: tent(['#6d727c', '#8f95a1']),
  statue,
  board,
  bannerRed: banner(['#a3243a', '#c9384f']),
  bannerBlue: banner(['#27468f', '#3a62bd']),
  throne,
  pillar,
  cage,
  rubble,
} satisfies Record<string, CustomDraw>;

export type CustomId = keyof typeof CUSTOM;

/** Names shown in the lab for the props drawn in code. */
export const CUSTOM_COUNT = Object.keys(CUSTOM).length;
