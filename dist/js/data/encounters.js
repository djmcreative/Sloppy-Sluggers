export const PITCHERS = [
  { name: 'The Rookie', title: 'ALL NERVES. LIVE ARM.', art: 'Enemy', style: 'heat' },
  { name: 'Junkball Jerry', title: 'NOTHING COMES IN STRAIGHT.', art: 'Enemy', style: 'junk' },
  { name: 'The Southpaw', title: 'A DIFFERENT KIND OF TROUBLE.', art: 'Enemy', style: 'control' },
  { name: 'Big League Lou', title: 'HE KNOWS YOU WANT TO SWING.', art: 'Elite', style: 'heat' },
  { name: 'The Groundskeeper', title: 'WATCH YOUR RUNNERS.', art: 'Elite', style: 'runners' },
  { name: 'The Setup Man', title: 'THE LIGHTS GET BRIGHTER.', art: 'Elite', style: 'control' },
  { name: 'The Closer', title: 'LAST INNING. NO TOMORROW.', art: 'Closer', style: 'closer' },
];
export const RELICS = {
  cap: { name: 'Rally Cap', icon: 'rally cap', text: 'First out each inning: draw 2 cards.' },
  gloves: {
    name: 'Batting Gloves',
    icon: 'batting gloves',
    text: 'Start each inning with +1 base on your next hit.',
  },
  rosin: {
    name: 'Lucky Rosin',
    icon: 'rosin bag',
    text: 'Gain 1 Foul at the start of every inning.',
  },
  drink: {
    name: 'Energy Drink',
    icon: 'energy drink',
    text: 'Your first turn each inning has 4 Energy.',
  },
  cleats: {
    name: 'Lucky Cleats',
    icon: 'cleats',
    text: 'Start every inning with a runner on first.',
  },
  glove: {
    name: 'Old Glove',
    icon: 'glove',
    text: 'The first Pickoff or Turn Two each inning is canceled.',
  },
};
export const PITCHES = {
  fastball: {
    name: 'Fastball',
    strikes: 2,
    icon: 'fastball',
    text: 'Strikes arrive when you end your turn.',
  },
  heat: {
    name: 'High Heat',
    strikes: 3,
    icon: 'high heat',
    text: 'A hard pitch. Foul protects your count.',
  },
  curve: {
    name: 'Curveball',
    strikes: 1,
    icon: 'curveball',
    junk: true,
    text: 'Adds a temporary Bad Read to your draw pile.',
  },
  corner: {
    name: 'Painted Corner',
    strikes: 1,
    icon: 'paintbursh',
    pierce: true,
    text: 'Ignores Foul. Consider clearing your count or scoring now.',
  },
  waste: {
    name: 'Waste Pitch',
    strikes: 0,
    icon: 'crosshair',
    balls: 2,
    text: 'Gain 2 balls. A chance to swing freely.',
  },
  pickoff: {
    name: 'Pickoff',
    strikes: 1,
    icon: 'pickoff',
    runners: 1,
    text: 'Removes the lead runner after strikes. Score them first.',
  },
  two: {
    name: 'Turn Two',
    strikes: 1,
    icon: 'double play',
    runners: 2,
    text: 'Removes two lead runners after strikes. Does not add outs.',
  },
};
