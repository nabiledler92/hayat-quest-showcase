// Isometric drawing primitives and the cavern map. Original code-drawn art
// (D-004, D-014, D-030): voxel-style blocks, glowing paths, no external assets.

import type { Avatar } from '../state';

export const TW = 32; // tile width in px
export const TH = 16; // tile height in px
export const GRID = 11;

export type Tile = 'floor' | 'path' | 'wall' | 'ledge' | 'pillar' | 'crystal' | 'beacon';

export interface Hotspot {
  id: 'assessment' | 'care' | 'journal';
  label: string;
  x: number;
  y: number;
  color: string;
}

export const HOTSPOTS: Hotspot[] = [
  { id: 'assessment', label: 'Understand an assessment', x: 2, y: 5, color: '#ffcf6b' },
  { id: 'journal', label: 'Insight journal', x: 5, y: 1, color: '#c9a2ff' },
  { id: 'care', label: 'Find qualified care', x: 8, y: 2, color: '#6fe0ff' },
];

const PATH_SEGMENTS: [number, number, number, number][] = [
  [5, 9, 5, 5],
  [5, 5, 3, 5],
  [5, 5, 5, 2],
  [5, 3, 8, 3],
];
const PILLARS: [number, number, number][] = [
  [1, 1, 44],
  [9, 1, 30],
  [1, 9, 26],
  [9, 9, 38],
  [2, 8, 20],
  [8, 6, 34],
  [1, 3, 24],
];
const CRYSTALS: [number, number][] = [
  [3, 2],
  [7, 8],
  [9, 5],
  [1, 7],
];

export interface MapData {
  tiles: Tile[][]; // tiles[y][x]
  pillarHeight: Map<string, number>;
  crystals: [number, number][];
}

export function buildMap(): MapData {
  const tiles: Tile[][] = Array.from({ length: GRID }, () => Array<Tile>(GRID).fill('floor'));
  for (let i = 0; i < GRID; i++) {
    tiles[0][i] = 'wall';
    tiles[i][0] = 'wall';
    tiles[GRID - 1][i] = 'ledge';
    tiles[i][GRID - 1] = 'ledge';
  }
  for (const [x1, y1, x2, y2] of PATH_SEGMENTS) {
    const dx = Math.sign(x2 - x1);
    const dy = Math.sign(y2 - y1);
    let x = x1;
    let y = y1;
    tiles[y][x] = 'path';
    while (x !== x2 || y !== y2) {
      x += dx;
      y += dy;
      tiles[y][x] = 'path';
    }
  }
  const pillarHeight = new Map<string, number>();
  for (const [x, y, h] of PILLARS) {
    tiles[y][x] = 'pillar';
    pillarHeight.set(`${x},${y}`, h);
  }
  for (const [x, y] of CRYSTALS) tiles[y][x] = 'crystal';
  for (const h of HOTSPOTS) tiles[h.y][h.x] = 'beacon';
  return { tiles, pillarHeight, crystals: CRYSTALS };
}

export function isBlocked(map: MapData, x: number, y: number): boolean {
  const tx = Math.round(x);
  const ty = Math.round(y);
  if (tx < 0 || ty < 0 || tx >= GRID || ty >= GRID) return true;
  const t = map.tiles[ty][tx];
  return t !== 'floor' && t !== 'path';
}

/** World (tile) coords → screen px, relative to an origin. z is pixel elevation. */
export function toScreen(ox: number, oy: number, x: number, y: number, z = 0): [number, number] {
  return [ox + ((x - y) * TW) / 2, oy + ((x + y) * TH) / 2 - z];
}

/** Hash for stable per-tile variation. */
export function hash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `rgb(${r},${g},${b})`;
}

/**
 * Draw an isometric box. (cx, cy) is the screen point of the footprint centre at
 * ground level. w/d are footprint size in tiles, h is height in px.
 */
export function drawBox(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  d: number,
  h: number,
  top: string,
  left: string,
  right: string,
) {
  const p = (dx: number, dy: number, z: number): [number, number] => [cx + ((dx - dy) * TW) / 2, cy + ((dx + dy) * TH) / 2 - z];
  const hw = w / 2;
  const hd = d / 2;
  // left face (+y side)
  poly(ctx, [p(-hw, hd, 0), p(hw, hd, 0), p(hw, hd, h), p(-hw, hd, h)], left);
  // right face (+x side)
  poly(ctx, [p(hw, -hd, 0), p(hw, hd, 0), p(hw, hd, h), p(hw, -hd, h)], right);
  // top
  poly(ctx, [p(-hw, -hd, h), p(hw, -hd, h), p(hw, hd, h), p(-hw, hd, h)], top);
}

export function poly(ctx: CanvasRenderingContext2D, pts: [number, number][], fill: string) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

/** Block-style explorer. (sx, sy) = feet on the ground, screen px. */
export function drawAvatar(ctx: CanvasRenderingContext2D, sx: number, sy: number, a: Avatar, bob = 0, s = 1) {
  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(s, s);
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  const y = -bob;
  const legs = '#2b2a33';
  drawBox(ctx, 0, y, 0.34, 0.22, 9, shade(legs, 20), shade(legs, -5), shade(legs, -20));
  drawBox(ctx, 0, y - 9, 0.42, 0.26, 10, shade(a.shirt, 25), a.shirt, shade(a.shirt, -30));
  drawBox(ctx, 0, y - 19, 0.4, 0.4, 11, shade(a.skin, 18), a.skin, shade(a.skin, -28));
  // hair cap
  drawBox(ctx, 0, y - 28, 0.42, 0.42, 3, shade(a.accent, 25), a.accent, shade(a.accent, -10));
  // eyes on the left (front) face
  ctx.fillStyle = '#16120f';
  const ex = -TW * 0.4 * 0.5;
  ctx.fillRect(ex * 0.2 - 3.2, y - 24.5 + 2.5, 1.8, 2.2);
  ctx.fillRect(ex * 0.2 + 1.0, y - 24.5 + 4.6, 1.8, 2.2);
  ctx.restore();
}
