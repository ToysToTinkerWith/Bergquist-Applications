const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const sharp = require('sharp')

test('search and organization icons are derived from the current navigation logo', async () => {
  for (const [file, size] of [['favicon-96.png', 96], ['apple-touch-icon.png', 180], ['logo-512.png', 512]]) {
    const actual = await fs.readFile(`public/brand/${file}`)
    const expected = await sharp('public/brand/bergquist-orbital-icon.webp').resize(size, size).flatten({ background: '#050607' }).png().toBuffer()
    assert.deepEqual(actual, expected, file)
    const info = await sharp(actual).metadata()
    assert.equal(info.width, size)
    assert.equal(info.height, size)
    assert.equal(info.hasAlpha, false)
  }
  const ico = await fs.readFile('public/favicon.ico')
  assert.equal(ico.readUInt16LE(2), 1)
  assert.equal(ico.readUInt16LE(4), 1)
  assert.deepEqual(ico.subarray(ico.readUInt32LE(18)), await fs.readFile('public/brand/favicon-96.png'))
})
