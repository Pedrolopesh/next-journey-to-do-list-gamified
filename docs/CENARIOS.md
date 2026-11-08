# Banner scenes: construction and check rules

Applies to creating, changing or reviewing any scene in `apps/banner/src/qg/scenes` (still HQ and the journey with the scrolling scene) and their levels. Each rule below comes from a defect that already appeared and was fixed; the goal is not to repeat it. Read together with `CONTRIBUTING.md`.

## 1. How a scene is built

- Logical frame of 390×220 px (`SCENE_W`, `SCENE_H`). The character stands with the feet at the scene's `groundY`.
- `back` (HQ) and `journey` (journey, scrolls with `env.scroll`) draw the scene. `front` draws what stays in front of the character in the HQ.
- **Levels** (1 to 5, one per story chapter): `levels`, `levelInfo` (name, description and a list of what changes), `levelBack`, `levelFront`, `levelLights`, and the people in `extrasFor` (HQ) and `journeyExtrasFor` (journey). Level 1 is the base scene; the following ones only add or swap things. Never remove from level 1 what the app already uses.
- Level objects live in a `<scene>-levels.ts` file, with separate position lists for the HQ and for the journey (the journey uses world positions and a cycle).
- Everything that shows in the lab (`#cenarios`) comes from `SceneDef`; the lab has no list of levels of its own.

## 2. Depth (the most repeated mistake)

1. **Draw order is by foot height (`y`).** The engine mixes level objects (`levelItems`), extras and the character in a single list and draws from the highest to the lowest on screen. So each object's `y` is its base (where it touches the ground), not the middle or the top.
2. **Whoever passes by the character uses its own lane.** People and things that walk cannot share the same foot height with whoever is standing still or with the character: separate by at least 12 px. Walkers in different lanes (and at different speeds) so they do not walk stuck together.
3. **The background is higher on screen, the foreground is lower.** To look farther back: feet higher up, smaller size and slower movement (parallax), never just moving.
4. **Nothing sits on top of something else unless on purpose.** Check overlap between: bonfire and bar, lamppost and couple, kiosk and palm tree, chandelier and armor, bench and person.
5. **Land things do not stand in water.** Buildings, lampposts and houses need ground: sidewalk, street, shore or sand. A building with its base inside a lake or the sea is a defect. If the background is a city next to water, draw the shore and the street between them.

## 3. Movement and animation

1. **Position is always an integer.** Round `x` and `y` before drawing (`Math.round`), especially on vector shapes (strokes and arcs): a fractional position shakes while scrolling.
2. **An animation phase never depends on the on-screen position.** `Math.sin(t + x)` with an `x` that changes while scrolling makes the object ripple fast while the character walks. Use a fixed phase per object (index, `lean`, seed).
3. **Soft and short sway.** Leaves, flags and flames: amplitude of 1 px or less, a period of several seconds. Prefer discrete 1 px steps to fractional movement.
4. **Rare objects have a long cycle.** Whatever is big or eye-catching (pier, bonfire with the group, bridge, bus stop) uses a cycle of 1800 px or more; otherwise it looks like it shows up all the time. Two objects that must not meet (bonfire and bar) move on the same cycle, with a fixed distance between them.
5. **Distant layers scroll slowly** (factor 0.03 to 0.5), each with its own cycle. Objects attached to the same group (pier and moored boats) scroll with the same factor.
6. **When the cycle wraps around, the object disappears off screen** (use `scrolled`, which has a 100 px margin) and never in the middle of it.
7. **Vehicles move in the lane and in the direction of the headlights.** A car and a bus have a front, a back, wheels at the ends and go in the direction of the front.

## 4. Drawing recognizable objects

- Each object must be readable at a glance. Bus: long body, a row of windows, a big windshield, a door, a destination sign, two wheels in dark arches, a bumper. Tower: sides with perspective and windows in a grid. Bunting attached to something (never loose in the air).
- A 1 px dark outline on the main objects, light on top and shadow below.
- Scale: an adult is about 44 px tall. A kiosk, a bar and a car are bigger than that; a bench and a lamppost must be in proportion.
- Windows, bricks, leaves and stones follow a fixed seed per object (never `Math.random()` in the frame).

## 5. People and extras

- In the HQ, `extrasFor`; on the journey, `journeyExtrasFor` (world positions, `drift` for those who walk, their own `period` for those who accompany a rare object).
- At least 3 or 4 people per level on the journey from level 2 on, between standing and walking; at least two together at a gathering point (bonfire, table), one of them looking at the point.
- Whoever stays next to an object stays **farther back** than the character's path.

Chase on the journey: whoever runs alongside the character (`follow` on the extra) stays on screen, by
`heroX`, and not in the scrolling world. Chasers take a negative `offset` (always behind) and whoever flees,
a positive one (always ahead), with a `sway` smaller than the gap so nobody reaches the character. When the
scene stops, they leave on the side they came from.

Ready-made pieces from the LPC catalog enter the extra through the `selection` of `ExtraCharacter` (`hat` and `arms`,
without recoloring): the royal guard uses the Pigface visor and the "Armour" on the arms; the wizard's tower uses the
Celestial Wizard Moon Hat. Trees, cabin, lake and objects
of the same ground move together (same scroll factor); what stands on the ground enters the list
sorted by foot height (`levelItems`), never drawn as a block behind everyone.

## 6. Light and time of day

- Each level must look right in the morning, in the afternoon and at night. Lights only turn on at night, except what is fire or an indoor lamp.
- Lights follow the object's on-screen position (including on the journey) and use the same cycle as it.

## 7. Performance

- Order-of-magnitude budget: a few hundred rectangles and a few dozen strokes per frame. Avoid creating new objects or gradients on every frame; keep what does not change.
- The engine limits the frames per second; do not depend on fixed time steps.

## 8. Check protocol (mandatory before saying a scene or level is ready)

Do it in the lab (`pnpm --filter @nextjourney/banner exec vite --port 5173`, then `http://localhost:5173/lab.html#cenarios`):

1. For each level: **HQ at the three times** (morning, afternoon, night).
2. For each level: **journey at at least 3 distinct moments** (the character walking for a few seconds between captures), and by day and by night. A single frame proves nothing: depth and cycle defects only show when things cross.
3. Look on purpose for: a building or object in the water; an object on top of an object; a person over the character out of order; an object that shows up all the time; shaking; an element cut at the edge; a vehicle with a strange shape; a light in the wrong place.
4. Check that level 1 is still the same as what the app uses.
5. `pnpm exec turbo run lint typecheck test build` (16 of 16) and `FULL=1 pnpm run security:full` before any PR.
6. Report in the PR what was seen and what was not.

Automated tests: `scenes.test.ts` checks that every scene with levels has a complete `levelInfo`, and `extras.test.ts` covers the extras' positions.
