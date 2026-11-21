import * as THREE from "three"
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js"

const TAU = Math.PI * 2
const Y = new THREE.Vector3(0, 1, 0)
const smooth = (a, b, value) => THREE.MathUtils.smoothstep(value, a, b)

function workshop(accent) {
  const root = new THREE.Group()
  const materials = {
    ceramic: new THREE.MeshStandardMaterial({ color: 0xe7e8e2, metalness: .24, roughness: .35 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x172029, metalness: .7, roughness: .42 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x99a7ae, metalness: .88, roughness: .29 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xc19758, metalness: .82, roughness: .3 }),
    accent: new THREE.MeshStandardMaterial({ color: accent, metalness: .4, roughness: .32 }),
    light: new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 2.4, roughness: .3 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x03080d, metalness: .25, roughness: .15, clearcoat: 1, envMapIntensity: .45 }),
  }
  const add = (parent, geometry, material, position = [0, 0, 0]) => {
    const mesh = new THREE.Mesh(geometry, typeof material === "string" ? materials[material] : material)
    mesh.position.set(...position)
    parent.add(mesh)
    return mesh
  }
  const box = (parent, size, position, material = "ceramic", radius = .045) =>
    add(parent, new RoundedBoxGeometry(...size, 2, Math.min(radius, ...size.map(n => n / 3))), material, position)
  const sphere = (parent, radius, position, material = "metal") =>
    add(parent, new THREE.SphereGeometry(radius, 24, 16), material, position)
  const cylinder = (parent, radius, length, position, material = "metal", topRadius = radius) =>
    add(parent, new THREE.CylinderGeometry(topRadius, radius, length, 40), material, position)
  const ring = (parent, radius, tube, position, material = "metal") =>
    add(parent, new THREE.TorusGeometry(radius, tube, 8, 64), material, position)
  const bar = (parent, start, end, radius = .026, material = "metal") => {
    const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end)
    const mesh = cylinder(parent, radius, a.distanceTo(b), a.clone().add(b).multiplyScalar(.5).toArray(), material)
    mesh.quaternion.setFromUnitVectors(Y, b.sub(a).normalize())
    return mesh
  }
  const cable = (parent, points, radius = .016, material = "gold") => {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)))
    add(parent, new THREE.TubeGeometry(curve, 36, radius, 6, false), material)
    return curve
  }
  const bolts = (parent, radius, depth, count = 12) => {
    const instances = new THREE.InstancedMesh(new THREE.CylinderGeometry(.022, .022, .026, 6), materials.metal, count)
    const matrix = new THREE.Object3D()
    matrix.rotation.x = Math.PI / 2
    for (let i = 0; i < count; i++) {
      matrix.position.set(Math.cos(i / count * TAU) * radius, Math.sin(i / count * TAU) * radius, depth)
      matrix.updateMatrix()
      instances.setMatrixAt(i, matrix.matrix)
    }
    parent.add(instances)
    return instances
  }
  const label = (parent, title, subtitle, position, width = .64) => {
    const canvas = document.createElement("canvas")
    canvas.width = 512; canvas.height = 192
    const ctx = canvas.getContext("2d")
    ctx.fillStyle = "#dce1dc"; ctx.fillRect(0, 0, 512, 192)
    ctx.fillStyle = "#18252d"; ctx.font = "bold 62px monospace"; ctx.fillText(title, 24, 80)
    ctx.font = "24px monospace"; ctx.fillText(subtitle, 26, 124)
    for (let i = 0; i < 37; i++) ctx.fillRect(26 + i * 8, 149, i % 3 === 0 ? 5 : 2, 20)
    const map = new THREE.CanvasTexture(canvas)
    map.colorSpace = THREE.SRGBColorSpace
    const material = new THREE.MeshStandardMaterial({ map, roughness: .6, metalness: .1 })
    return add(parent, new THREE.PlaneGeometry(width, width * 192 / 512), material, position)
  }
  return { root, materials, add, box, sphere, cylinder, ring, bar, cable, bolts, label }
}

