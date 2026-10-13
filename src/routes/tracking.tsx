import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Navigation, ShieldCheck, Power } from "lucide-react";
import { AppShell, Card } from "@/components/AppShell";
import { LiveMap } from "@/components/LiveMap";

export const Route = createFileRoute("/tracking")({
  head: () => ({
    meta: [
      { title: "Live tracking | RideGuard" },
      { name: "description", content: "See your real GPS position on a live map with speed and a geo-fence alert." },
      { property: "og:title", content: "Live tracking | RideGuard" },
      { property: "og:description", content: "Real-time GPS map, speed and geo-fence for your two-wheeler." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Tracking,
});

type P = { lat: number; lng: number };
function meters(a: P, b: P) {
  const r = (x: number) => (x * Math.PI) / 180;
  const d = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 12742000 * Math.asin(Math.sqrt(d));
}

function Tracking() {
  const [trail, setTrail] = useState<P[]>([]);
  const [speed, setSpeed] = useState<number | null>(null);
  const [acc, setAcc] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [fence, setFence] = useState(false);
  const [radius, setRadius] = useState(200);
  const [center, setCenter] = useState<P | null>(null);
  const alerted = useRef(false);

  useEffect(() => {
    if (!navigator.geolocation) { setErr("This device can't share location."); return; }
    const id = navigator.geolocation.watchPosition(
      (p) => {
        const pos = { lat: p.coords.latitude, lng: p.coords.longitude };
        setErr(null); setAcc(p.coords.accuracy);
        setSpeed(p.coords.speed != null ? Math.round(p.coords.speed * 3.6) : null);
        setTrail((t) => (t.length && meters(t[t.length - 1]!, pos) < 5 ? t : [...t.slice(-200), pos]));
      },
      () => setErr("Location permission was blocked. Allow location in your browser to track."),
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const pos = trail[trail.length - 1];
  const dist = fence && center && pos ? meters(center, pos) : 0;
  const breach = fence && dist > radius;

  useEffect(() => {
    if (breach && !alerted.current) {
      alerted.current = true;
      navigator.vibrate?.([400, 200, 400]);
      if ("Notification" in window && Notification.permission === "granted") new Notification("RideGuard geo-fence", { body: `Moved ${Math.round(dist)} m from the parked spot.` });
    }
    if (!breach) alerted.current = false;
  }, [breach, dist]);

  const toggleFence = () => {
    if (!fence && pos) { setCenter(pos); if ("Notification" in window && Notification.permission === "default") void Notification.requestPermission(); }
    setFence(!fence);
  };

  return (
    <AppShell title="Live tracking">
      <Card className="overflow-hidden p-0">
        {pos ? <LiveMap path={trail} index={trail.length - 1} stopped={false} /> : <div className="flex h-80 items-center justify-center p-6 text-center text-sm text-muted-foreground">{err ?? "Finding your location…"}</div>}
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Card>
          <p className="text-xs text-muted-foreground">Speed</p>
          <p className="font-display text-3xl font-bold">{speed ?? "–"}<span className="text-sm"> km/h</span></p>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">GPS accuracy</p>
          <p className="font-display text-3xl font-bold">{acc ? Math.round(acc) : "–"}<span className="text-sm"> m</span></p>
        </Card>
      </div>
      {pos && (
        <Card className="mt-4 flex items-center gap-3">
          <Navigation className="h-5 w-5 text-accent" />
          <p className="text-sm">{pos.lat.toFixed(5)}° N, {pos.lng.toFixed(5)}° E · live</p>
        </Card>
      )}

      <Card className={`mt-4 ${breach ? "border-destructive" : ""}`}>
        <div className="flex items-center gap-3">
          <ShieldCheck className={`h-5 w-5 ${fence ? "text-success" : "text-muted-foreground"}`} />
          <p className="flex-1 text-sm font-semibold">Geo-fence</p>
          <button disabled={!pos} onClick={toggleFence} className={`rounded-full px-3 py-1 text-xs font-semibold disabled:opacity-50 ${fence ? "bg-success text-primary-foreground" : "border"}`}>{fence ? "On" : "Off"}</button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Turning it on remembers where you are now. Keep this page open on a phone left with the bike to get an alert if it moves.</p>
        {fence && (
          <>
            <label className="mt-3 block text-xs text-muted-foreground">Radius: {radius} m · now {Math.round(dist)} m away</label>
            <input type="range" min={50} max={1000} step={50} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="w-full" />
            {breach && <div role="alert" className="mt-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive"><b>Moved outside the geo-fence!</b> {Math.round(dist)} m from where it was parked.</div>}
          </>
        )}
      </Card>

      <Card className="mt-4 flex items-center gap-3">
        <Power className="h-5 w-5 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Emergency engine shutdown and the bike's own GPS will work once your bike's tracking device is connected.</p>
      </Card>
    </AppShell>
  );
}
