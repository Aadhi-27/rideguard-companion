export type Pos = { lat: number; lng: number; acc?: number };

export function getPosition(timeout = 8000): Promise<Pos | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout, maximumAge: 10000 },
    );
  });
}

export const mapsLink = (p: Pos) => `https://maps.google.com/?q=${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;

export function sosMessage(name: string, p: Pos | null) {
  return `SOS from ${name} (RideGuard): I need help. ${p ? `My location: ${mapsLink(p)}` : "Location unavailable."}`;
}

/** Opens the SMS app with the message pre-filled for all numbers. */
export function smsLink(phones: string[], body: string) {
  const sep = /iPhone|iPad|Mac/.test(navigator.userAgent) ? "&" : "?";
  return `sms:${phones.join(",")}${sep}body=${encodeURIComponent(body)}`;
}

export const whatsappLink = (phone: string, body: string) =>
  `https://wa.me/${phone.replace(/\D/g, "").replace(/^(?!91)(\d{10})$/, "91$1")}?text=${encodeURIComponent(body)}`;

export const SOS_AUTO_KEY = "rg-sos-auto";
