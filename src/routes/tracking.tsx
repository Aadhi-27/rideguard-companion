import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navigation, ShieldCheck } from "lucide-react";
import { AppShell, Card } from "@/components/AppShell";
import { vehicle } from "@/lib/demo-data";

export const Route = createFileRoute("/tracking")({
  head: () => ({
    meta: [
      { title: "Live tracking | RideGuard" },
      { name: "description", content: "See where your two-wheeler is right now, its speed and trip route." },
      { property: "og:title", content: "Live tracking | RideGuard" },
      { property: "og:description", content: "Real-time location and route history for your two-wheeler." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Tracking,
});

const route: [number, number][] = [
  [40, 300], [80, 260], [120, 250], [160, 200], [200, 180], [250, 150], [290, 110], [320, 70],
];

function Tracking() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % route.length), 1200);
    return () => clearInterval(t);
  }, []);
  const [x, y] = route[i] ?? route[0]!;
  const speed = [0, 22, 31, 38, 34, 41, 28, 19][i];

  return (
    <AppShell title="Live tracking">
      <Card className="overflow-hidden p-0">
        <svg viewBox="0 0 360 340" className="w-full bg-muted">
          {[...Array(9)].map((_, k) => (
            <line key={`h${k}`} x1="0" x2="360" y1={k * 40} y2={k * 40} className="stroke-border" strokeWidth="6" />
          ))}
          {[...Array(10)].map((_, k) => (
            <line key={`v${k}`} y1="0" y2="340" x1={k * 40} x2={k * 40} className="stroke-border" strokeWidth="6" />
          ))}
          <rect x="200" y="220" width="110" height="80" rx="10" className="fill-success/20" />
          <polyline points={route.map((p) => p.join(",")).join(" ")} fill="none" className="stroke-accent" strokeWidth="4" strokeDasharray="6 6" />
          <circle cx={x} cy={y} r="18" className="fill-primary/25" />
          <circle cx={x} cy={y} r="8" className="fill-primary stroke-card" strokeWidth="3" />
        </svg>
      </Card>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Card>
          <p className="text-xs text-muted-foreground">Speed</p>
          <p className="font-display text-3xl font-bold">{speed}<span className="text-sm"> km/h</span></p>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">Rider</p>
          <p className="font-display text-lg font-bold">Arun (Son)</p>
          <p className="text-xs text-success">Approved by parent</p>
        </Card>
      </div>
      <Card className="mt-4 flex items-center gap-3">
        <Navigation className="h-5 w-5 text-accent" />
        <div className="text-sm">
          <p className="font-semibold">{vehicle.location}</p>
          <p className="text-xs text-muted-foreground">{vehicle.lat}° N, {vehicle.lng}° E · updated just now</p>
        </div>
      </Card>
      <Card className="mt-4 flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-success" />
        <p className="text-sm">Geo-fence alert on: you'll be told if the bike leaves Chennai city limits.</p>
      </Card>
    </AppShell>
  );
}
