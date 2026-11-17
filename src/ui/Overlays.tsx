import { useMemo } from "react";
import { LEVELS, PLAYERS, RECIPES } from "../game/data";
import type { GameHud } from "../game/engine";
import {
  ArrowIcon,
  ChefHatIcon,
  CoinIcon,
  FlameIcon,
  IngredientIcon,
  PlateIcon,
  SoundIcon,
  StarIcon,
} from "./icons";

export function LoadingScreen({
  progress,
  levelName,
}: {
  progress: number;
  levelName: string;
}) {
  return (
    <div className="loading-screen">
      <div className="loading-card">
        <div className="loading-hat">
          <ChefHatIcon size={64} />
          <span className="loading-steam s1" />
          <span className="loading-steam s2" />
          <span className="loading-steam s3" />
        </div>
        <div className="loading-kicker">PREHEATING THE KITCHEN</div>
        <h2>正在热锅……</h2>
        <p>{levelName} 的灶台已经点上火了。</p>
        <div className="loading-bar">
          <span style={{ width: `${Math.max(4, progress)}%` }} />
        </div>
        <div className="loading-meta">
          <span>{Math.round(progress)}%</span>
          <span>切菜 / 煎肉 / 装盘 / 出餐</span>
        </div>
      </div>
    </div>
  );
}

export function CountdownOverlay({ hud }: { hud: GameHud }) {
  if (hud.phase !== "countdown") return null;
  const count = Math.max(1, Math.ceil(hud.countdown));
  return (
    <div className="countdown-overlay">
      <div className="countdown-top">
        <span className="kicker">
          <span className="kicker-dot" />
          KITCHEN 0{hud.level.index} · {hud.level.en}
        </span>
        <h2>{hud.level.name}</h2>
        <p>{hud.level.tagline}</p>
      </div>
      <div className="countdown-number" key={count}>
        {count}
      </div>
      <div className="countdown-flow">
        <span><b>1</b><PlateIcon size={24} />装盘台拿盘</span>
        <i>→</i>
        <span><b>2</b><IngredientIcon id="lettuce" size={24} />备料切菜</span>
        <i>→</i>
        <span><b>3</b><FlameIcon size={24} />煎熟装盘</span>
        <i>→</i>
        <span><b>4</b><ChefHatIcon size={24} />ORDER UP 出餐</span>
      </div>
      <div className="countdown-note">
        {hud.playerCount === 1
          ? "一个人也要稳住节奏：先到装盘台拿盘，再备料。"
          : "别抢同一个砧板，分工才是双人厨房的真谛。"}
      </div>
    </div>
  );
}

