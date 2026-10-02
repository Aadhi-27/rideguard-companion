import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Home, MapPin, Box, Camera, Users, Siren, Moon, Sun } from "lucide-react";

const nav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/tracking", label: "Track", icon: MapPin },
  { to: "/condition", label: "3D", icon: Box },
  { to: "/cameras", label: "360°", icon: Camera },
  { to: "/family", label: "Family", icon: Users },
  { to: "/nearby", label: "Nearby", icon: Radar },
] as const;

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(localStorage.getItem("theme") === "dark");
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background pb-24">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/90 px-5 py-4 backdrop-blur">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">RideGuard</p>
          <h1 className="text-xl font-bold">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label="Toggle theme"
            onClick={() => {
              const next = !dark;
              setDark(next);
              localStorage.setItem("theme", next ? "dark" : "light");
            }}
            className="rounded-full border p-2 text-muted-foreground hover:text-foreground"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link
            to="/sos"
            className="flex items-center gap-1 rounded-full bg-destructive px-3 py-2 text-xs font-bold text-destructive-foreground"
          >
            <Siren className="h-4 w-4" /> SOS
          </Link>
        </div>
      </header>
      <main className="flex-1 px-5 py-5">{children}</main>
      <nav className="fixed bottom-0 left-1/2 z-20 grid w-full max-w-md -translate-x-1/2 grid-cols-5 border-t bg-card">
        {nav.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: true }}
            className="flex flex-col items-center gap-1 py-3 text-xs text-muted-foreground"
            activeProps={{ className: "text-primary font-semibold" }}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border bg-card p-4 shadow-sm ${className}`}>{children}</div>;
}
