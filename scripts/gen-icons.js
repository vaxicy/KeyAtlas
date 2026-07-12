const sharp = require("sharp");
const fs = require("fs");

const svg = fs.readFileSync("icons/logo.svg");
const sizes = [16, 48, 128];

(async () => {
  for (const size of sizes) {
    await sharp(svg, { density: 384 })
      .resize(size, size)
      .png()
      .toFile(`icons/icon-${size}.png`);
    console.log(`icons/icon-${size}.png generated`);
  }
})();
