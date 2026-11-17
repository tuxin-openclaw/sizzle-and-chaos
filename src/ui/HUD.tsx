import { useEffect, useRef, type CSSProperties } from "react";
import { getLevel, PLAYERS, RECIPES, matchRecipe } from "../game/data";
import type { GameHud, PlayerHud } from "../game/engine";
import {
  ClockIcon,
  CoinIcon,
  FullscreenIcon,
  IngredientIcon,
  PauseIcon,
  PlateIcon,
  SoundIcon,
  StarIcon,
} from "./icons";

function formatTime(seconds: number): string {
  const safe = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function PlayerPrompt({ player }: { player: PlayerHud }) {
  const meta = PLAYERS[player.id - 1] ?? PLAYERS[0];
  const hint = player.hint;
  if (!hint) return null;
  const carry = player.carry;
  return (
    <div
      className={`player-prompt tone-${hint.tone}`}
      style={{ "--player": meta.color } as CSSProperties}
    >
      <span className="prompt-player">
        P{player.id}
        <span className="prompt-player-name">{meta.name}</span>
      </span>
      <span className="prompt-key">{player.key}</span>
      <span className="prompt-text">{hint.text}</span>
      {carry ? (
        <span className="prompt-carry">
          {carry.kind === "plate" ? (
            <>
              <PlateIcon size={20} />
              {carry.contents.length === 0 ? (
                <span className="prompt-carry-label">空盘</span>
              ) : (
                <span className="prompt-carry-icons">
                  {carry.contents.map((ingredient, index) => (
                    <IngredientIcon
                      key={`${ingredient.id}-${index}`}
                      id={ingredient.id}
                      state={ingredient.state}
                      size={17}
                    />
                  ))}
                </span>
              )}
              {matchRecipe(carry.contents) ? (
                <b className="prompt-carry-dish">
                  {matchRecipe(carry.contents)?.name}
                </b>
              ) : null}
            </>
          ) : (
            <>
              <IngredientIcon
                id={carry.item.id}
                state={carry.item.state}
                size={20}
              />
              <b className="prompt-carry-label">
                {carry.item.id === "meat" && carry.item.state === "cooked"
                  ? "煎肉饼"
                  : carry.item.id === "meat" && carry.item.state === "burnt"
                    ? "焦肉饼"
                    : `${carry.item.state === "chopped" ? "切好的" : ""}${
                        carry.item.id === "bun"
                          ? "面包"
                          : carry.item.id === "lettuce"
                            ? "生菜"
                            : carry.item.id === "tomato"
                              ? "番茄"
                              : "肉饼"
                      }`}
              </b>
            </>
          )}
        </span>
      ) : null}
    </div>
  );
}

export function HUD({
  hud,
  muted,
  onPause,
  onToggleMute,
  onFullscreen,
  fullscreenActive,
  showFullscreen,
}: {
  hud: GameHud;
  muted: boolean;
  onPause: () => void;
  onToggleMute: () => void;
  onFullscreen: () => void;
  fullscreenActive: boolean;
  showFullscreen: boolean;
}) {
  const level = getLevel(hud.level.id);
  const railRef = useRef<HTMLDivElement>(null);
  const orderCount = hud.orders.length;

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollTo({ left: rail.scrollWidth, behavior: "smooth" });
  }, [orderCount]);

  const target = level.starScores[0];
  const progress = Math.min(1, hud.score / level.starScores[2]);
  const comboMultiplier = 1 + Math.max(0, hud.combo - 1) * 0.25;
  return (
    <div className={`hud phase-${hud.phase}`}>
      <div className="hud-top">
        <div className="level-tag">
          <div className="level-tag-top">
            <span>KITCHEN 0{hud.level.index}</span>
            <span className="level-tag-diff">
              {Array.from({ length: hud.level.difficulty }).map((_, index) => (
                <span key={index}>🔥</span>
              ))}
            </span>
          </div>
          <b>{hud.level.name}</b>
          <span className="level-tag-en">{hud.level.en}</span>
          <div className="level-goal">
            <div className="level-goal-bar">
              <span style={{ width: `${progress * 100}%` }} />
              <i style={{ left: `${(level.starScores[0] / level.starScores[2]) * 100}%` }} />
              <i style={{ left: `${(level.starScores[1] / level.starScores[2]) * 100}%` }} />
            </div>
            <span>目标 {target}</span>
          </div>
        </div>

        <div className="order-rail" ref={railRef}>
          {hud.orders.map((order) => {
            const recipe = RECIPES[order.recipeId];
            const ratio = Math.max(0, order.timeLeft / order.maxTime);
            const urgent = ratio < 0.26;
            return (
              <article
                key={order.id}
                className={`order-ticket ${urgent ? "is-urgent" : ""}`}
                style={{ "--ticket-accent": recipe.color } as CSSProperties}
              >
                <div className="ticket-pin" />
                <div className="ticket-top">
                  <span className="ticket-name">{recipe.name}</span>
                  <span className="ticket-en">{recipe.en}</span>
                </div>
                <div className="ticket-ingredients">
                  {recipe.ingredients.map((ingredient, index) => (
                    <span className="ticket-ingredient" key={`${ingredient.id}-${index}`}>
                      <IngredientIcon
                        id={ingredient.id}
                        state={ingredient.state}
                        size={30}
                      />
                    </span>
                  ))}
                  <span className="ticket-plate">
                    <PlateIcon size={24} />
                  </span>
                </div>
                <div className="ticket-timer">
                  <span style={{ width: `${ratio * 100}%` }} />
                </div>
              </article>
            );
          })}
          {hud.orders.length === 0 ? (
            <div className="order-empty">
              客人还没点单，先准备食材
              <span>下一单马上到</span>
            </div>
          ) : null}
        </div>

        <div className="hud-stats">
          <div className={`stat-pill timer ${hud.timeLeft < 20 ? "is-low" : ""}`}>
            <ClockIcon size={22} />
            <span>{formatTime(hud.timeLeft)}</span>
          </div>
          <div className="stat-pill score-pill">
            <CoinIcon size={22} />
            <span>{hud.score}</span>
          </div>
          <div className="hud-buttons">
            {showFullscreen ? (
              <button
                className="icon-btn hud-btn"
                onClick={onFullscreen}
                aria-label={fullscreenActive ? "退出全屏" : "进入全屏"}
                title={fullscreenActive ? "退出全屏" : "进入全屏"}
              >
                <FullscreenIcon active={fullscreenActive} />
              </button>
            ) : null}
            <button className="icon-btn hud-btn" onClick={onPause} aria-label="暂停">
              <PauseIcon />
            </button>
            <button
              className="icon-btn hud-btn"
              onClick={onToggleMute}
              aria-label={muted ? "打开声音" : "关闭声音"}
            >
              <SoundIcon muted={muted} size={22} />
            </button>
          </div>
          {hud.combo > 1 ? (
            <div className="combo-badge">
              <b>连击 ×{hud.combo}</b>
              <span>收益 {comboMultiplier.toFixed(2)}×</span>
              <i
                style={{
                  width: `${Math.max(0, Math.min(1, hud.comboTimer / 12)) * 100}%`,
                }}
              />
            </div>
          ) : null}
        </div>
      </div>

      <div className="toast-stack">
        {hud.toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.kind}`}>
            {toast.kind === "good" ? <StarIcon size={16} /> : null}
            {toast.text}
          </div>
        ))}
      </div>

      <div className="hud-bottom">
        <div className="controls-chip">
          <span className="controls-title">操作</span>
          <span>
            <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 移动
          </span>
          <span><kbd>E</kbd> 互动 / 按住切菜</span>
          {hud.playerCount === 2 ? (
            <span className="controls-p2">
              <kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd> + <kbd>Enter</kbd>
            </span>
          ) : null}
        </div>
        <div className="player-prompts">
          {hud.players.map((player) => (
            <PlayerPrompt key={player.id} player={player} />
          ))}
        </div>
      </div>
    </div>
  );
}
