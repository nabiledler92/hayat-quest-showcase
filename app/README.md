# HAYAT QUEST — Slice 1 demo

The scripted presentation demo client. See the root README for the full picture.

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # type-check + production build into dist/
```

## Where things live
- `src/content.ts`: **all** user-facing journey copy, care examples and the checklist. Every health-adjacent item is `status: 'placeholder'`. Swap in clinician-reviewed content here (with a source title) and set `status: 'reviewed'`.
- `src/state.ts`: in-memory journey state and reducer. Nothing is persisted.
- `src/screens/onboarding.tsx`: storyboard screens 1–7.
- `src/screens/SceneScreen.tsx`: screen 8, the hub.
- `src/screens/mission.tsx`: screens 9–15.
- `src/scene/`: isometric canvas renderer (`iso.ts`, `IsoScene.tsx`), joystick and avatars. All art is drawn in code.

## Guardrails built in
- No network calls, analytics or browser storage. Reload or Exit clears the session.
- The "Reviewed information" label only renders for `status: 'reviewed'` content.
- Free-text questions get a boundary message; there is no live AI.
- Care listings are fictional and labelled as such; there is no booking and there are no outbound links.
