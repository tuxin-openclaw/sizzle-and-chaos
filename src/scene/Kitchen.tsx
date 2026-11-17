import { useMemo } from "react";
import * as THREE from "three";
import { Billboard, Sparkles } from "@react-three/drei";
import { game } from "../game/engine";
import type { DecorItem, Theme } from "../game/types";
import { useGameVersion } from "../game/useGameHooks";
import { FoodVisual, PlateWithContents, PropModel, StationModel } from "./models";
import {
  ChopBits,
  ChopKnife,
  StationHighlight,
  StationProgress,
  StoveFX,
  TrashHighlight,
} from "./effects";
import {
  makeChalkboardTexture,
  makeClockTexture,
  makeFloorTexture,
  makePlatingSignTexture,
  makePosterTexture,
  makeRugTexture,
  makeServeSignTexture,
  makeSkyTexture,
  makeTileTexture,
} from "./textures";
import type { Ingredient, StationType } from "../game/types";

const STATION_MODEL: Record<StationType, string> = {
  crate: "Counter",
  chop: "ChopStation",
  stove: "StoveStation",
  plating: "PlateStation",
  serve: "ServeStation",
  sink: "SinkStation",
};

function Floor({ theme, width, depth, centerZ }: { theme: Theme; width: number; depth: number; centerZ: number }) {
  const texture = useMemo(
    () => makeFloorTexture(theme, [width / 2.55, depth / 2.55]),
    [theme, width, depth],
  );
  const rug = useMemo(() => makeRugTexture(theme), [theme]);
  const showRug = game.level.id !== "midnight";
  return (
    <group>
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, centerZ]}
      >
        <planeGeometry args={[width + 1.4, depth + 1.4]} />
        <meshStandardMaterial map={texture} roughness={0.86} metalness={0} />
      </mesh>
      {/* floor trim */}
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.012, centerZ + depth / 2 + 0.12]}
      >
        <planeGeometry args={[width + 0.7, 0.32]} />
        <meshStandardMaterial color={theme.trim} roughness={0.75} />
      </mesh>
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.012, centerZ - depth / 2 - 0.12]}
      >
        <planeGeometry args={[width + 0.7, 0.32]} />
        <meshStandardMaterial color={theme.trim} roughness={0.75} />
      </mesh>
      {showRug ? (
        <mesh
          receiveShadow
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.022, 2.9]}
        >
          <planeGeometry args={[5.8, 1.35]} />
          <meshStandardMaterial map={rug} roughness={0.94} />
        </mesh>
      ) : null}
    </group>
  );
}

function Window({ theme }: { theme: Theme }) {
  const sky = useMemo(() => makeSkyTexture(theme), [theme]);
  const frame = theme.trim;
  return (
    <group position={[-3.9, 2.48, -4.71]}>
      <mesh>
        <planeGeometry args={[4.05, 1.55]} />
        <meshBasicMaterial map={sky} toneMapped={false} />
      </mesh>
      {/* wooden frame */}
      <mesh position={[0, 0.84, 0.06]}>
        <boxGeometry args={[4.3, 0.14, 0.16]} />
        <meshStandardMaterial color={frame} roughness={0.7} />
      </mesh>
      <mesh position={[0, -0.84, 0.06]}>
        <boxGeometry args={[4.3, 0.16, 0.2]} />
        <meshStandardMaterial color={frame} roughness={0.7} />
      </mesh>
      <mesh position={[-2.1, 0, 0.06]}>
        <boxGeometry args={[0.14, 1.8, 0.16]} />
        <meshStandardMaterial color={frame} roughness={0.7} />
      </mesh>
      <mesh position={[2.1, 0, 0.06]}>
        <boxGeometry args={[0.14, 1.8, 0.16]} />
        <meshStandardMaterial color={frame} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.08]}>
        <boxGeometry args={[0.08, 1.55, 0.07]} />
        <meshStandardMaterial color={frame} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.22, 0.08]}>
        <boxGeometry args={[4.05, 0.06, 0.07]} />
        <meshStandardMaterial color={frame} roughness={0.7} />
      </mesh>
      <mesh position={[0, -0.9, 0.16]}>
        <boxGeometry args={[4.55, 0.12, 0.4]} />
        <meshStandardMaterial color={theme.trim} roughness={0.72} />
      </mesh>
      {/* sunbeam / curtain rod */}
      <mesh position={[0, 0.97, 0.15]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 4.45, 12]} />
        <meshStandardMaterial color={theme.trim} roughness={0.5} metalness={0.2} />
      </mesh>
    </group>
  );
}

