import { CONFIG } from './config.js';

const W = CONFIG.WIDTH;
const H = CONFIG.HEIGHT;

function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function drawFloor(ctx, world) {
  ctx.fillStyle = '#1a1410';
  ctx.fillRect(0, 0, W, H);

  for (const room of world.rooms) {
    if (room.floor === 'metal') {
      ctx.fillStyle = '#20242b';
      ctx.fillRect(room.x, room.y, room.w, room.h);
      ctx.strokeStyle = 'rgba(140,160,180,0.09)';
      ctx.lineWidth = 1;
      for (let y = room.y + 8; y < room.y + room.h; y += 16) {
        ctx.beginPath();
        ctx.moveTo(room.x, y);
        ctx.lineTo(room.x + room.w, y);
        ctx.stroke();
      }
      for (let x = room.x + 12; x < room.x + room.w; x += 22) {
        ctx.beginPath();
        ctx.moveTo(x, room.y);
        ctx.lineTo(x, room.y + room.h);
        ctx.stroke();
      }
      continue;
    }
    if (room.floor === 'marble') {
      ctx.fillStyle = '#221c22';
      ctx.fillRect(room.x, room.y, room.w, room.h);
      ctx.strokeStyle = 'rgba(190,170,200,0.07)';
      ctx.lineWidth = 1;
      const step = 46;
      for (let x = room.x; x < room.x + room.w; x += step) {
        for (let y = room.y; y < room.y + room.h; y += step) {
          ctx.strokeRect(x, y, step, step);
        }
      }
      continue;
    }
    ctx.fillStyle = '#2a1f16';
    ctx.fillRect(room.x, room.y, room.w, room.h);
    const plank = 26;
    let row = 0;
    for (let y = room.y; y < room.y + room.h; y += plank) {
      const offset = row % 2 === 0 ? 0 : 44;
      for (let x = room.x - offset; x < room.x + room.w; x += 88) {
        const x0 = Math.max(room.x, x);
        const x1 = Math.min(room.x + room.w, x + 86);
        if (x1 <= x0) continue;
        const shade = 0.5 + ((Math.sin(x * 0.031 + y * 0.017) + 1) / 2) * 0.5;
        const r = Math.floor(56 + shade * 22);
        const g = Math.floor(38 + shade * 16);
        const b = Math.floor(24 + shade * 10);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x0, y + 1, x1 - x0 - 1, plank - 2);
      }
      row++;
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.28)';
    ctx.lineWidth = 1;
    for (let y = room.y; y <= room.y + room.h; y += plank) {
      ctx.beginPath();
      ctx.moveTo(room.x, y);
      ctx.lineTo(room.x + room.w, y);
      ctx.stroke();
    }
  }

  const vg = ctx.createRadialGradient(W / 2, H / 2, 180, W / 2, H / 2, 760);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
}

