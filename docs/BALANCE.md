# First-act balance notes

## Current rules

- Win an inning by scoring the target before recording three outs.
- Three energy, five cards per turn. Hands are capped at ten cards.
- Three strikes cause an out; excess strikes carry into the fresh count.
- Four balls cause a walk and clear the count. Hits deliberately preserve the count.
- Foul blocks strikes one-for-one and resets each turn. Fully blocking a strike pitch earns one additional card next turn.
- Painted Corner ignores Foul. It does not receive velocity bonuses.
- Hits advance all runners, then place the batter. Advancement can score runners from third. Runners remain between outs.
- Bad Read is temporary junk; it disappears at the end of an inning.
- Exhaust removes a card for one inning. Power effects are capped at one and filtered from subsequent rewards after acquisition.
- An effect that wins the inning resolves before a later self-damage effect on that same card.
- Each inning costs 8 stamina; each out costs 4. Below 30 stamina, hand size drops to four. Energy stays at three.
- Rest stops after innings three and six offer 28 stamina or one upgrade. Other training stops offer 16 stamina or one upgrade.
- Targets by inning: 6, 6, 7, 7, 8, 8, 9, 9, 10.
- Innings 4–6 add one strike to non-piercing strike pitches; innings 7–9 add two.
- Within an inning, pitches gain one further strike after turns four and eight, capped at two.
- Aces require one additional run and throw one additional strike. They award $40 and one unowned equipment item, versus $24 for normal encounters.
- A 40-turn stadium curfew bounds an inning. The three-out condition normally ends stalled innings much sooner.

## Character identities

**Dean Kean:** His first hit each turn travels one additional base at two strikes. If that hit travels for extra bases, it also grants one Foul. His starting power plays spend strikes for extra bases. The Foul benefit was added because the first simulation showed that his self-inflicted strikes outweighed the offensive advantage.

**Speedster:** The first single each turn also advances the lead runner one base. Lead-runner and all-runner effects can score immediately, giving the small-ball deck a way to cash in its board state.

**Captain:** Starts each inning with one ball and draws one card on a walk. His tools combine count manipulation with defense. The initial two-ball start was reduced after it outperformed the other characters.

## Simulation evidence

Current branching-map sample: **2,700 runs**, 300 for each combination of three characters and three agents. Seeds are 10000–10299. These are repeatable comparisons, not estimates of human win rates.

| Character | Tactical agent | Swing-first agent | Random legal cards |
| --------- | -------------: | ----------------: | -----------------: |
| Dean Kean |          67.0% |              0.0% |              23.3% |
| Speedster |          59.7% |              0.0% |              16.7% |
| Captain   |          72.0% |              0.0% |              32.7% |

The tactical agent evaluates one card ahead. The swing-first agent heavily prioritizes scoring and largely ignores defense. The random agent chooses legal cards in a deterministic arbitrary order. All three use the same between-inning upgrade, purchase, and reward policy. Their results therefore reflect more than card strength alone.

The route policy follows legal, low-risk, non-ace paths and prefers recovery/training. The branching map gives access to a different mix of shops and rests than the initial fixed-column map, so its win rates differ. A previous 4,500-run test of the fixed map produced tactical results of 53.2%, 53.0%, and 62.2% respectively. Ace-heavy paths, deliberate long combos, advanced deck thinning, and every possible reward interaction are not fully calibrated by this report. The Captain remains the most forgiving choice. Human playtesting should focus on whether that advantage persists and whether the last three innings feel fair.

## Changes from the first draft

The initial low run targets allowed almost every simulated run to win. Higher targets alone still produced very high tactical win rates. Adding pitcher tiers created a meaningful defensive requirement. Giving Dean a small defensive return on his signature extra-base hits brought his tactical results close to the Speedster.

The prior Claude prototype's reported win rates were not reused as evidence. These results come from the new engine and new card data.

## Next playtest questions

1. Are pitch intent and Foul readable without opening help?
2. Do defense and walks feel rewarding, or merely mandatory?
3. Do players understand that the count persists after a hit?
4. Is the Captain's safety an appealing identity or too large an advantage?
5. Are ace rewards worth their immediate danger?
6. Does drawing four cards when tired create satisfying pressure or excessive frustration?
