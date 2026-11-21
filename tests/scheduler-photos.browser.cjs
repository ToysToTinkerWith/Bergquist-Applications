const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright")
const sharp = require("sharp")

const baseURL = process.env.SCHEDULER_TEST_URL || "http://127.0.0.1:3011"
const storageKey = "bergquist-scheduler-demo-v1"
const output = path.resolve("assets/scheduler-photos-qa")

async function main() {
  fs.mkdirSync(output, { recursive: true })
  const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--use-angle=swiftshader"] })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" })
  const page = await context.newPage()
  page.setDefaultTimeout(15000)
  const errors = []
  page.on("pageerror", error => errors.push(error.message))
  const image = { name: "event-work.png", mimeType: "image/png", buffer: await sharp({ create: { width: 640, height: 480, channels: 3, background: "#367c77" } }).png().toBuffer() }
  const openNew = async title => {
    await page.getByRole("button", { name: "New event", exact: true }).click()
    await page.getByLabel("Event title", { exact: true }).fill(title)
  }
  const save = async () => {
    await page.getByRole("button", { name: "Save event", exact: true }).click()
    await page.getByRole("dialog", { name: /New event|Edit event/ }).waitFor({ state: "hidden" })
  }
  const eventButton = title => page.locator(".fc-daygrid-event").filter({ hasText: title }).first()
  const upload = files => page.locator('input[type="file"]').setInputFiles(files)
  const persisted = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey)
  try {
    await page.goto(baseURL + "/components/scheduler", { waitUntil: "domcontentloaded" })
    await page.getByRole("button", { name: "New event", exact: true }).waitFor({ timeout: 60000 })
    await page.waitForFunction(key => localStorage.getItem(key) !== null, storageKey)
    assert.equal(await page.locator(".fc-event [role=img]").count(), 0, "Legacy sample events have no photo indicators")

    await openNew("Photo workflow")
    await upload(image)
    await page.getByLabel("Caption 1", { exact: true }).fill("Completed work <literal> & details")
    await save()
    assert.equal(await eventButton("Photo workflow").getByRole("img", { name: "1 photo", exact: true }).count(), 1)
    assert.equal(await page.locator(".fc-event").filter({ hasText: "Project discovery" }).locator("[role=img]").count(), 0)
    await page.screenshot({ path: path.join(output, "desktop-calendar.png"), fullPage: true })
    await page.reload({ waitUntil: "domcontentloaded" })
    await eventButton("Photo workflow").waitFor({ timeout: 60000 })
    await eventButton("Photo workflow").click()
    assert.equal(await page.getByLabel("Caption 1", { exact: true }).inputValue(), "Completed work <literal> & details")
    assert.equal(await page.getByRole("button", { name: "Preview photo 1", exact: true }).locator("img").evaluate(img => img.complete && img.naturalWidth > 0), true)
    await page.getByRole("button", { name: "Preview photo 1", exact: true }).click()
    const preview = page.getByRole("dialog", { name: "Event photo", exact: true })
    await preview.waitFor()
    assert.equal(await preview.getByText("Completed work <literal> & details", { exact: true }).count(), 1)
    await page.getByRole("button", { name: "Close photo preview", exact: true }).click()
    await preview.waitFor({ state: "hidden" })
    await page.getByLabel("Caption 1", { exact: true }).fill("Updated caption")
    await save()
    console.log("PASS create, calendar indicators, reload, preview, literal captions and caption edit")

    await eventButton("Photo workflow").click()
    await upload({ name: "unsafe.svg", mimeType: "image/svg+xml", buffer: Buffer.from("<svg/>") })
    await page.getByRole("alert").filter({ hasText: "Choose JPEG, PNG, or WebP" }).waitFor()
    await upload({ name: "oversize.png", mimeType: "image/png", buffer: Buffer.alloc(5 * 1024 * 1024 + 1) })
    await page.getByRole("alert").filter({ hasText: "5 MB" }).waitFor()
    await upload({ name: "fake.png", mimeType: "image/png", buffer: Buffer.from("not a photo") })
    await page.getByRole("alert").filter({ hasText: "not a valid" }).waitFor()
    await upload(Array.from({ length: 8 }, (_, index) => ({ ...image, name: index + ".png" })))
    await page.getByRole("alert").filter({ hasText: "8 photos" }).waitFor()
    assert.equal(await page.getByRole("button", { name: /^Preview photo/ }).count(), 1)
    await page.getByRole("button", { name: "Cancel", exact: true }).click()
    console.log("PASS invalid MIME, size, signature and photo-count rejection without losing existing photos")

    await eventButton("Photo workflow").click()
    const beforeQuota = await persisted()
    await page.getByLabel("Caption 1", { exact: true }).fill("Must not overwrite after quota error")
    await page.evaluate(key => {
      window.schedulerOriginalSetItem = Storage.prototype.setItem
      Storage.prototype.setItem = function (name, value) {
        if (name === key) throw new DOMException("Storage quota exceeded", "QuotaExceededError")
        return window.schedulerOriginalSetItem.call(this, name, value)
      }
    }, storageKey)
    await page.getByRole("button", { name: "Save event", exact: true }).click()
    await page.getByRole("alert").filter({ hasText: "Browser storage is full" }).waitFor()
    assert.deepEqual(await persisted(), beforeQuota)
    assert.equal(await page.getByLabel("Caption 1", { exact: true }).inputValue(), "Must not overwrite after quota error")
    await page.evaluate(() => { Storage.prototype.setItem = window.schedulerOriginalSetItem })
    await page.getByRole("button", { name: "Cancel", exact: true }).click()
    console.log("PASS quota error preserves persisted data and editable draft")

    await page.setViewportSize({ width: 390, height: 844 })
    await page.getByRole("button", { name: "Agenda", exact: true }).click()
    const agendaEvent = page.getByRole("button", { name: /Photo workflow/ })
    assert.equal(await agendaEvent.getByRole("img", { name: "1 photo", exact: true }).count(), 1)
    await agendaEvent.click()
    await page.getByLabel("Caption 1", { exact: true }).scrollIntoViewIfNeeded()
    await page.evaluate(() => document.fonts.ready)
    await page.waitForFunction(() => {
      const dialog = document.querySelector('[role="dialog"]')
      if (!dialog) return false
      for (let element = dialog; element; element = element.parentElement) {
        if (Number(getComputedStyle(element).opacity) < 1) return false
      }
      return true
    })
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    await page.screenshot({ path: path.join(output, "mobile-editor.png"), animations: "disabled" })
    assert.equal(await page.getByRole("dialog", { name: /Edit event/ }).evaluate(el => el.scrollWidth <= el.clientWidth + 1), true)
    await page.getByRole("button", { name: "Remove photo 1", exact: true }).click()
    await save()
    assert.equal(await agendaEvent.locator("[role=img]").count(), 0)
    await page.reload({ waitUntil: "domcontentloaded" })
    await page.getByRole("button", { name: /Photo workflow/ }).waitFor({ timeout: 60000 })
    assert.equal(await page.getByRole("button", { name: /Photo workflow/ }).locator("[role=img]").count(), 0)
    console.log("PASS mobile layout, agenda indicators, last-photo removal and reload")

    await page.evaluate(() => {
      window.schedulerOriginalDecode = HTMLImageElement.prototype.decode
      window.schedulerRevoked = []
      const revoke = URL.revokeObjectURL.bind(URL)
      URL.revokeObjectURL = url => { window.schedulerRevoked.push(url); revoke(url) }
      HTMLImageElement.prototype.decode = function () {
        return window.schedulerOriginalDecode.call(this).then(() => new Promise(resolve => { window.schedulerReleaseDecode = resolve }))
      }
    })
    await openNew("Cancelled photo")
    await upload(image)
    await page.waitForFunction(() => typeof window.schedulerReleaseDecode === "function")
    await page.getByRole("button", { name: "Close dialog", exact: true }).click()
    await openNew("Fresh draft")
    await page.evaluate(() => window.schedulerReleaseDecode())
    await page.waitForFunction(() => window.schedulerRevoked.length > 0)
    assert.equal(await page.getByRole("button", { name: /^Preview photo/ }).count(), 0)
    await page.getByRole("button", { name: "Cancel", exact: true }).click()
    console.log("PASS cancelling during photo processing discards results and revokes object URLs")

    await openNew("Unmounting photo")
    await page.evaluate(() => { window.schedulerReleaseDecode = null })
    await upload(image)
    await page.waitForFunction(() => typeof window.schedulerReleaseDecode === "function")
    await page.evaluate(() => window.next.router.push("/components"))
    await page.waitForURL("**/components")
    await page.evaluate(() => window.schedulerReleaseDecode())
    await page.waitForFunction(() => window.schedulerRevoked.length >= 2)
    assert.equal(errors.length, 0, errors.join("\n"))
    console.log("PASS unmount during photo processing; no browser errors")
  } catch (error) {
    console.error("Browser errors:", errors)
    console.error("Dialogs:", await page.locator('[role="dialog"]').evaluateAll(elements => elements.map(el => ({ labelledBy: el.getAttribute("aria-labelledby"), label: document.getElementById(el.getAttribute("aria-labelledby"))?.textContent, hidden: el.closest('[aria-hidden="true"]') !== null }))))
    console.error("Page:", (await page.locator("body").innerText()).slice(-7000))
    console.error("Saved event photos:", (await persisted())?.map(event => ({ title: event.title, photos: event.images?.length })))
    await page.screenshot({ path: path.join(output, "failure.png"), fullPage: true })
    throw error
  } finally {
    await browser.close()
  }
}

main().catch(error => { console.error(error); process.exitCode = 1 })
