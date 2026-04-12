import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Dark background
  ctx.fillStyle = '#080808';
  ctx.fillRect(0, 0, size, size);

  // Warm glow
  const glow = ctx.createRadialGradient(size*0.5, size*0.5, 0, size*0.5, size*0.5, size*0.4);
  glow.addColorStop(0, 'rgba(200,140,60,0.35)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  const kx = size * 0.5;
  const ky = size * 0.38;
  const kr = size * 0.13;

  // Keyhole outline — gold
  ctx.fillStyle = '#c8b8a2';

  // Circle top
  ctx.beginPath();
  ctx.arc(kx, ky, kr, 0, Math.PI * 2);
  ctx.fill();

  // Narrow teardrop bottom
  ctx.beginPath();
  ctx.moveTo(kx - kr * 0.75, ky + kr * 0.5);
  ctx.lineTo(kx - kr * 0.45, ky + kr * 2.8);
  ctx.lineTo(kx + kr * 0.45, ky + kr * 2.8);
  ctx.lineTo(kx + kr * 0.75, ky + kr * 0.5);
  ctx.closePath();
  ctx.fill();

  // Peek hole glow
  const peekGlow = ctx.createRadialGradient(kx, ky, 0, kx, ky, kr*0.7);
  peekGlow.addColorStop(0, 'rgba(240,160,60,1)');
  peekGlow.addColorStop(0.5, 'rgba(180,100,20,0.9)');
  peekGlow.addColorStop(1, 'rgba(80,40,5,0.5)');
  ctx.fillStyle = peekGlow;
  ctx.beginPath();
  ctx.arc(kx, ky, kr * 0.65, 0, Math.PI * 2);
  ctx.fill();

  // Dark slit in bottom
  ctx.fillStyle = '#050302';
  ctx.beginPath();
  ctx.moveTo(kx - kr * 0.28, ky + kr * 0.8);
  ctx.lineTo(kx - kr * 0.18, ky + kr * 2.6);
  ctx.lineTo(kx + kr * 0.18, ky + kr * 2.6);
  ctx.lineTo(kx + kr * 0.28, ky + kr * 0.8);
  ctx.closePath();
  ctx.fill();

  return canvas.toBuffer('image/png');
}

writeFileSync('public/icons/icon-192.png', generateIcon(192));
writeFileSync('public/icons/icon-512.png', generateIcon(512));
console.log('Keyhole icons created!');
