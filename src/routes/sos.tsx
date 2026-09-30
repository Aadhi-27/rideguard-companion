import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Siren, MapPin, CheckCircle2 } from "lucide-react";
import { AppShell, Card } from "@/components/AppShell";
import { vehicle } from "@/lib/demo-data";

export const Route = createFileRoute("/sos")({
  head: () => ({
    meta: [
      { title: "Emergency SOS | RideGuard" },
      { name: "description", content: "Send an emergency alert with your two-wheeler's location to the Tamil Nadu helpline." },
      { property: "og:title", content: "Emergency SOS | RideGuard" },
      { property: "og:description", content: "One tap emergency help with live location sharing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Sos,
});

function Sos() {
  const [count, setCount] = useState<number | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (count === null) return;
    if (count === 0) { setSent(true); setCount(null); return; }
    const t = setTimeout(() => setCount(count - 1), 1000);
    return () => clearTimeout(t);
  }, [count]);

  return (
    <AppShell title="Emergency SOS">
      {!sent ? (
        <div className="flex flex-col items-center py-6">
          <button
            onClick={() => setCount(count === null ? 5 : null)}
            className="flex h-52 w-52 flex-col items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-2xl ring-8 ring-destructive/25"
          >
            <Siren className="h-14 w-14" />
            <span className="mt-2 font-display text-2xl font-bold">{count === null ? "HOLD SOS" : count}</span>
          </button>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {count === null ? "Tap to alert the Tamil Nadu emergency helpline" : "Sending in a moment… tap again to cancel"}
          </p>
        </div>
      ) : (
        <Card className="text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
          <h2 className="mt-2 text-lg font-bold">Alert sent (demo)</h2>
          <p className="mt-1 text-sm text-muted-foreground">TN helpline desk received your location. Help ETA ~8 minutes. Family notified.</p>
          <button onClick={() => setSent(false)} className="mt-4 w-full rounded-xl border py-2 font-semibold">Cancel alert</button>
        </Card>
      )}
      <Card className="mt-4 flex items-center gap-3">
        <MapPin className="h-5 w-5 text-accent" />
        <div className="text-sm">
          <p className="font-semibold">Shared location</p>
          <p className="text-xs text-muted-foreground">{vehicle.location} · {vehicle.lat}, {vehicle.lng}</p>
        </div>
      </Card>
      <Card className="mt-4 text-sm">
        <p className="font-semibold">Auto crash detection</p>
        <p className="text-xs text-muted-foreground">If a fall or crash is detected, SOS starts automatically after 10 seconds.</p>
      </Card>
      <p className="mt-6 text-center text-xs text-muted-foreground">Demo only: no real call is placed.</p>
    </AppShell>
  );
}
