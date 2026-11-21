const fs = require('node:fs/promises')
const path = require('node:path')
const sharp = require('sharp')

async function main() {
  const [icon, footer] = process.argv.slice(2)
  if (!icon || !footer) throw new Error('Provide the approved icon and footer source images')
  const root = path.resolve(__dirname, '..')
  const sources = path.join(root, 'assets/brand-orbital')
  await fs.mkdir(sources, { recursive: true })
  for (const [source, name, size] of [[icon, 'bergquist-orbital-icon', 192], [footer, 'bergquist-orbital-wordmark', 640]]) {
    await fs.copyFile(source, path.join(sources, `${name}-source.png`))
    const output = path.join(root, 'public/brand', `${name}.webp`)
    await sharp(source).resize(size, size, { fit: 'contain' }).webp({ quality: 90, effort: 6 }).toFile(output)
    console.log(`${name}: ${size}px, ${(await fs.stat(output)).size} bytes`)
  }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
