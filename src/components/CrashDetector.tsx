import { useEffect, useRef, useState } from "react";
import { Activity, Siren } from "lucide-react";
import { Card } from "@/components/AppShell";
import { readFamily } from "@/lib/family-store";

const JOLT = 35; // m/s² — well above normal riding bumps

export function CrashDetector() {
  const [armed, setArmed] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [sent, setSent] = useState<string[] | null>(null);
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);

  const trigger = () => {
    if (timer.current) return;
    setSent(null); setCount(10);
    timer.current = setInterval(() => setCount((c) => (c === null ? null : c - 1)), 1000);
  };
  const cancel = () => { clearInterval(timer.current); timer.current = undefined; setCount(null); };

  useEffect(() => {
    if (count !== 0) return;
    clearInterval(timer.current); timer.current = undefined; setCount(null);
    setSent(readFamily().filter((m) => !m.minor).map((m) => m.name));
  }, [count]);

  useEffect(() => {
    if (!armed) return;
    const h = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const g = Math.hypot(a.x ?? 0, a.y ?? 0, a.z ?? 0);
      if (g > JOLT || g < 1.5) trigger(); // severe jolt or free-fall drop
    };
    window.addEventListener("devicemotion", h);
    return () => window.removeEventListener("devicemotion", h);
  }, [armed]);
  useEffect(() => () => clearInterval(timer.current), []);

  const arm = async () => {
    const DM = (window as unknown as { DeviceMotionEvent?: { requestPermission?: () => Promise<string> } }).DeviceMotionEvent;
    try { if (DM?.requestPermission && (await DM.requestPermission()) !== "granted") return; } catch {}
    setArmed(!armed);
  };

  return (
    <Card className={`mt-4 ${count !== null ? "border-destructive" : ""}`}>
      <p className="flex items-center gap-2 text-sm font-semibold"><Activity className="h-4 w-4 text-accent" />Crash & fall detection</p>
      {count !== null ? (
        <>
          <p className="mt-2 font-display text-2xl font-bold text-destructive">Crash detected · SOS in {count}s</p>
          <button onClick={cancel} className="mt-3 w-full rounded-xl border py-3 font-semibold">I'm OK, cancel</button>
        </>
      ) : (
        <>
          <p className="mt-1 text-xs text-muted-foreground">{armed ? "Watching the phone's motion sensor for drops or severe jolts." : "Off. Turn on to watch for crashes while riding."}</p>
          {sent && <p className="mt-2 flex items-center gap-2 text-sm text-destructive"><Siren className="h-4 w-4" />SOS sent with location to {sent.join(", ") || "family"} (demo).</p>}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={arm} className={`rounded-xl py-2 font-semibold ${armed ? "bg-success text-primary-foreground" : "border"}`}>{armed ? "On" : "Turn on"}</button>
            <button onClick={trigger} className="rounded-xl border py-2 font-semibold">Simulate crash</button>
          </div>
        </>
      )}
    </Card>
  );
}
