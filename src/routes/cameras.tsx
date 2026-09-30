import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AppShell, Card } from "@/components/AppShell";
import pano from "@/assets/pano.jpg";

export const Route = createFileRoute("/cameras")({
  head: () => ({
    meta: [
      { title: "360° cameras | RideGuard" },
      { name: "description", content: "View live front, rear, left and right cameras around your two-wheeler from anywhere." },
      { property: "og:title", content: "360° cameras | RideGuard" },
      { property: "og:description", content: "Look all around your parked two-wheeler from your phone." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Cameras,
});

const views = [
  { label: "Front", pos: 0 },
  { label: "Right", pos: 25 },
  { label: "Rear", pos: 50 },
  { label: "Left", pos: 75 },
];

function Cameras() {
  const [pos, setPos] = useState(0);
  const drag = useRef<number | null>(null);
  const time = new Date().toLocaleTimeString();

  return (
    <AppShell title="360° view">
      <Card className="p-0 overflow-hidden">
        <div
          className="relative h-64 cursor-grab touch-none select-none"
          style={{ backgroundImage: `url(${pano})`, backgroundSize: "auto 100%", backgroundPositionX: `${pos}%`, backgroundRepeat: "repeat-x" }}
          onPointerDown={(e) => (drag.current = e.clientX)}
          onPointerMove={(e) => {
            if (drag.current === null) return;
            const dx = e.clientX - drag.current;
            drag.current = e.clientX;
            setPos((p) => (((p - dx * 0.15) % 100) + 100) % 100);
          }}
          onPointerUp={() => (drag.current = null)}
          onPointerLeave={() => (drag.current = null)}
        >
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-destructive px-2 py-1 text-xs font-bold text-destructive-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-destructive-foreground" /> LIVE
          </span>
          <span className="absolute bottom-3 right-3 rounded bg-foreground/70 px-2 py-1 font-mono text-xs text-background">{time}</span>
        </div>
      </Card>
      <p className="mt-2 text-center text-xs text-muted-foreground">Drag the picture to look around</p>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {views.map((v) => (
          <button
            key={v.label}
            onClick={() => setPos(v.pos)}
            className={`rounded-xl border py-2 text-sm font-semibold ${Math.abs(pos - v.pos) < 12 ? "bg-primary text-primary-foreground" : "bg-card"}`}
          >
            {v.label}
          </button>
        ))}
      </div>
      <Card className="mt-4 text-sm text-muted-foreground">
        4 cameras connected · recording saved for 7 days · motion alert on when parked.
      </Card>
    </AppShell>
  );
}
