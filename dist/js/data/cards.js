// Effects are small, ordered commands interpreted by the battle engine.
// Upgrade values live beside the base values so copy and rules share one source.
const effect = (op, amount = 1, upgraded = amount) => ({ op, amount, upgraded });
const card = (name, cost, type, icon, effects, extra = {}) => ({
  name,
  cost,
  type,
  icon,
  effects,
  ...extra,
});
export const CARDS = {
  contact: card('Find the Gap', 1, 'hit', 'glove', [effect('hit', 1, 2)], { starter: true }),
  spoil: card('Spoil It', 1, 'skill', 'shield', [effect('block', 2, 3)], { starter: true }),
  eye: card('Good Eye', 0, 'skill', 'crosshair', [effect('ball', 1, 2)], {
    exhaust: true,
    starter: true,
  }),
  hustle: card('Hustle', 1, 'skill', 'cleats', [effect('advance', 1), effect('block', 1, 2)], {
    starter: true,
  }),
  drive: card('Line Drive', 2, 'hit', 'fastball', [effect('hit', 2, 3)], { starter: true }),
  muscle: card('Muscle Up', 1, 'hit', 'dumbell', [effect('hit', 2, 3), effect('strike', 1)], {
    class: 'dean',
  }),
  load: card('Load Up', 0, 'skill', 'batting gloves', [effect('focus', 1, 2)], {
    exhaust: true,
    class: 'dean',
  }),
  bunt: card('Drag Bunt', 1, 'hit', 'dust cloud', [effect('hit', 1), effect('block', 1, 2)], {
    class: 'speed',
  }),
  steal: card('Green Light', 0, 'skill', 'cleats', [effect('advance', 1, 2)], {
    exhaust: true,
    class: 'speed',
  }),
  study: card(
    'Study the Pitch',
    1,
    'skill',
    'crosshair',
    [effect('block', 2, 3), effect('draw', 1)],
    { class: 'captain' },
  ),
  patient: card(
    'Wait for Yours',
    0,
    'skill',
    'sunflower seeds',
    [effect('ball', 1), effect('focus', 1, 2)],
    { exhaust: true, class: 'captain' },
  ),
  double: card('Alley Ball', 1, 'hit', 'fastball', [effect('hit', 2, 3)]),
  homer: card('Leave the Yard', 3, 'hit', 'high heat', [effect('hit', 4), effect('block', 0, 1)]),
  sacrifice: card(
    'Productive Out',
    0,
    'skill',
    'up arrow',
    [effect('advanceAll', 2, 3), effect('out', 1)],
    { exhaust: true },
  ),
  protect: card('Protect the Plate', 1, 'skill', 'shield', [effect('block', 3, 4)]),
  battle: card('Long At-Bat', 1, 'skill', 'glove', [effect('block', 2, 3), effect('ball', 1)]),
  reset: card('Step Out', 1, 'skill', 'rosin bag', [effect('clear', 1, 2), effect('draw', 1)], {
    exhaust: true,
  }),
  squeeze: card('Squeeze Play', 1, 'skill', 'cleats', [
    effect('advanceAll', 1, 2),
    effect('block', 1),
  ]),
  dig: card('Dig Deep', 0, 'skill', 'energy drink', [effect('energy', 1), effect('draw', 1, 2)], {
    exhaust: true,
  }),
  rally: card('Two-Out Rally', 1, 'hit', 'rally cap', [effect('clutch', 1, 2)]),
  discipline: card('Plate Discipline', 1, 'power', 'sunflower seeds', [effect('discipline', 1)], {
    exhaust: true,
    upgradeCost: 0,
    limit: 1,
  }),
  rhythm: card('Find a Rhythm', 1, 'power', 'batting gloves', [effect('rhythm', 1)], {
    exhaust: true,
    upgradeCost: 0,
    limit: 1,
  }),
  fireworks: card(
    'Warning Track',
    2,
    'hit',
    'high heat',
    [effect('hit', 3, 4), effect('strike', 1)],
    { class: 'dean' },
  ),
  chin: card(
    'Take It on the Chin',
    0,
    'skill',
    'shield',
    [effect('strike', 1), effect('block', 3, 4)],
    { class: 'dean' },
  ),
  payoff: card('Payoff Pitch', 2, 'hit', 'dumbell', [effect('payoff', 2, 3)], { class: 'dean' }),
  wheels: card('Extra Gear', 1, 'skill', 'cleats', [effect('advanceAll', 2, 3)], {
    class: 'speed',
  }),
  slash: card(
    'Slash & Dash',
    2,
    'hit',
    'dust cloud',
    [effect('hit', 1), effect('advanceAll', 1, 2)],
    { class: 'speed' },
  ),
  insurance: card(
    'Safety Squeeze',
    1,
    'skill',
    'pickoff',
    [effect('advance', 1), effect('block', 2, 3)],
    { class: 'speed' },
  ),
  work: card(
    'Work the Count',
    1,
    'skill',
    'crosshair',
    [effect('ball', 2, 3), effect('block', 1)],
    { class: 'captain' },
  ),
  opposite: card('Other Way', 1, 'hit', 'glove', [effect('hit', 1, 2), effect('draw', 1)], {
    class: 'captain',
  }),
  read: card(
    'Read the Seams',
    1,
    'skill',
    'curveball',
    [effect('focus', 1, 2), effect('block', 2)],
    { class: 'captain' },
  ),
  junk: card('Bad Read', 99, 'status', 'curveball', [], { unplayable: true }),
};

export function definition(instance) {
  const base = CARDS[instance.id];
  return {
    ...base,
    cost: instance.upgraded ? (base.upgradeCost ?? base.cost) : base.cost,
    name: base.name + (instance.upgraded ? '+' : ''),
    effects: base.effects.map((e) => ({
      op: e.op,
      amount: instance.upgraded ? e.upgraded : e.amount,
    })),
  };
}

const sentences = {
  hit: (n) => ['', 'Single.', 'Double.', 'Triple.', 'Home run.'][Math.min(4, n)],
  block: (n) => `Gain ${n} Foul.`,
  ball: (n) => `Gain ${n} Ball${n === 1 ? '' : 's'}.`,
  advance: (n) => `Advance your lead runner ${n} base${n === 1 ? '' : 's'}.`,
  advanceAll: (n) => `Advance ALL runners ${n} base${n === 1 ? '' : 's'}.`,
  strike: (n) => `Take ${n} Strike.`,
  out: (n) => `Take ${n} Out.`,
  focus: (n) => `Next hit travels +${n} base${n === 1 ? '' : 's'}.`,
  draw: (n) => `Draw ${n}.`,
  energy: (n) => `Gain ${n} Energy.`,
  clear: (n) => `Remove ${n} Strike${n === 1 ? '' : 's'}.`,
  clutch: (n) => `${n === 1 ? 'Single' : 'Double'}. With 2 outs: home run.`,
  payoff: (n) => `${n === 2 ? 'Double' : 'Triple'}. At 2 strikes: home run.`,
  discipline: () => 'Gain 1 Foul each turn. Once per inning.',
  rhythm: () => 'First hit each turn gains 1 Foul. Once per inning.',
};
export function description(instance) {
  const c = definition(instance);
  if (c.unplayable) return 'Unplayable. Leaves your deck after this inning.';
  return c.effects
    .filter((e) => e.amount)
    .map((e) => sentences[e.op](e.amount))
    .join(' ');
}
export const rewardPool = (character) =>
  Object.keys(CARDS).filter((id) => {
    const c = CARDS[id];
    return !c.starter && !c.unplayable && (!c.class || c.class === character);
  });
