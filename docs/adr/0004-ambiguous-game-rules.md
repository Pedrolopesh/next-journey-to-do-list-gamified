# ADR-0004: ambiguous game rules and how they were resolved

- Date: 2026-10-09
- Status: **proposed** (implemented in `apps/api/src/modules/progression/domain`; waiting for confirmation from the product owner)
- Plan phase: Phase 3, step 12

## Context

The specification left some edge cases open. The solutions below were listed as proposals in "Complementary rules" of the requirements document (`docs/REQUISITOS.MD`). So as not to block Phase 3, they were **implemented as they are and covered by tests**; if one of them changes, its test changes with it.

## Decision (how each point is implemented)

**Level, EXP and coins**
- EXP from level n to n+1 = `75n − 25`. The EXP left over when leveling up carries over; one check can raise more than one level (`levelsGained`).
- Each level gained pays a bonus of 10 coins (`bonusCoins`, separate from the check's coins).
- A habit with no daily limit: every check pays EXP, coins and one chapter step. Dailies, todos and habits pay the same (only difficulty matters).

**Chapters and story**
- Checks for chapter n = `min(10 + 5(n−1), 40)`. The check that reaches the requirement closes the chapter and the next one starts at 0.
- Chapter 5 closes the story (`completed`): checks keep paying EXP and coins, but no longer count toward a chapter (`countsForChapter = false`).
- Chapter progress is per story; EXP, level and coins are global. The domain receives the progress of the active story; the API guarantees it is the right one.

**Undo**
- Only on the same local day as the check; the API maps the refusal to `UNDO_NOT_ALLOWED`.
- **A closed chapter is final**: the check that closed the chapter, and those of chapters already closed, cannot be undone (API: `CHECK_LOCKED`).
- The level never drops: EXP stops at 0 of the current level (it gives back only what fits). The level-up coin bonus is not reverted. Coins and counters never go negative.
- Deleted item: its checks can no longer be undone (an API rule, outside the domain).

**Dailies**
- **Overdue:** the last scheduled day before today (counting from the daily's creation) ended without a check. A daily created today only becomes overdue after a scheduled day ends. Checking today, even an overdue one, clears the overdue state.
- **Streak:** consecutive days with a check, counting back from today. A scheduled day without a check (other than today) breaks it; an unscheduled day does not; today without a check yet does not. Checking an overdue daily today restarts it at 1.
- Local day = date in the profile's IANA time zone, rolling over at 00:00 (`localDay`, using `Intl`; tested with daylight saving time and month and year rollovers).

## Still to implement (Phases 4 and 5)

Achievements (catalog criteria), weekly summary, the habit's weekly counter and the check transaction in the API. They stay outside the pure `applyCheck` domain.

## Consequences

- The rules can change without touching controllers: change the function and its test.
- If the product owner changes a rule, this ADR is replaced by a new one (accepted ADRs are not edited).