function Chalkboard() {
  const texture = useMemo(() => makeChalkboardTexture(), []);
  return (
    <group position={[0.9, 2.42, -4.7]}>
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[2.75, 1.6, 0.08]} />
        <meshStandardMaterial color="#9B643D" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0, 0.045]}>
        <planeGeometry args={[2.48, 1.36]} />
        <meshStandardMaterial map={texture} roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.84, 0.03]}>
        <boxGeometry args={[2.85, 0.1, 0.12]} />
        <meshStandardMaterial color="#7F4D2E" roughness={0.72} />
      </mesh>
    </group>
  );
}

function WallClock() {
  const face = useMemo(() => makeClockTexture(), []);
  return (
    <group position={[6.9, 2.62, -4.68]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.47, 0.07, 12, 36]} />
        <meshStandardMaterial color="#A6683F" roughness={0.65} />
      </mesh>
      <mesh>
        <circleGeometry args={[0.48, 40]} />
        <meshStandardMaterial map={face} roughness={0.8} />
      </mesh>
    </group>
  );
}

function Shelf() {
  return (
    <group position={[-6.85, 2.25, -4.62]}>
      <mesh castShadow>
        <boxGeometry args={[1.8, 0.09, 0.34]} />
        <meshStandardMaterial color="#A6683F" roughness={0.72} />
      </mesh>
      <mesh position={[-0.7, 0.34, 0]} castShadow>
        <boxGeometry args={[0.06, 0.62, 0.3]} />
        <meshStandardMaterial color="#7F4D2E" roughness={0.72} />
      </mesh>
      <mesh position={[0.7, 0.34, 0]} castShadow>
        <boxGeometry args={[0.06, 0.62, 0.3]} />
        <meshStandardMaterial color="#7F4D2E" roughness={0.72} />
      </mesh>
      <group position={[-0.5, 0.05, 0]} scale={0.66}>
        <PropModel name="Jar" />
      </group>
      <group position={[-0.04, 0.05, 0]} scale={0.58}>
        <PropModel name="Pot" />
      </group>
      <group position={[0.52, 0.05, 0]} scale={0.62}>
        <PropModel name="Jar" />
      </group>
    </group>
  );
}

