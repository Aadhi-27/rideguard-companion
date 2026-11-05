import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Camera, CameraOff, Hand, LockKeyhole, Rotate3D, Siren, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { gesturesAllowed } from "@/game/sim/safety";

declare global {
  interface Window { Hands?: new (options: { locateFile: (file: string) => string }) => any }
}

const MEDIAPIPE_VERSION = "0.4.1675469240";
const MEDIAPIPE_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${MEDIAPIPE_VERSION}`;
let handsScript: Promise<void> | null = null;

function loadHands() {
  if (window.Hands) return Promise.resolve();
  if (handsScript) return handsScript;
  handsScript = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${MEDIAPIPE_URL}/hands.js`;
    script.async = true;
    script.onload = () => window.Hands ? resolve() : reject(new Error("Hand tracker did not start."));
    script.onerror = () => reject(new Error("Hand tracker couldn't load."));
    document.head.appendChild(script);
  });
  return handsScript;
}

type Action = "form" | "lock" | "sos";
type Props = {
  speed: number | null;
  onAction: (action: Action) => void;
  onRotate: (amount: number) => void;
  onZoom: (amount: number) => void;
};

function handGesture(points: Array<{ x: number; y: number }>): Action | "pinch" | "none" {
  const distance = (a: number, b: number) => Math.hypot(points[a]!.x - points[b]!.x, points[a]!.y - points[b]!.y);
  if (distance(4, 8) < 0.055) return "pinch";
  const raised = [8, 12, 16, 20].map((tip, index) => distance(tip, 0) > distance([6, 10, 14, 18][index]!, 0) * 1.12);
  if (raised[0] && raised[1] && !raised[2] && !raised[3]) return "sos";
  if (raised.every(Boolean)) return "form";
  if (raised.every((isRaised) => !isRaised)) return "lock";
  return "none";
}

