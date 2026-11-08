# Progression and game rules

Code in `apps/api/src/modules/progression/domain` (pure functions, one per rule, each with a test) and `modules/achievements`. **The server decides progression**; the app never computes EXP. The values below come from `packages/contracts` (`DEFAULT_GAME_CONFIG`) and from the `game_config` table, which can be adjusted without publishing the app (with no row, the initial value applies).

## Initial values

| Item           | Easy | Medium | Hard |
| -------------- | ---- | ------ | ---- |
| EXP per check  | 5    | 10     | 20   |
| Coins per check | 1   | 2      | 4    |

- EXP to complete each level: 200, 400, 600, 800 and 1000; from level 5 on, 1000. Past the end of a table, the last value applies.
- Coin bonus per level gained: 10. Each story has 5 chapters.
- Coins lost on uncheck, per chapter: 3, 5, 10, 15 and 20 (after the end, the last value).

## Dates

"Day" is the user's **local** day (`YYYY-MM-DD`), in the profile IANA time zone: the rollover is at 00:00 in that zone. The domain functions receive the date or the instant as an argument and **never read the clock** (the clock is injected), so the tests control time. Date arithmetic uses UTC only as a calendar. An invalid time zone throws `RangeError`.

## Checking an item (`applyCheck`)

- EXP and coins come from the difficulty. A habit has no daily limit.
- If the item already earned EXP today (checked, unchecked and checked again), it earns **only the coins**.
- The EXP left over when leveling up is carried over; one check can raise more than one level. Each level gained earns the coin bonus.
- Each level gained completes a chapter of the **active story**, until the story ends. Chapter progress is the EXP within the level. With no active story (incomplete onboarding) the check earns EXP and coins but does not count a chapter.
- The result becomes a record (`item_checks`) with everything the check did, which is the exact input of the undo.

## Unchecking (`undoCheck`)

- Works on any day and in any chapter.
- **EXP, level and chapter never go back**: only the coins decrease, by the loss of the current chapter, never below zero.
- The coin bonus per level is not reverted.

## Daily: overdue and streak

- A daily is **overdue** when the last scheduled day before today ended without a check. It only counts days from creation. Checking today (even an overdue one) clears the overdue state.
- **Streak:** consecutive days with a check, going back from today. A scheduled day with no check (that is not today) breaks it; unscheduled days do not. Today with no check yet does not break it (the day has not ended). Checking an overdue daily today restarts at 1.

## Complete consecutive days (Flame)

Counts the consecutive days on which **every** scheduled daily was completed on the same day, going back from today. A day with no scheduled daily is **neutral**: it neither counts nor breaks. An incomplete today does not break it yet (the day has not ended); an incomplete earlier day breaks it. The perfect days (3 or more scheduled dailies, all done) look only at the 90-day window, because the backfill has a lookback limit: widening the window without loading more history would make the achievement count too few.

## Achievements

The catalog (slugs, classes, icons) is in `packages/contracts`; each criterion is a pure function in `domain/achievements.ts`, and the service builds the context from the database.

- **Evaluation inside the transaction** of the action (check, item, category, character or app event). Each achievement is unlocked **only once** (the primary key prevents duplicates).
- The **collection** ones depend on the others: they enter on the next pass, and the service repeats the evaluation until it settles (at most 4 passes).
- **One modal per action:** everything unlocked stays pending (`notifiedAt` null), but the response brings only the **oldest** pending one (tie: catalog order). The others show up, one at a time, in the following actions. The app confirms the notice through `POST /v1/achievements/ack`, and only for the user's own achievements.
- **Backfill** (`backfillAll`): unlocks, already marked as notified, what each user already met, without opening a modal.
- Dailies are evaluated in a 90-day window (it covers the 30-day Flame and the recent perfect days); whoever has used the app for longer only sees that window.
- A slug that left the catalog does not block the queue of valid ones. The gallery shows numeric progress (null when the criterion is an event); a locked surprise does not show the text.
- **Starter items do not count** as creation (nor as an active item or a note), but checking or completing an example counts normally. Details in `openspec/specs/starter-items/spec.md`.
