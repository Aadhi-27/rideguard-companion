import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { AppShell, Card } from "@/components/AppShell";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in | RideGuard" },
      { name: "description", content: "Sign in to RideGuard to share your location and see nearby riders." },
      { property: "og:title", content: "Sign in | RideGuard" },
      { property: "og:description", content: "Sign in to RideGuard to see nearby riders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    if (mode === "up") {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/nearby` } });
      setMsg(error ? error.message : "Check your email to confirm your account, then sign in.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message); else nav({ to: "/nearby" });
    }
    setBusy(false);
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) { setMsg("Google sign-in failed. Try again."); return; }
    if (r.redirected) return;
    nav({ to: "/nearby" });
  };

  return (
    <AppShell title={mode === "in" ? "Sign in" : "Create account"}>
      <Card>
        <button onClick={google} className="w-full rounded-xl border py-3 font-semibold">Continue with Google</button>
        <p className="my-3 text-center text-xs text-muted-foreground">or</p>
        <form onSubmit={submit} className="space-y-3">
          <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border bg-background px-3 py-3" />
          <input type="password" required minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border bg-background px-3 py-3" />
          <button disabled={busy} className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-60">
            {mode === "in" ? "Sign in" : "Create account"}
          </button>
        </form>
        {msg && <p className="mt-3 text-sm">{msg}</p>}
        <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-3 w-full text-sm text-primary">
          {mode === "in" ? "New here? Create an account" : "Have an account? Sign in"}
        </button>
      </Card>
    </AppShell>
  );
}
