const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const svg = fs.readFileSync(path.join(__dirname, "..", "icons", "logo.svg"));

const sizes = [16, 48, 128];
(async () => {
  for (const s of sizes) {
    await sharp(svg, { density: 384 })
      .resize(s, s)
      .png()
      .toFile(path.join(__dirname, "..", "icons", `icon-${s}.png`));
    console.log(`icon-${s}.png generated`);
  }
})();
