const fs = require('node:fs/promises')
const path = require('node:path')
const sharp = require('sharp')

async function main() {
  const [wide, mobile, variant = ''] = process.argv.slice(2)
  if (!wide || !mobile) throw new Error('Pass the generated wide and mobile PNG paths.')
  if (variant && !/^[a-z0-9-]+$/.test(variant)) throw new Error('Variant must be a lowercase filename slug.')
  const suffix = variant ? `-${variant}` : ''
  const root = path.resolve(__dirname, '..'), masters = path.join(root, 'assets/about'), output = path.join(root, 'public/about')
  await fs.mkdir(masters, { recursive: true }); await fs.mkdir(output, { recursive: true })
  for (const [source, name, widths] of [[wide, 'wide', [1024, 1200, 1536, 1774]], [mobile, 'mobile', [640, 960]]]) {
    await fs.copyFile(source, path.join(masters, `astronaut-${name}${suffix}-master.png`))
    for (const width of widths) {
      const target = path.join(output, `astronaut-${name}${suffix}-${width}.webp`)
      await sharp(source).resize({ width }).webp({ quality: 83, effort: 6 }).toFile(target)
      const metadata = await sharp(target).metadata(), stat = await fs.stat(target)
      console.log(`${path.basename(target)}: ${metadata.width}x${metadata.height}, ${Math.round(stat.size / 1024)} KB`)
    }
  }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
