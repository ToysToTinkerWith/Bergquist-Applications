import * as THREE from "three"
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js"
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js"
import { dataSummary, financeSummary, SPACE_PRODUCTS, hardwareActionEnabled, HARDWARE_ACTIONS, HARDWARE_LABELS } from "../../lib/cockpitSystems"

export const COCKPIT_STATIONS = [
  { id: "data", label: "Data", color: "#75d8ee", number: "01" },
  { id: "finance", label: "Finance", color: "#92e3b7", number: "02" },
  { id: "ai", label: "AI", color: "#b9acf4", number: "03" },
]

const TAU = Math.PI * 2

function texture(canvas) {
  const map = new THREE.CanvasTexture(canvas)
  map.colorSpace = THREE.SRGBColorSpace
  map.anisotropy = 4
  return map
}

function instrument(station, images) {
  const canvas = document.createElement("canvas")
  canvas.width = 1024; canvas.height = 640
  const ctx = canvas.getContext("2d"), map = texture(canvas), accent = station.color
  const text = (value, x, y, size = 23, color = "#a6bbc4", title = false, width = 960) => {
    ctx.fillStyle = color; ctx.font = `${title ? 500 : 400} ${size}px "Outfit", sans-serif`
    ctx.fillText(value, x, y, width)
  }
  const line = (points, color, width = 2) => {
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath()
    points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke()
  }
  const wrap = (value, x, y, width, size, maxLines, color = "#dce6ec") => {
    ctx.font = `400 ${size}px "Outfit", sans-serif`
    const words = String(value).replace(/\s+/g, " ").split(" "), lines = []
    let row = ""
    words.forEach(word => {
      if (ctx.measureText(`${row} ${word}`).width > width && row) { lines.push(row); row = word } else row = row ? `${row} ${word}` : word
    })
    if (row) lines.push(row)
    lines.slice(0, maxLines).forEach((value, i) => text(i === maxLines - 1 && lines.length > maxLines ? value + "..." : value, x, y + i * (size + 10), size, color, false, width))
  }
  const draw = (time, systems) => {
    const state = systems[station.id]
    ctx.fillStyle = "#0d0f15"; ctx.fillRect(0, 0, 1024, 640)
    text(`${station.label} Components`, 35, 73, 49, "#eaf2f3", true)
    line([[32, 103], [992, 103]], "#26353d")
    if (station.id === "data") {
      const summary = dataSummary(state)
      text("Website traffic", 35, 151, 29, accent)
      text("Firebase Analytics / 30 days", 550, 151, 23)
      text(state.generatedAt ? summary.total.toLocaleString() : "--", 35, 225, 57, "#eaf2f3")
      text("Sessions", 35, 263, 23)
      text(state.generatedAt ? summary.pageViews.toLocaleString() : "--", 550, 225, 57, "#eaf2f3")
      text("Page views", 550, 263, 23)
      for (let i = 0; i < 4; i++) line([[36, 301 + i * 70], [982, 301 + i * 70]], "#1a303a", 1)
      const rows = summary.rows, max = Math.max(1, ...rows.map(row => row.value))
      if (!rows.length) {
        wrap(state.status === "loading" ? "Connecting to Firebase Analytics..." : state.status === "error" ? state.notice : "No website traffic reported for this period.", 80, 375, 860, 29, 3, accent)
      } else if (state.view === "table") {
        text("Date", 40, 307, 22); text("Sessions", 470, 307, 22); text("Page views", 740, 307, 22)
        rows.slice(-5).forEach((row, i) => {
          text(row.id, 40, 346 + i * 39, 26, accent)
          text(String(row.value), 470, 346 + i * 39, 26, "#dce6ec")
          text(String(row.pageViews), 740, 346 + i * 39, 26, "#dce6ec")
        })
      } else if (state.view === "bars") rows.forEach((row, i) => {
        const width = 930 / rows.length, height = row.value / max * 195
        ctx.fillStyle = accent; ctx.fillRect(40 + i * width, 510 - height, width * .66, height)
      })
      else {
        const points = rows.map((row, i) => [40 + i / Math.max(1, rows.length - 1) * 928, 510 - row.value / max * 195])
        line(points, accent, 4)
        points.forEach(([x, y]) => { ctx.beginPath(); ctx.fillStyle = accent; ctx.arc(x, y, 3, 0, TAU); ctx.fill() })
      }
      text(state.status === "error" && rows.length ? "Last available report" : rows.length ? `${rows[0].id} - ${rows[rows.length - 1].id}` : "Reporting connection", 36, 560, 21)
      HARDWARE_LABELS.data.forEach((label, i) => {
        const selected = state.view === HARDWARE_ACTIONS.data[i]
        ctx.strokeStyle = selected ? accent : "#30454f"; ctx.strokeRect(32 + i * 247, 581, 226, 42)
        text(label, 55 + i * 247, 610, 23, hardwareActionEnabled(systems, "data", HARDWARE_ACTIONS.data[i]) ? accent : "#53636e")
      })
    } else if (station.id === "finance") {
      const summary = financeSummary(state), dollars = cents => `$${(cents / 100).toLocaleString("en-US")}`
      text("Cash flow / Quarter", 35, 151, 29, accent); text("Sample sales", 778, 151, 22)
      text(dollars(summary.received), 35, 225, 57, "#eaf2f3"); text("Received", 35, 263, 23)
      text(dollars(summary.net), 550, 225, 57, "#eaf2f3"); text("Net cash flow", 550, 263, 23)
      const max = Math.max(...summary.months.flatMap(row => [row.income, row.expenses]), 1)
      summary.months.forEach((row, i) => {
        const x = 45 + i * 180
        ctx.fillStyle = accent; ctx.fillRect(x, 450 - row.income / max * 155, 50, row.income / max * 155)
        ctx.fillStyle = "#b7a78c"; ctx.fillRect(x + 55, 450 - row.expenses / max * 155, 50, row.expenses / max * 155)
        text(row.name, x, 483, 21)
      })
      text("Received / Expenses", 35, 529, 22)
      text("Outstanding", 660, 332, 25); text(dollars(summary.pending), 660, 380, 39, accent)
      SPACE_PRODUCTS.forEach((product, i) => {
        const x = 35 + i * 330
        if (images[i]?.complete && images[i].naturalWidth) ctx.drawImage(images[i], x, 553, 64, 64)
        text(product.name, x + 73, 579, 20, "#dce6ec", false, 238)
        text(dollars(product.cents), x + 73, 609, 21, accent)
      })
    } else {
      const busy = state.status === "running"
      text("AI Assistant", 35, 151, 29, accent)
      text(busy ? "Preparing answer..." : state.status === "error" ? "Connection unavailable" : "Ready to assist", 550, 151, 23)
      const prompt = state.prompt || "What are web components?"
      ctx.fillStyle = "#17202c"; ctx.fillRect(34, 179, 955, 100)
      wrap(prompt, 55, 218, 910, 26, 2)
      text("Response", 35, 326, 24, accent)
      wrap(busy ? "Thinking through your question..." : state.error || state.answer, 35, 371, 950, 28, 5)
      line([[32, 559], [992, 559]], "#343346")
      text(state.route ? `Visit ${state.route.label}` : "Ask the assistant", 35, 603, 26, accent)
      if (busy) {
        ctx.fillStyle = accent; ctx.fillRect(35 + (time * 100 % 800), 545, 70, 3)
      }
    }
    map.needsUpdate = true
  }
  return { map, draw }
}

