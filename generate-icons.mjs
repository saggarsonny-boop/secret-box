import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Dark background
  ctx.fillStyle = '#080808';
  ctx.fillRect(0, 0, size, size);

  // Warm glow through keyhole
  const glow = ctx.createRadialGradient(size*0.5, size*0.58, 0, size*0.5, size*0.58, size*0.35);
  glow.addColorStop(0, 'rgba(200,140,60,0.5)');
  glow.addColorStop(0.4, 'rgba(200,120,40,0.2)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  // Keyhole — draw as filled shape then cut out
  const kx = size * 0.5;
  const ky = size * 0.42;
  const kr = size * 0.18;

  // Circle top of keyhole
  ctx.fillStyle = '#c8b8a2';
  ctx.beginPath();
  ctx.arc(kx, ky, kr, 0, Math.PI * 2);
  ctx.fill();

  // Triangle bottom of keyhole
  ctx.beginPath();
  ctx.moveTo(kx - kr * 1.1, ky + kr * 0.3);
  ctx.lineTo(kx + kr * 1.1, ky + kr * 0.3);
  ctx.lineTo(kx + kr * 0.5, ky + kr * 2.4);
  ctx.lineTo(kx - kr * 0.5, ky + kr * 2.4);
  ctx.closePath();
  ctx.fill();

  // Cut out inner circle — the peek hole
  const innerGlow = ctx.createRadialGradient(kx, ky, 0, kx, ky, kr*0.65);
  innerGlow.addColorStop(0, 'rgba(220,150,60,0.95)');
  innerGlow.addColorStop(0.6, 'rgba(180,100,30,0.8)');
  innerGlow.addColorStop(1, 'rgba(100,50,10,0.6)');
  ctx.fillStyle = innerGlow;
  ctx.beginPath();
  ctx.arc(kx, ky, kr * 0.62, 0, Math.PI * 2);
  ctx.fill();

  // Cut out inner triangle
  ctx.fillStyle = '#0a0605';
  ctx.beginPath();
  ctx.moveTo(kx - kr * 0.55, ky + kr * 0.6);
  ctx.lineTo(kx + kr * 0.55, ky + kr * 0.6);
  ctx.lineTo(kx + kr * 0.2, ky + kr * 2.2);
  ctx.lineTo(kx - kr * 0.2, ky + kr * 2.2);
  ctx.closePath();
  ctx.fill();

  // Subtle outer ring
  ctx.strokeStyle = 'rgba(200,184,162,0.3)';
  ctx.lineWidth = size * 0.015;
  ctx.beginPath();
  ctx.arc(size*0.5, size*0.5, size*0.44, 0, Math.PI*2);
  ctx.stroke();

  return canvas.toBuffer('image/png');
}

writeFileSync('public/icons/icon-192.png', generateIcon(192));
writeFileSync('public/icons/icon-512.png', generateIcon(512));
console.log('Keyhole icons created!');
