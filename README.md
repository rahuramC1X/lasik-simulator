# Eye Heroes — Vision Lab

A comic-book browser adventure. Original cartoon heroes — Dexter the dragon,
Luna the rabbit magician, Captain Comet — keep showing up with vision
problems, and the floating lab AI ORA sends you in to fix them, one mission
at a time. Underneath the comic panels it's the same real progression: you
identify anatomy, understand why vision blurs, learn what astigmatism
actually is, then perform increasingly demanding versions of a laser
mechanic — but the player experiences it as "Dexter needs my help," not
"Level 4." Every level also runs on a named lab instrument (the Ocular
Scanner, the Corneal Mapper, …), and the game adapts: if precision stays
weak across a couple of attempts, ORA offers a short "Precision Training"
drill before sending you back into the story.

> **Medical disclaimer** — This is a fictional comic-adventure game with an
> original cast of characters, inspired by real concepts in vision science. It
> is not medical or surgical training. It does not reproduce a real surgical
> procedure, it cannot tell anyone whether they are a candidate for LASIK, and
> it does not predict any real surgical outcome. The patient values and
> "concepts unlocked" facts are simplified for a general audience, not
> clinical guidance.
>
> The cast (ORA, Dexter, Luna, Captain Comet) is original to this game —
> deliberately not existing IP, both because building a commercial product
> around characters you don't own is a real legal problem, and because an
> original cast is a better long-term asset anyway.

## Install

```bash
npm install
```

## Run (development)

```bash
npm run dev
```

