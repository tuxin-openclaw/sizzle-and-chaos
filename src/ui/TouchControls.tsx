import { useRef } from "react";
import type { GameHud } from "../game/engine";
import { game } from "../game/engine";

const RADIUS = 44;

export function TouchControls({ hud }: { hud: GameHud }) {
  const knob = useRef<HTMLDivElement>(null);
  const activePointer = useRef<number | null>(null);
  const base = useRef<HTMLDivElement>(null);

  if (hud.phase !== "playing") return null;

  const reset = () => {
    activePointer.current = null;
    if (knob.current) knob.current.style.transform = "translate(-50%, -50%)";
    game.setTouchVector(0, 0);
  };

  const update = (clientX: number, clientY: number) => {
    const element = base.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);
    if (dist > RADIUS) {
      dx = (dx / dist) * RADIUS;
      dy = (dy / dist) * RADIUS;
    }
    if (knob.current) {
      knob.current.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    }
    const nx = dx / RADIUS;
    const nz = dy / RADIUS;
    const magnitude = Math.hypot(nx, nz);
    if (magnitude < 0.16) {
      game.setTouchVector(0, 0);
    } else {
      game.setTouchVector(nx, nz);
    }
  };

  return (
    <div className="touch-controls" aria-hidden>
      <div
        className="touch-stick"
        ref={base}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          activePointer.current = event.pointerId;
          update(event.clientX, event.clientY);
        }}
        onPointerMove={(event) => {
          if (activePointer.current !== event.pointerId) return;
          update(event.clientX, event.clientY);
        }}
        onPointerUp={reset}
        onPointerCancel={reset}
        onLostPointerCapture={reset}
      >
        <div className="touch-stick-knob" ref={knob} />
      </div>
      <div className="touch-actions">
        <button
          className="touch-action"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            game.setTouchAction(true);
          }}
          onPointerUp={() => game.setTouchAction(false)}
          onPointerCancel={() => game.setTouchAction(false)}
          onLostPointerCapture={() => game.setTouchAction(false)}
        >
          <b>E</b>
          <span>互动 / 按住切菜</span>
        </button>
      </div>
    </div>
  );
}
