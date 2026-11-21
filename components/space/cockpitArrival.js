import * as THREE from "three"
import { SHIP_ROOT } from "./flightCrews"
import { disposeModel, loadCrewModel, warmScene } from "./crewAssets"
import { createSpacecraftMotion } from "./spacecraftMotion"

export const ARRIVAL_DURATION = 6
const ease = value => THREE.MathUtils.smootherstep(value, 0, 1)

// Approach from the bow, arc over the port quarter, then descend through the canopy.
export function createArrivalPath(crew, aspect) {
  const anchor = new THREE.Vector3(0, 2.85, aspect < .9 ? 3.45 : 4.1)
  const fit = Math.max(1, .95 / aspect)
  const points = [
    [-14 * fit, 9 * fit, -18 * fit], [-18 * fit, 8, -1],
    [-10, 6, 13], [-2.5, 3.9, 8], [0, 1.5, 2.4], [0, 0, 0],
  ].map(point => new THREE.Vector3(...point).add(anchor))
  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal")
  const shipPosition = anchor.clone().sub(new THREE.Vector3(...crew.cockpit).multiplyScalar(1.7).applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI))
  return {
    anchor, shipPosition,
    sample(seconds) {
      const t = THREE.MathUtils.clamp(seconds / ARRIVAL_DURATION, 0, 1)
      const progress = ease(t)
      const target = anchor.clone().add(new THREE.Vector3(0, -.45, THREE.MathUtils.lerp(1.5, -5, progress)))
      // Finish the reveal outside the canopy, before the miniature ship interior can enter view.
      return { position: curve.getPoint(progress), target, blend: ease((t - .52) / .13),
        settle: ease((t - .52) / .48), progress: t }
    },
  }
}

export async function createCockpitArrival({ renderer, scene, interior, camera, crew, signal }) {
  let gltf
  try {
    gltf = await loadCrewModel(SHIP_ROOT + crew.missionSpacecraft, signal)
    signal.throwIfAborted()
    createSpacecraftMotion(gltf).pose(0, 0)
    gltf.scene.traverse(object => {
      if (object.isMesh) { object.frustumCulled = false; object.castShadow = object.receiveShadow = true }
      for (const material of (Array.isArray(object.material) ? object.material : [object.material]).filter(Boolean)) {
        if (/Black canopy/.test(material.name)) material.envMapIntensity = .12
      }
    })
  } catch (error) { if (gltf) disposeModel(gltf.scene); throw error }

  const ship = new THREE.Group(); ship.add(gltf.scene); ship.scale.setScalar(1.7); ship.rotation.y = Math.PI
  scene.add(ship)
  const outside = camera.clone(), inside = camera.clone()
  let path, clock = 0, active = false, lastLayer = null
  const targets = [new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType }), new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType })]
  const composite = new THREE.Scene(), compositeCamera = new THREE.Camera()
  const material = new THREE.ShaderMaterial({
    uniforms: { exterior: { value: targets[0].texture }, interior: { value: targets[1].texture }, blend: { value: 0 } },
    vertexShader: "varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }",
    fragmentShader: `uniform sampler2D exterior; uniform sampler2D interior; uniform float blend; varying vec2 vUv;
      void main(){ gl_FragColor=mix(texture2D(exterior,vUv),texture2D(interior,vUv),blend);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    depthTest: false, depthWrite: false,
  })
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material); quad.frustumCulled = false; composite.add(quad)
  const layer = exterior => {
    ship.visible = exterior; interior.visible = !exterior
    if (lastLayer !== exterior) { renderer.shadowMap.needsUpdate = true; lastLayer = exterior }
  }
  const pose = () => {
    const sample = path.sample(clock)
    outside.position.copy(sample.position); outside.lookAt(sample.target); outside.fov = 53; outside.aspect = camera.aspect; outside.updateProjectionMatrix()
    inside.copy(camera); inside.position.z += 1.2 * (1 - sample.settle)
    inside.fov += 3 * (1 - sample.settle); inside.updateProjectionMatrix()
    material.uniforms.blend.value = sample.blend
    return sample
  }
  const resize = () => {
    path = createArrivalPath(crew, camera.aspect); ship.position.copy(path.shipPosition)
    const size = renderer.getDrawingBufferSize(new THREE.Vector2())
    targets.forEach(target => target.setSize(size.x, size.y)); pose()
  }
  const skip = () => { active = false; clock = ARRIVAL_DURATION; layer(false) }
  const dispose = () => {
    ship.removeFromParent(); disposeModel(ship)
    targets.forEach(target => target.dispose()); quad.geometry.dispose(); material.dispose()
  }
  try {
    resize(); layer(true)
    await warmScene(renderer, scene, outside)
    signal.throwIfAborted()
    layer(false)
    await warmScene(renderer, scene, camera)
    await renderer.compileAsync(composite, compositeCamera)
    signal.throwIfAborted()
  } catch (error) { dispose(); throw error }
  return {
    get active() { return active },
    get progress() { return clock / ARRIVAL_DURATION },
    get blend() { return material.uniforms.blend.value },
    get camera() { return material.uniforms.blend.value < .5 ? outside : inside },
    start() { clock = 0; active = true; resize(); layer(true) },
    skip, resize, dispose,
    update(dt) { if (active) { clock = Math.min(ARRIVAL_DURATION, clock + dt); pose(); if (clock === ARRIVAL_DURATION) skip() } },
    render() {
      if (!active) { layer(false); renderer.render(scene, camera); return }
      const { blend } = pose()
      if (blend === 1) { layer(false); renderer.render(scene, inside); return }
      layer(true)
      if (blend === 0) { renderer.render(scene, outside); return }
      // Dissolve across the canopy into the full-scale cabin without a camera jump or a dark frame.
      const previous = renderer.getRenderTarget()
      try {
        renderer.setRenderTarget(targets[0]); renderer.render(scene, outside)
        layer(false); renderer.setRenderTarget(targets[1]); renderer.render(scene, inside)
        renderer.setRenderTarget(previous); renderer.render(composite, compositeCamera)
      } finally { renderer.setRenderTarget(previous) }
    },
  }
}
