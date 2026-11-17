import { useState, type CSSProperties } from "react";
import heroChef from "../assets/hero-chef-trimmed.png";
import { LEVELS, RECIPES } from "../game/data";
import { loadBestBook } from "../game/progress";
import {
  ArrowIcon,
  ChefHatIcon,
  ClockIcon,
  CoinIcon,
  FlameIcon,
  IngredientIcon,
  PlateIcon,
  SoundIcon,
  StarIcon,
} from "./icons";

export function MainMenu({
  muted,
  onToggleMute,
  onStart,
  onHelp,
}: {
  muted: boolean;
  onToggleMute: () => void;
  onStart: (levelId: string, playerCount: 1 | 2) => void;
  onHelp: () => void;
}) {
  const [mode, setMode] = useState<1 | 2>(1);
  const [selected, setSelected] = useState(LEVELS[0].id);
  const best = loadBestBook();
  const level = LEVELS.find((item) => item.id === selected) ?? LEVELS[0];

  return (
    <div className="menu-screen">
      <div className="menu-checker" />
      <div className="menu-glow menu-glow-a" />
      <div className="menu-glow menu-glow-b" />
      <header className="menu-topbar">
        <div className="brand-mini">
          <ChefHatIcon size={38} />
          <span>SIZZLE &amp; CHAOS</span>
        </div>
        <div className="menu-top-actions">
          <button className="btn btn-ghost btn-small" onClick={onHelp}>
            厨房手册
          </button>
          <button
            className="icon-btn"
            onClick={onToggleMute}
            aria-label={muted ? "打开声音" : "关闭声音"}
            title={muted ? "打开声音" : "关闭声音"}
          >
            <SoundIcon muted={muted} />
          </button>
        </div>
      </header>

      <main className="menu-main">
        <section className="menu-copy">
          <div className="kicker">
            <span className="kicker-dot" />
            CO-OP KITCHEN CHAOS
          </div>
          <h1 className="game-title" aria-label="Sizzle and Chaos">
            <span className="title-sizzle">SIZZLE</span>
            <span className="title-amp">&amp;</span>
            <span className="title-chaos">CHAOS</span>
          </h1>
          <div className="title-cn">
            灶台大乱斗
            <span className="title-cn-en">A TINY KITCHEN, A BIG MESS.</span>
          </div>
          <p className="menu-tagline">
            切菜、煎肉、装盘、出餐——在客人掀桌之前。
            <br />
            <span>一个人手忙脚乱，两个人鸡飞狗跳。</span>
          </p>

          <div className="mode-row" role="group" aria-label="游戏模式">
            <button
              className={`mode-card ${mode === 1 ? "is-active" : ""}`}
              onClick={() => setMode(1)}
            >
              <span className="mode-emoji">🧑‍🍳</span>
              <span>
                <b>单人挑战</b>
                <small>WASD + E</small>
              </span>
              <span className="mode-check" />
            </button>
            <button
              className={`mode-card ${mode === 2 ? "is-active" : ""}`}
              onClick={() => setMode(2)}
            >
              <span className="mode-emoji">👨‍🍳👩‍🍳</span>
              <span>
                <b>同屏双人</b>
                <small>P1 WASD/E · P2 方向键/Enter</small>
              </span>
              <span className="mode-check" />
            </button>
          </div>

          <div className="level-heading">
            <span>选择今晚的厨房</span>
            <span className="level-heading-line" />
            <span>{LEVELS.length} 个厨房</span>
          </div>
          <div className="level-picker">
            {LEVELS.map((item) => {
              const record = best[item.id];
              const active = item.id === selected;
              return (
                <button
                  key={item.id}
                  className={`level-card ${active ? "is-active" : ""}`}
                  onClick={() => setSelected(item.id)}
                  style={
                    {
                      "--level-a": item.theme.floorA,
                      "--level-b": item.theme.floorB,
                      "--level-accent": item.theme.wainscot,
                    } as CSSProperties
                  }
                >
                  <div className="level-thumb">
                    <span className="level-thumb-floor" />
                    <span className="level-thumb-counter" />
                    <span className="level-thumb-board" />
                    <span className="level-thumb-steam" />
                    <span className="level-num">0{item.index}</span>
                  </div>
                  <div className="level-card-body">
                    <span className="level-en">{item.en}</span>
                    <span className="level-name">{item.name}</span>
                    <span className="level-meta">
                      <ClockIcon size={14} />
                      {Math.floor(item.duration / 60)} 分钟
                      <span className="level-diff" aria-label={`难度 ${item.difficulty}`}>
                        {Array.from({ length: 3 }).map((_, index) => (
                          <span
                            key={index}
                            className={index < item.difficulty ? "is-on" : ""}
                          >
                            <FlameIcon size={14} />
                          </span>
                        ))}
                      </span>
                    </span>
                  </div>
                  <div className="level-best">
                    {record ? (
                      <>
                        <span className="level-best-stars">
                          {[1, 2, 3].map((star) => (
                            <StarIcon
                              key={star}
                              size={16}
                              filled={star <= record.stars}
                            />
                          ))}
                        </span>
                        <span className="level-best-score">
                          <CoinIcon size={14} />
                          {record.score}
                        </span>
                      </>
                    ) : (
                      <span className="level-best-new">首次营业</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="start-row">
            <button
              className="btn btn-primary btn-start"
              onClick={() => onStart(selected, mode)}
            >
              <span>开灶营业</span>
              <ArrowIcon size={24} />
            </button>
            <div className="start-hint">
              <b>{level.name}</b>
              <span>{level.tagline}</span>
              <span className="start-ingredients">
                {RECIPES.burger.ingredients.map((ingredient) => (
                  <IngredientIcon
                    key={ingredient.id}
                    id={ingredient.id}
                    state={ingredient.state}
                    size={20}
                  />
                ))}
                <PlateIcon size={22} />
                做出客人点的菜
              </span>
            </div>
          </div>
        </section>

        <section className="menu-art" aria-hidden>
          <div className="art-sun" />
          <div className="art-blob" />
          <div className="art-sticker sticker-one">
            <IngredientIcon id="tomato" size={54} />
          </div>
          <div className="art-sticker sticker-two">
            <IngredientIcon id="lettuce" state="chopped" size={58} />
          </div>
          <div className="art-sticker sticker-three">
            <IngredientIcon id="bun" size={50} />
          </div>
          <div className="art-sticker sticker-four">
            <IngredientIcon id="meat" state="cooked" size={54} />
          </div>
          <img
            className="hero-chef"
            src={heroChef}
            alt=""
            draggable={false}
          />
          <div className="art-plaque">
            <span>CHEF PEPPER</span>
            <small>HEAD OF THE MESS</small>
          </div>
          <div className="art-steam steam-a" />
          <div className="art-steam steam-b" />
          <div className="art-spark spark-a">✦</div>
          <div className="art-spark spark-b">✦</div>
        </section>
      </main>

      <footer className="menu-footer">
        <span>THREE.JS · REACT THREE FIBER · BLENDER</span>
        <span>本地同屏 · 键盘游玩 · 支持存档最佳成绩</span>
      </footer>
      <button
        className="btn btn-primary mobile-start-fab"
        onClick={() => onStart(selected, mode)}
      >
        开灶营业
        <ArrowIcon size={20} />
      </button>
    </div>
  );
}
