import fs from 'fs';
const d = JSON.parse(fs.readFileSync('public/data/all.json', 'utf-8'));
const SITE_URL = 'https://keyatlas.pages.dev';
const lastmod = new Date().toISOString().slice(0, 10);
const urls = ['/', '/search'];
d.apps.forEach((a: any) => urls.push(`/apps/${a.id}`));
Array.from(new Set(d.apps.map((a: any) => a.category))).forEach((category) => {
  urls.push(`/category/${category}`);
});
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${SITE_URL}${u === '/' ? '' : u}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}
</urlset>`;
fs.writeFileSync('public/sitemap.xml', xml);
console.log(`sitemap: ${urls.length} URLs`);
