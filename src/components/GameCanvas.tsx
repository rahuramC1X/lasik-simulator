import { useEffect, useRef } from 'react';
import type { GameEngine } from '../game/GameEngine';
import { EyeScene } from '../game/render3d/EyeScene';
import { ARENA_HEIGHT, ARENA_WIDTH } from '../game/types';

interface GameCanvasProps {
  engine: GameEngine;
}

/**
 * Owns the Three.js scene, the requestAnimationFrame loop, and the pointer
 * plumbing.
 *
 * Nothing here touches React state: pointer moves and per-frame rendering
 * stay entirely inside this component and EyeScene, so moving the mouse
 * never re-renders React.
 */
export function GameCanvas({ engine }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let scene: EyeScene;
    try {
      scene = new EyeScene(canvas);
    } catch {
      // WebGL unavailable — nothing we can render. The canvas stays blank;
      // HUD and DOM screens remain fully usable.
      return;
    }

    let frame = 0;
    let last = performance.now();
    let disposed = false;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      scene.resize(rect.width, rect.height);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const loop = (now: number) => {
      if (disposed) return;
      const dt = now - last;
      last = now;
      engine.update(dt);
      scene.render(engine.getRenderState());
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      scene.dispose();
    };
  }, [engine]);

  /** Converts a client-space point into fixed arena coordinates. */
  const toArena = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    return {
      x: ((clientX - rect.left) / rect.width) * ARENA_WIDTH,
      y: ((clientY - rect.top) / rect.height) * ARENA_HEIGHT,
    };
  };

  const movePointer = (clientX: number, clientY: number) => {
    const point = toArena(clientX, clientY);
    if (point) engine.setPointer(point.x, point.y);
  };

  return (
    <canvas
      ref={canvasRef}
      className="game-canvas"
      aria-label="Virtual eye treatment area"
      onMouseMove={(e) => movePointer(e.clientX, e.clientY)}
      onMouseDown={(e) => {
        movePointer(e.clientX, e.clientY);
        engine.fire();
      }}
      onTouchStart={(e) => {
        const touch = e.touches[0];
        if (touch) movePointer(touch.clientX, touch.clientY);
      }}
      onTouchMove={(e) => {
        const touch = e.touches[0];
        if (touch) movePointer(touch.clientX, touch.clientY);
      }}
      onTouchEnd={() => engine.fire()}
    />
  );
}
