import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Mesh } from "three";

// Procedural anime-style character: big head, large eyes, spiky hair, small body.
function Character({ speaking, listening }: { speaking: boolean; listening: boolean }) {
  const root = useRef<Group>(null);
  const head = useRef<Group>(null);
  const mouth = useRef<Mesh>(null);
  const eyeL = useRef<Mesh>(null);
  const eyeR = useRef<Mesh>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (root.current) { root.current.position.y = -1.0 + Math.sin(t * 2) * 0.06; root.current.rotation.y = Math.sin(t * 0.7) * 0.35; }
    if (head.current) head.current.rotation.z = listening ? Math.sin(t * 1.5) * 0.12 : Math.sin(t) * 0.04;
    if (mouth.current) mouth.current.scale.y = speaking ? 0.4 + Math.abs(Math.sin(t * 18)) * 1.6 : 0.3;
    const blink = t % 3.5 < 0.12 ? 0.1 : 1;
    if (eyeL.current) eyeL.current.scale.y = blink;
    if (eyeR.current) eyeR.current.scale.y = blink;
    const wave = speaking ? Math.sin(t * 6) * 0.5 : Math.sin(t * 2) * 0.1;
    if (armR.current) armR.current.rotation.z = -0.4 - wave;
    if (armL.current) armL.current.rotation.z = 0.4 + wave * 0.3;
  });

  const skin = "#ffe0c9", hair = "#ff6a2b", suit = "#1f2a44", eye = "#2a1a5e";
  return (
    <group ref={root} position={[0, -1.0, 0]}>
      {/* body */}
      <mesh position={[0, 0.35, 0]}><capsuleGeometry args={[0.32, 0.45, 8, 16]} /><meshToonMaterial color={suit} /></mesh>
      <mesh position={[0, 0.62, 0.2]}><boxGeometry args={[0.25, 0.08, 0.1]} /><meshToonMaterial color={hair} /></mesh>
      <group ref={armL} position={[0.38, 0.6, 0]}><mesh position={[0.08, -0.22, 0]}><capsuleGeometry args={[0.08, 0.35, 6, 12]} /><meshToonMaterial color={suit} /></mesh></group>
      <group ref={armR} position={[-0.38, 0.6, 0]}><mesh position={[-0.08, -0.22, 0]}><capsuleGeometry args={[0.08, 0.35, 6, 12]} /><meshToonMaterial color={suit} /></mesh></group>
      {/* head */}
      <group ref={head} position={[0, 1.25, 0]}>
        <mesh><sphereGeometry args={[0.5, 32, 32]} /><meshToonMaterial color={skin} /></mesh>
        {/* hair cap + spikes */}
        <mesh position={[0, 0.12, -0.04]} scale={[1.05, 0.95, 1.05]}><sphereGeometry args={[0.5, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2.1]} /><meshToonMaterial color={hair} /></mesh>
        {[-0.35, -0.15, 0.05, 0.25, 0.4].map((x, i) => (
          <mesh key={i} position={[x, 0.42, 0.25]} rotation={[0.9, 0, -x * 1.2]}><coneGeometry args={[0.1, 0.32, 8]} /><meshToonMaterial color={hair} /></mesh>
        ))}
        {/* eyes */}
        <group position={[0.18, 0, 0.44]}>
          <mesh ref={eyeL}><sphereGeometry args={[0.11, 24, 24]} /><meshToonMaterial color={eye} /></mesh>
          <mesh position={[0.03, 0.04, 0.09]}><sphereGeometry args={[0.035, 12, 12]} /><meshBasicMaterial color="#ffffff" /></mesh>
        </group>
        <group position={[-0.18, 0, 0.44]}>
          <mesh ref={eyeR}><sphereGeometry args={[0.11, 24, 24]} /><meshToonMaterial color={eye} /></mesh>
          <mesh position={[0.03, 0.04, 0.09]}><sphereGeometry args={[0.035, 12, 12]} /><meshBasicMaterial color="#ffffff" /></mesh>
        </group>
        {/* blush */}
        <mesh position={[0.3, -0.13, 0.38]}><circleGeometry args={[0.06, 16]} /><meshBasicMaterial color="#ff9aa2" transparent opacity={0.7} /></mesh>
        <mesh position={[-0.3, -0.13, 0.38]}><circleGeometry args={[0.06, 16]} /><meshBasicMaterial color="#ff9aa2" transparent opacity={0.7} /></mesh>
        {/* mouth */}
        <mesh ref={mouth} position={[0, -0.2, 0.47]}><sphereGeometry args={[0.05, 16, 16]} /><meshBasicMaterial color="#7a1f2b" /></mesh>
      </group>
    </group>
  );
}

export default function AvatarModel({ speaking, listening }: { speaking: boolean; listening: boolean }) {
  return (
    <Canvas camera={{ position: [0, 0.2, 4.4], fov: 35 }} gl={{ alpha: true }} dpr={[1, 2]}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[2, 3, 3]} intensity={1.4} />
      <Character speaking={speaking} listening={listening} />
    </Canvas>
  );
}
