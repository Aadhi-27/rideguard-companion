import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ScanFace, Fingerprint, Lock, Unlock, Battery, Fuel, Gauge, MapPin, AlertTriangle } from "lucide-react";
import { AppShell, Card } from "@/components/AppShell";
import { vehicle, parts } from "@/lib/demo-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RideGuard: Smart two-wheeler security" },
      { name: "description", content: "Unlock your scooter with your face or fingerprint, track it live and keep your family safe." },
      { property: "og:title", content: "RideGuard: Smart two-wheeler security" },
      { property: "og:description", content: "Face and fingerprint unlock, live tracking, 360° cameras and SOS for your two-wheeler." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

type Step = "locked" | "scanning" | "unlocked";

function Home() {
  const [state, setState] = useState<Step>("locked");
  const [method, setMethod] = useState<"face" | "finger">("face");
  const alerts = parts.filter((p) => p.status !== "good");

  const scan = (m: "face" | "finger") => {
    setMethod(m);
    setState("scanning");
    setTimeout(() => setState("unlocked"), 1800);
  };

  return (
    <AppShell title={vehicle.name}>
      <Card className="relative overflow-hidden">
        <p className="text-xs text-muted-foreground">{vehicle.plate}</p>
        <div className="my-4 flex flex-col items-center">
          <div
            className={`relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border-4 ${
              state === "unlocked" ? "border-success" : state === "scanning" ? "border-accent" : "border-border"
            }`}
          >
            {state === "scanning" && <div className="scanline absolute left-0 h-1 w-full bg-accent" />}
            {state === "unlocked" ? (
              <Unlock className="h-14 w-14 text-success" />
            ) : state === "scanning" ? (
              method === "face" ? <ScanFace className="h-14 w-14 text-accent" /> : <Fingerprint className="h-14 w-14 text-accent" />
            ) : (
              <Lock className="h-14 w-14 text-muted-foreground" />
            )}
          </div>
          <p className="mt-3 font-display text-lg font-semibold">
            {state === "unlocked" ? "Welcome, Dhivya. Ignition on" : state === "scanning" ? "Verifying…" : "Vehicle locked"}
          </p>
        </div>
        {state === "unlocked" ? (
          <button onClick={() => setState("locked")} className="w-full rounded-xl border py-3 font-semibold">
            Lock vehicle
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button disabled={state === "scanning"} onClick={() => scan("face")} className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-60">
              <ScanFace className="h-5 w-5" /> Face
            </button>
            <button disabled={state === "scanning"} onClick={() => scan("finger")} className="flex items-center justify-center gap-2 rounded-xl bg-secondary py-3 font-semibold text-secondary-foreground disabled:opacity-60">
              <Fingerprint className="h-5 w-5" /> Fingerprint
            </button>
          </div>
        )}
      </Card>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat icon={Battery} label="Battery" value={`${vehicle.battery}%`} />
        <Stat icon={Fuel} label="Fuel" value={`${vehicle.fuel}%`} />
        <Stat icon={Gauge} label="Km" value={vehicle.odometer.toLocaleString()} />
      </div>

      <Link to="/tracking">
        <Card className="mt-4 flex items-center gap-3">
          <MapPin className="h-6 w-6 text-accent" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Parked</p>
            <p className="text-xs text-muted-foreground">{vehicle.location}</p>
          </div>
          <span className="text-xs text-primary">Live →</span>
        </Card>
      </Link>

      <Link to="/condition">
        <Card className="mt-4">
          <p className="mb-2 text-sm font-semibold">Needs attention</p>
          {alerts.map((a) => (
            <div key={a.key} className="flex items-center gap-2 py-1 text-sm">
              <AlertTriangle className={`h-4 w-4 ${a.status === "alert" ? "text-destructive" : "text-warning"}`} />
              <span className="flex-1">{a.label}</span>
              <span className="text-muted-foreground">{a.value}</span>
            </div>
          ))}
        </Card>
      </Link>
      <p className="mt-6 text-center text-xs text-muted-foreground">Demo mode: all readings are sample data.</p>
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Battery; label: string; value: string }) {
  return (
    <Card className="p-3 text-center">
      <Icon className="mx-auto h-5 w-5 text-primary" />
      <p className="mt-1 font-display text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}
