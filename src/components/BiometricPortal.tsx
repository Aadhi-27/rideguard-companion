import { useEffect, useRef, useState } from "react";
import { ScanFace, Fingerprint, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { snapshot } from "@/lib/camera";

type Props = { kind: "face" | "finger"; name: string; onClose: () => void; onDone: (photo?: string) => void };

export function BiometricPortal({ kind, name, onClose, onDone }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/60 sm:items-center">
      <div className="w-full max-w-md rounded-t-3xl bg-card p-5 sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            {kind === "face" ? <ScanFace className="h-5 w-5 text-primary" /> : <Fingerprint className="h-5 w-5 text-primary" />}
            {kind === "face" ? "Face enrolment" : "Fingerprint enrolment"}
          </h2>
          <button aria-label="Close" onClick={onClose} className="rounded-full border p-1"><X className="h-4 w-4" /></button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">For {name}</p>
        {kind === "face" ? <FaceScan onDone={onDone} /> : <FingerScan name={name} onDone={() => onDone()} />}
      </div>
    </div>
  );
}

function FaceScan({ onDone }: { onDone: (photo: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser can't use the camera.");
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((s) => {
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => setError("Camera access was blocked. Allow camera permission and try again."));
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  const capture = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    setScanning(true);
    setTimeout(() => {
      setPhoto(snapshot(v));
      setScanning(false);
      (v.srcObject as MediaStream | null)?.getTracks().forEach((t) => t.stop());
    }, 1500);
  };

  if (error) return <Msg bad text={error} />;
  return (
    <div className="mt-4">
      <div className="relative mx-auto aspect-square w-64 overflow-hidden rounded-full border-4 border-primary bg-muted">
        {photo ? (
          <img src={photo} alt="Captured face" className="h-full w-full scale-x-[-1] object-cover" />
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full scale-x-[-1] object-cover" />
        )}
        {scanning && <div className="scanline absolute left-0 h-1 w-full bg-accent" />}
      </div>
      {photo ? (
        <>
          <Msg text="Face captured and enrolled." />
          <button onClick={() => onDone(photo)} className="mt-3 w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground">Save</button>
        </>
      ) : (
        <>
          <p className="mt-3 text-center text-sm text-muted-foreground">Keep your face inside the circle</p>
          <button disabled={scanning} onClick={capture} className="mt-3 w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-60">
            {scanning ? "Scanning…" : "Scan face"}
          </button>
        </>
      )}
    </div>
  );
}

function FingerScan({ name, onDone }: { name: string; onDone: () => void }) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [status, setStatus] = useState<"idle" | "busy" | "ok" | "fail">("idle");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable) { setSupported(false); return; }
    PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then(setSupported).catch(() => setSupported(false));
  }, []);

  const enroll = async () => {
    setStatus("busy");
    try {
      await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: { name: "RideGuard" },
          user: { id: crypto.getRandomValues(new Uint8Array(16)), name, displayName: name },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
          authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
          timeout: 60000,
        },
      });
      setStatus("ok");
    } catch (e) {
      setErr(e instanceof Error && e.name === "NotAllowedError" ? "Scan cancelled or not allowed." : "Fingerprint scan failed. If you're in the editor preview, open the app in its own tab.");
      setStatus("fail");
    }
  };

  if (supported === null) return <p className="mt-4 text-sm">Checking this device…</p>;
  if (!supported)
    return <Msg bad text="This device has no fingerprint sensor (or it isn't set up). Use a phone or a laptop with a built-in fingerprint reader." />;
  return (
    <div className="mt-4 text-center">
      <div className={`mx-auto flex h-40 w-40 items-center justify-center rounded-full border-4 ${status === "ok" ? "border-success" : "border-primary"}`}>
        {status === "ok" ? <CheckCircle2 className="h-16 w-16 text-success" /> : <Fingerprint className={`h-16 w-16 text-primary ${status === "busy" ? "animate-pulse" : ""}`} />}
      </div>
      {status === "ok" ? (
        <>
          <Msg text="Fingerprint enrolled on this device." />
          <button onClick={onDone} className="mt-3 w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground">Save</button>
        </>
      ) : (
        <>
          {status === "fail" && <Msg bad text={err} />}
          <p className="mt-3 text-sm text-muted-foreground">Place your finger on the device's sensor when asked</p>
          <button disabled={status === "busy"} onClick={enroll} className="mt-3 w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-60">
            {status === "busy" ? "Waiting for sensor…" : "Scan fingerprint"}
          </button>
        </>
      )}
    </div>
  );
}

function Msg({ text, bad }: { text: string; bad?: boolean }) {
  return (
    <p className={`mt-3 flex items-start gap-2 text-sm ${bad ? "text-destructive" : "text-success"}`}>
      {bad ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
      {text}
    </p>
  );
}
