# packages/insignias — achievement badge art

Monorepo rules are in `../../CONTRIBUTING.md`. 24×24 pixel art data (character grids and palette), used by the app and the banner lab.

- One grid per badge, 24 rows of 24 characters; `.` is transparent and every other letter exists in `INSIGNIA_PALETTE`.
- The badge name (`glyph`) comes from the catalog in `@nextjourney/contracts`; the test checks that every `glyph` exists here.
- No logic and no framework dependency. The build (`tsup`) emits ESM and CJS.
