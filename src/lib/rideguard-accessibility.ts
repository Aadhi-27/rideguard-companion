export type RideGuardLanguage = "en" | "ta";

export const rideGuardPhrases = {
  helmet: { en: "Did you wear your helmet?", ta: "Helmet pottirukkeengala?" },
  helmetWarning: { en: "Please wear your helmet before riding.", ta: "Helmet anindhu vandi ottavum." },
  safeRide: { en: "Ride check complete. Ride safely.", ta: "Sodhanai mudindhadhu. Paththiramaaga sellungal." },
  pothole: { en: "Pothole ahead, ride carefully.", ta: "Munnaadi pallam irukku, paathu po." },
  reportSaved: { en: "Hazard report saved.", ta: "Aabaththu thagaval semikkappattadhu." },
  vehicleMoved: { en: "Vehicle moved. Check your bike.", ta: "Vandi nagarndhadhu. Saripaarungal." },
  alarmOn: { en: "Anti-theft mode on.", ta: "Thiruttu thaduppu iyakkaththil ulladhu." },
  lock: { en: "Vehicle locked.", ta: "Vandi pootappattadhu." },
  unlock: { en: "Vehicle unlocked.", ta: "Vandi thirakkappattadhu." },
  sos: { en: "Opening emergency help.", ta: "Avasara udhavi thirakkappadugiradhu." },
} satisfies Record<string, Record<RideGuardLanguage, string>>;

export function speakRideGuard(key: keyof typeof rideGuardPhrases, language: RideGuardLanguage) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(rideGuardPhrases[key][language]);
  utterance.lang = language === "ta" ? "ta-IN" : "en-IN";
  utterance.rate = 0.92;
  window.speechSynthesis.speak(utterance);
}
