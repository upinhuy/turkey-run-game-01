// hud.js — everything drawn over the game: the HUD bar (score, distance,
// lives, stage, the farmer-gap meter and dash stamina), the title screen,
// the pause card and the end screens with their restart buttons.
import { CONFIG } from './config.js';

export function drawHud(ctx, state) {
  const W = CONFIG.canvasWidth;
  ctx.fillStyle = 'rgba(30, 18, 8, 0.72)';
  ctx.fillRect(0, 0, W, 58);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText(`SCORE ${state.score}`, 18, 26);
  ctx.fillStyle = '#fff8e7';
  ctx.font = '18px Georgia, serif';
  ctx.fillText(`${Math.floor(state.world.distance)} m`, 18, 50);

  // Lives as hearts.
  for (let i = 0; i < CONFIG.startLives; i++) {
    const x = 250 + i * 34;
    const y = 30;
    ctx.fillStyle = i < state.lives ? '#e84a3a' : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(x - 6, y - 4, 8, 0, Math.PI * 2);
    ctx.arc(x + 6, y - 4, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - 13, y - 2);
    ctx.lineTo(x, y + 12);
    ctx.lineTo(x + 13, y - 2);
    ctx.closePath();
    ctx.fill();
  }

  // Stage name.
  ctx.fillStyle = '#ffd23e';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(`— ${CONFIG.stages[state.stageIndex].name} —`, W / 2, 34);
  ctx.fillStyle = '#fff8e7';
  ctx.font = '15px Georgia, serif';
  ctx.fillText(`${Math.floor(state.world.distance)} / ${CONFIG.winDistance} m to freedom`, W / 2, 53);

  // Farmer-gap meter: how far behind Farmer Bram is. Red means run!
  const meterX = 830;
  const meterW = 300;
  const meterY = 16;
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(meterX, meterY, meterW, 12);
  const gapFrac = Math.max(0, Math.min(1, state.farmer.gap / 60));
  ctx.fillStyle = gapFrac > 0.5 ? '#7ac74f' : gapFrac > 0.25 ? '#ffd23e' : '#e84a3a';
  ctx.fillRect(meterX, meterY, meterW * gapFrac, 12);
  ctx.strokeStyle = '#fff8e7';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(meterX, meterY, meterW, 12);
  ctx.fillStyle = '#fff8e7';
  ctx.font = 'bold 14px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('FARMER', meterX, meterY + 28);
  ctx.textAlign = 'right';
  ctx.fillText('GOBBLES', meterX + meterW, meterY + 28);
  ctx.textAlign = 'left';
  ctx.fillStyle = state.farmer.gap < 15 ? '#ff6b5e' : '#fff8e7';
  ctx.font = 'bold 15px Georgia, serif';
  if (state.farmer.gap < 15) {
    ctx.fillStyle = 'rgba(30, 8, 5, 0.75)';
    ctx.beginPath();
    ctx.roundRect(meterX - 6, meterY + 46, 250, 24, 6);
    ctx.fill();
    ctx.fillStyle = '#ff6b5e';
    ctx.fillText('HE’S RIGHT BEHIND YOU!', meterX, meterY + 64);
  }

  // Dash stamina.
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(1150, meterY, 110, 12);
  ctx.fillStyle = '#4fc3f7';
  ctx.fillRect(1150, meterY, 110 * (state.turkey.stamina / 100), 12);
  ctx.fillStyle = '#fff8e7';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.fillText('DASH', 1150, meterY + 28);
}

function button(ctx, x, y, w, h, label, hover) {
  ctx.fillStyle = hover ? '#ffd23e' : '#e8a13a';
  ctx.strokeStyle = '#7a4a21';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#3d2200';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + h / 2 + 9);
  return { x, y, w, h };
}

