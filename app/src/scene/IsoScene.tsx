import { useEffect, useMemo, useRef } from 'react';
import type { Avatar } from '../state';
import { GRID, HOTSPOTS, TW, TH, buildMap, drawAvatar, drawBox, hash, isBlocked, poly, shade, toScreen, type Hotspot } from './iso';

const W = 360;
const H = 258;
const OX = W / 2; // the x = y diagonal of the grid runs down the centre
const OY = 66;
const SPEED = 3.2; // tiles per second
const NEAR = 1.6; // activation radius in tiles

interface Props {
  avatar: Avatar;
  pos: React.MutableRefObject<{ x: number; y: number }>;
  input: React.MutableRefObject<{ x: number; y: number }>;
  recommended: Hotspot['id'];
  onNearChange: (id: Hotspot['id'] | null) => void;
  onHotspotClick: (id: Hotspot['id']) => void;
}

export function IsoScene({ avatar, pos, input, recommended, onNearChange, onHotspotClick }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const map = useMemo(buildMap, []);
  const nearRef = useRef<Hotspot['id'] | null>(null);
  const keys = useRef(new Set<string>());
  const propsRef = useRef({ avatar, recommended, onNearChange });
  propsRef.current = { avatar, recommended, onNearChange };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) {
        if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
        keys.current.add(k);
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useEffect(() => {
    const canvas = ref.current!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d')!;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let last = performance.now();
    let walkPhase = 0;

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = reduced ? 0 : now / 1000;

      // --- input: joystick + keyboard, both in screen space
      let jx = input.current.x;
      let jy = input.current.y;
      const k = keys.current;
      if (k.has('arrowleft') || k.has('a')) jx -= 1;
      if (k.has('arrowright') || k.has('d')) jx += 1;
      if (k.has('arrowup') || k.has('w')) jy -= 1;
      if (k.has('arrowdown') || k.has('s')) jy += 1;
      // screen → world: x - y = jx, (x + y)/2 = jy
      let wx = (jx + 2 * jy) / 2;
      let wy = (2 * jy - jx) / 2;
      const wl = Math.hypot(wx, wy);
      const moving = wl > 0.05;
      if (moving) {
        const mag = Math.min(1, Math.hypot(jx, jy));
        wx = (wx / wl) * mag * SPEED * dt;
        wy = (wy / wl) * mag * SPEED * dt;
        const p = pos.current;
        const r = 0.28;
        const free = (x: number, y: number) =>
          !isBlocked(map, x - r, y - r) && !isBlocked(map, x + r, y - r) && !isBlocked(map, x - r, y + r) && !isBlocked(map, x + r, y + r);
        if (free(p.x + wx, p.y)) p.x += wx;
        if (free(p.x, p.y + wy)) p.y += wy;
        walkPhase += dt * 10;
      }

      // --- proximity
      let near: Hotspot['id'] | null = null;
      let best = NEAR;
      for (const h of HOTSPOTS) {
        const d = Math.hypot(h.x - pos.current.x, h.y - pos.current.y);
        if (d < best) {
          best = d;
          near = h.id;
        }
      }
      if (near !== nearRef.current) {
        nearRef.current = near;
        propsRef.current.onNearChange(near);
      }

      draw(ctx, dpr, t, moving ? Math.abs(Math.sin(walkPhase)) * 2 : 0);
      raf = requestAnimationFrame(frame);
    };

    const draw = (ctx: CanvasRenderingContext2D, dpr: number, t: number, bob: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // background: deep cavern
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#07080f');
      bg.addColorStop(1, '#10121d');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      const { avatar, recommended } = propsRef.current;

      // floor pass
      for (let s = 0; s <= (GRID - 1) * 2; s++) {
        for (let x = 0; x <= s; x++) {
          const y = s - x;
          if (x >= GRID || y >= GRID) continue;
          const tile = map.tiles[y][x];
          if (tile === 'wall') continue;
          const [sx, sy] = toScreen(OX, OY, x, y);
          const v = hash(x, y);
          if (tile === 'ledge') {
            drawBox(ctx, sx, sy + 6, 1, 1, 6, '#2a2d3a', '#1a1c26', '#14151d');
            continue;
          }
          if (tile === 'path') {
            const pulse = 0.55 + 0.45 * Math.sin(t * 2 - (x + y) * 0.6);
            drawBox(ctx, sx, sy + 3, 1, 1, 3, '#4a5276', '#283048', '#20263a');
            const [a, b] = toScreen(OX, OY, x, y);
            poly(
              ctx,
              [
                [a, b - TH / 2 + 3],
                [a + TW / 2 - 3, b],
                [a, b + TH / 2 - 3],
                [a - TW / 2 + 3, b],
              ],
              `rgba(120, 240, 220, ${0.38 + pulse * 0.4})`,
            );
          } else {
            const base = v < 0.33 ? '#41466a' : v < 0.66 ? '#3a3f60' : '#474d72';
            drawBox(ctx, sx, sy + 3, 1, 1, 3, base, '#262941', '#1d2033');
            if (v > 0.86) {
              // moss / rubble detail
              ctx.fillStyle = 'rgba(90,140,90,0.35)';
              ctx.fillRect(sx - 4 + v * 6, sy - 2, 4, 2);
            }
          }
        }
      }

      // object pass, painter-sorted (x + y)
      type Obj = { depth: number; draw: () => void };
      const objs: Obj[] = [];
      for (let y = 0; y < GRID; y++) {
        for (let x = 0; x < GRID; x++) {
          const tile = map.tiles[y][x];
          const [sx, sy] = toScreen(OX, OY, x, y);
          if (tile === 'wall') {
            const h = 34 + Math.floor(hash(x, y) * 3) * 8;
            objs.push({
              depth: x + y,
              draw: () => {
                drawBox(ctx, sx, sy, 1, 1, h, '#545a80', '#30344f', '#262a40');
                // brick seams
                ctx.strokeStyle = 'rgba(0,0,0,0.25)';
                ctx.lineWidth = 1;
                for (let z = 10; z < h; z += 10) {
                  ctx.beginPath();
                  ctx.moveTo(sx - TW / 2, sy - z);
                  ctx.lineTo(sx, sy + TH / 2 - z);
                  ctx.lineTo(sx + TW / 2, sy - z);
                  ctx.stroke();
                }
              },
            });
          } else if (tile === 'pillar') {
            const h = map.pillarHeight.get(`${x},${y}`) ?? 30;
            objs.push({
              depth: x + y,
              draw: () => {
                drawBox(ctx, sx, sy, 0.9, 0.9, 6, '#4a4e66', '#2e3146', '#252738');
                drawBox(ctx, sx, sy - 6, 0.62, 0.62, h - 6, '#545972', '#353950', '#2a2d40');
                drawBox(ctx, sx, sy - h, 0.78, 0.78, 4, '#5f6480', '#3b3f57', '#30334a');
              },
            });
          } else if (tile === 'crystal') {
            objs.push({
              depth: x + y,
              draw: () => {
                const g = 0.6 + 0.4 * Math.sin(t * 1.5 + x);
                drawBox(ctx, sx - 3, sy, 0.22, 0.22, 16, `rgba(140,220,255,${0.75 + g * 0.25})`, '#3d8fb8', '#2c6b8c');
                drawBox(ctx, sx + 4, sy + 1, 0.18, 0.18, 10, `rgba(160,235,255,${0.7 + g * 0.3})`, '#4aa0c8', '#337a9c');
                drawBox(ctx, sx, sy + 3, 0.16, 0.16, 7, '#b4f0ff', '#5ab0d6', '#3f87a8');
              },
            });
          }
        }
      }
      for (const h of HOTSPOTS) {
        const [sx, sy] = toScreen(OX, OY, h.x, h.y);
        objs.push({
          depth: h.x + h.y,
          draw: () => {
            drawBox(ctx, sx, sy, 0.8, 0.8, 8, '#5a5f7a', '#373b52', '#2c2f43');
            const fy = sy - 22 - Math.sin(t * 2 + h.x) * 3;
            // floating diamond
            const s = 7;
            poly(ctx, [[sx, fy - s * 1.4], [sx + s, fy], [sx, fy + s * 1.4], [sx - s, fy]], h.color);
            poly(ctx, [[sx, fy - s * 1.4], [sx + s, fy], [sx, fy]], shade(h.color, 40));
            poly(ctx, [[sx, fy], [sx + s, fy], [sx, fy + s * 1.4]], shade(h.color, -50));
          },
        });
      }
      const p = pos.current;
      objs.push({
        depth: p.x + p.y + 0.01,
        draw: () => {
          const [sx, sy] = toScreen(OX, OY, p.x, p.y);
          drawAvatar(ctx, sx, sy, avatar, bob);
        },
      });
      objs.sort((a, b) => a.depth - b.depth);
      for (const o of objs) o.draw();

      // light pass (additive)
      ctx.globalCompositeOperation = 'lighter';
      const light = (x: number, y: number, z: number, r: number, rgb: string, a: number) => {
        const [sx, sy] = toScreen(OX, OY, x, y, z);
        const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
        g.addColorStop(0, `rgba(${rgb},${a})`);
        g.addColorStop(1, `rgba(${rgb},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
      };
      for (const [x, y] of map.crystals) light(x, y, 8, 46, '120,210,255', 0.22 + 0.06 * Math.sin(t * 1.5 + x));
      for (const h of HOTSPOTS) {
        const rgb = hexToRgb(h.color);
        const isRec = h.id === recommended;
        light(h.x, h.y, 20, isRec ? 70 : 48, rgb, (isRec ? 0.36 : 0.2) + 0.08 * Math.sin(t * 2 + h.x));
      }
      light(p.x, p.y, 14, 70, '255,200,130', 0.2);
      // soft ambient fill from the cavern centre
      light(5, 5, 0, 190, '110,130,220', 0.1);
      ctx.globalCompositeOperation = 'source-over';

      // vignette
      const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.78);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,0.42)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);

      // labels
      ctx.font = '600 10px system-ui, -apple-system, Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const h of HOTSPOTS) {
        const [sx, sy] = toScreen(OX, OY, h.x, h.y, 46);
        const text = h.label;
        const w = ctx.measureText(text).width + 14;
        const isRec = h.id === recommended;
        ctx.fillStyle = isRec ? 'rgba(20,22,34,0.92)' : 'rgba(20,22,34,0.72)';
        roundRect(ctx, sx - w / 2, sy - 9, w, 18, 9);
        ctx.fill();
        ctx.strokeStyle = isRec ? h.color : 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = isRec ? '#fff' : 'rgba(255,255,255,0.8)';
        ctx.fillText(text, sx, sy + 0.5);
      }
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [map, pos, input]);

  return (
    <canvas
      ref={ref}
      className="scene-canvas"
      style={{ aspectRatio: `${W} / ${H}` }}
      role="img"
      aria-label="A softly lit cavern ruin with glowing pathways leading to three highlighted places: Understand an assessment, Insight journal, and Find qualified care. Use the list below the scene to go to any place directly."
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const mx = ((e.clientX - r.left) / r.width) * W;
        const my = ((e.clientY - r.top) / r.height) * H;
        for (const h of HOTSPOTS) {
          const [sx, sy] = toScreen(OX, OY, h.x, h.y, 22);
          const [lx, ly] = toScreen(OX, OY, h.x, h.y, 46);
          if (Math.hypot(mx - sx, my - sy) < 18 || (Math.abs(mx - lx) < 60 && Math.abs(my - ly) < 10)) {
            onHotspotClick(h.id);
            return;
          }
        }
      }}
    />
  );
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
