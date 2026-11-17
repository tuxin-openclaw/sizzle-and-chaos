import { useEffect, useState } from "react";
import "./App.css";
import { audio } from "./game/audio";
import { game } from "./game/engine";
import { isIOS, useFullscreen } from "./game/useFullscreen";
import { preloadModels } from "./scene/models";
import { MainMenu } from "./ui/MainMenu";
import { FullscreenTipModal, HelpModal } from "./ui/Overlays";
import { GameScreen } from "./ui/GameScreen";

type Screen = "menu" | "game";

function App() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [helpOpen, setHelpOpen] = useState(false);
  const [fullscreenTipOpen, setFullscreenTipOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const fullscreen = useFullscreen();

  useEffect(() => {
    audio.loadMutedPreference();
    setMuted(audio.isMuted());
    preloadModels();
  }, []);

  const toggleMute = () => {
    audio.init();
    const next = !audio.isMuted();
    audio.setMuted(next);
    setMuted(next);
  };

  useEffect(() => {
    const handler = () => toggleMute();
    window.addEventListener("sizzle:toggle-mute", handler);
    return () => window.removeEventListener("sizzle:toggle-mute", handler);
  });

  const handleFullscreen = async () => {
    if (fullscreen.isFullscreen) {
      await fullscreen.exit();
      return;
    }
    const ok = await fullscreen.request();
    if (!ok) {
      if (game.phase === "playing") game.pause();
      setFullscreenTipOpen(true);
    }
  };

  const startGame = (levelId: string, playerCount: 1 | 2) => {
    audio.init();
    audio.setMuted(muted);
    if (window.matchMedia("(pointer: coarse)").matches) void fullscreen.request();
    game.start(levelId, playerCount, true);
    setScreen("game");
  };

  const quitToMenu = () => {
    game.stop();
    audio.stopMusic();
    setScreen("menu");
  };

  return (
    <div className={`app ${screen === "game" ? "is-playing" : "is-menu"}`}>
      {screen === "menu" ? (
        <MainMenu
          muted={muted}
          onToggleMute={toggleMute}
          onStart={startGame}
          onHelp={() => setHelpOpen(true)}
          onFullscreen={handleFullscreen}
          fullscreenActive={fullscreen.isFullscreen}
          showFullscreen={!fullscreen.standalone}
        />
      ) : (
        <GameScreen
          muted={muted}
          onToggleMute={toggleMute}
          onQuit={quitToMenu}
          onFullscreen={handleFullscreen}
          fullscreenActive={fullscreen.isFullscreen}
          showFullscreen={!fullscreen.standalone}
        />
      )}
      {helpOpen ? <HelpModal onClose={() => setHelpOpen(false)} /> : null}
      {fullscreenTipOpen ? (
        <FullscreenTipModal
          ios={isIOS()}
          onClose={() => setFullscreenTipOpen(false)}
        />
      ) : null}
    </div>
  );
}

export default App;
