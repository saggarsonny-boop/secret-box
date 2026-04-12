import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Deep background
  ctx.fillStyle = '#080808';
  ctx.fillRect(0, 0, size, size);

  // Soft glow behind moon
  const glow = ctx.createRadialGradient(size*0.42, size*0.5, 0, size*0.42, size*0.5, size*0.38);
  glow.addColorStop(0, 'rgba(200,184,162,0.15)');
  glow.addColorStop(1, 'rgba(200,184,162,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  // Moon body
  ctx.fillStyle = '#d4c4aa';
  ctx.beginPath();
  ctx.arc(size*0.44, size*0.5, size*0.3, 0, Math.PI*2);
  ctx.fill();

  // Cutout for crescent
  ctx.fillStyle = '#080808';
  ctx.beginPath();
  ctx.arc(size*0.56, size*0.44, size*0.26, 0, Math.PI*2);
  ctx.fill();

  // Stars — varied sizes
  const stars = [
    [0.74, 0.24, 0.022],
    [0.80, 0.38, 0.014],
    [0.68, 0.19, 0.016],
    [0.84, 0.26, 0.010],
    [0.76, 0.52, 0.012],
  ];
  for (const [sx, sy, sr] of stars) {
    const starGlow = ctx.createRadialGradient(sx*size, sy*size, 0, sx*size, sy*size, sr*size*2);
    starGlow.addColorStop(0, 'rgba(200,184,162,0.4)');
    starGlow.addColorStop(1, 'rgba(200,184,162,0)');
    ctx.fillStyle = starGlow;
    ctx.beginPath();
    ctx.arc(sx*size, sy*size, sr*size*2, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#d4c4aa';
    ctx.beginPath();
    ctx.arc(sx*size, sy*size, sr*size, 0, Math.PI*2);
    ctx.fill();
  }

  return canvas.toBuffer('image/png');
}

writeFileSync('public/icons/icon-192.png', generateIcon(192));
writeFileSync('public/icons/icon-512.png', generateIcon(512));
console.log('Icons created!');
