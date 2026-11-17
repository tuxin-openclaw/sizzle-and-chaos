import type {
  Ingredient,
  IngredientId,
  IngredientState,
  LevelDef,
  Recipe,
  RecipeId,
} from "./types";

export const INGREDIENT_META: Record<
  IngredientId,
  {
    name: string;
    short: string;
    color: string;
    dark: string;
    choppable: boolean;
    cookable: boolean;
  }
> = {
  bun: {
    name: "面包",
    short: "包",
    color: "#E2A45B",
    dark: "#A96834",
    choppable: false,
    cookable: false,
  },
  meat: {
    name: "肉饼",
    short: "肉",
    color: "#D97972",
    dark: "#9D4842",
    choppable: true,
    cookable: true,
  },
  lettuce: {
    name: "生菜",
    short: "菜",
    color: "#86BE4F",
    dark: "#4C7C32",
    choppable: true,
    cookable: false,
  },
  tomato: {
    name: "番茄",
    short: "茄",
    color: "#E24C3B",
    dark: "#A32C21",
    choppable: true,
    cookable: false,
  },
};

export function stateLabel(state: IngredientState): string {
  switch (state) {
    case "raw":
      return "生的";
    case "chopped":
      return "切好";
    case "cooked":
      return "煎好";
    case "burnt":
      return "焦了";
  }
}

export function ingredientLabel(item: Ingredient): string {
  return `${stateLabel(item.state)}${INGREDIENT_META[item.id].name}`;
}

export const RECIPES: Record<RecipeId, Recipe> = {
  salad: {
    id: "salad",
    name: "田园沙拉",
    en: "GARDEN SALAD",
    baseScore: 30,
    patience: 68,
    color: "#6FA845",
    ingredients: [
      { id: "lettuce", state: "chopped" },
      { id: "tomato", state: "chopped" },
    ],
  },
  burger: {
    id: "burger",
    name: "经典汉堡",
    en: "CLASSIC BURGER",
    baseScore: 45,
    patience: 78,
    color: "#D89445",
    ingredients: [
      { id: "bun", state: "raw" },
      { id: "meat", state: "cooked" },
      { id: "lettuce", state: "chopped" },
    ],
  },
  deluxe: {
    id: "deluxe",
    name: "豪华汉堡",
    en: "DELUXE BURGER",
    baseScore: 65,
    patience: 92,
    color: "#D95743",
    ingredients: [
      { id: "bun", state: "raw" },
      { id: "meat", state: "cooked" },
      { id: "lettuce", state: "chopped" },
      { id: "tomato", state: "chopped" },
    ],
  },
};

export const RECIPE_LIST = Object.values(RECIPES);

/** Exact-match a plate against the recipe book. Order does not matter. */
export function matchRecipe(contents: Ingredient[]): Recipe | null {
  if (contents.length === 0) return null;
  const key = (items: Ingredient[]) =>
    items
      .map((i) => `${i.id}:${i.state}`)
      .sort()
      .join("|");
  const plateKey = key(contents);
  return (
    RECIPE_LIST.find((recipe) => key(recipe.ingredients) === plateKey) ?? null
  );
}

export function canAddToPlate(contents: Ingredient[], item: Ingredient): boolean {
  if (contents.length >= 4) return false;
  if (contents.some((c) => c.id === item.id)) return false;
  return true;
}

const DAY_THEME = {
  floorA: "#F4E3C1",
  floorB: "#DFC097",
  grout: "#C7A77B",
  wall: "#F8E8CE",
  wainscot: "#2F817A",
  trim: "#A6683F",
  rugA: "#D95743",
  rugB: "#F6E4C6",
  skyTop: "#8DD3E8",
  skyBottom: "#F8D8A3",
  background: "#EBD3B0",
  fog: "#EFD9BA",
  keyLight: "#FFD7A4",
  fillLight: "#A4DCD4",
  ambientColor: "#FFE9CC",
  ambientIntensity: 1.15,
  keyIntensity: 2.15,
} as const;

