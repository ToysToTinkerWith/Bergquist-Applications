const fs = require("node:fs/promises")
const path = require("node:path")
const sharp = require("sharp")

// A static social card built from the current site's existing artwork and branding.
// Crawlers cannot capture its animated WebGL hero, so serve a ready-to-read image.
async function main() {
  const root = path.resolve(__dirname, "..")
  // SVG renderers consistently support embedded PNGs, including on Windows.
  const embed = async file => `data:image/png;base64,${(await sharp(path.join(root, file)).png().toBuffer()).toString("base64")}`
  const earth = await embed("public/home/splash/earth-moon-desktop.webp")
  const logo = await embed("public/brand/bergquist-orbital-icon.webp")
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs><linearGradient id="shade"><stop offset="0" stop-color="#050607"/><stop offset=".60" stop-color="#050607" stop-opacity=".95"/><stop offset="1" stop-color="#050607" stop-opacity="0"/></linearGradient></defs>
    <rect width="1200" height="630" fill="#050607"/>
    <image href="${earth}" x="400" y="30" width="800" height="600"/>
    <rect width="880" height="630" fill="url(#shade)"/>
    <image href="${logo}" x="58" y="48" width="64" height="64"/>
    <g font-family="Arial, sans-serif">
      <text x="140" y="90" fill="#f2f2f5" font-size="27" font-weight="700">BERGQUIST APPLICATIONS</text>
      <text x="64" y="246" fill="#f2f2f5" font-size="62" font-weight="700" letter-spacing="-2">Custom Websites.</text>
      <text x="64" y="323" fill="#b2a0ef" font-size="62" font-weight="700" letter-spacing="-2">Web Applications.</text>
      <rect x="65" y="363" width="58" height="3" fill="#b2a0ef"/>
      <text x="64" y="414" fill="#d4d5dc" font-size="23">Thoughtful websites and practical applications,</text>
      <text x="64" y="448" fill="#d4d5dc" font-size="23">shaped around your goals.</text>
      <text x="64" y="565" fill="#b2a0ef" font-size="22">bergquistapplications.com</text>
    </g>
  </svg>`
  const output = path.join(root, "public/og/bergquist-2026-11.jpg")
  await fs.mkdir(path.dirname(output), { recursive: true })
  await sharp(Buffer.from(svg)).jpeg({ quality: 92, mozjpeg: true }).toFile(output)
  const metadata = await sharp(output).metadata()
  console.log(`${path.relative(root, output)}: ${metadata.width}x${metadata.height}, ${(await fs.stat(output)).size} bytes`)
}

main().catch(error => { console.error(error); process.exitCode = 1 })