function StringLights({ theme }: { theme: Theme }) {
  const bulbs = useMemo(() => {
    const list: Array<[number, number, number]> = [];
    for (let i = 0; i < 15; i++) {
      const t = i / 14;
      const x = -7.6 + t * 15.2;
      const sag = Math.sin(t * Math.PI) * 0.45;
      list.push([x, 3.28 - sag, -4.5]);
    }
    return list;
  }, []);
  const lineGeometry = useMemo(() => {
    const points = bulbs.map(([x, y, z]) => new THREE.Vector3(x, y, z));
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [bulbs]);
  const lineObject = useMemo(
    () =>
      new THREE.Line(
        lineGeometry,
        new THREE.LineBasicMaterial({ color: "#2A2320", transparent: true, opacity: 0.8 }),
      ),
    [lineGeometry],
  );
  return (
    <group>
      <primitive object={lineObject} />
      {bulbs.map(([x, y, z], index) => (
        <mesh key={index} position={[x, y - 0.06, z + 0.03]}>
          <sphereGeometry args={[0.055, 8, 6]} />
          <meshStandardMaterial
            color={theme.night ? "#FFE3A1" : "#FFF1C7"}
            emissive={theme.night ? "#FFB45E" : "#FFD98A"}
            emissiveIntensity={2.2}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function Pendant({
  x,
  z,
  theme,
  lit,
}: {
  x: number;
  z: number;
  theme: Theme;
  lit: boolean;
}) {
  return (
    <group position={[x, 4.35, z]}>
      <group scale={0.9}>
        <PropModel name="PendantLamp" />
      </group>
      {lit ? (
        <pointLight
          position={[0, -1.72, 0]}
          color={theme.keyLight}
          intensity={8}
          distance={7}
          decay={2}
        />
      ) : null}
    </group>
  );
}

function Room() {
  const theme = game.level.theme;
  const floor = game.level.floor;
  const tile = useMemo(() => makeTileTexture(theme), [theme]);
  const posterSalad = useMemo(() => makePosterTexture("salad"), []);
  const posterBurger = useMemo(() => makePosterTexture("burger"), []);
  return (
    <group>
      <Floor theme={theme} width={floor.width} depth={floor.depth} centerZ={floor.centerZ} />

      {/* back wall */}
      <mesh position={[0, 1.9, -4.95]} receiveShadow>
        <boxGeometry args={[17.1, 3.8, 0.28]} />
        <meshStandardMaterial color={theme.wall} roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.5, -4.8]}>
        <boxGeometry args={[17.1, 1.0, 0.16]} />
        <meshStandardMaterial color={theme.wainscot} roughness={0.72} />
      </mesh>
      <mesh position={[0, 1.03, -4.72]}>
        <boxGeometry args={[17.15, 0.1, 0.2]} />
        <meshStandardMaterial color={theme.trim} roughness={0.65} />
      </mesh>
      <mesh position={[0, 2.06, -4.77]}>
        <planeGeometry args={[16.9, 1.02]} />
        <meshStandardMaterial map={tile} roughness={0.65} />
      </mesh>
      <mesh position={[0, 3.73, -4.8]}>
        <boxGeometry args={[17.2, 0.14, 0.24]} />
        <meshStandardMaterial color={theme.trim} roughness={0.68} />
      </mesh>
      <mesh position={[0, 0.11, -4.82]}>
        <boxGeometry args={[17.2, 0.22, 0.2]} />
        <meshStandardMaterial color={theme.trim} roughness={0.75} />
      </mesh>

      <Window theme={theme} />
      <Chalkboard />
      <WallClock />
      <Shelf />
      <StringLights theme={theme} />

      {/* side walls: low so the camera can look in */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 8.35, 0, 0.15]}>
          <mesh position={[0, 0.62, 0]} receiveShadow>
            <boxGeometry args={[0.26, 1.25, 10.4]} />
            <meshStandardMaterial color={theme.wall} roughness={0.92} />
          </mesh>
          <mesh position={[side * -0.09, 0.45, 0]}>
            <boxGeometry args={[0.1, 0.75, 10.2]} />
            <meshStandardMaterial color={theme.wainscot} roughness={0.72} />
          </mesh>
          <mesh position={[0, 1.26, 0]}>
            <boxGeometry args={[0.36, 0.09, 10.45]} />
            <meshStandardMaterial color={theme.trim} roughness={0.65} />
          </mesh>
        </group>
      ))}

      {/* low front rail */}
      <group position={[0, 0, 5.16]}>
        <mesh position={[0, 0.35, 0]} receiveShadow>
          <boxGeometry args={[17.0, 0.7, 0.22]} />
          <meshStandardMaterial color={theme.wainscot} roughness={0.72} />
        </mesh>
        <mesh position={[0, 0.73, 0]}>
          <boxGeometry args={[17.2, 0.1, 0.36]} />
          <meshStandardMaterial color={theme.trim} roughness={0.65} />
        </mesh>
      </group>

      {/* framed posters on the side walls */}
      <group position={[-8.17, 2.0, 1.2]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[1.05, 1.4]} />
          <meshStandardMaterial map={posterBurger} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0, -0.03]}>
          <boxGeometry args={[1.18, 1.53, 0.05]} />
          <meshStandardMaterial color="#A6683F" roughness={0.7} />
        </mesh>
      </group>
      <group position={[8.17, 2.0, 1.2]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh>
          <planeGeometry args={[1.05, 1.4]} />
          <meshStandardMaterial map={posterSalad} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0, -0.03]}>
          <boxGeometry args={[1.18, 1.53, 0.05]} />
          <meshStandardMaterial color="#A6683F" roughness={0.7} />
        </mesh>
      </group>

      <Pendant x={-6.1} z={-3.35} theme={theme} lit />
      <Pendant x={5.95} z={-3.35} theme={theme} lit={false} />
      <Sparkles
        count={36}
        scale={[14, 3.2, 7]}
        position={[0, 1.8, 0.2]}
        size={1.6}
        speed={0.18}
        opacity={theme.night ? 0.42 : 0.24}
        color={theme.night ? "#FFD79A" : "#FFF4D2"}
      />
    </group>
  );
}

