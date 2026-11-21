const { admin, db } = require("./firebaseAdmin")

const SESSION_ID = "global"
const SESSION_REF = db.collection("spaceGameSessions").doc(SESSION_ID)
const PLAYERS_REF = SESSION_REF.collection("players")
const MONSTER_REF = SESSION_REF.collection("monsters").doc("current")
const ACTIONS_REF = SESSION_REF.collection("actions")

const PLAYER_MAX_HEALTH = 100
const PLAYER_ENERGY_PER_TURN = 3
const PLAYER_HAND_SIZE = 5

const MONSTER_MAX_HEALTH = 260
const MONSTER_ENERGY_PER_TURN = 3
const MONSTER_HAND_SIZE = 5

const PLAYER_CARD_LIBRARY = {
  laser_burst: {
    key: "laser_burst",
    name: "Laser Burst",
    type: "damage",
    cost: 1,
    damage: 18,
    shield: 0,
    description: "Deal 18 damage to the enemy monster.",
  },
  ion_shield: {
    key: "ion_shield",
    name: "Ion Shield",
    type: "shield",
    cost: 1,
    damage: 0,
    shield: 16,
    description: "Gain 16 shield.",
  },
}

const MONSTER_CARD_LIBRARY = {
  claw_strike: {
    key: "claw_strike",
    name: "Claw Strike",
    type: "damage",
    cost: 1,
    damage: 14,
    shield: 0,
    description: "Deal 14 damage to a player.",
  },
  venom_spit: {
    key: "venom_spit",
    name: "Venom Spit",
    type: "damage",
    cost: 2,
    damage: 24,
    shield: 0,
    description: "Deal 24 damage to a player.",
  },
  hardened_hide: {
    key: "hardened_hide",
    name: "Hardened Hide",
    type: "shield",
    cost: 1,
    damage: 0,
    shield: 18,
    description: "Gain 18 shield.",
  },
}

