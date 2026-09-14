# Sloppy Sluggers: terms and controls

## The numbers that matter

| Term                   | Meaning                                                                                                                                                                                                                                   |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Contact**            | Batting power for this at-bat. On offense, reach the enemy’s Pitch strength to get a hit.                                                                                                                                                 |
| **Pitch**              | Pitching strength, not a count of individual pitches. On defense it subtracts from enemy Contact.                                                                                                                                         |
| **Field**              | Fielding support. Each point removes one base from the enemy’s predicted hit after Pitch is applied. Zero bases means an out.                                                                                                             |
| **Energy**             | The resource you spend to play cards. You normally start each at-bat with 3. The number in a card’s corner is its cost.                                                                                                                   |
| **Pitcher adjustment** | Previously labeled “Scouting.” The enemy gains +1 Pitch after each batter faced in your offensive half. “Adjustment +1” is already included in the displayed Pitch total. It resets when sides switch. No adjustment during sudden death. |

“5 Contact” means five points of batting power. There is no “S Contact” stat—the old pixel font made 5 difficult to read. “7 Pitch” means seven pitching strength, not seven pitches. Number and effect text now use a clearer font.

## Reading an at-bat

**On offense:** your Contact minus enemy Pitch determines the hit. A negative result is an out; 0–1 is a single; 2–3 a double; 4–5 a triple; 6 or more a home run. For example, 9 Contact against 7 Pitch gives a double before perks.

**On defense:** subtract your Pitch from enemy Contact, divide the remaining positive Contact by 2 and round up, capped at four hit bases. Then subtract Field. For example, 7 enemy Contact against your 3 Pitch leaves 4 Contact: a double. Add 1 Field and it becomes a single; 2 Field makes it an out. Character perks and special cards can change this result.

The **If you resolve** bar includes active perks and card effects. It is the best place to check your next outcome. Cards can also move or score runners immediately. Playing a card normally prepares the at-bat; the **Swing / Resolve** or **Pitch / Resolve** button completes it.

Contact, Pitch, Field and unused Energy reset each at-bat. Effects explicitly marked **next at-bat** carry once. **Rhythm** lasts for the current half-inning.

## Your deck

- **Paired card:** one fixed offense face and one fixed defense face. The active half decides which face you play and how much it costs. Rewards and the full deck show both faces; your hand and piles show the current face only.
- **Draw:** add cards from your draw pile to your hand. Discard reshuffles when the draw pile runs out. The hand holds up to 10 cards.
- **Discard:** played cards and cards left in your hand after an at-bat. These can return when the draw pile reshuffles.
- **Exhaust this half:** set a card aside until the next half-inning. It returns with the full deck when sides switch.
- **Upgrade:** permanently improve both faces of a card. Each pair can be upgraded once.
- **Signature pair:** a card associated with your chosen character.
- **Equipment:** passive bonuses that do not take up space in your deck.

## Baseball and run progression

- **At-bat:** one turn. Draw cards, spend Energy, then resolve a hit or out. Balls and strikes do not carry across turns.
- **Half-inning:** one team bats until three outs. Bases clear when sides switch.
- **Inning:** both teams get a half-inning. Each game lasts three innings, subject to the home-team ending rules.
- **Runs:** your score. Move a runner past third base to bring them home.
- **Walk:** put the batter on first, advancing only runners who are forced forward.
- **Sacrifice:** an out that advances runners when fewer than two outs are recorded. The third out cannot score sacrifice runs.
- **Double play:** two outs when an eligible runner is on first and the batter is put out.
- **Pickoff:** remove a runner and record an out immediately.
- **Home / away:** you are home in game 2 and away in games 1 and 3. The home team bats second and can win on a walk-off or skip its final half if already ahead.
- **Series:** best of three against the same opponent. Two wins advance; two losses in that series end your run. Game 3 is skipped after a 2–0 result.
- **Act:** three series with branching opponent choices. Complete three acts to win the run.
- **Map stops:** after each surviving game, choose or skip a card reward, then select a connected rest, training, shop or event node on the map. Finishing the stop returns you to the map and unlocks the next game node. After a clinched series, its final stop opens the next opponent routes.
- **Elite:** a stronger opponent with +1 Pitch and Contact. Winning their series awards equipment if any remains available.
- **Stamina:** drops by 10 when a game starts. Below 30, draw 4 cards instead of 5. Rest recovers 28; training can recover 16; a new act restores 25, up to 100.
- **Sudden-death showdown:** a tie after three innings gives each team one bases-loaded at-bat. More runs wins. Tied runs compare Contact margins (batting Contact minus opposing Pitch); an exact tie goes to the home team.

## Controls

Drag an affordable card from your hand onto the highlighted field and release to play it. Drop outside the field or press Escape to cancel without spending Energy. Clicking a card or pressing 1–9 still plays it. On touch screens, drag directly from a card; use the gaps around cards to scroll the hand.

Press Space to resolve or switch sides when a button is not focused. Press D to inspect both faces of your deck. Use the ? button for rules. The field mirrors at each side change so your character stays on the left; sprites and ground positions scale together. Reduced-motion preferences disable the flip animation.
