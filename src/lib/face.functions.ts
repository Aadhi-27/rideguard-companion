import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const img = z.string().startsWith("data:image/").max(400_000);

export const verifyFace = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      probe: img,
      candidates: z.array(z.object({ id: z.string(), name: z.string(), photo: img })).min(1).max(10),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false as const, error: "Face check is not set up." };

    const content: unknown[] = [
      {
        type: "input_text",
        text:
          "You verify riders for a scooter. The FIRST image is a live camera capture. The following images are enrolled family members, each preceded by its ID. " +
          "Decide if the live face is clearly the same person as one enrolled member. Be strict: if no face is visible, the image is a photo of a screen, or you are unsure, answer no match. " +
          'Reply with only JSON: {"match_id": "<id or null>", "reason": "<short reason>"}',
      },
      { type: "input_image", image_url: data.probe },
    ];
    for (const c of data.candidates) {
      content.push({ type: "input_text", text: `ID: ${c.id}` });
      content.push({ type: "input_image", image_url: c.photo });
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "openai/gpt-6-astra", input: [{ role: "user", content }] }),
    });
    if (!res.ok) {
      const msg =
        res.status === 429 ? "Too many checks right now. Wait a moment and try again." :
        res.status === 402 ? "AI credits have run out. Add credits to keep using face unlock." :
        res.status === 403 ? "Face check is not allowed for this workspace right now." :
        "Face check failed. Try again.";
      console.error("verifyFace", res.status, await res.text());
      return { ok: false as const, error: msg };
    }
    const json = (await res.json()) as { output_text?: string; output?: { content?: { type: string; text?: string }[] }[] };
    const text =
      json.output_text ??
      (json.output ?? []).flatMap((o) => o.content ?? []).filter((c) => c.type === "output_text").map((c) => c.text).join("");
    const m = text?.match(/\{[\s\S]*\}/);
    if (!m) return { ok: false as const, error: "Couldn't read the face check result." };
    try {
      const parsed = JSON.parse(m[0]) as { match_id: string | null; reason?: string };
      const hit = data.candidates.find((c) => c.id === parsed.match_id);
      return { ok: true as const, matchId: hit?.id ?? null, reason: parsed.reason ?? "" };
    } catch {
      return { ok: false as const, error: "Couldn't read the face check result." };
    }
  });
