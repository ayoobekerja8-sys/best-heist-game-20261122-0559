export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rand(rng) {
  return rng();
}

export function range(rng, min, max) {
  return min + (max - min) * rng();
}

export function int(rng, min, max) {
  return Math.floor(min + (max - min + 1) * rng());
}

export function pick(rng, list) {
  if (!list || list.length === 0) return undefined;
  return list[Math.floor(rng() * list.length) % list.length];
}

export function chance(rng, p) {
  return rng() < p;
}
