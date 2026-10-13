import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ScanFace, Fingerprint, Lock, Unlock, MapPin, ShieldAlert } from "lucide-react";
import { AppShell, Card } from "@/components/AppShell";
import { FaceUnlock } from "@/components/FaceUnlock";
import { CrashDetector } from "@/components/CrashDetector";
import { supabase } from "@/integrations/supabase/client";
import { verifyFingerprint } from "@/lib/fingerprint";
import { fetchFamily } from "@/lib/family-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RideGuard: Smart two-wheeler security" },
      { name: "description", content: "Unlock your scooter with your face or fingerprint, track it live and keep your family safe." },
      { property: "og:title", content: "RideGuard: Smart two-wheeler security" },
      { property: "og:description", content: "Face and fingerprint unlock, live tracking, family ride approval and SOS for your two-wheeler." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

type Step = "locked" | "scanning" | "unlocked";

/** A minor may ride only with a parent's approval from the last hour. */
async function hasApproval(memberId: string) {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data } = await supabase.from("ride_requests").select("id").eq("member_id", memberId).eq("status", "approved").gte("decided_at", since).limit(1);
  return !!data?.length;
}

function Home() {
  const [state, setState] = useState<Step>("locked");
  const [method, setMethod] = useState<"face" | "finger">("face");
  const [faceOpen, setFaceOpen] = useState(false);
  const [denied, setDenied] = useState<string | null>(null);
  const [rider, setRider] = useState("");

  // Voice commands from Kavi ("start the bike" / "lock the bike")
  useEffect(() => {
    const h = (e: Event) => {
      const a = (e as CustomEvent<{ action: string }>).detail.action;
      if (a === "lock") setState("locked");
      if (a === "start") { setRider("you"); setState("unlocked"); }
    };
    window.addEventListener("rideguard:bike", h);
    return () => window.removeEventListener("rideguard:bike", h);
  }, []);

  const scan = async (m: "face" | "finger") => {
    setMethod(m);
    if (m === "face") { setFaceOpen(true); return; }
    setState("scanning");
    const r = await verifyFingerprint();
    if ("error" in r) { setState("locked"); setDenied(r.error); return; }
    const member = (await fetchFamily().catch(() => [])).find((f) => f.name === r.name);
    if (member?.minor && !(await hasApproval(member.id))) {
      setState("locked"); setDenied(`${r.name} is a minor. A parent must approve a ride on the Family page first.`); return;
    }
    setDenied(null); setRider(r.name); setState("unlocked");
    window.dispatchEvent(new CustomEvent("rideguard:greet", { detail: { name: r.name } }));
  };

  return (
    <AppShell title="RideGuard">
      {denied && (
        <div role="alert" className="mb-3 flex items-start gap-2 rounded-xl border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1"><b>Unauthorised.</b> {denied}</span>
          <button onClick={() => setDenied(null)} className="font-semibold">OK</button>
        </div>
      )}
      <Card className="relative overflow-hidden">
        <p className="text-xs text-muted-foreground">Rider check</p>
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
            {state === "unlocked" ? `Welcome, ${rider}. Ignition on` : state === "scanning" ? "Verifying…" : "Vehicle locked"}
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

      <Card className="mt-4 text-sm">
        <p className="font-semibold">Bike readings</p>
        <p className="mt-1 text-xs text-muted-foreground">Battery, fuel, odometer, parts health and remote ignition will show here once your bike's tracking device is connected.</p>
      </Card>

      <Link to="/tracking">
        <Card className="mt-4 flex items-center gap-3">
          <MapPin className="h-6 w-6 text-accent" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Live location</p>
            <p className="text-xs text-muted-foreground">See this phone's real GPS position on the map</p>
          </div>
          <span className="text-xs text-primary">Live →</span>
        </Card>
      </Link>
      <CrashDetector />
      {faceOpen && (
        <FaceUnlock
          onClose={() => setFaceOpen(false)}
          onReject={() => { setFaceOpen(false); setState("locked"); setDenied("Face not recognised — vehicle stays locked."); }}
          onMatch={async (m) => {
            setFaceOpen(false);
            if (m.minor && !(await hasApproval(m.id))) {
              setState("locked");
              setDenied(`${m.name} is a minor. A parent must approve a ride on the Family page first.`);
              return;
            }
            setDenied(null); setRider(m.name); setState("unlocked");
            window.dispatchEvent(new CustomEvent("rideguard:greet", { detail: { name: m.name } }));
          }}
        />
      )}
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
