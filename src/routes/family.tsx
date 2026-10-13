import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ScanFace, Fingerprint, Plus, Trash2 } from "lucide-react";
import { AppShell, Card } from "@/components/AppShell";
import { useFamily } from "@/lib/family-store";
import { BiometricPortal } from "@/components/BiometricPortal";
import { RideRequests } from "@/components/RideRequests";

export const Route = createFileRoute("/family")({
  head: () => ({
    meta: [
      { title: "Family riders | RideGuard" },
      { name: "description", content: "Register family members' face and fingerprint and approve rides for minors." },
      { property: "og:title", content: "Family riders | RideGuard" },
      { property: "og:description", content: "Manage who can ride, with parent approval for minors." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Family,
});

const empty = { name: "", relation: "", age: "", email: "", phone: "" };

function Family() {
  const { user, loading, family, error, add, update, remove } = useFamily();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(empty);
  const [portal, setPortal] = useState<{ id: string; name: string; kind: "face" | "finger" } | null>(null);

  if (loading) return <AppShell title="Family"><p className="text-sm text-muted-foreground">Loading…</p></AppShell>;
  if (!user)
    return (
      <AppShell title="Family">
        <Card className="text-center">
          <p className="font-semibold">Sign in to manage your family</p>
          <p className="mt-1 text-sm text-muted-foreground">Faces, fingerprints and ride approvals are saved to your account and work on every phone.</p>
          <Link to="/auth" className="mt-3 block rounded-xl bg-primary py-3 font-semibold text-primary-foreground">Sign in</Link>
        </Card>
      </AppShell>
    );

  const mine = family.filter((m) => m.owner_id === user.id);

  return (
    <AppShell title="Family">
      <RideRequests userId={user.id} family={family} />
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <div className="mt-5 flex items-center justify-between">
        <h2 className="font-semibold">Registered riders</h2>
        <button onClick={() => setAdding(!adding)} className="flex items-center gap-1 text-sm font-semibold text-primary"><Plus className="h-4 w-4" />Add</button>
      </div>

      {adding && (
        <Card className="mt-3 space-y-2">
          {([["name", "Name"], ["relation", "Relation (e.g. Son)"], ["age", "Age"], ["phone", "Phone (for SOS)"], ["email", "Email (lets them sign in and request rides)"]] as const).map(([k, ph]) => (
            <input key={k} placeholder={ph} type={k === "age" ? "number" : k === "email" ? "email" : k === "phone" ? "tel" : "text"} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
          ))}
          <button
            onClick={async () => {
              if (!form.name.trim()) return;
              await add({ name: form.name.trim(), relation: form.relation.trim() || "Family", age: Number(form.age) || 18, email: form.email.trim(), phone: form.phone.trim() });
              setForm(empty); setAdding(false);
            }}
            className="w-full rounded-xl bg-primary py-2 font-semibold text-primary-foreground"
          >
            Save member
          </button>
        </Card>
      )}

      {mine.length === 0 && !adding && <p className="mt-3 text-sm text-muted-foreground">No family members yet. Tap Add — start with yourself so your face can unlock the bike.</p>}

      <div className="mt-3 space-y-3">
        {mine.map((m) => (
          <Card key={m.id}>
            <div className="flex items-center gap-3">
              {m.photo ? <img src={m.photo} alt="" className="h-11 w-11 rounded-full object-cover" /> : <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary font-display font-bold">{m.name[0]}</div>}
              <div className="flex-1">
                <p className="font-semibold">{m.name} {m.minor && <span className="ml-1 rounded-full bg-warning/20 px-2 py-0.5 text-xs text-foreground">Minor</span>}</p>
                <p className="text-xs text-muted-foreground">{m.relation} · {m.age} yrs{m.phone ? ` · ${m.phone}` : ""}{m.email ? (m.member_user_id ? " · linked" : " · invite pending") : ""}</p>
              </div>
              <button aria-label={`Remove ${m.name}`} onClick={() => confirm(`Remove ${m.name}?`) && remove(m.id)} className="p-1 text-muted-foreground"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              {(["face", "finger"] as const).map((k) => (
                <button key={k} onClick={() => setPortal({ id: m.id, name: m.name, kind: k })} className={`flex items-center justify-center gap-1 rounded-lg border py-2 ${m[k] ? "text-success" : "text-muted-foreground"}`}>
                  {k === "face" ? <ScanFace className="h-4 w-4" /> : <Fingerprint className="h-4 w-4" />}
                  {m[k] ? "Enrolled" : `Enroll ${k === "face" ? "face" : "fingerprint"}`}
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>
      {portal && (
        <BiometricPortal
          kind={portal.kind}
          name={portal.name}
          onClose={() => setPortal(null)}
          onDone={(photo) => { void update(portal.id, portal.kind === "face" ? { face: true, ...(photo ? { photo } : {}) } : { finger: true }); setPortal(null); }}
        />
      )}
    </AppShell>
  );
}
