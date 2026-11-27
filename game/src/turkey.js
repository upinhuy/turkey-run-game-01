// turkey.js — Gobbles the turkey: physics (run, jump, crouch, dash) and the
// hand-drawn canvas art of the bird itself. No images are loaded; the turkey
// is drawn from shapes every frame.
import { CONFIG } from './config.js';

export function createTurkey() {
  return {
    x: 260,
    y: CONFIG.groundY,
    vy: 0,
    width: 64,
    height: 66,
    onGround: true,
    hidden: false, // crouched behind a haystack, invisible to the farmer
    dashing: false,
    stamina: 100,
    runCycle: 0, // animates the legs while running
    facing: 1,
    invulnerable: 0, // seconds of flashing safety left after a hit
  };
}

export function updateTurkey(t, dt, input, audio) {
  // Left / right steering inside the safe zone (not while hiding).
  if (!t.hidden) {
    if (input.leftHeld()) t.x -= CONFIG.moveSpeed * dt;
    if (input.rightHeld()) t.x += CONFIG.moveSpeed * dt;
  }
  t.x = Math.max(CONFIG.turkeyMinX, Math.min(CONFIG.turkeyMaxX, t.x));

  // Dash costs stamina; without stamina the turkey just runs.
  const wantDash = input.dashHeld() && t.stamina > 1 && !t.hidden;
  t.dashing = wantDash;
  if (wantDash) {
    t.stamina = Math.max(0, t.stamina - CONFIG.dashDrain * dt);
  } else {
    t.stamina = Math.min(100, t.stamina + CONFIG.dashRegen * dt);
  }

  // Jump, or hop out of a hiding spot.
  if (input.jumpPressed()) {
    if (t.hidden) {
      t.hidden = false;
    } else if (t.onGround) {
      t.vy = CONFIG.jumpVelocity;
      t.onGround = false;
      audio.jump();
    }
  }

  // Gravity and landing.
  if (!t.onGround) {
    t.vy += CONFIG.gravity * dt;
    t.y += t.vy * dt;
    if (t.y >= CONFIG.groundY) {
      t.y = CONFIG.groundY;
      t.vy = 0;
      t.onGround = true;
    }
  }

  t.runCycle += dt * (t.dashing ? 16 : 11);
  if (t.invulnerable > 0) t.invulnerable -= dt;
}

// The turkey is drawn facing right, mid-stride, with a fanned tail, a red
// wattle and a worried eye — readable at a glance even when shrunk.
export function drawTurkey(ctx, t, time) {
  const bob = t.onGround && !t.hidden ? Math.sin(t.runCycle) * 3 : 0;
  const x = t.x;
  const y = t.y + bob;
  const flash = t.invulnerable > 0 && Math.floor(time * 12) % 2 === 0;
  if (flash) ctx.globalAlpha = 0.35;

  ctx.save();
  ctx.translate(x, y);

  // Fanned tail feathers.
  const tailColors = ['#b5651d', '#d97b2f', '#e8a13a', '#8e3b1f', '#c96a2e'];
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.36;
    ctx.save();
    ctx.rotate(a);
    ctx.fillStyle = tailColors[i];
    ctx.beginPath();
    ctx.ellipse(-34, -6, 26, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f7e8c9';
    ctx.beginPath();
    ctx.ellipse(-50, -6, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Body.
  ctx.fillStyle = '#7a4a21';
  ctx.beginPath();
  ctx.ellipse(0, -26, 30, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8e5a2b';
  ctx.beginPath();
  ctx.ellipse(2, -30, 24, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wing.
  ctx.fillStyle = '#5e3717';
  ctx.beginPath();
  ctx.ellipse(-4, -24, 18, 12, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // Legs, scissoring while running.
  const legSwing = t.onGround ? Math.sin(t.runCycle) * 10 : 6;
  ctx.strokeStyle = '#e8a13a';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8, -6);
  ctx.lineTo(-8 + legSwing, 0);
  ctx.moveTo(8, -6);
  ctx.lineTo(8 - legSwing, 0);
  ctx.stroke();

  // Neck and head.
  ctx.fillStyle = '#8e5a2b';
  ctx.fillRect(14, -58, 12, 34);
  ctx.fillStyle = '#a8642c';
  ctx.beginPath();
  ctx.arc(24, -62, 13, 0, Math.PI * 2);
  ctx.fill();
  // Red wattle and snood.
  ctx.fillStyle = '#d9382b';
  ctx.beginPath();
  ctx.ellipse(22, -50, 5, 8, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e84a3a';
  ctx.beginPath();
  ctx.ellipse(36, -64, 4, 7, 0.5, 0, Math.PI * 2);
  ctx.fill();
  // Beak and worried eye.
  ctx.fillStyle = '#f2b705';
  ctx.beginPath();
  ctx.moveTo(34, -66);
  ctx.lineTo(46, -61);
  ctx.lineTo(34, -58);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(28, -66, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(30, -66, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  ctx.globalAlpha = 1;
}
