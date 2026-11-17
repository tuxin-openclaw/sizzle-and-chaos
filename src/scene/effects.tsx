import { useMemo, useRef } from "react";
import { Billboard } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { game } from "../game/engine";
import { INGREDIENT_META, PLAYERS } from "../game/data";
import { PropModel } from "./models";
import { makeFlameTexture } from "./textures";

const COOK_TIME = 4.2;
const BURN_TIME = 6.4;

function playerForStation(stationId: string) {
  return game.players.find((player) => player.nearStationId === stationId);
}

export function StationHighlight({ stationId }: { stationId: string }) {
  const marker = useRef<THREE.Group>(null);
  const diamond = useRef<THREE.Mesh>(null);
  const bars = useRef<THREE.MeshBasicMaterial[]>([]);
  useFrame((state, delta) => {
    const player = playerForStation(stationId);
    const active = Boolean(player);
    if (marker.current) {
      marker.current.visible = active;
      if (active) {
        marker.current.position.y = 2.16 + Math.sin(state.clock.elapsedTime * 4) * 0.08;
        marker.current.rotation.y += delta * 2.2;
      }
    }
    if (active && player) {
      const meta = PLAYERS[player.id - 1] ?? PLAYERS[0];
      if (diamond.current) {
        const material = diamond.current.material as THREE.MeshBasicMaterial;
        material.color.set(meta.color);
      }
      for (const material of bars.current) material.color.set(meta.color);
    }
  });

  return (
    <group>
      <group ref={marker} position={[0, 2.16, 0]} visible={false}>
        <mesh ref={diamond}>
          <octahedronGeometry args={[0.16, 0]} />
          <meshBasicMaterial color="#E85A45" toneMapped={false} />
        </mesh>
        <mesh position={[0, -0.24, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.08, 0.16, 4]} />
          <meshBasicMaterial color="#E85A45" toneMapped={false} />
        </mesh>
      </group>
      <group position={[0, 0.016, 0]}>
        {[
          { pos: [0, 0, 0.56] as const, size: [1.92, 0.06] as const },
          { pos: [0, 0, -0.56] as const, size: [1.92, 0.06] as const },
          { pos: [0.95, 0, 0] as const, size: [0.06, 1.12] as const },
          { pos: [-0.95, 0, 0] as const, size: [0.06, 1.12] as const },
        ].map((bar, index) => (
          <mesh
            key={index}
            position={[bar.pos[0], bar.pos[1], bar.pos[2]]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[bar.size[0], bar.size[1]]} />
            <meshBasicMaterial
              ref={(material) => {
                if (material) bars.current[index] = material;
              }}
              color="#E85A45"
              transparent
              opacity={0.65}
              toneMapped={false}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export function StationProgress({
  stationId,
  kind,
}: {
  stationId: string;
  kind: "chop" | "stove";
}) {
  const group = useRef<THREE.Group>(null);
  const fill = useRef<THREE.Mesh>(null);
  const fillMaterial = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(() => {
    const station = game.stations[stationId];
    if (!station || !group.current) return;
    let progress = 0;
    let visible = false;
    let color = "#F2C14E";
    if (kind === "chop" && station.item?.state === "raw") {
      progress = station.progress;
      visible = progress > 0.015;
    } else if (kind === "stove" && station.item) {
      const item = station.item;
      if (item.state === "raw") {
        progress = Math.min(1, station.cookTimer / COOK_TIME);
        visible = progress > 0.015;
        color = "#F2B84B";
      } else if (item.state === "cooked") {
        const remaining = 1 - Math.min(1, (station.cookTimer - COOK_TIME) / BURN_TIME);
        progress = Math.max(0.04, remaining);
        visible = true;
        color = remaining < 0.36 ? "#E85A45" : "#6FA845";
      } else {
        progress = 1;
        visible = true;
        color = "#E85A45";
      }
    }
    group.current.visible = visible;
    if (fill.current && fillMaterial.current) {
      const clamped = Math.max(0.02, Math.min(1, progress));
      fill.current.scale.x = clamped;
      fill.current.position.x = -(1 - clamped) / 2;
      fillMaterial.current.color.set(color);
    }
  });

  return (
    <Billboard ref={group} position={[0, 2.62, 0]} visible={false}>
      <mesh position={[0, 0, -0.02]}>
        <boxGeometry args={[1.16, 0.2, 0.035]} />
        <meshBasicMaterial color="#3B2A23" depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, 0.005]}>
        <boxGeometry args={[1.06, 0.12, 0.03]} />
        <meshBasicMaterial color="#FFF4DE" depthWrite={false} />
      </mesh>
      <mesh ref={fill} position={[0, 0, 0.03]}>
        <boxGeometry args={[1, 0.075, 0.015]} />
        <meshBasicMaterial
          ref={fillMaterial}
          color="#F2C14E"
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
    </Billboard>
  );
}

export function ChopKnife({ stationId }: { stationId: string }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    const station = game.stations[stationId];
    if (!group.current || !station) return;
    const active = station.beingChopped;
    const t = state.clock.elapsedTime;
    if (active) {
      group.current.position.y = 1.24 - Math.abs(Math.sin(t * 16)) * 0.09;
      group.current.rotation.z = 0.18 + Math.sin(t * 16) * 0.16;
    } else {
      group.current.position.y = 1.24;
      group.current.rotation.z = 0.08;
    }
  });
  return (
    <group
      ref={group}
      position={[-0.38, 1.24, 0.02]}
      rotation={[0.02, 0.12, 0.08]}
      scale={0.78}
    >
      <PropModel name="Knife" />
    </group>
  );
}

export function ChopBits({ stationId }: { stationId: string }) {
  const group = useRef<THREE.Group>(null);
  const bits = useRef<Array<THREE.Mesh | null>>([]);
  const materials = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  const seeds = useMemo(
    () =>
      Array.from({ length: 9 }, () => ({
        angle: Math.random() * Math.PI * 2,
        radius: 0.14 + Math.random() * 0.26,
        speed: 1.4 + Math.random() * 2.4,
        phase: Math.random() * Math.PI * 2,
        offsetY: 0.03 + Math.random() * 0.16,
      })),
    [],
  );

  useFrame((state) => {
    const station = game.stations[stationId];
    if (!group.current) return;
    const active = Boolean(station?.beingChopped);
    group.current.visible = active;
    if (!station || !active) return;
    const meta = station.item ? INGREDIENT_META[station.item.id] : null;
    const baseColor = meta?.color ?? "#8CC653";
    const t = state.clock.elapsedTime;
    bits.current.forEach((bit, index) => {
      if (!bit) return;
      const seed = seeds[index];
      const cycle = (t * seed.speed + seed.phase) % 1;
      const radius = seed.radius * (0.5 + cycle);
      bit.position.x = Math.cos(seed.angle) * radius;
      bit.position.z = Math.sin(seed.angle) * radius * 0.7;
      bit.position.y = 1.17 + Math.sin(cycle * Math.PI) * (0.2 + seed.offsetY);
      bit.rotation.x += 0.2;
      bit.rotation.z += 0.13;
      bit.scale.setScalar(0.5 + (1 - cycle) * 0.7);
      materials.current[index]?.color.set(baseColor);
    });
  });

  return (
    <group ref={group} visible={false}>
      {seeds.map((_, index) => (
        <mesh
          key={index}
          ref={(mesh) => {
            bits.current[index] = mesh;
          }}
          position={[0, 1.2, 0]}
        >
          <boxGeometry args={[0.055, 0.035, 0.065]} />
          <meshBasicMaterial
            ref={(material) => {
              materials.current[index] = material;
            }}
            color="#8CC653"
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

export function StoveFX({ stationId }: { stationId: string }) {
  const fireGroup = useRef<THREE.Group>(null);
  const flames = useRef<Array<THREE.Mesh | null>>([]);
  const flameSprites = useRef<Array<THREE.Sprite | null>>([]);
  const smoke = useRef<Array<THREE.Mesh | null>>([]);
  const light = useRef<THREE.PointLight>(null);
  const flameTexture = useMemo(() => makeFlameTexture(), []);
  const smokeSeeds = useMemo(
    () =>
      Array.from({ length: 5 }, () => ({
        phase: Math.random(),
        drift: (Math.random() - 0.5) * 0.3,
        speed: 0.4 + Math.random() * 0.35,
      })),
    [],
  );

  useFrame((state) => {
    const station = game.stations[stationId];
    const item = station?.item ?? null;
    const burnt = item?.state === "burnt";
    const cooking = Boolean(item && item.state !== "burnt");
    const t = state.clock.elapsedTime;

    if (fireGroup.current) fireGroup.current.visible = burnt;
    flameSprites.current.forEach((flame, index) => {
      if (!flame) return;
      const pulse = 0.82 + Math.abs(Math.sin(t * (8.5 + index * 2.3) + index)) * 0.4;
      flame.scale.set(0.64 - index * 0.1, 1.12 * pulse, 1);
      flame.position.y = 0.32 + index * 0.09 + Math.sin(t * 9 + index) * 0.03;
      const material = flame.material as THREE.SpriteMaterial;
      material.opacity = 0.9 - index * 0.16;
      material.rotation = Math.sin(t * 3.2 + index) * 0.12;
    });
    flames.current.forEach((flame, index) => {
      if (!flame) return;
      const wobble = Math.sin(t * (9 + index) + index) * 0.12;
      flame.scale.y = 0.8 + Math.abs(Math.sin(t * 11 + index)) * 0.7;
      flame.scale.x = 0.8 + wobble;
      flame.rotation.z = Math.sin(t * 8 + index) * 0.18;
    });
    if (light.current) {
      light.current.intensity = burnt
        ? 7 + Math.abs(Math.sin(t * 13)) * 6
        : 0;
    }
    smoke.current.forEach((puff, index) => {
      if (!puff) return;
      const seed = smokeSeeds[index];
      const cycle = (t * seed.speed + seed.phase) % 1;
      puff.visible = cooking || burnt;
      if (!puff.visible) return;
      puff.position.y = 1.22 + cycle * (burnt ? 1.9 : 1.1);
      puff.position.x = seed.drift * cycle * 2;
      puff.position.z = Math.cos(seed.phase * 10) * 0.1 * cycle;
      const scale = (burnt ? 0.28 : 0.16) * (0.6 + cycle * 1.8);
      puff.scale.setScalar(scale);
      const material = puff.material as THREE.MeshBasicMaterial;
      material.opacity = (burnt ? 0.38 : 0.16) * (1 - cycle);
      material.color.set(burnt ? "#3A3A3A" : "#FFF6E7");
    });
  });

  return (
    <group>
      <group ref={fireGroup} position={[0, 1.1, 0]} visible={false}>
        {[0, 1, 2].map((index) => (
          <sprite
            key={index}
            ref={(sprite) => {
              flameSprites.current[index] = sprite;
            }}
            position={[(index - 1) * 0.12, 0.32 + index * 0.09, (index % 2) * 0.06]}
            scale={[0.6, 1, 1]}
            renderOrder={4}
          >
            <spriteMaterial
              map={flameTexture}
              transparent
              opacity={0.85}
              depthWrite={false}
              toneMapped={false}
              blending={THREE.AdditiveBlending}
            />
          </sprite>
        ))}
        {[0, 1, 2, 3].map((index) => (
          <mesh
            key={`core-${index}`}
            ref={(mesh) => {
              flames.current[index] = mesh;
            }}
            position={[(index - 1.5) * 0.13, 0.12 + (index % 2) * 0.08, (index % 2) * 0.05]}
          >
            <coneGeometry args={[0.13 - index * 0.013, 0.46 + index * 0.04, 8]} />
            <meshBasicMaterial
              color={index % 2 === 0 ? "#FFE074" : "#FF8A3C"}
              transparent
              opacity={0.85}
              toneMapped={false}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}
        <pointLight ref={light} color="#FF8A3C" intensity={0} distance={4} decay={2} />
      </group>
      {smokeSeeds.map((_, index) => (
        <mesh
          key={index}
          ref={(mesh) => {
            smoke.current[index] = mesh;
          }}
          position={[0, 1.2, 0]}
          visible={false}
        >
          <sphereGeometry args={[1, 10, 8]} />
          <meshBasicMaterial
            color="#FFF6E7"
            transparent
            opacity={0.2}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

export function TrashHighlight() {
  const marker = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshBasicMaterial>(null);
  useFrame((state) => {
    const active = game.players.some((player) => player.nearStationId === "trash");
    if (!marker.current) return;
    marker.current.visible = active;
    if (!active) return;
    marker.current.position.y = 1.42 + Math.sin(state.clock.elapsedTime * 4) * 0.07;
    const player = game.players.find((p) => p.nearStationId === "trash");
    if (player && material.current) {
      material.current.color.set((PLAYERS[player.id - 1] ?? PLAYERS[0]).color);
    }
  });
  return (
    <group ref={marker} visible={false}>
      <mesh>
        <octahedronGeometry args={[0.13, 0]} />
        <meshBasicMaterial ref={material} color="#E85A45" toneMapped={false} />
      </mesh>
    </group>
  );
}
