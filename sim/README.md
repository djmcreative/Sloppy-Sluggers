# v2 simulation harness

Headless, no DOM. `rules.js` is written so the browser build can load the
same file later.

    node sim.js [trials]     # default 400
    node sweep.js            # baseline Contact/Stuff sweep

## Files
- `rules.js` — the at-bat model, cards (both sides), intent tables, engine
- `ai.js`    — player policies. `offenseOnly` is the load-bearing one: if it
               wins as often as `balanced`, defense is skippable and the
               double-sided premise has failed
- `sim.js`   — harness and report
- `sweep.js` — sweeps BASE_CONTACT / BASE_STUFF

## Things the sim found, that are now rules

1. **Ball in play is an out.** Beating Stuff by 1 is a groundout, by 2+ is a
   hit. Without this rung, contact always equalled a hit and games ended 33-0.
2. **The third out kills the advance.** A real rule, and it is what stops
   productive outs from inflating scoring. Do not "simplify" it away.
3. **Settling in.** A foul at two strikes costs no strike, so without a ramp
   you can foul forever and the half never ends. The fielding side gains +1
   every 3 turns. This applies to whoever is in the field, on both halves -
   getting that backwards hands the opponent 98 runs a game.
4. **One point of Contact/Stuff per energy.** Cards that broke this ratio
   removed outs from the game entirely.
5. **0-cost cards must never buy Contact.** Free Contact removes every out.

6. **The AI must value the board, not just the swing.** Walks and steals
   change no margin, so a projection that only scores the at-bat rates them
   at zero and never plays them - which made the whole small-ball archetype
   look worthless. `boardValue()` fixes this.
7. **Archetypes must TRADE, not stack.** Dean had the most Contact and the
   most Power, which is not a power archetype, it is a strictly better one.
   He sat at 99%. Low Contact / high Power put him at 46%.

## Where balance stands (400 series per cell, with rewards drafted)

| character | series win | avg score | identity |
|---|---|---|---|
| Dean Kean | 51% | 2.8 - 2.9 | low contact, high power, 5.0 K/game |
| Speedster | 24% | 1.6 - 2.4 | 4.1 walks/game, manufactures without hits |
| All-Purpose | 57% | 2.7 - 2.5 | most hits, most consistent |

Speedster still trails and is the next thing to look at. He strikes out
11 times a game against ~5 for the others - his Contact is genuinely too low
to survive the pitcher settling in, so long at-bats kill him.
