const fs = require('node:fs/promises')
const path = require('node:path')
const sharp = require('sharp')
async function main() {
  const dir = path.resolve(__dirname, '../public/work')
  for (const name of await fs.readdir(dir)) {
    if (!name.endsWith('.webp') || name.endsWith('-600.webp')) continue
    await sharp(path.join(dir, name)).resize({ width: 600, withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(dir, name.replace('.webp', '-600.webp')))
    console.log(`Prepared ${name} at 600px`)
  }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
