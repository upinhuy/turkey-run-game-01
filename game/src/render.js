// render.js — paints one frame of the run: background, haystacks, pickups,
// hazards, the farmer chasing in from the left, and Gobbles himself.
import { CONFIG } from './config.js';
import { drawBackground, drawHaystack, drawPickup } from './world.js';
import { drawHazard } from './hazards.js';
import { drawTurkey } from './turkey.js';
import { drawFarmer } from './farmer.js';

export function drawGame(ctx, state, time) {
  const stage = CONFIG.stages[state.stageIndex];
  drawBackground(ctx, state.world, stage);

  // The forest gate at the end of the road: visible as the finish nears
  // (not on the end screen, where it would collide with the result text).
  if (state.mode !== 'end' && state.world.distance > 1350) {
    const gateX = 1180 - (state.world.distance - 1350) * 4;
    drawForestGate(ctx, Math.max(300, gateX));
  }

  for (const h of state.world.haystacks) drawHaystack(ctx, h);
  for (const p of state.world.pickups) drawPickup(ctx, p, time);
  for (const hz of state.hazards.list) drawHazard(ctx, hz, time);

  drawFarmer(ctx, state.farmer, time);
  if (!state.turkey.hidden) drawTurkey(ctx, state.turkey, time);

  // The turkey is hiding: show him peeking from the hay instead.
  if (state.turkey.hidden) {
    const hs = state.world.haystacks.find((s) => Math.abs(s.x - state.turkey.x) < 80);
    if (hs) {
      ctx.fillStyle = '#fff8e7';
      ctx.font = 'bold 15px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('shhh… hiding!', hs.x, CONFIG.groundY - 112);
      ctx.save();
      ctx.translate(state.turkey.x + 6, CONFIG.groundY - 52);
      ctx.fillStyle = '#a8642c';
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(3, -3, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.arc(5, -3, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // A red flash at the screen edges right after a hit.
  if (state.hitFlash > 0) {
    ctx.fillStyle = `rgba(217, 56, 43, ${Math.min(0.35, state.hitFlash)})`;
    ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
  }
}

function drawForestGate(ctx, x) {
  const y = CONFIG.groundY;
  ctx.fillStyle = '#2e5d33';
  ctx.fillRect(x - 8, y - 190, 16, 190);
  ctx.fillRect(x + 92, y - 190, 16, 190);
  ctx.fillStyle = '#3f7a2e';
  ctx.beginPath();
  ctx.moveTo(x - 26, y - 186);
  ctx.quadraticCurveTo(x + 50, y - 260, x + 126, y - 186);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('FREEDOM →', x + 50, y - 210);
}
