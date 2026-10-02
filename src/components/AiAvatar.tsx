import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Mic, MicOff, PhoneOff, X, Play } from "lucide-react";
import { useLiveVoice, type LiveEvent } from "@/hooks/use-live-voice";
import { verifyFace } from "@/lib/face.functions";
import { readFamily } from "@/lib/family-store";
import { snapshot } from "@/lib/camera";

const AvatarModel = lazy(() => import("./AvatarModel"));

const ROUTES: Record<string, string> = {
  home: "/", tracking: "/tracking", condition: "/condition", cameras: "/cameras",
  family: "/family", nearby: "/nearby", sos: "/sos",
};
// Corner the avatar walks to on each page
const SPOTS: Record<string, string> = {
  "/": "right-3 bottom-28", "/tracking": "left-3 bottom-28", "/condition": "right-3 top-24",
  "/cameras": "left-3 top-24", "/family": "right-3 bottom-28", "/nearby": "left-3 bottom-28", "/sos": "right-3 top-24",
};

export function AiAvatar() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [heard, setHeard] = useState("");
  const [said, setSaid] = useState("");
  const [rider, setRider] = useState<string | null>(null);
  const [scanMsg, setScanMsg] = useState<string | null>(null);
  const [url, setUrl] = useState("/api/live");
  const pendingStart = useRef(false);
  const speakTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const verify = useServerFn(verifyFace);

  const onEvent = (e: LiveEvent) => {
    const ev = e as LiveEvent & { delta?: string; page?: string };
    if (ev.type === "session.output_transcript.delta" && ev.delta) {
      setSaid((s) => (s + ev.delta).slice(-220));
      setSpeaking(true);
      clearTimeout(speakTimer.current);
      speakTimer.current = setTimeout(() => setSpeaking(false), 900);
    }
    if (ev.type === "session.input_transcript.delta" && ev.delta) { setHeard((s) => (s + ev.delta).slice(-160)); setSaid(""); }
    const dest = ev.type === "app.navigate" && ev.page ? ROUTES[ev.page] : undefined;
    if (dest) navigate({ to: dest });
  };
  const voice = useLiveVoice({ url, onEvent });
  const idle = voice.status === "idle" || voice.status === "closed";

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (pendingStart.current) { pendingStart.current = false; voice.start(); }
  }, [url]); // eslint-disable-line react-hooks/exhaustive-deps

  // Look through the camera to recognise the rider, then start talking.
  const start = async () => {
    setHeard(""); setSaid(""); setScanMsg("Looking at you…");
    let name: string | null = null;
    const enrolled = readFamily().filter((m) => m.face && m.photo);
    let stream: MediaStream | null = null;
    try {
      if (enrolled.length && navigator.mediaDevices?.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        const v = videoRef.current!;
        v.srcObject = stream; await v.play();
        await new Promise((r) => setTimeout(r, 800));
        const r = await verify({ data: { probe: snapshot(v), candidates: enrolled.map((m) => ({ id: m.id, name: m.name, photo: m.photo! })) } });
        if (r.ok && r.matchId) name = enrolled.find((m) => m.id === r.matchId)?.name ?? null;
      }
    } catch { /* continue without recognition */ }
    finally { stream?.getTracks().forEach((t) => t.stop()); }
    setRider(name);
    setScanMsg(name ? `Hi ${name}!` : enrolled.length ? "I couldn't recognise you." : "No family faces enrolled yet.");
    const next = name ? `/api/live?rider=${encodeURIComponent(name)}` : "/api/live";
    if (next === url) voice.start(); else { pendingStart.current = true; setUrl(next); }
  };

  const spot = SPOTS[path] ?? "right-3 bottom-28";

  return (
    <>
      <audio ref={voice.audioRef} className="hidden" />
      <video ref={videoRef} muted playsInline className="hidden" />
      <button
        aria-label="Open Kavi assistant"
        onClick={() => setOpen(true)}
        className={`avatar-walk fixed z-40 h-36 w-28 ${spot}`}
      >
        {mounted && <Suspense fallback={null}><AvatarModel speaking={speaking} listening={voice.status === "connected" && !speaking} /></Suspense>}
        {voice.status === "connected" && <span className="absolute -top-1 left-1/2 -translate-x-1/2 rounded-full bg-success px-2 text-[10px] font-bold text-primary-foreground">LIVE</span>}
      </button>

      {open && (
        <div className="fixed bottom-24 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 rounded-2xl border bg-card p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="font-display font-bold">Kavi · Tamil / English</p>
            <button aria-label="Close" onClick={() => setOpen(false)} className="rounded-full border p-1"><X className="h-4 w-4" /></button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {voice.status === "connected" ? (speaking ? "Speaking…" : "Listening — talk in Tamil or English") : voice.status === "idle" || voice.status === "closed" ? "Tap Talk. Kavi looks through your camera to know who you are." : "Connecting…"}
          </p>
          {scanMsg && <p className="mt-2 text-xs">{scanMsg}{rider ? " (recognised)" : ""}</p>}
          {heard && <p className="mt-2 rounded-lg bg-muted p-2 text-xs"><b>You:</b> {heard}</p>}
          {said && <p className="mt-2 rounded-lg bg-secondary p-2 text-xs text-secondary-foreground"><b>Kavi:</b> {said}</p>}
          {voice.error && <p className="mt-2 text-xs text-destructive">{voice.error}</p>}
          {voice.playbackBlocked && <button onClick={voice.resumePlayback} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border py-2 text-sm"><Play className="h-4 w-4" />Play voice</button>}
          <div className="mt-3 flex gap-2">
            {idle ? (
              <button onClick={start} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-primary-foreground"><Mic className="h-4 w-4" />Talk to Kavi</button>
            ) : (
              <>
                <button disabled={voice.status !== "connected"} onClick={() => voice.setMuted(!voice.muted)} className="flex items-center justify-center rounded-xl border px-4">
                  {voice.muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
                <button disabled={voice.status === "stopping"} onClick={voice.stop} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-destructive py-3 font-semibold text-destructive-foreground"><PhoneOff className="h-4 w-4" />End</button>
              </>
            )}
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">Uses AI credits while talking.</p>
        </div>
      )}
    </>
  );
}
