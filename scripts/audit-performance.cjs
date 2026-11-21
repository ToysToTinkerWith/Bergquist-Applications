const fs = require('node:fs/promises')
const path = require('node:path')
const { gzipSync } = require('node:zlib')

const root = path.resolve(__dirname, '..')
const base = process.env.AUDIT_URL || 'https://bergquistapplications.com'
const output = path.resolve(root, process.env.AUDIT_OUTPUT || 'assets/performance-20261104/before.json')

async function main() {
  const sitemap = await (await fetch(base + '/sitemap.xml')).text()
  const routes = [...new Set([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => new URL(match[1]).pathname))]
  const report = { base, measuredAt: new Date().toISOString(), pages: [], bundles: {} }
  for (let i = 0; i < routes.length; i += 4) {
    await Promise.all(routes.slice(i, i + 4).map(async route => {
      const start = performance.now()
      try {
        const response = await fetch(base + route, { signal: AbortSignal.timeout(45000) })
        const ttfb = Math.round(performance.now() - start)
        const html = await response.text()
        report.pages.push({ route, status: response.status, ttfb, total: Math.round(performance.now() - start), bytes: Buffer.byteLength(html), cache: response.headers.get('cache-control'), build: html.match(/"buildId":"([^"]+)"/)?.[1] })
      } catch (error) { report.pages.push({ route, error: error.message }) }
    }))
  }
  const build = process.env.AUDIT_BUILD || 'functions/.next'
  const manifest = JSON.parse(await fs.readFile(path.join(root, build, 'build-manifest.json')))
  for (const [route, files] of Object.entries(manifest.pages)) {
    const shared = [...new Set([...manifest.pages['/_app'], ...files])]
    report.bundles[route] = (await Promise.all(shared.map(async file => gzipSync(await fs.readFile(path.join(root, build, file))).length))).reduce((sum, bytes) => sum + bytes, 0)
  }
  if (process.env.AUDIT_ASSISTANT === '1') {
    const start = performance.now()
    const response = await fetch(base + '/api/home-route-assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: 'In one sentence, what does Bergquist Applications build?', stream: true, source: 'performance-audit', history: [] }), signal: AbortSignal.timeout(60000) })
    report.assistant = { status: response.status, headersMs: Math.round(performance.now() - start), contentType: response.headers.get('content-type') }
    let body = ''
    for await (const chunk of response.body) {
      body += Buffer.from(chunk).toString()
      if (!report.assistant.firstAnswerMs && body.includes('"type":"answer"')) report.assistant.firstAnswerMs = Math.round(performance.now() - start)
    }
    report.assistant.totalMs = Math.round(performance.now() - start)
    report.assistant.events = body.split('\n').filter(Boolean).map(line => { try { return JSON.parse(line) } catch { return line.slice(0, 250) } })
    const quickStart = performance.now()
    const quick = await fetch(base + '/api/home-route-assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: 'How much does a website cost?', stream: true }), signal: AbortSignal.timeout(15000) })
    report.assistantQuick = { status: quick.status, totalMs: Math.round(performance.now() - quickStart), payload: await quick.json() }
  }
  await fs.mkdir(path.dirname(output), { recursive: true })
  await fs.writeFile(output, JSON.stringify(report, null, 2))
  console.log(JSON.stringify({ output, routes: report.pages.length, failures: report.pages.filter(p => p.status !== 200), pageTiming: report.pages.slice(0, 8), bundles: report.bundles, assistant: report.assistant ? { ...report.assistant, events: report.assistant.events.length } : undefined, assistantQuick: report.assistantQuick }, null, 2))
}
main().catch(error => { console.error(error); process.exitCode = 1 })
