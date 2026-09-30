import { useEffect, useRef, useState } from "react";

declare global {
  interface Window { __rgInitMap?: () => void; google?: any }
}

let loader: Promise<void> | null = null;
function loadMaps() {
  if (window.google?.maps?.Map) return Promise.resolve();
  if (loader) return loader;
  loader = new Promise((resolve, reject) => {
    window.__rgInitMap = () => resolve();
    const key = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"];
    const ch = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"];
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__rgInitMap&channel=${ch}`;
    s.async = true;
    s.onerror = () => reject(new Error("Map failed to load"));
    document.head.appendChild(s);
  });
  return loader;
}

export function LiveMap({ path, index, stopped }: { path: { lat: number; lng: number }[]; index: number; stopped: boolean }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const marker = useRef<any>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    loadMaps()
      .then(() => {
        if (!el.current || map.current) return;
        const g = window.google.maps;
        map.current = new g.Map(el.current, { center: path[0], zoom: 15, clickableIcons: false, disableDefaultUI: true, zoomControl: true });
        new g.Polyline({ map: map.current, path, strokeColor: "#f97316", strokeWeight: 4 });
        marker.current = new g.Marker({ map: map.current, position: path[0], title: "Your vehicle" });
      })
      .catch(() => setErr(true));
  }, [path]);

  useEffect(() => {
    const p = path[index];
    if (marker.current && p) { marker.current.setPosition(p); map.current?.panTo(p); }
  }, [index, path]);

  if (err) return <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">Map couldn't load.</div>;
  return (
    <div className="relative">
      <div ref={el} className="h-80 w-full bg-muted" />
      {stopped && <div className="absolute left-3 top-3 rounded-full bg-destructive px-3 py-1 text-xs font-bold text-destructive-foreground">ENGINE SHUT DOWN</div>}
    </div>
  );
}
