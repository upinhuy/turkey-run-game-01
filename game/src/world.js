// world.js — the road from the farmyard to the kitchen: stage palettes,
// the scrolling scenery (fences, barns, pumpkins, kitchen windows), the
// haystacks the turkey can hide behind, and the corn and drumsticks to grab.
import { CONFIG } from './config.js';
import { makeRng } from './random.js';

export function stageIndexFor(distance) {
  if (distance < 500) return 0;
  if (distance < 1000) return 1;
  return 2;
}

export function createWorld(seed) {
  return {
    rng: makeRng(seed || 12345),
    distance: 0, // metres run so far
    scroll: 0, // pixels scrolled, for parallax scenery
    haystacks: [], // {x, w} hiding spots, moving left with the world
    pickups: [], // {x, y, kind: 'corn' | 'drumstick', bob}
    spawnTimer: 1.2,
    cornTimer: 0.8,
    hayTimer: 4,
    trees: [], // background scenery anchors
    clouds: [],
  };
}

export function initScenery(w) {
  const rng = makeRng(777);
  for (let i = 0; i < 14; i++) {
    w.trees.push({ x: rng() * 1400, kind: i % 3, scale: 0.8 + rng() * 0.5 });
  }
  for (let i = 0; i < 6; i++) {
    w.clouds.push({ x: rng() * 1400, y: 50 + rng() * 90, s: 0.7 + rng() * 0.8, v: 8 + rng() * 10 });
  }
}

export function updateWorld(w, dt, speed, stageIndex) {
  w.scroll += speed * dt;
  w.distance += (speed * dt) / 22; // 22 px on screen is one metre of road

  const move = (list) => {
    for (let i = list.length - 1; i >= 0; i--) {
      list[i].x -= speed * dt;
      if (list[i].x < -120) list.splice(i, 1);
    }
  };
  move(w.haystacks);
  move(w.pickups);

  // Scenery wraps around.
  for (const t of w.trees) {
    t.x -= speed * dt * 0.35;
    if (t.x < -160) {
      t.x = 1300 + w.rng() * 200;
      t.kind = Math.floor(w.rng() * 3);
    }
  }
  for (const c of w.clouds) {
    c.x -= (speed * dt * 0.12 + c.v * dt);
    if (c.x < -160) {
      c.x = 1300 + w.rng() * 200;
      c.y = 40 + w.rng() * 100;
    }
  }

  // Corn appears often, a golden drumstick rarely.
  w.cornTimer -= dt;
  if (w.cornTimer <= 0) {
    w.cornTimer = 1.1 + w.rng() * 1.4;
    const kind = w.rng() < 0.08 ? 'drumstick' : 'corn';
    w.pickups.push({
      x: 1300,
      y: kind === 'drumstick' ? CONFIG.groundY - 130 : CONFIG.groundY - 60 - w.rng() * 60,
      kind,
      bob: w.rng() * Math.PI * 2,
    });
  }

  // A haystack every few seconds gives the turkey somewhere to hide.
  w.hayTimer -= dt;
  if (w.hayTimer <= 0) {
    w.hayTimer = 5 + w.rng() * 4;
    w.haystacks.push({ x: 1320, w: 110 });
  }
}

