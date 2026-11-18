import { useRef, useState } from 'react';

/** Virtual joystick (D-032). Writes a normalised screen-space vector into `vec`. */
export function Joystick({ vec }: { vec: React.MutableRefObject<{ x: number; y: number }> }) {
  const baseRef = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const R = 36;

  const update = (clientX: number, clientY: number) => {
    const b = baseRef.current!.getBoundingClientRect();
    let dx = clientX - (b.left + b.width / 2);
    let dy = clientY - (b.top + b.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > R) {
      dx = (dx / len) * R;
      dy = (dy / len) * R;
    }
    setKnob({ x: dx, y: dy });
    const m = Math.min(1, len / R);
    vec.current = len < 6 ? { x: 0, y: 0 } : { x: (dx / R) * (m > 0 ? 1 : 0), y: (dy / R) * (m > 0 ? 1 : 0) };
  };
  const release = () => {
    setKnob({ x: 0, y: 0 });
    vec.current = { x: 0, y: 0 };
  };

  return (
    <div
      ref={baseRef}
      className="joystick"
      role="application"
      aria-label="Movement joystick. Drag to move your explorer. Keyboard: arrow keys or WASD."
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        update(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (e.buttons || e.pointerType === 'touch') update(e.clientX, e.clientY);
      }}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <div className="joystick-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  );
}
