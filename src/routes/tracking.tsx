import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navigation, ShieldCheck, Power, RotateCcw } from "lucide-react";
import { AppShell, Card } from "@/components/AppShell";
import { LiveMap } from "@/components/LiveMap";
import { vehicle } from "@/lib/demo-data";

export const Route = createFileRoute("/tracking")({
  head: () => ({
    meta: [
      { title: "Live tracking | RideGuard" },
      { name: "description", content: "See where your two-wheeler is on a real map, its speed, and shut it down in an emergency." },
      { property: "og:title", content: "Live tracking | RideGuard" },
      { property: "og:description", content: "Real map location and emergency engine shutdown for your two-wheeler." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Tracking,
});

// Sample trip along Anna Salai, Chennai
const path = [
  { lat: 13.0358, lng: 80.2443 }, { lat: 13.0378, lng: 80.2412 }, { lat: 13.0398, lng: 80.2380 },
  { lat: 13.0418, lng: 80.2341 }, { lat: 13.0445, lng: 80.2310 }, { lat: 13.0472, lng: 80.2280 },
  { lat: 13.0500, lng: 80.2252 }, { lat: 13.0530, lng: 80.2225 },
];
const speeds = [0, 22, 31, 38, 34, 41, 28, 19];

function Tracking() {
  const [i, setI] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (stopped) return;
    const t = setInterval(() => setI((v) => (v + 1) % path.length), 2000);
    return () => clearInterval(t);
  }, [stopped]);
  const pos = path[i]!;

  return (
    <AppShell title="Live tracking">
      <Card className="overflow-hidden p-0">
        <LiveMap path={path} index={i} stopped={stopped} />
      </Card>

      <Card className={`mt-4 ${stopped ? "border-destructive" : ""}`}>
        <p className="flex items-center gap-2 font-semibold"><Power className="h-4 w-4 text-destructive" /> Emergency shutdown</p>
        {stopped ? (
          <>
            <p className="mt-1 text-sm text-destructive">Engine cut off and vehicle locked. Hazard lights on.</p>
            <button onClick={() => setStopped(false)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border py-3 font-semibold"><RotateCcw className="h-4 w-4" />Restore engine</button>
          </>
        ) : confirm ? (
          <>
            <p className="mt-1 text-sm">The engine will slow down safely and switch off. Continue?</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button onClick={() => { setStopped(true); setConfirm(false); }} className="rounded-xl bg-destructive py-3 font-bold text-destructive-foreground">Shut down</button>
              <button onClick={() => setConfirm(false)} className="rounded-xl border py-3 font-semibold">Cancel</button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-1 text-xs text-muted-foreground">Use if the vehicle is stolen or a rider is in danger.</p>
            <button onClick={() => setConfirm(true)} className="mt-3 w-full rounded-xl bg-destructive py-3 font-bold text-destructive-foreground">Shut down vehicle</button>
          </>
        )}
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Card>
          <p className="text-xs text-muted-foreground">Speed</p>
          <p className="font-display text-3xl font-bold">{stopped ? 0 : speeds[i]}<span className="text-sm"> km/h</span></p>
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
          <p className="text-xs text-muted-foreground">{pos.lat.toFixed(4)}° N, {pos.lng.toFixed(4)}° E · updated just now</p>
        </div>
      </Card>
      <Card className="mt-4 flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-success" />
        <p className="text-sm">Geo-fence alert on: you'll be told if the bike leaves Chennai city limits.</p>
      </Card>
    </AppShell>
  );
}
