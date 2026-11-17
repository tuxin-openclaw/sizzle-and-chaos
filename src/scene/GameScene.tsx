import { Suspense, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { game } from "../game/engine";
import { useGameVersion } from "../game/useGameHooks";
import { Kitchen } from "./Kitchen";
import { Chef } from "./Chef";

function Lighting() {
  const theme = game.level.theme;
  return (
    <>
      <ambientLight intensity={theme.ambientIntensity * 0.52} color={theme.ambientColor} />
      <hemisphereLight
        args={[theme.skyTop, theme.floorB, 0.5]}
        position={[0, 8, 0]}
      />
      <directionalLight
        castShadow
        position={[6.5, 13.5, 8]}
        intensity={theme.keyIntensity}
        color={theme.keyLight}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-camera-near={1}
        shadow-camera-far={35}
        shadow-bias={-0.00035}
        shadow-normalBias={0.02}
      />
      <directionalLight
        position={[-7, 7, -5]}
        intensity={theme.night ? 0.75 : 0.45}
        color={theme.fillLight}
      />
      <pointLight
        position={[0, 4.4, 5.5]}
        intensity={theme.night ? 9 : 5}
        color={theme.keyLight}
        distance={12}
        decay={2}
      />
    </>
  );
}

function CameraRig() {
  const { camera, size } = useThree();
  const ready = useRef(false);
  const desired = useRef(new THREE.Vector3());
  const target = useRef(new THREE.Vector3(0, 0.3, 0.1));
  const parallax = useRef(new THREE.Vector2());

  useFrame((state, delta) => {
    const aspect = Math.max(0.55, size.width / size.height);
    const fit = Math.min(2.2, Math.max(0.93, Math.pow(1.62 / aspect, 0.78)));
    const distance = 19.1 * fit;
    const elevation = 0.774;
    const horizontal = 0.633;
    parallax.current.x += (state.pointer.x * 0.32 - parallax.current.x) * Math.min(1, delta * 2.5);
    parallax.current.y += (state.pointer.y * 0.2 - parallax.current.y) * Math.min(1, delta * 2.5);
    const shake = game.shake;
    const sx = (Math.random() - 0.5) * shake;
    const sy = (Math.random() - 0.5) * shake;
    desired.current.set(
      parallax.current.x + sx,
      elevation * distance + sy,
      horizontal * distance,
    );
    if (!ready.current) {
      camera.position.copy(desired.current);
      ready.current = true;
    } else {
      camera.position.lerp(desired.current, 1 - Math.exp(-delta * 3.6));
    }
    target.current.set(0, 0.25, 0.05 - parallax.current.y * 0.25);
    camera.lookAt(target.current);
  });
  return null;
}

function GameLoop() {
  useFrame((_, delta) => {
    game.update(delta);
  }, -1);
  return null;
}

function Chefs() {
  useGameVersion();
  return (
    <>
      {game.players.map((player, index) => (
        <Chef key={`${player.id}-${game.level.id}`} index={index} />
      ))}
    </>
  );
}

export function GameScene({ levelId }: { levelId: string }) {
  const theme = game.level.theme;
  return (
    <Canvas
      key={levelId}
      shadows
      dpr={[1, 1.9]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 35, near: 0.1, far: 80, position: [0, 15, 12] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.04;
        gl.shadowMap.type = THREE.PCFShadowMap;
      }}
      style={{ position: "absolute", inset: 0 }}
    >
      <color attach="background" args={[theme.background]} />
      <fog attach="fog" args={[theme.fog, 24, 44]} />
      <Suspense fallback={null}>
        <Lighting />
        <CameraRig />
        <GameLoop />
        <Kitchen />
        <Chefs />
      </Suspense>
    </Canvas>
  );
}