function dataRelay() {
  const w = workshop(0x58c9ed)
  const { root, materials, add, box, sphere, cylinder, ring, bar, cable, bolts, label } = w
  const satellite = new THREE.Group()
  root.add(satellite)
  satellite.rotation.set(.02, -.15, -.13)
  cylinder(satellite, .47, 1.48, [0, -.12, 0], "dark")
  for (const y of [-.8, .62]) {
    cylinder(satellite, .57, .12, [0, y, 0], "ceramic")
    const collar = ring(satellite, .53, .035, [0, y, 0]); collar.rotation.x = Math.PI / 2
  }
  for (let i = 0; i < 6; i++) {
    const angle = i / 6 * TAU
    const panel = box(satellite, [.4, 1.17, .095], [Math.sin(angle) * .46, -.1, Math.cos(angle) * .46])
    panel.rotation.y = angle
    bar(satellite, [Math.sin(angle + .51) * .5, -.75, Math.cos(angle + .51) * .5],
      [Math.sin(angle + .51) * .5, .6, Math.cos(angle + .51) * .5], .024)
  }
  box(satellite, [.3, .62, .09], [0, -.15, .54], "dark")
  const indicators = []
  for (let i = 0; i < 7; i++) {
    const material = materials.light.clone()
    indicators.push(material)
    box(satellite, [.19, .028, .016], [0, -.39 + i * .078, .593], material, .004)
  }
  label(satellite, "D-01", "BERGQUIST / RELAY", [0, .4, .515], .36)
  cylinder(satellite, .24, .24, [0, -.99, 0], "metal", .16)
  cylinder(satellite, .19, .02, [0, -1.12, 0], "dark")
  const nozzle = ring(satellite, .19, .023, [0, -1.14, 0], "accent"); nozzle.rotation.x = Math.PI / 2

  const wings = []
  const cellGeometry = new RoundedBoxGeometry(.18, .147, .018, 1, .008)
  const cellMaterial = new THREE.MeshStandardMaterial({ color: 0x163852, metalness: .76, roughness: .24 })
  for (const side of [-1, 1]) {
    const wing = new THREE.Group()
    wing.position.set(side * .55, -.03, -.08)
    satellite.add(wing); wings.push(wing)
    bar(wing, [0, 0, 0], [side * .6, 0, 0], .065)
    box(wing, [.94, 1.43, .08], [side * .94, 0, 0], "metal", .025)
    box(wing, [.88, 1.36, .025], [side * .94, 0, .045], "gold", .01)
    const cells = new THREE.InstancedMesh(cellGeometry, cellMaterial, 32)
    const dummy = new THREE.Object3D()
    for (let col = 0; col < 4; col++) for (let row = 0; row < 8; row++) {
      dummy.position.set(side * .94 + (col - 1.5) * .207, (row - 3.5) * .164, .07)
      dummy.updateMatrix(); cells.setMatrixAt(col * 8 + row, dummy.matrix)
    }
    wing.add(cells)
    for (let row = 0; row < 8; row++) box(wing, [.82, .006, .012], [side * .94, (row - 3.5) * .164, .084], "metal", .002)
    bar(wing, [side * .15, -.07, -.03], [side * .5, -.48, -.03], .022)
    cylinder(satellite, .13, .2, [side * .52, -.03, -.08], "gold").rotation.z = Math.PI / 2
  }

  cylinder(satellite, .15, .25, [0, .77, 0])
  const dish = new THREE.Group()
  dish.position.set(0, .95, 0); dish.rotation.x = .62; satellite.add(dish)
  const profile = []
  for (let i = 0; i <= 22; i++) { const r = .035 + i / 22 * .75; profile.push(new THREE.Vector2(r, r * r * .54)) }
  const dishMaterial = materials.ceramic.clone(); dishMaterial.side = THREE.DoubleSide
  add(dish, new THREE.LatheGeometry(profile, 64), dishMaterial)
  ring(dish, .79, .024, [0, .334, 0]).rotation.x = Math.PI / 2
  for (let i = 0; i < 8; i++) {
    const angle = i / 8 * TAU
    const points = profile.filter((_, j) => j % 2 === 0).map(p => [Math.cos(angle) * p.x, p.y + .008, Math.sin(angle) * p.x])
    cable(dish, points, .007, "metal")
  }
  for (let i = 0; i < 3; i++) {
    const angle = i / 3 * TAU
    bar(dish, [Math.cos(angle) * .71, .28, Math.sin(angle) * .71], [0, .69, 0], .016)
  }
  cylinder(dish, .095, .18, [0, .67, 0], "gold")
  sphere(dish, .065, [0, .79, 0], "light")
  bar(satellite, [.34, .53, -.25], [.44, 1.56, -.26], .018)
  sphere(satellite, .045, [.44, 1.56, -.26], "accent")

  const packets = []
  for (const side of [-1, 1]) {
    const path = cable(satellite, [[side * 1.88, -.7, .13], [side * 1.6, -1.12, .35],
      [side * .63, -1.22, .55], [side * .2, -.66, .58]], .009, "dark")
    for (let i = 0; i < 3; i++) packets.push({ mesh: sphere(satellite, .031, [0, 0, 0], "light"), path, offset: i / 3 })
  }
  bolts(satellite, .22, .55, 6)
  return {
    root, radius: 2.36, view: [3.2, 2.1, 7.8],
    update(time) {
      satellite.position.y = Math.sin(time * .55) * .035
      dish.rotation.y = Math.sin(time * .35) * .3
      wings.forEach((wing, i) => { wing.rotation.y = (i ? 1 : -1) * (.12 + Math.sin(time * .22) * .09) })
      packets.forEach(({ mesh, path, offset }) => mesh.position.copy(path.getPoint((time * .2 + offset) % 1)))
      indicators.forEach((material, i) => { material.emissiveIntensity = .45 + 2 * Math.pow(Math.max(0, Math.sin(time * 3 - i * .75)), 4) })
    },
  }
}

