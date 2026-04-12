import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#080808';
  ctx.fillRect(0, 0, size, size);

  const cx = size * 0.5;
  const cy = size * 0.5;
  const ew = size * 0.42;
  const eh = size * 0.18;

  // Glow behind eye
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, ew);
  glow.addColorStop(0, 'rgba(200,140,60,0.3)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  // Eye white
  ctx.fillStyle = '#c8b8a2';
  ctx.beginPath();
  ctx.ellipse(cx, cy, ew, eh, 0, 0, Math.PI * 2);
  ctx.fill();

  // Iris
  const iris = ctx.createRadialGradient(cx, cy, 0, cx, cy, eh * 0.85);
  iris.addColorStop(0, '#d4822a');
  iris.addColorStop(0.6, '#8b4513');
  iris.addColorStop(1, '#3a1a05');
  ctx.fillStyle = iris;
  ctx.beginPath();
  ctx.arc(cx, cy, eh * 0.85, 0, Math.PI * 2);
  ctx.fill();

  // Keyhole pupil
  const kx = cx;
  const ky = cy - eh * 0.05;
  const kr = eh * 0.35;

  ctx.fillStyle = '#080808';
  ctx.beginPath();
  ctx.arc(kx, ky - kr * 0.3, kr, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(kx - kr * 0.6, ky);
  ctx.lineTo(kx - kr * 0.35, ky + kr * 1.5);
  ctx.lineTo(kx + kr * 0.35, ky + kr * 1.5);
  ctx.lineTo(kx + kr * 0.6, ky);
  ctx.closePath();
  ctx.fill();

  // Eyelid lines
  ctx.strokeStyle = '#a09080';
  ctx.lineWidth = size * 0.012;
  ctx.beginPath();
  ctx.moveTo(cx - ew, cy);
  ctx.quadraticCurveTo(cx, cy - eh * 1.8, cx + ew, cy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - ew, cy);
  ctx.quadraticCurveTo(cx, cy + eh * 1.8, cx + ew, cy);
  ctx.stroke();

  return canvas.toBuffer('image/png');
}

writeFileSync('public/icons/icon-192.png', generateIcon(192));
writeFileSync('public/icons/icon-512.png', generateIcon(512));
console.log('Eye keyhole icons created!');
