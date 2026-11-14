# Sunslide — game design

## Premise
Pip the bubble frog lives on a tiny planet made of 15 numbered meadow islands in a 4×4 grid that wraps east–west, plus one empty meadow slot. A star lights half of the planet, and as the planet turns, day and night sweep across the islands.

## Goal
Pop every bubble to clear the sector. Each sector starts with a freshly shuffled planet and one more bat (up to 9).

## Core rules
- **Moving**: Pip hops cell to cell. Turns are buffered: press a direction early and Pip takes the next opening. Islands that touch have no wall between them; walls only face the empty meadow and the poles.
- **Sliding (the 15-puzzle)**: an island next to the empty meadow can slide into it, but only while it is in sunlight (light ≥ 0.3). Anything standing on the island rides with it.
- **Home slots**: island *n* belongs in slot *n* (reading order on the map). At home its walls turn gold and a banner waves. Its bat sleeps and is harmless, and its bubbles score double. First arrival scores +250, and all 15 home scores +3000.
- **Bats**: one per island. Each bat never leaves its own island and only chases while Pip is on that island. Bats are faster and nearly invisible at night, drowsy by day. There are four behaviours: chaser, ambusher, patroller and shy.
- **Bloom**: clearing an island makes flowers grow and butterflies arrive. A small orchard grows too and stays for the rest of the sector, riding along when the island slides: 4–6 round trees on wall-free corners (never on a path), a woven beehive, and five buzzing bees. Its bat flies away for good. Bonus: 300 + 50 × sector.
- **Sunstones** (4 per sector): bats turn pale and flee, and eating them chains 200, 400, 800 and 1600 points.
- **Sky berries**: one appears every 22–36 s on a random island and lasts 14 s. Worth 500 + 100 × (sector − 1), plus a 5 s speed burst (×1.35).
- **Sinkholes**: every 16–28 s the ground cracks 3–4 cells ahead of Pip (0.45 s warning), then a vortex opens for 3.5 s. Stepping in sends Pip through to the antipode while the planet swings round in the camera. It isn't lethal, but it resets the combo.
- **Combos**: pops within 0.8 s of each other chain. Each bubble scores 10 + 2 × (combo − 1), up to 30 per bubble, and the pop sound climbs the musical scale.
- **Lives**: 3 to start, plus one every 10,000 points. Clearing a sector without dying adds a +1000 Flawless bonus.

## Guidance (UX)
- The map shows every remaining bubble as a dot, a count per island (islands with 4 or fewer left pulse pink), bats, the berry, sinkholes and the sun.
- Tapping a non-adjacent island on the map sets a waypoint: a pink pillar on the island and a numbered arrow pointing to it.
- Arrows at the edge of the screen point to:
  - green: the empty meadow
  - pink: the waypoint
  - magenta: the berry
  - gold: the nearest bubble (when your island is done or 12 or fewer bubbles remain)

## Tuning knobs (`CFG` in `src/logic/constants.js`, mirrored in game frags)
`dayLen` = max(70, 95 − 5 × (sector − 1)) s, `pSpeed` 4.2 cells/s, bats 1.6 (day) to 2.5 (night) cells/s plus 0.06 per sector, bubble density 0.36 + 0.04 × (sector − 1) up to 0.7, `slideLight` 0.3, `comboWin` 0.8 s, `berryEvery` [22, 36], `sinkEvery` [16, 28], `sinkWarn` 0.45, `sinkOpen` 3.5.

## Music
The music is procedural, built from 8-step bars over a 4-bar progression. The mood is picked at each bar:
- **title**: bells and a soft pad
- **day**: major pentatonic plucks, kick and hats
- **twilight**: the same without the kick
- **night**: minor, slow FM bells and pads
- **fright** (sunstone): 136 bpm arpeggio

Melodies are seeded per session, so phrases repeat with a variation every fourth bar.