function financeVault() {
  const w = workshop(0x83dcb9)
  const { root, materials, add, box, sphere, cylinder, ring, bar, cable, bolts, label } = w
  const vault = new THREE.Group(); root.add(vault)
  const drum = cylinder(vault, .87, .8, [0, .12, -.13], "dark"); drum.rotation.x = Math.PI / 2
  ring(vault, .85, .075, [0, .12, .29])
  ring(vault, .88, .06, [0, .12, -.48], "gold")
  for (let i = 0; i < 10; i++) {
    const angle = i / 10 * TAU
    const armor = box(vault, [.42, .22, .67], [Math.sin(angle) * .85, .12 + Math.cos(angle) * .85, -.12])
    armor.rotation.z = -angle
    const rail = box(vault, [.035, .024, .5], [Math.sin(angle) * .98, .12 + Math.cos(angle) * .98, -.13], "metal")
    rail.rotation.z = -angle
  }
  const interior = cylinder(vault, .68, .06, [0, .12, .32], "glass"); interior.rotation.x = Math.PI / 2
  ring(vault, .67, .023, [0, .12, .37], "light")
  const rotor = new THREE.Group(); rotor.position.y = .12; vault.add(rotor)
  ring(rotor, .74, .068, [0, 0, .41], "gold")
  bolts(rotor, .745, .48, 16)
  for (let i = 0; i < 8; i++) {
    const angle = i / 8 * TAU
    const catchPlate = box(rotor, [.15, .085, .07], [Math.sin(angle) * .74, Math.cos(angle) * .74, .47], "dark", .012)
    catchPlate.rotation.z = -angle
  }
  const shutters = []
  for (let i = 0; i < 3; i++) {
    const angle = i / 3 * TAU
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    for (let j = 0; j <= 18; j++) {
      const a = -.02 + j / 18 * (TAU / 3 - .04)
      shape.lineTo(Math.cos(a) * .625, Math.sin(a) * .625)
    }
    shape.lineTo(0, 0)
    const panel = add(vault, new THREE.ExtrudeGeometry(shape, { depth: .055, bevelEnabled: true, bevelThickness: .013, bevelSize: .014, bevelSegments: 2, steps: 1 }), "ceramic", [0, .12, .39])
    panel.rotation.z = angle
    const brace = box(panel, [.2, .08, .025], [.32 * Math.cos(TAU / 6), .32 * Math.sin(TAU / 6), .073], "metal", .016)
    brace.rotation.z = TAU / 6
    for (let j = 0; j < 3; j++) {
      const a = .36 + j * .21
      const notch = box(panel, [.09, .018, .013], [Math.cos(a) * .49, Math.sin(a) * .49, .072], "dark", .004)
      notch.rotation.z = a
    }
    shutters.push({ panel, angle: angle + TAU / 6 })
  }
  for (const side of [-1, 1]) {
    box(vault, [.3, .33, .48], [side * .77, -.8, -.16], "dark")
    box(vault, [.56, .09, .7], [side * .77, -.99, -.1], "metal")
    cable(vault, [[side * .64, -.58, -.5], [side * 1.01, -.61, -.53], [side * 1.11, .44, -.5], [side * .8, .52, -.4]], .045)
    const dock = new THREE.Group(); dock.position.set(side * 1.57, -.51, .5); vault.add(dock)
    box(dock, [.6, .13, .72], [0, -.18, 0], "dark")
    box(dock, [.64, .04, .75], [0, -.26, 0], "metal")
    for (const x of [-.25, .25]) box(dock, [.06, .32, .54], [x, 0, 0], "ceramic")
    box(dock, [.32, .022, .025], [0, -.096, .34], "light", .004)
    bar(vault, [side * .68, -.87, .1], [side * 1.57, -.75, .5], .058)
  }
  box(vault, [.51, .19, .045], [0, .93, .3], "dark", .024)
  label(vault, "F-02", "BERGQUIST / CLEARING", [0, .93, .327], .45)
  box(vault, [.5, .12, .07], [0, -.8, .41], "dark")
  const checks = []
  for (let i = 0; i < 4; i++) {
    const material = materials.light.clone(); checks.push(material)
    box(vault, [.07, .033, .018], [(i - 1.5) * .105, -.8, .46], material, .008)
  }
  const path = cable(vault, [[-1.57, -.51, .54], [-.96, -.29, .91], [0, .12, .84], [.96, -.29, .91], [1.57, -.51, .54]], .015, "metal")
  const cargo = new THREE.Group(); vault.add(cargo)
  cylinder(cargo, .225, .14, [0, 0, 0], "gold").rotation.x = Math.PI / 2
  ring(cargo, .19, .012, [0, 0, .084], "metal")
  const stamp = cylinder(cargo, .16, .008, [0, 0, .079], "gold"); stamp.rotation.x = Math.PI / 2
  for (const x of [-.045, .045]) box(cargo, [.022, .18, .015], [x, 0, .095], "dark", .003)
  const scanner = box(vault, [.015, 1.07, .02], [-.55, .12, .63], "light", .004)
  return {
    root, radius: 2.34, view: [2.7, 1.7, 8.2],
    update(time) {
      // One cycle: dock, unlock, verify in the chamber, settle, then re-lock.
      const phase = ((time + 5.3) % 12) / 12
      const open = smooth(.08, .23, phase) * (1 - smooth(.73, .89, phase))
      const travel = phase < .4 ? .5 * smooth(.17, .37, phase) : .5 + .5 * smooth(.59, .8, phase)
      cargo.position.copy(path.getPoint(travel))
      cargo.rotation.y = Math.sin(smooth(.38, .58, phase) * Math.PI) * TAU
      const visibility = smooth(0, .05, phase) * (1 - smooth(.92, 1, phase))
      cargo.scale.setScalar(Math.max(.001, visibility))
      rotor.rotation.z = open * Math.PI / 5
      shutters.forEach(({ panel, angle }) => {
        panel.position.set(Math.cos(angle) * open * .27, .12 + Math.sin(angle) * open * .27, .39)
      })
      scanner.visible = phase > .38 && phase < .59
      scanner.position.x = -.52 + smooth(.38, .59, phase) * 1.04
      checks.forEach((material, i) => { material.emissiveIntensity = phase > .41 + i * .045 && phase < .88 ? 2.4 : .15 })
      vault.position.y = Math.sin(time * .4) * .025
    },
  }
}

