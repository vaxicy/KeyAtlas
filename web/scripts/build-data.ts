import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../data');
const OUT_DIR = path.resolve(__dirname, '../public/data');
const SHORTCUTS_OUT_DIR = path.join(OUT_DIR, 'shortcuts');

interface Shortcut {
  id: string;
  appId: string;
  type: string;
  category: string;
  name: { zh: string; en: string };
  description: { zh: string; en: string };
  windows?: string | null;
  mac?: string | null;
  linux?: string | null;
  keywords?: string[];
  pinyin?: string[];
}

interface App {
  id: string;
  name: { zh: string; en: string };
  category: string;
  icon: string;
  type: string;
  popular?: boolean;
  file: string;
  source: string;
  shortcutCount?: number;
}

function main() {
  const appsRaw = fs.readFileSync(path.join(DATA_DIR, 'apps.json'), 'utf-8');
  const apps: App[] = JSON.parse(appsRaw);

  const allShortcuts: Shortcut[] = [];
  const shortcutCountByApp = new Map<string, number>();
  for (const app of apps) {
    const filePath = path.join(DATA_DIR, 'shortcuts', app.file);
    if (!fs.existsSync(filePath)) continue;
    const raw = fs.readFileSync(filePath, 'utf-8');
    const shortcuts: Shortcut[] = JSON.parse(raw);
    shortcutCountByApp.set(app.id, shortcuts.length);
    allShortcuts.push(...shortcuts);
  }
  const appsWithCounts = apps.map(app => ({
    ...app,
    shortcutCount: shortcutCountByApp.get(app.id) || 0,
  }));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(SHORTCUTS_OUT_DIR, { recursive: true });

  const output = { apps: appsWithCounts, shortcuts: allShortcuts };
  fs.writeFileSync(
    path.join(OUT_DIR, 'all.json'),
    JSON.stringify(output),
    'utf-8'
  );
  fs.writeFileSync(
    path.join(OUT_DIR, 'apps.json'),
    JSON.stringify(appsWithCounts),
    'utf-8'
  );
  fs.writeFileSync(
    path.join(OUT_DIR, 'search.json'),
    JSON.stringify({ shortcuts: allShortcuts }),
    'utf-8'
  );

  for (const app of appsWithCounts) {
    const shortcuts = allShortcuts.filter(s => s.appId === app.id);
    fs.writeFileSync(
      path.join(SHORTCUTS_OUT_DIR, `${app.id}.json`),
      JSON.stringify(shortcuts),
      'utf-8'
    );
  }

  console.log(`Built data: ${apps.length} apps, ${allShortcuts.length} shortcuts`);
}

main();