export function PauseOverlay({
  hud,
  muted,
  onResume,
  onRestart,
  onQuit,
  onToggleMute,
  onHelp,
}: {
  hud: GameHud;
  muted: boolean;
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
  onToggleMute: () => void;
  onHelp: () => void;
}) {
  if (hud.phase !== "paused") return null;
  return (
    <div className="modal-backdrop">
      <div className="paper-panel pause-panel">
        <div className="panel-tape" />
        <div className="panel-kicker">SERVICE PAUSED</div>
        <h2>暂停营业</h2>
        <p className="panel-sub">锅还热着，客人在等。喘口气就回来。</p>
        <div className="pause-orders">
          <span>当前订单</span>
          <div>
            {hud.orders.length === 0 ? (
              <em>暂时没有订单</em>
            ) : (
              hud.orders.map((order) => (
                <span
                  key={order.id}
                  className="pause-order-chip"
                  style={{ borderColor: RECIPES[order.recipeId].color }}
                >
                  {RECIPES[order.recipeId].name}
                  <small>{Math.ceil(order.timeLeft)}s</small>
                </span>
              ))
            )}
          </div>
        </div>
        <div className="pause-controls">
          {hud.players.map((player) => (
            <div key={player.id} className="pause-player" style={{ borderColor: PLAYERS[player.id - 1]?.color }}>
              <span>P{player.id}</span>
              <b>{player.name}</b>
              <small>{player.id === 1 ? "WASD · E" : "方向键 · Enter"}</small>
            </div>
          ))}
        </div>
        <div className="pause-hint">
          <b>小提示</b>
          <span>按住动作键才能切菜；肉饼煎好后会继续变焦，记得及时装盘。</span>
        </div>
        <div className="panel-actions">
          <button className="btn btn-primary" onClick={onResume}>
            继续营业
          </button>
          <button className="btn btn-paper" onClick={onRestart}>
            重开这一关
          </button>
          <button className="btn btn-paper" onClick={onHelp}>
            厨房手册
          </button>
          <button className="btn btn-paper" onClick={onToggleMute}>
            <SoundIcon muted={muted} size={18} />
            {muted ? "打开声音" : "关闭声音"}
          </button>
          <button className="btn btn-ghost" onClick={onQuit}>
            回主菜单
          </button>
        </div>
      </div>
    </div>
  );
}

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 34 }, (_, index) => ({
        left: 4 + Math.random() * 92,
        delay: Math.random() * 0.7,
        duration: 2.2 + Math.random() * 2,
        color: ["#E85A45", "#F2C14E", "#2F817A", "#FFF4DE", "#6FA845"][index % 5],
        rotate: Math.random() * 180,
        size: 8 + Math.random() * 10,
      })),
    [],
  );
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((piece, index) => (
        <span
          key={index}
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            background: piece.color,
            width: piece.size,
            height: piece.size * 0.55,
            transform: `rotate(${piece.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export function ResultsOverlay({
  hud,
  onReplay,
  onNext,
  onQuit,
}: {
  hud: GameHud;
  onReplay: () => void;
  onNext: () => void;
  onQuit: () => void;
}) {
  const result = hud.result;
  if (!result) return null;
  const level = LEVELS.find((item) => item.id === hud.level.id) ?? LEVELS[0];
  const next = LEVELS.find((item) => item.index === level.index + 1);
  const starCopy =
    result.stars >= 3
      ? "完美出餐！这座厨房被你拿捏了。"
      : result.stars === 2
        ? "漂亮！再快一点就是三星厨房。"
        : result.stars === 1
          ? "顺利收工，但客人的耐心还有提升空间。"
          : "厨房还在冒烟……再来一局找找节奏。";
  return (
    <div className="modal-backdrop results-backdrop">
      {result.stars >= 2 ? <Confetti /> : null}
      <div className="paper-panel results-panel">
        <div className="panel-tape" />
        <div className="results-top">
          <div>
            <div className="panel-kicker">SERVICE COMPLETE · KITCHEN 0{level.index}</div>
            <h2>{result.stars >= 2 ? "今晚生意不错！" : "打烊盘点"}</h2>
            <p className="panel-sub">{starCopy}</p>
          </div>
          <div className="results-stamp">
            <span>SCORE</span>
            <b>{result.score}</b>
            {result.newBest ? <em>NEW BEST!</em> : null}
          </div>
        </div>

        <div className="result-stars">
          {[1, 2, 3].map((star) => (
            <span
              key={star}
              className={`result-star ${star <= result.stars ? "is-filled" : ""}`}
              style={{ animationDelay: `${0.15 + star * 0.16}s` }}
            >
              <StarIcon size={64} filled={star <= result.stars} />
            </span>
          ))}
        </div>

        <div className="result-stats">
          <div className="result-stat">
            <span>成功出餐</span>
            <b>{result.served}</b>
            <small>份</small>
          </div>
          <div className="result-stat">
            <span>流失订单</span>
            <b>{result.expired}</b>
            <small>单</small>
          </div>
          <div className="result-stat">
            <span>切菜次数</span>
            <b>{result.chopped}</b>
            <small>次</small>
          </div>
          <div className="result-stat">
            <span>最高连击</span>
            <b>×{Math.max(1, result.bestCombo)}</b>
            <small>combo</small>
          </div>
        </div>

        <div className="result-best">
          <span>
            <StarIcon size={18} filled={result.best.stars > 0} />
            历史最佳
          </span>
          <b>{result.best.score}</b>
          <span className="result-best-stars">
            {[1, 2, 3].map((star) => (
              <StarIcon
                key={star}
                size={18}
                filled={star <= result.best.stars}
              />
            ))}
          </span>
        </div>

        <div className="panel-actions results-actions">
          <button className="btn btn-primary" onClick={onReplay}>
            再开一局
          </button>
          {next ? (
            <button className="btn btn-paper" onClick={onNext}>
              下一关：{next.name}
              <ArrowIcon size={18} />
            </button>
          ) : (
            <button className="btn btn-paper" onClick={onQuit}>
              回到厨房选择
            </button>
          )}
          <button className="btn btn-ghost" onClick={onQuit}>
            主菜单
          </button>
        </div>
      </div>
    </div>
  );
}

export function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop help-backdrop" onClick={onClose}>
      <div
        className="paper-panel help-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="help-close" onClick={onClose} aria-label="关闭">
          ×
        </button>
        <div className="panel-kicker">THE KITCHEN HANDBOOK</div>
        <h2>厨房手册</h2>
        <p className="panel-sub">
          这是一间很缺人手的餐厅。规则很简单：看懂订单、把菜做对、在客人爆炸前送出去。
        </p>

        <div className="help-grid">
          <section>
            <h3><span>01</span>两个人，一间厨房</h3>
            <p>
              单人可以玩，但双人更好笑。P1 使用 <kbd>WASD</kbd> 移动、
              <kbd>E</kbd> 互动；P2 使用 <kbd>方向键</kbd> 和 <kbd>Enter</kbd>。
              靠近操作台时，屏幕底部会出现当前能做的事。
            </p>
            <div className="help-player-row">
              {PLAYERS.map((player) => (
                <span key={player.id} style={{ borderColor: player.color }}>
                  <i style={{ background: player.color }} />
                  P{player.id} {player.name}
                  <small>{player.id === 1 ? "WASD + E" : "方向键 + Enter"}</small>
                </span>
              ))}
            </div>
          </section>
          <section>
            <h3><span>02</span>一条出餐流水线</h3>
            <ol className="help-steps">
              <li><PlateIcon size={24} /><span><b>装盘台</b> 到标着「装盘台 / PLATING STATION」的红色柜台，台上有盘子。</span></li>
              <li><IngredientIcon id="lettuce" size={24} /><span><b>取食材</b> 货箱里拿生菜、番茄、面包或肉饼。</span></li>
              <li><ChefHatIcon size={24} /><span><b>切菜</b> 放到砧板上，<b>按住</b>动作键切碎。</span></li>
              <li><FlameIcon size={24} /><span><b>煎肉</b> 切好的肉饼下锅，煎好及时拿起。</span></li>
              <li><PlateIcon size={24} /><span><b>装盘</b> 把准备好的食材拿到装盘台按互动键放上盘子；也可以空手拿盘，再去砧板/锅里收集。</span></li>
              <li><CoinIcon size={24} /><span><b>出餐</b> 端起完整盘子到 ORDER UP 窗口送出。</span></li>
            </ol>
          </section>
          <section>
            <h3><span>03</span>订单就是圣旨</h3>
            <p>
              上方票据显示配方。经典汉堡需要面包 + 煎肉饼 + 切碎生菜；
              田园沙拉需要切碎生菜 + 切碎番茄；豪华汉堡再加一份切碎番茄。
              盘子里的东西必须和订单完全一致。找不到装盘处时，认准头顶有「装盘台」木牌的柜台。
            </p>
            <div className="help-recipes">
              {Object.values(RECIPES).map((recipe) => (
                <div key={recipe.id} className="help-recipe">
                  <span style={{ background: recipe.color }}>{recipe.name}</span>
                  <div>
                    {recipe.ingredients.map((ingredient, index) => (
                      <IngredientIcon
                        key={`${ingredient.id}-${index}`}
                        id={ingredient.id}
                        state={ingredient.state}
                        size={26}
                      />
                    ))}
                  </div>
                  <small>{recipe.baseScore} 分基础</small>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h3><span>04</span>别把厨房点着了</h3>
            <ul className="help-tips">
              <li>订单倒计时结束会流失，分数 -15，连击清零。</li>
              <li>肉饼煎太久会焦，焦掉的东西只能丢进垃圾桶。</li>
              <li>连续出餐会积累连击，最高 2 倍收益。</li>
              <li>切菜时要按着动作键；松开就会暂停，进度会保留。</li>
              <li><kbd>Esc</kbd> / <kbd>P</kbd> 暂停，<kbd>M</kbd> 静音（也有按钮）。</li>
              <li>手机全屏：点右上角 ⛶；iPhone 可分享 → 添加到主屏幕，从图标启动即全屏。</li>
            </ul>
          </section>
        </div>

        <div className="help-footer">
          <div>
            <ChefHatIcon size={30} />
            <span>
              本作是 Overcooked 风格的原创同屏厨房小品，
              使用 Three.js + React Three Fiber 实时渲染，
              Blender 建模与烘焙视觉素材。
            </span>
          </div>
          <button className="btn btn-primary" onClick={onClose}>
            明白了，开灶！
          </button>
        </div>
      </div>
    </div>
  );
}


export function PortraitGate({ onQuit }: { onQuit: () => void }) {
  return (
    <div className="orientation-gate">
      <div className="orientation-phone">
        <span className="orientation-kitchen">
          <i />
          <i />
          <i />
        </span>
        <span className="orientation-rotate">↻</span>
      </div>
      <div className="orientation-copy">
        <div className="panel-kicker">LANDSCAPE KITCHEN</div>
        <h2>把手机横过来</h2>
        <p>厨房太宽了，竖屏装不下。旋转设备，继续出餐。</p>
        <div className="orientation-tips">
          <span>🍳 横屏视野更完整</span>
          <span>👆 左摇杆移动 · 右按钮互动</span>
        </div>
        <button className="btn btn-paper" onClick={onQuit}>
          先回主菜单
        </button>
      </div>
    </div>
  );
}

export function FullscreenTipModal({
  ios,
  onClose,
}: {
  ios: boolean;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop fullscreen-tip-backdrop" onClick={onClose}>
      <div
        className="paper-panel fullscreen-tip-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="help-close" onClick={onClose} aria-label="关闭">
          ×
        </button>
        <div className="panel-kicker">BIGGER KITCHEN</div>
        <h2>{ios ? "iPhone 全屏开灶指南" : "把厨房铺满屏幕"}</h2>
        <p className="panel-sub">
          {ios
            ? "Safari 不允许普通网页隐藏地址栏。把游戏添加到主屏幕后，从桌面图标打开，就会以全屏 App 的样子运行。"
            : "当前浏览器没有允许网页进入全屏。可以试试最新版 Chrome / Edge，或者把游戏添加到主屏幕后从图标启动。"}
        </p>
        <div className="fullscreen-steps">
          <div className="fullscreen-step">
            <span>1</span>
            <div>
              <b>打开分享菜单</b>
              <small>
                {ios
                  ? "在 Safari 底部（或顶部）点分享按钮。"
                  : "打开浏览器右上角菜单，寻找「安装应用」或「添加到主屏幕」。"}
              </small>
            </div>
            <i className="share-glyph">↑</i>
          </div>
          <div className="fullscreen-step">
            <span>2</span>
            <div>
              <b>选择「添加到主屏幕」</b>
              <small>名称保持「灶台大乱斗」或「Sizzle & Chaos」即可。</small>
            </div>
          </div>
          <div className="fullscreen-step">
            <span>3</span>
            <div>
              <b>从主屏幕图标启动</b>
              <small>不会再有地址栏，配合横屏就是完整厨房视野。</small>
            </div>
          </div>
        </div>
        <div className="fullscreen-note">
          <span className="fullscreen-note-icon">⛶</span>
          <span>
            游戏开始时会自动尝试全屏；游戏内右上角的 ⛶ 按钮也可以随时切换。
            iPhone 需要从主屏幕启动才会真正全屏。
          </span>
        </div>
        <div className="panel-actions">
          <button className="btn btn-primary" onClick={onClose}>
            知道了
          </button>
        </div>
      </div>
    </div>
  );
}
