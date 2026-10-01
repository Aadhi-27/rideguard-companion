import { useEffect, useState } from "react";
import { initialFamily, type Member } from "./demo-data";

const KEY = "rideguard-family";
export type StoredMember = Member & { photo?: string };

function read(): StoredMember[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  // Demo members have no real photo, so their face must be re-enrolled
  return initialFamily.map((m) => ({ ...m, face: false }));
}

export function useFamily() {
  const [family, setFamily] = useState<StoredMember[]>(() => initialFamily.map((m) => ({ ...m, face: false })));
  const [ready, setReady] = useState(false);
  useEffect(() => { setFamily(read()); setReady(true); }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(family)); } catch {}
  }, [family, ready]);
  return [family, setFamily] as const;
}

export function readFamily() {
  return read();
}
