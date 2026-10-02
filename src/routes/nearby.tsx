import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Radar, ShieldCheck, User as UserIcon, LogOut } from "lucide-react";
import { AppShell, Card } from "@/components/AppShell";
import { loadMaps } from "@/components/LiveMap";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { vehicle } from "@/lib/demo-data";

export const Route = createFileRoute("/nearby")({
  head: () => ({
    meta: [
      { title: "Nearby vehicles | RideGuard" },
      { name: "description", content: "Find RideGuard vehicles and riders sharing their live location near you." },
      { property: "og:title", content: "Nearby vehicles | RideGuard" },
      { property: "og:description", content: "See nearby RideGuard bikes and riders who share their real location." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Nearby,
});

type Row = { user_id: string; display_name: string; vehicle: string; has_rideguard: boolean; lat: number; lng: number; updated_at: string };

function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const r = (x: number) => (x * Math.PI) / 180;
  const d = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(d));
}

function Nearby() {
  const { user, loading } = useAuth();
  const [sharing, setSharing] = useState(false);
  const [hasRG, setHasRG] = useState(true);
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const mapEl = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markers = useRef<any[]>([]);

  // Watch real location while sharing
  useEffect(() => {
    if (!sharing || !user) return;
    if (!navigator.geolocation) { setErr("This device can't share location."); return; }
    let last = 0;
    const id = navigator.geolocation.watchPosition(
      async (p) => {
        const pos = { lat: p.coords.latitude, lng: p.coords.longitude };
        setMe(pos);
        if (Date.now() - last < 10000) return;
        last = Date.now();
        const { error } = await supabase.from("rider_locations").upsert({
          user_id: user.id, display_name: user.user_metadata?.["full_name"] ?? user.email?.split("@")[0] ?? "Rider",
          vehicle: hasRG ? vehicle.name : "Phone only", has_rideguard: hasRG, ...pos, sharing: true, updated_at: new Date().toISOString(),
        });
        if (error) setErr("Couldn't share your location. Try again.");
      },
      () => setErr("Location permission was blocked. Allow it in your browser to share."),
      { enableHighAccuracy: true },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [sharing, user, hasRG]);

  // Load + live-update others
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("rider_locations").select("*").neq("user_id", user.id);
      setRows((data ?? []) as Row[]);
    };
    load();
    const ch = supabase.channel("riders").on("postgres_changes", { event: "*", schema: "public", table: "rider_locations" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  // Map
  useEffect(() => {
    if (!me || !user) return;
    loadMaps().then(() => {
      const g = window.google.maps;
      if (!map.current && mapEl.current) map.current = new g.Map(mapEl.current, { center: me, zoom: 14, disableDefaultUI: true, zoomControl: true, clickableIcons: false });
      markers.current.forEach((m) => m.setMap(null));
      markers.current = [
        new g.Marker({ map: map.current, position: me, title: "You", label: "You" }),
        ...rows.map((r) => new g.Marker({ map: map.current, position: { lat: r.lat, lng: r.lng }, title: r.display_name, label: r.has_rideguard ? "RG" : "P" })),
      ];
    }).catch(() => setErr("Map couldn't load."));
  }, [me, rows, user]);

  const stop = async () => {
    setSharing(false);
    if (user) await supabase.from("rider_locations").delete().eq("user_id", user.id);
  };

  if (loading) return <AppShell title="Nearby vehicles"><p className="text-sm text-muted-foreground">Loading…</p></AppShell>;
  if (!user) return (
    <AppShell title="Nearby vehicles">
      <Card>
        <Radar className="h-8 w-8 text-primary" />
        <p className="mt-2 font-semibold">Sign in to see nearby riders</p>
        <p className="mt-1 text-sm text-muted-foreground">Only riders who sign in and agree to share their location appear here.</p>
        <Link to="/auth" className="mt-3 block rounded-xl bg-primary py-3 text-center font-semibold text-primary-foreground">Sign in</Link>
      </Card>
    </AppShell>
  );

  const sorted = me ? [...rows].sort((a, b) => km(me, a) - km(me, b)) : rows;

  return (
    <AppShell title="Nearby vehicles">
      <Card>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={hasRG} onChange={(e) => setHasRG(e.target.checked)} /> I'm riding a RideGuard vehicle
        </label>
        {sharing ? (
          <button onClick={stop} className="mt-3 w-full rounded-xl border py-3 font-semibold">Stop sharing my location</button>
        ) : (
          <button onClick={() => { setErr(null); setSharing(true); }} className="mt-3 w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground">
            Share my live location
          </button>
        )}
        <p className="mt-2 text-xs text-muted-foreground">You must share to see the map. Others see you only while sharing; stopping removes you.</p>
        {err && <p className="mt-2 text-sm text-destructive">{err}</p>}
      </Card>

      {me && <Card className="mt-4 overflow-hidden p-0"><div ref={mapEl} className="h-80 w-full bg-muted" /></Card>}

      <Card className="mt-4">
        <p className="mb-2 text-sm font-semibold">{rows.length} rider{rows.length === 1 ? "" : "s"} sharing</p>
        {sorted.length === 0 && <p className="text-sm text-muted-foreground">No one nearby is sharing right now.</p>}
        {sorted.map((r) => (
          <div key={r.user_id} className="flex items-center gap-3 border-t py-2 text-sm first:border-0">
            {r.has_rideguard ? <ShieldCheck className="h-5 w-5 text-success" /> : <UserIcon className="h-5 w-5 text-accent" />}
            <div className="flex-1">
              <p className="font-semibold">{r.display_name}</p>
              <p className="text-xs text-muted-foreground">{r.has_rideguard ? r.vehicle : "Phone location"}</p>
            </div>
            {me && <span className="text-xs">{km(me, r).toFixed(1)} km</span>}
          </div>
        ))}
      </Card>
      <button onClick={() => supabase.auth.signOut()} className="mt-4 flex w-full items-center justify-center gap-2 text-sm text-muted-foreground"><LogOut className="h-4 w-4" />Sign out</button>
    </AppShell>
  );
}