export const LEVELS: LevelDef[] = [
  {
    id: "sunny",
    index: 1,
    name: "阳光小馆",
    en: "SUNNY SPOON",
    tagline: "第一次开灶，别把厨房点着了。",
    difficulty: 1,
    duration: 180,
    orderEvery: 13,
    maxOrders: 4,
    patienceScale: 1.2,
    menus: ["salad", "burger", "salad", "burger"],
    starScores: [220, 420, 620],
    blocks: [
      { id: "b1", x: -6.3, z: -3.95, station: { type: "crate", ingredient: "bun" } },
      { id: "b2", x: -4.5, z: -3.95, station: { type: "crate", ingredient: "meat" } },
      { id: "b3", x: -2.7, z: -3.95, station: { type: "crate", ingredient: "lettuce" } },
      { id: "b4", x: -0.9, z: -3.95, station: { type: "crate", ingredient: "tomato" } },
      { id: "b5", x: 0.9, z: -3.95 },
      { id: "b6", x: 2.7, z: -3.95, station: { type: "plate" } },
      { id: "b7", x: 4.5, z: -3.95, station: { type: "serve" } },
      { id: "b8", x: 6.3, z: -3.95, station: { type: "sink" } },
      { id: "i1", x: -2.7, z: 0.45, station: { type: "chop" } },
      { id: "i2", x: -0.9, z: 0.45, station: { type: "stove" } },
      { id: "i3", x: 0.9, z: 0.45, station: { type: "stove" } },
      { id: "i4", x: 2.7, z: 0.45, station: { type: "chop" } },
    ],
    trash: { x: 6.9, z: 3.55 },
    decor: [
      { type: "plant", x: -7.85, z: 4.35, scale: 1.12 },
      { type: "stool", x: 7.75, z: 4.2, scale: 1.05 },
      { type: "extinguisher", x: -7.9, z: -3.3 },
      { type: "pot", x: 2.7, z: -4.52, scale: 0.75 },
      { type: "jar", x: 0.9, z: -4.16, scale: 0.95 },
      { type: "stool", x: -2.7, z: 4.85, scale: 0.92 },
      { type: "stool", x: 1.4, z: 4.78, scale: 0.92 },
    ],
    spawns: [
      { x: -5.4, z: 2.8 },
      { x: 4.7, z: 3.1 },
    ],
    floor: { width: 16.8, depth: 10.2, centerZ: 0.15 },
    bounds: { minX: -7.55, maxX: 7.55, minZ: -3.3, maxZ: 4.45 },
    theme: DAY_THEME,
  },
  {
    id: "corner",
    index: 2,
    name: "转角餐车",
    en: "CORNER CANTINA",
    tagline: "动线绕起来了，出餐不会自己长腿。",
    difficulty: 2,
    duration: 195,
    orderEvery: 11,
    maxOrders: 4,
    patienceScale: 1.05,
    menus: ["salad", "burger", "deluxe", "burger", "salad", "deluxe"],
    starScores: [280, 540, 800],
    blocks: [
      { id: "c1", x: -5.4, z: -3.8, station: { type: "crate", ingredient: "bun" } },
      { id: "c2", x: -3.6, z: -3.8, station: { type: "crate", ingredient: "meat" } },
      { id: "c3", x: -1.8, z: -3.8, station: { type: "crate", ingredient: "lettuce" } },
      { id: "c4", x: 0, z: -3.8, station: { type: "crate", ingredient: "tomato" } },
      { id: "c5", x: 1.8, z: -3.8, station: { type: "plate" } },
      { id: "c6", x: 3.6, z: -3.8, station: { type: "serve" } },
      { id: "c7", x: 5.4, z: -3.8, station: { type: "sink" } },
      { id: "i1", x: -3.6, z: 0.55, station: { type: "chop" } },
      { id: "i2", x: -1.8, z: 0.55, station: { type: "stove" } },
      { id: "i3", x: 0, z: 0.55, station: { type: "stove" } },
      { id: "i4", x: 1.8, z: 0.55, station: { type: "chop" } },
      { id: "r1", x: 4.9, z: 1.2, rot: Math.PI / 2, station: { type: "plate" } },
      { id: "r2", x: 4.9, z: 2.9, rot: Math.PI / 2, station: { type: "stove" } },
      { id: "r3", x: -6.6, z: 1.9, rot: Math.PI / 2 },
    ],
    trash: { x: -6.8, z: 3.6 },
    decor: [
      { type: "plant", x: -7.95, z: 4.55, scale: 1.1 },
      { type: "plant", x: 7.8, z: -2.9, scale: 0.9 },
      { type: "stool", x: 7.75, z: 4.45, scale: 1.0 },
      { type: "extinguisher", x: -7.95, z: -3.1 },
      { type: "pot", x: -6.6, z: 1.9, scale: 0.75 },
      { type: "stool", x: -3.3, z: 4.85, scale: 0.92 },
      { type: "stool", x: 1.4, z: 4.8, scale: 0.92 },
    ],
    spawns: [
      { x: -5.2, z: 3.3 },
      { x: 2.8, z: 3.6 },
    ],
    floor: { width: 16.8, depth: 10.2, centerZ: 0.15 },
    bounds: { minX: -7.55, maxX: 7.55, minZ: -3.15, maxZ: 4.5 },
    theme: {
      ...DAY_THEME,
      floorA: "#EFD7B1",
      floorB: "#CE9C6F",
      grout: "#AD7B53",
      wall: "#F4D5B2",
      wainscot: "#266A65",
      rugA: "#C34B3A",
      rugB: "#F0D9B5",
      skyTop: "#F4A26D",
      skyBottom: "#FFE5B4",
      background: "#D6A47B",
      fog: "#E4BC96",
      keyLight: "#FFC78C",
      fillLight: "#88C8CD",
      ambientColor: "#FFE2C0",
      ambientIntensity: 1.05,
    },
  },
  {
    id: "midnight",
    index: 3,
    name: "午夜食堂",
    en: "MIDNIGHT MESS",
    tagline: "凌晨两点，客人比火还急。",
    difficulty: 3,
    duration: 210,
    orderEvery: 9.5,
    maxOrders: 5,
    patienceScale: 0.92,
    menus: ["burger", "deluxe", "salad", "deluxe", "burger", "salad", "deluxe"],
    starScores: [350, 700, 1020],
    blocks: [
      { id: "m1", x: -5.4, z: -3.8, station: { type: "crate", ingredient: "bun" } },
      { id: "m2", x: -3.6, z: -3.8, station: { type: "crate", ingredient: "meat" } },
      { id: "m3", x: -1.8, z: -3.8, station: { type: "crate", ingredient: "lettuce" } },
      { id: "m4", x: 0, z: -3.8, station: { type: "crate", ingredient: "tomato" } },
      { id: "m5", x: 1.8, z: -3.8, station: { type: "plate" } },
      { id: "m6", x: 3.6, z: -3.8, station: { type: "serve" } },
      { id: "m7", x: 5.4, z: -3.8, station: { type: "chop" } },
      { id: "i1", x: -2.7, z: 0.55, station: { type: "chop" } },
      { id: "i2", x: -0.9, z: 0.55, station: { type: "stove" } },
      { id: "i3", x: 0.9, z: 0.55, station: { type: "stove" } },
      { id: "i4", x: 2.7, z: 0.55, station: { type: "chop" } },
      { id: "l1", x: -6.6, z: -1.05, rot: Math.PI / 2, station: { type: "plate" } },
      { id: "l2", x: -6.6, z: 0.85, rot: Math.PI / 2, station: { type: "chop" } },
      { id: "l3", x: -6.6, z: 2.7, rot: Math.PI / 2, station: { type: "stove" } },
      { id: "f1", x: -0.9, z: 2.85 },
      { id: "f2", x: 0.9, z: 2.85 },
    ],
    trash: { x: 6.9, z: 3.7 },
    decor: [
      { type: "plant", x: -8.0, z: 4.6, scale: 1.15 },
      { type: "plant", x: 7.9, z: 1.1, scale: 0.95 },
      { type: "stool", x: 7.8, z: 4.5 },
      { type: "extinguisher", x: -8.0, z: 3.8 },
      { type: "pot", x: 3.6, z: -4.55, scale: 0.8 },
      { type: "jar", x: 0, z: 2.85, scale: 0.95 },
    ],
    spawns: [
      { x: -4.4, z: 3.8 },
      { x: 4.8, z: 2.1 },
    ],
    floor: { width: 16.8, depth: 10.2, centerZ: 0.15 },
    bounds: { minX: -7.55, maxX: 7.55, minZ: -3.15, maxZ: 4.55 },
    theme: {
      ...DAY_THEME,
      floorA: "#E8D5B2",
      floorB: "#2D6561",
      grout: "#C5A777",
      wall: "#203945",
      wainscot: "#152B34",
      trim: "#9C6338",
      rugA: "#D45A45",
      rugB: "#EBD6B5",
      skyTop: "#0B1B38",
      skyBottom: "#4D547D",
      background: "#10202F",
      fog: "#1B2C3B",
      keyLight: "#FFB45E",
      fillLight: "#72A8DA",
      ambientColor: "#96B8D6",
      ambientIntensity: 0.8,
      keyIntensity: 1.65,
      night: true,
    },
  },
];

export function getLevel(id: string): LevelDef {
  return LEVELS.find((level) => level.id === id) ?? LEVELS[0];
}

export const LEVEL_STORAGE_KEY = "sizzle-chaos-best-v1";

export const PLAYERS = [
  { id: 1, name: "红椒主厨", color: "#E85A45", dark: "#A83A2C", key: "E" },
  { id: 2, name: "蓝莓帮厨", color: "#3F8CE0", dark: "#255C9C", key: "⏎" },
] as const;