function surveyDrone() {
  const w = workshop(0xb1a0ff)
  const { root, materials, add, box, sphere, cylinder, ring, bar, cable, bolts, label } = w
  const robot = new THREE.Group(); root.add(robot)
  const hull = sphere(robot, .69, [0, .43, -.05], "ceramic"); hull.scale.set(1, .91, .79)
  const back = sphere(robot, .61, [0, .43, -.25], "dark"); back.scale.set(1, .9, .75)
  const bezel = ring(robot, .42, .075, [0, .46, .39], "metal")
  const visor = sphere(robot, .414, [0, .46, .4], "glass"); visor.scale.z = .24
  const eye = new THREE.Group(); eye.position.set(0, .47, .51); robot.add(eye)
  ring(eye, .18, .021, [0, 0, 0], "light")
  cylinder(eye, .145, .018, [0, 0, .007], "dark").rotation.x = Math.PI / 2
  ring(eye, .095, .015, [0, 0, .019], "metal")
  sphere(eye, .05, [0, 0, .024], "glass").scale.z = .35
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * TAU
    const blade = box(eye, [.06, .018, .006], [Math.cos(a) * .126, Math.sin(a) * .126, .02], "accent", .003)
    blade.rotation.z = a + .6
  }
  bolts(robot, .43, .435, 12).position.y = .46
  label(robot, "A-03", "BERGQUIST / AUTONOMY", [0, -.025, .41], .43)
  for (const side of [-1, 1]) {
    box(robot, [.2, .43, .31], [side * .62, .5, -.04], "dark")
    box(robot, [.075, .34, .32], [side * .75, .5, -.04], "ceramic")
    for (let i = 0; i < 4; i++) box(robot, [.012, .032, .26], [side * .793, .4 + i * .072, -.03], "gold", .004)
    bar(robot, [side * .32, .91, -.15], [side * .46, 1.28, -.2], .025)
    sphere(robot, .045, [side * .46, 1.29, -.2], "light")
    const thruster = cylinder(robot, .17, .27, [side * .45, .22, -.54], "metal", .12)
    thruster.rotation.x = Math.PI / 2
    ring(robot, .13, .03, [side * .45, .22, -.7], "accent")
    const fin = box(robot, [.14, .5, .58], [side * .59, .74, -.59], "ceramic")
    fin.rotation.z = side * -.35
    box(robot, [.08, .23, .43], [side * .62, .73, -.67], "accent")
  }

  const target = new THREE.Group(); target.position.set(0, -.98, .57); root.add(target)
  box(target, [.61, .09, .61], [0, 0, 0], "dark")
  box(target, [.39, .05, .39], [0, .065, 0], "metal")
  box(target, [.29, .075, .29], [0, .12, 0], "accent")
  for (const side of [-1, 1]) for (let i = 0; i < 6; i++) {
    box(target, [.025, .035, .085], [(i - 2.5) * .082, 0, side * .34], "gold", .004)
    box(target, [.085, .035, .025], [side * .34, 0, (i - 2.5) * .082], "gold", .004)
  }
  const neurons = []
  const nodePositions = [[-.21, .34, -.16], [.19, .38, -.14], [0, .61, .04], [-.19, .27, .21], [.21, .3, .21]]
  nodePositions.forEach((position, i) => {
    const material = materials.light.clone(); neurons.push(material)
    sphere(target, .045, position, material)
    for (let j = i + 1; j < nodePositions.length; j++) bar(target, position, nodePositions[j], .009, "metal")
    bar(target, [position[0], .16, position[2]], position, .009, "gold")
  })

  const arms = []
  for (const side of [-1, 1]) {
    const shoulder = [side * .57, .08, .04]
    sphere(robot, .15, shoulder, "dark")
    const upper = cylinder(robot, .081, 1, [0, 0, 0], "ceramic")
    const lower = cylinder(robot, .062, 1, [0, 0, 0], "metal")
    const elbow = sphere(robot, .13, [0, 0, 0], "gold")
    const cuff = sphere(robot, .096, [0, 0, 0], "dark")
    const tool = new THREE.Group(); robot.add(tool)
    cylinder(tool, .1, .18, [0, -.03, 0], "ceramic")
    ring(tool, .085, .016, [0, -.12, 0], "accent").rotation.x = Math.PI / 2
    const fingers = []
    for (const gripSide of [-1, 1]) {
      const finger = new THREE.Group(); tool.add(finger); fingers.push(finger)
      box(finger, [.035, .19, .065], [0, -.15, 0], "dark", .012)
      box(finger, [.08, .035, .07], [-gripSide * .018, -.23, 0], "metal", .01)
    }
    arms.push({ side, shoulder: new THREE.Vector3(...shoulder), upper, lower, elbow, cuff, tool, fingers })
  }
  const start = new THREE.Vector3(), end = new THREE.Vector3(), direction = new THREE.Vector3()
  const placeLink = (mesh, a, b) => {
    direction.copy(b).sub(a)
    mesh.position.copy(a).add(b).multiplyScalar(.5)
    mesh.scale.y = direction.length()
    mesh.quaternion.setFromUnitVectors(Y, direction.normalize())
  }
  return {
    root, radius: 1.79, view: [2.4, 1.6, 8.4],
    update(time) {
      robot.position.y = Math.sin(time * .8) * .045
      eye.position.x = Math.sin(time * .6) * .045
      eye.position.y = .445 + Math.cos(time * .6) * .016
      eye.rotation.z = Math.sin(time * .55) * .25
      bezel.rotation.z = Math.sin(time * .3) * .06
      target.rotation.y = time * .23
      target.position.y = -.98 + Math.sin(time * .8 + .5) * .025
      arms.forEach(({ side, shoulder, upper, lower, elbow, cuff, tool, fingers }, i) => {
        const reach = Math.sin(time * .85 + i * 2.1)
        start.set(side * (1.0 + reach * .06), -.25, .18 + reach * .09)
        end.set(side * (.38 + reach * .09), -.57 + Math.cos(time * .85 + i * 2.1) * .09, .66)
        placeLink(upper, shoulder, start); placeLink(lower, start, end)
        elbow.position.copy(start); cuff.position.copy(end); tool.position.copy(end)
        tool.rotation.set(-.22, side * -.35, side * -.22)
        fingers.forEach((finger, j) => { finger.position.x = (j ? 1 : -1) * (.065 + (reach + 1) * .018); finger.rotation.z = (j ? 1 : -1) * reach * .1 })
      })
      neurons.forEach((material, i) => { material.emissiveIntensity = .45 + 2.1 * Math.pow(Math.max(0, Math.sin(time * 2.6 - i * .8)), 3) })
    },
  }
}

export function createCategoryModel(category) {
  const builders = { data: dataRelay, finance: financeVault, ai: surveyDrone }
  if (!builders[category]) throw new Error(`Unknown component category: ${category}`)
  const model = builders[category]()
  model.root.traverse(object => { if (object.isMesh) { object.castShadow = true; object.receiveShadow = true } })
  model.update(0)
  return model
}
