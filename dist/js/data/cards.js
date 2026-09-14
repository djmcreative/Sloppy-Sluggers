// A physical card has two fixed faces; upgrades improve both together.
const e = (op, amount, upgraded = amount) => ({ op, amount, upgraded });
const face = (name, cost, icon, effects, exhaust = false) => ({
  name,
  cost,
  icon,
  effects,
  exhaust,
});
const pair = (offense, defense, extra = {}) => ({ offense, defense, ...extra });
export const CARDS = {
  contact: pair(
    face('Find the Gap', 1, 'fastball', [e('contact', 2, 3)]),
    face('Fastball', 1, 'fastball', [e('pitch', 2, 3)]),
    { starter: true },
  ),
  cover: pair(
    face('Short Swing', 1, 'glove', [e('contact', 1, 2), e('draw', 1)]),
    face('Cover the Gap', 1, 'glove', [e('field', 1, 2)]),
    { starter: true },
  ),
  drive: pair(
    face('Line Drive', 2, 'high heat', [e('contact', 5, 6)]),
    face('Changeup', 1, 'curveball', [e('pitch', 1, 2), e('draw', 1)]),
    { starter: true },
  ),
  hustle: pair(
    face('Hustle', 1, 'cleats', [e('contact', 1, 2), e('advance', 1)]),
    face('Quick Hands', 1, 'pickoff', [e('pitch', 1, 2), e('field', 1)]),
    { starter: true },
  ),
  muscle: pair(
    face('Muscle Up', 2, 'dumbell', [e('contact', 6, 7)]),
    face('Heavy Sinker', 2, 'high heat', [e('pitch', 4, 5), e('doubleplay', 1)]),
    { class: 'dean' },
  ),
  load: pair(
    face('Load Up', 0, 'batting gloves', [e('contact', 2, 3)], true),
    face('Reach Back', 0, 'rosin bag', [e('pitch', 2, 3)], true),
    { class: 'dean' },
  ),
  bunt: pair(
    face('Drag Bunt', 1, 'dust cloud', [e('contact', 2, 3), e('advance', 1)]),
    face('Quick Release', 1, 'cleats', [e('pitch', 1, 2), e('draw', 1)]),
    { class: 'speed' },
  ),
  steal: pair(
    face('Green Light', 0, 'cleats', [e('advance', 1, 2)], true),
    face('Caught Stealing', 2, 'pickoff', [e('pickoff', 1)], true),
    { class: 'speed' },
  ),
  study: pair(
    face('Read the Seams', 1, 'crosshair', [e('contact', 2, 3), e('draw', 1)]),
    face('Paint the Corner', 1, 'paintbursh', [e('pitch', 2, 3), e('draw', 1)]),
    { class: 'captain' },
  ),
  patient: pair(
    face('Take Your Time', 0, 'sunflower seeds', [e('focus', 2, 3), e('draw', 1)], true),
    face('Scout the Batter', 0, 'crosshair', [e('aim', 2, 3), e('draw', 1)], true),
    { class: 'captain' },
  ),
  double: pair(
    face('Alley Ball', 1, 'fastball', [e('contact', 3, 4)]),
    face('Off-Speed', 1, 'curveball', [e('pitch', 1, 2)]),
  ),
  homer: pair(
    face('Leave the Yard', 3, 'high heat', [e('contact', 9, 11)]),
    face('Emergency Toss', 1, 'fastball', [e('pitch', 1, 2)]),
  ),
  wall: pair(
    face('Choke Up', 1, 'batting gloves', [e('contact', 1, 2)]),
    face('At the Wall', 2, 'glove', [e('field', 3, 4)]),
  ),
  ace: pair(
    face('Pitcher’s Bat', 1, 'glove', [e('contact', 1, 2)]),
    face('Strikeout Stuff', 2, 'high heat', [e('pitch', 6, 7)]),
  ),
  sacrifice: pair(
    face('Sacrifice Fly', 0, 'up arrow', [e('sacrifice', 1, 2)], true),
    face('Turn Two', 1, 'double play', [e('pitch', 2, 3), e('doubleplay', 1)]),
  ),
  walk: pair(
    face('Work a Walk', 2, 'sunflower seeds', [e('walk', 1)], true),
    face('Pitch Around', 0, 'crosshair', [e('walk', 1), e('aim', 3, 4)], true),
  ),
  rally: pair(
    face('Two-Out Rally', 1, 'rally cap', [e('clutch', 2, 3)]),
    face('Finish the Inning', 1, 'rally cap', [e('closer', 2, 3)]),
  ),
  squeeze: pair(
    face('Squeeze Play', 1, 'cleats', [e('contact', 1, 2), e('advanceAll', 1)]),
    face('Infield In', 1, 'glove', [e('field', 2, 3)]),
  ),
  dig: pair(
    face('Dig Deep', 0, 'energy drink', [e('energy', 1), e('draw', 1, 2)], true),
    face('Second Wind', 0, 'energy drink', [e('energy', 1), e('draw', 1, 2)], true),
  ),
  rhythm: pair(
    face('Find a Rhythm', 1, 'batting gloves', [e('rhythm', 1)], true),
    face('Settle In', 1, 'rosin bag', [e('rhythm', 1)], true),
    { limit: 1 },
  ),
  gamble: pair(
    face('Swing for It', 1, 'dumbell', [e('contact', 4, 5), e('risk', 1)]),
    face('Challenge Him', 1, 'high heat', [e('pitch', 4, 5), e('risk', 1)]),
  ),
  reset: pair(
    face('Step Out', 0, 'rosin bag', [e('draw', 2, 3)], true),
    face('Mound Visit', 0, 'rosin bag', [e('draw', 2, 3)], true),
  ),
  opposite: pair(
    face('Other Way', 1, 'glove', [e('contact', 2, 3), e('focus', 1)]),
    face('Backdoor Slider', 1, 'curveball', [e('pitch', 2, 3), e('aim', 1)]),
  ),
  loaded: pair(
    face('Bases Juiced', 2, 'high heat', [e('loaded', 3, 4)]),
    face('Pressure Pitch', 2, 'fastball', [e('pressure', 3, 4)]),
  ),
  fireworks: pair(
    face('Warning Track', 2, 'high heat', [e('contact', 7, 8), e('risk', 1)]),
    face('Bulldog', 1, 'dumbell', [e('pitch', 3, 4)]),
    { class: 'dean' },
  ),
  wheels: pair(
    face('Extra Gear', 1, 'cleats', [e('advanceAll', 1, 2), e('contact', 1)]),
    face('Range for Days', 1, 'dust cloud', [e('field', 2, 3), e('draw', 1)]),
    { class: 'speed' },
  ),
  work: pair(
    face('Perfect Read', 2, 'crosshair', [e('contact', 4, 5), e('draw', 2)]),
    face('Call the Game', 2, 'crosshair', [e('pitch', 4, 5), e('draw', 2)]),
    { class: 'captain' },
  ),
};
export function definition(instance, side = 'offense') {
  const pair = CARDS[instance.id];
  if (!pair || !pair[side]) throw new Error(`Unknown card or side: ${instance.id}/${side}`);
  const base = pair[side];
  return {
    ...base,
    class: pair.class,
    type: side === 'offense' ? 'hit' : 'skill',
    name: base.name + (instance.upgraded ? '+' : ''),
    side,
    effects: base.effects.map((e) => ({
      op: e.op,
      amount: instance.upgraded ? e.upgraded : e.amount,
    })),
  };
}
const sentences = {
  contact: (n) => `Gain ${n} Contact.`,
  pitch: (n) => `Gain ${n} Pitch.`,
  field: (n) => `Gain ${n} Field.`,
  draw: (n) => `Draw ${n}.`,
  energy: (n) => `Gain ${n} Energy.`,
  advance: (n) => `Advance your lead runner ${n} base${n === 1 ? '' : 's'}.`,
  advanceAll: (n) => `Advance all runners ${n} base${n === 1 ? '' : 's'}.`,
  focus: (n) => `Next at-bat: +${n} Contact.`,
  aim: (n) => `Next at-bat: +${n} Pitch.`,
  sacrifice: (n) =>
    `This at-bat is an out. With fewer than 2 outs, advance all runners ${n} when it resolves.`,
  walk: () => 'This at-bat ends in a walk.',
  doubleplay: () => 'If this at-bat is an out, also retire a runner on first.',
  pickoff: () => 'Retire the lead runner, if any.',
  clutch: (n) => `Gain ${n} Contact; at 2 outs, gain ${n + 3} instead.`,
  closer: (n) => `Gain ${n} Pitch; at 2 outs, gain ${n + 3} instead.`,
  rhythm: (_, side) =>
    `+1 ${side === 'offense' ? 'Contact' : 'Pitch'} each at-bat this half. Does not stack.`,
  risk: (_, side) =>
    side === 'offense' ? 'Failed swing: lose a lead runner too.' : 'Hit allowed: +1 base.',
  loaded: (n) => `Gain ${n} Contact, plus 1 per runner.`,
  pressure: (n) => `Gain ${n} Pitch, plus 1 per enemy runner.`,
};
export function description(instance, side = 'offense') {
  return definition(instance, side)
    .effects.map((e) => sentences[e.op](e.amount, side))
    .join(' ');
}
export const rewardPool = (character) =>
  Object.keys(CARDS).filter(
    (id) => !CARDS[id].starter && (!CARDS[id].class || CARDS[id].class === character),
  );
