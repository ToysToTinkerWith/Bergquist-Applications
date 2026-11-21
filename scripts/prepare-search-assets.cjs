const sharp = require('sharp')
const fs = require('node:fs/promises')

async function main() {
  // Reuse the existing dark-backed brand mark; only encode delivery sizes.
  for (const [name, size] of [['favicon-96.png', 96], ['apple-touch-icon.png', 180], ['logo-512.png', 512]]) {
    await sharp('public/brand/bergquist-orbital-icon.webp').resize(size, size).flatten({ background: '#050607' }).png().toFile(`public/brand/${name}`)
  }
  // Keep the default browser fallback in sync with the declared search icon.
  const png = await fs.readFile('public/brand/favicon-96.png')
  const ico = Buffer.alloc(22)
  ico.writeUInt16LE(1, 2)
  ico.writeUInt16LE(1, 4)
  ico[6] = 96
  ico[7] = 96
  ico.writeUInt16LE(1, 10)
  ico.writeUInt16LE(32, 12)
  ico.writeUInt32LE(png.length, 14)
  ico.writeUInt32LE(22, 18)
  await fs.writeFile('public/favicon.ico', Buffer.concat([ico, png]))
  // Existing pages reference this social image filename.
  await sharp('public/og/bergquist.png').resize({ width: 1200, withoutEnlargement: true }).jpeg({ quality: 85 }).toFile('public/og/bergquist-applications.jpg')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
