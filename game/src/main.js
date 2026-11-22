import { CONFIG } from './config.js';
import { buildWorld } from './world.js';
import { createPlayer, updatePlayer, findInteractable, interactTimeFor, completeInteract, canTossCoin } from './player.js';
import { createGuards, updateGuards, distractGuards, nearestGuard } from './guards.js';
import { createCameras, updateCameras, empNearestCamera } from './cameras.js';
import { createAlarm, updateAlarm, ratingFor } from './alarm.js';
import { render } from './render.js';
import { applyShot, readShot } from './shots.js';
import * as audio from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const el = {
  alarmBar: document.getElementById('hud-alarm-bar'),
  alarmText: document.getElementById('hud-alarm-text'),
  loot: document.getElementById('hud-loot'),
  emp: document.getElementById('hud-emp'),
  timer: document.getElementById('hud-timer'),
  objective: document.getElementById('hud-objective'),
  paintings: document.getElementById('hud-paintings'),
  cases: document.getElementById('hud-cases'),
  star: document.getElementById('hud-star'),
};

function seedFromUrl() {
  try {
    const params = new URLSearchParams(location.search);
    const raw = params.get('seed');
    const n = Number.parseInt(raw ?? '', 10);
    if (Number.isFinite(n)) return n >>> 0;
  } catch (err) {
    /* ignored */
  }
  return CONFIG.SEED;
}

function createGame(seed) {
  const world = buildWorld(seed);
  const player = createPlayer(world);
  const guards = createGuards(world);
  const cameras = createCameras(world);
  const alarm = createAlarm();

  const state = {
    seed,
    screen: 'menu',
    frozen: false,
    time: 0,
    elapsed: 0,
    fps: 60,
    debug: false,
    world,
    player,
    guards,
    cameras,
    alarm,
    coins: [],
    hint: null,
    objective: 'STEAL THE STAR OF MERIDIAN',
    lootTotal: 0,
    lootCounts: { paintings: 0, cases: 0 },
    starTaken: false,
    rating: '',
    ratingPeak: 0,
    input: { left: false, right: false, up: false, down: false, sneak: false, interact: false },
    eHeld: false,
    interactItem: null,
    lockpickTimer: 0,
    prevAlertCount: 0,
    lastFrame: 0,
  };

  alarm.onHeartbeat = () => audio.playHeartbeat();
  alarm.onAlarm = () => audio.playAlarm();
  alarm.onLockdown = () => {
    if (state.screen === 'playing') triggerCaught(state);
  };

  return state;
}

let state = createGame(seedFromUrl());

function updateDerived() {
  const world = state.world;
  let total = 0;
  let paintings = 0;
  let cases = 0;
  let starTaken = false;
  for (const item of world.loot) {
    if (!item.taken) continue;
    total += item.value;
    if (item.type === 'painting') paintings++;
    else if (item.type === 'case') cases++;
    else if (item.type === 'star') starTaken = true;
  }
  state.lootTotal = total;
  state.lootCounts = { paintings, cases };
  state.starTaken = starTaken;
  if (state.screen === 'playing') {
    state.objective = starTaken ? 'REACH THE SKYLIGHT EXIT' : 'STEAL THE STAR OF MERIDIAN';
  }
  if (el.alarmBar) {
    const frac = Math.max(0, Math.min(1, state.alarm.value / CONFIG.ALARM.max));
    el.alarmBar.style.width = `${(frac * 100).toFixed(1)}%`;
    el.alarmBar.style.background =
      state.alarm.value >= CONFIG.ALARM.alertAt ? '#ff4d5e' : state.alarm.value >= CONFIG.ALARM.suspiciousAt ? '#ffc24d' : '#5ce1a6';
  }
  if (el.alarmText) el.alarmText.textContent = `ALARM ${Math.round(state.alarm.value)}% · ${state.alarm.state.toUpperCase()}`;
  if (el.loot) el.loot.textContent = `LOOT ${total.toLocaleString()} GOLD`;
  if (el.emp) el.emp.textContent = `EMP ${state.player.empCharges}/${CONFIG.EMP_CHARGES} · COINS ${state.player.coins}`;
  if (el.timer) {
    const mm = Math.floor(state.elapsed / 60)
      .toString()
      .padStart(2, '0');
    const ss = Math.floor(state.elapsed % 60)
      .toString()
      .padStart(2, '0');
    el.timer.textContent = `TIME ${mm}:${ss}`;
  }
  if (el.objective) el.objective.textContent = state.objective;
  if (el.paintings) el.paintings.textContent = `${paintings}/3`;
  if (el.cases) el.cases.textContent = `${cases}/2`;
  if (el.star) el.star.textContent = starTaken ? 'YES' : 'NO';
}

function startGame() {
  state.screen = 'playing';
  state.elapsed = 0;
  state.alarm.value = 0;
  state.alarm.state = 'calm';
  state.alarm.peak = 0;
  audio.playClick();
}

