import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { game } from "../game/engine";
import { PLAYERS } from "../game/data";
import { useGameVersion } from "../game/useGameHooks";
import { FoodVisual, PlateWithContents, useChefClone } from "./models";
import { makePlayerBadgeTexture } from "./textures";

const CHEF_SCALE = 0.86;

function lerp(current: number, target: number, amount: number) {
  return current + (target - current) * amount;
}

export function Chef({ index }: { index: number }) {
  useGameVersion();
  const meta = PLAYERS[index] ?? PLAYERS[0];
  const chef = useChefClone(meta.color, meta.dark);
  const root = useRef<THREE.Group>(null);
  const bob = useRef<THREE.Group>(null);
  const carryGroup = useRef<THREE.Group>(null);
  const badgeTexture = useMemo(
    () => makePlayerBadgeTexture(meta.color, `P${index + 1}`),
    [meta.color, index],
  );
  const armData = useMemo(() => {
    const left = chef.getObjectByName("ChefArmL");
    const right = chef.getObjectByName("ChefArmR");
    return {
      left,
      right,
      leftX: left?.rotation.x ?? 0,
      rightX: right?.rotation.x ?? 0,
      leftY: left?.rotation.y ?? 0,
      rightY: right?.rotation.y ?? 0,
    };
  }, [chef]);

  const player = game.players[index];

  useFrame((state, delta) => {
    const p = game.players[index];
    if (!p || !root.current) return;
    root.current.visible = true;
    root.current.position.x = p.x;
    root.current.position.z = p.z;
    root.current.rotation.y = p.facing;

    const speed = Math.hypot(p.vx, p.vz);
    const run = Math.min(1, speed / 4.35);
    const t = state.clock.elapsedTime;
    const phase = t * 10.5;
    const walkBob = Math.abs(Math.sin(phase)) * 0.07 * run;
    const breathing = Math.sin(t * 2.1) * 0.008;
    if (bob.current) {
      bob.current.position.y = 0.015 + walkBob + breathing;
      bob.current.rotation.z = -Math.sin(phase) * 0.03 * run;
      const squash = 1 + Math.sin(phase * 2) * 0.012 * run;
      bob.current.scale.set(squash, 1 / squash, squash);
    }
    if (carryGroup.current) {
      carryGroup.current.position.y = 1.79 + Math.sin(t * 3.2) * 0.025;
      carryGroup.current.rotation.y = Math.sin(t * 1.8) * 0.06;
    }

    if (armData.left && armData.right) {
      const carryLift = p.carry ? 0.95 : 0;
      const chopPump = p.chopping ? Math.abs(Math.sin(t * 18)) * 0.24 : 0;
      const targetLeft =
        armData.leftX - carryLift - Math.sin(phase) * 0.28 * run - chopPump;
      const targetRight =
        armData.rightX - carryLift + Math.sin(phase) * 0.28 * run - chopPump;
      armData.left.rotation.x = lerp(armData.left.rotation.x, targetLeft, Math.min(1, delta * 12));
      armData.right.rotation.x = lerp(armData.right.rotation.x, targetRight, Math.min(1, delta * 12));
      armData.left.rotation.y = lerp(
        armData.left.rotation.y,
        armData.leftY + (p.carry ? 0.18 : 0),
        Math.min(1, delta * 8),
      );
      armData.right.rotation.y = lerp(
        armData.right.rotation.y,
        armData.rightY - (p.carry ? 0.18 : 0),
        Math.min(1, delta * 8),
      );
    }
  });

  if (!player) return null;

  return (
    <group ref={root} name={`chef-${index + 1}`}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow>
        <circleGeometry args={[0.55, 32]} />
        <meshBasicMaterial color="#5A3A25" transparent opacity={0.16} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.34, 0.46, 40]} />
        <meshBasicMaterial
          color={meta.color}
          transparent
          opacity={0.9}
          depthWrite={false}
        />
      </mesh>
      <group ref={bob}>
        <group scale={CHEF_SCALE}>
          <primitive object={chef} />
        </group>
        {!player.carry ? (
          <sprite position={[0.43, 2.02, 0]} scale={[0.28, 0.28, 1]} renderOrder={5}>
            <spriteMaterial
              map={badgeTexture}
              transparent
              depthWrite={false}
              depthTest={false}
              toneMapped={false}
            />
          </sprite>
        ) : null}
        {player.carry ? (
          <group ref={carryGroup} position={[0, 1.79, 0.36]} scale={0.78}>
            {player.carry.kind === "plate" ? (
              <PlateWithContents contents={player.carry.contents} />
            ) : (
              <FoodVisual item={player.carry.item} />
            )}
          </group>
        ) : null}
      </group>
    </group>
  );
}
