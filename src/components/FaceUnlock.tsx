import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ScanFace, X, AlertTriangle } from "lucide-react";
import { verifyFace } from "@/lib/face.functions";
import { readFamily, type StoredMember } from "@/lib/family-store";
import { snapshot } from "@/lib/camera";

type Props = { onClose: () => void; onMatch: (m: StoredMember) => void; onReject?: () => void };

export function FaceUnlock({ onClose, onMatch, onReject }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [enrolled, setEnrolled] = useState<StoredMember[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const verify = useServerFn(verifyFace);

  useEffect(() => {
    readFamily().then((f) => setEnrolled(f.filter((m) => m.face && m.photo))).catch(() => setEnrolled([]));
  }, []);

  useEffect(() => {
    if (!enrolled?.length) return;
    let stream: MediaStream | null = null;
    if (!navigator.mediaDevices?.getUserMedia) { setError("This browser can't use the camera."); return; }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((s) => { stream = s; if (videoRef.current) videoRef.current.srcObject = s; })
      .catch(() => setError("Camera access was blocked. Allow camera permission and try again."));
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, [enrolled]);

  const scan = async () => {
    const v = videoRef.current;
    if (!v?.videoWidth || !enrolled) return;
    setBusy(true); setError(null);
    try {
      const r = await verify({ data: { probe: snapshot(v), candidates: enrolled.map((m) => ({ id: m.id, name: m.name, photo: m.photo! })) } });
      if (!r.ok) setError(r.error);
      else if (!r.matchId) { if (onReject) onReject(); else setError("Face not recognised. Vehicle stays locked."); }
      else onMatch(enrolled.find((m) => m.id === r.matchId)!);
    } catch {
      setError("Face check failed. Try again.");
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/60 sm:items-center">
      <div className="w-full max-w-md rounded-t-3xl bg-card p-5 sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold"><ScanFace className="h-5 w-5 text-primary" />Face unlock</h2>
          <button aria-label="Close" onClick={onClose} className="rounded-full border p-1"><X className="h-4 w-4" /></button>
        </div>
        {enrolled === null ? null : enrolled.length === 0 ? (
          <div className="mt-4 text-sm">
            <p>No faces are enrolled yet (sign in first if you haven't).</p>
            <Link to="/family" className="mt-3 block w-full rounded-xl bg-primary py-3 text-center font-semibold text-primary-foreground">Enrol a face on the Family page</Link>
          </div>
        ) : (
          <div className="mt-4">
            <div className="relative mx-auto aspect-square w-64 overflow-hidden rounded-full border-4 border-primary bg-muted">
              <video ref={videoRef} autoPlay playsInline muted className="h-full w-full scale-x-[-1] object-cover" />
              {busy && <div className="scanline absolute left-0 h-1 w-full bg-accent" />}
            </div>
            {error && <p className="mt-3 flex items-start gap-2 text-sm text-destructive"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}
            <button disabled={busy} onClick={scan} className="mt-3 w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-60">
              {busy ? "Checking face…" : "Scan face"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
