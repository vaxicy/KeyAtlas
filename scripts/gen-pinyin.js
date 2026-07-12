/**
 * KeyAtlas – pinyin pre-computation.
 *
 * Reads every data/shortcuts/*.json, computes the pinyin (full + initials,
 * both spaced and concatenated) for the Chinese name and Chinese keywords of
 * each shortcut, and writes it back as a `pinyin` field. This keeps the
 * runtime (the extension popup) dependency-free: search.js just matches
 * against the precomputed `pinyin` string.
 *
 * Run: npm run gen:pinyin
 */
const fs = require("fs");
const path = require("path");
const { pinyin } = require("pinyin-pro");

const DATA_DIR = path.join(__dirname, "..", "data", "shortcuts");

function toPinyin(text) {
  if (!text) return "";
  const full = pinyin(text, { toneType: "none", type: "array" }).join(" ");
  const fullConcat = pinyin(text, { toneType: "none", type: "array" }).join("");
  const first = pinyin(text, { pattern: "first", toneType: "none", type: "array" }).join(" ");
  const firstConcat = pinyin(text, { pattern: "first", toneType: "none", type: "array" }).join("");
  return `${full} ${fullConcat} ${first} ${firstConcat}`.toLowerCase();
}

function hasChinese(s) {
  return /[一-龥]/.test(s || "");
}

const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
let total = 0;

for (const file of files) {
  const fp = path.join(DATA_DIR, file);
  const arr = JSON.parse(fs.readFileSync(fp, "utf8"));
  for (const s of arr) {
    const zhName = (s.name && s.name.zh) || "";
    const zhKw = (s.keywords || []).filter(hasChinese).join(" ");
    const py = (toPinyin(zhName) + " " + toPinyin(zhKw)).trim();
    s.pinyin = py;
    total++;
  }
  fs.writeFileSync(fp, JSON.stringify(arr, null, 2) + "\n", "utf8");
  console.log(`Updated ${file}: ${arr.length} shortcuts`);
}

console.log(`Done. ${total} shortcuts got a pinyin field.`);
