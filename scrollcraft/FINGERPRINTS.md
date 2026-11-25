# Fingerprints

Every site you build with **scroll-craft** gets one row here, appended after it
ships. The registry exists so your next build can prove it is a different page
rather than a re-skin of one you already made.

This file is **yours**. It starts empty on purpose: the gate is about not
repeating *yourself*, so it has nothing to say until you have built something.

The rules and the gate live in the skill's
`references/uniqueness.md`. Short version:

**A new build must differ from EVERY row below on at least 4 of the 6
dimensions.** Four against each row individually, not four on average across the
table. If a planned build fails, change the plan. Never edit a row to make room
for it.

The six dimensions are: **grammar**, **nav treatment**, **hero device**,
**act-sequence shape**, **close pattern**, **signature move**.

Dimension 6 is free, because a signature move is unique by definition. So the
gate really asks for three more out of the remaining five, and a build that
changes only grammar and world will fail it.

---

## The registry

| Build | Grammar | Nav treatment | Hero device | Act-sequence shape | Close pattern | Signature move | World | Port |
|---|---|---|---|---|---|---|---|---|
| vaule-portfolio v1 (2026-11-25, superseded) | Drawing set (sheets, title-block chrome, release close) | Fixed drawing frame + title block: live sheet name/number, sheet index, DE/EN | Pinned cover sheet: grid, lettering guides, name, markup note; name docks into the title block | pin > flow-draw > flow-in > pan > flow-reveal > silence > pin-peak(3.4) > flow-in > flow-in; 9 acts, ~13.5vh | Title block full size as the release, CTA as a field, stamp | Scroll-driven half section + exploded assembly on a cyanotype sheet | Technical drawing (rejected by owner as too CAD) | Vite 5173 |
| vaule-portfolio v2 (2026-11-25) | Colour chapters (each project owns a hue; tinted grounds, hard cuts) | Floating bottom dock: current chapter + colour dot, contents popover, DE/EN, theme toggle | Pinned layered Tyrolean ridges (sky/orb, far, mid, name, near); near ridge overtakes the name | pin(hero 1.4) > flow-draw > flow-in > pan > flow-reveal > silence > pin-peak(3.4) > flow-in > flow-in; 9 acts, ~13.2vh | Large statement + pill CTA + colour chips linking back to each project | Theme switch as nightfall: ridge-shaped View Transition clip rising with a twilight glow band | Flat colour illustration, light day / dark night | Vite 5173 |
| vaule-portfolio v3 (2026-11-25) | Mountain bookends + one pinned project room | Floating dock showing the current project and its colour | Layered ridges + drifting clouds; near ridge overtakes the name | pin(hero 1.4) > flow(statement, word ink) > pin(room 8.4, 7 segments) > flow(tags) > flow(valley); 5 acts, ~12.3vh | Valley: ridges rise into place under a right-aligned CTA, footer on the near ridge | Project window whose ridges morph and recolour per project (theme nightfall retained) | Flat colour illustration, day/night | Vite 5173 |


---

## What is taken

Add a bullet here whenever a build claims something a later build should avoid
reusing: a grammar, a nav treatment, a close pattern, a signature move, an
act-count-and-length band. The shared columns are what the next build inherits
as a constraint, so writing them down is the whole point.

- Grammar: drawing set (title block as nav, sheet index, release close).
- Nav: fixed drawing frame with title block that tracks the sheet and switches language.
- Hero: name docking into chrome (the drawing being signed).
- Signature: scroll-driven section + explode of a physical object.
- Ground change to cyanotype as the peak cut.
- v2: colour-chapters grammar, floating dock nav, layered mountain hero, ridge-clip theme transition.

---

## Appending a row

After shipping, add one line to the table and one bullet to **What is taken** if
the build claimed something new. Fill every column. Say what the build shares
with existing rows.

Rows are append-only. A build that has been superseded stays in the table,
because the space it occupies is still occupied.

---

## Worked example

The skill's author kept a registry of twelve builds across eight page grammars.
If you want to see what a filled-in table looks like, and which shapes tend to
collide, read `EXAMPLES.md` in the scroll-craft repository. Treat it as
illustration only: those rows are somebody else's builds and they do **not**
constrain yours.