function CrateDisplay({ ingredient }: { ingredient: Ingredient["id"] }) {
  return (
    <group position={[0, 1.15, 0]}>
      <group scale={0.7} rotation={[0, 0.3, 0]}>
        <FoodVisual item={{ id: ingredient, state: "raw" }} />
      </group>
      <group position={[0.24, -0.04, 0.12]} scale={0.52} rotation={[0, -0.5, 0]}>
        <FoodVisual item={{ id: ingredient, state: "raw" }} />
      </group>
      <group position={[-0.22, -0.05, -0.1]} scale={0.55} rotation={[0, 0.9, 0]}>
        <FoodVisual item={{ id: ingredient, state: "raw" }} />
      </group>
    </group>
  );
}

function ServeDetails() {
  const sign = useMemo(() => makeServeSignTexture(), []);
  return (
    <group>
      <mesh position={[0, 2.12, -0.29]}>
        <planeGeometry args={[1.52, 0.29]} />
        <meshBasicMaterial map={sign} transparent toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

function PlatingSign() {
  const texture = useMemo(() => makePlatingSignTexture(), []);
  return (
    <Billboard position={[0, 2.55, 0]} renderOrder={3}>
      <mesh>
        <planeGeometry args={[1.85, 0.63]} />
        <meshBasicMaterial
          map={texture}
          transparent
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
    </Billboard>
  );
}

function BlockView({
  block,
}: {
  block: { id: string; x: number; z: number; rot?: number; station?: { type: StationType; ingredient?: Ingredient["id"] } };
}) {
  const station = game.stations[block.id];
  const model = block.station ? STATION_MODEL[block.station.type] : "Counter";
  const isChop = block.station?.type === "chop";
  const isStove = block.station?.type === "stove";
  return (
    <group position={[block.x, 0, block.z]} rotation={[0, block.rot ?? 0, 0]}>
      <StationModel name={model} />
      {block.station ? <StationHighlight stationId={block.id} /> : null}
      {block.station?.type === "crate" ? (
        <>
          <group position={[0, 1.035, 0]}>
            <PropModel name="Crate" />
          </group>
          {block.station.ingredient ? (
            <CrateDisplay ingredient={block.station.ingredient} />
          ) : null}
        </>
      ) : null}
      {isChop ? (
        <>
          <group position={[0, 1.13, 0]} scale={0.85}>
            {station?.item ? <FoodVisual item={station.item} /> : null}
          </group>
          <ChopKnife stationId={block.id} />
          <ChopBits stationId={block.id} />
          <StationProgress stationId={block.id} kind="chop" />
        </>
      ) : null}
      {isStove ? (
        <>
          <group position={[0, 1.08, 0]} scale={0.88}>
            <PropModel name="Pan" />
          </group>
          {station?.item ? (
            <group position={[0, 1.17, 0]} scale={0.8}>
              <FoodVisual item={station.item} />
            </group>
          ) : null}
          <StoveFX stationId={block.id} />
          <StationProgress stationId={block.id} kind="stove" />
        </>
      ) : null}
      {block.station?.type === "plating" ? (
        <>
          <group position={[0, 1.05, 0]} scale={0.95}>
            <PlateWithContents contents={station?.plateContents ?? []} />
          </group>
          <PlatingSign />
        </>
      ) : null}
      {block.station?.type === "serve" ? <ServeDetails /> : null}
    </group>
  );
}

function Decor({ item }: { item: DecorItem }) {
  const model =
    item.type === "plant"
      ? "Plant"
      : item.type === "stool"
        ? "Stool"
        : item.type === "pot"
          ? "Pot"
          : item.type === "jar"
            ? "Jar"
            : "Extinguisher";
  const scale = item.scale ?? 1;
  const y = item.type === "pot" || item.type === "jar" ? 1.04 : 0;
  return (
    <group
      position={[item.x, y, item.z]}
      rotation={[0, item.rot ?? 0, 0]}
      scale={scale}
    >
      <PropModel name={model} />
    </group>
  );
}

export function Kitchen() {
  useGameVersion();
  const level = game.level;
  return (
    <group>
      <Room />
      {level.blocks.map((block) => (
        <BlockView
          key={block.id}
          block={{
            id: block.id,
            x: block.x,
            z: block.z,
            rot: block.rot,
            station: block.station,
          }}
        />
      ))}
      {level.decor.map((item, index) => (
        <Decor key={`${item.type}-${index}`} item={item} />
      ))}
      <group position={[level.trash.x, 0, level.trash.z]}>
        <group scale={1.08}>
          <PropModel name="TrashBin" />
        </group>
        <TrashHighlight />
      </group>
    </group>
  );
}
