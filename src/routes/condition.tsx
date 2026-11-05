import { createFileRoute } from "@tanstack/react-router";
import { ScooterParticleScene } from "@/components/ScooterParticleScene";

export const Route = createFileRoute("/condition")({
  head: () => ({
    meta: [
      { title: "Gesture 3D scooter twin | RideGuard" },
      { name: "description", content: "Explore a glowing 3D scooter twin and use safe, parked-only hand gestures." },
      { property: "og:title", content: "Gesture 3D scooter twin | RideGuard" },
      { property: "og:description", content: "A hand-controlled 3D scooter view with parked-only safety controls." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ScooterParticleScene,
});