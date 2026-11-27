// hazards.js — everything that can end Gobbles' run: fences and hay bales to
// jump, the kitchen's hot oven patches, carving knives that drop from above,
// and the barn dog that gives chase. Each hazard knows how to move, how to
// draw itself, and how to tell the game it hit the turkey.
import { CONFIG } from './config.js';

export function createHazards() {
  return {
    list: [], // {kind, x, y, vy, w, h, state, timer, targetX, dogX}
    spawnTimer: 1.6,
  };
}

const KINDS_BY_STAGE = [
  ['fence', 'fence', 'bale', 'knife'],
  ['fence', 'bale', 'dog', 'knife', 'fence'],
  ['oven', 'knife', 'oven', 'knife', 'fence', 'dog'],
];

export function spawnHazard(hz, stageIndex, rng) {
  const kinds = KINDS_BY_STAGE[stageIndex];
  const kind = kinds[Math.floor(rng() * kinds.length)];
  const base = { kind, x: 1320, state: 'live', timer: 0, vy: 0 };
  if (kind === 'fence') Object.assign(base, { w: 46, h: 74, y: CONFIG.groundY - 74 });
  if (kind === 'bale') Object.assign(base, { w: 70, h: 56, y: CONFIG.groundY - 56 });
  if (kind === 'oven') Object.assign(base, { w: 150, h: 26, y: CONFIG.groundY - 26 });
  if (kind === 'knife') {
    Object.assign(base, {
      w: 40, h: 90, y: -100, targetX: 260 + rng() * 700,
      x: 260 + rng() * 700, timer: 0.9, state: 'warn',
    });
  }
  if (kind === 'dog') Object.assign(base, { w: 84, h: 52, y: CONFIG.groundY - 52, dogX: 1320, timer: 4 });
  hz.list.push(base);
}

export function updateHazards(hz, dt, speed, stageIndex, rng) {
  hz.spawnTimer -= dt;
  if (hz.spawnTimer <= 0) {
    hz.spawnTimer = CONFIG.spawnInterval[stageIndex] * (0.8 + rng() * 0.5);
    spawnHazard(hz, stageIndex, rng);
  }

  for (let i = hz.list.length - 1; i >= 0; i--) {
    const h = hz.list[i];
    if (h.kind === 'knife') {
      if (h.state === 'warn') {
        h.timer -= dt;
        h.x = h.targetX; // the shadow waits on its landing spot
        if (h.timer <= 0) h.state = 'falling';
      } else if (h.state === 'falling') {
        h.vy += 4200 * dt;
        h.y += h.vy * dt;
        if (h.y >= CONFIG.groundY - 88) {
          h.y = CONFIG.groundY - 88;
          h.state = 'stuck';
          h.timer = 0.7;
        }
      } else {
        h.timer -= dt;
        if (h.timer <= 0) hz.list.splice(i, 1);
      }
      continue;
    }
    if (h.kind === 'dog') {
      // The dog runs in, chases the turkey's x for a few seconds, then
      // gives up and trots off to the right.
      h.timer -= dt;
      if (h.timer > 1.2) {
        h.dogX -= (speed + 260) * dt;
      } else {
        h.dogX += 200 * dt;
      }
      h.x = h.dogX;
      if (h.timer <= 0 || h.dogX < -140) hz.list.splice(i, 1);
      continue;
    }
    h.x -= speed * dt;
    if (h.x < -180) hz.list.splice(i, 1);
  }
}

// True when the hazard's box touches the turkey's box (forgiving edges so a
// near miss feels fair). Knives only hurt while falling or freshly stuck;
// a stuck knife is a warning, not a trap.
export function hazardHitsTurkey(h, turkey) {
  const tx0 = turkey.x - 26, tx1 = turkey.x + 26;
  const ty0 = turkey.y - 66, ty1 = turkey.y;
  if (h.kind === 'knife') {
    if (h.state !== 'falling' && h.state !== 'stuck') return false;
    const hx0 = h.x - 14, hx1 = h.x + 14;
    const hy0 = h.y, hy1 = h.y + 88;
    return tx1 > hx0 && tx0 < hx1 && ty1 > hy0 && ty0 < hy1;
  }
  const hx0 = h.x - h.w / 2 + 8, hx1 = h.x + h.w / 2 - 8;
  const hy0 = h.y + 6, hy1 = h.y + h.h;
  return tx1 > hx0 && tx0 < hx1 && ty1 > hy0 && ty0 < hy1;
}

