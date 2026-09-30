import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AppShell, Card } from "@/components/AppShell";
import { parts, type Part } from "@/lib/demo-data";

export const Route = createFileRoute("/condition")({
  head: () => ({
    meta: [
      { title: "3D vehicle condition | RideGuard" },
      { name: "description", content: "Rotate a live 3D view of your scooter and check tyres, engine, brakes and lights." },
      { property: "og:title", content: "3D vehicle condition | RideGuard" },
      { property: "og:description", content: "Live health of every part of your two-wheeler in 3D." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Condition,
});

const color = (s: Part["status"]) => (s === "good" ? "fill-success" : s === "check" ? "fill-warning" : "fill-destructive");
const st = (k: string) => parts.find((p) => p.key === k)!.status;

function Condition() {
  const [rot, setRot] = useState({ x: -12, y: -25 });
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [sel, setSel] = useState<Part | null>(null);

  const layer = (z: number, op = 1) => (
    <svg viewBox="0 0 300 200" className="absolute inset-0 h-full w-full" style={{ transform: `translateZ(${z}px)`, opacity: op }}>
      <circle cx="70" cy="145" r="38" className={`${color(st("rear-tyre"))} opacity-80`} />
      <circle cx="70" cy="145" r="18" className="fill-card" />
      <circle cx="235" cy="145" r="38" className={`${color(st("front-tyre"))} opacity-80`} />
      <circle cx="235" cy="145" r="18" className="fill-card" />
      <path d="M40 120 Q60 70 130 80 L190 80 Q210 60 225 40 L240 40 L250 110 L215 130 L110 130 Z" className="fill-secondary stroke-foreground" strokeWidth="2" />
      <rect x="95" y="100" width="55" height="28" rx="6" className={color(st("engine"))} />
      <rect x="70" y="68" width="75" height="14" rx="7" className="fill-foreground/70" />
      <circle cx="248" cy="52" r="8" className={color(st("lights"))} />
    </svg>
  );

  return (
    <AppShell title="3D condition">
      <Card className="p-0">
        <div
          className="relative h-72 cursor-grab touch-none select-none"
          style={{ perspective: 800 }}
          onPointerDown={(e) => (drag.current = { x: e.clientX, y: e.clientY })}
          onPointerMove={(e) => {
            if (!drag.current) return;
            const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
            drag.current = { x: e.clientX, y: e.clientY };
            setRot((r) => ({ x: Math.max(-40, Math.min(40, r.x - dy * 0.4)), y: r.y + dx * 0.5 }));
          }}
          onPointerUp={() => (drag.current = null)}
          onPointerLeave={() => (drag.current = null)}
        >
          <div className="absolute inset-6" style={{ transformStyle: "preserve-3d", transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)` }}>
            {[-24, -16, -8, 0, 8, 16, 24].map((z) => (
              <div key={z} className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>{layer(z, z === 24 || z === -24 ? 1 : 0.35)}</div>
            ))}
          </div>
          <p className="absolute bottom-2 w-full text-center text-xs text-muted-foreground">Drag to rotate</p>
        </div>
      </Card>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {parts.map((p) => (
          <button key={p.key} onClick={() => setSel(p)} className="text-left">
            <Card className={`p-3 ${sel?.key === p.key ? "ring-2 ring-primary" : ""}`}>
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${p.status === "good" ? "bg-success" : p.status === "check" ? "bg-warning" : "bg-destructive"}`} />
                <span className="text-sm font-semibold">{p.label}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{p.value}</p>
            </Card>
          </button>
        ))}
      </div>
    </AppShell>
  );
}
