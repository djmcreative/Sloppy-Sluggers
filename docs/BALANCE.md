# Two-way balance notes

Version 0.2. Simulation completed 2026-09-13T15:26:03.166Z.

The current pass covers 900 seeded runs and 6439 games, with 100 runs for every character/policy combination. Seeds begin at 10000. These are limited automated players, not estimates of human win rates.

| Character | Policy       | Full-run wins | Game win rate | Runs/game | Allowed/game | At-bats/game |
| --------- | ------------ | ------------- | ------------- | --------- | ------------ | ------------ |
| dean      | tactical     | 58%           | 87.3%         | 7.94      | 3.7          | 34.9         |
| dean      | random       | 0%            | 45.8%         | 5.44      | 5.88         | 35           |
| dean      | offense-only | 0%            | 0%            | 7.42      | 22.5         | 50.5         |
| speed     | tactical     | 71%           | 89.7%         | 6.5       | 2.5          | 30.6         |
| speed     | random       | 0%            | 6.5%          | 4.53      | 10.21        | 35.9         |
| speed     | offense-only | 0%            | 0%            | 4.14      | 22.5         | 46.3         |
| captain   | tactical     | 37%           | 84.8%         | 6.18      | 2.81         | 32.2         |
| captain   | random       | 0%            | 18.3%         | 3.56      | 8.19         | 36.1         |
| captain   | offense-only | 0%            | 0%            | 6.04      | 22.5         | 48.6         |

## What the policies do

The tactical policy evaluates one card ahead, using only current visible intent and game state. It does not peek at future draws. Random chooses legal cards without planning. Offense-only uses tactical batting decisions and spends no cards on defense. All use the same regular-route preference, reward rankings, deck-size limit, and recovery/upgrade choices. The simulation does not optimize elite routes, shopping, events, or all possible deck combinations.

## Changes informed by this pass

The first draft produced runaway scoring and near-automatic shutouts. Increasing opponent Pitch by one each at-bat and raising enemy Contact created a limited batting window and made defense necessary. Contact and Field reset per at-bat, and exhaust/powers reset per half, preventing permanent accumulation. The Speedster’s first-hit defense was narrowed to extra-base hits, Quick Release was reduced, and Caught Stealing now costs two Energy. The Captain receives one extra Pitch on the first defensive at-bat each half.

All three characters can finish the run with the tactical policy. Ignoring defense fails, and random card play cannot complete a run in this sample. The Speedster remains more forgiving than the Captain; equal character difficulty has not been established.

## Limits and next playtest

Best-of-three series amplify small game-win differences across nine series. Human play should evaluate card order, game length, home-field tie breakers, high-Field decks, and equipment combinations. Routine pop-ups every fourth enemy at-bat intentionally bound defensive innings but may be too predictable. This is a balanced starting point for playtesting, not a claim of final commercial balance.

Run `npm run balance -- 100` to regenerate the raw report. Full per-act results are in `balance-results.json`. The current complete rules are in `DESIGN.md`; the old target-run metrics do not apply.
