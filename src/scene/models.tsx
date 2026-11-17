import { useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import type { Ingredient, IngredientState } from "../game/types";

const ASSET_BASE = import.meta.env.BASE_URL;

export const MODEL_URLS = {
  chef: `${ASSET_BASE}models/chef.glb`,
  food: `${ASSET_BASE}models/food.glb`,
  stations: `${ASSET_BASE}models/stations.glb`,
  props: `${ASSET_BASE}models/props.glb`,
} as const;

type Nodes = Record<string, THREE.Object3D>;

type GltfResult = ReturnType<typeof useGLTF> & {
  nodes: Nodes;
};

function nodesOf(result: unknown): Nodes {
  return (result as GltfResult).nodes;
}

export function preloadModels(): void {
  useGLTF.preload(MODEL_URLS.chef);
  useGLTF.preload(MODEL_URLS.food);
  useGLTF.preload(MODEL_URLS.stations);
  useGLTF.preload(MODEL_URLS.props);
}

function prepare(object: THREE.Object3D, shadows = true): THREE.Object3D {
  object.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = shadows;
      mesh.receiveShadow = shadows;
      mesh.frustumCulled = false;
    }
  });
  return object;
}

function useModelClone(url: string, name: string): THREE.Object3D {
  const gltf = useGLTF(url);
  const nodes = nodesOf(gltf);
  return useMemo(() => {
    const source = nodes[name];
    if (!source) {
      const fallback = new THREE.Group();
      fallback.name = `missing-${name}`;
      return fallback;
    }
    return prepare(source.clone(true));
  }, [name, nodes]);
}

export function StationModel({ name }: { name: string }) {
  const object = useModelClone(MODEL_URLS.stations, name);
  return <primitive object={object} />;
}

export function PropModel({ name }: { name: string }) {
  const object = useModelClone(MODEL_URLS.props, name);
  return <primitive object={object} />;
}

const FOOD_NODE: Record<string, string> = {
  plate: "Plate",
  bun: "Bun",
  patty: "Patty",
  lettuce: "Lettuce",
  lettuceChopped: "LettuceChopped",
  tomato: "Tomato",
  tomatoChopped: "TomatoChopped",
  bowl: "Bowl",
};

export function FoodModel({
  name,
  state,
}: {
  name: keyof typeof FOOD_NODE;
  state?: IngredientState;
}) {
  const gltf = useGLTF(MODEL_URLS.food);
  const nodes = nodesOf(gltf);
  const object = useMemo(() => {
    const source = nodes[FOOD_NODE[name]] ?? new THREE.Group();
    const clone = prepare(source.clone(true));
    if (name === "patty" && state && state !== "raw" && state !== "chopped") {
      clone.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          const next = materials.map((material) => {
            const copy = material.clone() as THREE.MeshStandardMaterial;
            if (copy.name === "MeatRaw") {
              if (state === "burnt") {
                copy.color.set("#3A2B22");
                copy.roughness = 0.9;
              } else {
                copy.color.set("#8A5030");
                copy.roughness = 0.74;
              }
            }
            return copy;
          });
          mesh.material = Array.isArray(mesh.material) ? next : next[0];
        }
      });
    }
    return clone;
  }, [name, nodes, state]);

  return <primitive object={object} />;
}

const ITEM_HEIGHT: Record<Ingredient["id"], number> = {
  bun: 0.25,
  meat: 0.12,
  lettuce: 0.11,
  tomato: 0.1,
};

export function FoodVisual({ item }: { item: Ingredient }) {
  if (item.id === "bun") {
    return <FoodModel name="bun" />;
  }
  if (item.id === "meat") {
    return <FoodModel name="patty" state={item.state} />;
  }
  if (item.id === "lettuce") {
    return <FoodModel name={item.state === "chopped" ? "lettuceChopped" : "lettuce"} />;
  }
  return <FoodModel name={item.state === "chopped" ? "tomatoChopped" : "tomato"} />;
}

export function PlateWithContents({
  contents,
  scale = 1,
}: {
  contents: Ingredient[];
  scale?: number;
}) {
  let height = 0.07;
  return (
    <group scale={scale}>
      <FoodModel name="plate" />
      {contents.map((item, index) => {
        const itemScale = 0.82;
        const y = height;
        height += ITEM_HEIGHT[item.id] * 0.78;
        return (
          <group
            key={`${item.id}-${index}`}
            position={[0, y, 0]}
            scale={itemScale}
            rotation={[0, index * 0.16, 0]}
          >
            <FoodVisual item={item} />
          </group>
        );
      })}
    </group>
  );
}

export function useChefClone(accent: string, accentDark: string): THREE.Object3D {
  const gltf = useGLTF(MODEL_URLS.chef);
  return useMemo(() => {
    const clone = gltf.scene.clone(true);
    prepare(clone);
    clone.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const next = materials.map((material) => {
        const copy = material.clone() as THREE.MeshStandardMaterial;
        const name = material.name;
        if (name === "Red") copy.color.set(accent);
        if (name === "RedDark") copy.color.set(accentDark);
        return copy;
      });
      mesh.material = Array.isArray(mesh.material) ? next : next[0];
    });
    return clone;
  }, [gltf.scene, accent, accentDark]);
}