export function HandGestureOverlay({ speed, onAction, onRotate, onZoom }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const hands = useRef<any>(null);
  const raf = useRef<number | null>(null);
  const previousGesture = useRef<string>("none");
  const lastPose = useRef(0);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [position, setPosition] = useState({ x: 18, y: 94 });
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const run = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera access isn't available in this browser.");
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 }, audio: false });
        if (cancelled) { cameraStream.getTracks().forEach((track) => track.stop()); return; }
        stream.current = cameraStream;
        if (!video.current) return;
        video.current.srcObject = cameraStream;
        await video.current.play();
        await loadHands();
        if (!window.Hands || cancelled) throw new Error("Hand tracking isn't ready.");
        const tracker = new window.Hands({ locateFile: (file) => `${MEDIAPIPE_URL}/${file}` });
        hands.current = tracker;
        tracker.setOptions({ maxNumHands: 1, modelComplexity: 0, minDetectionConfidence: 0.6, minTrackingConfidence: 0.55 });
        tracker.onResults((result: { multiHandLandmarks?: Array<Array<{ x: number; y: number }>> }) => {
          const points = result.multiHandLandmarks?.[0];
          if (!points) { previousGesture.current = "none"; setMessage("Show one hand"); return; }
          const gesture = handGesture(points);
          if (gesture !== "pinch" && gesture !== "none" && gesture !== previousGesture.current) {
            if (gesturesAllowed(speed)) {
              onAction(gesture);
              setMessage(gesture === "form" ? "Scooter" : gesture === "lock" ? "Locked" : "SOS");
            } else {
              setMessage("Park and allow GPS first");
            }
          }
          previousGesture.current = gesture;
          const now = Date.now();
          if (now - lastPose.current > 90) {
            lastPose.current = now;
            onRotate(Math.max(-1, Math.min(1, (points[9]!.x - 0.5) * 2)));
            if (gesture === "pinch") onZoom(Math.max(0.74, Math.min(1.3, 1.3 - Math.hypot(points[4]!.x - points[8]!.x, points[4]!.y - points[8]!.y) * 8)));
          }
        });
        const processFrame = async () => {
          if (cancelled || !video.current || video.current.readyState < 2) return;
          await tracker.send({ image: video.current });
          if (!cancelled) raf.current = window.requestAnimationFrame(() => { void processFrame(); });
        };
        setError("");
        setMessage("Show one hand");
        void processFrame();
      } catch (cause) {
        const text = cause instanceof Error ? cause.message : "Camera access was blocked.";
        setError(text);
        stream.current?.getTracks().forEach((track) => track.stop());
        stream.current = null;
        setEnabled(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
      if (raf.current !== null) window.cancelAnimationFrame(raf.current);
      stream.current?.getTracks().forEach((track) => track.stop());
      stream.current = null;
      if (hands.current) { void hands.current.close(); hands.current = null; }
    };
  }, [enabled, onAction, onRotate, onZoom, speed]);

  const startDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    drag.current = { x: event.clientX, y: event.clientY, left: position.x, top: position.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag.current) return;
    setPosition({ x: Math.max(4, Math.min(window.innerWidth - 230, drag.current.left + event.clientX - drag.current.x)), y: Math.max(66, Math.min(window.innerHeight - 210, drag.current.top + event.clientY - drag.current.y)) });
  };

  return (
    <>
      <div className="absolute z-10 w-[min(13rem,44vw)] overflow-hidden rounded-md border border-accent/60 bg-background/90 shadow-lg backdrop-blur" style={{ left: position.x, top: position.y }}>
        <div className="flex items-center gap-2 border-b border-accent/30 px-2 py-1">
          <button aria-label="Drag camera window" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={() => { drag.current = null; }} className="flex min-h-9 flex-1 cursor-move items-center gap-2 text-left text-xs font-semibold" data-voice-en="Move the camera preview" data-voice-ta="Camera kaatchiyai nagarththavum"><Hand className="h-4 w-4 text-accent" />{message || "Camera"}</button>
          <button aria-label={enabled ? "Turn camera off" : "Turn camera on"} onClick={() => { setError(""); setEnabled((current) => !current); }} className="flex h-10 w-10 items-center justify-center rounded-md text-accent" data-voice-en={enabled ? "Turn camera off" : "Turn camera on"} data-voice-ta={enabled ? "Camera vaiththu vidavum" : "Camera iyakkavum"}>{enabled ? <CameraOff className="h-5 w-5" /> : <Camera className="h-5 w-5" />}</button>
        </div>
        {enabled ? <video ref={video} muted playsInline className="aspect-video w-full -scale-x-100 bg-background object-cover" /> : <div className="flex aspect-video items-center justify-center bg-background/70"><Camera className="h-8 w-8 text-accent/70" /></div>}
        {error && <div className="space-y-2 border-t border-destructive/50 p-2 text-xs"><p className="text-destructive">{error}</p><Button size="sm" variant="outline" className="w-full" onClick={() => { setError(""); onAction("form"); }}><Rotate3D className="h-4 w-4" /> Use buttons below</Button></div>}
      </div>
      <div className="absolute bottom-24 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        <Button size="icon" className="h-14 w-14 rounded-full shadow-[0_0_20px_hsl(var(--accent)/0.4)]" onClick={() => onAction("form")} aria-label="Form scooter" data-voice-en="Show the scooter" data-voice-ta="Scooter kaattavum"><Hand className="h-6 w-6" /></Button>
        <Button size="icon" variant="destructive" className="h-14 w-14 rounded-full" onClick={() => onAction("lock")} aria-label="Lock and arm anti-theft" data-voice-en="Lock and arm anti-theft" data-voice-ta="Pootthi thiruttu thaduppai iyakkavum"><LockKeyhole className="h-6 w-6" /></Button>
        <Button size="icon" variant="destructive" className="h-14 w-14 rounded-full" onClick={() => onAction("sos")} aria-label="Open SOS" data-voice-en="Open emergency help" data-voice-ta="Avasara udhavi thirakkavum"><Siren className="h-6 w-6" /></Button>
      </div>
      {error && <button className="absolute right-3 top-20 z-20 flex items-center gap-2 rounded-md border border-warning bg-background/90 px-3 py-2 text-xs" onClick={() => setError("")}><X className="h-4 w-4" />Camera unavailable · use buttons</button>}
    </>
  );
}