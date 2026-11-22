import { CONFIG } from './config.js';
import { inCone, segmentBlocked } from './guards.js';

const C = CONFIG.CAMERA;

export function createCameras(world) {
  return world.cameraMounts.map((def, i) => ({
    id: def.id,
    x: def.x,
    y: def.y,
    baseAngle: def.baseAngle,
    sweep: def.sweep,
    speed: def.speed,
    angle: def.baseAngle,
    phase: i * Math.PI * 0.8,
    disabled: 0,
    seesPlayer: false,
    detectLevel: 0,
    range: C.range,
    halfAngle: C.coneAngle / 2,
  }));
}

export function updateCameras(cameras, dt, ctx) {
  const { player, world } = ctx;
  for (const cam of cameras) {
    cam.seesPlayer = false;
    cam.detectLevel = 0;
    if (cam.disabled > 0) {
      cam.disabled = Math.max(0, cam.disabled - dt);
      cam.angle = cam.baseAngle;
      continue;
    }
    cam.phase += dt * cam.speed;
    cam.angle = cam.baseAngle + Math.sin(cam.phase) * cam.sweep;

    const canSee =
      inCone(cam.x, cam.y, cam.angle, cam.halfAngle, cam.range, player.x, player.y) &&
      !segmentBlocked(cam.x, cam.y, player.x, player.y, world);
    if (canSee) {
      cam.seesPlayer = true;
      cam.detectLevel = player.sneaking ? 0.5 : 1;
    }
  }
}

export function empNearestCamera(cameras, x, y, duration) {
  let best = null;
  let bestDist = Infinity;
  for (const cam of cameras) {
    const d = Math.hypot(cam.x - x, cam.y - y);
    if (d < bestDist) {
      bestDist = d;
      best = cam;
    }
  }
  if (!best) return null;
  best.disabled = duration;
  return best;
}

export function anyCameraSees(cameras) {
  return cameras.some((c) => c.seesPlayer);
}

export function maxCameraDetection(cameras) {
  let max = 0;
  for (const cam of cameras) {
    if (cam.detectLevel > max) max = cam.detectLevel;
  }
  return max;
}
