# Sloppy Sluggers: current design

Version 0.2 — Two-Way Baseball, September 13, 2026.

This document records the current implemented design. It supersedes the earlier target-run, offense-only prototype. The owner authorized rebuilding the mechanics, replacing every card as needed, and adding enemy art.

## Run structure

There are three acts. Each act contains three best-of-three series: choose a connected opponent on the branching map, play that opponent until either team wins twice, then advance to the next series. The third series is the act championship. Complete nine series to win the run.

One game loss does not end the run. A first loss still grants $15 and a choice of one paired card so the player can address weaknesses. A second loss in the same series ends the run. Series wins and losses reset when advancing to a new opponent. Games 1 and 3 are away; game 2 is at home.

Each series offers regular or elite difficulty where the map branches. Elites receive +1 Pitch and Contact; winning an elite series grants one unowned piece of equipment. Championships are elite. Each act has a villain faction: Scrapyard Bruisers, Nightshift Phantoms and Inferno Kings. Faction artwork distinguishes their opponents; numerical difficulty currently comes from act and elite tier rather than unique faction abilities.

## Match structure

Each game has three innings. Both teams bat once per inning, with three outs ending each half. The player plays offensive faces while batting and defensive faces while pitching. Runs persist for both teams, while bases, outs and half-specific effects reset at the side switch.

The home team can skip the bottom of the third if already ahead. A run that puts the home team ahead in the bottom of the third ends the game immediately. The regular objective is always the score comparison, never a preset target.

## At-bat turns

Each turn is one complete at-bat. Draw five cards, gain three Energy, see the opposing intent, play any affordable cards in any order, then resolve. Unplayed cards go to discard. An empty draw pile reshuffles discard. Hand size is capped at ten. The whole permanent deck reshuffles at each new half, including cards exhausted during the previous half.

Contact, Pitch, Field and Energy reset each at-bat. Next-at-bat bonuses carry once within the same half. Rhythm persists within its half, does not stack and ends at the side switch. Effects and text come from the same card data.

### Offense

Cards add Contact, advance runners, set up a later at-bat, or force a walk/sacrifice. Meeting the enemy Pitch yields a single. Each two extra Contact add a base: margin 0–1 single, 2–3 double, 4–5 triple, 6+ home run. A negative margin is an out. Character perks can modify the final hit distance; the prediction bar includes them.

The opponent's base Pitch is 4 + (act − 1) + elite bonus, with a telegraphed pitch variation of 0, 1 or 2. Scouting adds one Pitch for each previous at-bat in that half. This prevents farming an unlimited offensive inning and creates a narrowing scoring window. Scouting resets every half and is disabled in the showdown.

### Defense

Cards add Pitch or Field, prepare later at-bats, force an intentional walk, or set up a double play/pickoff.

Remaining Contact = enemy Contact − player Pitch. Hit distance is ceil(remaining Contact / 2), capped at four and then reduced by Field. Zero or fewer bases is an out. Risk adds one base to a hit that gets through. Character and glove reductions apply afterward. The prediction bar displays the final outcome.

Enemy Contact is 7 + a visible variation of 0–3 + 2 × (act − 1) + elite bonus. Every fourth regular enemy at-bat is a routine pop-up (Contact 0), ensuring the inning progresses even with poor defensive draws and offering a setup opportunity. Showdowns instead use Contact 8 + 2 × (act − 1) + elite bonus, with no routine pop-up.

### Baserunning and outs

Hits advance every runner by their distance and then place the batter. A home run clears the bases and scores the batter. A walk moves only forced runners. Advance effects can score from third and cannot overwrite an occupied base. These rules are shared by both teams.

A pickoff removes the lead runner and records an out. Turn Two removes a runner on first and records a second out if the batter is retired; outs stop at three. Sacrifice advances resolve only with fewer than two outs. It forces the current at-bat to be an out; a later walk effect can replace the forced outcome. Ordinary advance cards act immediately.

## Sudden-death showdown

If the game is tied after three innings, each side gets one at-bat with bases loaded and a fresh deck. The same home/away order is used. More runs after both at-bats wins. If runs are tied, compare each team's Contact margin: player Contact minus enemy Pitch versus enemy Contact minus player Pitch. A higher margin wins. An exact margin tie goes to the home team. The rule is shown in the game and help screen; there is no hidden coin flip or repeated extra inning.

A showdown can therefore produce a winner with a tied numerical score, resolved by the published margin rule.

## Paired deck design

There are 27 permanent card pairs (54 faces). Each character starts with 12 cards: four Find the Gap/Fastball, two Short Swing/Cover the Gap, two Line Drive/Changeup, one Hustle/Quick Hands, and three signature cards.

Pairs deliberately vary in offensive and defensive strength. Leave the Yard is a three-Energy offensive power play with a weak Emergency Toss reverse. Strikeout Stuff and At the Wall provide stronger defensive effects paired with modest batting faces. Other pairs offer flexible setups at lower peak strength.

The active face is selected by the half-inning. Costs can differ by face. One upgrade improves both faces using values alongside each base effect. Rewards, shops and deck inspection display both faces. In combat, the active face shows its effects, with the reverse name and cost below; D opens full paired inspection.

See CARDS.md for the complete data-derived catalog.

## Characters

- Dean Kean: first offensive hit each half travels one extra base; first defensive at-bat starts with one extra Pitch. Strong Contact and sinker cards reward power play.
- The Speedster: after the first single each half, advance the lead runner one base; reduce the first enemy extra-base hit each half by one base. Bunt/Quick Release and Green Light/Caught Stealing support baserunning and runner control.
- The Captain: draw one extra card at the start of each half; first defensive at-bat also starts with one extra Pitch. Study and setup cards support sequencing and draw consistency.

## Between games

Regular wins grant $25; elite wins $35; losses $15. Every nonterminal game offers three paired card rewards, take one or skip. Choose one dugout stop afterward: rest, training, shop or event. These are available after a loss as well as a win.

Games cost ten stamina. Below 30 stamina, draw four cards instead of five; Energy remains three. Rest recovers 28, training recovery gives 16, and entering a new act recovers 25. Rest or training can instead upgrade one pair. The shop sells pairs for $40, gear for $65, recovery for $20 and one card removal for $35; deck size cannot drop below eight.

## Save compatibility and presentation

The original version-1 save is preserved under its own key. Version-2 saves include the whole active match, series record, act, route, deck and random generator. Refreshing does not reroll draws or switch opponents.

Player identity, yellow jerseys and red trim are retained. Three new player pitching sprites and three villains with pitching/batting forms swap according to the half. Original art is preserved separately. All new images are flattened transparent PNGs; there are no animation sheets or invented editable layers.

## Playtest questions

Measure game length in human sessions, particularly across nine series. Check whether current free routine pop-ups are too predictable, whether Contact-margin showdowns feel fair, and whether defensive specialists or specific relic combinations make later acts too easy. Automated results are evidence for a baseline, not proof of final balance.