// Paint the sky, sun, clouds, distant hills and the road for the current stage.
export function drawBackground(ctx, w, stage) {
  const W = CONFIG.canvasWidth;
  const H = CONFIG.canvasHeight;
  const grad = ctx.createLinearGradient(0, 0, 0, CONFIG.groundY);
  grad.addColorStop(0, stage.skyTop);
  grad.addColorStop(1, stage.sky);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, CONFIG.groundY + 2);

  // Low autumn sun.
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(1080, 110, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 233, 168, 0.35)';
  ctx.beginPath();
  ctx.arc(1080, 110, 70, 0, Math.PI * 2);
  ctx.fill();

  // Clouds.
  ctx.fillStyle = 'rgba(255, 248, 231, 0.9)';
  for (const c of w.clouds) {
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, 52 * c.s, 20 * c.s, 0, 0, Math.PI * 2);
    ctx.ellipse(c.x + 34 * c.s, c.y + 6, 36 * c.s, 16 * c.s, 0, 0, Math.PI * 2);
    ctx.ellipse(c.x - 36 * c.s, c.y + 8, 30 * c.s, 14 * c.s, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Distant hills and the farmhouse / barn / kitchen skyline of the stage.
  ctx.fillStyle = 'rgba(120, 70, 30, 0.35)';
  ctx.beginPath();
  ctx.moveTo(0, CONFIG.groundY);
  for (let x = 0; x <= W; x += 80) {
    ctx.lineTo(x, CONFIG.groundY - 60 - Math.sin((x + w.scroll * 0.1) * 0.006) * 34);
  }
  ctx.lineTo(W, CONFIG.groundY);
  ctx.closePath();
  ctx.fill();

  for (const t of w.trees) {
    const x = t.x;
    const y = CONFIG.groundY - 8;
    const s = t.scale;
    if (t.kind === 0) {
      // Bare autumn tree.
      ctx.strokeStyle = '#6e4520';
      ctx.lineWidth = 6 * s;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - 90 * s);
      ctx.moveTo(x, y - 60 * s);
      ctx.lineTo(x - 26 * s, y - 92 * s);
      ctx.moveTo(x, y - 70 * s);
      ctx.lineTo(x + 24 * s, y - 100 * s);
      ctx.stroke();
    } else if (t.kind === 1) {
      // Red barn in the farmyard, brick oven-house in the kitchen.
      ctx.fillStyle = stageIndexFor(w.distance) === 2 ? '#8e2f2f' : '#a83226';
      ctx.fillRect(x - 50 * s, y - 78 * s, 100 * s, 78 * s);
      ctx.fillStyle = '#5e2b21';
      ctx.beginPath();
      ctx.moveTo(x - 58 * s, y - 76 * s);
      ctx.lineTo(x, y - 118 * s);
      ctx.lineTo(x + 58 * s, y - 76 * s);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f7e8c9';
      ctx.fillRect(x - 14 * s, y - 34 * s, 28 * s, 34 * s);
    } else {
      // Pumpkin patch.
      ctx.fillStyle = '#d97b2f';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(x - 26 + i * 26, y - 12 * s, 15 * s, 12 * s, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#3f7a2e';
      ctx.fillRect(x - 2, y - 30 * s, 5, 12 * s);
    }
  }

  // The road.
  ctx.fillStyle = stage.ground;
  ctx.fillRect(0, CONFIG.groundY, W, H - CONFIG.groundY);
  ctx.fillStyle = stage.groundDark;
  ctx.fillRect(0, CONFIG.groundY, W, 10);
  // Road dashes scrolling past.
  ctx.fillStyle = 'rgba(255, 240, 200, 0.5)';
  const dashOffset = -(w.scroll % 90);
  for (let x = dashOffset; x < W; x += 90) {
    ctx.fillRect(x, CONFIG.groundY + 62, 46, 8);
  }
}

export function drawHaystack(ctx, h) {
  const y = CONFIG.groundY;
  ctx.fillStyle = '#d9a441';
  ctx.beginPath();
  ctx.moveTo(h.x - h.w / 2, y);
  ctx.quadraticCurveTo(h.x - h.w / 2 + 8, y - 84, h.x, y - 96);
  ctx.quadraticCurveTo(h.x + h.w / 2 - 8, y - 84, h.x + h.w / 2, y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#a87c2a';
  ctx.lineWidth = 3;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(h.x + i * 16, y - 88);
    ctx.lineTo(h.x + i * 12, y - 12);
    ctx.stroke();
  }
}

export function drawPickup(ctx, p, time) {
  const bobY = Math.sin(time * 4 + p.bob) * 5;
  const y = p.y + bobY;
  if (p.kind === 'corn') {
    ctx.save();
    ctx.translate(p.x, y);
    ctx.rotate(0.4);
    ctx.fillStyle = '#f2b705';
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e89b0c';
    for (let r = -1; r <= 1; r++) {
      ctx.fillRect(-7, r * 9 - 2, 14, 3);
    }
    ctx.fillStyle = '#3f7a2e';
    ctx.beginPath();
    ctx.ellipse(0, 22, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else {
    // Golden drumstick: rare, worth 50 points and a life.
    ctx.save();
    ctx.translate(p.x, y);
    ctx.fillStyle = '#f7c948';
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 13, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.ellipse(-4, -4, 8, 6, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f7e8c9';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(12, 8);
    ctx.lineTo(24, 20);
    ctx.moveTo(8, 12);
    ctx.lineTo(16, 26);
    ctx.stroke();
    ctx.restore();
  }
}