export function drawTitle(ctx, state, mouse) {
  const W = CONFIG.canvasWidth;
  const H = CONFIG.canvasHeight;
  ctx.fillStyle = 'rgba(40, 20, 5, 0.55)';
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 76px Georgia, serif';
  ctx.fillText('TURKEY RUN', W / 2, 150);
  ctx.fillStyle = '#ffd23e';
  ctx.font = 'italic bold 34px Georgia, serif';
  ctx.fillText('The Great Thanksgiving Escape', W / 2, 198);

  ctx.fillStyle = '#fff8e7';
  ctx.font = '21px Georgia, serif';
  ctx.fillText('Gobbles the turkey is on the menu tonight — and he is NOT having it.', W / 2, 250);
  ctx.fillText('Outrun Farmer Bram, jump the fences, dodge the carving knives', W / 2, 282);
  ctx.fillText('and the hot oven, and reach the forest gate 1,500 m away!', W / 2, 314);

  ctx.font = 'bold 19px Georgia, serif';
  ctx.fillStyle = '#ffe9a8';
  ctx.fillText('SPACE / ↑ / CLICK — jump      ← → / A D — steer      SHIFT — dash', W / 2, 372);
  ctx.fillText('↓ / S near a haystack — HIDE from the farmer      P — pause      M — mute', W / 2, 402);

  const hover = mouse.x > W / 2 - 150 && mouse.x < W / 2 + 150 && mouse.y > 440 && mouse.y < 500;
  const btn = button(ctx, W / 2 - 150, 440, 300, 60, '▶  START RUN', hover);

  if (state.best > 0) {
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 20px Georgia, serif';
    ctx.fillText(`Best escape: ${state.best} points`, W / 2, 540);
  }
  ctx.fillStyle = 'rgba(255, 248, 231, 0.75)';
  ctx.font = '15px Georgia, serif';
  ctx.fillText('A 100% original game — no libraries, no network, just a turkey with a plan.', W / 2, 690);
  return btn;
}

export function drawPause(ctx) {
  const W = CONFIG.canvasWidth;
  const H = CONFIG.canvasHeight;
  ctx.fillStyle = 'rgba(30, 18, 8, 0.6)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 54px Georgia, serif';
  ctx.fillText('PAUSED', W / 2, 330);
  ctx.fillStyle = '#fff8e7';
  ctx.font = '20px Georgia, serif';
  ctx.fillText('Press P or click to keep running.', W / 2, 380);
}

export function drawEnd(ctx, state, mouse) {
  const W = CONFIG.canvasWidth;
  const H = CONFIG.canvasHeight;
  const escaped = state.result === 'escaped';
  ctx.fillStyle = escaped ? 'rgba(20, 60, 25, 0.62)' : 'rgba(70, 12, 8, 0.66)';
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.fillStyle = escaped ? '#b6f09c' : '#ff8a7a';
  ctx.font = 'bold 84px Georgia, serif';
  ctx.fillText(escaped ? 'ESCAPED!' : 'CAUGHT!', W / 2, 220);
  ctx.fillStyle = '#fff8e7';
  ctx.font = 'italic 26px Georgia, serif';
  ctx.fillText(
    escaped
      ? 'Gobbles slips through the forest gate — no Thanksgiving dinner tonight!'
      : 'Farmer Bram got his bird… Gobbles is on the menu after all.',
    W / 2,
    272,
  );

  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 30px Georgia, serif';
  ctx.fillText(`SCORE  ${state.score}`, W / 2, 350);
  ctx.font = '22px Georgia, serif';
  ctx.fillText(`Distance: ${Math.floor(state.world.distance)} m   •   Corn: ${state.corn}   •   Best: ${state.best}`, W / 2, 392);

  const hover = mouse.x > W / 2 - 170 && mouse.x < W / 2 + 170 && mouse.y > 440 && mouse.y < 500;
  const btn = button(ctx, W / 2 - 170, 440, 340, 60, '↻  RUN AGAIN  (R)', hover);

  ctx.fillStyle = 'rgba(255, 248, 231, 0.8)';
  ctx.font = '16px Georgia, serif';
  ctx.fillText('Tip: dash on the straights, hide in the hay when Bram closes in,', W / 2, 540);
  ctx.fillText('and never linger under a falling carving knife.', W / 2, 566);
  return btn;
}
