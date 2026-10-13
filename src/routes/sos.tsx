import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Siren, MapPin, Phone, MessageSquare } from "lucide-react";
import { AppShell, Card } from "@/components/AppShell";
import { useFamily } from "@/lib/family-store";
import { getPosition, mapsLink, sosMessage, smsLink, whatsappLink, SOS_AUTO_KEY, type Pos } from "@/lib/sos";

export const Route = createFileRoute("/sos")({
  head: () => ({
    meta: [
      { title: "Emergency SOS | RideGuard" },
      { name: "description", content: "Call 112 and send your live location to family in one tap." },
      { property: "og:title", content: "Emergency SOS | RideGuard" },
      { property: "og:description", content: "One tap emergency call with live location sharing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Sos,
});

function Sos() {
  const { user, family } = useFamily();
  const [count, setCount] = useState<number | null>(null);
  const [fired, setFired] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);
  const [locMsg, setLocMsg] = useState("Finding your location…");

  useEffect(() => {
    getPosition().then((p) => { setPos(p); setLocMsg(p ? "" : "Location blocked or unavailable. Allow location for SOS."); });
    if (sessionStorage.getItem(SOS_AUTO_KEY)) { sessionStorage.removeItem(SOS_AUTO_KEY); setCount(3); }
  }, []);

  useEffect(() => {
    if (count === null) return;
    if (count === 0) { setCount(null); setFired(true); window.location.href = "tel:112"; return; }
    const t = setTimeout(() => setCount(count - 1), 1000);
    return () => clearTimeout(t);
  }, [count]);

  const name = user?.user_metadata?.["full_name"] ?? user?.email?.split("@")[0] ?? "a RideGuard rider";
  const msg = sosMessage(name, pos);
  const phones = family.filter((m) => m.phone && m.member_user_id !== user?.id).map((m) => m.phone!);

  return (
    <AppShell title="Emergency SOS">
      <div className="flex flex-col items-center py-6">
        <button
          onClick={() => setCount(count === null ? 5 : null)}
          className="flex h-52 w-52 flex-col items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-2xl ring-8 ring-destructive/25"
        >
          <Siren className="h-14 w-14" />
          <span className="mt-2 font-display text-2xl font-bold">{count === null ? "SOS" : count}</span>
        </button>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {count === null ? "Tap to call 112 (Tamil Nadu emergency response)" : "Calling 112 in a moment… tap again to cancel"}
        </p>
      </div>

      <Card className={fired ? "border-destructive" : ""}>
        <p className="font-semibold">Alert your family</p>
        {phones.length ? (
          <div className="mt-3 grid gap-2">
            <a href={smsLink(phones, msg)} className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-primary-foreground"><MessageSquare className="h-4 w-4" />SMS location to {phones.length} family</a>
            {phones.map((p) => (
              <a key={p} href={whatsappLink(p, msg)} target="_blank" rel="noreferrer" className="rounded-xl border py-2 text-center text-sm font-semibold">WhatsApp {p}</a>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">
            {user ? "Add phone numbers to family members on the " : "Sign in and add family phone numbers on the "}
            <Link to="/family" className="font-semibold text-primary">Family page</Link> to alert them.
          </p>
        )}
        <a href="tel:112" className="mt-3 flex items-center justify-center gap-2 rounded-xl border py-2 text-sm font-semibold"><Phone className="h-4 w-4" />Call 112 now</a>
      </Card>

      <Card className="mt-4 flex items-center gap-3">
        <MapPin className="h-5 w-5 text-accent" />
        <div className="text-sm">
          <p className="font-semibold">Your live location</p>
          {pos ? <a href={mapsLink(pos)} target="_blank" rel="noreferrer" className="text-xs text-primary">{pos.lat.toFixed(5)}, {pos.lng.toFixed(5)} · ±{Math.round(pos.acc ?? 0)} m</a> : <p className="text-xs text-muted-foreground">{locMsg}</p>}
        </div>
      </Card>
    </AppShell>
  );
}
