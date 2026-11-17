export type IngredientId = "bun" | "meat" | "lettuce" | "tomato";

export type IngredientState = "raw" | "chopped" | "cooked" | "burnt";

export interface Ingredient {
  id: IngredientId;
  state: IngredientState;
}

export type Carry =
  | { kind: "ingredient"; item: Ingredient }
  | { kind: "plate"; contents: Ingredient[] }
  | null;

export type StationType =
  | "crate"
  | "chop"
  | "stove"
  | "plating"
  | "serve"
  | "sink";

export interface StationDef {
  type: StationType;
  ingredient?: IngredientId;
}

export interface KitchenBlock {
  id: string;
  x: number;
  z: number;
  rot?: number;
  station?: StationDef;
}

export interface DecorItem {
  type: "plant" | "stool" | "pot" | "jar" | "extinguisher";
  x: number;
  z: number;
  rot?: number;
  scale?: number;
}

export type RecipeId = "salad" | "burger" | "deluxe";

export interface Recipe {
  id: RecipeId;
  name: string;
  en: string;
  baseScore: number;
  patience: number;
  ingredients: Ingredient[];
  color: string;
}

export interface Theme {
  floorA: string;
  floorB: string;
  grout: string;
  wall: string;
  wainscot: string;
  trim: string;
  rugA: string;
  rugB: string;
  skyTop: string;
  skyBottom: string;
  background: string;
  fog: string;
  keyLight: string;
  fillLight: string;
  ambientColor: string;
  ambientIntensity: number;
  keyIntensity: number;
  night?: boolean;
}

export interface LevelDef {
  id: string;
  index: number;
  name: string;
  en: string;
  tagline: string;
  difficulty: 1 | 2 | 3;
  duration: number;
  orderEvery: number;
  maxOrders: number;
  patienceScale: number;
  menus: RecipeId[];
  starScores: [number, number, number];
  blocks: KitchenBlock[];
  trash: { x: number; z: number };
  decor: DecorItem[];
  spawns: Array<{ x: number; z: number }>;
  floor: { width: number; depth: number; centerZ: number };
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  theme: Theme;
}
