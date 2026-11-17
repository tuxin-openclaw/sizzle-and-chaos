import {
  INGREDIENT_META,
  LEVELS,
  PLAYERS,
  RECIPES,
  canAddToPlate,
  getLevel,
  matchRecipe,
} from "./data";
import { audio } from "./audio";
import { loadBestBook, recordBest, type BestRecord } from "./progress";
import type {
  Carry,
  Ingredient,
  IngredientId,
  LevelDef,
  RecipeId,
  StationType,
} from "./types";

const PLAYER_RADIUS = 0.34;
const MOVE_SPEED = 4.35;
const INTERACT_DISTANCE = 0.9;
const STATION_HALF_W = 0.9;
const STATION_HALF_D = 0.5;
const COOK_TIME = 4.2;
const BURN_TIME = 6.4;
const CHOP_TIME: Record<IngredientId, number> = {
  bun: 2,
  meat: 3.1,
  lettuce: 2.35,
  tomato: 2.2,
};
const COMBO_WINDOW = 12;

export type Phase = "idle" | "countdown" | "playing" | "paused" | "results";

export interface PlayerState {
  id: number;
  x: number;
  z: number;
  vx: number;
  vz: number;
  facing: number;
  carry: Carry;
  actionHeld: boolean;
  actionPressed: boolean;
  nearStationId: string | null;
  chopping: boolean;
  moving: boolean;
}

export interface StationState {
  id: string;
  type: StationType;
  ingredient?: IngredientId;
  x: number;
  z: number;
  rot: number;
  item: Ingredient | null;
  progress: number;
  cookTimer: number;
  beingChopped: boolean;
}

export interface Collider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface Order {
  id: number;
  recipeId: RecipeId;
  timeLeft: number;
  maxTime: number;
}

export type HintTone = "do" | "hold" | "wait" | "no" | "idle";

export interface InteractionHint {
  text: string;
  tone: HintTone;
}

export interface PlayerHud {
  id: number;
  name: string;
  color: string;
  key: string;
  carry: Carry;
  hint: InteractionHint | null;
  chopping: boolean;
  nearStationId: string | null;
}

export interface ToastItem {
  id: number;
  text: string;
  kind: "good" | "bad" | "info" | "warn";
  ttl: number;
}

export interface ResultData {
  score: number;
  stars: number;
  served: number;
  expired: number;
  chopped: number;
  bestCombo: number;
  best: BestRecord;
  newBest: boolean;
}

export interface GameHud {
  phase: Phase;
  level: {
    id: string;
    index: number;
    name: string;
    en: string;
    tagline: string;
    difficulty: number;
  };
  playerCount: number;
  timeLeft: number;
  countdown: number;
  score: number;
  combo: number;
  comboTimer: number;
  orders: Order[];
  players: PlayerHud[];
  toasts: ToastItem[];
  result: ResultData | null;
  stats: {
    served: number;
    expired: number;
    chopped: number;
    bestCombo: number;
  };
}

type NearTarget =
  | { kind: "station"; id: string; station: StationState; distance: number }
  | { kind: "trash"; id: "trash"; distance: number };

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function lerpAngle(current: number, target: number, amount: number): number {
  const diff = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + diff * amount;
}

export class GameEngine {
  phase: Phase = "idle";
  level: LevelDef = LEVELS[0];
  playerCount = 1;
  players: PlayerState[] = [];
  stations: Record<string, StationState> = {};
  colliders: Collider[] = [];
  orders: Order[] = [];
  timeLeft = 0;
  countdown = 0;
  score = 0;
  combo = 0;
  comboTimer = 0;
  shake = 0;
  result: ResultData | null = null;
  stats = { served: 0, expired: 0, chopped: 0, bestCombo: 0 };
  toasts: ToastItem[] = [];
  version = 0;
  waitingForLoad = false;
  hud: GameHud;

  private keys = new Set<string>();
  private pressedKeys = new Set<string>();
  private touchVector = { x: 0, z: 0 };
  private touchAction = false;
  private touchPressed = false;
  private orderTimer = 0;
  private nextOrderId = 1;
  private nextToastId = 1;
  private hudAccumulator = 0;
  private lastCountdownTick = 4;
  private lastWholeSecond = 0;
  private chopSoundAccumulator = 0;
  private fireSoundAccumulator = 0;
  private hudListeners = new Set<() => void>();
  private versionListeners = new Set<() => void>();

  constructor() {
    this.hud = this.buildHud();
  }

