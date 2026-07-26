// The pitcher and the pitches he throws.
//
// "weight" is how likely a pitch is - higher means it comes up more often.
// "fromTurn" keeps a pitch out of the early game.
// Some pitches are reactive: he only calls them when you give him a reason to.

var PITCHES = {

  fastball: {
    name: "Fastball",
    strikes: 1,
    weight: 5,
    description: "1 Strike. Foul it off or let the count grow."
  },

  high_heat: {
    name: "High Heat",
    strikes: 2,
    weight: 3,
    fromTurn: 2,
    description: "2 Strikes. Takes two Fouls to spoil."
  },

  painted_corner: {
    name: "Painted Corner",
    strikes: 1,
    weight: 2,
    ignoresFoul: true,
    description: "1 Strike on the black. Foul can't touch it."
  },

  curveball: {
    name: "Curveball",
    strikes: 1,
    weight: 3,
    addsJunk: true,
    description: "1 Strike, and shuffles Junk into your draw pile."
  },

  waste_pitch: {
    name: "Waste Pitch",
    strikes: 0,
    weight: 2,
    dialsIn: true,
    description: "No strikes. You gain 1 Ball, but he gets Dialed In (+1 Strike next pitch)."
  },

  // reactive - only when you have a runner in scoring position
  pickoff: {
    name: "Pickoff",
    strikes: 0,
    weight: 0,
    picksOff: true,
    description: "He throws over. Your lead runner gets sent back a base."
  },

  // reactive - only when you have two or more runners on
  turn_two: {
    name: "Turn Two",
    strikes: 1,
    weight: 0,
    doublePlay: true,
    description: "1 Strike. If you still have 2 runners on when this lands, your two lead runners are erased."
  }

};

var PITCHER = {
  name: "The Starter",
  runsToWin: 6,
  rampEvery: 3,        // he gets +1 to his pitches this often
  pickoffChance: 0.35,
  doublePlayChance: 0.45
};

// Decide what he throws next.
function choosePitch(state) {
  var runnersOn = 0;
  for (var i = 0; i < state.bases.length; i++) {
    if (state.bases[i]) runnersOn++;
  }

  // he plays the situation first
  if (runnersOn >= 2 && Math.random() < PITCHER.doublePlayChance) {
    return PITCHES.turn_two;
  }
  if (Game.inScoringPosition() && Math.random() < PITCHER.pickoffChance) {
    return PITCHES.pickoff;
  }

  // otherwise pick a normal pitch, weighted
  var options = [];
  for (var key in PITCHES) {
    var pitch = PITCHES[key];
    if (pitch.weight <= 0) continue;
    if (pitch.fromTurn && state.turn < pitch.fromTurn) continue;
    options.push(pitch);
  }

  var total = 0;
  for (var j = 0; j < options.length; j++) {
    total += options[j].weight;
  }

  var roll = Math.random() * total;
  for (var k = 0; k < options.length; k++) {
    roll -= options[k].weight;
    if (roll <= 0) return options[k];
  }

  return options[0];
}
