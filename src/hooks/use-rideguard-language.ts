import { useCallback, useEffect, useState } from "react";
import { speakRideGuard, type RideGuardLanguage } from "@/lib/rideguard-accessibility";

const LANGUAGE_KEY = "rideguard-language";

export function useRideGuardLanguage() {
  const [language, setLanguage] = useState<RideGuardLanguage>("en");

  useEffect(() => {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    if (stored === "en" || stored === "ta") setLanguage(stored);
    const onLanguage = (event: Event) => {
      const next = (event as CustomEvent<RideGuardLanguage>).detail;
      if (next === "en" || next === "ta") setLanguage(next);
    };
    window.addEventListener("rideguard:language", onLanguage);
    return () => window.removeEventListener("rideguard:language", onLanguage);
  }, []);

  const changeLanguage = useCallback((next: RideGuardLanguage) => {
    localStorage.setItem(LANGUAGE_KEY, next);
    setLanguage(next);
    window.dispatchEvent(new CustomEvent("rideguard:language", { detail: next }));
  }, []);
  const speak = useCallback((key: Parameters<typeof speakRideGuard>[0]) => speakRideGuard(key, language), [language]);

  return { language, changeLanguage, speak };
}