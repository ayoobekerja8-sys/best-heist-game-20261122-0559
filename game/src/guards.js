import { CONFIG } from './config.js';

const G = CONFIG.GUARD;

export function rectBlocksSegment(x1, y1, x2, y2, rect) {
  const minX = rect.x;
  const maxX = rect.x + rect.w;
  const minY = rect.y;
  const maxY = rect.y + rect.h;
  let t0 = 0;
  let t1 = 1;
  const dx = x2 - x1;
  const dy = y2 - y1;

  const clip = (p, q) => {
    if (Math.abs(p) < 1e-9) return q >= 0;
    const r = q / p;
    if (p < 0) {
      if (r > t1) return false;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return false;
      if (r < t1) t1 = r;
    }
    return true;
  };

  if (!clip(-dx, x1 - minX)) return false;
  if (!clip(dx, maxX - x1)) return false;
  if (!clip(-dy, y1 - minY)) return false;
  if (!clip(dy, maxY - y1)) return false;
  return t0 <= t1;
}

export function segmentBlocked(x1, y1, x2, y2, world) {
  for (const w of world.walls) {
    if (rectBlocksSegment(x1, y1, x2, y2, w)) return true;
  }
  for (const c of world.covers) {
    if (c.blocksLOS && rectBlocksSegment(x1, y1, x2, y2, c)) return true;
  }
  return false;
}

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function inCone(ox, oy, angle, halfAngle, rangeDist, tx, ty) {
  const dx = tx - ox;
  const dy = ty - oy;
  const dist = Math.hypot(dx, dy);
  if (dist > rangeDist || dist < 1) return false;
  const a = Math.atan2(dy, dx);
  return Math.abs(angleDiff(a, angle)) <= halfAngle;
}

export function createGuards(world) {
  return world.guardRoutes.map((def, i) => {
    const start = def.route[0];
    return {
      id: def.id,
      color: def.color,
      route: def.route,
      index: 1 % def.route.length,
      x: start.x,
      y: start.y,
      angle: Math.atan2(def.route[1].y - start.y, def.route[1].x - start.x),
      state: 'patrol',
      pauseTimer: 0,
      suspicion: 0,
      grace: 0,
      alertTimer: 0,
      distractTimer: 0,
      distractX: 0,
      distractY: 0,
      scanPhase: i * 1.7,
      bob: i * 2.1,
      detectLevel: 0,
      seesPlayer: false,
      lastSeenX: start.x,
      lastSeenY: start.y,
      facing: 1,
    };
  });
}

function moveToward(g, tx, ty, speed, dt) {
  const dx = tx - g.x;
  const dy = ty - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return dist;
  const step = Math.min(dist, speed * dt);
  g.x += (dx / dist) * step;
  g.y += (dy / dist) * step;
  const targetAngle = Math.atan2(dy, dx);
  const turn = angleDiff(targetAngle, g.angle);
  const maxTurn = 5.5 * dt;
  g.angle += Math.max(-maxTurn, Math.min(maxTurn, turn));
  return dist;
}