function nowMs() {
  return Date.now()
}

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function shuffle(list) {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function cloneCard(template) {
  return {
    instanceId: makeId(template.key),
    key: template.key,
    name: template.name,
    type: template.type,
    cost: template.cost,
    damage: template.damage || 0,
    shield: template.shield || 0,
    description: template.description || "",
  }
}

function buildPlayerStarterDeck() {
  const deck = []
  for (let i = 0; i < 5; i += 1) {
    deck.push(cloneCard(PLAYER_CARD_LIBRARY.laser_burst))
  }
  for (let i = 0; i < 5; i += 1) {
    deck.push(cloneCard(PLAYER_CARD_LIBRARY.ion_shield))
  }
  return shuffle(deck)
}

function buildMonsterStarterDeck() {
  const deck = []
  for (let i = 0; i < 4; i += 1) {
    deck.push(cloneCard(MONSTER_CARD_LIBRARY.claw_strike))
  }
  for (let i = 0; i < 3; i += 1) {
    deck.push(cloneCard(MONSTER_CARD_LIBRARY.venom_spit))
  }
  for (let i = 0; i < 3; i += 1) {
    deck.push(cloneCard(MONSTER_CARD_LIBRARY.hardened_hide))
  }
  return shuffle(deck)
}

function drawCardsFromState(state, count) {
  let deck = Array.isArray(state.deck) ? [...state.deck] : []
  let discard = Array.isArray(state.discard) ? [...state.discard] : []
  let hand = Array.isArray(state.hand) ? [...state.hand] : []

  for (let i = 0; i < count; i += 1) {
    if (!deck.length && discard.length) {
      deck = shuffle(discard)
      discard = []
    }
    if (!deck.length) break
    hand.push(deck.shift())
  }

  return {
    ...state,
    deck,
    discard,
    hand,
  }
}

function applyShieldedDamage({ health, shield }, damage) {
  let nextShield = Math.max(0, Number(shield || 0))
  let nextHealth = Math.max(0, Number(health || 0))
  let remaining = Math.max(0, Number(damage || 0))

  if (nextShield > 0) {
    const absorbed = Math.min(nextShield, remaining)
    nextShield -= absorbed
    remaining -= absorbed
  }

  if (remaining > 0) {
    nextHealth = Math.max(0, nextHealth - remaining)
  }

  return {
    health: nextHealth,
    shield: nextShield,
  }
}

function canAffordAnyCard(actor) {
  const energy = Number(actor?.energy || 0)
  const hand = Array.isArray(actor?.hand) ? actor.hand : []
  return hand.some((card) => Number(card.cost || 0) <= energy)
}

function makeDefaultSession() {
  return {
    sessionId: SESSION_ID,
    phase: "idle", // idle | battle | victory | defeat
    turnTeam: "players", // players | monster
    turnNumber: 0,
    battleId: "",
    winner: "",
    monsterId: "current",
    updatedAtMs: nowMs(),
  }
}

function makeFreshPlayerState(existing = {}) {
  const initial = drawCardsFromState(
    {
      deck: buildPlayerStarterDeck(),
      discard: [],
      hand: [],
    },
    PLAYER_HAND_SIZE
  )

  return {
    uid: existing.uid || "",
    displayName: existing.displayName || existing.email || "Pilot",
    email: existing.email || "",
    photoURL: existing.photoURL || "",
    joined: true,
    alive: true,
    maxHealth: PLAYER_MAX_HEALTH,
    health: PLAYER_MAX_HEALTH,
    shield: 0,
    energy: PLAYER_ENERGY_PER_TURN,
    energyPerTurn: PLAYER_ENERGY_PER_TURN,
    hand: initial.hand,
    deck: initial.deck,
    discard: initial.discard,
    passedTurn: false,
    turnCardsPlayed: 0,
    joinedAt: Number(existing.joinedAt || nowMs()),
    updatedAtMs: nowMs(),
  }
}

function makeFreshMonsterState() {
  const initial = drawCardsFromState(
    {
      deck: buildMonsterStarterDeck(),
      discard: [],
      hand: [],
    },
    MONSTER_HAND_SIZE
  )

  return {
    id: "current",
    key: "abyss_beast",
    name: "Abyss Beast",
    joined: true,
    alive: true,
    maxHealth: MONSTER_MAX_HEALTH,
    health: MONSTER_MAX_HEALTH,
    shield: 0,
    energy: MONSTER_ENERGY_PER_TURN,
    energyPerTurn: MONSTER_ENERGY_PER_TURN,
    hand: initial.hand,
    deck: initial.deck,
    discard: initial.discard,
    updatedAtMs: nowMs(),
  }
}

async function ensureSession() {
  const snap = await SESSION_REF.get()
  if (!snap.exists) {
    await SESSION_REF.set({
      ...makeDefaultSession(),
      firestoreUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
  }
}

async function resetToIdle() {
  const [playersSnap, actionsSnap, monsterSnap] = await Promise.all([
    PLAYERS_REF.get(),
    ACTIONS_REF.get(),
    MONSTER_REF.get(),
  ])

  const batch = db.batch()

  playersSnap.docs.forEach((docSnap) => {
    batch.set(
      docSnap.ref,
      {
        joined: false,
        alive: false,
        passedTurn: false,
        energy: 0,
        shield: 0,
        hand: [],
        deck: [],
        discard: [],
        updatedAtMs: nowMs(),
        firestoreUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
  })

  actionsSnap.docs.forEach((docSnap) => batch.delete(docSnap.ref))
  if (monsterSnap.exists) batch.delete(MONSTER_REF)

  batch.set(
    SESSION_REF,
    {
      ...makeDefaultSession(),
      firestoreUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  )

  await batch.commit()
}

async function startBattleIfPossible() {
  const [sessionSnap, playersSnap] = await Promise.all([
    SESSION_REF.get(),
    PLAYERS_REF.get(),
  ])

  const session = sessionSnap.data() || makeDefaultSession()
  const joinedPlayers = playersSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((p) => p.joined)

  if (!joinedPlayers.length) {
    if (session.phase !== "idle") {
      await resetToIdle()
    }
    return
  }

  if (session.phase === "battle") return

  const battleId = makeId("battle")
  const monster = makeFreshMonsterState()

  const batch = db.batch()

  joinedPlayers
    .sort((a, b) => Number(a.joinedAt || 0) - Number(b.joinedAt || 0))
    .forEach((player) => {
      const fresh = makeFreshPlayerState(player)
      batch.set(
        PLAYERS_REF.doc(player.uid || player.id),
        {
          ...fresh,
          firestoreUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
    })

  batch.set(MONSTER_REF, {
    ...monster,
    firestoreUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  batch.set(
    SESSION_REF,
    {
      phase: "battle",
      turnTeam: "players",
      turnNumber: 1,
      battleId,
      winner: "",
      monsterId: "current",
      updatedAtMs: nowMs(),
      firestoreUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  )

  await batch.commit()
}

async function beginNextPlayerTurn() {
  const [sessionSnap, playersSnap, monsterSnap] = await Promise.all([
    SESSION_REF.get(),
    PLAYERS_REF.get(),
    MONSTER_REF.get(),
  ])

  const session = sessionSnap.data()
  const monster = monsterSnap.data()

  if (!session || session.phase !== "battle" || !monster || monster.health <= 0) return

  const alivePlayers = playersSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((p) => p.joined && p.alive)

  if (!alivePlayers.length) {
    await SESSION_REF.set(
      {
        phase: "defeat",
        winner: "monster",
        updatedAtMs: nowMs(),
        firestoreUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
    return
  }

  const batch = db.batch()

  alivePlayers.forEach((player) => {
    const next = drawCardsFromState(player, 1)
    batch.set(
      PLAYERS_REF.doc(player.uid || player.id),
      {
        hand: next.hand,
        deck: next.deck,
        discard: next.discard,
        energy: Number(player.energyPerTurn || PLAYER_ENERGY_PER_TURN),
        passedTurn: false,
        turnCardsPlayed: 0,
        updatedAtMs: nowMs(),
        firestoreUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
  })

  batch.set(
    SESSION_REF,
    {
      turnTeam: "players",
      turnNumber: Number(session.turnNumber || 0) + 1,
      updatedAtMs: nowMs(),
      firestoreUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  )

  await batch.commit()
}

function pickBestMonsterCard(monster) {
  const hand = Array.isArray(monster?.hand) ? monster.hand : []
  const energy = Number(monster?.energy || 0)
  const affordable = hand.filter((card) => Number(card.cost || 0) <= energy)

  if (!affordable.length) return null

  const healthPct =
    Number(monster.maxHealth || 1) > 0
      ? Number(monster.health || 0) / Number(monster.maxHealth || 1)
      : 1

  if (healthPct <= 0.45) {
    const bestShield = affordable
      .filter((c) => c.type === "shield")
      .sort((a, b) => Number(b.shield || 0) - Number(a.shield || 0))[0]
    if (bestShield) return bestShield
  }

  const bestDamage = affordable
    .filter((c) => c.type === "damage")
    .sort((a, b) => Number(b.damage || 0) - Number(a.damage || 0))[0]

  if (bestDamage) return bestDamage

  return affordable[0]
}

function pickTargetPlayer(players) {
  const alive = players.filter((p) => p.joined && p.alive)
  if (!alive.length) return null

  return [...alive].sort((a, b) => {
    const aScore = Number(a.health || 0) + Number(a.shield || 0) * 0.5
    const bScore = Number(b.health || 0) + Number(b.shield || 0) * 0.5
    return aScore - bScore
  })[0]
}

async function resolveMonsterTurn() {
  const [sessionSnap, playersSnap, monsterSnap] = await Promise.all([
    SESSION_REF.get(),
    PLAYERS_REF.get(),
    MONSTER_REF.get(),
  ])

  const session = sessionSnap.data()
  let monster = monsterSnap.data()

  if (!session || session.phase !== "battle") return
  if (!monster || !monster.alive || Number(monster.health || 0) <= 0) {
    await SESSION_REF.set(
      {
        phase: "victory",
        winner: "players",
        updatedAtMs: nowMs(),
        firestoreUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
    return
  }

  let players = playersSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
  const alivePlayers = players.filter((p) => p.joined && p.alive)

  if (!alivePlayers.length) {
    await SESSION_REF.set(
      {
        phase: "defeat",
        winner: "monster",
        updatedAtMs: nowMs(),
        firestoreUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
    return
  }

  monster = drawCardsFromState(
    {
      ...monster,
      energy: Number(monster.energyPerTurn || MONSTER_ENERGY_PER_TURN),
    },
    1
  )

  while (canAffordAnyCard(monster)) {
    const chosen = pickBestMonsterCard(monster)
    if (!chosen) break

    const handIndex = monster.hand.findIndex((card) => card.instanceId === chosen.instanceId)
    if (handIndex === -1) break

    const [playedCard] = monster.hand.splice(handIndex, 1)
    monster.discard = [...monster.discard, playedCard]
    monster.energy = Number(monster.energy || 0) - Number(playedCard.cost || 0)

    if (playedCard.type === "shield") {
      monster.shield = Number(monster.shield || 0) + Number(playedCard.shield || 0)
    }

    if (playedCard.type === "damage") {
      const target = pickTargetPlayer(players)
      if (!target) break

      const result = applyShieldedDamage(target, Number(playedCard.damage || 0))
      const targetId = target.uid || target.id

      players = players.map((p) => {
        if ((p.uid || p.id) !== targetId) return p
        return {
          ...p,
          health: result.health,
          shield: result.shield,
          alive: result.health > 0,
        }
      })
    }
  }

  const postAlivePlayers = players.filter((p) => p.joined && p.alive)
  const batch = db.batch()

  players.forEach((player) => {
    batch.set(
      PLAYERS_REF.doc(player.uid || player.id),
      {
        health: Number(player.health || 0),
        shield: Number(player.shield || 0),
        alive: Boolean(player.alive),
        updatedAtMs: nowMs(),
        firestoreUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
  })

  batch.set(
    MONSTER_REF,
    {
      hand: monster.hand,
      deck: monster.deck,
      discard: monster.discard,
      energy: monster.energy,
      shield: Number(monster.shield || 0),
      health: Number(monster.health || 0),
      alive: Number(monster.health || 0) > 0,
      updatedAtMs: nowMs(),
      firestoreUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  )

  if (!postAlivePlayers.length) {
    batch.set(
      SESSION_REF,
      {
        phase: "defeat",
        winner: "monster",
        turnTeam: "monster",
        updatedAtMs: nowMs(),
        firestoreUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
    await batch.commit()
    return
  }

  batch.set(
    SESSION_REF,
    {
      turnTeam: "monster",
      updatedAtMs: nowMs(),
      firestoreUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  )

  await batch.commit()
  await beginNextPlayerTurn()
}

async function afterPlayerActionMaybeAdvanceTurn() {
  const [sessionSnap, playersSnap, monsterSnap] = await Promise.all([
    SESSION_REF.get(),
    PLAYERS_REF.get(),
    MONSTER_REF.get(),
  ])

  const session = sessionSnap.data()
  const monster = monsterSnap.data()
  const players = playersSnap.docs.map((d) => ({ id: d.id, ...d.data() }))

  if (!session || session.phase !== "battle") return

  if (!monster || Number(monster.health || 0) <= 0) {
    await SESSION_REF.set(
      {
        phase: "victory",
        winner: "players",
        updatedAtMs: nowMs(),
        firestoreUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
    return
  }

  const alivePlayers = players.filter((p) => p.joined && p.alive)
  if (!alivePlayers.length) {
    await SESSION_REF.set(
      {
        phase: "defeat",
        winner: "monster",
        updatedAtMs: nowMs(),
        firestoreUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
    return
  }

  const allPassed = alivePlayers.every((p) => Boolean(p.passedTurn))
  if (allPassed) {
    await resolveMonsterTurn()
  }
}

async function processPlayCard(action) {
  const { uid, cardInstanceId } = action || {}
  if (!uid || !cardInstanceId) {
    throw new Error("Missing uid or cardInstanceId.")
  }

  const [sessionSnap, playerSnap, monsterSnap] = await Promise.all([
    SESSION_REF.get(),
    PLAYERS_REF.doc(uid).get(),
    MONSTER_REF.get(),
  ])

  const session = sessionSnap.data()
  const player = playerSnap.data()
  const monster = monsterSnap.data()

  if (!session || session.phase !== "battle") {
    throw new Error("Battle is not active.")
  }
  if (session.turnTeam !== "players") {
    throw new Error("It is not the players' turn.")
  }
  if (!player || !player.joined || !player.alive) {
    throw new Error("Player is not active.")
  }
  if (player.passedTurn) {
    throw new Error("Player already passed.")
  }
  if (!monster || !monster.alive || Number(monster.health || 0) <= 0) {
    throw new Error("Monster is already defeated.")
  }

  const hand = Array.isArray(player.hand) ? [...player.hand] : []
  const cardIndex = hand.findIndex((card) => card.instanceId === cardInstanceId)
  if (cardIndex === -1) {
    throw new Error("Card is not in hand.")
  }

  const card = hand[cardIndex]
  const energy = Number(player.energy || 0)
  if (Number(card.cost || 0) > energy) {
    throw new Error("Not enough energy.")
  }

  hand.splice(cardIndex, 1)
  const nextDiscard = [...(Array.isArray(player.discard) ? player.discard : []), card]
  const nextEnergy = energy - Number(card.cost || 0)

  let nextPlayerShield = Number(player.shield || 0)
  let nextPlayerHealth = Number(player.health || 0)
  let nextMonsterShield = Number(monster.shield || 0)
  let nextMonsterHealth = Number(monster.health || 0)

  if (card.type === "shield") {
    nextPlayerShield += Number(card.shield || 0)
  }

  if (card.type === "damage") {
    const result = applyShieldedDamage(
      { health: nextMonsterHealth, shield: nextMonsterShield },
      Number(card.damage || 0)
    )
    nextMonsterHealth = result.health
    nextMonsterShield = result.shield
  }

  const batch = db.batch()

  batch.set(
    PLAYERS_REF.doc(uid),
    {
      hand,
      discard: nextDiscard,
      energy: nextEnergy,
      shield: nextPlayerShield,
      health: nextPlayerHealth,
      turnCardsPlayed: Number(player.turnCardsPlayed || 0) + 1,
      updatedAtMs: nowMs(),
      firestoreUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  )

  batch.set(
    MONSTER_REF,
    {
      health: nextMonsterHealth,
      shield: nextMonsterShield,
      alive: nextMonsterHealth > 0,
      updatedAtMs: nowMs(),
      firestoreUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  )

  if (nextMonsterHealth <= 0) {
    batch.set(
      SESSION_REF,
      {
        phase: "victory",
        winner: "players",
        updatedAtMs: nowMs(),
        firestoreUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
  }

  await batch.commit()
  await afterPlayerActionMaybeAdvanceTurn()
}

async function processPassTurn(action) {
  const { uid } = action || {}
  if (!uid) throw new Error("Missing uid.")

  const [sessionSnap, playerSnap] = await Promise.all([
    SESSION_REF.get(),
    PLAYERS_REF.doc(uid).get(),
  ])

  const session = sessionSnap.data()
  const player = playerSnap.data()

  if (!session || session.phase !== "battle") {
    throw new Error("Battle is not active.")
  }
  if (session.turnTeam !== "players") {
    throw new Error("It is not the players' turn.")
  }
  if (!player || !player.joined || !player.alive) {
    throw new Error("Player is not active.")
  }
  if (player.passedTurn) return

  await PLAYERS_REF.doc(uid).set(
    {
      passedTurn: true,
      updatedAtMs: nowMs(),
      firestoreUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  )

  await afterPlayerActionMaybeAdvanceTurn()
}

async function claimAction(actionRef) {
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(actionRef)
    if (!snap.exists) return null

    const data = snap.data()
    if (!data || data.status !== "pending") return null

    tx.set(
      actionRef,
      {
        status: "processing",
        processingStartedAtMs: nowMs(),
        firestoreUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    return data
  })
}

async function completeAction(actionRef) {
  await actionRef.set(
    {
      status: "done",
      completedAtMs: nowMs(),
      firestoreUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  )
}

async function rejectAction(actionRef, reason) {
  await actionRef.set(
    {
      status: "rejected",
      error: String(reason || "Unknown action failure."),
      completedAtMs: nowMs(),
      firestoreUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  )
}

async function processActionDoc(change) {
  const actionRef = change.doc.ref
  const claimed = await claimAction(actionRef)
  if (!claimed) return

  try {
    if (claimed.type === "playCard") {
      await processPlayCard(claimed)
    } else if (claimed.type === "passTurn") {
      await processPassTurn(claimed)
    } else {
      throw new Error(`Unsupported action type: ${claimed.type}`)
    }

    await completeAction(actionRef)
  } catch (error) {
    await rejectAction(actionRef, error?.message || error)
    console.error("Action failed:", error)
  }
}

let reconcileTimeout = null
function scheduleReconcile() {
  if (reconcileTimeout) clearTimeout(reconcileTimeout)
  reconcileTimeout = setTimeout(async () => {
    reconcileTimeout = null
    try {
      await startBattleIfPossible()
    } catch (error) {
      console.error("Reconcile failed:", error)
    }
  }, 150)
}

async function start() {
  await ensureSession()
  console.log("Card battle engine started")

  PLAYERS_REF.onSnapshot(
    () => {
      scheduleReconcile()
    },
    (error) => {
      console.error("Players listener failed:", error)
    }
  )

  ACTIONS_REF.onSnapshot(
    async (snap) => {
      const added = snap.docChanges().filter((change) => change.type === "added")
      for (const change of added) {
        await processActionDoc(change)
      }
    },
    (error) => {
      console.error("Actions listener failed:", error)
    }
  )

  scheduleReconcile()
}

start().catch((error) => {
  console.error(error)
  process.exit(1)
})