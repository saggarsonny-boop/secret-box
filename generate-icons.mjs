import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#080808';
  ctx.fillRect(0, 0, size, size);

  // Warm glow
  const glow = ctx.createRadialGradient(size*0.5, size*0.55, 0, size*0.5, size*0.55, size*0.45);
  glow.addColorStop(0, 'rgba(200,140,80,0.2)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  const cx = size * 0.5;
  const cy = size * 0.54;

  // Lips
  ctx.fillStyle = '#c8b8a2';

  // Upper lip
  ctx.beginPath();
  ctx.moveTo(cx - size*0.22, cy);
  ctx.quadraticCurveTo(cx - size*0.1, cy - size*0.08, cx, cy - size*0.02);
  ctx.quadraticCurveTo(cx + size*0.1, cy - size*0.08, cx + size*0.22, cy);
  ctx.quadraticCurveTo(cx + size*0.14, cy + size*0.12, cx, cy + size*0.14);
  ctx.quadraticCurveTo(cx - size*0.14, cy + size*0.12, cx - size*0.22, cy);
  ctx.closePath();
  ctx.fill();

  // Cupid's bow detail
  ctx.fillStyle = '#a09080';
  ctx.beginPath();
  ctx.moveTo(cx - size*0.22, cy);
  ctx.quadraticCurveTo(cx - size*0.1, cy - size*0.08, cx, cy - size*0.02);
  ctx.quadraticCurveTo(cx + size*0.1, cy - size*0.08, cx + size*0.22, cy);
  ctx.lineTo(cx + size*0.22, cy + size*0.01);
  ctx.quadraticCurveTo(cx + size*0.1, cy - size*0.07, cx, cy - size*0.01);
  ctx.quadraticCurveTo(cx - size*0.1, cy - size*0.07, cx - size*0.22, cy + size*0.01);
  ctx.closePath();
  ctx.fill();

  // Finger pressing against lips
  const fx = cx + size*0.04;
  const fy = size*0.18;
  const fw = size*0.085;

  // Finger body
  ctx.fillStyle = '#c8b8a2';
  ctx.beginPath();
  ctx.roundRect(fx - fw/2, fy, fw, size*0.32, fw/2);
  ctx.fill();

  // Finger tip highlight
  const tipGlow = ctx.createRadialGradient(fx, fy + size*0.04, 0, fx, fy + size*0.04, fw*0.8);
  tipGlow.addColorStop(0, 'rgba(220,200,170,0.6)');
  tipGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = tipGlow;
  ctx.beginPath();
  ctx.arc(fx, fy + size*0.04, fw*0.8, 0, Math.PI*2);
  ctx.fill();

  // Fingernail
  ctx.fillStyle = '#e8d8c0';
  ctx.beginPath();
  ctx.roundRect(fx - fw*0.35, fy + size*0.01, fw*0.7, size*0.06, fw*0.2);
  ctx.fill();

  return canvas.toBuffer('image/png');
}

writeFileSync('public/icons/icon-192.png', generateIcon(192));
writeFileSync('public/icons/icon-512.png', generateIcon(512));
console.log('Shh icons created!');