export function updateGuards(guards, dt, ctx) {
  const { player, world } = ctx;

  for (const g of guards) {
    g.detectLevel = 0;
    g.seesPlayer = false;
    g.bob += dt * 3.2;

    const canSee =
      inCone(g.x, g.y, g.angle, G.visionAngle / 2, G.visionRange, player.x, player.y) &&
      !segmentBlocked(g.x, g.y, player.x, player.y, world);

    const distracted = g.distractTimer > 0;
    if (distracted) {
      g.distractTimer -= dt;
      if (g.distractTimer <= 0) {
        g.state = 'patrol';
      }
    }

    if (canSee) {
      g.seesPlayer = true;
      g.lastSeenX = player.x;
      g.lastSeenY = player.y;
      const factor = player.sneaking ? G.sneakFactor : 1;
      g.detectLevel = factor;
      g.suspicion = Math.min(1.35, g.suspicion + G.suspicionRate * factor * dt);
      if (g.suspicion >= 1 && g.state !== 'alert') {
        g.grace += dt;
        if (g.grace >= G.grace) {
          g.state = 'alert';
          g.alertTimer = 4.5;
        }
      }
      if (g.state !== 'alert' && g.suspicion > 0.2) g.state = 'suspicious';
    } else {
      g.grace = Math.max(0, g.grace - dt * 2);
      g.suspicion = Math.max(0, g.suspicion - G.suspicionDecay * dt);
      if (g.state === 'suspicious' && g.suspicion <= 0.02) g.state = distracted ? 'distracted' : 'patrol';
    }

    if (g.state === 'alert') {
      g.alertTimer -= dt;
      g.detectLevel = 1;
      g.suspicion = Math.min(1.35, g.suspicion + G.suspicionRate * 0.8 * dt);
      const face = Math.atan2(player.y - g.y, player.x - g.x);
      const turn = angleDiff(face, g.angle);
      g.angle += Math.max(-4.5 * dt, Math.min(4.5 * dt, turn));
      moveToward(g, player.x, player.y, G.speed * 0.85, dt);
      if (g.alertTimer <= 0) {
        g.state = 'suspicious';
        g.suspicion = Math.min(g.suspicion, 0.9);
        g.alertTimer = 0;
      }
      continue;
    }

    if (distracted && !g.seesPlayer) {
      g.state = 'distracted';
      const dist = moveToward(g, g.distractX, g.distractY, G.distractSpeed, dt);
      if (dist < 18) {
        const face = Math.atan2(g.distractY - g.y, g.distractX - g.x);
        g.angle = face;
        g.angle += Math.sin(g.bob * 2) * 0.02;
      }
      continue;
    }

    if (g.seesPlayer) {
      const face = Math.atan2(player.y - g.y, player.x - g.x);
      const turn = angleDiff(face, g.angle);
      g.angle += Math.max(-3.4 * dt, Math.min(3.4 * dt, turn));
      g.pauseTimer = 0.5;
      continue;
    }

    const target = g.route[g.index % g.route.length];
    const dist = moveToward(g, target.x, target.y, G.speed, dt);
    if (dist < 5) {
      g.pauseTimer -= dt;
      g.scanPhase += dt * 2.2;
      g.angle += Math.sin(g.scanPhase) * dt * 1.1;
      if (g.pauseTimer <= -G.pauseTime) {
        g.index = (g.index + 1) % g.route.length;
        g.pauseTimer = 0;
      }
    } else if (g.pauseTimer > 0) {
      g.pauseTimer -= dt;
    }
    if (Math.abs(Math.cos(g.angle)) > 0.2) g.facing = Math.cos(g.angle) > 0 ? 1 : -1;
  }
}

export function distractGuards(guards, x, y, radius) {
  let best = null;
  let bestDist = Infinity;
  for (const g of guards) {
    const d = Math.hypot(g.x - x, g.y - y);
    if (d < bestDist && d <= radius) {
      bestDist = d;
      best = g;
    }
  }
  if (!best) return null;
  best.distractTimer = G.distractTime;
  best.distractX = x;
  best.distractY = y;
  best.state = 'distracted';
  best.suspicion = Math.max(0, best.suspicion - 0.3);
  best.grace = 0;
  return best;
}

export function anyGuardSees(guards) {
  return guards.some((g) => g.seesPlayer);
}

export function maxDetection(guards) {
  let max = 0;
  for (const g of guards) {
    if (g.detectLevel > max) max = g.detectLevel;
  }
  return max;
}

export function nearestGuard(guards, x, y) {
  let best = null;
  let bestDist = Infinity;
  for (const g of guards) {
    const d = Math.hypot(g.x - x, g.y - y);
    if (d < bestDist) {
      bestDist = d;
      best = g;
    }
  }
  return best ? { guard: best, dist: bestDist } : null;
}