function drawRugs(ctx, world) {
  for (const rug of world.rugs) {
    ctx.save();
    ctx.fillStyle = rug.color;
    ctx.fillRect(rug.x, rug.y, rug.w, rug.h);
    ctx.strokeStyle = rug.border;
    ctx.lineWidth = 4;
    ctx.strokeRect(rug.x + 6, rug.y + 6, rug.w - 12, rug.h - 12);
    ctx.strokeStyle = 'rgba(0,0,0,0.22)';
    ctx.lineWidth = 2;
    ctx.strokeRect(rug.x + 14, rug.y + 14, rug.w - 28, rug.h - 28);
    ctx.fillStyle = 'rgba(255,220,170,0.05)';
    for (let i = 0; i < 5; i++) {
      const cx = rug.x + 26 + i * ((rug.w - 52) / 4);
      ctx.beginPath();
      ctx.arc(cx, rug.y + rug.h / 2, 9, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawWalls(ctx, world) {
  for (const w of world.walls) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(w.x + 3, w.y + 4, w.w, w.h);
  }
  for (const w of world.walls) {
    const grad = ctx.createLinearGradient(w.x, w.y, w.x, w.y + w.h);
    grad.addColorStop(0, '#4b4453');
    grad.addColorStop(0.45, '#332e3a');
    grad.addColorStop(1, '#211d26');
    ctx.fillStyle = grad;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = 'rgba(150,140,170,0.28)';
    ctx.lineWidth = 1;
    ctx.strokeRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);
    if (w.h > 24) {
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(w.x, w.y, 3, w.h);
    }
  }
}

function drawSpotlight(ctx, cx, cy, radius, intensity) {
  const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, radius);
  g.addColorStop(0, `rgba(255,214,150,${0.24 * intensity})`);
  g.addColorStop(0.45, `rgba(255,190,120,${0.11 * intensity})`);
  g.addColorStop(1, 'rgba(255,180,110,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawPainting(ctx, item, t) {
  const horizontal = item.h > item.w;
  ctx.save();
  if (item.taken) {
    ctx.fillStyle = 'rgba(20,16,24,0.85)';
    if (horizontal) ctx.fillRect(item.x - 4, item.y, item.w + 8, item.h);
    else ctx.fillRect(item.x, item.y - 4, item.w, item.h + 8);
    ctx.strokeStyle = 'rgba(120,110,130,0.35)';
    ctx.lineWidth = 2;
    if (horizontal) ctx.strokeRect(item.x - 4, item.y, item.w + 8, item.h);
    else ctx.strokeRect(item.x, item.y - 4, item.w, item.h + 8);
    ctx.restore();
    return;
  }
  const cx = item.x + item.w / 2;
  const cy = item.y + item.h / 2;
  drawSpotlight(ctx, cx, cy, 118, 1);

  ctx.fillStyle = '#c9a24a';
  ctx.fillRect(item.x - 5, item.y - 5, item.w + 10, item.h + 10);
  ctx.fillStyle = '#6d4f1f';
  ctx.fillRect(item.x - 2, item.y - 2, item.w + 4, item.h + 4);

  const g = ctx.createLinearGradient(item.x, item.y, item.x + item.w, item.y + item.h);
  g.addColorStop(0, '#2f5d6b');
  g.addColorStop(0.5, '#7a3f52');
  g.addColorStop(1, '#3a2b56');
  ctx.fillStyle = g;
  ctx.fillRect(item.x, item.y, item.w, item.h);

  ctx.fillStyle = 'rgba(255,235,190,0.35)';
  ctx.beginPath();
  if (horizontal) {
    ctx.ellipse(cx, cy - 10, item.w * 0.28, item.h * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(20,24,40,0.55)';
    ctx.fillRect(item.x + 4, cy + 12, item.w - 8, item.h * 0.2);
  } else {
    ctx.ellipse(cx, cy - 14, item.w * 0.3, item.h * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(20,24,40,0.55)';
    ctx.fillRect(item.x + 2, cy + 14, item.w - 4, item.h * 0.22);
  }

  const glint = 0.55 + 0.45 * Math.sin(t * 2.4 + cx * 0.02);
  ctx.strokeStyle = `rgba(255,226,150,${0.5 * glint})`;
  ctx.lineWidth = 1.5;
  if (horizontal) ctx.strokeRect(item.x + 2, item.y + 2, item.w - 4, item.h - 4);
  else ctx.strokeRect(item.x + 2, item.y + 2, item.w - 4, item.h - 4);
  ctx.restore();
}

function drawCase(ctx, item, t) {
  const cx = item.x + item.w / 2;
  const cy = item.y + item.h / 2;
  drawSpotlight(ctx, cx, cy, 92, item.taken ? 0.35 : 0.9);

  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  rr(ctx, item.x + 2, item.y + 4, item.w, item.h, 5);
  ctx.fill();

  ctx.fillStyle = '#3a2f28';
  rr(ctx, item.x, item.y, item.w, item.h, 5);
  ctx.fill();
  ctx.strokeStyle = '#8a6a34';
  ctx.lineWidth = 2;
  ctx.stroke();

  if (!item.taken) {
    ctx.fillStyle = 'rgba(120,200,230,0.16)';
    rr(ctx, item.x + 5, item.y + 5, item.w - 10, item.h - 10, 3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(190,235,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    const pulse = 0.6 + 0.4 * Math.sin(t * 3.4);
    ctx.fillStyle = `rgba(255,206,90,${0.85 * pulse})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,245,200,0.9)';
    ctx.beginPath();
    ctx.arc(cx - 2, cy - 2, 2.4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = 'rgba(90,70,60,0.7)';
    ctx.fillRect(item.x + 6, item.y + item.h / 2 - 2, item.w - 12, 4);
  }
}

function drawStar(ctx, item, t) {
  const cx = item.x + item.w / 2;
  const cy = item.y + item.h / 2;
  if (item.taken) return;
  drawSpotlight(ctx, cx, cy, 130, 1.2);

  ctx.save();
  ctx.translate(cx, cy);
  const pulse = 0.75 + 0.25 * Math.sin(t * 3);
  ctx.fillStyle = 'rgba(120,220,255,0.12)';
  ctx.beginPath();
  ctx.arc(0, 0, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `rgba(140,230,255,${0.5 * pulse})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 34 + 3 * Math.sin(t * 2), 0, Math.PI * 2);
  ctx.stroke();

  const pedestal = ctx.createLinearGradient(0, 12, 0, 26);
  pedestal.addColorStop(0, '#6a5a7a');
  pedestal.addColorStop(1, '#3a3244');
  ctx.fillStyle = pedestal;
  rr(ctx, -20, 12, 40, 14, 3);
  ctx.fill();

  const spikes = 8;
  const outer = 17;
  const inner = 7;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const ang = (i * Math.PI) / spikes - Math.PI / 2;
    const rad = i % 2 === 0 ? outer : inner;
    const px = Math.cos(ang) * rad;
    const py = Math.sin(ang) * rad - 4;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  const sg = ctx.createLinearGradient(-14, -20, 14, 12);
  sg.addColorStop(0, '#f6fdff');
  sg.addColorStop(0.45, '#8fdcff');
  sg.addColorStop(1, '#3f8fc4');
  ctx.fillStyle = sg;
  ctx.fill();
  ctx.strokeStyle = 'rgba(230,250,255,0.95)';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.restore();
}

function drawStatue(ctx, c) {
  const cx = c.x + c.w / 2;
  const cy = c.y + c.h / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(cx + 4, cy + 10, c.w * 0.6, c.h * 0.36, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#5a5468';
  rr(ctx, c.x + 4, c.y + c.h - 12, c.w - 8, 12, 2);
  ctx.fill();
  const g = ctx.createLinearGradient(c.x, c.y, c.x + c.w, c.y + c.h);
  g.addColorStop(0, '#cfc8dd');
  g.addColorStop(0.5, '#918aa4');
  g.addColorStop(1, '#635d74');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, c.y + 11, c.w * 0.24, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - c.w * 0.3, c.y + c.h - 10);
  ctx.quadraticCurveTo(cx - c.w * 0.34, cy, cx, c.y + 16);
  ctx.quadraticCurveTo(cx + c.w * 0.34, cy, cx + c.w * 0.3, c.y + c.h - 10);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 3, c.y + 16);
  ctx.lineTo(cx - 5, c.y + c.h - 12);
  ctx.stroke();
  ctx.restore();
}

function drawCurtain(ctx, c) {
  ctx.save();
  const g = ctx.createLinearGradient(c.x, c.y, c.x + (c.w > c.h ? c.w : 0), c.y + (c.h > c.w ? c.h : 0));
  g.addColorStop(0, '#5c1a2a');
  g.addColorStop(0.5, '#8c2b3f');
  g.addColorStop(1, '#4a1322');
  ctx.fillStyle = g;
  ctx.fillRect(c.x, c.y, c.w, c.h);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1;
  if (c.w > c.h) {
    for (let x = c.x + 6; x < c.x + c.w; x += 10) {
      ctx.beginPath();
      ctx.moveTo(x, c.y);
      ctx.lineTo(x, c.y + c.h);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(201,162,74,0.65)';
    ctx.fillRect(c.x, c.y + c.h - 2, c.w, 2);
  } else {
    for (let y = c.y + 6; y < c.y + c.h; y += 10) {
      ctx.beginPath();
      ctx.moveTo(c.x, y);
      ctx.lineTo(c.x + c.w, y);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(201,162,74,0.65)';
    ctx.fillRect(c.x + c.w - 2, c.y, 2, c.h);
  }
  ctx.restore();
}

function drawCrate(ctx, c) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(c.x + 3, c.y + 4, c.w, c.h);
  ctx.fillStyle = '#5b4630';
  ctx.fillRect(c.x, c.y, c.w, c.h);
  ctx.strokeStyle = '#8a6a3c';
  ctx.lineWidth = 2;
  ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
  ctx.beginPath();
  ctx.moveTo(c.x + 2, c.y + 2);
  ctx.lineTo(c.x + c.w - 2, c.y + c.h - 2);
  ctx.moveTo(c.x + c.w - 2, c.y + 2);
  ctx.lineTo(c.x + 2, c.y + c.h - 2);
  ctx.stroke();
  ctx.restore();
}

function drawCoverCase(ctx, c, t) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  rr(ctx, c.x + 2, c.y + 4, c.w, c.h, 5);
  ctx.fill();
  ctx.fillStyle = '#40342c';
  rr(ctx, c.x, c.y, c.w, c.h, 5);
  ctx.fill();
  ctx.strokeStyle = '#8a6a34';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(150,210,235,0.12)';
  rr(ctx, c.x + 5, c.y + 5, c.w - 10, c.h - 10, 3);
  ctx.fill();
  ctx.restore();
}

function drawRopes(ctx, world) {
  ctx.save();
  for (const r of world.ropes) {
    ctx.strokeStyle = '#c9a24a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(r.x, r.y);
    ctx.lineTo(r.x + r.w, r.y + r.h);
    ctx.stroke();
    const posts = r.w > r.h ? [r.x, r.x + r.w] : [r.y, r.y + r.h];
    if (r.w > r.h) {
      for (const px of posts) {
        ctx.fillStyle = '#d8b45c';
        ctx.beginPath();
        ctx.arc(px, r.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      for (const py of posts) {
        ctx.fillStyle = '#d8b45c';
        ctx.beginPath();
        ctx.arc(r.x, py, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

function drawDecor(ctx, world, t) {
  for (const p of world.decor.pillars) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(p.x + 4, p.y + 6, 15, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    const g = ctx.createRadialGradient(p.x - 4, p.y - 4, 2, p.x, p.y, 16);
    g.addColorStop(0, '#d6cfe0');
    g.addColorStop(0.6, '#8b8399');
    g.addColorStop(1, '#4b4557');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  for (const pl of world.decor.plants) {
    ctx.save();
    ctx.fillStyle = '#3a4a34';
    for (let i = 0; i < 7; i++) {
      const ang = (i / 7) * Math.PI * 2 + Math.sin(t + i) * 0.1;
      ctx.beginPath();
      ctx.ellipse(pl.x + Math.cos(ang) * 8, pl.y + Math.sin(ang) * 8, 8, 4, ang, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#6a4a30';
    ctx.beginPath();
    ctx.arc(pl.x, pl.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawExit(ctx, world, player, t) {
  const { x, y, r } = world.exit;
  const active = player.carry.includes('star');
  ctx.save();
  const glow = ctx.createRadialGradient(x, y, 4, x, y, r * 3.2);
  const col = active ? '255,214,120' : '120,170,210';
  glow.addColorStop(0, `rgba(${col},${active ? 0.4 : 0.18})`);
  glow.addColorStop(1, `rgba(${col},0)`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, r * 3.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = active ? '#ffd66e' : 'rgba(150,190,220,0.6)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = active ? 'rgba(255,214,110,0.85)' : 'rgba(150,190,220,0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.6, y);
  ctx.lineTo(x + r * 0.6, y);
  ctx.moveTo(x, y - r * 0.6);
  ctx.lineTo(x, y + r * 0.6);
  ctx.stroke();

  ctx.fillStyle = active ? 'rgba(255,236,180,0.95)' : 'rgba(190,215,235,0.7)';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SKYLIGHT EXIT', x, y - r - 12);
  if (active) {
    const pulse = 0.6 + 0.4 * Math.sin(t * 4);
    ctx.strokeStyle = `rgba(255,214,110,${pulse})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r + 7 + Math.sin(t * 4) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCone(ctx, ox, oy, angle, halfAngle, range, fill, edge, alert) {
  ctx.save();
  const g = ctx.createRadialGradient(ox, oy, 6, ox, oy, range);
  g.addColorStop(0, fill.replace('ALPHA', '0.34'));
  g.addColorStop(0.65, fill.replace('ALPHA', '0.14'));
  g.addColorStop(1, fill.replace('ALPHA', '0'));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.arc(ox, oy, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = edge;
  ctx.lineWidth = alert ? 2.2 : 1.3;
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.arc(ox, oy, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawGuardCone(ctx, g) {
  let fill = 'rgba(90,180,255,ALPHA)';
  let edge = 'rgba(120,200,255,0.4)';
  let alert = false;
  if (g.state === 'alert') {
    fill = 'rgba(255,70,90,ALPHA)';
    edge = 'rgba(255,90,110,0.85)';
    alert = true;
  } else if (g.state === 'suspicious' || g.suspicion > 0.15) {
    const mix = Math.min(1, g.suspicion);
    fill = 'rgba(255,170,60,ALPHA)';
    edge = `rgba(255,${Math.floor(200 - mix * 60)},70,${0.5 + mix * 0.35})`;
    alert = true;
  }
  drawCone(ctx, g.x, g.y, g.angle, CONFIG.GUARD.visionAngle / 2, CONFIG.GUARD.visionRange, fill, edge, alert);
}

function drawCameraCone(ctx, cam) {
  if (cam.disabled > 0) {
    ctx.save();
    ctx.strokeStyle = 'rgba(120,130,150,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, cam.range, cam.angle - cam.halfAngle, cam.angle + cam.halfAngle);
    ctx.stroke();
    ctx.fillStyle = 'rgba(140,150,170,0.75)';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`OFF ${Math.ceil(cam.disabled)}s`, cam.x, cam.y - 16);
    ctx.restore();
    return;
  }
  let fill = 'rgba(255,70,90,ALPHA)';
  let edge = 'rgba(255,90,110,0.55)';
  let alert = false;
  if (cam.seesPlayer) {
    edge = 'rgba(255,60,80,0.95)';
    alert = true;
  }
  drawCone(ctx, cam.x, cam.y, cam.angle, cam.halfAngle, cam.range, fill, edge, alert);
}

function drawCameraBody(ctx, cam, t) {
  ctx.save();
  ctx.fillStyle = '#4a4452';
  ctx.beginPath();
  ctx.arc(cam.x, cam.y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = cam.disabled > 0 ? '#6b6b78' : cam.seesPlayer ? '#ff4d5e' : '#a0a8b8';
  ctx.lineWidth = 2;
  ctx.stroke();
  const dx = Math.cos(cam.angle) * 11;
  const dy = Math.sin(cam.angle) * 11;
  ctx.fillStyle = cam.disabled > 0 ? '#55555f' : '#2b2733';
  ctx.beginPath();
  ctx.arc(cam.x + dx, cam.y + dy, 5, 0, Math.PI * 2);
  ctx.fill();
  if (cam.disabled <= 0) {
    const blink = 0.5 + 0.5 * Math.sin(t * 6);
    ctx.fillStyle = cam.seesPlayer ? `rgba(255,60,80,${0.6 + blink * 0.4})` : `rgba(255,90,90,${0.35 + blink * 0.3})`;
    ctx.beginPath();
    ctx.arc(cam.x - dx * 0.3, cam.y - dy * 0.3, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawGuard(ctx, g, t) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(g.x + 2, g.y + 8, 13, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  const bob = Math.sin(g.bob) * 1.4;
  ctx.translate(g.x, g.y + bob);

  const bodyGrad = ctx.createLinearGradient(-10, -10, 10, 10);
  bodyGrad.addColorStop(0, g.color);
  bodyGrad.addColorStop(1, '#25303f');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(10,14,20,0.85)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#1b2430';
  ctx.beginPath();
  ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
  ctx.fill();

  const fx = Math.cos(g.angle) * 8;
  const fy = Math.sin(g.angle) * 8;
  ctx.fillStyle = g.state === 'alert' ? '#ff5566' : g.state === 'suspicious' ? '#ffbe4d' : '#9fd8ff';
  ctx.beginPath();
  ctx.arc(fx, fy, 3.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(220,230,240,0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(fx * 0.4, fy * 0.4);
  ctx.lineTo(fx * 1.5, fy * 1.5);
  ctx.stroke();
  ctx.restore();

  if (g.state === 'alert' || g.suspicion > 0.55) {
    const pulse = 0.7 + 0.3 * Math.sin(t * 9);
    ctx.save();
    ctx.fillStyle = g.state === 'alert' ? `rgba(255,70,90,${pulse})` : `rgba(255,190,70,${pulse})`;
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', g.x, g.y - 20);
    ctx.restore();
  }

  if (g.suspicion > 0.08) {
    const w = 30;
    const x = g.x - w / 2;
    const y = g.y - 34;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    rr(ctx, x, y, w, 6, 3);
    ctx.fill();
    const frac = Math.min(1, g.suspicion / 1.05);
    ctx.fillStyle = frac > 0.85 ? '#ff4d5e' : frac > 0.45 ? '#ffc24d' : '#7fd4ff';
    rr(ctx, x + 1, y + 1, Math.max(2, (w - 2) * frac), 4, 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawPlayer(ctx, p, t) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.ellipse(p.x + 2, p.y + 7, 12, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  if (p.hidden) {
    const pulse = 0.4 + 0.25 * Math.sin(t * 4);
    ctx.strokeStyle = `rgba(90,230,170,${pulse})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius + 6, 0, Math.PI * 2);
    ctx.stroke();
  }

  const g = ctx.createRadialGradient(p.x - 3, p.y - 4, 2, p.x, p.y, 14);
  g.addColorStop(0, '#3c4b63');
  g.addColorStop(1, '#141b26');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8fd6ff';
  ctx.lineWidth = 2;
  ctx.stroke();

  const fx = p.x + Math.cos(p.angle) * 9;
  const fy = p.y + Math.sin(p.angle) * 9;
  ctx.fillStyle = '#cfeaff';
  ctx.beginPath();
  ctx.arc(fx, fy, 3.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(160,220,255,0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius + 2, 0, Math.PI * 2);
  ctx.stroke();

  if (p.sneaking) {
    ctx.fillStyle = 'rgba(120,220,255,0.8)';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SNEAK', p.x, p.y - 20);
  }
  ctx.restore();
}

function drawCoins(ctx, coins, t) {
  for (const c of coins) {
    if (c.life <= 0) continue;
    const alpha = Math.min(1, c.life * 1.5);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(255,214,110,0.25)';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 12 + Math.sin(t * 8) * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd66e';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawProgress(ctx, player) {
  if (!player.interacting || player.progress <= 0) return;
  const total = player.interacting.total || 1;
  const frac = Math.min(1, player.progress / total);
  const w = 62;
  const x = player.x - w / 2;
  const y = player.y - 42;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  rr(ctx, x, y, w, 10, 5);
  ctx.fill();
  ctx.fillStyle = '#ffd66e';
  rr(ctx, x + 1.5, y + 1.5, Math.max(3, (w - 3) * frac), 7, 4);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,214,110,0.6)';
  ctx.lineWidth = 1;
  rr(ctx, x, y, w, 10, 5);
  ctx.stroke();
  const label = player.interacting.kind === 'star' ? 'CRACKING SAFE' : 'PICKING LOCK';
  ctx.fillStyle = '#ffe9b0';
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, player.x, y - 6);
  ctx.restore();
}

function drawInteractHint(ctx, hint, player, t) {
  if (!hint) return;
  let label = '';
  if (hint.type === 'exit') label = 'E  CLIMB OUT';
  else if (hint.item.type === 'painting') label = 'E  TAKE PAINTING';
  else if (hint.item.type === 'case') label = 'HOLD E  PICK CASE';
  else if (hint.item.type === 'star') label = 'HOLD E  CRACK SAFE';
  const pulse = 0.75 + 0.25 * Math.sin(t * 5);
  ctx.save();
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  const w = ctx.measureText(label).width + 20;
  const x = player.x - w / 2;
  const y = player.y + 26;
  ctx.fillStyle = `rgba(12,16,24,${0.8 * pulse})`;
  rr(ctx, x, y, w, 22, 6);
  ctx.fill();
  ctx.strokeStyle = `rgba(255,214,110,${0.8 * pulse})`;
  ctx.lineWidth = 1.5;
  rr(ctx, x, y, w, 22, 6);
  ctx.stroke();
  ctx.fillStyle = '#ffe9b0';
  ctx.fillText(label, player.x, y + 15);
  ctx.restore();
}

function drawAlarmOverlay(ctx, state) {
  const { alarm } = state;

  ctx.save();

  if (alarm.value >= 60) {
    const pulse = 0.5 + 0.5 * Math.sin(state.time * 7);
    ctx.fillStyle = `rgba(255,60,80,${0.06 + pulse * 0.08})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (alarm.flash > 0) {
    ctx.fillStyle = `rgba(255,40,60,${alarm.flash * 0.22})`;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.restore();
}

function drawCenterPanel(ctx, opts) {
  const { title, subtitle, lines, accent, footer } = opts;
  ctx.save();
  ctx.fillStyle = 'rgba(6,8,14,0.82)';
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, 520);
  g.addColorStop(0, 'rgba(30,40,60,0.5)');
  g.addColorStop(1, 'rgba(4,6,10,0.9)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const panelW = 700;
  const panelH = 90 + lines.length * 34 + 90;
  const px = (W - panelW) / 2;
  const py = (H - panelH) / 2;
  ctx.fillStyle = 'rgba(12,16,26,0.95)';
  rr(ctx, px, py, panelW, panelH, 16);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  rr(ctx, px, py, panelW, panelH, 16);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = 'bold 46px system-ui, sans-serif';
  ctx.fillText(title, W / 2, py + 66);

  if (subtitle) {
    ctx.fillStyle = '#9fb4cc';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText(subtitle, W / 2, py + 98);
  }

  let ly = py + 144;
  for (const line of lines) {
    ctx.fillStyle = line.color || '#e6f0ff';
    ctx.font = `${line.bold ? 'bold ' : ''}${line.size || 20}px system-ui, sans-serif`;
    ctx.fillText(line.text, W / 2, ly);
    ly += 34;
  }

  if (footer) {
    ctx.fillStyle = '#9fb4cc';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText(footer, W / 2, py + panelH - 26);
  }
  ctx.restore();
}

export function drawMenu(ctx, state) {
  ctx.save();
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgba(4,6,12,0.55)');
  g.addColorStop(0.5, 'rgba(4,6,12,0.72)');
  g.addColorStop(1, 'rgba(4,6,12,0.9)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W / 2, 250, 30, W / 2, 250, 420);
  glow.addColorStop(0, 'rgba(255,206,110,0.16)');
  glow.addColorStop(1, 'rgba(255,206,110,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd66e';
  ctx.font = 'bold 74px system-ui, sans-serif';
  ctx.fillText('VAULTLIGHT', W / 2, 210);
  ctx.fillStyle = '#cfe0f5';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('THE MERIDIAN GALLERY JOB', W / 2, 248);

  ctx.strokeStyle = 'rgba(255,214,110,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 260, 268);
  ctx.lineTo(W / 2 + 260, 268);
  ctx.stroke();

  ctx.fillStyle = '#a8bcd4';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText('Wren slips into the Meridian Gallery at midnight.', W / 2, 306);
  ctx.fillText('Crack the vault annex, take the Star of Meridian, reach the skylight.', W / 2, 332);

  const controls = [
    ['WASD / ARROWS', 'MOVE'],
    ['SHIFT', 'SNEAK (QUIET)'],
    ['E / HOLD E', 'GRAB / PICK LOCK'],
    ['Q', 'EMP BLAST'],
    ['CLICK', 'TOSS COIN'],
  ];
  const boxW = 620;
  const bx = W / 2 - boxW / 2;
  const by = 366;
  ctx.fillStyle = 'rgba(10,14,22,0.75)';
  rr(ctx, bx, by, boxW, 168, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,140,170,0.35)';
  ctx.lineWidth = 1.5;
  rr(ctx, bx, by, boxW, 168, 12);
  ctx.stroke();
  controls.forEach(([k, v], i) => {
    const yy = by + 30 + i * 28;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd66e';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText(k, bx + 34, yy);
    ctx.fillStyle = '#cfe0f5';
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillText(v, bx + 240, yy);
  });

  const pulse = 0.65 + 0.35 * Math.sin(state.time * 3.2);
  ctx.textAlign = 'center';
  ctx.fillStyle = `rgba(255,214,110,${pulse})`;
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText('PRESS  ENTER  TO  BEGIN', W / 2, 596);

  ctx.fillStyle = '#7f93ab';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('M  MUTE   ·   R  RESTART   ·   THREE PAINTINGS  ·  TWO CASES  ·  ONE DIAMOND', W / 2, 636);

  const stats = `GUARDS ${CONFIG.COUNTS.guards}   CAMERAS ${CONFIG.COUNTS.cameras}   SEED ${state.seed}`;
  ctx.fillStyle = '#5c6b80';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText(stats, W / 2, 676);
  ctx.restore();
}

export function drawCaught(ctx, state) {
  const lines = [
    { text: `LOOT SECURED: ${state.lootTotal.toLocaleString()} GOLD`, color: '#ffd66e', bold: true, size: 24 },
    { text: `TIME: ${formatTime(state.elapsed)}   ·   PEAK ALARM: ${Math.round(state.alarm.peak)}%`, color: '#a8bcd4', size: 18 },
    { text: 'The Meridian Gallery is sealed. Wren is in cuffs.', color: '#ff8d9a', size: 17 },
  ];
  drawCenterPanel(ctx, {
    title: 'CAUGHT',
    subtitle: 'LOCKDOWN — ALARM 100%',
    lines,
    accent: '#ff4d5e',
    footer: 'PRESS  R  TO  RETRY',
  });
}

export function drawEscaped(ctx, state) {
  const rating = state.rating;
  const ratingColor = rating === 'GHOST' ? '#7dffb0' : rating === 'CLEAN' ? '#7fd4ff' : '#ffc24d';
  const lines = [
    { text: `RATING: ${rating}`, color: ratingColor, bold: true, size: 30 },
    { text: `LOOT TOTAL: ${state.lootTotal.toLocaleString()} GOLD`, color: '#ffd66e', bold: true, size: 24 },
    { text: `TIME: ${formatTime(state.elapsed)}   ·   PEAK ALARM: ${Math.round(state.alarm.peak)}%`, color: '#a8bcd4', size: 18 },
  ];
  if (rating === 'GHOST') lines.push({ text: 'Never seen. Never heard. The Star is gone.', color: '#7dffb0', size: 16 });
  else if (rating === 'CLEAN') lines.push({ text: 'A tidy job — the guards only saw shadows.', color: '#7fd4ff', size: 16 });
  else lines.push({ text: 'Loud and messy, but the Star is yours.', color: '#ffc24d', size: 16 });

  drawCenterPanel(ctx, {
    title: 'ESCAPED',
    subtitle: 'THE STAR OF MERIDIAN IS YOURS',
    lines,
    accent: '#ffd66e',
    footer: 'PRESS  R  FOR  ANOTHER  JOB',
  });
}

function formatTime(seconds) {
  const mm = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const ss = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${mm}:${ss}`;
}

export function render(ctx, state) {
  const { world, player, guards, cameras, coins, time } = state;

  ctx.save();
  drawFloor(ctx, world);
  drawRugs(ctx, world);

  for (const cam of cameras) drawCameraCone(ctx, cam);
  for (const g of guards) drawGuardCone(ctx, g);

  drawWalls(ctx, world);

  for (const item of world.loot) {
    if (item.type === 'painting') drawPainting(ctx, item, time);
  }

  drawRopes(ctx, world);
  drawDecor(ctx, world, time);
  drawExit(ctx, world, player, time);

  for (const c of world.covers) {
    if (c.type === 'curtain') drawCurtain(ctx, c);
    else if (c.type === 'crate') drawCrate(ctx, c);
    else if (c.type === 'statue') drawStatue(ctx, c);
    else if (c.type === 'case') drawCoverCase(ctx, c, time);
  }

  for (const item of world.loot) {
    if (item.type === 'case') drawCase(ctx, item, time);
  }

  drawCoins(ctx, coins, time);

  for (const item of world.loot) {
    if (item.type === 'star') drawStar(ctx, item, time);
  }

  for (const cam of cameras) drawCameraBody(ctx, cam, time);
  for (const g of guards) drawGuard(ctx, g, time);
  drawPlayer(ctx, player, time);

  drawProgress(ctx, player);
  drawInteractHint(ctx, state.hint, player, time);

  if (state.screen === 'menu') drawMenu(ctx, state);
  else if (state.screen === 'caught') drawCaught(ctx, state);
  else if (state.screen === 'escaped') drawEscaped(ctx, state);

  drawAlarmOverlay(ctx, state);

  if (state.debug) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(W - 210, H - 28, 200, 20);
    ctx.fillStyle = '#8fa3bb';
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`seed ${state.seed} · ${state.fps.toFixed(0)}fps`, W - 18, H - 14);
  }
  ctx.restore();
}

export { formatTime };
