// farmer.js — Farmer Bram, the hunter. His AI has three states:
// CHASE (closing in while the turkey dawdles), SEARCH (stopped and looking
// around while the turkey hides in the hay), and SPRINT (a stage-3 burst
// that can corner the turkey). The gap he leaves is the game's clock.
import { CONFIG } from './config.js';

export function createFarmer() {
  return {
    gap: CONFIG.startFarmerGap, // metres of lead the turkey holds
    state: 'chase', // 'chase' | 'search' | 'sprint'
    stateTime: 0,
    sprintCooldown: 14, // seconds until the next sprint is allowed
    walkCycle: 0,
    searchLook: 0,
  };
}

export function updateFarmer(f, dt, turkey, stageIndex, audio, onCaught) {
  f.stateTime += dt;
  f.walkCycle += dt * 9;
  f.sprintCooldown -= dt;

  if (turkey.hidden) {
    // The farmer loses the trail: he stops, scratches his head and looks
    // around while the turkey's lead slowly grows back.
    if (f.state !== 'search') {
      f.state = 'search';
      f.stateTime = 0;
    }
    f.gap = Math.min(60, f.gap + CONFIG.hideRegenRate * dt);
    f.searchLook = Math.sin(f.stateTime * 2.2);
    return;
  }

  if (f.state === 'search') {
    f.state = 'chase';
    f.stateTime = 0;
  }

  // Stage 3: the farmer sometimes sprints to corner the turkey.
  if (stageIndex === 2 && f.sprintCooldown <= 0 && f.state !== 'sprint') {
    f.state = 'sprint';
    f.stateTime = 0;
    audio.alarm();
  }
  if (f.state === 'sprint') {
    f.gap -= CONFIG.farmerSprintRate * dt;
    if (f.stateTime > 2.2) {
      f.state = 'chase';
      f.stateTime = 0;
      f.sprintCooldown = 12 + Math.random() * 6;
    }
  } else {
    // The gap closes when the turkey hangs back near the left edge and
    // opens when the turkey pushes far right or dashes.
    const nearLeft = turkey.x < 240;
    const farRight = turkey.x > 480 || turkey.dashing;
    if (nearLeft) f.gap -= CONFIG.farmerCloseRate * dt;
    else if (farRight) f.gap += CONFIG.farmerOpenRate * dt;
    else f.gap -= 0.5 * dt;
  }

  // A hit knocks the turkey back toward the farmer.
  if (f.gap <= CONFIG.catchGap) {
    f.gap = 0;
    onCaught();
  }
}

// The farmer runs in from the left edge, so his on-screen position follows
// the gap: close gap, close farmer.
export function farmerScreenX(f) {
  const t = Math.max(0, Math.min(1, f.gap / 60));
  return -60 + (1 - t) * 220; // far gap: just off-screen; close gap: right on the turkey's heels
}

export function drawFarmer(ctx, f, time) {
  const x = farmerScreenX(f);
  if (x < -70) return; // off-screen, still chasing
  const y = CONFIG.groundY;
  const swing = Math.sin(f.walkCycle) * 8;
  const searching = f.state === 'search';
  const sprinting = f.state === 'sprint';

  ctx.save();
  ctx.translate(x, y);

  // Legs.
  ctx.strokeStyle = '#3b2f23';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, -34);
  ctx.lineTo(-6 + swing, 0);
  ctx.moveTo(6, -34);
  ctx.lineTo(6 - swing, 0);
  ctx.stroke();

  // Body: red plaid shirt.
  ctx.fillStyle = '#a83226';
  ctx.fillRect(-18, -78, 36, 46);
  ctx.strokeStyle = '#7c1f16';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-18, -62);
  ctx.lineTo(18, -62);
  ctx.moveTo(0, -78);
  ctx.lineTo(0, -32);
  ctx.stroke();
  // Overalls straps.
  ctx.fillStyle = '#3b4a6b';
  ctx.fillRect(-12, -78, 6, 20);
  ctx.fillRect(6, -78, 6, 20);

  // Arms: pumping while running, or scratching his head while searching.
  ctx.strokeStyle = '#a83226';
  ctx.lineWidth = 6;
  ctx.beginPath();
  if (searching) {
    ctx.moveTo(14, -70);
    ctx.lineTo(26, -96 + f.searchLook * 6);
  } else {
    ctx.moveTo(14, -72);
    ctx.lineTo(26, -52 - swing);
    ctx.moveTo(-14, -72);
    ctx.lineTo(-26, -52 + swing);
  }
  ctx.stroke();

  // Head, straw hat and angry moustache.
  ctx.fillStyle = '#e8b98a';
  ctx.beginPath();
  ctx.arc(0, -90, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d9a441';
  ctx.beginPath();
  ctx.ellipse(0, -100, 24, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-12, -116, 24, 16);
  ctx.fillStyle = '#5e3717';
  ctx.fillRect(-8, -82, 16, 4);
  // Eyes: narrowed when sprinting.
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(3, -94, 4, sprinting ? 2 : 4);
  ctx.fillRect(-7, -94, 4, sprinting ? 2 : 4);

  // Speech: what the farmer is doing, so the player always knows.
  ctx.restore();
  ctx.save();
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'center';
  if (searching) {
    ctx.fillStyle = '#fff8e7';
    ctx.fillText('“Where’d that bird GO?!”', x + 60, y - 140);
  } else if (sprinting) {
    ctx.fillStyle = '#ffd23e';
    ctx.fillText('“GOTCHA NOW!”', x + 70, y - 140);
  }
  ctx.restore();
}
