import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../data');
const OUT_DIR = path.resolve(__dirname, '../public/data');

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
}

function main() {
  const appsRaw = fs.readFileSync(path.join(DATA_DIR, 'apps.json'), 'utf-8');
  const apps: App[] = JSON.parse(appsRaw);

  const allShortcuts: Shortcut[] = [];
  for (const app of apps) {
    const filePath = path.join(DATA_DIR, 'shortcuts', app.file);
    if (!fs.existsSync(filePath)) continue;
    const raw = fs.readFileSync(filePath, 'utf-8');
    const shortcuts: Shortcut[] = JSON.parse(raw);
    allShortcuts.push(...shortcuts);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const output = { apps, shortcuts: allShortcuts };
  fs.writeFileSync(
    path.join(OUT_DIR, 'all.json'),
    JSON.stringify(output, null, 2),
    'utf-8'
  );

  console.log(`Built data: ${apps.length} apps, ${allShortcuts.length} shortcuts`);
}

main();
