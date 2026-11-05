import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ArrowLeft, Hand, LockKeyhole, MoveHorizontal, ScanLine, ZoomIn } from "lucide-react";
import { parts } from "@/lib/demo-data";
import { AppShell } from "@/components/AppShell";
import { HandGestureOverlay } from "@/components/HandGestureOverlay";
import { gesturesAllowed } from "@/game/sim/safety";

type Action = "form" | "lock" | "sos";
const PARTICLES = 6000;

function rand(index: number, salt: number) {
  const n = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

function scooterPosition(index: number): [number, number, number] {
  const part = index % 100;
  const a = rand(index, 1) * Math.PI * 2;
  const d = rand(index, 2);
  const z = (rand(index, 3) - 0.5) * 0.5;
  if (part < 34) {
    const front = part < 17;
    const r = 0.46 + (rand(index, 4) - 0.5) * 0.04;
    return [front ? 1.45 : -1.52, -0.57 + Math.cos(a) * r, z + Math.sin(a) * r * 0.08];
  }
  if (part < 53) {
    const x = -0.72 + d * 1.82;
    const top = 0.48 + Math.sin(d * Math.PI) * 0.25;
    return [x, -0.25 + rand(index, 5) * top, z];
  }
  if (part < 65) {
    return [-1.2 + d * 1.05, 0.25 + (rand(index, 6) - 0.5) * 0.12, z * 0.5];
  }
  if (part < 77) {
    return [0.56 + d * 0.82, -0.43 + d * 0.75 + (rand(index, 7) - 0.5) * 0.12, z * 0.4];
  }
  if (part < 88) {
    const x = -0.5 + d * 1.6;
    return [x, -0.14 + (rand(index, 8) - 0.5) * 0.11, z * 0.55];
  }
  if (part < 94) return [0.95 + Math.cos(a) * 0.38, 0.35 + Math.sin(a) * 0.13, z * 0.6];
  const handleX = 0.88 + d * 0.25;
  return [handleX, 0.42 - d * 0.9, z * 0.45];
}

function lockPosition(index: number): [number, number, number] {
  const section = index % 100;
  const a = rand(index, 15) * Math.PI * 2;
  const d = rand(index, 16);
  const z = (rand(index, 17) - 0.5) * 0.5;
  if (section < 42) {
    const theta = Math.PI * d;
    return [Math.cos(theta) * 0.78, 0.2 + Math.sin(theta) * 0.86, z];
  }
  if (section < 82) {
    const edge = section % 4;
    const p = d * 1.4;
    if (edge === 0) return [-0.82 + p, -0.55, z];
    if (edge === 1) return [-0.82 + p, -1.34, z];
    if (edge === 2) return [-0.82, -0.55 - d * 0.79, z];
    return [0.58, -0.55 - d * 0.79, z];
  }
  const holeR = 0.17;
  if (section < 91) return [Math.cos(a) * holeR, -0.85 + Math.sin(a) * holeR, z];
  return [Math.cos(a) * 0.055, -1.14 + Math.sin(a) * 0.12, z];
}

function ParticleCloud({ mode, rotation, zoom, onReady }: { mode: "scooter" | "lock"; rotation: number; zoom: number; onReady: () => void }) {
  const points = useRef<THREE.Points>(null);
  const time = useRef(0);
  const { camera } = useThree();
  const { geometry, scooter, lock } = useMemo(() => {
    const s = new Float32Array(PARTICLES * 3);
    const l = new Float32Array(PARTICLES * 3);
    const current = new Float32Array(PARTICLES * 3);
    for (let i = 0; i < PARTICLES; i++) {
      const sp = scooterPosition(i);
      const lp = lockPosition(i);
      for (let axis = 0; axis < 3; axis++) {
        s[i * 3 + axis] = sp[axis] ?? 0;
        l[i * 3 + axis] = lp[axis] ?? 0;
        current[i * 3 + axis] = sp[axis] ?? 0;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(current, 3));
    return { geometry: g, scooter: s, lock: l };
  }, []);

  useEffect(() => {
    onReady();
    return () => geometry.dispose();
  }, [geometry, onReady]);

  useFrame((_, delta) => {
    time.current += Math.min(delta, 0.05);
    const attr = geometry.getAttribute("position") as THREE.BufferAttribute;
    const values = attr.array as Float32Array;
    const target = mode === "lock" ? lock : scooter;
    const blend = 1 - Math.exp(-5 * Math.min(delta, 0.05));
    const drift = mode === "scooter" ? Math.sin(time.current * 1.4) * 0.012 : 0;
    for (let i = 0; i < values.length; i++) values[i] = (values[i] ?? 0) + ((target[i] ?? 0) - (values[i] ?? 0)) * blend;
    attr.needsUpdate = true;
    if (points.current) {
      points.current.rotation.y += (rotation * 0.7 - points.current.rotation.y) * blend;
      points.current.position.y = drift;
      const particleScale = mode === "lock" ? 0.8 : 1;
      points.current.scale.setScalar(particleScale);
    }
    camera.position.z += (7.6 / zoom - camera.position.z) * blend;
  });

  return <points ref={points} geometry={geometry}><pointsMaterial size={0.024} sizeAttenuation transparent depthWrite={false} opacity={0.92} color="var(--rideguard-scene-glow)" blending={THREE.AdditiveBlending} /></points>;
}

export function ScooterParticleScene() {
  const [mode, setMode] = useState<"scooter" | "lock">("scooter");
  const [cameraOn, setCameraOn] = useState(false);
  const [speed, setSpeed] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [tutorial, setTutorial] = useState(false);
  const pointer = useRef<{ x: number; id: number } | null>(null);
  const [ready, setReady] = useState(false);
  const speedRef = useRef<number | null>(null);
  useEffect(() => {
    setTutorial(localStorage.getItem("rideguard-gesture-tutorial") !== "seen");
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition((position) => {
      const nextSpeed = position.coords.speed === null ? null : Math.max(0, position.coords.speed * 3.6);
      speedRef.current = nextSpeed;
      setSpeed(nextSpeed);
    }, () => { speedRef.current = null; setSpeed(null); }, { enableHighAccuracy: true, maximumAge: 3000 });
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const handleAction = useCallback((action: Action) => {
    if (!gesturesAllowed(speedRef.current)) return;
    if (action === "form") setMode("scooter");
    if (action === "lock") { setMode("lock"); window.dispatchEvent(new CustomEvent("rideguard:antitheft", { detail: { armed: true } })); }
    if (action === "sos") window.dispatchEvent(new CustomEvent("rideguard:open-sos"));
  }, []);
  const handleRotate = useCallback((amount: number) => setRotation(amount * 0.7), []);
  const handleZoom = useCallback((amount: number) => setZoom(amount), []);
  const setCameraState = useCallback((enabled: boolean) => setCameraOn(enabled), []);

  return (
    <AppShell title="3D scooter">
    <section className="rg-3d-screen relative isolate min-h-[calc(100dvh-12rem)] overflow-hidden border border-accent/50 shadow-[0_0_32px_var(--rideguard-scene-shadow)]" data-scene-ready={ready ? "1" : undefined}>
      <Canvas camera={{ position: [0, 0, 7.6], fov: 42 }} dpr={[1, 1.5]} gl={{ alpha: false, antialias: true }} onCreated={({ gl, scene }) => { gl.setClearColor(new THREE.Color().setRGB(4 / 255, 12 / 255, 20 / 255)); scene.background = new THREE.Color().setRGB(4 / 255, 12 / 255, 20 / 255); }}>
        <ambientLight intensity={0.8} />
        <ParticleCloud mode={mode} rotation={rotation} zoom={zoom} onReady={() => setReady(true)} />
      </Canvas>
      <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-2 rounded-md border border-accent/40 bg-background/70 px-3 py-2 text-xs font-semibold text-accent backdrop-blur">
        <span className={`h-2.5 w-2.5 rounded-full ${gesturesAllowed(speed) ? "bg-success" : "bg-warning"}`} />
        {gesturesAllowed(speed) ? "PARKED" : "PARK FIRST"}
      </div>
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-md border border-accent/30 bg-background/70 px-3 py-2 text-xs text-foreground backdrop-blur"><ScanLine className="h-4 w-4 text-accent" /> 6,000</div>
      <p className="pointer-events-none absolute bottom-4 left-1/2 z-10 w-max max-w-[80%] -translate-x-1/2 rounded-md bg-background/70 px-3 py-2 text-center text-xs text-foreground/90 backdrop-blur">Parked mode only. Gestures are disabled while riding.</p>
      {tutorial && <div className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 rounded-full border border-accent/40 bg-background/80 p-4 text-accent shadow-[0_0_24px_var(--rideguard-scene-shadow)]" aria-label="Gesture tutorial"><Hand className="h-10 w-10 animate-pulse" /><MoveHorizontal className="h-7 w-7 animate-pulse" /><ZoomIn className="h-7 w-7 animate-pulse" /><LockKeyhole className="h-7 w-7 animate-pulse" /><button aria-label="Close gesture tutorial" onClick={() => { setTutorial(false); localStorage.setItem("rideguard-gesture-tutorial", "seen"); }} className="ml-1 h-10 w-10 rounded-full border border-accent/40 text-xs">OK</button></div>}
      {!cameraOn && <div className="absolute bottom-16 left-1/2 z-10 flex -translate-x-1/2 gap-3"><span className="rounded-md border border-accent/30 bg-background/70 px-2 py-2 text-accent"><Hand className="h-5 w-5" /></span><span className="rounded-md border border-accent/30 bg-background/70 px-2 py-2 text-accent"><MoveHorizontal className="h-5 w-5" /></span><span className="rounded-md border border-accent/30 bg-background/70 px-2 py-2 text-accent"><ZoomIn className="h-5 w-5" /></span></div>}
      <HandGestureOverlay speed={speed} onAction={handleAction} onRotate={handleRotate} onZoom={handleZoom} onCameraState={setCameraState} />
      <div className="absolute bottom-44 left-1/2 z-10 flex max-w-[90vw] -translate-x-1/2 gap-2 overflow-x-auto rounded-md border border-accent/20 bg-background/65 p-2 backdrop-blur">
        {parts.map((part) => <span key={part.key} className="flex shrink-0 items-center gap-1 text-[10px] text-foreground/80"><span className={`h-2 w-2 rounded-full ${part.status === "good" ? "bg-success" : part.status === "check" ? "bg-warning" : "bg-destructive"}`} />{part.label}</span>)}
      </div>
    </section>
    </AppShell>
  );
}