export function drawHazard(ctx, h, time) {
  if (h.kind === 'fence') {
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(h.x - 23, h.y, 6, 74);
    ctx.fillRect(h.x + 17, h.y, 6, 74);
    ctx.fillStyle = '#a96f2c';
    ctx.fillRect(h.x - 28, h.y + 12, 56, 9);
    ctx.fillRect(h.x - 28, h.y + 36, 56, 9);
    ctx.fillRect(h.x - 28, h.y + 58, 56, 9);
  } else if (h.kind === 'bale') {
    ctx.fillStyle = '#d9a441';
    ctx.beginPath();
    ctx.ellipse(h.x, h.y + 28, 36, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a87c2a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(h.x, h.y + 28, 24, 18, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (h.kind === 'oven') {
    // A hot oven patch: glowing coals and flames licking the floor.
    ctx.fillStyle = '#3d3d3d';
    ctx.fillRect(h.x - 75, h.y - 6, 150, 32);
    const flick = Math.sin(time * 14 + h.x) * 4;
    for (let i = 0; i < 5; i++) {
      const fx = h.x - 60 + i * 30;
      const fh = 34 + Math.sin(time * 10 + i * 2) * 9 + flick;
      ctx.fillStyle = i % 2 ? '#ff7b24' : '#ffd23e';
      ctx.beginPath();
      ctx.moveTo(fx - 12, h.y - 2);
      ctx.quadraticCurveTo(fx, h.y - fh, fx + 12, h.y - 2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#ff5a1f';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('HOT OVEN!', h.x, h.y - 46);
  } else if (h.kind === 'knife') {
    if (h.state === 'warn') {
      // Telegraph: a red shadow and a flashing X on the landing spot.
      ctx.fillStyle = 'rgba(217, 56, 43, 0.35)';
      ctx.beginPath();
      ctx.ellipse(h.x, CONFIG.groundY + 4, 34, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      const blink = Math.floor(time * 8) % 2 === 0;
      ctx.fillStyle = blink ? '#d9382b' : '#ffffff';
      ctx.font = 'bold 26px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', h.x, CONFIG.groundY - 30);
    } else {
      // The carving knife itself, blade down, stuck in the dirt.
      ctx.save();
      ctx.translate(h.x, h.y + 44);
      ctx.fillStyle = '#c0c8d0';
      ctx.beginPath();
      ctx.moveTo(-7, -44);
      ctx.lineTo(7, -44);
      ctx.lineTo(2, 20);
      ctx.lineTo(-2, 20);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#5e3717';
      ctx.fillRect(-6, -44 - 18, 12, 20);
      ctx.fillStyle = '#e8eef4';
      ctx.fillRect(-4, -40, 2, 52);
      ctx.restore();
    }
  } else if (h.kind === 'dog') {
    // The barn dog: brown, mid-bounding, tongue out.
    const bobY = Math.sin(time * 12) * 4;
    ctx.save();
    ctx.translate(h.x, h.y + 52 + bobY);
    ctx.fillStyle = '#8a5a2b';
    ctx.beginPath();
    ctx.ellipse(0, -26, 40, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-42, -46, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-52, -58);
    ctx.lineTo(-58, -72);
    ctx.lineTo(-46, -60);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-36, -58);
    ctx.lineTo(-36, -74);
    ctx.lineTo(-28, -60);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d9382b';
    ctx.fillRect(-58, -42, 12, 5);
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(-46, -50, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a5a2b';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-28, -8);
    ctx.lineTo(-34, 0);
    ctx.moveTo(28, -8);
    ctx.lineTo(34, 0);
    ctx.stroke();
    ctx.restore();
  }
}
