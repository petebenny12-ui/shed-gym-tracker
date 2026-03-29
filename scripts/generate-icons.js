/**
 * Generate simple SVG-based PWA icons.
 * These are placeholders — replace with proper designed icons later.
 *
 * Run from project root on your computer at C:\Users\peteb\shed-gym-tracker:
 *   node scripts/generate-icons.js
 */

import { writeFileSync } from 'fs';

function createSVG(size) {
  const fontSize = Math.round(size * 0.2);
  const subFontSize = Math.round(size * 0.1);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0a0a0f" rx="${Math.round(size * 0.15)}"/>
  <text x="50%" y="40%" text-anchor="middle" dominant-baseline="middle" fill="#d97706" font-family="Georgia,serif" font-size="${fontSize}" font-weight="bold">SHED</text>
  <text x="50%" y="60%" text-anchor="middle" dominant-baseline="middle" fill="#d97706" font-family="Georgia,serif" font-size="${subFontSize}">GYM</text>
  <line x1="${size * 0.25}" y1="${size * 0.48}" x2="${size * 0.75}" y2="${size * 0.48}" stroke="#d97706" stroke-width="${Math.round(size * 0.01)}"/>
</svg>`;
}

writeFileSync('public/icons/icon-192.svg', createSVG(192));
writeFileSync('public/icons/icon-512.svg', createSVG(512));

// For PNG icons, you'd need sharp or canvas. For now, create SVGs and note that
// most modern browsers accept SVG icons in the manifest.
console.log('SVG icons created at public/icons/');
console.log('Note: For full PWA compatibility, convert these to PNG using an image editor or online tool.');
