import { useEffect, useState } from "react";
import { Check, Lightbulb, ShieldCheck, Speaker, TriangleAlert, Wind, CircleGauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRideGuardLanguage } from "@/hooks/use-rideguard-language";
import { nextSafeRideStreak } from "@/game/sim/safety";

type Props = { rider: string; onStart: () => void; onCancel: () => void };
const checks = [
  { key: "mirrors", icon: Wind, en: "Mirrors", ta: "Kannadigal" },
  { key: "tyres", icon: CircleGauge, en: "Tyres", ta: "Tayargal" },
  { key: "lights", icon: Lightbulb, en: "Lights", ta: "Vilakkugal" },
] as const;

export function HelmetSafetyCheck({ rider, onStart, onCancel }: Props) {
  const { language, speak } = useRideGuardLanguage();
  const [helmet, setHelmet] = useState<boolean | null>(null);
  const [checked, setChecked] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const allReady = helmet === true && checked.length === checks.length;
  useEffect(() => {
    const stored = Number(localStorage.getItem("rideguard-safe-streak") ?? 0);
    setStreak(Number.isFinite(stored) ? stored : 0);
    speak("helmet");
  }, [speak]);
  const toggle = (key: string) => setChecked((items) => items.includes(key) ? items.filter((item) => item !== key) : [...items, key]);
  const startRide = () => {
    if (!allReady) return;
    const next = nextSafeRideStreak(streak, true);
    localStorage.setItem("rideguard-safe-streak", String(next));
    setStreak(next);
    speak("safeRide");
    onStart();
  };
  const text = (en: string, ta: string) => language === "ta" ? ta : en;
  return <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-background/95 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={text("Helmet safety check", "Helmet paadhukaappu sodhanai")}>
    <div className="w-full max-w-sm space-y-4 py-5 text-center">
      <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full border-4 border-warning bg-warning/10 text-warning"><ShieldCheck className="h-20 w-20" /></div>
      <h2 className="text-2xl font-bold">{text("Helmet on?", "Helmet pottirukkeengala?")}</h2>
      <p className="text-sm text-muted-foreground">{rider}</p>
      <div className="grid grid-cols-2 gap-3">
        <Button aria-pressed={helmet === true} className={`h-16 text-lg ${helmet === true ? "bg-success text-primary-foreground" : ""}`} onClick={() => { setHelmet(true); speak("helmet"); }}><Check className="h-6 w-6" />{text("Yes", "Aam")}</Button>
        <Button variant="destructive" className="h-16 text-lg" aria-pressed={helmet === false} onClick={() => { setHelmet(false); speak("helmetWarning"); }}><TriangleAlert className="h-6 w-6" />{text("No", "Illai")}</Button>
      </div>
      {helmet === false && <p role="alert" className="rounded-md bg-destructive/10 p-3 font-semibold text-destructive">{text("Wear your helmet first.", "Mudhalil helmet aniyavum.")}</p>}
      <div className="grid grid-cols-3 gap-2">
        {checks.map(({ key, icon: Icon, en, ta }) => {
          const active = checked.includes(key);
          return <Button key={key} variant="outline" aria-pressed={active} aria-label={text(en, ta)} className={`h-20 flex-col gap-1 ${active ? "border-success bg-success/10 text-success" : ""}`} onClick={() => toggle(key)}><Icon className="h-7 w-7" />{active && <Check className="h-4 w-4" />}</Button>;
        })}
      </div>
      <p className="text-sm font-semibold">{text("Safe rides", "Paadhukaappana payanangal")}: {streak}</p>
      <Button disabled={!allReady} className="h-16 w-full text-lg" onClick={startRide}>{text("Start ride", "Payanam thodangu")}</Button>
      <Button variant="ghost" className="h-12 w-full" onClick={onCancel}>{text("Cancel", "Raththu sei")}</Button>
      <span className="sr-only"><Speaker /></span>
    </div>
  </div>;
}
