export type TheftEvent = { id: string; time: string; lat: number | null; lng: number | null; message: string };
const KEY = "rideguard-theft-events";

export function readTheftEvents(): TheftEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(value) ? value as TheftEvent[] : [];
  } catch {
    return [];
  }
}

export function saveTheftEvent(position: { lat: number; lng: number } | null): TheftEvent {
  const event: TheftEvent = {
    id: `${Date.now()}-${Math.round((position?.lat ?? 0) * 100000)}`,
    time: new Date().toISOString(),
    lat: position?.lat ?? null,
    lng: position?.lng ?? null,
    message: "Vehicle moved",
  };
  const events = [event, ...readTheftEvents()].slice(0, 20);
  localStorage.setItem(KEY, JSON.stringify(events));
  window.dispatchEvent(new CustomEvent("rideguard:theft-events", { detail: events }));
  return event;
}

export function playTheftAlarm(): () => void {
  const AudioContextClass = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return () => {};
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "square";
  oscillator.frequency.value = 880;
  gain.gain.value = 0.18;
  oscillator.connect(gain);
  gain.connect(context.destination);
  const timer = window.setInterval(() => {
    oscillator.frequency.setTargetAtTime(oscillator.frequency.value === 880 ? 620 : 880, context.currentTime, 0.03);
  }, 220);
  oscillator.start();
  const stop = () => {
    window.clearInterval(timer);
    try { oscillator.stop(); } catch { /* already stopped */ }
    void context.close();
  };
  window.setTimeout(stop, 4500);
  return stop;
}