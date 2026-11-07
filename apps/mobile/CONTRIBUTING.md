# apps/mobile — Next Journey (Expo app)

Monorepo rules live in `../../CONTRIBUTING.md` (read it first). Only the app-specific rules are kept here.

- Package: `@nextjourney/mobile`. Routes live in `src/app/` (Expo SDK 58 standard). Code that is not a route stays outside it (`src/components`, `src/api`, `src/theme`...).
- Commands: `pnpm --filter @nextjourney/mobile start | lint | typecheck`. Native dependencies only with `npx expo install`.
- Tokens only in SecureStore; nothing sensitive in `EXPO_PUBLIC_*`; texts only through i18n; colors and sizes only through the design system tokens.
- The app does not compute EXP: it checks the item right away (optimistic) and shows the API's `CheckResult`. The banner only receives messages validated by the contract.
- **New achievement alert: a single modal.** Every unlocked achievement opens `AchievementUnlockedModal` (`src/components/achievement-unlocked-modal.tsx`), never a modal of its own. Style: top in the achievement **class** color (bronze, silver, gold or diamond; tokens in `colors.tier`) with rays and sparkles, the badge in a white circle at the center, "Conquista desbloqueada!", the achievement name and criterion, an encouragement to unlock more and two buttons: **Continuar** (closes) and **Ver todas as conquistas** (opens `/achievements`). `ProgressionModalHost` does the queueing (queue in `features/feedback`): the achievements from the check result and the **pending** ones from `GET /achievements` (`pending`) enter without repeating; on close, the app confirms with `POST /achievements/ack`, and **Ver todas** confirms and closes all the queued ones. The class (`tier` 1 to 4, color in `features/achievements/tier.ts`) and the badge (`glyph`, `Insignia` component, art from `@nextjourney/insignias`) come from the server. Texts in `feedback.*` in `pt-BR.json`. To see the modal on the emulator, enqueue an entry `{ kind: 'achievement', ... }` in `useFeedbackStore` (without committing it).
- **UI tests (Maestro):** `pnpm --filter @nextjourney/mobile test:ui` (flows in `.maestro/`, how to run in `docs/TESTES.md`). Changed a text, label or screen flow? Update the flows together. A notice that disappears in seconds is not checked on screen: check the state on the API (`.maestro/scripts/`).
- Metro with `CI=1` does not reread files: for Fast Refresh to work, start Metro without that variable.
- Lint: `eslint-config-expo` + the monorepo common rules (`@nextjourney/eslint-config/common`).

---

This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
