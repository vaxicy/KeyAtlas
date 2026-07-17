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

function writePage(template: string, route: string, title: string, description: string, jsonLd?: Record<string, unknown>) {
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
  const structuredData = jsonLd
    ? `\n    <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`
    : '';
  html = html.replace('</head>', `    ${meta}${structuredData}\n  </head>`);

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
    'Search keyboard shortcuts for 150+ apps across Windows, macOS, Linux. Fast, free, open data.',
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'KeyAtlas',
      url: SITE_URL,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    }
  );
  writePage(
    template,
    '/search',
    'Search Keyboard Shortcuts - KeyAtlas',
    'Search actions, apps, and keyboard shortcuts across Windows, macOS, and Linux.',
    {
      '@context': 'https://schema.org',
      '@type': 'SearchResultsPage',
      name: 'Search Keyboard Shortcuts - KeyAtlas',
      url: `${SITE_URL}/search`,
      isPartOf: { '@type': 'WebSite', name: 'KeyAtlas', url: SITE_URL },
    }
  );
  writePage(
    template,
    '/404',
    'Page Not Found - KeyAtlas',
    'This page may have moved, or the shortcut collection does not exist yet.',
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Page Not Found - KeyAtlas',
      url: `${SITE_URL}/404`,
      isPartOf: { '@type': 'WebSite', name: 'KeyAtlas', url: SITE_URL },
    }
  );

  for (const app of apps) {
    writePage(
      template,
      `/apps/${app.id}`,
      `${app.name.en} Keyboard Shortcuts - KeyAtlas`,
      `Browse ${app.shortcutCount || 0} ${app.name.en} keyboard shortcuts for Windows, macOS, and Linux.`,
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: app.name.en,
        applicationCategory: app.category,
        url: `${SITE_URL}/apps/${app.id}`,
        operatingSystem: 'Windows, macOS, Linux',
        isPartOf: { '@type': 'WebSite', name: 'KeyAtlas', url: SITE_URL },
      }
    );
  }

  for (const category of categories) {
    const count = apps.filter(app => app.category === category).length;
    writePage(
      template,
      `/category/${category}`,
      `${category} Keyboard Shortcuts - KeyAtlas`,
      `Browse keyboard shortcuts for ${count} ${category} apps and tools.`,
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${category} Keyboard Shortcuts - KeyAtlas`,
        url: `${SITE_URL}/category/${category}`,
        isPartOf: { '@type': 'WebSite', name: 'KeyAtlas', url: SITE_URL },
      }
    );
  }

  console.log(`Static SEO pages: ${apps.length} apps, ${categories.length} categories`);
}

main();
