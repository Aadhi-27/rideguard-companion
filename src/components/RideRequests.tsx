import { useEffect, useState } from "react";
import { Check, X, Clock, Send } from "lucide-react";
import { Card } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import type { StoredMember } from "@/lib/family-store";

type Req = { id: string; owner_id: string; member_id: string; requester_id: string; note: string; status: string; created_at: string };

export function RideRequests({ userId, family }: { userId: string; family: StoredMember[] }) {
  const [reqs, setReqs] = useState<Req[]>([]);
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const me = family.find((m) => m.member_user_id === userId && m.owner_id !== userId);

  const load = async () => {
    const { data } = await supabase.from("ride_requests").select("*").order("created_at", { ascending: false }).limit(10);
    setReqs((data as Req[]) ?? []);
  };
  useEffect(() => {
    void load();
    const ch = supabase.channel(`rides-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "ride_requests" }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [userId]);

  const decide = async (id: string, status: "approved" | "denied") => {
    const { error } = await supabase.from("ride_requests").update({ status, decided_at: new Date().toISOString() }).eq("id", id);
    if (error) setErr("Couldn't save your decision."); else void load();
  };
  const ask = async () => {
    if (!me) return;
    const { error } = await supabase.from("ride_requests").insert({ owner_id: me.owner_id, member_id: me.id, requester_id: userId, note: note.trim().slice(0, 200) });
    if (error) setErr("Couldn't send the request."); else { setNote(""); void load(); }
  };
  const nameOf = (id: string) => family.find((m) => m.id === id)?.name ?? "Family member";

  return (
    <div className="space-y-3">
      {me?.minor && (
        <Card>
          <p className="text-sm font-semibold">Ask a parent to ride</p>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Where are you going?" className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
          <button onClick={ask} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2 font-semibold text-primary-foreground"><Send className="h-4 w-4" />Send request</button>
        </Card>
      )}
      {err && <p className="text-sm text-destructive">{err}</p>}
      {reqs.map((r) => (
        <Card key={r.id} className={r.status === "pending" ? "border-warning" : ""}>
          <div className="flex items-center gap-2 text-sm font-semibold"><Clock className="h-4 w-4 text-warning" />Ride request · {nameOf(r.member_id)}</div>
          {r.note && <p className="mt-1 text-sm">{r.note}</p>}
          <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
          {r.status === "pending" && r.owner_id === userId ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button onClick={() => decide(r.id, "approved")} className="flex items-center justify-center gap-1 rounded-xl bg-success py-2 font-semibold text-primary-foreground"><Check className="h-4 w-4" />Approve</button>
              <button onClick={() => decide(r.id, "denied")} className="flex items-center justify-center gap-1 rounded-xl border py-2 font-semibold"><X className="h-4 w-4" />Deny</button>
            </div>
          ) : (
            <p className={`mt-2 text-sm font-semibold ${r.status === "approved" ? "text-success" : r.status === "denied" ? "text-destructive" : "text-warning"}`}>
              {r.status === "approved" ? "Approved" : r.status === "denied" ? "Denied" : "Waiting for parent"}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}
