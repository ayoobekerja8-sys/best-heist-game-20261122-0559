import { CONFIG } from './config.js';

function guardById(state, id) {
  return state.guards.find((g) => g.id === id);
}

function markTaken(world, ids) {
  for (const item of world.loot) {
    if (ids.includes(item.id)) item.taken = true;
  }
}

function placeGuard(g, x, y, angle) {
  if (!g) return;
  g.x = x;
  g.y = y;
  g.angle = angle;
  g.pauseTimer = 1.2;
  g.scanPhase = 0.4;
}

export function readShot() {
  if (typeof location === 'undefined') return null;
  try {
    const params = new URLSearchParams(location.search);
    return params.get('shot');
  } catch (err) {
    return null;
  }
}

export function applyShot(state) {
  const shot = readShot();
  if (!shot) return false;

  const world = state.world;
  const player = state.player;
  const alarm = state.alarm;
  const cameras = state.cameras;

  alarm.heartbeatTimer = 0;
  alarm.flash = 0;
  alarm.peak = 0;
  player.interacting = null;
  player.progress = 0;

  if (shot === 'start') {
    state.screen = 'menu';
    alarm.value = 0;
    alarm.state = 'calm';
    alarm.peak = 0;
    player.x = 300;
    player.y = 690;
    player.angle = -Math.PI / 2;
    placeGuard(guardById(state, 'guard-hall'), 452, 236, 0.24);
    placeGuard(guardById(state, 'guard-north'), 540, 84, 0.02);
    placeGuard(guardById(state, 'guard-east'), 1064, 430, 1.62);
    cameras[0].phase = 1.15;
    cameras[0].angle = cameras[0].baseAngle + Math.sin(cameras[0].phase) * cameras[0].sweep;
    cameras[1].phase = 0.35;
    cameras[1].angle = cameras[1].baseAngle + Math.sin(cameras[1].phase) * cameras[1].sweep;
    state.elapsed = 0;
    state.objective = 'STEAL THE STAR OF MERIDIAN';
    state.hint = null;
    return true;
  }

  if (shot === 'play') {
    state.screen = 'playing';
    markTaken(world, ['painting-a', 'painting-b', 'case-a']);
    player.x = 404;
    player.y = 300;
    player.angle = -1.15;
    player.sneaking = true;
    player.hidden = true;
    player.carry = ['painting-a', 'painting-b', 'case-a'];
    player.coins = 2;
    player.empCharges = 2;

    const hall = guardById(state, 'guard-hall');
    placeGuard(hall, 620, 300, Math.PI * 0.99);
    hall.suspicion = 0.52;
    hall.state = 'suspicious';
    hall.grace = 0.5;
    hall.seesPlayer = false;
    hall.detectLevel = 0;

    const north = guardById(state, 'guard-north');
    placeGuard(north, 880, 84, Math.PI * 0.96);
    north.suspicion = 0.12;
    north.state = 'patrol';

    const east = guardById(state, 'guard-east');
    placeGuard(east, 1050, 540, -1.2);
    east.suspicion = 0.08;
    east.state = 'patrol';

    cameras[0].phase = 1.25;
    cameras[0].angle = cameras[0].baseAngle + Math.sin(cameras[0].phase) * cameras[0].sweep;
    cameras[1].phase = 0.42;
    cameras[1].angle = cameras[1].baseAngle + Math.sin(cameras[1].phase) * cameras[1].sweep;

    alarm.value = 35;
    alarm.state = 'suspicious';
    alarm.peak = 42;
    alarm.lastRise = 0.3;
    state.elapsed = 96;
    state.objective = 'CRACK THE VAULT SAFE — STAR OF MERIDIAN';
    state.hint = null;
    state.coins = [
      { x: 402, y: 316, tx: 402, ty: 316, speed: 0, landed: true, life: 1.1 },
    ];
    return true;
  }

  if (shot === 'caught') {
    state.screen = 'caught';
    markTaken(world, ['painting-a', 'painting-b', 'case-a']);
    player.x = 470;
    player.y = 372;
    player.angle = -0.9;
    player.carry = ['painting-a', 'painting-b', 'case-a'];

    const hall = guardById(state, 'guard-hall');
    placeGuard(hall, 556, 330, Math.atan2(player.y - 330, player.x - 556));
    hall.suspicion = 1.2;
    hall.grace = 1.2;
    hall.state = 'alert';
    hall.alertTimer = 3.2;
    hall.seesPlayer = true;
    hall.detectLevel = 1;

    const north = guardById(state, 'guard-north');
    placeGuard(north, 780, 84, Math.PI);
    north.state = 'suspicious';
    north.suspicion = 0.5;

    const east = guardById(state, 'guard-east');
    placeGuard(east, 1080, 520, -2.1);
    east.state = 'suspicious';
    east.suspicion = 0.3;

    cameras[0].phase = 0.8;
    cameras[0].angle = cameras[0].baseAngle + Math.sin(0.8) * cameras[0].sweep;
    cameras[1].phase = 0.2;
    cameras[1].angle = cameras[1].baseAngle + Math.sin(0.2) * cameras[1].sweep;

    alarm.value = 100;
    alarm.state = 'lockdown';
    alarm.peak = 100;
    alarm.flash = 0.95;
    state.elapsed = 148;
    state.rating = 'CAUGHT';
    state.objective = 'LOCKDOWN — GALLERY SEALED';
    state.hint = null;
    return true;
  }

  if (shot === 'end') {
    state.screen = 'escaped';
    for (const item of world.loot) item.taken = true;
    player.x = 700;
    player.y = 100;
    player.angle = -Math.PI / 2;
    player.sneaking = false;
    player.carry = world.loot.map((l) => l.id);

    const hall = guardById(state, 'guard-hall');
    placeGuard(hall, 560, 470, -1.4);
    hall.state = 'patrol';
    hall.suspicion = 0.05;

    const north = guardById(state, 'guard-north');
    placeGuard(north, 980, 84, Math.PI);

    const east = guardById(state, 'guard-east');
    placeGuard(east, 1080, 560, -1.9);

    cameras[0].phase = 0.5;
    cameras[0].angle = cameras[0].baseAngle + Math.sin(0.5) * cameras[0].sweep;
    cameras[1].phase = 1.4;
    cameras[1].angle = cameras[1].baseAngle + Math.sin(1.4) * cameras[1].sweep;

    alarm.value = 12;
    alarm.state = 'calm';
    alarm.peak = 18;
    state.elapsed = 214;
    state.rating = 'GHOST';
    state.objective = 'GETAWAY COMPLETE';
    state.hint = null;
    return true;
  }

  return false;
}
