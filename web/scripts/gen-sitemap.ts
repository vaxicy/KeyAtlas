import fs from 'fs';
const d = JSON.parse(fs.readFileSync('public/data/all.json', 'utf-8'));
const urls = [''];
d.apps.forEach((a: any) => urls.push(`/apps/${a.id}`));
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>https://keyatlas.app${u}</loc></url>`).join('\n')}
</urlset>`;
fs.writeFileSync('public/sitemap.xml', xml);
console.log(`sitemap: ${urls.length} URLs`);
