// main.js — boots Turkey Run, runs the game loop and owns the state machine
// (title → play → pause → end), the collisions, the scoring and the hiding.
// It is the only file that touches every other module.
import { CONFIG } from './config.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createTurkey, updateTurkey } from './turkey.js';
import { createFarmer, updateFarmer } from './farmer.js';
import { createWorld, initScenery, updateWorld, stageIndexFor } from './world.js';
import { createHazards, updateHazards, hazardHitsTurkey } from './hazards.js';
import { drawGame } from './render.js';
import { drawHud, drawTitle, drawPause, drawEnd } from './hud.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const audio = createAudio();
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

function freshState() {
  const world = createWorld((Math.random() * 1e9) | 0);
  initScenery(world);
  return {
    mode: 'title', // 'title' | 'play' | 'pause' | 'end'
    result: null, // 'escaped' | 'caught' once the run ends
    score: 0,
    corn: 0,
    drumstickBonus: 0,
    lives: CONFIG.startLives,
    best: Number(window.localStorage.getItem('turkeyRunBest') || 0),
    stageIndex: 0,
    turkey: createTurkey(),
    farmer: createFarmer(),
    world,
    hazards: createHazards(),
    hitFlash: 0,
    time: 0,
    alarmCooldown: 0,
    startButton: null,
    endButton: null,
  };
}

let state = freshState();

// A read-only handle for automated play-testing (and nothing else): the
// test driver reads the mode, score and distance through it.
window.__turkeyRun = {
  get state() {
    return state;
  },
};

function saveBest() {
  if (state.score > state.best) {
    state.best = state.score;
    try {
      window.localStorage.setItem('turkeyRunBest', String(state.best));
    } catch (e) {
      // Storage may be unavailable (private mode, hosted sandbox): the best
      // score simply does not persist, and the game plays on regardless.
    }
  }
}

function startRun() {
  const best = state.best;
  state = freshState();
  state.best = best;
  state.mode = 'play';
  audio.unlock();
  audio.gobble();
}

function endRun(result) {
  if (state.mode !== 'play') return;
  state.mode = 'end';
  state.result = result;
  saveBest();
  if (result === 'escaped') audio.escaped();
  else audio.caught();
}

function hurtTurkey() {
  if (state.turkey.invulnerable > 0 || state.mode !== 'play') return;
  state.lives -= 1;
  state.turkey.invulnerable = CONFIG.invulnerableSeconds;
  state.hitFlash = 0.5;
  state.farmer.gap = Math.max(2, state.farmer.gap - 9); // a hit lets Bram close in
  audio.hurt();
  if (state.lives <= 0) endRun('caught');
}

function updatePlay(dt) {
  const t = state.turkey;
  const w = state.world;

  // Hiding: crouch behind a haystack to shake the farmer off. While hidden
  // the turkey cannot move or jump, and a hazard can still hit the haystack.
  const nearHay = w.haystacks.some((s) => Math.abs(s.x - t.x) < 70);
  if (input.hideHeld() && nearHay && t.onGround && !t.hidden) {
    t.hidden = true;
  }
  if (t.hidden && (!input.hideHeld() || !nearHay)) t.hidden = false;

  updateTurkey(t, dt, input, audio);

  const speed = CONFIG.runSpeed * (t.dashing && !t.hidden ? CONFIG.dashMultiplier : 1);
  updateWorld(w, dt, t.hidden ? 0 : speed, state.stageIndex);
  state.stageIndex = stageIndexFor(w.distance);

  updateFarmer(
    state.farmer,
    dt,
    t,
    state.stageIndex,
    audio,
    () => endRun('caught'),
  );

  updateHazards(state.hazards, dt, t.hidden ? 0 : speed, state.stageIndex, w.rng);

  // Score grows with every metre, plus whatever the turkey grabs.
  state.score = Math.floor(w.distance) * CONFIG.distanceScorePerMetre + state.corn * CONFIG.cornScore + state.drumstickBonus;

  // Pickups.
  for (let i = w.pickups.length - 1; i >= 0; i--) {
    const p = w.pickups[i];
    if (Math.abs(p.x - t.x) < 46 && Math.abs(p.y - (t.y - 34)) < 60 && !t.hidden) {
      w.pickups.splice(i, 1);
      if (p.kind === 'corn') {
        state.corn += 1;
        audio.pickup();
      } else {
        state.drumstickBonus += CONFIG.drumstickScore;
        state.lives = Math.min(CONFIG.startLives, state.lives + 1);
        audio.drumstick();
      }
    }
  }

  // Hazards.
  for (const h of state.hazards.list) {
    if (hazardHitsTurkey(h, t)) {
      hurtTurkey();
      break;
    }
  }

  // The forest gate: 1,500 m and Gobbles is free.
  if (w.distance >= CONFIG.winDistance) endRun('escaped');

  // Warn the player while the farmer is dangerously close.
  state.alarmCooldown -= dt;
  if (state.farmer.gap < 15 && state.alarmCooldown <= 0) {
    audio.alarm();
    state.alarmCooldown = 1.6;
  }

  if (state.hitFlash > 0) state.hitFlash -= dt;
}

function render() {
  ctx.clearRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
  const mouse = input.mousePos();
  if (state.mode === 'title') {
    drawGame(ctx, state, state.time);
    state.startButton = drawTitle(ctx, state, mouse);
  } else if (state.mode === 'play' || state.mode === 'pause') {
    drawGame(ctx, state, state.time);
    drawHud(ctx, state);
    if (state.mode === 'pause') drawPause(ctx);
  } else {
    drawGame(ctx, state, state.time);
    drawHud(ctx, state);
    state.endButton = drawEnd(ctx, state, mouse);
  }
}

function clickedInside(btn) {
  if (!btn || !input.click()) return false;
  const m = input.mousePos();
  return m.x >= btn.x && m.x <= btn.x + btn.w && m.y >= btn.y && m.y <= btn.y + btn.h;
}

function step(timestamp) {
  const dt = Math.min(0.05, (timestamp - (step.last || timestamp)) / 1000 || 0.016);
  step.last = timestamp;
  state.time += dt;

  audio.unlock();

  if (input.justPressed('KeyM')) {
    state.muted = audio.toggleMute();
  }

  if (state.mode === 'title') {
    if (input.justPressed('Enter') || clickedInside(state.startButton)) startRun();
  } else if (state.mode === 'play') {
    if (input.justPressed('KeyP') || input.justPressed('Escape')) {
      state.mode = 'pause';
    } else {
      updatePlay(dt);
    }
  } else if (state.mode === 'pause') {
    if (input.justPressed('KeyP') || input.justPressed('Escape') || input.click()) {
      state.mode = 'play';
    }
  } else if (state.mode === 'end') {
    if (input.justPressed('KeyR') || input.justPressed('Enter') || clickedInside(state.endButton)) {
      startRun();
    }
  }

  render();
  input.endFrame();
  requestAnimationFrame(step);
}

// A screenshot state (?shot=...) renders one frozen, deterministic frame.
if (shot) {
  state = applyShot(state, shot);
  if (state.mode === 'title') state.mode = 'title';
  render();
  document.title = `Turkey Run — shot ${shot}`;
} else {
  requestAnimationFrame(step);
}