  // ---------------------------------------------------------------- input

  keyDown(code: string): void {
    if (!this.keys.has(code)) this.pressedKeys.add(code);
    this.keys.add(code);
  }

  keyUp(code: string): void {
    this.keys.delete(code);
  }

  setTouchVector(x: number, z: number): void {
    this.touchVector.x = x;
    this.touchVector.z = z;
  }

  setTouchAction(pressed: boolean): void {
    if (pressed && !this.touchAction) this.touchPressed = true;
    this.touchAction = pressed;
  }

  clearKeys(): void {
    this.keys.clear();
    this.pressedKeys.clear();
    this.touchAction = false;
    this.touchPressed = false;
    this.touchVector.x = 0;
    this.touchVector.z = 0;
    for (const player of this.players) {
      player.actionHeld = false;
      player.actionPressed = false;
      player.chopping = false;
    }
  }

  private actionFor(id: number): boolean {
    if (id === 1) return this.keys.has("KeyE") || this.touchAction;
    return this.keys.has("Enter") || this.keys.has("NumpadEnter");
  }

  private actionPressedFor(id: number): boolean {
    if (id === 1) {
      return this.pressedKeys.has("KeyE") || this.touchPressed;
    }
    return this.pressedKeys.has("Enter") || this.pressedKeys.has("NumpadEnter");
  }

  // ------------------------------------------------------------- lifecycle

  start(levelId: string, playerCount: number, deferStart = false): void {
    this.level = getLevel(levelId);
    this.waitingForLoad = deferStart;
    this.playerCount = playerCount === 2 ? 2 : 1;
    this.phase = "countdown";
    this.countdown = 3.0;
    this.lastCountdownTick = 4;
    this.timeLeft = this.level.duration;
    this.lastWholeSecond = Math.ceil(this.timeLeft);
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.shake = 0;
    this.result = null;
    this.orders = [];
    this.toasts = [];
    this.stats = { served: 0, expired: 0, chopped: 0, bestCombo: 0 };
    this.nextOrderId = 1;
    this.nextToastId = 1;
    this.hudAccumulator = 0;
    this.orderTimer = this.level.orderEvery * 0.7;
    this.chopSoundAccumulator = 0;
    this.fireSoundAccumulator = 0;
    this.clearKeys();

    this.players = Array.from({ length: this.playerCount }, (_, index) => {
      const spawn = this.level.spawns[index] ?? this.level.spawns[0];
      return {
        id: index + 1,
        x: spawn.x,
        z: spawn.z,
        vx: 0,
        vz: 0,
        facing: 0,
        carry: null,
        actionHeld: false,
        actionPressed: false,
        nearStationId: null,
        chopping: false,
        moving: false,
      };
    });

    this.stations = {};
    for (const block of this.level.blocks) {
      if (!block.station) continue;
      this.stations[block.id] = {
        id: block.id,
        type: block.station.type,
        ingredient: block.station.ingredient,
        x: block.x,
        z: block.z,
        rot: block.rot ?? 0,
        item: null,
        progress: 0,
        cookTimer: 0,
        beingChopped: false,
      };
    }

    this.colliders = this.level.blocks.map((block) => {
      const rotated = Boolean(block.rot);
      const hw = rotated ? STATION_HALF_D : STATION_HALF_W;
      const hd = rotated ? STATION_HALF_W : STATION_HALF_D;
      return {
        minX: block.x - hw,
        maxX: block.x + hw,
        minZ: block.z - hd,
        maxZ: block.z + hd,
      };
    });
    this.colliders.push({
      minX: this.level.trash.x - 0.36,
      maxX: this.level.trash.x + 0.36,
      minZ: this.level.trash.z - 0.36,
      maxZ: this.level.trash.z + 0.36,
    });

    this.orders = [
      this.makeOrder(this.level.index === 1 ? "salad" : undefined),
    ];
    this.bump();
    audio.startMusic();
  }

  restart(): void {
    this.start(this.level.id, this.playerCount);
  }

  markReady(): void {
    if (!this.waitingForLoad) return;
    this.waitingForLoad = false;
    this.countdown = 3;
    this.bump();
  }

  stop(): void {
    this.phase = "idle";
    this.clearKeys();
    this.players = [];
    this.orders = [];
    this.toasts = [];
    audio.stopMusic();
    this.bump();
  }

  pause(): void {
    if (this.phase !== "playing") return;
    this.phase = "paused";
    this.clearKeys();
    audio.pauseMusic();
    this.bump();
  }

