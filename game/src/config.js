export const CONFIG = {
  WIDTH: 1280,
  HEIGHT: 800,
  SEED: 1,

  PLAYER: {
    radius: 13,
    speed: 172,
    sneakSpeed: 82,
    interactRange: 48,
    starSlow: 0.92,
    coinCooldown: 0.35,
    coinRange: 300,
    coinSpeed: 560,
  },

  GUARD: {
    radius: 13,
    speed: 76,
    distractSpeed: 96,
    visionRange: 190,
    visionAngle: (70 * Math.PI) / 180,
    suspicionRate: 1.3,
    suspicionDecay: 0.72,
    sneakFactor: 0.74,
    grace: 1.2,
    pauseTime: 1.5,
    distractTime: 4,
    distractRadius: 290,
    noiseDistractTime: 2.6,
  },

  CAMERA: {
    radius: 10,
    range: 215,
    coneAngle: (54 * Math.PI) / 180,
    empTime: 10,
  },

  ALARM: {
    max: 100,
    guardRate: 27,
    cameraRate: 11,
    alertRate: 50,
    decay: 10,
    suspiciousAt: 25,
    alertAt: 60,
    heartbeatInterval: 0.62,
  },

  LOOT: {
    painting: 350,
    displayCase: 900,
    star: 5000,
  },

  INTERACT: {
    paintingTime: 0,
    caseTime: 2,
    starTime: 3,
  },

  COUNTS: {
    guards: 3,
    cameras: 2,
  },

  EMP_CHARGES: 2,
  VENT_SPEED: 0.6,

  RATING: {
    ghost: 25,
    clean: 60,
  },
};
