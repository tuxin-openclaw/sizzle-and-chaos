import { useEffect, useSyncExternalStore } from "react";
import { game } from "./engine";

export function useGameHud() {
  return useSyncExternalStore(game.subscribeHud, game.getHudSnapshot, game.getHudSnapshot);
}

export function useGameVersion() {
  return useSyncExternalStore(game.subscribeVersion, game.getVersion, game.getVersion);
}

export function useKeyboardControls(): void {
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.code === "Escape" || event.code === "KeyP") {
        if (game.phase === "playing" || game.phase === "paused") {
          event.preventDefault();
          game.togglePause();
        }
        return;
      }
      if (event.code === "KeyM") {
        if (game.phase === "playing" || game.phase === "paused") {
          event.preventDefault();
          window.dispatchEvent(new Event("sizzle:toggle-mute"));
        }
        return;
      }
      if (
        event.code === "ArrowUp" ||
        event.code === "ArrowDown" ||
        event.code === "ArrowLeft" ||
        event.code === "ArrowRight" ||
        event.code === "Space"
      ) {
        if (game.phase !== "idle") event.preventDefault();
      }
      if (event.repeat) return;
      game.keyDown(event.code);
    };
    const up = (event: KeyboardEvent) => {
      game.keyUp(event.code);
    };
    const blur = () => game.clearKeys();
    const visibility = () => {
      if (document.hidden && game.phase === "playing") game.pause();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", visibility);
      game.clearKeys();
    };
  }, []);
}