function restart() {
  const seed = state.seed;
  const fresh = createGame(seed);
  Object.assign(state, fresh);
  state.coins = fresh.coins;
  state.alarm.onHeartbeat = () => audio.playHeartbeat();
  state.alarm.onAlarm = () => audio.playAlarm();
  state.alarm.onLockdown = () => {
    if (state.screen === 'playing') triggerCaught(state);
  };
  state.lastFrame = 0;
  state.time = 0;
  audio.playClick();
}

function triggerCaught(s) {
  s.screen = 'caught';
  s.rating = 'CAUGHT';
  s.ratingPeak = s.alarm.peak;
  s.alarm.value = CONFIG.ALARM.max;
  s.alarm.state = 'lockdown';
  s.alarm.flash = 1;
  s.player.interacting = null;
  s.interactItem = null;
  s.hint = null;
  audio.playLose();
}

function triggerEscaped(s) {
  s.screen = 'escaped';
  s.rating = ratingFor(s.alarm, s.lootTotal, s.starTaken, true);
  s.ratingPeak = s.alarm.peak;
  s.player.interacting = null;
  s.interactItem = null;
  s.hint = null;
  audio.playWin();
}

function tryEscape() {
  if (state.screen !== 'playing') return;
  if (!state.starTaken) return;
  const d = Math.hypot(state.world.exit.x - state.player.x, state.world.exit.y - state.player.y);
  if (d < 58) triggerEscaped(state);
}

function beginInteract() {
  if (state.screen !== 'playing') return;
  const hint = findInteractable(state.player, state.world);
  if (!hint) return;

  if (hint.type === 'exit') {
    tryEscape();
    return;
  }
  const item = hint.item;
  if (item.type === 'painting') {
    completeInteract(state.player, item, { pickup: onPickup });
    audio.playPickup(item.value);
    return;
  }
  const time = interactTimeFor(item);
  state.interactItem = item;
  state.player.interacting = { kind: item.type === 'star' ? 'star' : 'case', total: time };
  state.player.progress = 0;
  state.lockpickTimer = 0;
  audio.playLockpick();
}

function cancelInteract() {
  state.interactItem = null;
  state.player.interacting = null;
  state.player.progress = 0;
}

function onPickup(item) {
  audio.playPickup(item.value);
  if (item.type === 'star') {
    state.alarm.value = Math.min(CONFIG.ALARM.max - 1, state.alarm.value + 8);
    state.alarm.flash = 0.5;
  }
  if (item.type === 'case') {
    distractGuards(state.guards, item.x + item.w / 2, item.y + item.h / 2, 250);
    state.alarm.value = Math.min(CONFIG.ALARM.max - 1, state.alarm.value + 5);
    audio.playDistract();
  }
  state.hint = null;
}

function updateInteract(dt) {
  if (state.screen !== 'playing') return;
  if (!state.interactItem) return;
  const item = state.interactItem;
  const cx = item.x + (item.w || 0) / 2;
  const cy = item.y + (item.h || 0) / 2;
  const d = Math.hypot(cx - state.player.x, cy - state.player.y);
  const reach = item.type === 'painting' ? CONFIG.PLAYER.interactRange + 10 : CONFIG.PLAYER.interactRange;

  if (item.taken || d > reach + 8) {
    cancelInteract();
    return;
  }
  if (!state.eHeld) {
    cancelInteract();
    return;
  }

  state.player.progress += dt;
  state.lockpickTimer -= dt;
  if (state.lockpickTimer <= 0) {
    state.lockpickTimer = 0.22;
    audio.playLockpick();
  }

  if (state.player.progress >= state.player.interacting.total) {
    completeInteract(state.player, item, { pickup: onPickup });
    state.interactItem = null;
    state.player.interacting = null;
    state.player.progress = 0;
  }
}

function tossCoin(mx, my) {
  if (state.screen !== 'playing') return;
  const p = state.player;
  if (!canTossCoin(p)) return;
  const dx = mx - p.x;
  const dy = my - p.y;
  const dist = Math.hypot(dx, dy) || 1;
  const travel = Math.min(dist, CONFIG.PLAYER.coinRange);
  const tx = p.x + (dx / dist) * travel;
  const ty = p.y + (dy / dist) * travel;
  p.coins -= 1;
  p.coinCooldown = CONFIG.PLAYER.coinCooldown;
  state.coins.push({ x: p.x, y: p.y, tx, ty, speed: CONFIG.PLAYER.coinSpeed, landed: false, life: 0, spin: 0 });
  audio.playCoin();
}

function useEmp() {
  if (state.screen !== 'playing') return;
  const p = state.player;
  if (p.empCharges <= 0) return;
  p.empCharges -= 1;
  const cam = empNearestCamera(state.cameras, p.x, p.y, CONFIG.CAMERA.empTime);
  state.alarm.value = Math.max(0, state.alarm.value - 4);
  audio.playEmp();
  if (cam) {
    cam.disabled = CONFIG.CAMERA.empTime;
    cam.seesPlayer = false;
    cam.detectLevel = 0;
  }
}

