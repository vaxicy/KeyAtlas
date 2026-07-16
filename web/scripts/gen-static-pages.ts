import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(WEB_DIR, 'dist');
const DATA_DIR = path.join(WEB_DIR, 'public', 'data');
const SITE_URL = 'https://keyatlas.pages.dev';

interface App {
  id: string;
  name: { zh: string; en: string };
  category: string;
  shortcutCount?: number;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function writePage(template: string, route: string, title: string, description: string) {
  const canonical = `${SITE_URL}${route === '/' ? '' : route}`;
  let html = template
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${escapeHtml(description)}" />`);

  const meta = [
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta name="twitter:card" content="summary" />`,
  ].join('\n    ');
  html = html.replace('</head>', `    ${meta}\n  </head>`);

  const outDir = route === '/' ? DIST_DIR : path.join(DIST_DIR, route);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf-8');
}

function main() {
  const template = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf-8');
  const apps: App[] = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'apps.json'), 'utf-8'));
  const categories = Array.from(new Set(apps.map(app => app.category)));

  writePage(
    template,
    '/',
    'KeyAtlas - Shortcut Search Engine for Every App & OS',
    'Search keyboard shortcuts for 150+ apps across Windows, macOS, Linux. Fast, free, open data.'
  );
  writePage(
    template,
    '/search',
    'Search Keyboard Shortcuts - KeyAtlas',
    'Search actions, apps, and keyboard shortcuts across Windows, macOS, and Linux.'
  );

  for (const app of apps) {
    writePage(
      template,
      `/apps/${app.id}`,
      `${app.name.en} Keyboard Shortcuts - KeyAtlas`,
      `Browse ${app.shortcutCount || 0} ${app.name.en} keyboard shortcuts for Windows, macOS, and Linux.`
    );
  }

  for (const category of categories) {
    const count = apps.filter(app => app.category === category).length;
    writePage(
      template,
      `/category/${category}`,
      `${category} Keyboard Shortcuts - KeyAtlas`,
      `Browse keyboard shortcuts for ${count} ${category} apps and tools.`
    );
  }

  console.log(`Static SEO pages: ${apps.length} apps, ${categories.length} categories`);
}

main();
