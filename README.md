# Sloppy Sluggers

See [Terminology and controls](TERMINOLOGY-README.md) for Contact, Pitch, Field, pitcher adjustment, and drag-to-play. Games and rest/shop/event stops are connected map nodes. — Two-Way Baseball

A playable baseball deckbuilding roguelike with three player characters, three acts, branching opponent choices, and best-of-three series. Play both offense and defense with a deck of fixed double-sided cards.

## Play locally

Install Node.js 20 or newer, open this folder in a terminal, and run:

    npm start

Open http://127.0.0.1:4173. No packages to install and no build step. Double-clicking the HTML file is not supported because the game uses JavaScript modules.

## Play on GitHub Pages

Upload the extracted project contents to your repository root. Keep index.html, .nojekyll, package.json, README.md, and the dist folder at the same level. The root launch page opens dist/.

In Settings > Pages, select Deploy from a branch, choose your uploaded branch (usually main), and / (root). After deployment finishes, open the Pages website link. Do not upload only the ZIP file.

Other static hosts can publish dist/ directly. The game makes no external API calls while playing; art and the font are included. No AI service is required to run it.

## The new game loop

- Three acts, each containing three best-of-three series.
- Every game lasts three innings, with offense and defense in each inning.
- Win by outscoring the opponent. Two wins advance the series; two losses in the same series end the run.
- Each turn is one full at-bat. Play cards, read the predicted result, and resolve.
- Each of the 27 cards has an offensive and defensive face. Both are visible when choosing rewards or inspecting the deck.
- A tied game goes to one bases-loaded at-bat per team, with a published tie-break rule.
- Between games, choose one stop: recovery/upgrades, training, a shop, or an event.

See docs/DESIGN.md for the complete current rules and docs/CARDS.md for all card faces and upgrades. This document replaces the older target-runs design for this build.

## Organized source

| Folder                      | Purpose                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------ |
| dist/js/data/               | Paired card definitions, characters, opponents, equipment, asset names                           |
| dist/js/engine/             | Baseball advancement, match state, series/run state, routes, deterministic randomness and saving |
| dist/js/ui/                 | Screens, paired cards, route display, help dialogs and optional sound                            |
| dist/js/main.js             | Input handling and application startup                                                           |
| dist/styles/                | Base layout, card styling, stadium theme and two-way match layout                                |
| dist/assets/art/originals/  | 32 original supplied PNGs, preserved                                                             |
| dist/assets/art/characters/ | Three custom batting sprites and three selection portraits                                       |
| dist/assets/art/two-way/    | Three player pitching sprites and six enemy batting/pitching sprites                             |
| dist/assets/fonts/          | Local pixel font and its license                                                                 |
| tests/                      | Match, series, map, save and rendering regression checks                                         |
| scripts/                    | Local server, asset validation and balance simulations                                           |
| docs/                       | Current design, complete card catalog, balance evidence and art provenance                       |

## Controls

Drag cards onto the field, click them, or press 1–9. Drop outside the field or press Escape to cancel a drag. Space resolves the current at-bat, or switches sides when the half ends. D opens the paired deck. Escape closes a dialog. Sound starts muted and can be enabled from the top bar.

## Checks

    npm test
    npm run validate
    npm run balance -- 100

Balance simulations use limited deterministic policies. Their win rates are not human win rates. See docs/BALANCE.md for results and limitations.

## Saves and scope

The two-way rules use a new versioned local save. Older target-run saves are left untouched but cannot be resumed under the new mechanics. Saves are local to a browser and website address; moving from localhost to GitHub Pages starts a separate save.

This is a playtest build. It includes all three acts and complete win/loss states, but does not include frame-by-frame animation, a soundtrack, online multiplayer, cloud saves or controller support. The included PNGs are ordinary flattened images you can import into other tools. The original art and photo-based batting portraits are preserved; new generated sprites are separately documented.
