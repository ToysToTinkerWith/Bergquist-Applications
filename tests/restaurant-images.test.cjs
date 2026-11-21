const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const { createHash } = require('node:crypto')
const test = require('node:test')
const sharp = require('sharp')
const images = require('../lib/restaurantMenuImages.json')

test('every menu and ordering entry has a distinct, matching image', () => {
  for (const file of ['menu.js', 'order.js']) {
    const source = fs.readFileSync(`pages/components/restaurant-ordering/${file}`, 'utf8')
    const literal = source.slice(source.indexOf('const MENU = '), source.indexOf('const CATEGORY_META')).replace('const MENU = ', '')
    const menu = vm.runInNewContext(literal)
    const used = new Set()
    for (const category of menu) for (const group of category.groups) for (const item of group.items) {
      const image = images.find(image => image.group === group.title && image.name === item.name)
      assert.ok(image, `${file}: ${group.title} / ${item.name}`)
      assert.ok(!used.has(image.src), `Repeated category image: ${image.src}`)
      used.add(image.src)
      assert.ok(fs.existsSync(`public${image.src}`), image.src)
    }
    assert.equal(used.size, 60)
    assert.ok(source.includes('restaurantMenuImage(g.title, it.name)'))
    assert.ok(!source.includes('getItemImageForCategory'))
  }
})

test('all generated assets are distinct, compact WebP images', async () => {
  const hashes = new Set()
  for (const image of images) {
    const data = fs.readFileSync(`public${image.src}`)
    const metadata = await sharp(data).metadata()
    assert.equal(metadata.format, 'webp')
    assert.equal(metadata.width, 800)
    assert.equal(metadata.height, 800)
    assert.ok(data.length < 250000, `${image.key}: oversized thumbnail`)
    const hash = createHash('sha256').update(data).digest('hex')
    assert.ok(!hashes.has(hash), `${image.key}: reused image`)
    hashes.add(hash)
  }
  assert.equal(hashes.size, 65)
})

test('customizable dishes identify the pictured option', () => {
  for (const image of images.filter(image => image.group.startsWith('Create Your Own'))) assert.ok(image.caption)
  assert.match(images.find(image => image.name === 'Spaghetti').caption, /Meatball/)
  assert.notEqual(images.find(image => image.key === 'sicilian-plain-pizza').src, images.find(image => image.key === 'neapolitan-plain-pizza').src)
})
