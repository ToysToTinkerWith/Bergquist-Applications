const fs = require('node:fs')
const path = require('node:path')

// Only public, prerendered pages belong on the CDN. APIs, account pages and
// order/receipt routes continue through Next, with their existing access checks.
function stageHosting(root, build) {
  root = fs.realpathSync(root)
  const target = path.join(root, '.firebase-hosting')
  if (path.dirname(target) !== root || (fs.existsSync(target) && fs.lstatSync(target).isSymbolicLink())) throw new Error('Unexpected hosting artifact path')
  const previous = []
  const oldManifest = path.join(target, '.current-assets.json')
  if (fs.existsSync(oldManifest)) {
    for (const file of JSON.parse(fs.readFileSync(oldManifest, 'utf8'))) {
      if (!file.startsWith('_next/static/') || file.includes('..')) throw new Error('Invalid retained asset')
      const source = path.join(target, file)
      if (fs.existsSync(source)) previous.push([file, fs.readFileSync(source)])
    }
  }
  fs.rmSync(target, { recursive: true, force: true })
  fs.cpSync(path.join(root, 'public'), target, { recursive: true })
  for (const [file, data] of previous) {
    fs.mkdirSync(path.dirname(path.join(target, file)), { recursive: true })
    fs.writeFileSync(path.join(target, file), data)
  }
  fs.cpSync(path.join(build, 'static'), path.join(target, '_next/static'), { recursive: true })
  const files = fs.readdirSync(path.join(build, 'static'), { recursive: true }).filter(file => fs.statSync(path.join(build, 'static', file)).isFile()).map(file => '_next/static/' + file.replaceAll('\\', '/'))
  fs.writeFileSync(path.join(target, '.current-assets.json'), JSON.stringify(files))

  const pages = JSON.parse(fs.readFileSync(path.join(build, 'server/pages-manifest.json'), 'utf8'))
  const prerender = JSON.parse(fs.readFileSync(path.join(build, 'prerender-manifest.json'), 'utf8'))
  const publicPages = new Set(['/', '/about', '/components', '/applications', '/contact', '/Design', '/privacy', '/terms', '/finance', '/events', '/social-post-creator', '/applications/podcast', '/components/restaurant-ordering', '/components/restaurant-ordering/menu', '/components/restaurant-ordering/order'])
  for (const [route, info] of Object.entries(prerender.routes)) {
    if (['/components/[componentKey]', '/applications/[slug]'].includes(info.srcRoute)) publicPages.add(route)
  }
  let count = 0
  for (const route of publicPages) {
    // SSG entries point to their JS renderer in pages-manifest, while the
    // actual prerendered HTML is stored alongside it under the concrete route.
    const relative = pages[route]?.endsWith('.html') ? pages[route] : `pages${route === '/' ? '/index' : route}.html`
    if (!relative.endsWith('.html') || relative.includes('..') || !fs.existsSync(path.join(build, 'server', relative))) throw new Error(`Public page was not prerendered: ${route}`)
    const file = route === '/' ? 'index.html' : route.slice(1) + '.html'
    fs.mkdirSync(path.dirname(path.join(target, file)), { recursive: true })
    fs.copyFileSync(path.join(build, 'server', relative), path.join(target, file))
    const data = prerender.routes[route]?.dataRoute
    const json = path.join(build, 'server', relative.replace(/\.html$/, '.json'))
    if (data && fs.existsSync(json)) {
      fs.mkdirSync(path.dirname(path.join(target, data)), { recursive: true })
      fs.copyFileSync(json, path.join(target, data))
    }
    count++
  }
  console.log(`Staged ${count} public pages and ${files.length} build assets for Firebase's CDN; retained the preceding build's assets for open tabs.`)
  return { count, assets: files.length, target }
}
module.exports = { stageHosting }
