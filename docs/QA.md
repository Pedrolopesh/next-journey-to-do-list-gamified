# Manual regression script

Runs before each release and after big changes. Prerequisites: local API up with the seed applied (`pnpm --filter @nextjourney/api db:deploy && db:seed`), app as a development build (Android emulator or device).

Tick each item and note the date, version and device in the PR or the release issue.

## 1. Account and session

- [ ] Signup with a weak password: the checklist shows what is missing and the button does not submit.
- [ ] A valid signup leads to onboarding. A repeated email shows a generic message.
- [ ] Login with a wrong password and with a missing email show the same message.
- [ ] Closing and opening the app keeps the login (splash while it checks).
- [ ] "Sair" (sign out, in Perfil) goes back to the login and leaves no data from the previous account.
- [ ] "Esqueci a senha" (forgot password): always confirms the send; the link opens the new-password screen and the old password stops working.
- [ ] With Google/Apple configured: login creates the account on first access and enters the same account afterwards.

## 2. Onboarding

- [ ] 3-slide tutorial, skippable; it does not show again afterwards.
- [ ] Closing the app midway and reopening resumes from the step where it stopped.
- [ ] Character: the preview changes when choosing; locked items cannot be chosen.
- [ ] Story: 5 options; the tabs only unlock after choosing.

## 3. Items

- [ ] Create a daily (weekdays), a task (quick due date) and a habit; category and difficulty.
- [ ] Edit and delete (deletion disappears from the list and keeps the EXP already earned).
- [ ] Dailies: overdue ones on top; the streak shows; pending badge on the tab.
- [ ] Tasks: grouped by category; filter by pills; a checked task leaves the list.
- [ ] Habits: check several times; counters for today and the week.

## 4. Check, progression and banner

- [ ] The check responds at once (under 100 ms) and vibrates; the toast shows the EXP.
- [ ] The banner runs and advances; when the chapter closes it darkens and the chapter modal opens afterwards.
- [ ] Leveling up opens the level modal; an achievement opens the achievement modal; the modals come out one at a time.
- [ ] Undo on the same day gives back EXP and coins; on a closed chapter it shows the notice.
- [ ] Without internet, the check shows a clear error and the item goes back to its previous state (the offline queue belongs to Phase 7).

## 4c. Tab journey (Diários, Tarefas, Hábitos)

- [ ] The banner shows the chosen character walking on the left side, with the scenery passing behind, in the six scenes (beach, city, zombie, castle, forest, hell), in the morning, afternoon and at night.
- [ ] City: an avenue with cars in both directions (3 models, varied colors), lampposts and a bus stop; the building background passes slowly over the river. Zombie: a military base with a fence and idle zombies in the background, a helicopter. Castle: a royal carpet along the whole path, no throne, knights of 3 types and swords on the wall. Forest: a house and a lake pass slowly, trees at different depths. Hell: lava and a volcano in the background, no throne.
- [ ] Home > "Ambiente" shows "Cenário da história principal" below the HQ scene, without the cabin, with "Cidade" in place of "Topo do prédio" and "Floresta" in place of "Paraíso".
- [ ] Changing the story scene changes the three tabs; the time (automatic or fixed) applies on the journey.
- [ ] The character position follows the level EXP: each check brings it closer to the portal in up to 6 stops, with a run and the scenery speeding up.
- [ ] On leveling up it reaches the portal on the right side, and everything stops. The scene only changes (fade) on the next check, and the character restarts on the new level. Closing and opening the app keeps the portal waiting.
- [ ] In the list, the difficulty shows as an icon on the right (leaf, bolt, skull) and the check unchecks on tap; there is no "Desfazer" (undo) button.
- [ ] On the first open with no items, 20 dailies, 5 tasks and 5 habits appear as examples and a toast announces it.
- [ ] Below the banner of Diários, Tarefas and Hábitos there is the progress bar: chapter, level EXP, level and coins; the check toast shows EXP and coins.
- [ ] Home: "QG" above the banner, a discreet description below, buttons "Mudar personagem", "Mudar história principal" and "Mudar cenário do QG" above the numbers.
- [ ] Perfil: "Sair" in red; "Personalizar personagem" opens the full-width banner with the form below; "Sortear aparência" is solid purple.
- [ ] "Minha história": journey banner on top, choice of the 6 stories, "Jogar esta história" switches with loading and a toast; completed chapters show the text, the current one shows the bar, the others show a padlock. Viewing another story does not switch the active one.
- [ ] Leveling up completes a chapter of the active story; the check that levels up does not uncheck (chapter-completed message).
- [ ] The difficulty shows as bars (1 = easy, 2 = medium, 3 = hard), never as text.

## 4b. Home HQ (scene and character)

- [ ] The Home shows the HQ (still scene with the character) and the saved character, with the device time (morning, afternoon or night).
- [ ] "Ambiente" on the Home opens scene and time; changing updates the banner at once and shows a toast; the value persists after closing the app.
- [ ] "Personagem" opens the editor with the preview fixed at the top; each option (body, skin, hair and color, clothes, pants, shoes and colors) changes the preview.
- [ ] Name and title come last in the form; saving shows a toast and the Home already shows the new look.
- [ ] Doing a check on the Home makes the character celebrate; closing the chapter darkens and opens the modal afterwards.
- [ ] On an entry-level device, the HQ runs smoothly (about 30 frames per second) and stops in the background and with "reduce motion".
- [ ] "Créditos" (Configurações) lists the LPC art with author and license.

## 5. Profile

- [ ] Level, EXP, coins, achievements (progress and state), "Minha história" (check, purple border, padlock).
- [ ] Customize character: a cosmetic unlocked by an achievement shows as available.
- [ ] Settings: changing the time zone changes "today"; the reminder accepts HH:MM; categories (limit of 10, destination on delete).

## 6. States and accessibility

- [ ] Lists show a skeleton while loading, an empty state with a hint and an error with "Tentar de novo" (try again).
- [ ] 44 pt touch targets; labels read by the screen reader (TalkBack/VoiceOver) on checks and buttons.
- [ ] A larger system font (up to 130%) does not cut off texts.

## 7. Store gate: feedback on every action (RN-FB)

Blocks submission to the stores. Go through **every screen and every button** and confirm, with the API on and also off (or in airplane mode):

- [ ] On tap, the button shows loading (and does not accept a second tap) or the screen changes at once.
- [ ] Success: a success toast appears or an obvious visible change.
- [ ] Error (no network, API down, invalid data): an error toast with clear text appears; the button goes back to normal.
- [ ] Invalid form (empty fields, weak password, terms not accepted): each field shows its message and the toast warns; the button never "does nothing".
- [ ] Screens and buttons covered: signup, login, sign in with Google/Apple, forgot password, new password, tutorial, character, story choice, create/edit/delete item, check and undo, categories (create, rename, delete), settings (time zone, reminder), delete account, sign out, "Tentar de novo" buttons.
- [ ] No screen is left idle with no response after a tap. If you find one, it is a blocker.
