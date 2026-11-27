// shots.js — deterministic states for screenshots (?shot=start | play |
// kitchen | end). Each one sets the whole game up at a fixed, readable
// moment and freezes it, so the screenshots are stable and legible even
// when shrunk to a contact sheet.
import { CONFIG } from './config.js';
import { createWorld, initScenery, stageIndexFor } from './world.js';
import { createHazards, spawnHazard } from './hazards.js';
import { createTurkey } from './turkey.js';
import { createFarmer } from './farmer.js';

function baseState(seed) {
  const world = createWorld(seed);
  initScenery(world);
  const state = {
    mode: 'play',
    result: null,
    score: 0,
    corn: 0,
    lives: 3,
    best: 1240,
    stageIndex: 0,
    turkey: createTurkey(),
    farmer: createFarmer(),
    world,
    hazards: createHazards(),
    hitFlash: 0,
    time: 0,
    muted: false,
  };
  return state;
}

export function applyShot(state, shot) {
  if (shot === 'start') {
    state.mode = 'title';
    state.world.distance = 0;
    state.score = 0;
    return state;
  }

  if (shot === 'play') {
    const s = baseState(42);
    s.world.distance = 320;
    s.stageIndex = 0;
    s.score = 1240;
    s.corn = 6;
    s.lives = 3;
    s.turkey.x = 300;
    s.turkey.runCycle = 2.4;
    s.farmer.gap = 34;
    s.farmer.walkCycle = 1.2;
    // A busy farmyard moment: fence ahead, corn to grab, hay to hide in.
    s.hazards.list.push(
      { kind: 'fence', x: 760, y: CONFIG.groundY - 74, w: 46, h: 74, state: 'live', timer: 0, vy: 0 },
      { kind: 'bale', x: 1020, y: CONFIG.groundY - 56, w: 70, h: 56, state: 'live', timer: 0, vy: 0 },
    );
    s.world.haystacks.push({ x: 560, w: 110 });
    s.world.pickups.push(
      { kind: 'corn', x: 480, y: CONFIG.groundY - 90, bob: 0.5 },
      { kind: 'corn', x: 540, y: CONFIG.groundY - 120, bob: 1.4 },
      { kind: 'corn', x: 600, y: CONFIG.groundY - 90, bob: 2.1 },
    );
    s.time = 1.35;
    return s;
  }

  if (shot === 'kitchen') {
    const s = baseState(99);
    s.world.distance = 1180;
    s.stageIndex = 2;
    s.score = 3860;
    s.corn = 18;
    s.lives = 2;
    s.turkey.x = 330;
    s.turkey.y = CONFIG.groundY - 120; // mid-jump over the oven
    s.turkey.onGround = false;
    s.turkey.vy = -220;
    s.turkey.runCycle = 3.1;
    s.farmer.gap = 9; // dangerously close
    s.farmer.state = 'sprint';
    s.farmer.stateTime = 0.8;
    s.farmer.walkCycle = 4.2;
    s.hazards.list.push(
      { kind: 'oven', x: 420, y: CONFIG.groundY - 26, w: 150, h: 26, state: 'live', timer: 0, vy: 0 },
      { kind: 'knife', x: 700, y: 120, vy: 900, w: 40, h: 90, state: 'falling', timer: 0, targetX: 700 },
      { kind: 'fence', x: 980, y: CONFIG.groundY - 74, w: 46, h: 74, state: 'live', timer: 0, vy: 0 },
    );
    s.world.pickups.push({ kind: 'drumstick', x: 840, y: CONFIG.groundY - 120, bob: 0.2 });
    s.time = 2.7;
    return s;
  }

  if (shot === 'end') {
    const s = baseState(7);
    s.mode = 'end';
    s.result = 'escaped';
    s.score = 5120;
    s.corn = 24;
    s.lives = 2;
    s.best = 5120;
    s.world.distance = 1500;
    s.stageIndex = 2;
    s.turkey.x = 1150;
    s.time = 0.9;
    return s;
  }

  return state;
}

export { stageIndexFor, spawnHazard };
