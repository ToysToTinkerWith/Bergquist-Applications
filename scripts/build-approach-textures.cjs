const sharp = require("sharp")
const fs = require("node:fs/promises")
const path = require("node:path")

async function main() {
  const root = path.join(__dirname, "../public")
  const sources = [
    ["planets/mars_viking_mdim21_2k.jpg", "home/splash/mars-color.webp", 1024, 84],
    ["planets/mars_viking_mdim21_height_1k.jpg", "home/splash/mars-height.webp", 512, 88],
  ]
  for (const [source, output, width, quality] of sources) {
    await sharp(path.join(root, source)).resize({ width, withoutEnlargement: true }).webp({ quality }).toFile(path.join(root, output))
    const before = await fs.stat(path.join(root, source)), after = await fs.stat(path.join(root, output))
    console.log(`${output}: ${before.size} -> ${after.size} bytes`)
  }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
