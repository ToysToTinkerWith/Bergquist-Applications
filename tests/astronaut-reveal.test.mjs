import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { astronautRevealAt, createAstronautReveal } from '../components/space/astronautReveal.js'

test('Both entrances grow and fade continuously, then stay at full size', () => {
  for (const [start, duration] of [[3.6, 3.5], [7.2, 2.4]]) {
    assert.deepEqual(astronautRevealAt(0, start, duration), { opacity: 0, scale: .52 })
    let previous = astronautRevealAt(start, start, duration)
    for (let time = start; time <= start + duration; time += .01) {
      const state = astronautRevealAt(time, start, duration)
      assert.ok(state.opacity >= previous.opacity && state.opacity <= 1)
      assert.ok(state.scale >= previous.scale && state.scale <= 1)
      assert.ok(state.opacity - previous.opacity < .01)
      previous = state
    }
    assert.deepEqual(astronautRevealAt(100, start, duration), { opacity: 1, scale: 1 })
  }
})

test('Fading preserves shared material opacity and restores original depth and shadow settings', () => {
  const root = new THREE.Group()
  const suit = new THREE.MeshStandardMaterial()
  const glass = new THREE.MeshStandardMaterial({ transparent: true, opacity: .4, depthWrite: false })
  const body = new THREE.Mesh(new THREE.BoxGeometry(), suit)
  const sleeve = new THREE.Mesh(new THREE.BoxGeometry(), suit)
  const visor = new THREE.Mesh(new THREE.BoxGeometry(), glass)
  body.castShadow = sleeve.castShadow = true
  root.add(body, sleeve, visor)
  const reveal = createAstronautReveal(root)
  reveal(.5)
  assert.equal(suit.opacity, .5)
  assert.equal(glass.opacity, .2)
  assert.equal(suit.transparent, true)
  assert.equal(suit.depthWrite, false)
  assert.equal(body.castShadow, false)
  reveal(1)
  assert.equal(suit.opacity, 1)
  assert.equal(suit.transparent, false)
  assert.equal(suit.depthWrite, true)
  assert.equal(glass.opacity, .4)
  assert.equal(glass.transparent, true)
  assert.equal(glass.depthWrite, false)
  assert.equal(body.castShadow, true)
  assert.equal(visor.castShadow, false)
  reveal(0)
  assert.equal(suit.opacity, 0)
  assert.equal(glass.opacity, 0)
  root.traverse(object => object.geometry?.dispose())
  suit.dispose(); glass.dispose()
})