Then open the URL Vite prints (by default <http://localhost:5173>).

## Build (production)

```bash
npm run build
```

Preview the production build with `npm run preview`. Lint with `npm run lint`.

## Architecture

React + TypeScript + Vite. The eye is a real 3D scene (Three.js / WebGL) with
a bloom post-process pass, used for the precision mechanic; anatomy, optics,
and astigmatism are taught through 2D diagrams, because that's what real
references for those actually look like. No backend, no database, no
authentication — everything runs locally; level/concept progress persists to
`localStorage` only.

```
src/
├── game/                framework-independent gameplay + knowledge layer
│   ├── GameEngine.ts      a generic level/stage machine — it has no idea
│   │                      what "Level 4" is, it just walks whatever stage
│   │                      sequence the selected LevelDefinition describes
│   ├── levels.ts          the 100-level roster: what each level is built
│   │                      from (see "Levels" below) — first 10 are real
│   ├── characters.ts      the hero cast — id, name, role, theme colour
│   ├── story.ts           the comic script: who shows up before/after each
│   │                      level and what they say — pure data, no engine ties
│   ├── progress.ts        localStorage record of completed levels
│   ├── curriculum.ts      the 19-concept knowledge base + unlock record
│   ├── Patient.ts         fictional patient model and roster
│   ├── report.ts          the synthetic ophthalmology report behind the
│   │                      "Decode Your Eye" slice — lines, tolerances, quiz
│   ├── Laser.ts           crosshair position, clamping, alignment lock, cooldown
│   ├── scoring.ts         pure scoring functions (precision/safety/timing,
│   │                      identify/focus/orient accuracy, achievement rank)
│   ├── effects.ts         particles, screen flash, screen shake
│   ├── audio.ts           synthesised WebAudio placeholder cues
│   ├── types.ts           arena constants, GameState, LevelConfig
│   └── render3d/          Three.js renderer (swappable — see below)
│       ├── EyeScene.ts      scene graph, EffectComposer + UnrealBloomPass,
│       │                    per-frame updates, dispose
│       ├── constants.ts     world-space layout, arena↔world mapping
│       └── textures.ts      procedural iris/sclera canvas textures
├── components/           rendering and UI
│   ├── GameCanvas.tsx      mounts EyeScene, owns the rAF loop, pointer input
│   ├── HUD.tsx             in-precision-stage overlay (with a countdown
│   │                       when the level has a time limit)
│   ├── MainMenu.tsx
│   ├── LevelSelect.tsx     the 100-level map — 10 playable nodes, 9 locked
│   │                       "coming soon" chapters
│   ├── EyeIdentify.tsx     the 'identify' stage screen
│   ├── FocusChallenge.tsx  the 'focus' stage screen
│   ├── AstigmatismChallenge.tsx the 'orient' stage screen
│   ├── PatientIntro.tsx    the 'plan' stage screen
│   ├── VisionReveal.tsx    before/after eye-chart transition
│   ├── ResultScreen.tsx    achievement card (full, or a lighter
│   │                       level-complete card for non-precision levels)
│   ├── KnowledgeCabinet.tsx "My Surgery Lab" — browsable unlocked concepts
│   ├── comic/
│   │   ├── ComicStrip.tsx   speech-bubble panel sequence, reused for both
│   │   │                    mission intros and result-screen reactions
│   │   └── MissionIntro.tsx the full-screen comic beat before a level starts
│   ├── characters/
│   │   └── Avatars.tsx      hand-drawn SVG mascot portraits — ORA, Dexter,
│   │                        Luna, Captain Comet
│   └── diagrams/           the 2D teaching diagrams (SVG, not 3D)
│       ├── EyeCrossSection.tsx  8-structure anatomical side-view diagram
│       ├── RayDiagram.tsx       optical ray-tracing (why myopia blurs)
│       ├── AstigmatismDiagram.tsx elongated-blur-to-point axis diagram
│       ├── CorneaLayers.tsx     epithelium/stroma/endothelium inset
│       ├── CornealTopography.tsx face-on curvature map — the astigmatism
│       │                        "bowtie", warm = steeper, cool = flatter
│       └── svgMath.ts           ellipse-arc path helpers
├── components/prototypes/  mechanic experiments, outside the curriculum
│   ├── PrototypePicker.tsx    the comparison menu
│   ├── FocusHuntPrototype.tsx
│   ├── VisionChasePrototype.tsx
│   ├── OpticalPuzzlePrototype.tsx
│   └── DecodeReportPrototype.tsx  "Decode Your Eye" — see below
├── App.tsx               composition: picks the screen, forwards intent to
│                          the engine — this file doesn't know what any
│                          individual level contains
├── main.tsx
└── index.css
```

Four rules keep the layers apart:

1. **`src/game/` never imports React, the DOM, or Three.js.** `GameEngine` is
   advanced by `update(dtMs)` from whatever loop is driving it.
2. **The engine doesn't special-case levels.** It walks a `stages: StageType[]`
   array from `levels.ts`. Adding level 11 is a data entry, not new engine code.
3. **React never sees high-frequency state.** Pointer movement and per-frame
   3D updates stay inside `GameCanvas` and `EyeScene`.
4. **All 3D drawing lives in `render3d/`,** reading an immutable-by-convention
   `RenderState` — the renderer can be swapped again without touching `src/game/*`.

## Levels

The architecture supports up to 100 levels (`src/game/levels.ts`); the first
ten are built. A level is just an ordered list of **stages**, each one of
five reusable mechanics:

| Stage | Mechanic |
| --- | --- |
| `identify` | Tap-to-find, on the anatomical cross-section |
| `focus` | Drag corneal power until a ray-tracing diagram converges on the retina |
| `orient` | Drag a rotation axis until an elongated blur rounds into a point |
| `plan` | The patient case + a concept briefing |
| `precision` | The mouse-driven laser-tracking mechanic |

| # | Level | Stages | What's new |
| - | --- | --- | --- |
| 1 | Meet the Eye | identify | 8 structures, front-to-back |
| 2 | Why Is Vision Blurry? | focus | the myopia mechanism |
| 3 | Plan the Treatment | plan | corneal layers, how LASIK works |
| 4 | Steady Hands | precision | the base mechanic, forgiving tolerance |
| 5 | Tighter Tolerance | precision | same mechanic, ~40% smaller hit radii |
| 6 | Faster Target | precision | faster marker, steeper speed ramp |
| 7 | Astigmatism: Find the Axis | orient | axis isn't power — a new mechanic |
| 8 | Astigmatism: Combined Correction | orient → precision | **the orient stage's accuracy sets the next stage's tolerance** — a poor axis lock makes the laser stage measurably stricter |
| 9 | Time Pressure | precision | a real clock (`LevelConfig.timeLimit`, unused until this level); running out doesn't fail hard — it finishes with a low timing score |
| 10 | Multi-Parameter Mastery | precision | tight tolerance + fast target + a clock, together |

Levels unlock linearly (finish N, N+1 opens) via `src/game/progress.ts`.
Levels 11–100 exist as locked roadmap entries grouped into nine themed
chapters (Astigmatism Mastery, Speed & Pressure, Unexpected Events, …),
visible on the Level Select screen — an honest "not built yet," the same
pattern the Knowledge Cabinet already used for locked concepts.

### Cast & story (`src/game/story.ts`, `characters.ts`)

Each level is also a short comic beat, not just a mechanic. `LEVEL_STORY`
maps every level id to a hero, an intro script (shown as a full-screen comic
before the mission starts, via `MissionIntro.tsx`), and an outro script
(shown inline at the top of the result screen, via `ComicStrip.tsx`). Heroes
recur across levels the way the design called for:

| Hero | Appears in | Teaches |
| --- | --- | --- |
| **ORA** (lab AI) | L1, L3, narrates throughout | onboarding, concept briefings |
| **Dexter** (dragon) | L2, L4, L5 | focus/myopia, base precision, tighter tolerance |
| **Captain Comet** (space hero) | L6, L9 | faster targets, time pressure |
| **Luna** (rabbit magician) | L7, L8 | astigmatism axis, combined correction |
| all four | L10 (finale) | — |

Character art is hand-drawn inline SVG (`components/characters/Avatars.tsx`)
— flat, bold-outlined mascot shapes, not an illustration pipeline. The cast
is intentionally small (4 heroes) rather than one-per-level: the design brief
calls for recurring characters, and reusing a cast across levels is both
truer to that and far less content to author well.

### Machines — the "eye lab" framing

Each level also runs on a named **machine** (`Machine` on `LevelDefinition`):
Ocular Scanner, Corneal Mapper, Treatment Planner, Precision Tracker, Eye
Tracker, Astigmatism Axis Module, Advanced Laser Suite, Master Ophthalmic
Lab. It's presentation over the same five stage types, not a sixth
mechanic — but it reframes progression as building out a lab one instrument
at a time rather than just clearing a numbered list. Completed machines show
up in a "Your Lab" strip on the Level Select screen. `LevelDefinition` also
carries a `premium: boolean` — pure data scaffolding for a possible future
paid tier; **no purchase flow exists in this build**, so it currently gates
nothing. Real payments need a real store integration and were out of scope
here (no backend, per the original brief).

### Adaptive difficulty

`src/game/adaptive.ts` keeps a rolling localStorage record of the last three
precision-stage scores. If their average drops below a threshold, the
engine offers a **Precision Training** drill on the next result screen — a
short, generously-toleranced bonus level (`PRECISION_TRAINING_LEVEL` in
`levels.ts`, id `0`) that isn't part of the numbered sequence: finishing it
doesn't advance the curriculum, it just resets the weak streak and unlocks
one "Deliberate Practice" concept. Note the threshold is calibrated to sit
*above* 60 — a completed level's precision score can never actually fall
below 60 (that's the "acceptable" grade's accuracy floor in `scoring.ts`),
so a `< 60` check would never fire on real play.

### Scoring

```
identify/focus/orient accuracy → this level's "knowledge" dimension
precision  = average accuracy of successful laser pulses
safety     = 100 − accumulated penalties               ("Consistency" on the card)
timing     = 100 at or under par, decaying gently after (or a fixed low
             score if the level's clock ran out)

overall = weighted blend of whichever dimensions this level actually
          exercised — a pure-teaching level and a pure-precision level both
          get a fair 0–100, not one dragged down by a dimension it never tested
```

`overall` maps to a rank ladder (Trainee → Apprentice → Precision Apprentice →
Precision Specialist → Master Technician) — deliberately avoiding "surgeon" or
"doctor" titles.

### The result screen

Every level ends on the same structure, whether it ran the laser or not:

```
{LEVEL CODE} COMPLETE
──────────────────────
CASE
{the patient's condition, or the level's tagline for a pure-teaching level}

✓ Case understood
✓ Treatment aligned      (only for levels with a precision stage)
✓ Precision maintained

NEW KNOWLEDGE            🧠 concept titles unlocked this run
NEW SKILL                🎯 the same concepts' skill labels
ACHIEVEMENT              🏆 rank + the overall score
NEXT CHALLENGE           the next level's machine
```

### Knowledge Cabinet

Accessible from the Main Menu and every result screen. Reads the same
`localStorage` record `GameEngine` writes to: 19 concepts across the ten
levels plus the training drill, each unlocked once its level is completed,
browsable with a one-sentence fact per concept.

## "Decode Your Eye" — the report-reading slice

Reachable from the Main Menu via **Mechanic Prototypes**. It's a ten-minute
vertical slice for a different product bet than the rest of the game: instead
of teaching eye anatomy and then running a laser, it hands the player a
report that looks like the one they'd get from a clinic and makes every line
on it something they have to work out.

```
CASE SYN-001                    RIGHT EYE (OD)
SPH    -4.25 D      K1  43.25 D @ 175°
CYL    -3.50 D      K2  46.75 D @  85°
AXIS    175°
```

Three lines, three controls, one loop each — **see → manipulate → lock →
understand**:

| Line | What the player drags | What they're watching |
| --- | --- | --- |
| `SPH` | how much focusing power to take away | rays converging in front of the retina, until they land on it |
| `CYL` | how far to even out the cornea | the topography bowtie, until the map goes uniformly green |
| `AXIS` | the orientation of the correction | a stretched blur, until it rounds into a point |

**None of the three controls shows its own number while you drag it.** The
diagram is the only feedback, so locking in is a discovery — "the value I
found by eye is the value already printed on my report" — rather than a
matching exercise. `CornealTopography` hides its K readout for the same
reason, and only prints it once the line is decoded. Three questions then
check that the lines can be told apart, which is the thing the slice is
actually testing; a wrong answer explains itself rather than ending the run.

It's deliberately standalone: no `GameEngine`, no curriculum, no saved
progress, and nothing in `src/game/` learns about it beyond the pure data in
`report.ts`. If the concept doesn't land, deleting three files removes it.

### What's modelled, and what a clinician would need to check

The topography map is a first-order model of regular astigmatism —
curvature varies with the meridian as `K(θ) = Kmean + (ΔK/2)·cos(2(θ −
steep))`, which is what produces the bowtie. The colour scale is narrow on
purpose (a scale wide enough never to saturate would render this case as a
flat green disc). The case is also internally consistent: `K2 − K1` is
3.50 D, matching the cylinder, and the axis is with-the-rule, so the printed
axis of 175° sits 90° from the steep corneal meridian at 85° — the slice
shows that rather than asserting it, because it's the first genuinely
counter-intuitive thing on a real report.

That minus-cylinder convention, the wording of every takeaway, and the
decision to keep corneal and refractive astigmatism visibly distinct are all
**pending review by an ophthalmologist**. The slice is built so that review
changes copy and constants in `report.ts`, not the mechanic.

## Three.js

`EyeScene` (`src/game/render3d/`) renders the eye during the precision stage:
procedural iris/sclera textures, a glossy corneal dome, and a real
post-processing chain (`EffectComposer` → `RenderPass` → `UnrealBloomPass` →
`OutputPass`) with ACES filmic tone mapping, so the corneal highlight, the
treatment flashes, and the laser beam actually glow instead of reading as
flat additive sprites. Anatomy/optics/astigmatism teaching deliberately
stays in 2D — that's the correct diagram type for that
content, not a downgrade.

## Visual identity

Dark emerald "research facility" console — every chrome color (buttons,
glows, borders, the laser/HUD elements in the 3D scene) is a green token in
`src/index.css` and `render3d/constants.ts`. Anatomical colours (iris, sclera
vessels, the pupil) are left alone on purpose — the reskin is the console
around the eye, not the eye itself.

## Controls

| Input          | Action                                          |
| -------------- | ------------------------------------------------ |
| Mouse move     | Steer the laser / hover                          |
| Mouse click    | Fire a pulse, or grade an anatomy-identification tap |
| Touch drag     | Steer the laser                                  |
| Touch release  | Fire a pulse / grade a tap                        |
| Slider drag    | Focus and astigmatism stages                      |

No keyboard controls are required.
