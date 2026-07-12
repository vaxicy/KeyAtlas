/**
 * KeyAtlas – data quality validator.
 *
 * Scans data/categories.json, data/apps.json and every data/shortcuts/*.json
 * and reports problems that would hurt the bilingual / search experience:
 *   - missing name.zh / name.en
 *   - missing description.zh / description.en
 *   - missing windows / mac / linux keys (value may be "—")
 *   - missing keywords array
 *   - missing precomputed pinyin field (run npm run gen:pinyin)
 *   - app.file pointing to a non-existent shortcut file
 *   - shortcut.appId not present in apps.json
 *   - category referenced by a shortcut that does not exist
 *
 * Run: npm run validate:data
 * Exits non-zero if any ERROR is found (warnings do not fail the run).
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DATA = path.join(ROOT, "data");

let errors = 0;
let warnings = 0;

function readJSON(rel) {
  const fp = path.join(DATA, rel);
  if (!fs.existsSync(fp)) {
    errors++;
    console.error(`ERROR  missing file: ${rel}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(fp, "utf8"));
  } catch (e) {
    errors++;
    console.error(`ERROR  invalid JSON in ${rel}: ${e.message}`);
    return null;
  }
}

function check(err) {
  if (err) {
    errors++;
    console.error(`ERROR  ${err}`);
  }
}
function warn(msg) {
  warnings++;
  console.warn(`WARN   ${msg}`);
}

const categories = readJSON("categories.json") || [];
const apps = readJSON("apps.json") || [];

const appIds = new Set(apps.map((a) => a.id));
const catIds = new Set(categories.map((c) => c.id));

// app.file existence
for (const a of apps) {
  const fp = path.join(DATA, "shortcuts", a.file);
  if (!fs.existsSync(fp)) check(`app "${a.id}" references missing file: ${a.file}`);
}

const files = fs.readdirSync(path.join(DATA, "shortcuts")).filter((f) => f.endsWith(".json"));

for (const file of files) {
  const arr = readJSON(path.join("shortcuts", file));
  if (!arr) continue;
  arr.forEach((s, i) => {
    const where = `${file}[${i}] (id=${s.id || "?"})`;
    if (!s.id) check(`${where}: missing id`);
    if (!s.appId) check(`${where}: missing appId`);
    else if (!appIds.has(s.appId)) check(`${where}: appId "${s.appId}" not in apps.json`);
    if (!s.category) check(`${where}: missing category`);
    else if (!catIds.has(s.category)) check(`${where}: category "${s.category}" not in categories.json`);

    if (!s.name || !s.name.zh || !s.name.en) check(`${where}: name must have zh + en`);
    if (!s.description || !s.description.zh || !s.description.en) check(`${where}: description must have zh + en`);

    ["windows", "mac", "linux"].forEach((k) => {
      if (!(k in s)) check(`${where}: missing key "${k}"`);
    });

    if (!Array.isArray(s.keywords) || s.keywords.length === 0) warn(`${where}: no keywords (search recall lower)`);
    if (!s.pinyin) warn(`${where}: no pinyin field (run npm run gen:pinyin)`);
  });
}

console.log(`\nValidation complete: ${errors} error(s), ${warnings} warning(s).`);
process.exit(errors ? 1 : 0);
