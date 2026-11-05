export const MAX_GESTURE_SPEED_KMH = 3;

export function gesturesAllowed(speedKmh: number | null | undefined): boolean {
  return typeof speedKmh === "number" && Number.isFinite(speedKmh) && speedKmh <= MAX_GESTURE_SPEED_KMH;
}

export function nextSafeRideStreak(previous: number, completed: boolean): number {
  if (!completed) return 0;
  return Math.max(0, Math.floor(previous)) + 1;
}

export function isNearPoint(a: { lat: number; lng: number }, b: { lat: number; lng: number }, radiusKm: number): boolean {
  const rad = (n: number) => (n * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h)) <= radiusKm;
}