// Static hardware is baked by material so the many fasteners, switches and ribs
// retain their geometry without each costing a separate draw call.
function bakeHardware(source, target) {
  source.updateMatrixWorld(true)
  const buckets = new Map(), originals = new Set()
  source.traverse(object => {
    if (!object.isMesh) return
    const geometry = (object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone()).applyMatrix4(object.matrixWorld)
    originals.add(object.geometry)
    if (!buckets.has(object.material)) buckets.set(object.material, [])
    buckets.get(object.material).push(geometry)
  })
  for (const [material, geometries] of buckets) {
    const merged = mergeGeometries(geometries, false)
    const mesh = new THREE.Mesh(merged, material)
    mesh.castShadow = mesh.receiveShadow = !material.transparent
    target.add(mesh)
    geometries.forEach(geometry => geometry.dispose())
  }
  originals.forEach(geometry => geometry.dispose())
  source.clear()
}

export function createPioneerCockpit(initialSystems) {
  let systems = initialSystems
  const images = SPACE_PRODUCTS.map(() => new Image())
  const assetsReady = Promise.all(images.map((image, i) => new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = SPACE_PRODUCTS[i].image })))
  const root = new THREE.Group(), hardware = new THREE.Group(), shell = new THREE.Group()
  root.name = "Pioneer 01 / flight deck"
  root.add(shell)
  const materials = {
    ceramic: new THREE.MeshStandardMaterial({ color: 0xcfd3d0, roughness: .42, metalness: .27 }),
    graphite: new THREE.MeshStandardMaterial({ color: 0x141b1d, roughness: .49, metalness: .55 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x080b0c, roughness: .86 }),
    titanium: new THREE.MeshStandardMaterial({ color: 0x87959b, roughness: .28, metalness: .88 }),
    copper: new THREE.MeshStandardMaterial({ color: 0xb4834d, roughness: .3, metalness: .84 }),
    ivory: new THREE.MeshStandardMaterial({ color: 0xe9ebe4, roughness: .42, metalness: .12 }),
    light: new THREE.MeshStandardMaterial({ color: 0x99dbed, emissive: 0x77bad3, emissiveIntensity: 2.1 }),
    amber: new THREE.MeshStandardMaterial({ color: 0xdb9b51, emissive: 0xcf7427, emissiveIntensity: .8 }),
    red: new THREE.MeshStandardMaterial({ color: 0x963b34, roughness: .43, metalness: .3 }),
    // A neutral tint preserves true black through the canopy without an environment-lit haze.
    glass: new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .025,
      depthWrite: false, side: THREE.DoubleSide, toneMapped: false }),
  }
  const grain = document.createElement("canvas"); grain.width = grain.height = 256
  const grainContext = grain.getContext("2d"), grainData = grainContext.createImageData(256, 256)
  let grainSeed = 811
  for (let i = 0; i < grainData.data.length; i += 4) {
    grainSeed = (1664525 * grainSeed + 1013904223) >>> 0
    const value = 175 + (grainSeed >>> 27)
    grainData.data.set([value, value, value, 255], i)
  }
  grainContext.putImageData(grainData, 0, 0)
  const grainMap = new THREE.CanvasTexture(grain); grainMap.wrapS = grainMap.wrapT = THREE.RepeatWrapping
  grainMap.repeat.set(5, 5)
  materials.ceramic.roughnessMap = grainMap; materials.ceramic.bumpMap = grainMap; materials.ceramic.bumpScale = .002
  materials.titanium.roughnessMap = grainMap
  const add = (parent, geometry, material, position = [0, 0, 0]) => {
    const mesh = new THREE.Mesh(geometry, typeof material === "string" ? materials[material] : material)
    mesh.position.set(...position); parent.add(mesh); return mesh
  }
  const box = (parent, size, position, material = "ceramic", radius = .035) =>
    add(parent, new RoundedBoxGeometry(...size, 2, Math.min(radius, ...size.map(n => n / 3))), material, position)
  const cylinder = (parent, radius, length, position, material = "titanium", sides = 24) =>
    add(parent, new THREE.CylinderGeometry(radius, radius, length, sides), material, position)
  const tube = (parent, points, radius = .035, material = "titanium") =>
    add(parent, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), 48, radius, 8, false), material)
  const bolt = (parent, x, y, z) => {
    const cap = cylinder(parent, .032, .017, [x, y, z], "titanium", 6)
    cap.rotation.x = Math.PI / 2
    box(parent, [.025, .006, .003], [x, y, z + .01], "graphite", .001)
  }
  const label = (parent, words, position, width = .8, dark = false) => {
    const canvas = document.createElement("canvas"); canvas.width = 768; canvas.height = 96
    const ctx = canvas.getContext("2d")
    ctx.fillStyle = dark ? "#11191b" : "#cfd5d3"; ctx.fillRect(0, 0, 768, 96)
    ctx.fillStyle = dark ? "#a6bfca" : "#202b2e"; ctx.font = "500 40px monospace"
    ctx.textAlign = "center"; ctx.fillText(words, 384, 62, 726)
    return add(parent, new THREE.PlaneGeometry(width, width / 8),
      new THREE.MeshStandardMaterial({ map: texture(canvas), roughness: .6, metalness: .1 }), position)
  }

  // Pressure hull, segmented sidewall liners and the swept canopy coaming.
  box(hardware, [10.8, 1.85, 1.3], [0, -.68, -2.03], "graphite", .18)
  tube(hardware, [[-4.5, -.42, -.88], [-2.85, -.56, -.65], [0, -.55, -1.17], [2.85, -.56, -.65], [4.5, -.42, -.88]], .12, "ceramic")
  tube(hardware, [[-4.5, -.48, -.84], [-2.85, -.62, -.61], [0, -.61, -1.13], [2.85, -.62, -.61], [4.5, -.48, -.84]], .025, "light")
  box(hardware, [9.8, .18, 6.8], [0, -1.52, .3], "graphite", .05)
  for (const side of [-1, 1]) {
    box(hardware, [.24, 3.5, 7.3], [side * 5.03, .12, .15], "graphite", .1)
    for (let i = 0; i < 6; i++) {
      box(hardware, [.16, 2.0, .98], [side * 4.88, -.25, -2.7 + i * 1.13], "ceramic", .07)
      tube(hardware, [[side * 4.77, -.92, -2.8 + i * 1.13], [side * 4.77, .78, -2.8 + i * 1.13]], .028)
    }
    tube(hardware, [[side * 4.4, -.2, 3.1], [side * 4.55, .75, 1.6], [side * 4.62, 1.39, -.2], [side * 4.52, 1.58, -1.65]], .11, "graphite")
    tube(hardware, [[side * 4.3, -.2, 3.1], [side * 4.43, .75, 1.6], [side * 4.5, 1.39, -.2], [side * 4.4, 1.58, -1.65]], .019, "light")
    tube(hardware, [[side * 4.72, -.8, 2.5], [side * 4.72, .3, 1.5], [side * 4.65, .6, -.4]], .044, "copper")
    for (let i = 0; i < 11; i++) box(hardware, [.55, .026, .055], [side * 4.48, .42 + i * .056, -.1], "graphite", .006)
  }
  const lower = [[-5, 1.25, -.9], [-3.25, 1.92, -2.32], [0, 2.01, -2.95], [3.25, 1.92, -2.32], [5, 1.25, -.9]]
  const upper = [[-5, 3.6, -1.3], [-3.25, 4.78, -3.85], [0, 5.13, -4.65], [3.25, 4.78, -3.85], [5, 3.6, -1.3]]
  tube(hardware, lower, .14, "graphite"); tube(hardware, upper, .13, "ceramic")
  tube(hardware, upper.map(([x, y, z]) => [x, y - .07, z + .1]), .027, "titanium")
  tube(hardware, lower.map(([x, y, z]) => [x, y + .10, z]), .028, "copper")
  for (let i = 0; i < 4; i++) {
    const points = [...lower[i], ...lower[i + 1], ...upper[i + 1], ...upper[i]]
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3))
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2))
    geometry.setIndex([0, 1, 2, 0, 2, 3]); geometry.computeVertexNormals()
    add(hardware, geometry, "glass")
  }
  // Slender side mullions keep the central windshield uninterrupted.
  for (const i of [0, 1, 3, 4]) {
    tube(hardware, [lower[i], upper[i]], i === 1 || i === 3 ? .06 : .16, "graphite")
    tube(hardware, [lower[i].map((v, j) => j === 2 ? v + .04 : v), upper[i].map((v, j) => j === 2 ? v + .04 : v)], .025, "titanium")
  }
  for (const side of [-1, 1]) {
    tube(hardware, [[side * 3.25, 4.78, -3.85], [side * 3.7, 5.3, -.5], [side * 4.1, 4.9, 3.8]], .12, "ceramic")
    tube(hardware, [[side * 3.25, 4.70, -3.83], [side * 3.7, 5.2, -.5], [side * 4.1, 4.8, 3.8]], .022, "light")
    const hinge = cylinder(hardware, .2, .38, [side * 4.8, 1.67, -.94], "titanium")
    hinge.rotation.z = Math.PI / 2
  }

  const screens = [], hitTargets = [], stations = {}
  COCKPIT_STATIONS.forEach((station, index) => {
    const side = index - 1
    const panel = new THREE.Group()
    panel.position.set(side * 2.86, .94, side ? -1.31 : -1.78)
    panel.rotation.set(-.23, -side * .24, 0)
    hardware.add(panel)
    box(panel, [2.82, 2.36, .28], [0, .16, -.09], "ceramic", .11)
    box(panel, [2.64, 2.18, .12], [0, .16, .05], "graphite", .055)
    box(panel, [2.50, 1.76, .12], [0, .45, .14], "titanium", .045)
    box(panel, [2.44, 1.69, .10], [0, .45, .18], "rubber", .04)
    const screen = instrument(station, images)
    const monitor = new THREE.Mesh(new THREE.PlaneGeometry(2.23, 1.394),
      new THREE.MeshBasicMaterial({ map: screen.map, toneMapped: false }))
    panel.updateMatrixWorld(true)
    const display = new THREE.Group()
    display.position.copy(panel.position); display.quaternion.copy(panel.quaternion)
    root.add(display); monitor.position.set(0, .45, .244); display.add(monitor)
    monitor.userData.station = station.id; monitor.userData.screen = true; hitTargets.push(monitor); screens.push(screen)
    const hitMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
    const panelHit = new THREE.Mesh(new THREE.PlaneGeometry(2.82, 2.36), hitMaterial)
    panelHit.visible = false
    panelHit.position.set(0, .16, .12); panelHit.userData.station = station.id; display.add(panelHit); hitTargets.push(panelHit)
    stations[station.id] = { center: new THREE.Vector3(0, .45, .244).applyMatrix4(panel.matrixWorld),
      normal: new THREE.Vector3(0, 0, 1).applyQuaternion(panel.quaternion) }
    for (const x of [-1.32, 1.32]) for (const y of [-.93, 1.24]) bolt(panel, x, y, .09)
    for (const x of [-1.16, 1.16]) for (const y of [-.29, 1.18]) bolt(panel, x, y, .247)
    const buttonCanvas = document.createElement("canvas"); buttonCanvas.width = 1024; buttonCanvas.height = 160
    const buttonContext = buttonCanvas.getContext("2d")
    buttonContext.fillStyle = "#10191d"; buttonContext.fillRect(0, 0, 1024, 160)
    buttonContext.strokeStyle = station.color; buttonContext.lineWidth = 3; buttonContext.strokeRect(8, 8, 1008, 144)
    buttonContext.fillStyle = station.color; buttonContext.font = '500 48px "Outfit", sans-serif'
    buttonContext.textAlign = "center"; buttonContext.fillText(`View ${station.label} Components`, 512, 99, 944)
    const link = new THREE.Mesh(new THREE.PlaneGeometry(2.23, .35), new THREE.MeshBasicMaterial({ map: texture(buttonCanvas), toneMapped: false }))
    link.position.set(0, -.65, .25); link.userData.station = station.id; link.userData.link = true
    display.add(link); hitTargets.push(link)

  })

  // Center avionics spine and side-stick assemblies are modeled below the main dash.
  const bridge = new THREE.Group(); bridge.position.set(0, -.79, .55); bridge.rotation.x = -.88
  hardware.add(bridge)
  box(bridge, [1.30, 2.35, .25], [0, 0, 0], "ceramic", .10)
  box(bridge, [1.12, 2.13, .07], [0, 0, .15], "graphite", .03)
  label(bridge, "BA / PIONEER 01", [0, .87, .19], .95)
  const navCanvas = document.createElement("canvas"); navCanvas.width = 512; navCanvas.height = 512
  const nav = navCanvas.getContext("2d"); nav.fillStyle = "#07151b"; nav.fillRect(0, 0, 512, 512)
  nav.strokeStyle = "#4a9bab"; nav.lineWidth = 2
  for (const r of [55, 110, 170]) { nav.beginPath(); nav.arc(256, 245, r, 0, TAU); nav.stroke() }
  nav.beginPath(); nav.moveTo(40, 245); nav.lineTo(472, 245); nav.moveTo(256, 46); nav.lineTo(256, 450); nav.stroke()
  nav.fillStyle = "#dde9e8"; nav.font = "26px monospace"; nav.fillText("OUTER SYSTEM", 40, 40)
  nav.fillStyle = "#8de6cc"; nav.beginPath(); nav.moveTo(256, 180); nav.lineTo(280, 264); nav.lineTo(256, 249); nav.lineTo(232, 264); nav.fill()
  nav.font = "22px monospace"; nav.fillText("ATTITUDE STABLE", 146, 479)
  const navigationMap = texture(navCanvas)
  add(bridge, new THREE.PlaneGeometry(.92, .92), new THREE.MeshBasicMaterial({ map: navigationMap, toneMapped: false }), [0, .22, .194])
  for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) {
    box(bridge, [.18, .125, .07], [-.345 + col * .23, -.49 - row * .18, .198], row === 2 && col === 3 ? "amber" : "titanium", .012)
  }
  for (const side of [-1, 1]) {
    const console = new THREE.Group(); console.position.set(side * 3.6, -.45, 1.03)
    console.rotation.set(-.62, -side * .30, 0); hardware.add(console)
    box(console, [1.07, 2.50, .33], [0, 0, 0], "ceramic", .12)
    box(console, [.89, 2.22, .08], [0, 0, .21], "graphite", .055)
    label(console, side < 0 ? "THRUST / VECTOR" : "FLIGHT / CONTROL", [0, .86, .26], .78)
    for (let j = 0; j < 5; j++) {
      const r = .22 - j * .026
      const bellows = cylinder(console, r, .052, [0, -.05, .27 + j * .042], "rubber")
      bellows.rotation.x = Math.PI / 2
    }
    tube(console, [[0, -.05, .40], [0, .1, .68], [side * .045, .36, .8]], .052, "titanium")
    const grip = box(console, [.17, .40, .16], [side * .035, .36, .78], "graphite", .065)
    grip.rotation.x = -.25
    box(console, [.084, .055, .059], [side * .035, .50, .89], "red", .015)
    for (let i = 0; i < 3; i++) box(console, [.10, .016, .018], [side * .035, .24 + i * .07, .875], "rubber", .005)
    for (let i = 0; i < 4; i++) box(console, [.115, .20, .05], [-.29 + i * .19, -.72, .27], i === 0 ? "amber" : "titanium", .013)
    for (const x of [-.4, .4]) for (const y of [-1.01, 1.01]) bolt(console, x, y, .263)
    tube(hardware, [[side * 3.7, -.8, 1.1], [side * 3.9, -1.1, .5], [side * 3.7, -1, -.8]], .045, "copper")
  }
  const top = new THREE.Group(); top.position.set(0, 2.005, -2.39); top.rotation.x = -.16; hardware.add(top)
  box(top, [2.22, .23, .22], [0, 0, 0], "graphite", .04)
  label(top, "BERGQUIST / PIONEER 01", [0, 0, .115], 1.95, true)
  for (const side of [-1, 1]) {
    box(hardware, [1.1, .12, .22], [side * 1.7, 2.02, -2.33], "rubber", .03)
    for (let j = 0; j < 7; j++) box(hardware, [.055, .075, .024], [side * 1.7 - .36 + j * .12, 2.027, -2.207], "titanium", .007)
  }
  bakeHardware(hardware, shell)

  const stars = new THREE.BufferGeometry(), positions = [], colors = []
  let seed = 517
  const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296 }
  for (let i = 0; i < 1600; i++) {
    positions.push((random() - .5) * 190, (random() - .35) * 105, -45 - random() * 90)
    const shade = .35 + random() * .5
    colors.push(shade, shade * (.88 + random() * .12), shade * (.86 + random() * .14))
  }
  // Surround the exterior approach as well as the forward-facing windshield.
  for (let i = 0; i < 1600; i++) {
    const angle = random() * TAU, z = random() * 2 - 1, radius = 90 + random() * 50
    const ring = Math.sqrt(1 - z * z) * radius
    positions.push(Math.cos(angle) * ring, Math.sin(angle) * ring, z * radius)
    const shade = .3 + random() * .45
    colors.push(shade * .9, shade * .96, shade)
  }
  stars.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  stars.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3))
  const sky = new THREE.Group()
  sky.add(new THREE.Points(stars, new THREE.PointsMaterial({ size: .12, sizeAttenuation: true, vertexColors: true, toneMapped: false })))
  let lastScreen = -1
  screens.forEach(screen => screen.draw(0, systems))
  return {
    root, sky, stations, hitTargets, ready: assetsReady,
    setNavigation(label) { nav.fillStyle = "#07151b"; nav.fillRect(0, 0, 512, 52); nav.fillStyle = "#dde9e8"; nav.font = "26px monospace"; nav.fillText(label.toUpperCase(), 40, 40); navigationMap.needsUpdate = true },
    setSystems(value, time) { systems = value; screens.forEach(screen => screen.draw(time, systems)); lastScreen = -1 },
    update(time) {
      sky.rotation.y = Math.sin(time * .035) * .055
      sky.rotation.z = Math.sin(time * .024) * .012
      sky.position.x = Math.sin(time * .055) * .7
      const screenFrame = Math.floor(time * 8)
      if (screenFrame !== lastScreen) { screens.forEach(screen => screen.draw(time, systems)); lastScreen = screenFrame }
    },
  }
}
