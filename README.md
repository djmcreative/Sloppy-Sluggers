# Sloppy Sluggers

A complete, playable first act of a baseball deckbuilding roguelike: three characters, nine innings, connected routes, redesigned cards, equipment, shops, events, upgrades, and local saving.

## Play locally

Install Node.js 20 or newer, open this folder in a terminal, and run:

```sh
node scripts/serve.mjs
```

Open `http://127.0.0.1:4173`. There are no packages to install and no build step. The server binds to your own computer only. ES modules require a local web server; double-clicking the HTML file is not supported.

The complete deployable game is in `dist/`. It can be hosted by any ordinary static web host, or wrapped in a desktop application. It makes no external API calls while playing, has no analytics, and does not need an AI service. The pixel font is included locally.

## Source organization

| Folder                        | Purpose                                                                           |
| ----------------------------- | --------------------------------------------------------------------------------- |
| `dist/js/data/`               | Cards, upgrade values, characters, pitcher types, equipment, and artwork mappings |
| `dist/js/engine/`             | Combat, baserunning, seeded randomness, run progression, shops, and save storage  |
| `dist/js/ui/`                 | Screen rendering, reusable cards, route drawing, dialogs, and optional sound      |
| `dist/js/main.js`             | Application startup, actions, and keyboard controls                               |
| `dist/styles/`                | Base layout, screen layout, cards, and the pixel game theme                       |
| `dist/assets/art/originals/`  | All 32 supplied PNG files, unchanged                                              |
| `dist/assets/art/characters/` | Six custom transparent PNGs: batting stances and selection portraits              |
| `dist/assets/fonts/`          | Local Pixelify Sans font and its license                                          |
| `tests/`                      | Automated rules and screen-rendering checks                                       |
| `scripts/`                    | Local server, validation, and deterministic balance simulations                   |
| `docs/`                       | Current rules, balance evidence, and asset notes                                  |

Card effects are data commands rather than embedded UI behavior. The engine works in both the browser and Node. Game state is serializable, including the random generator, so resuming a save preserves future draws.

## Controls

- Click cards, or use 1–9 to play cards from the hand.
- End Turn resolves the visible pitch and draws a new hand.
- Space ends the turn when a button is not focused; Enter or Space activates focused buttons.
- D opens the permanent deck. Escape closes a dialog.
- The sound icon enables optional arcade tones; sound starts muted.
- The fullscreen icon requests browser fullscreen where supported.

## Validation

```sh
node --test tests/*.test.mjs
node scripts/validate.mjs
node scripts/balance.mjs 500
```

The simulation report is written to `docs/balance-results.json`. The agents use limited heuristics, not human play. See `docs/BALANCE.md` before interpreting the results.

## Scope of this build

This is a first-act playtest build, not a finished commercial release. It includes the complete nine-inning loop and victory/defeat states. There are no further acts, platform achievements, controller support, cloud saves, soundtrack, or frame-by-frame character animation yet. Sprites have simple interface motion; they are not full animation sheets. Some cards share existing artwork and can be replaced individually through `card-art.js`.

Saves belong to the browser and origin where you play. The local preview and private hosted version have separate saves. Starting a new run asks before replacing an unfinished save.

No third-party game art was copied. Visual references requested by the owner informed the layout and presentation. The game includes the owner's supplied baseball art and six custom player illustrations generated from the supplied photo references. See `docs/ART.md` for asset details and generation prompts.
