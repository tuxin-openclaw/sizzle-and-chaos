import { useEffect, useState } from "react";
import "./App.css";
import { audio } from "./game/audio";
import { game } from "./game/engine";
import { preloadModels } from "./scene/models";
import { MainMenu } from "./ui/MainMenu";
import { HelpModal } from "./ui/Overlays";
import { GameScreen } from "./ui/GameScreen";

type Screen = "menu" | "game";

function App() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [helpOpen, setHelpOpen] = useState(false);
  const [muted, setMuted] = useState(false);

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

  const startGame = (levelId: string, playerCount: 1 | 2) => {
    audio.init();
    audio.setMuted(muted);
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
        />
      ) : (
        <GameScreen
          muted={muted}
          onToggleMute={toggleMute}
          onQuit={quitToMenu}
        />
      )}
      {helpOpen ? <HelpModal onClose={() => setHelpOpen(false)} /> : null}
    </div>
  );
}

export default App;
