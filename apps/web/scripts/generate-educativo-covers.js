/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs');
const path = require('node:path');

const { blogPosts } = require('../src/data/blog-posts.ts');

const outputDir = path.join(process.cwd(), 'public', 'uploads-imagens-nogueira', 'educativo-covers');
const dataFile = path.join(process.cwd(), 'src', 'data', 'blog-posts.ts');

const palette = [
  ['#0A2C4D', '#14508B', '#15A7DD'],
  ['#103E6A', '#0F766E', '#38BDF8'],
  ['#12324F', '#1D4ED8', '#67E8F9'],
  ['#0F3760', '#047857', '#A7F3D0'],
  ['#172554', '#0E7490', '#BAE6FD'],
  ['#064E3B', '#14508B', '#5EEAD4'],
];

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapText(text, maxChars, maxLines) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    } else {
      current = candidate;
    }
  }

  if (current && lines.length < maxLines) lines.push(current);

  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[.,;:!?]+$/, '')}...`;
  }

  return lines;
}

function hashtag(value) {
  return `#${value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')}`;
}

function createSvg(post, index) {
  const [base, mid, accent] = palette[index % palette.length];
  const titleLines = wrapText(post.title, 36, 4);
  const tags = ['#NogueiraCardiologia', '#Cardiologia', hashtag(post.category)].slice(0, 3);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(post.title)}</title>
  <desc id="desc">Capa educativa da Nogueira Cardiologia sobre ${escapeXml(post.category)}.</desc>
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${base}"/>
      <stop offset="0.62" stop-color="${mid}"/>
      <stop offset="1" stop-color="${accent}"/>
    </linearGradient>
    <radialGradient id="pulse" cx="75%" cy="25%" r="60%">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.26"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="675" fill="url(#bg)"/>
  <rect width="1200" height="675" fill="url(#pulse)"/>
  <path d="M760 134c72-78 206-72 268 9 68 89 23 232-82 257-64 15-126-8-163-48-38 43-101 65-164 49-98-25-145-151-88-238 51-77 157-100 229-29Z" fill="#FFFFFF" opacity="0.1"/>
  <path d="M792 222c42-45 120-42 156 5 40 52 13 135-48 149-38 9-73-5-95-28-22 25-59 38-95 29-57-15-84-88-50-139 29-45 91-58 132-16Z" fill="#FFFFFF" opacity="0.13"/>
  <path d="M80 510c114-46 205-18 286 7 87 28 164 53 268 0 92-46 181-44 284 8 69 35 127 47 202 21" fill="none" stroke="#FFFFFF" stroke-opacity="0.22" stroke-width="18" stroke-linecap="round"/>
  <rect x="70" y="66" width="1060" height="543" rx="34" fill="#FFFFFF" opacity="0.08" stroke="#FFFFFF" stroke-opacity="0.2"/>
  <text x="100" y="122" fill="#D8F3FF" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" letter-spacing="3">${escapeXml(post.category.toUpperCase())}</text>
  ${titleLines.map((line, lineIndex) => `<text x="100" y="${220 + lineIndex * 68}" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="54" font-weight="700">${escapeXml(line)}</text>`).join('\n  ')}
  <text x="100" y="500" fill="#EAF6FF" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="600">Conteúdo educativo para prevenção e cuidado cardiovascular</text>
  <text x="100" y="554" fill="#FFFFFF" fill-opacity="0.9" font-family="Arial, Helvetica, sans-serif" font-size="23" font-weight="700">${escapeXml(tags.join('  '))}</text>
  <text x="100" y="594" fill="#FFFFFF" fill-opacity="0.78" font-family="Arial, Helvetica, sans-serif" font-size="20">Nogueira Cardiologia • São José do Rio Preto • Telemedicina</text>
  <g transform="translate(947 467)">
    <circle cx="84" cy="84" r="80" fill="#FFFFFF" opacity="0.94"/>
    <path d="M84 38c-25 0-45 20-45 45 0 33 45 63 45 63s45-30 45-63c0-25-20-45-45-45Zm0 71c-14 0-26-12-26-26s12-26 26-26 26 12 26 26-12 26-26 26Z" fill="${mid}"/>
    <path d="M70 83h28M84 69v28" stroke="${base}" stroke-width="8" stroke-linecap="round"/>
  </g>
</svg>
`;
}

fs.mkdirSync(outputDir, { recursive: true });

for (const [index, post] of blogPosts.entries()) {
  fs.writeFileSync(path.join(outputDir, `${post.slug}.svg`), createSvg(post, index));
}

let source = fs.readFileSync(dataFile, 'utf8');
for (const post of blogPosts) {
  const slugMarker = `slug: '${post.slug}',`;
  const slugIndex = source.indexOf(slugMarker);
  if (slugIndex === -1) continue;

  const coverMarker = "coverImage: '";
  const coverIndex = source.indexOf(coverMarker, slugIndex);
  if (coverIndex === -1) continue;

  const valueStart = coverIndex + coverMarker.length;
  const valueEnd = source.indexOf("'", valueStart);
  if (valueEnd === -1) continue;

  source = `${source.slice(0, valueStart)}/uploads-imagens-nogueira/educativo-covers/${post.slug}.svg${source.slice(valueEnd)}`;
}

fs.writeFileSync(dataFile, source);
console.log(`Generated ${blogPosts.length} educativo cover images in ${outputDir}`);
