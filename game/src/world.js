import { CONFIG } from './config.js';
import { mulberry32, range } from './random.js';

const W = CONFIG.WIDTH;
const H = CONFIG.HEIGHT;
const T = 16;

function wall(x, y, w, h) {
  return { x, y, w, h };
}

export function buildWorld(seed = CONFIG.SEED) {
  const rng = mulberry32(seed >>> 0);

  const walls = [
    wall(0, 0, W, T),
    wall(0, H - T, W, T),
    wall(0, 0, T, H),
    wall(W - T, 0, T, H),

    wall(16, 150, 24, T),
    wall(100, 150, 28, T),
    wall(128, 150, 82, T),
    wall(270, 150, 62, T),
    wall(332, 150, 228, T),
    wall(650, 150, 234, T),
    wall(884, 150, 196, T),
    wall(1080, 150, 184, T),

    wall(16, 620, 24, T),
    wall(100, 620, 100, T),
    wall(280, 620, 280, T),
    wall(650, 620, 450, T),
    wall(1180, 620, 84, T),

    wall(112, 150, T, 180),
    wall(112, 400, T, 220),

    wall(316, 150, T, 180),
    wall(316, 410, T, 210),

    wall(884, 150, T, 180),
    wall(884, 410, T, 210),

    wall(1004, 150, T, 60),
    wall(1004, 280, T, 36),
    wall(1004, 316, 116, T),
    wall(1200, 316, 64, T),
  ];

  const rooms = [
    { name: 'north', x: 16, y: 16, w: 1248, h: 134, floor: 'stone' },
    { name: 'lobby', x: 16, y: 636, w: 1248, h: 148, floor: 'marble' },
    { name: 'vent', x: 16, y: 166, w: 96, h: 454, floor: 'metal' },
    { name: 'gallery', x: 128, y: 166, w: 188, h: 454, floor: 'parquet' },
    { name: 'hall', x: 332, y: 166, w: 552, h: 454, floor: 'parquet' },
    { name: 'east', x: 900, y: 166, w: 364, h: 454, floor: 'parquet' },
    { name: 'vault', x: 1020, y: 166, w: 244, h: 150, floor: 'marble' },
  ];

  const rugs = [
    { x: 430, y: 300, w: 360, h: 240, color: '#5a1f2a', border: '#8a6a34' },
    { x: 150, y: 390, w: 140, h: 180, color: '#3d2038', border: '#7d5a30' },
    { x: 940, y: 400, w: 220, h: 150, color: '#26324f', border: '#7d5a30' },
    { x: 80, y: 660, w: 300, h: 90, color: '#4a1c24', border: '#8a6a34' },
  ];

  const loot = [
    { id: 'painting-a', type: 'painting', x: 140, y: 260, w: 12, h: 70, wall: 'left', value: CONFIG.LOOT.painting, taken: false },
    { id: 'painting-b', type: 'painting', x: 140, y: 450, w: 12, h: 70, wall: 'left', value: CONFIG.LOOT.painting, taken: false },
    { id: 'painting-c', type: 'painting', x: 904, y: 260, w: 12, h: 70, wall: 'right', value: CONFIG.LOOT.painting, taken: false },
    { id: 'case-a', type: 'case', x: 220, y: 520, w: 62, h: 38, value: CONFIG.LOOT.displayCase, taken: false },
    { id: 'case-b', type: 'case', x: 1080, y: 480, w: 62, h: 38, value: CONFIG.LOOT.displayCase, taken: false },
    { id: 'star', type: 'star', x: 1140, y: 240, w: 28, h: 28, value: CONFIG.LOOT.star, taken: false },
  ];

  const covers = [
    { id: 'statue-1', type: 'statue', x: 413, y: 283, w: 34, h: 34, blocksLOS: true },
    { id: 'statue-2', type: 'statue', x: 763, y: 463, w: 34, h: 34, blocksLOS: true },
    { id: 'statue-3', type: 'statue', x: 233, y: 323, w: 34, h: 34, blocksLOS: true },
    { id: 'statue-4', type: 'statue', x: 1000, y: 470, w: 34, h: 34, blocksLOS: true },
    { id: 'statue-5', type: 'statue', x: 323, y: 683, w: 34, h: 34, blocksLOS: true },
    { id: 'curtain-1', type: 'curtain', x: 500, y: 170, w: 110, h: 12, blocksLOS: true },
    { id: 'curtain-2', type: 'curtain', x: 180, y: 170, w: 100, h: 12, blocksLOS: true },
    { id: 'curtain-3', type: 'curtain', x: 336, y: 430, w: 12, h: 110, blocksLOS: true },
    { id: 'case-cover', type: 'case', x: 585, y: 280, w: 70, h: 40, blocksLOS: true, coverOnly: true },
    { id: 'crate-1', type: 'crate', x: 150, y: 560, w: 30, h: 30, blocksLOS: true },
    { id: 'crate-2', type: 'crate', x: 980, y: 700, w: 32, h: 32, blocksLOS: true },
  ];

  const ropes = [
    { x: 452, y: 332, w: 316, h: 4 },
    { x: 452, y: 504, w: 316, h: 4 },
    { x: 452, y: 332, w: 4, h: 176 },
    { x: 764, y: 332, w: 4, h: 176 },
  ];

  const guardRoutes = [
    {
      id: 'guard-hall',
      color: '#7fd4ff',
      route: [
        { x: 400, y: 240 },
        { x: 800, y: 240 },
        { x: 800, y: 560 },
        { x: 400, y: 560 },
      ],
    },
    {
      id: 'guard-north',
      color: '#9be7c4',
      route: [
        { x: 220, y: 80 },
        { x: 1040, y: 80 },
        { x: 600, y: 118 },
      ],
    },
    {
      id: 'guard-east',
      color: '#c9b8ff',
      route: [
        { x: 960, y: 380 },
        { x: 1180, y: 380 },
        { x: 1180, y: 560 },
        { x: 960, y: 560 },
      ],
    },
  ];

  const cameraMounts = [
    { id: 'cam-north', x: 700, y: 34, baseAngle: Math.PI / 2, sweep: 0.95, speed: 0.6 },
    { id: 'cam-east', x: 1240, y: 352, baseAngle: 2.25, sweep: 0.7, speed: 0.45 },
  ];

  const vent = { x: 16, y: 166, w: 96, h: 454 };

  const exit = { x: 700, y: 82, r: 30 };

  const start = { x: 180, y: 712 };

  const decor = {
    pillars: [
      { x: 360, y: 220 },
      { x: 856, y: 220 },
      { x: 360, y: 580 },
      { x: 856, y: 580 },
      { x: 118, y: 690 },
    ],
    plants: [
      { x: 290, y: 690 },
      { x: 1230, y: 700 },
      { x: 300, y: 200 },
    ],
    jitter: Array.from({ length: 24 }, () => ({
      x: range(rng, 0, 1),
      y: range(rng, 0, 1),
      a: range(rng, 0, Math.PI * 2),
    })),
  };

  return {
    seed,
    width: W,
    height: H,
    walls,
    rooms,
    rugs,
    loot,
    covers,
    ropes,
    guardRoutes,
    cameraMounts,
    vent,
    exit,
    start,
    decor,
    vault: { x: 1020, y: 166, w: 244, h: 150 },
  };
}
