# Tests: how Next Journey protects itself from regressions

The app is native (React Native). Each test layer covers a kind of error, and they all run from the cheapest to the most expensive.

| Layer                       | Tool                          | What it protects                                                                                                                       | Where it runs                                         |
| --------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 1. Game rules (pure)        | Vitest                        | EXP, coins, undo, the criterion of each achievement, streaks                                                                           | local and CI (`pnpm run test`)                        |
| 2. App components           | Jest + Testing Library        | buttons, empty states, the achievement modal, the notice queue                                                                         | local and CI                                          |
| 3. Catalog contract         | Vitest                        | the number in each achievement text is the one in the rule; the lab says the same                                                      | local and CI                                          |
| 4. API end to end           | Vitest + Supertest + Postgres | real business rules in the database: check, undo, EXP only once, one modal per action, history, isolation between users                | local and CI (`pnpm --filter @nextjourney/api test:e2e`) |
| 5. App interface            | **Maestro**                   | the real app on an emulator: sign in, onboarding, create, check, gallery, history                                                      | local (`pnpm --filter @nextjourney/mobile test:ui`)   |

## Retroactive regression

A new game rule comes with a new test **and** the old tests keep running. Layer 4 recreates the usage scenario (new user, days passing through the fake clock) on every run, so any change that breaks an old rule fails at once. Layer 5 repeats the user journey to catch what the others do not see: a covered button, cut-off text, a double modal.

## Why Maestro and not Playwright

Playwright automates **browsers**. Next Journey is a native app with a WebView; in the browser it is not the same app (no SecureStore, no gestures, no WebView, no native canvas banner). Maestro runs on the Android emulator and the iOS simulator, with the real app, and the flows are short YAML files that go into Git. The heavy alternatives (Detox, Appium) need a dedicated test build and much more code. Playwright is still useful for one thing: the lab page (web), if we ever want a visual capture of it.

## Running the interface (Maestro)

Prerequisites, once:

- Java 17 or later (`java -version`).
- Maestro (`~/.maestro/bin/maestro --version`). Official installation: <https://docs.maestro.dev/getting-started/installing-maestro/macos>. The Homebrew package called just `maestro` is a different product; the right one is `mobile-dev-inc/tap/maestro`.
- An Android emulator **or iOS simulator** open with the development app installed, Metro running and the API up (`PORT=3010 HOST=0.0.0.0`). The flows pass on iOS (6 of 6 on the iPhone 16 Pro simulator); the first five also passed on the 720x1280 Small_Phone Android emulator.
- Android emulator: it can run without a window (`emulator -avd Small_Phone -no-window -no-snapshot -gpu swiftshader_indirect`). Use 3-button navigation (`adb shell cmd overlay enable com.android.internal.systemui.navbar.threebutton`): with gesture navigation, Maestro's swipe near the bottom edge goes back to the home screen. Forward the ports with `adb reverse tcp:8081 tcp:8081` and `adb reverse tcp:3010 tcp:3010`, install the development APK and open the app through the Metro link; on the first open tap "Continue" in the developer menu. Only one device open at a time (iOS or Android), because Maestro picks the device by itself.
- On the iOS simulator, start Metro pointing at the local API (`EXPO_PUBLIC_API_URL=http://localhost:3010 pnpm --filter @nextjourney/mobile exec expo start --dev-client`) and open the app through the Metro link; the app `.env` may be pointing to another environment.

Command:

```bash
pnpm --filter @nextjourney/mobile test:ui
```

The `apps/mobile/scripts/ui-tests.mjs` script creates a new test account in the API on every run (random email, password and code, only in memory; nothing stays in the repository), confirms its email straight in the local database (`apps/api/prisma/confirm-test-email.ts`) and saves a known sign-in code (`apps/api/prisma/set-test-code.ts`); both utilities refuse a non-local database. The app signs in by code; the password is only used for the API checks and is passed to Maestro. To run only some flows (the sign-in one always goes first, because it logs into the new account; the following flows depend on the previous ones, so always run them in sequence from 00, without skipping):

```bash
UI_FLOW=.maestro/flows/00-sign-in-and-onboarding.yaml,.maestro/flows/01-create-and-check-task.yaml \
  pnpm --filter @nextjourney/mobile test:ui
```

## Flows (`apps/mobile/.maestro/flows`)

| Flow                         | What it checks                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------------- |
| 00 sign in and onboarding    | old session, tutorial, character, story; **one** pending achievement at a time                  |
| 01 create and check a task   | difficulty selector with stars and the X button, modal after creating, EXP and coins in the API |
| 02 uncheck                   | the EXP stays and the coins decrease (the undo rule)                                            |
| 03 gallery                   | tracks, new goals, progress coming from the server, the detail of an achievement                |
| 04 history and empty state   | notice at the bottom of Tasks, history, undo, empty state                                       |
| 05 legal documents         | the Terms of Use and the Privacy Policy open from the settings with the text served by the API |

Conventions:

- Texts and labels come from `pt-BR.json`; the flow uses the same text the user sees. If the text changes, adjust the flow.
- Notices that vanish in a few seconds (toast) are not checked on screen; the flow checks the state in the API (`.maestro/scripts/check-player.js`).
- Android and iOS read the screen differently: on iOS the tab shows as `Perfil, tab, 5 of 5`, the item or achievement card is a single label (`Abrir <title>`, `<name>. <description> bloqueada`) and a field's label does not receive focus. That is why the flows use expressions (`Perfil(, tab.*)?`, `.*Pagar a conta de luz.*`) and, where behavior differs, `when: platform:` (`subflows/tap-field.yaml`, `subflows/back.yaml`). A new flow must pass on both.
- On a small screen (Android 1280 px) the "Criar item" button and the list are below the fold: `subflows/create-item.yaml` and `subflows/view-item.yaml` scroll to them and center them (stuck to the edge, the tap lands on the navigation bar).
- Every flow starts with `subflows/start.yaml`, which closes any modal, form or screen left open by a run that failed.
- The flows depend on the previous one (same account, same order). The order is in `.maestro/config.yaml`.
- Report of the last run: `apps/mobile/.maestro/relatorio.xml` (ignored by Git).

## What is missing

- Run layer 5 in CI: it needs a macOS runner with an emulator (slow and expensive); for now it runs before opening a PR.
- On iOS the gallery's `1/6` counter is not checked, because the card does not expose the number (an accessibility gap).
- Visual comparison (screenshots) of the main screens.
