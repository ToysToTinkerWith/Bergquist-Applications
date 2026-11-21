import * as THREE from "three"

// Nozzle exits in the exported ships' Y-up coordinates, from the Blender definitions.
export function createCruiseExhaust(ship, crewId) {
  const vertical = crewId === "surveyor"
  const nozzles = vertical
    ? [-1, 1].flatMap(side => [-1.38, 1.96].map(z => [side * 2.83, .21, -z]))
    : [-1, 1].map(side => crewId === "salvager" ? [side * 2.15, .78, -3.78] : [side * 2.05, .53, -3.98])
  const root = new THREE.Group()
  root.name = "Cruise engine exhaust"
  ship.getObjectByName("ShipRoot").add(root)
  const color = new THREE.Color(crewId === "salvager" ? 0xffa14c : vertical ? 0x45ead7 : 0x48baff)
  const profile = Array.from({ length: 17 }, (_, i) => {
    const t = i / 16
    return new THREE.Vector2(.48 * Math.pow(1 - t, .65) * (1 + Math.sin(t * Math.PI) * .16), t * 2.6)
  })
  const geometry = new THREE.LatheGeometry(profile, 24)
  const material = new THREE.ShaderMaterial({
    uniforms: { tint: { value: color }, time: { value: 0 }, thrust: { value: 0 } },
    vertexShader: `varying vec2 flameUv; varying vec3 viewNormal; varying vec3 viewDirection;
      void main() {
        flameUv = uv;
        vec4 p = modelViewMatrix * vec4(position, 1.0);
        viewNormal = normalize(normalMatrix * normal); viewDirection = -p.xyz;
        gl_Position = projectionMatrix * p;
      }`,
    fragmentShader: `uniform vec3 tint; uniform float time; uniform float thrust;
      varying vec2 flameUv; varying vec3 viewNormal; varying vec3 viewDirection;
      void main() {
        float edge = pow(abs(dot(normalize(viewNormal), normalize(viewDirection))), .8);
        float fade = 1.0 - smoothstep(.12, 1.0, flameUv.y);
        float ripple = .91 + .09 * sin(flameUv.y * 42.0 - time * 18.0);
        vec3 color = mix(vec3(.88, .96, 1.0), tint, smoothstep(0.0, .65, flameUv.y));
        gl_FragColor = vec4(color, edge * fade * ripple * thrust * .72);
        #include <colorspace_fragment>
      }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    side: THREE.DoubleSide, toneMapped: false,
  })
  const direction = new THREE.Vector3(0, vertical ? -1 : 0, vertical ? 0 : -1)
  const anchors = nozzles.map(position => {
    const anchor = new THREE.Group()
    anchor.position.fromArray(position)
    anchor.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)
    const outer = new THREE.Mesh(geometry, material)
    const core = new THREE.Mesh(geometry, material)
    core.scale.set(.48, .72, .48)
    anchor.add(outer, core); root.add(anchor)
    return anchor
  })
  let clock = 0
  return {
    root,
    update(delta, thrust) {
      clock += delta
      material.uniforms.time.value = clock
      material.uniforms.thrust.value = THREE.MathUtils.clamp(thrust, 0, 1)
      root.visible = thrust > .001
      anchors.forEach((anchor, index) => {
        const pulse = 1 + .045 * Math.sin(clock * 19 + index * 2.1) + .025 * Math.sin(clock * 31 + index)
        anchor.scale.set(1, (vertical ? .7 : 1) * (.35 + .65 * thrust) * pulse, 1)
      })
    },
  }
}
