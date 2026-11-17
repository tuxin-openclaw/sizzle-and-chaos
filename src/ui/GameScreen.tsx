import { useEffect, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";
import { game } from "../game/engine";
import { getLevel, LEVELS } from "../game/data";
import { audio } from "../game/audio";
import { useGameHud, useKeyboardControls } from "../game/useGameHooks";
import { GameScene } from "../scene/GameScene";
import { HUD } from "./HUD";
import { TouchControls } from "./TouchControls";
import {
  CountdownOverlay,
  HelpModal,
  LoadingScreen,
  PauseOverlay,
  PortraitGate,
  ResultsOverlay,
} from "./Overlays";

export function GameScreen({
  muted,
  onToggleMute,
  onQuit,
  onFullscreen,
  fullscreenActive,
  showFullscreen,
}: {
  muted: boolean;
  onToggleMute: () => void;
  onQuit: () => void;
  onFullscreen: () => void;
  fullscreenActive: boolean;
  showFullscreen: boolean;
}) {
  useKeyboardControls();
  const hud = useGameHud();
  const { active, progress } = useProgress();
  const [minTimeDone, setMinTimeDone] = useState(false);
  const [fallbackDone, setFallbackDone] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [portrait, setPortrait] = useState(false);
  const autoPaused = useRef(false);

  useEffect(() => {
    const query = window.matchMedia("(pointer: coarse) and (orientation: portrait)");
    const update = () => setPortrait(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (portrait && game.phase === "playing") {
      autoPaused.current = true;
      game.pause();
    } else if (!portrait && autoPaused.current && game.phase === "paused") {
      autoPaused.current = false;
      game.resume();
    }
  }, [portrait, hud.phase]);

  useEffect(() => {
    const minTimer = window.setTimeout(() => setMinTimeDone(true), 650);
    const fallbackTimer = window.setTimeout(() => setFallbackDone(true), 6000);
    return () => {
      window.clearTimeout(minTimer);
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  useEffect(() => {
    return () => {
      game.stop();
      audio.stopMusic();
    };
  }, []);

  const assetsReady = progress >= 100 && !active;
  const loading = !fallbackDone && !(assetsReady && minTimeDone);

  useEffect(() => {
    if (!loading) game.markReady();
  }, [loading]);

  const quit = () => {
    game.stop();
    audio.stopMusic();
    onQuit();
  };

  const replay = () => {
    audio.init();
    game.restart();
  };

  const nextLevel = () => {
    const current = getLevel(hud.level.id);
    const next = LEVELS.find((level) => level.index === current.index + 1);
    if (!next) {
      quit();
      return;
    }
    audio.init();
    game.start(next.id, game.playerCount);
  };

  return (
    <div className="game-screen">
      <GameScene levelId={hud.level.id} />
      <div className="scene-vignette" />
      <div className="scene-grain" />

      <TouchControls hud={hud} />
      <HUD
        hud={hud}
        muted={muted}
        onPause={() => game.pause()}
        onToggleMute={onToggleMute}
        onFullscreen={onFullscreen}
        fullscreenActive={fullscreenActive}
        showFullscreen={showFullscreen}
      />
      <CountdownOverlay hud={hud} />
      {!portrait ? (
        <PauseOverlay
          hud={hud}
          muted={muted}
          onResume={() => game.resume()}
          onRestart={replay}
          onQuit={quit}
          onToggleMute={onToggleMute}
          onHelp={() => setHelpOpen(true)}
        />
      ) : null}
      <ResultsOverlay
        hud={hud}
        onReplay={replay}
        onNext={nextLevel}
        onQuit={quit}
      />
      {loading ? (
        <LoadingScreen
          progress={Math.max(6, progress)}
          levelName={getLevel(hud.level.id).name}
        />
      ) : null}
      {helpOpen ? <HelpModal onClose={() => setHelpOpen(false)} /> : null}
      {portrait && hud.phase !== "results" ? <PortraitGate onQuit={quit} /> : null}
    </div>
  );
}
