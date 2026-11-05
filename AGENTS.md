<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Decisions
- Live voice assistant runs through a persistent `/api/live` relay (src/lib/live-relay.server.ts, dispatched in src/server.ts and live-vite-plugin.ts in dev) — the Gateway voice session dies if the socket closes.
- Rider name from face recognition is passed to the voice session via `?rider=` and sanitized server-side — the voice model can't take images.
- 3D avatar (three/@react-three/fiber) is lazy-loaded client-only — three can't run during SSR.
- Pure ride-safety rules (parked-only gesture gating and safe-ride streaks) live in src/game/sim/safety.ts and stay independent of React/Three.js so they can be tested.
