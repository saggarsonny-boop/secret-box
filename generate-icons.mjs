import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#080808';
  ctx.fillRect(0, 0, size, size);

  // Warm glow
  const glow = ctx.createRadialGradient(size*0.5, size*0.5, 0, size*0.5, size*0.5, size*0.45);
  glow.addColorStop(0, 'rgba(180,100,100,0.25)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  const cx = size * 0.5;
  const cy = size * 0.54;

  // Lower lip
  ctx.fillStyle = '#c8606a';
  ctx.beginPath();
  ctx.moveTo(cx - size*0.24, cy + size*0.01);
  ctx.quadraticCurveTo(cx, cy + size*0.18, cx + size*0.24, cy + size*0.01);
  ctx.quadraticCurveTo(cx, cy + size*0.22, cx - size*0.24, cy + size*0.01);
  ctx.closePath();
  ctx.fill();

  // Upper lip
  ctx.fillStyle = '#b84e58';
  ctx.beginPath();
  ctx.moveTo(cx - size*0.24, cy);
  ctx.quadraticCurveTo(cx - size*0.1, cy - size*0.1, cx, cy - size*0.03);
  ctx.quadraticCurveTo(cx + size*0.1, cy - size*0.1, cx + size*0.24, cy);
  ctx.quadraticCurveTo(cx, cy + size*0.04, cx - size*0.24, cy);
  ctx.closePath();
  ctx.fill();

  // Lip gloss highlight on lower lip
  const gloss = ctx.createRadialGradient(cx, cy + size*0.1, 0, cx, cy + size*0.1, size*0.12);
  gloss.addColorStop(0, 'rgba(255,200,200,0.5)');
  gloss.addColorStop(1, 'rgba(255,150,150,0)');
  ctx.fillStyle = gloss;
  ctx.beginPath();
  ctx.ellipse(cx, cy + size*0.1, size*0.1, size*0.05, 0, 0, Math.PI*2);
  ctx.fill();

  // Horizontal finger across lips
  const fy = cy - size*0.01;
  const fh = size*0.09;

  // Finger body — horizontal rounded rectangle
  ctx.fillStyle = '#d4b896';
  ctx.beginPath();
  ctx.roundRect(cx - size*0.34, fy - fh/2, size*0.68, fh, fh/2);
  ctx.fill();

  // Finger knuckle lines
  ctx.strokeStyle = 'rgba(180,140,100,0.5)';
  ctx.lineWidth = size*0.008;
  ctx.beginPath();
  ctx.moveTo(cx - size*0.08, fy - fh*0.3);
  ctx.lineTo(cx - size*0.08, fy + fh*0.3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + size*0.08, fy - fh*0.3);
  ctx.lineTo(cx + size*0.08, fy + fh*0.3);
  ctx.stroke();

  // Fingernail on right tip
  ctx.fillStyle = '#e8d0b8';
  ctx.beginPath();
  ctx.roundRect(cx + size*0.22, fy - fh*0.32, size*0.09, fh*0.64, size*0.02);
  ctx.fill();

  // Nail gloss
  const nailGloss = ctx.createLinearGradient(cx+size*0.22, fy-fh*0.32, cx+size*0.22, fy);
  nailGloss.addColorStop(0, 'rgba(255,255,255,0.4)');
  nailGloss.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = nailGloss;
  ctx.beginPath();
  ctx.roundRect(cx + size*0.22, fy - fh*0.32, size*0.09, fh*0.32, size*0.02);
  ctx.fill();

  return canvas.toBuffer('image/png');
}

writeFileSync('public/icons/icon-192.png', generateIcon(192));
writeFileSync('public/icons/icon-512.png', generateIcon(512));
console.log('Shh icons created!');