function updateCoins(dt) {
  for (const c of state.coins) {
    if (!c.landed) {
      const dx = c.tx - c.x;
      const dy = c.ty - c.y;
      const dist = Math.hypot(dx, dy);
      const step = c.speed * dt;
      c.spin += dt * 18;
      if (dist <= step) {
        c.x = c.tx;
        c.y = c.ty;
        c.landed = true;
        c.life = 1.3;
        const target = nearestGuard(state.guards, c.x, c.y);
        if (target && target.dist <= CONFIG.GUARD.distractRadius) {
          distractGuards(state.guards, c.x, c.y, CONFIG.GUARD.distractRadius);
          audio.playDistract();
        }
      } else {
        c.x += (dx / dist) * step;
        c.y += (dy / dist) * step;
      }
    } else {
      c.life -= dt;
    }
  }
  state.coins = state.coins.filter((c) => !c.landed || c.life > 0);
}

function step(dt) {
  state.time += dt;
  if (state.screen === 'playing') {
    state.elapsed += dt;
    updatePlayer(state.player, dt, state.input, state.world, {
      footstep: (intensity) => audio.playFootstep(intensity),
    });
    updateInteract(dt);
    updateCoins(dt);
    updateGuards(state.guards, dt, { player: state.player, world: state.world });
    updateCameras(state.cameras, dt, { player: state.player, world: state.world });
    updateAlarm(state.alarm, dt, {
      guards: state.guards,
      cameras: state.cameras,
      player: state.player,
      world: state.world,
    });

    const alertCount = state.guards.filter((g) => g.state === 'alert').length;
    if (alertCount > state.prevAlertCount) audio.playAlertSting();
    state.prevAlertCount = alertCount;

    state.hint = findInteractable(state.player, state.world);
    updateDerived();

    if (state.alarm.value >= CONFIG.ALARM.max && state.screen === 'playing') {
      triggerCaught(state);
    }
  } else if (state.screen === 'caught' || state.screen === 'escaped') {
    state.alarm.flash = Math.max(0, state.alarm.flash - dt * 1.6);
    updateDerived();
  } else {
    updateDerived();
  }
}

function frame(now) {
  if (!state.lastFrame) state.lastFrame = now;
  let dt = (now - state.lastFrame) / 1000;
  state.lastFrame = now;
  if (!Number.isFinite(dt) || dt < 0) dt = 0;
  dt = Math.min(dt, 0.05);
  if (dt > 0) state.fps = state.fps * 0.92 + (1 / dt) * 0.08;

  if (!state.frozen) step(dt);
  else {
    state.time += dt;
    updateDerived();
  }

  render(ctx, state);
  requestAnimationFrame(frame);
}

function canvasPoint(ev) {
  const rect = canvas.getBoundingClientRect();
  const x = ((ev.clientX - rect.left) / rect.width) * CONFIG.WIDTH;
  const y = ((ev.clientY - rect.top) / rect.height) * CONFIG.HEIGHT;
  return { x, y };
}

const keyMap = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
};

window.addEventListener('keydown', (ev) => {
  audio.initAudio();
  const code = ev.code;
  if (keyMap[code]) {
    state.input[keyMap[code]] = true;
    ev.preventDefault();
  }
  if (code === 'ShiftLeft' || code === 'ShiftRight') state.input.sneak = true;

  if (code === 'KeyE' && !ev.repeat) {
    state.eHeld = true;
    state.input.interact = true;
    beginInteract();
  }

  if (code === 'KeyQ' && !ev.repeat) {
    useEmp();
    ev.preventDefault();
  }

  if (code === 'KeyM' && !ev.repeat) {
    audio.toggleMute();
  }

  if (code === 'Enter' && !ev.repeat) {
    if (state.screen === 'menu') startGame();
    else if (state.screen === 'caught' || state.screen === 'escaped') restart();
  }

  if (code === 'KeyR' && !ev.repeat) {
    if (state.screen !== 'menu') restart();
  }

  if (code === 'Backquote' && !ev.repeat) {
    state.debug = !state.debug;
  }
});

window.addEventListener('keyup', (ev) => {
  const code = ev.code;
  if (keyMap[code]) {
    state.input[keyMap[code]] = false;
    ev.preventDefault();
  }
  if (code === 'ShiftLeft' || code === 'ShiftRight') state.input.sneak = false;
  if (code === 'KeyE') {
    state.eHeld = false;
    state.input.interact = false;
    cancelInteract();
  }
});

window.addEventListener('blur', () => {
  state.input.left = false;
  state.input.right = false;
  state.input.up = false;
  state.input.down = false;
  state.input.sneak = false;
  state.eHeld = false;
  state.input.interact = false;
  cancelInteract();
});

canvas.addEventListener('pointerdown', (ev) => {
  audio.initAudio();
  if (ev.button !== 0) return;
  const pt = canvasPoint(ev);
  if (state.screen === 'menu') {
    startGame();
    return;
  }
  if (state.screen === 'caught' || state.screen === 'escaped') {
    restart();
    return;
  }
  tossCoin(pt.x, pt.y);
});

canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());

canvas.width = CONFIG.WIDTH;
canvas.height = CONFIG.HEIGHT;

const shotApplied = applyShot(state);
if (shotApplied) state.frozen = true;
updateDerived();

window.__vaultlight = state;

requestAnimationFrame(frame);

window.addEventListener('resize', () => {
  updateDerived();
});
