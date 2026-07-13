const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const BG = `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#4f46e5"/>
</linearGradient></defs><rect width="128" height="128" rx="28" fill="url(#bg)"/>`;

const s1 = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">${BG}
  <circle cx="62" cy="54" r="30" fill="none" stroke="#ffffff" stroke-width="8"/>
  <line x1="83" y1="75" x2="102" y2="94" stroke="#ffffff" stroke-width="11" stroke-linecap="round"/>
  <g fill="#ffffff">
    <circle cx="48" cy="40" r="3.6"/><circle cx="62" cy="40" r="3.6"/><circle cx="76" cy="40" r="3.6"/>
    <circle cx="48" cy="54" r="3.6"/><circle cx="62" cy="54" r="3.6"/><circle cx="76" cy="54" r="3.6"/>
    <circle cx="48" cy="68" r="3.6"/><circle cx="62" cy="68" r="3.6"/><circle cx="76" cy="68" r="3.6"/>
  </g></svg>`;

const s2 = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">${BG}
  <rect x="30" y="44" width="68" height="54" rx="14" fill="#c7c9f5"/>
  <rect x="30" y="38" width="68" height="54" rx="14" fill="#ffffff"/>
  <rect x="40" y="46" width="48" height="8" rx="4" fill="#ffffff" opacity="0.6"/>
  <circle cx="64" cy="64" r="16" fill="none" stroke="#6366f1" stroke-width="6"/>
  <line x1="76" y1="76" x2="88" y2="88" stroke="#6366f1" stroke-width="8" stroke-linecap="round"/>
</svg>`;

const s3 = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">${BG}
  <g>
    <rect x="22" y="74" width="24" height="30" rx="7" fill="#c7c9f5"/>
    <rect x="22" y="70" width="24" height="30" rx="7" fill="#ffffff"/>
    <rect x="52" y="74" width="24" height="30" rx="7" fill="#c7c9f5"/>
    <rect x="52" y="70" width="24" height="30" rx="7" fill="#ffffff"/>
    <rect x="82" y="74" width="24" height="30" rx="7" fill="#c7c9f5"/>
    <rect x="82" y="70" width="24" height="30" rx="7" fill="#ffffff"/>
  </g>
  <circle cx="82" cy="48" r="26" fill="none" stroke="#ffffff" stroke-width="8"/>
  <line x1="100" y1="66" x2="114" y2="80" stroke="#ffffff" stroke-width="11" stroke-linecap="round"/>
</svg>`;

const out = path.join(__dirname, "..", "icons");
(async () => {
  const svgs = [s1, s2, s3];
  for (let i = 0; i < svgs.length; i++) {
    const tmp = path.join(out, `preview-${i + 1}.svg`);
    fs.writeFileSync(tmp, svgs[i]);
    await sharp(tmp, { density: 384 }).resize(128, 128).png()
      .toFile(path.join(out, `preview-${i + 1}.png`));
    fs.unlinkSync(tmp);
    console.log(`preview-${i + 1}.png generated`);
  }
})();