  resume(): void {
    if (this.phase !== "paused") return;
    this.phase = "playing";
    audio.resumeMusic();
    this.bump();
  }

  togglePause(): void {
    if (this.phase === "playing") this.pause();
    else if (this.phase === "paused") this.resume();
  }

  // --------------------------------------------------------------- update

  update(rawDt: number): void {
    const dt = Math.min(0.05, Math.max(0.0001, rawDt));
    this.shake = Math.max(0, this.shake - dt * 2.2);
    this.updateToasts(dt);

    if (this.phase === "countdown") {
      if (this.waitingForLoad) {
        this.pressedKeys.clear();
        this.touchPressed = false;
        this.throttleHud(dt);
        return;
      }
      this.pressedKeys.clear();
      this.touchPressed = false;
      this.countdown -= dt;
      const tick = Math.ceil(this.countdown);
      if (tick !== this.lastCountdownTick && tick > 0) {
        this.lastCountdownTick = tick;
        audio.play("tick");
      }
      if (this.countdown <= 0) {
        this.phase = "playing";
        this.countdown = 0;
        this.orderTimer = this.level.orderEvery * 0.8;
        audio.play("go");
        this.showToast("开灶！先看订单再动手", "info");
        this.bump();
      }
      this.throttleHud(dt);
      return;
    }

    if (this.phase !== "playing") {
      if (this.phase === "paused") this.throttleHud(dt);
      return;
    }

    this.timeLeft = Math.max(0, this.timeLeft - dt);
    const whole = Math.ceil(this.timeLeft);
    if (whole !== this.lastWholeSecond) {
      this.lastWholeSecond = whole;
      if (whole <= 10 && whole > 0) audio.play("tick");
    }

    for (const player of this.players) {
      const held = this.actionFor(player.id);
      player.actionPressed =
        this.actionPressedFor(player.id) || (held && !player.actionHeld);
      player.actionHeld = held;
      player.chopping = false;
      this.updatePlayer(player, dt);
    }

    // Interactions happen after movement so the nearest station is current.
    for (const player of this.players) {
      const target = this.nearestTarget(player);
      player.nearStationId = target?.id ?? null;
      if (player.actionPressed && target) {
        this.interact(player, target);
      }
    }

    this.pressedKeys.clear();
    this.touchPressed = false;
    this.updateChopping(dt);
    this.updateStoves(dt);
    this.updateOrders(dt);
    this.updateCombo();

    if (this.comboTimer > 0) {
      this.comboTimer = Math.max(0, this.comboTimer - dt);
    }

    if (this.timeLeft <= 0) {
      this.finish();
      return;
    }

    this.throttleHud(dt);
  }

