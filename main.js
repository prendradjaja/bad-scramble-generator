var Cube = require("cubejs");
var _ = require("lodash");

const TO_GENERATE = 10;

const NUM_EDGES = 12;
const NUM_CORNERS = 8;

function main() {
  console.log("Initializing solver... (This might take a few seconds)");
  Cube.initSolver();

  console.log("Generating scrambles.");
  let generated = 0;
  while (generated < TO_GENERATE) {
    const c = generateCube();
    const solve = getSolve(c);

    if (solve) {
      console.log(Cube.inverse(solve));
      generated++;
    }
  }
}

function generateCube() {
  const c = new Cube();

  // cubejs represents a cube state as EP, EO, CP, and CO (edge/corner permutation/orientation)
  // a solved cube looks like:
  // ep: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  // eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  // cp: [0, 1, 2, 3, 4, 5, 6, 7]
  // co: [0, 0, 0, 0, 0, 0, 0, 0]

  c.ep = generateEdgePermutation();
  c.eo = new Array(NUM_EDGES).fill(null).map(x => _.random());
  c.cp = _.shuffle(c.cp);
  c.co = new Array(NUM_CORNERS).fill(null).map(x => _.random());
  return c;
}

function generateEdgePermutation() {
  let edgesToPermute = new Array(NUM_EDGES).fill(null).map((x, i) => i);
  const cycles = [];

  // Keep a few edges un-permuted by tossing them out.
  const numUnpermuted = weightedRandom({
    0: 3,
    1: 1,
  });
  for (let i = 0; i < numUnpermuted; i++) {
    const indexToRemove = _.random(edgesToPermute.length - 1);
    edgesToPermute.splice(indexToRemove, 1);
  }

  // Group the remaining edges randomly into cycles.
  edgesToPermute = _.shuffle(edgesToPermute);
  while (edgesToPermute.length) {
    const cycleLength = weightedRandom({
      2: 10,
      3: 5,
      4: 1,
    });
    const newCycle = edgesToPermute.splice(0, cycleLength);

    // Once we're at the end, we might end up with a 1-cycle. This doesn't make sense, so just consider it an un-permuted edge and toss it out.
    if (newCycle.length > 1) {
      cycles.push(newCycle);
    }
  }

  // Rearrange the EP array according to the cycles we've chosen.
  const ep = new Array(NUM_EDGES).fill(null).map((x, i) => i);
  for (let cycle of cycles) {
    let shiftedCycle = randomCycleShift(cycle);
    for (let [value, index] of _.zip(cycle, shiftedCycle)) {
      ep[index] = value;
    }
  }

  return ep;
}

/**
 * e.g. given [1, 2, 3], this function could return either of these two values:
 *   [2, 3, 1]
 *   [3, 1, 2]
 *
 * But not:
 *   [1, 2, 3]  The array will always be shifted at least one position.
 *   [3, 2, 1]  The array won't be arbitrarily rearranged, just shifted in a circle.
 *
 * The array given must be at least two items long.
 */
function randomCycleShift(cycle) {
  const offset = _.random(1, cycle.length - 1);
  cycle = cycle.slice(0); // copy
  for (let i = 0; i < offset; i++) {
    cycle.push(cycle.shift());
  }
  return cycle;
}

/**
 * e.g. given { 2: 5, 1: 1 }, this function will return 2 five times as often as 1.
 */
function weightedRandom(ratios) {
  const choices = [];
  for (let key in ratios) {
    for (let i = 0; i < ratios[key]; i++) {
      choices.push(key);
    }
  }
  return +choices[_.random(choices.length - 1)];
}

/**
 * Returns solve if valid cube state, null if not
 */
function getSolve(cube) {
  // cubejs quirk: If the cube state is not valid, it will not give an error. Instead, it will give
  // a solve -- but for a slightly different (but valid) cube state. To check for this, we check
  // after solving that the solve actually corresponds to the given cube.
  const solve = cube.solve();
  const fromSolve = new Cube().move(Cube.inverse(solve));
  if (_.isEqual(fromSolve.toJSON(), cube.toJSON())) {
    return solve;
  } else {
    return null;
  }
}

main();
