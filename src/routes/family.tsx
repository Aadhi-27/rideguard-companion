import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ScanFace, Fingerprint, Plus, Check, X, Clock } from "lucide-react";
import { AppShell, Card } from "@/components/AppShell";
import { initialFamily, type Member } from "@/lib/demo-data";

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

function Family() {
  const [family, setFamily] = useState<Member[]>(initialFamily);
  const [request, setRequest] = useState<"pending" | "approved" | "denied">("pending");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", relation: "", age: "" });

  const enroll = (id: string, key: "face" | "finger") =>
    setFamily((f) => f.map((m) => (m.id === id ? { ...m, [key]: true } : m)));

  return (
    <AppShell title="Family">
      <Card className="border-warning">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Clock className="h-4 w-4 text-warning" /> Ride request
        </div>
        <p className="mt-1 text-sm">Meena (15) wants to ride the {"Activa"} to tuition, about 3 km.</p>
        {request === "pending" ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={() => setRequest("approved")} className="flex items-center justify-center gap-1 rounded-xl bg-success py-2 font-semibold text-primary-foreground"><Check className="h-4 w-4" />Approve</button>
            <button onClick={() => setRequest("denied")} className="flex items-center justify-center gap-1 rounded-xl border py-2 font-semibold"><X className="h-4 w-4" />Deny</button>
          </div>
        ) : (
          <p className={`mt-2 text-sm font-semibold ${request === "approved" ? "text-success" : "text-destructive"}`}>
            {request === "approved" ? "Approved for 1 hour, max speed 30 km/h" : "Denied, vehicle stays locked"}
          </p>
        )}
      </Card>

      <div className="mt-5 flex items-center justify-between">
        <h2 className="font-semibold">Registered riders</h2>
        <button onClick={() => setAdding(!adding)} className="flex items-center gap-1 text-sm font-semibold text-primary"><Plus className="h-4 w-4" />Add</button>
      </div>

      {adding && (
        <Card className="mt-3 space-y-2">
          {(["name", "relation", "age"] as const).map((k) => (
            <input key={k} placeholder={k.charAt(0).toUpperCase() + k.slice(1)} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
          ))}
          <button
            onClick={() => {
              if (!form.name) return;
              const age = Number(form.age) || 18;
              setFamily([...family, { id: String(Date.now()), name: form.name, relation: form.relation || "Family", age, licence: "Not added", face: false, finger: false, minor: age < 18 }]);
              setForm({ name: "", relation: "", age: "" });
              setAdding(false);
            }}
            className="w-full rounded-xl bg-primary py-2 font-semibold text-primary-foreground"
          >
            Save member
          </button>
        </Card>
      )}

      <div className="mt-3 space-y-3">
        {family.map((m) => (
          <Card key={m.id}>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary font-display font-bold">{m.name[0]}</div>
              <div className="flex-1">
                <p className="font-semibold">{m.name} {m.minor && <span className="ml-1 rounded-full bg-warning/20 px-2 py-0.5 text-xs text-foreground">Minor</span>}</p>
                <p className="text-xs text-muted-foreground">{m.relation} · {m.age} yrs · {m.licence}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              {(["face", "finger"] as const).map((k) => (
                <button key={k} onClick={() => enroll(m.id, k)} className={`flex items-center justify-center gap-1 rounded-lg border py-2 ${m[k] ? "text-success" : "text-muted-foreground"}`}>
                  {k === "face" ? <ScanFace className="h-4 w-4" /> : <Fingerprint className="h-4 w-4" />}
                  {m[k] ? "Enrolled" : `Enroll ${k === "face" ? "face" : "fingerprint"}`}
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