  private updatePlayer(player: PlayerState, dt: number): void {
    let inputX = 0;
    let inputZ = 0;
    const solo = this.playerCount === 1;
    if (player.id === 1) {
      if (this.keys.has("KeyA") || (solo && this.keys.has("ArrowLeft"))) inputX -= 1;
      if (this.keys.has("KeyD") || (solo && this.keys.has("ArrowRight"))) inputX += 1;
      if (this.keys.has("KeyW") || (solo && this.keys.has("ArrowUp"))) inputZ -= 1;
      if (this.keys.has("KeyS") || (solo && this.keys.has("ArrowDown"))) inputZ += 1;
    } else {
      if (this.keys.has("ArrowLeft")) inputX -= 1;
      if (this.keys.has("ArrowRight")) inputX += 1;
      if (this.keys.has("ArrowUp")) inputZ -= 1;
      if (this.keys.has("ArrowDown")) inputZ += 1;
    }
    inputX += this.touchVector.x;
    inputZ += this.touchVector.z;

    const length = Math.hypot(inputX, inputZ);
    if (length > 0) {
      inputX /= length;
      inputZ /= length;
    }
    const targetVx = inputX * MOVE_SPEED;
    const targetVz = inputZ * MOVE_SPEED;
    const responsiveness = length > 0 ? 15 : 20;
    player.vx += (targetVx - player.vx) * Math.min(1, dt * responsiveness);
    player.vz += (targetVz - player.vz) * Math.min(1, dt * responsiveness);

    const speed = Math.hypot(player.vx, player.vz);
    if (speed < 0.03) {
      player.vx = 0;
      player.vz = 0;
    }
    player.moving = speed > 0.35;

    this.tryMove(player, player.vx * dt, 0);
    this.tryMove(player, 0, player.vz * dt);

    if (speed > 0.5) {
      const desired = Math.atan2(player.vx, player.vz);
      player.facing = lerpAngle(player.facing, desired, Math.min(1, dt * 14));
    }

    // Keep the two chefs from occupying the same spot.
    for (const other of this.players) {
      if (other.id <= player.id) continue;
      const dx = other.x - player.x;
      const dz = other.z - player.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.001 && dist < 0.62) {
        const push = (0.62 - dist) * 0.5;
        const nx = dx / dist;
        const nz = dz / dist;
        player.x -= nx * push;
        player.z -= nz * push;
        other.x += nx * push;
        other.z += nz * push;
      }
    }
    player.x = clamp(
      player.x,
      this.level.bounds.minX + PLAYER_RADIUS,
      this.level.bounds.maxX - PLAYER_RADIUS,
    );
    player.z = clamp(
      player.z,
      this.level.bounds.minZ + PLAYER_RADIUS,
      this.level.bounds.maxZ - PLAYER_RADIUS,
    );
  }

  private tryMove(player: PlayerState, dx: number, dz: number): void {
    if (dx !== 0) {
      const nextX = player.x + dx;
      if (this.canStand(nextX, player.z)) player.x = nextX;
      else player.vx = 0;
    }
    if (dz !== 0) {
      const nextZ = player.z + dz;
      if (this.canStand(player.x, nextZ)) player.z = nextZ;
      else player.vz = 0;
    }
  }

  private canStand(x: number, z: number): boolean {
    for (const collider of this.colliders) {
      if (
        x > collider.minX - PLAYER_RADIUS &&
        x < collider.maxX + PLAYER_RADIUS &&
        z > collider.minZ - PLAYER_RADIUS &&
        z < collider.maxZ + PLAYER_RADIUS
      ) {
        return false;
      }
    }
    return (
      x > this.level.bounds.minX + PLAYER_RADIUS &&
      x < this.level.bounds.maxX - PLAYER_RADIUS &&
      z > this.level.bounds.minZ + PLAYER_RADIUS &&
      z < this.level.bounds.maxZ - PLAYER_RADIUS
    );
  }

  private nearestTarget(player: PlayerState): NearTarget | null {
    let best: NearTarget | null = null;
    for (const station of Object.values(this.stations)) {
      const rotated = Boolean(station.rot);
      const hw = rotated ? STATION_HALF_D : STATION_HALF_W;
      const hd = rotated ? STATION_HALF_W : STATION_HALF_D;
      const dx = Math.max(Math.abs(player.x - station.x) - hw, 0);
      const dz = Math.max(Math.abs(player.z - station.z) - hd, 0);
      const distance = Math.hypot(dx, dz);
      if (distance <= INTERACT_DISTANCE && (!best || distance < best.distance)) {
        best = { kind: "station", id: station.id, station, distance };
      }
    }
    const trashDx = Math.max(Math.abs(player.x - this.level.trash.x) - 0.36, 0);
    const trashDz = Math.max(Math.abs(player.z - this.level.trash.z) - 0.36, 0);
    const trashDistance = Math.hypot(trashDx, trashDz);
    if (
      trashDistance <= INTERACT_DISTANCE &&
      (!best || trashDistance < best.distance)
    ) {
      best = { kind: "trash", id: "trash", distance: trashDistance };
    }
    return best;
  }

  // ---------------------------------------------------------- interactions

  private interact(player: PlayerState, target: NearTarget): void {
    if (target.kind === "trash") {
      if (player.carry) {
        player.carry = null;
        audio.play("trash");
        this.showToast("扔掉了", "info");
        this.bump();
      }
      return;
    }

    const station = target.station;
    switch (station.type) {
      case "crate":
        this.useCrate(player, station);
        break;
      case "chop":
        this.useChop(player, station);
        break;
      case "stove":
        this.useStove(player, station);
        break;
      case "plate":
        this.usePlate(player);
        break;
      case "serve":
        this.useServe(player);
        break;
      case "sink":
        this.showToast("水槽还没通水，先专心出餐", "info");
        break;
    }
  }

  private useCrate(player: PlayerState, station: StationState): void {
    const ingredient = station.ingredient;
    if (!ingredient) return;
    if (!player.carry) {
      player.carry = {
        kind: "ingredient",
        item: { id: ingredient, state: "raw" },
      };
      audio.play("pickup");
      this.bump();
      return;
    }
    if (player.carry.kind === "plate") {
      if (ingredient !== "bun") {
        this.showToast(
          `生的${INGREDIENT_META[ingredient].name}不能直接装盘，先去砧板`,
          "warn",
        );
        audio.play("error");
        return;
      }
      if (!canAddToPlate(player.carry.contents, { id: "bun", state: "raw" })) {
        this.showToast("盘子里已经放不下了", "warn");
        audio.play("error");
        return;
      }
      player.carry = {
        kind: "plate",
        contents: [...player.carry.contents, { id: "bun", state: "raw" }],
      };
      audio.play("place");
      this.bump();
    }
  }

  private useChop(player: PlayerState, station: StationState): void {
    if (station.item) {
      const item = station.item;
      if (player.carry?.kind === "plate") {
        if (item.state === "raw") {
          this.showToast("还没切呢，先按住切碎它", "warn");
          audio.play("error");
          return;
        }
        if (!canAddToPlate(player.carry.contents, item)) {
          this.showToast("这个盘子装不下它了", "warn");
          audio.play("error");
          return;
        }
        player.carry = {
          kind: "plate",
          contents: [...player.carry.contents, { ...item }],
        };
        station.item = null;
        station.progress = 0;
        audio.play("place");
        this.bump();
        return;
      }
      if (!player.carry) {
        if (item.state === "chopped") {
          player.carry = { kind: "ingredient", item: { ...item } };
          station.item = null;
          station.progress = 0;
          audio.play("pickup");
          this.bump();
        } else {
          this.showToast("按住动作键开始切菜", "info");
        }
        return;
      }
      this.showToast("手里拿着东西，先放下吧", "warn");
      return;
    }

    if (player.carry?.kind === "ingredient") {
      const item = player.carry.item;
      if (!INGREDIENT_META[item.id].choppable) {
        this.showToast("这个不用切", "info");
        return;
      }
      station.item = { ...item };
      station.progress = item.state === "chopped" ? 1 : 0;
      player.carry = null;
      audio.play("place");
      this.bump();
      return;
    }
    if (player.carry?.kind === "plate") {
      this.showToast("先把盘子放下或腾空手再来", "warn");
      return;
    }
    this.showToast("先从货箱拿点食材", "info");
  }

  private useStove(player: PlayerState, station: StationState): void {
    if (!station.item) {
      if (
        player.carry?.kind === "ingredient" &&
        player.carry.item.id === "meat" &&
        player.carry.item.state === "chopped"
      ) {
        station.item = { id: "meat", state: "raw" };
        station.cookTimer = 0;
        player.carry = null;
        audio.play("sizzle");
        this.showToast("肉饼下锅，滋滋作响", "good");
        this.bump();
        return;
      }
      if (player.carry?.kind === "plate") {
        this.showToast("灶台是煎肉饼的，盘子放这儿可不行", "warn");
        return;
      }
      this.showToast("这里需要切好的肉饼", "info");
      return;
    }

    const item = station.item;
    if (item.state === "cooked") {
      if (player.carry?.kind === "plate") {
        if (!canAddToPlate(player.carry.contents, item)) {
          this.showToast("盘子放不下啦", "warn");
          audio.play("error");
          return;
        }
        player.carry = {
          kind: "plate",
          contents: [...player.carry.contents, { ...item }],
        };
        station.item = null;
        station.cookTimer = 0;
        audio.play("place");
        this.bump();
        return;
      }
      if (!player.carry) {
        player.carry = { kind: "ingredient", item: { ...item } };
        station.item = null;
        station.cookTimer = 0;
        audio.play("pickup");
        this.bump();
        return;
      }
      this.showToast("要装盘的话，先拿一个盘子", "warn");
      return;
    }
    if (item.state === "burnt") {
      if (!player.carry) {
        player.carry = { kind: "ingredient", item: { ...item } };
        station.item = null;
        station.cookTimer = 0;
        audio.play("pickup");
        this.showToast("焦了！拿去扔掉", "bad");
        this.bump();
        return;
      }
      this.showToast("焦掉的东西不能装盘，拿起来丢掉", "bad");
      audio.play("error");
      return;
    }
    this.showToast("还在煎，别急着翻锅", "info");
  }

  private usePlate(player: PlayerState): void {
    if (!player.carry) {
      player.carry = { kind: "plate", contents: [] };
      audio.play("pickup");
      this.bump();
      return;
    }
    this.showToast("手里已经有东西了", "info");
  }

  private useServe(player: PlayerState): void {
    if (!player.carry) {
      audio.play("tick");
      this.showToast("叮！把做好的菜端过来", "info");
      return;
    }
    if (player.carry.kind !== "plate") {
      this.showToast("这里只收做好的菜", "warn");
      audio.play("error");
      return;
    }
    const contents = player.carry.contents;
    const dish = matchRecipe(contents);
    if (!dish) {
      this.showToast("这盘还不是一道菜，看看订单配方", "bad");
      audio.play("error");
      this.shake = Math.max(this.shake, 0.15);
      return;
    }
    const orderIndex = this.orders.findIndex((order) => order.recipeId === dish.id);
    if (orderIndex < 0) {
      this.showToast(`没有客人点${dish.name}`, "warn");
      audio.play("error");
      return;
    }

    const order = this.orders[orderIndex];
    const timeRatio = order.timeLeft / order.maxTime;
    const nextCombo = this.comboTimer > 0 ? Math.min(5, this.combo + 1) : 1;
    const multiplier = 1 + (nextCombo - 1) * 0.25;
    const tip = 10 + Math.round(timeRatio * 20);
    const points = Math.round((dish.baseScore + tip) * multiplier);
    this.score += points;
    this.stats.served += 1;
    this.combo = nextCombo;
    this.stats.bestCombo = Math.max(this.stats.bestCombo, nextCombo);
    this.comboTimer = COMBO_WINDOW;
    this.orders.splice(orderIndex, 1);
    player.carry = null;
    this.shake = Math.max(this.shake, 0.22);
    audio.play("serve");
    const comboText = nextCombo > 1 ? ` 连击 x${nextCombo}` : "";
    this.showToast(`${dish.name} 出餐 +${points}${comboText}`, "good");
    this.bump();
  }

  // ----------------------------------------------------- station progress

  private updateChopping(dt: number): void {
    let anyChopping = false;
    for (const station of Object.values(this.stations)) {
      if (station.type !== "chop") continue;
      station.beingChopped = false;
      if (!station.item || station.item.state !== "raw") continue;
      for (const player of this.players) {
        if (
          player.nearStationId !== station.id ||
          !player.actionHeld ||
          player.carry
        ) {
          continue;
        }
        player.chopping = true;
        station.beingChopped = true;
        anyChopping = true;
        station.progress = Math.min(
          1,
          station.progress + dt / CHOP_TIME[station.item.id],
        );
        this.chopSoundAccumulator += dt;
        if (this.chopSoundAccumulator > 0.34) {
          this.chopSoundAccumulator = 0;
          audio.play("chop");
        }
        if (station.progress >= 1) {
          station.item.state = "chopped";
          this.stats.chopped += 1;
          audio.play("chopDone");
          this.showToast(
            `${INGREDIENT_META[station.item.id].name}切好了`,
            "good",
          );
          this.bump();
        }
        break;
      }
    }
    if (!anyChopping) this.chopSoundAccumulator = 0;
  }

  private updateStoves(dt: number): void {
    let anyFire = false;
    for (const station of Object.values(this.stations)) {
      if (station.type !== "stove" || !station.item) continue;
      const item = station.item;
      if (item.state === "burnt") {
        anyFire = true;
        continue;
      }
      station.cookTimer += dt;
      if (item.state === "raw" && station.cookTimer >= COOK_TIME) {
        item.state = "cooked";
        audio.play("cooked");
        this.showToast("叮！肉饼煎好了，快装盘", "good");
        this.bump();
      }
      if (item.state === "cooked" && station.cookTimer >= COOK_TIME + BURN_TIME) {
        item.state = "burnt";
        audio.play("error");
        this.showToast("糊了！把焦肉饼扔进垃圾桶", "bad");
        this.shake = Math.max(this.shake, 0.2);
        this.bump();
      }
    }
    if (anyFire) {
      this.fireSoundAccumulator += dt;
      if (this.fireSoundAccumulator > 1.7) {
        this.fireSoundAccumulator = 0;
        audio.play("fire");
      }
    } else {
      this.fireSoundAccumulator = 0;
    }
  }

  private updateOrders(dt: number): void {
    let expired = 0;
    for (const order of this.orders) {
      order.timeLeft -= dt;
      if (order.timeLeft <= 0) expired += 1;
    }
    if (expired > 0) {
      const lostNames: string[] = [];
      this.orders = this.orders.filter((order) => {
        if (order.timeLeft > 0) return true;
        lostNames.push(RECIPES[order.recipeId].name);
        return false;
      });
      this.stats.expired += lostNames.length;
      this.score = Math.max(0, this.score - 15 * lostNames.length);
      this.combo = 0;
      this.comboTimer = 0;
      this.shake = Math.max(this.shake, 0.2);
      audio.play("expire");
      this.showToast("客人等不及走了 -15", "bad");
      this.bump();
    }

    if (this.orders.length < this.level.maxOrders) {
      this.orderTimer -= dt;
      if (this.orderTimer <= 0) {
        this.orders.push(this.makeOrder());
        this.orderTimer = this.level.orderEvery;
        audio.play("tick");
        this.showToast("新订单来了", "info");
        this.bump();
      }
    }
  }

  private updateCombo(): void {
    if (this.combo > 0 && this.comboTimer <= 0) {
      this.combo = 0;
      this.bump();
    }
  }

  private makeOrder(fixedRecipe?: RecipeId): Order {
    const menu = this.level.menus;
    const recipeId =
      fixedRecipe ?? menu[Math.floor(Math.random() * menu.length)];
    const recipe = RECIPES[recipeId];
    const maxTime = recipe.patience * this.level.patienceScale;
    return {
      id: this.nextOrderId++,
      recipeId,
      timeLeft: maxTime,
      maxTime,
    };
  }

  // ------------------------------------------------------------- finish

  private finish(): void {
    if (this.phase === "results") return;
    this.phase = "results";
    this.clearKeys();
    const stars =
      this.score >= this.level.starScores[2]
        ? 3
        : this.score >= this.level.starScores[1]
          ? 2
          : this.score >= this.level.starScores[0]
            ? 1
            : 0;
    const oldBest = loadBestBook()[this.level.id];
    const newBest = !oldBest || this.score > oldBest.score;
    const best = recordBest(
      this.level.id,
      this.score,
      stars,
      this.stats.served,
    );
    this.result = {
      score: this.score,
      stars,
      served: this.stats.served,
      expired: this.stats.expired,
      chopped: this.stats.chopped,
      bestCombo: this.stats.bestCombo,
      best,
      newBest,
    };
    audio.stopMusic();
    audio.play("serve");
    this.bump();
  }

  // --------------------------------------------------------------- helpers

  private showToast(
    text: string,
    kind: ToastItem["kind"] = "info",
  ): void {
    this.toasts.push({
      id: this.nextToastId++,
      text,
      kind,
      ttl: 2.7,
    });
    if (this.toasts.length > 2) this.toasts.shift();
    this.throttleHud(1);
  }

  private updateToasts(dt: number): void {
    if (this.toasts.length === 0) return;
    let changed = false;
    for (const toast of this.toasts) toast.ttl -= dt;
    const before = this.toasts.length;
    this.toasts = this.toasts.filter((toast) => toast.ttl > 0);
    if (this.toasts.length !== before) changed = true;
    if (changed) this.throttleHud(1);
  }

  private throttleHud(dt: number): void {
    this.hudAccumulator += dt;
    if (this.hudAccumulator >= 0.1) {
      this.hudAccumulator = 0;
      this.emitHud();
    }
  }

  private bump(): void {
    this.version += 1;
    this.hudAccumulator = 0;
    this.emitHud();
    for (const listener of this.versionListeners) listener();
  }

  private emitHud(): void {
    this.hud = this.buildHud();
    for (const listener of this.hudListeners) listener();
  }

  private buildHint(player: PlayerState): InteractionHint | null {
    const id = player.nearStationId;
    if (!id) return null;
    if (id === "trash") {
      return player.carry
        ? { text: "把手中的东西扔掉", tone: "do" }
        : { text: "空垃圾桶", tone: "idle" };
    }
    const station = this.stations[id];
    if (!station) return null;
    const carry = player.carry;

    switch (station.type) {
      case "crate": {
        const ingredient = station.ingredient;
        if (!ingredient) return null;
        const meta = INGREDIENT_META[ingredient];
        if (!carry) {
          return { text: `拿起${meta.name}`, tone: "do" };
        }
        if (carry.kind === "plate") {
          if (ingredient === "bun") {
            return { text: "把面包放到盘子上", tone: "do" };
          }
          return { text: `生${meta.name}要先切碎`, tone: "no" };
        }
        return { text: "手里腾不出地方", tone: "no" };
      }
      case "chop": {
        if (station.item) {
          const meta = INGREDIENT_META[station.item.id];
          if (station.item.state === "raw") {
            if (carry) return { text: "先把手里的东西放下", tone: "no" };
            return { text: `按住动作键切碎${meta.name}`, tone: "hold" };
          }
          if (carry?.kind === "plate") {
            return { text: `把${meta.name}装到盘子上`, tone: "do" };
          }
          if (!carry) {
            return { text: `拿起切好的${meta.name}`, tone: "do" };
          }
          return { text: "手里拿着东西，先放一放", tone: "no" };
        }
        if (carry?.kind === "ingredient") {
          if (INGREDIENT_META[carry.item.id].choppable) {
            return { text: `把${INGREDIENT_META[carry.item.id].name}放上砧板`, tone: "do" };
          }
          return { text: "这个不用切", tone: "no" };
        }
        if (carry?.kind === "plate") {
          return { text: "空砧板，去拿点食材", tone: "idle" };
        }
        return { text: "空砧板，去货箱拿食材", tone: "idle" };
      }
      case "stove": {
        if (!station.item) {
          if (
            carry?.kind === "ingredient" &&
            carry.item.id === "meat" &&
            carry.item.state === "chopped"
          ) {
            return { text: "把肉饼下锅煎", tone: "do" };
          }
          return { text: "需要切好的肉饼", tone: "no" };
        }
        if (station.item.state === "raw") {
          return { text: "正在煎，先别走太远", tone: "wait" };
        }
        if (station.item.state === "cooked") {
          if (carry?.kind === "plate") {
            return { text: "把煎好的肉饼装盘", tone: "do" };
          }
          if (!carry) return { text: "拿起煎好的肉饼", tone: "do" };
          return { text: "先拿个盘子来装", tone: "no" };
        }
        if (!carry) return { text: "拿起焦肉饼去扔掉", tone: "do" };
        return { text: "焦了，不能装盘", tone: "no" };
      }
      case "plate": {
        if (!carry) return { text: "拿一个干净盘子", tone: "do" };
        if (carry.kind === "plate") return { text: "已经端着盘子啦", tone: "idle" };
        return { text: "先把手中的食材放下", tone: "no" };
      }
      case "serve": {
        if (carry?.kind !== "plate") {
          return { text: "把做好的菜端到出餐口", tone: "idle" };
        }
        const dish = matchRecipe(carry.contents);
        if (!dish) return { text: "这盘还不完整，看看订单", tone: "no" };
        const hasOrder = this.orders.some((order) => order.recipeId === dish.id);
        if (!hasOrder) return { text: `没有客人点${dish.name}`, tone: "no" };
        return { text: `送出${dish.name}`, tone: "do" };
      }
      case "sink":
        return { text: "水槽还没通水", tone: "idle" };
    }
  }

  private buildHud(): GameHud {
    const playerHud: PlayerHud[] = this.players.map((player) => {
      const meta = PLAYERS[player.id - 1] ?? PLAYERS[0];
      return {
        id: player.id,
        name: meta.name,
        color: meta.color,
        key: meta.key,
        carry: player.carry,
        hint: this.buildHint(player),
        chopping: player.chopping,
        nearStationId: player.nearStationId,
      };
    });
    return {
      phase: this.phase,
      level: {
        id: this.level.id,
        index: this.level.index,
        name: this.level.name,
        en: this.level.en,
        tagline: this.level.tagline,
        difficulty: this.level.difficulty,
      },
      playerCount: this.playerCount,
      timeLeft: this.timeLeft,
      countdown: this.countdown,
      score: this.score,
      combo: this.combo,
      comboTimer: this.comboTimer,
      orders: this.orders.map((order) => ({ ...order })),
      players: playerHud,
      toasts: this.toasts.map((toast) => ({ ...toast })),
      result: this.result,
      stats: { ...this.stats },
    };
  }

  // ----------------------------------------------------------- subscribers

  subscribeHud = (listener: () => void): (() => void) => {
    this.hudListeners.add(listener);
    return () => {
      this.hudListeners.delete(listener);
    };
  };

  getHudSnapshot = (): GameHud => this.hud;

  subscribeVersion = (listener: () => void): (() => void) => {
    this.versionListeners.add(listener);
    return () => {
      this.versionListeners.delete(listener);
    };
  };

  getVersion = (): number => this.version;

}

export const game = new GameEngine();
