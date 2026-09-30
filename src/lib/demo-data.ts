export type Member = {
  id: string;
  name: string;
  relation: string;
  age: number;
  licence: string;
  face: boolean;
  finger: boolean;
  minor: boolean;
};

export const initialFamily: Member[] = [
  { id: "1", name: "Dhivya Ranjani", relation: "Owner", age: 38, licence: "TN09 2014 0012345", face: true, finger: true, minor: false },
  { id: "2", name: "Karthik", relation: "Spouse", age: 41, licence: "TN09 2010 0098765", face: true, finger: true, minor: false },
  { id: "3", name: "Arun", relation: "Son", age: 17, licence: "Learner (LLR)", face: true, finger: true, minor: true },
  { id: "4", name: "Meena", relation: "Daughter", age: 15, licence: "None", face: true, finger: false, minor: true },
];

export const vehicle = {
  name: "Activa 6G",
  plate: "TN 09 AB 4521",
  battery: 92,
  fuel: 68,
  odometer: 12480,
  location: "Anna Salai, Teynampet, Chennai",
  lat: 13.0418,
  lng: 80.2341,
};

export type Part = { key: string; label: string; status: "good" | "check" | "alert"; value: string };

export const parts: Part[] = [
  { key: "front-tyre", label: "Front tyre", status: "good", value: "29 psi" },
  { key: "rear-tyre", label: "Rear tyre", status: "check", value: "24 psi, low" },
  { key: "engine", label: "Engine", status: "good", value: "78°C" },
  { key: "brakes", label: "Brakes", status: "good", value: "Pads 72%" },
  { key: "battery", label: "Battery", status: "good", value: "12.6 V" },
  { key: "lights", label: "Lights", status: "alert", value: "Left indicator out" },
  { key: "chain", label: "Belt / drive", status: "good", value: "OK" },
  { key: "body", label: "Body", status: "good", value: "No impacts" },
];
