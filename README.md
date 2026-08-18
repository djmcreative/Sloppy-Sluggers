# Sloppy Sluggers

A baseball deck-building roguelike. Runs in the browser, no install.

**You are the batter. Score 6 runs before the pitcher gets 3 outs.**

---

## The one idea that makes it click

In most deck-builders you whittle an enemy's health down to zero. Here you
don't damage the pitcher at all. He isn't a health bar — **he's a clock.**

- **You** are trying to score runs.
- **He** is trying to run out of time on you by stacking up strikes.

So the question every turn isn't "how much damage can I deal," it's "can I
score before he retires me." Both of you are racing. Neither of you can hurt
the other directly.

---

## What the numbers on screen mean

| On screen | What it is |
|---|---|
| **RUNS 0/6** | Your score, and what you need. Hit 6 and you win the inning. |
| **B** | Balls. Get to 4 and you walk — free runner on 1st. |
| **S** | Strikes. Get to 3 and that's an out. |
| **O** | Outs. **Three outs and the run is over.** This is your health bar. |
| **The diamond** | Who's on base. Runners stay put between turns. |
| **The baseball, bottom left** | Energy. Refills every turn. Every card costs some. |
| **INNING 1/9** | How far through the run you are. |
| **Stamina** | Fuel for the whole run — see below. |

The card the pitcher is about to throw is shown **before you act**, next to
him. You always know what's coming; the decision is what to do about it.

---

## How a turn works

1. You get **3 energy** and a hand of **5 cards** (4 when Tired).
2. Play cards by **dragging them up onto the field**. They cost energy.
3. Hit **End Turn**.
4. The pitcher throws the pitch he was showing. Any strikes land now.
5. Repeat until you score 6 runs, or he gets 3 outs.

---

## The vocabulary

**Protect** — the important one, and the least obvious. Protect cancels
incoming strikes, one for one. Gain 2 Protect and a 2-strike pitch does
nothing. **It resets to zero at the end of every turn**, so it is not a
shield you build up — it's spent or wasted each turn. This is "Block" if
you've played Slay the Spire.

**Single / Double / Triple / Homer** — advance every runner on base that
many bases, and put yourself on. Runners who cross home plate score.

**Steal** — move a runner up one base without hitting anything.
**Pickoff** — catch a runner in scoring position. That's an out.

**Strike / Ball** — some cards give *you* strikes or balls as a cost or a
benefit. A strike is bad. A ball is good (4 balls = free baserunner).

**Junk** — dead cards the Curveball shuffles into your deck. They do
nothing and **stay in your deck for the rest of the run.** Every Curveball
you eat makes every future hand slightly worse.

**Exhaust** — the card is removed for the rest of the inning after use.

**Settled In** — every 3 turns, the pitcher's strike pitches get +1. Long
innings get dangerous. **Dialed In** is a one-off +1 on his next pitch.

---

## Stamina, and why running out doesn't kill you

Stamina is **fuel, not health.** It starts at 100 and drains across the run:

| | |
|---|---|
| Each inning played | −10 |
| Each out he gets on you | −4 |
| Off day (after innings 3 and 6) | +25 |

At **40 or above** you're Fresh: 5 cards a turn.
**Below 40** you're Tired: 4 cards a turn.

That's the whole penalty — a smaller hand, never less energy. Hitting zero
stamina doesn't end anything. You still only lose by getting retired, so the
loss condition stays clean. It just means you arrive at the 9th inning
short-handed, which is the point.

Off days give back 25, never a full reset, so the drain is one-directional.

---

## The pitch mix

He telegraphs everything. This is what he can throw:

| Pitch | Effect |
|---|---|
| **Fastball** | 1 strike. Plain. |
| **High Heat** | 2 strikes. Takes 2 Protect to absorb. |
| **Painted Corner** | 1 strike, and **Protect can't stop it.** |
| **Curveball** | 1 strike, and shuffles Junk into your deck permanently. |
| **Waste Pitch** | No strike. You gain a ball, he gains Dialed In. |
| **Pickoff** | Aimed at your runner in scoring position. |
| **Turn Two** | Erases your two lead runners. |

The last two only show up when you have runners on — the board state is
something he attacks directly, not just decoration.

---

## The three characters

| | Style |
|---|---|
| **Dean Kean** | Power. Extra-base hits, but he pays for them in strikes. |
| **Speedster** | Small ball. Bunts, steals, sacrifices, manufactured runs. |
| **All-Purpose** | Value and scaling. Flexible cards that grow over a run. |

Each has a 15-card starting deck unique to them, and a separate pool of
rewards they draw from. After each inning you pick 1 of 3 new cards, and
your deck carries forward for the whole run.

---

## Known rough edges

This is an early build and the balance is openly broken:

- **All-Purpose is far too strong**, **Speedster is far too weak.** Simulated
  act win rates run roughly 85% vs 7%.
- **Offense beats defense.** With 9 strikes of capacity against a ~6-turn
  inning, the pitcher only threatens about 7 strikes, so Protect is
  optional. That's a card-design problem, not a tuning one.
- Not built yet: the branching map, relics, shops, events, pitcher tiers
  beyond the starter, and acts 2 and 3.

Desktop browser only for now — the layout doesn't fit a phone yet.
