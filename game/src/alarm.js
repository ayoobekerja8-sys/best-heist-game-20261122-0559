import { CONFIG } from './config.js';

const A = CONFIG.ALARM;

export function createAlarm() {
  return {
    value: 0,
    state: 'calm',
    heartbeatTimer: 0,
    flash: 0,
    lastRise: 0,
    everAbove: 0,
    peak: 0,
    alarmSoundTimer: 0,
  };
}

export function updateAlarm(alarm, dt, ctx) {
  const { guards, cameras, player, world } = ctx;

  let seenByGuard = false;
  let seenByCamera = false;
  let guardDetect = 0;
  let camDetect = 0;
  let anyAlert = false;

  for (const g of guards) {
    if (g.seesPlayer) {
      seenByGuard = true;
      guardDetect = Math.max(guardDetect, g.detectLevel);
    }
    if (g.state === 'alert') anyAlert = true;
  }
  for (const c of cameras) {
    if (c.seesPlayer) {
      seenByCamera = true;
      camDetect = Math.max(camDetect, c.detectLevel);
    }
  }

  let rise = 0;
  if (seenByGuard) rise += A.guardRate * guardDetect;
  if (seenByCamera) rise += A.cameraRate * camDetect;
  if (anyAlert) rise += A.alertRate * 0.45;

  if (rise > 0) {
    alarm.value = Math.min(A.max, alarm.value + rise * dt);
    alarm.lastRise = 0.35;
  } else {
    alarm.lastRise = Math.max(0, alarm.lastRise - dt);
    const decay = player.hidden || player.inVent ? A.decay * 1.9 : A.decay;
    alarm.value = Math.max(0, alarm.value - decay * dt);
  }

  alarm.peak = Math.max(alarm.peak, alarm.value);

  if (alarm.value >= A.max) {
    alarm.state = 'lockdown';
    alarm.value = A.max;
  } else if (alarm.value >= A.alertAt || anyAlert) {
    alarm.state = 'alert';
  } else if (alarm.value >= A.suspiciousAt) {
    alarm.state = 'suspicious';
  } else {
    alarm.state = 'calm';
  }

  alarm.flash = Math.max(0, alarm.flash - dt * 2.2);

  const spotted = seenByGuard || seenByCamera;
  if (spotted) {
    alarm.heartbeatTimer -= dt;
    if (alarm.heartbeatTimer <= 0) {
      alarm.heartbeatTimer = A.heartbeatInterval * (alarm.value > 70 ? 0.7 : 1);
      if (alarm.onHeartbeat) alarm.onHeartbeat();
    }
    alarm.alarmSoundTimer -= dt;
    if (alarm.alarmSoundTimer <= 0 && alarm.value > 45) {
      alarm.alarmSoundTimer = 1.6;
      if (alarm.onAlarm) alarm.onAlarm();
    }
  } else {
    alarm.heartbeatTimer = 0;
    alarm.alarmSoundTimer = 0;
  }

  if (alarm.value >= A.max && alarm.onLockdown) {
    alarm.onLockdown();
  }
  return alarm;
}

export function alarmColor(value) {
  if (value >= A.alertAt) return '#ff4d5e';
  if (value >= A.suspiciousAt) return '#ffc24d';
  return '#5ce1a6';
}

export function alarmLabel(state) {
  if (state === 'lockdown') return 'LOCKDOWN';
  if (state === 'alert') return 'ALERT';
  if (state === 'suspicious') return 'SUSPICIOUS';
  return 'CALM';
}

export function ratingFor(alarm, lootTotal, starTaken, escaped) {
  if (!escaped) return 'CAUGHT';
  if (starTaken && alarm.peak <= CONFIG.RATING.ghost) return 'GHOST';
  if (alarm.peak <= CONFIG.RATING.clean) return 'CLEAN';
  return 'LOUD';
}
