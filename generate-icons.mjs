import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Dark background with subtle gradient
  const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  grad.addColorStop(0, '#111111');
  grad.addColorStop(1, '#0a0a0a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  
  // Crescent moon
  const cx = size * 0.52;
  const cy = size * 0.48;
  const r = size * 0.32;
  
  ctx.fillStyle = '#c8b8a2';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  
  // Cut out to make crescent
  ctx.fillStyle = '#0d0d0d';
  ctx.beginPath();
  ctx.arc(cx + r * 0.45, cy - r * 0.1, r * 0.82, 0, Math.PI * 2);
  ctx.fill();
  
  // Small stars
  const stars = [
    [0.72, 0.22, 0.025],
    [0.78, 0.35, 0.015],
    [0.65, 0.18, 0.018],
    [0.82, 0.28, 0.012],
  ];
  ctx.fillStyle = '#c8b8a2';
  for (const [sx, sy, sr] of stars) {
    ctx.beginPath();
    ctx.arc(sx * size, sy * size, sr * size, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas.toBuffer('image/png');
}

writeFileSync('public/icons/icon-192.png', generateIcon(192));
writeFileSync('public/icons/icon-512.png', generateIcon(512));
console.log('Moon icons created!');
