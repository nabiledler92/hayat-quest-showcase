import { useEffect, useRef } from 'react';
import type { Avatar } from '../state';
import { drawAvatar } from './iso';

export function AvatarPreview({ avatar, size, glow }: { avatar: Avatar; size: number; glow?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = size * dpr;
    c.height = size * dpr;
    const ctx = c.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    if (glow) {
      const g = ctx.createRadialGradient(size / 2, size * 0.62, 2, size / 2, size * 0.62, size / 2);
      g.addColorStop(0, 'rgba(255,207,107,0.45)');
      g.addColorStop(1, 'rgba(255,207,107,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    }
    drawAvatar(ctx, size / 2, size * 0.82, avatar, 0, size / 44);
  }, [avatar, size, glow]);
  return <canvas ref={ref} style={{ width: size, height: size }} aria-hidden="true" />;
}
