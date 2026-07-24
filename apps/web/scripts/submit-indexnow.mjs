import { readFile } from 'node:fs/promises';

const host = 'www.nogueiracardiologia.com.br';
const baseUrl = `https://${host}`;
const key = '7c5e419f83c04a0bb229950f647f381d';

const [coreSource, seoSource] = await Promise.all([
  readFile(new URL('../src/data/blog-posts.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/data/seo-blog-posts.ts', import.meta.url), 'utf8'),
]);

const slugPattern = /slug: '([^']+)'/g;
const coreSlugs = [...coreSource.matchAll(slugPattern)].map((match) => match[1]);
const seoSlugs = [...seoSource.matchAll(slugPattern)].slice(0, 30).map((match) => match[1]);
const staticPaths = [
  '/',
  '/blog',
  '/exames',
  '/editorial',
  '/privacidade',
  '/medicos/dr-paulo-roberto-nogueira',
  '/medicos/dra-cristiani-nogueira',
];
const urlList = [
  ...staticPaths.map((path) => `${baseUrl}${path}`),
  ...[...new Set([...coreSlugs, ...seoSlugs])].map((slug) => `${baseUrl}/blog/${slug}`),
];

const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host,
    key,
    keyLocation: `${baseUrl}/${key}.txt`,
    urlList,
  }),
});

if (!response.ok) {
  throw new Error(`IndexNow returned ${response.status}: ${await response.text()}`);
}

console.log(`IndexNow accepted ${urlList.length} URLs.`);
