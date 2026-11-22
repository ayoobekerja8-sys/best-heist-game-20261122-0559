import { CONFIG } from './config.js';

const P = CONFIG.PLAYER;

export function createPlayer(world) {
  return {
    x: world.start.x,
    y: world.start.y,
    vx: 0,
    vy: 0,
    radius: P.radius,
    angle: -Math.PI / 2,
    moving: false,
    sneaking: false,
    inVent: false,
    hidden: false,
    interacting: null,
    progress: 0,
    carry: [],
    coins: 3,
    coinCooldown: 0,
    empCharges: CONFIG.EMP_CHARGES,
    stepTimer: 0,
    footstepFlip: 0,
    bump: 0,
  };
}

function circleRectOverlap(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

function resolveCollisions(p, world) {
  for (const w of world.walls) {
    if (!circleRectOverlap(p.x, p.y, p.radius, w)) continue;
    const nx = Math.max(w.x, Math.min(p.x, w.x + w.w));
    const ny = Math.max(w.y, Math.min(p.y, w.y + w.h));
    let dx = p.x - nx;
    let dy = p.y - ny;
    let d = Math.hypot(dx, dy);
    if (d < 0.0001) {
      const toLeft = Math.abs(p.x - w.x);
      const toRight = Math.abs(w.x + w.w - p.x);
      const toTop = Math.abs(p.y - w.y);
      const toBottom = Math.abs(w.y + w.h - p.y);
      const m = Math.min(toLeft, toRight, toTop, toBottom);
      if (m === toLeft) {
        dx = -1;
        dy = 0;
      } else if (m === toRight) {
        dx = 1;
        dy = 0;
      } else if (m === toTop) {
        dx = 0;
        dy = -1;
      } else {
        dx = 0;
        dy = 1;
      }
      d = 1;
    }
    const push = p.radius - Math.hypot(p.x - nx, p.y - ny);
    p.x += (dx / d) * push;
    p.y += (dy / d) * push;
  }
  const solids = world.covers.concat(world.loot.filter((l) => l.type === 'case'));
  for (const c of solids) {
    if (c.type === 'curtain' || c.type === 'rope') continue;
    if (circleRectOverlap(p.x, p.y, p.radius, c)) {
      const nx = Math.max(c.x, Math.min(p.x, c.x + c.w));
      const ny = Math.max(c.y, Math.min(p.y, c.y + c.h));
      let dx = p.x - nx;
      let dy = p.y - ny;
      let d = Math.hypot(dx, dy);
      if (d < 0.0001) {
        dx = 0;
        dy = -1;
        d = 1;
      }
      const push = p.radius - Math.hypot(p.x - nx, p.y - ny);
      p.x += (dx / d) * push;
      p.y += (dy / d) * push;
    }
  }
}

function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

export function isInVent(player, world) {
  return pointInRect(player.x, player.y, world.vent);
}

export function isInCover(player, world) {
  for (const c of world.covers) {
    if (c.type === 'curtain') continue;
    const pad = 10;
    if (
      player.x > c.x - pad &&
      player.x < c.x + c.w + pad &&
      player.y > c.y - pad &&
      player.y < c.y + c.h + pad
    ) {
      return true;
    }
  }
  return false;
}

export function updatePlayer(player, dt, input, world, events) {
  let ix = 0;
  let iy = 0;
  if (input.left) ix -= 1;
  if (input.right) ix += 1;
  if (input.up) iy -= 1;
  if (input.down) iy += 1;

  player.sneaking = !!input.sneak;
  player.inVent = isInVent(player, world);
  player.hidden = isInCover(player, world);

  const mag = Math.hypot(ix, iy);
  player.moving = mag > 0;
  if (mag > 0) {
    ix /= mag;
    iy /= mag;
    player.angle = Math.atan2(iy, ix);
  }

  let speed = player.sneaking ? P.sneakSpeed : P.speed;
  if (player.inVent) speed *= CONFIG.VENT_SPEED;
  if (player.interacting) speed *= 0.4;

  player.vx = ix * speed;
  player.vy = iy * speed;

  const steps = Math.max(1, Math.ceil((speed * dt) / 8));
  const subDt = dt / steps;
  for (let i = 0; i < steps; i++) {
    player.x += player.vx * subDt;
    player.y += player.vy * subDt;
    resolveCollisions(player, world);
  }

  if (player.moving) {
    player.stepTimer -= dt;
    const interval = player.sneaking ? 0.62 : player.inVent ? 0.7 : 0.34;
    if (player.stepTimer <= 0) {
      player.stepTimer = interval;
      player.footstepFlip ^= 1;
      if (events && events.footstep) events.footstep(player.sneaking ? 0.35 : 1);
    }
  } else {
    player.stepTimer = 0;
  }

  player.coinCooldown = Math.max(0, player.coinCooldown - dt);
  player.bump = Math.max(0, player.bump - dt * 4);
}

export function findInteractable(player, world) {
  let best = null;
  let bestDist = Infinity;
  for (const item of world.loot) {
    if (item.taken) continue;
    const cx = item.x + (item.w || 0) / 2;
    const cy = item.y + (item.h || 0) / 2;
    const d = Math.hypot(cx - player.x, cy - player.y);
    const reach = item.type === 'painting' ? P.interactRange + 14 : P.interactRange;
    if (d < reach && d < bestDist) {
      bestDist = d;
      best = item;
    }
  }
  const exitDist = Math.hypot(world.exit.x - player.x, world.exit.y - player.y);
  if (player.carry.includes('star') && exitDist < 56) {
    return { type: 'exit', dist: exitDist };
  }
  return best ? { type: 'loot', item: best, dist: bestDist } : null;
}

export function interactTimeFor(item) {
  if (item.type === 'painting') return CONFIG.INTERACT.paintingTime;
  if (item.type === 'case') return CONFIG.INTERACT.caseTime;
  if (item.type === 'star') return CONFIG.INTERACT.starTime;
  return 0;
}

export function completeInteract(player, item, events) {
  item.taken = true;
  player.carry.push(item.id);
  if (events && events.pickup) events.pickup(item);
}

export function canTossCoin(player) {
  return player.coinCooldown <= 0 && player.coins > 0;
}
