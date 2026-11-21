import React, { useEffect, useRef, useState } from "react"
import {
  Alert,
  Box,
  Button,
  Chip,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material"
import { motion, AnimatePresence } from "framer-motion"

import HourglassBottomRoundedIcon from "@mui/icons-material/HourglassBottomRounded"
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded"

const PLAYER_MAX_HEALTH = 100
const PLAYER_ENERGY_PER_TURN = 3
const PLAYER_OPENING_HAND = 5

const ENEMY_MAX_HEALTH = 140
const ENEMY_ENERGY_PER_TURN = 3
const ENEMY_MOVES_PER_TURN = 3

const TARGET_TYPES = {
  SELF: "self",
  ENEMY: "enemy",
}

const BATTLEFIELD_HEIGHT = 540

const PLAYER_LEFT = "22%"
const ENEMY_LEFT = "78%"
const MID_LEFT = "50%"
const COMBATANT_CENTER_Y = 300
const PLAYER_EFFECT_Y = COMBATANT_CENTER_Y
const ENEMY_EFFECT_Y = COMBATANT_CENTER_Y
const PLAYER_CARD_EFFECT_Y = COMBATANT_CENTER_Y - 46
const ENEMY_CARD_PREVIEW_Y = 112
const PASS_TURN_TOP_PX = 36

const PLAYER_CARD_LIBRARY = {
  laser_burst: {
    key: "laser_burst",
    name: "Laser Burst",
    type: "damage",
    cost: 1,
    targetType: TARGET_TYPES.ENEMY,
    accent: "rgba(244,63,94,0.20)",
    cardImage: "/cards/laser-burst-card.png",
    effectImage: "/effects/laser-burst.png",
    description: "A concentrated blast that scorches a single enemy.",
    effects: [{ kind: "damage", amount: 18, label: "Deal 18 damage" }],
    effectMotion: {
      type: "projectile",
      width: 150,
      duration: 0.62,
      scale: [0.8, 1.05, 0.96],
      opacity: [0, 1, 1, 0],
      y: [-80, -80, -80, -100],
    },
  },
  ion_shield: {
    key: "ion_shield",
    name: "Ion Shield",
    type: "shield",
    cost: 1,
    targetType: TARGET_TYPES.SELF,
    accent: "rgba(34,211,238,0.20)",
    cardImage: "/cards/ion-shield-card.png",
    effectImage: "/effects/ion-shield.png",
    description: "A defensive field that wraps around your ship.",
    effects: [{ kind: "shield", amount: 16, label: "Gain 16 shield" }],
    effectMotion: {
      type: "burst",
      width: 190,
      duration: 0.85,
      scale: [0.2, 1.06, 1.18],
      opacity: [0, 0.95, 0.45, 0],
      rotate: 360,
    },
  },
}

const ENEMY_CARD_LIBRARY = {
  claw_strike: {
    key: "claw_strike",
    name: "Claw Strike",
    type: "damage",
    cost: 1,
    targetType: TARGET_TYPES.ENEMY,
    accent: "rgba(244,63,94,0.20)",
    cardImage: "/cards/claw-strike-card.png",
    effectImage: "/effects/claw-strike.png",
    description: "A savage melee hit from the monster.",
    effects: [{ kind: "damage", amount: 14, label: "Deal 14 damage" }],
    effectMotion: {
      type: "slash",
      width: 170,
      duration: 0.55,
      scale: [0.8, 1.05, 1],
      opacity: [0, 1, 1, 0],
      x: [0, -18, 10, 0],
      y: [-26, 0, 10, 22],
      rotate: -18,
    },
  },
  venom_spit: {
    key: "venom_spit",
    name: "Venom Spit",
    type: "damage",
    cost: 1,
    targetType: TARGET_TYPES.ENEMY,
    accent: "rgba(168,85,247,0.20)",
    cardImage: "/cards/venom-spit-card.png",
    effectImage: "/effects/venom-spit.png",
    description: "A toxic shot that splashes across its victim.",
    effects: [{ kind: "damage", amount: 24, label: "Deal 24 damage" }],
    effectMotion: {
      type: "projectile",
      width: 155,
      duration: 0.75,
      scale: [0.75, 1.1, 0.95],
      opacity: [0, 1, 1, 0],
      y: [0, 8, 0],
    },
  },
  hardened_hide: {
    key: "hardened_hide",
    name: "Hardened Hide",
    type: "shield",
    cost: 1,
    targetType: TARGET_TYPES.SELF,
    accent: "rgba(250,204,21,0.18)",
    cardImage: "/cards/hardened-hide-card.png",
    effectImage: "/effects/hardened-hide.png",
    description: "The monster hardens its body into plated armor.",
    effects: [{ kind: "shield", amount: 18, label: "Gain 18 shield" }],
    effectMotion: {
      type: "burst",
      width: 220,
      duration: 0.95,
      scale: [0.3, 1, 1.22],
      opacity: [0, 0.95, 0.45, 0],
      rotate: 180,
    },
  },
}

const ENEMY_MOVE_POOL = [
  "claw_strike",
  "claw_strike",
  "claw_strike",
  "claw_strike",
  "venom_spit",
  "venom_spit",
  "venom_spit",
  "hardened_hide",
  "hardened_hide",
  "hardened_hide",
]

function getCardDef(key) {
  return PLAYER_CARD_LIBRARY[key] || ENEMY_CARD_LIBRARY[key] || null
}

function StatPill({ label, value, small = false }) {
  return (
    <Chip
      label={`${label}: ${value}`}
      size={small ? "small" : "medium"}
      sx={{
        color: "rgba(245,248,255,0.94)",
        background: "black",
        height: small ? 28 : undefined,
        "& .MuiChip-label": {
          px: small ? 1 : undefined,
          fontSize: small ? 12 : undefined,
        },
      }}
    />
  )
}

function HealthBar({
  value,
  max,
  color = "linear-gradient(90deg, #22c55e 0%, #eab308 60%, #ef4444 100%)",
  height = 10,
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
  return (
    <Box
      sx={{
        height,
        borderRadius: 999,
        background: "rgba(255,255,255,0.08)",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          width: `${pct}%`,
          height: "100%",
          borderRadius: 999,
          background: color,
        }}
      />
    </Box>
  )
}

function EnergyBar({ value, max, height = 8 }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
  return (
    <Box
      sx={{
        height,
        borderRadius: 999,
        background: "rgba(255,255,255,0.08)",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          width: `${pct}%`,
          height: "100%",
          borderRadius: 999,
          background:
            "linear-gradient(90deg, rgba(124,58,237,0.98) 0%, rgba(79,70,229,0.96) 50%, rgba(34,211,238,0.96) 100%)",
        }}
      />
    </Box>
  )
}

function cloneCard(template) {
  return {
    instanceId: `${template.key}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    ...template,
  }
}

function shuffle(list) {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function buildPlayerDeck() {
  const cards = []
  for (let i = 0; i < 5; i += 1) cards.push(cloneCard(PLAYER_CARD_LIBRARY.laser_burst))
  for (let i = 0; i < 5; i += 1) cards.push(cloneCard(PLAYER_CARD_LIBRARY.ion_shield))
  return shuffle(cards)
}

function drawCards(state, count) {
  let deck = [...state.deck]
  let discard = [...state.discard]
  let hand = [...state.hand]

  for (let i = 0; i < count; i += 1) {
    if (!deck.length && discard.length) {
      deck = shuffle(discard)
      discard = []
    }
    if (!deck.length) break
    hand.push(deck.shift())
  }

  return { ...state, deck, discard, hand }
}

function discardHand(state) {
  if (!state?.hand?.length) return state
  return {
    ...state,
    hand: [],
    discard: [...state.discard, ...state.hand],
  }
}

function makePlayerState(opening = true) {
  let state = {
    id: "player",
    name: "Rocketship",
    health: PLAYER_MAX_HEALTH,
    maxHealth: PLAYER_MAX_HEALTH,
    shield: 0,
    shieldActiveAgainst: null,
    energy: PLAYER_ENERGY_PER_TURN,
    energyPerTurn: PLAYER_ENERGY_PER_TURN,
    deck: buildPlayerDeck(),
    hand: [],
    discard: [],
  }
  if (opening) state = drawCards(state, PLAYER_OPENING_HAND)
  return state
}

function makeEnemyState() {
  return {
    id: "enemy",
    name: "Abyss Beast",
    health: ENEMY_MAX_HEALTH,
    maxHealth: ENEMY_MAX_HEALTH,
    shield: 0,
    shieldActiveAgainst: null,
    energy: ENEMY_ENERGY_PER_TURN,
    energyPerTurn: ENEMY_ENERGY_PER_TURN,
  }
}

function applyDamage(target, damage, attackerTeam) {
  let remaining = Math.max(0, damage || 0)
  let shield = Number(target.shield || 0)
  let health = Number(target.health || 0)
  let shieldActiveAgainst = target.shieldActiveAgainst || null

  const shieldApplies =
    shield > 0 &&
    shieldActiveAgainst &&
    shieldActiveAgainst === attackerTeam

  if (shieldApplies) {
    const absorbed = Math.min(shield, remaining)
    shield -= absorbed
    remaining -= absorbed
    if (shield <= 0) {
      shield = 0
      shieldActiveAgainst = null
    }
  }

  if (remaining > 0) {
    health = Math.max(0, health - remaining)
  }

  return { ...target, shield, shieldActiveAgainst, health }
}

function expireShieldForTurn(character, attackerTeam) {
  if (!character) return character
  if (character.shieldActiveAgainst !== attackerTeam) return character
  return {
    ...character,
    shield: 0,
    shieldActiveAgainst: null,
  }
}

function TargetHalo({ active, valid, color = "cyan" }) {
  if (!active || !valid) return null

  const isRed = color === "red"

  return (
    <Box
      component={motion.div}
      animate={{
        opacity: [0.7, 1, 0.7],
        scale: [1, 1.06, 1],
      }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      sx={{
        position: "absolute",
        inset: -12,
        borderRadius: "50%",
        boxShadow: isRed
          ? "0 0 22px rgba(244,63,94,0.42)"
          : "0 0 22px rgba(34,211,238,0.42)",
        pointerEvents: "none",
      }}
    />
  )
}

function ShieldBadge({ shield }) {
  if (!shield || shield <= 0) return null
  return (
    <Typography
      sx={{
        mt: 0.45,
        color: "rgba(245,248,255,0.96)",
        fontWeight: 900,
        fontSize: 12.5,
      }}
    >
      {`🛡️ ${shield}`}
    </Typography>
  )
}

function BattlefieldPlayer({ player, activeCard, onTargetClick }) {
  const def = activeCard ? getCardDef(activeCard.key) : null
  const valid = def?.targetType === TARGET_TYPES.SELF

  return (
    <Box
      role="button"
      tabIndex={valid ? 0 : -1}
      aria-label="Target your ship"
      aria-disabled={!valid}
      onKeyDown={event => { if (valid && ["Enter", " "].includes(event.key)) { event.preventDefault(); event.currentTarget.click() } }}
      onClick={(event) => {
        event.stopPropagation()
        if (!activeCard || !valid) return
        onTargetClick({ card: activeCard, targetType: "self" })
      }}
      sx={{
        position: "absolute",
        left: PLAYER_LEFT,
        top: COMBATANT_CENTER_Y,
        width: { xs: 82, sm: 96, md: 118 },
        transform: "translate(-50%, -50%)",
        zIndex: 4,
        textAlign: "center",
        cursor: activeCard && valid ? "pointer" : "default",
      }}
    >
      <Box sx={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        <Box
          component={motion.img}
          src="/reg.png"
          alt="Rocketship"
          draggable={false}
          animate={{
            y: [0, -4, 0],
            rotate: [0, -2, 2, 0],
            filter: [
              "drop-shadow(0 0 8px rgba(34,211,238,0.45))",
              "drop-shadow(0 0 18px rgba(34,211,238,0.72))",
              "drop-shadow(0 0 8px rgba(34,211,238,0.45))",
            ],
          }}
          transition={{ duration: 2.8, ease: "easeInOut", repeat: Infinity }}
          sx={{
            width: "100%",
            height: "auto",
            objectFit: "contain",
            display: "block",
            userSelect: "none",
            pointerEvents: "none",
          }}
        />

        {player.shield > 0 ? (
          <Box
            component={motion.div}
            animate={{ scale: [0.96, 1.04, 0.96], opacity: [0.4, 0.75, 0.4] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            sx={{
              position: "absolute",
              inset: -10,
              borderRadius: "50%",
              boxShadow: "0 0 18px rgba(34,211,238,0.28)",
              pointerEvents: "none",
            }}
          />
        ) : null}

        <TargetHalo active={Boolean(activeCard)} valid={valid} color="cyan" />
      </Box>

      <Typography sx={{ mt: 0.5, color: "rgba(245,248,255,0.96)", fontWeight: 800, fontSize: 12.5 }}>
        {player.name}
      </Typography>

      <Typography
        sx={{
          color: "rgba(216,229,254,0.92)",
          fontWeight: 800,
          fontSize: 12.5,
          mt: 0.15,
        }}
      >
        {`${player.health}/${player.maxHealth}`}
      </Typography>

      <Box sx={{ mt: 0.6, px: 0.3 }}>
        <HealthBar value={player.health} max={player.maxHealth} height={8} />
      </Box>

      <Typography
        sx={{
          color: "rgba(216,229,254,0.82)",
          fontWeight: 800,
          fontSize: 11.5,
          mt: 0.45,
        }}
      >
        {`Energy ${player.energy}/${player.energyPerTurn}`}
      </Typography>

      <Box sx={{ mt: 0.45, px: 0.3 }}>
        <EnergyBar value={player.energy} max={player.energyPerTurn} height={7} />
      </Box>

      <ShieldBadge shield={player.shield} />
    </Box>
  )
}

function BattlefieldMonster({ monster, activeCard, onTargetClick }) {
  const def = activeCard ? getCardDef(activeCard.key) : null
  const valid = def?.targetType === TARGET_TYPES.ENEMY

  return (
    <Box
      sx={{
        position: "absolute",
        left: ENEMY_LEFT,
        top: COMBATANT_CENTER_Y,
        width: { xs: 138, sm: 190, md: 255 },
        transform: "translate(-50%, -50%)",
        zIndex: 4,
        textAlign: "center",
      }}
    >
      <Box
        role="button"
        tabIndex={valid ? 0 : -1}
        aria-label="Target enemy"
        aria-disabled={!valid}
        onKeyDown={event => { if (valid && ["Enter", " "].includes(event.key)) { event.preventDefault(); event.currentTarget.click() } }}
        onClick={(event) => {
          event.stopPropagation()
          if (!activeCard || !valid) return
          onTargetClick({ card: activeCard, targetType: "enemy" })
        }}
        sx={{ position: "relative", cursor: activeCard && valid ? "pointer" : "default" }}
      >
        <Box
          component={motion.img}
          src="/enemy.png"
          alt={monster.name}
          draggable={false}
          animate={{
            y: [0, 10, 0],
            rotate: [0, 1.5, -1.5, 0],
            filter: [
              "drop-shadow(0 0 10px rgba(244,63,94,0.35))",
              "drop-shadow(0 0 18px rgba(244,63,94,0.62))",
              "drop-shadow(0 0 10px rgba(244,63,94,0.35))",
            ],
          }}
          transition={{ duration: 3.2, ease: "easeInOut", repeat: Infinity }}
          sx={{
            width: "100%",
            height: "auto",
            objectFit: "contain",
            display: "block",
            userSelect: "none",
            pointerEvents: "none",
          }}
        />

        {monster.shield > 0 ? (
          <Box
            component={motion.div}
            animate={{ scale: [0.95, 1.06, 0.95], opacity: [0.35, 0.7, 0.35] }}
            transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
            sx={{
              position: "absolute",
              inset: -12,
              borderRadius: "50%",
              boxShadow: "0 0 22px rgba(250,204,21,0.24)",
              pointerEvents: "none",
            }}
          />
        ) : null}

        <TargetHalo active={Boolean(activeCard)} valid={valid} color="red" />
      </Box>

      <Typography
        sx={{
          mt: 1,
          color: "rgba(245,248,255,0.98)",
          fontWeight: 900,
          fontSize: { xs: 14, sm: 16, md: 18 },
        }}
      >
        {monster.name}
      </Typography>

      <Typography
        sx={{
          color: "rgba(216,229,254,0.92)",
          fontWeight: 900,
          fontSize: 13,
          mt: 0.15,
        }}
      >
        {`${monster.health}/${monster.maxHealth}`}
      </Typography>

      <Box sx={{ mt: 0.75, px: { xs: 1, sm: 2, md: 3 } }}>
        <HealthBar value={monster.health} max={monster.maxHealth} height={10} />
      </Box>

      <ShieldBadge shield={monster.shield} />
    </Box>
  )
}

function HandContainer({
  cards,
  canAct,
  currentEnergy,
  selectedCard,
  setSelectedCard,
  disabled,
  handMeasureRef,
  cardWidth,
  cardHeight,
  gap,
  turnTeam,
  enemyActing,
}) {
  const selectedDef = selectedCard ? getCardDef(selectedCard.key) : null
  const selectedImageSrc =
    selectedDef?.cardImage || selectedCard?.cardImage || "/reg.png"

  const statusLabel =
    turnTeam === "enemy" || enemyActing
      ? "Enemy is attacking"
      : selectedCard
      ? "Card selected — click a highlighted target"
      : "Click a card to select it"

  return (
    <Box
      sx={{
        width: "100%",
        borderRadius: 4,
        background: "black",
        px: { xs: 0.75, sm: 1, md: 1.25 },
        pt: 1.2,
        pb: 1.35,
        overflow: "visible",
      }}
    >
      <Stack spacing={1.2} alignItems="center">
        <Chip
          label={statusLabel}
          sx={{
            color: "rgba(245,248,255,0.96)",
            background: "black",
            border: "1px solid rgba(124,58,237,0.42)",
            "& .MuiChip-label": {
              px: 1.6,
              fontWeight: 700,
            },
          }}
        />

        <AnimatePresence mode="wait">
          {selectedCard ? (
            <Box
              key={selectedCard.instanceId}
              component={motion.div}
              initial={{ opacity: 0, y: 8, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.92 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              sx={{
                width: {
                  xs: Math.round(cardWidth * 1.8),
                  sm: Math.round(cardWidth * 1.95),
                  md: Math.round(cardWidth * 2.05),
                },
                maxWidth: "48vw",
                borderRadius: 3,
                overflow: "hidden",
                background: "black",
                boxShadow:
                  "0 0 0 2px rgba(34,211,238,0.88), 0 24px 55px rgba(0,0,0,0.5)",
              }}
            >
              <Box
                component="img"
                src={selectedImageSrc}
                alt={selectedCard.name}
                draggable={false}
                sx={{
                  width: "100%",
                  display: "block",
                  objectFit: "cover",
                  pointerEvents: "none",
                }}
              />
            </Box>
          ) : null}
        </AnimatePresence>

        <Box
          ref={handMeasureRef}
          sx={{
            width: "100%",
            overflow: "visible",
          }}
        >
          <Stack
            direction="row"
            spacing={`${gap}px`}
            justifyContent="center"
            alignItems="flex-end"
            sx={{
              width: "100%",
              overflow: "visible",
            }}
          >
            {cards.map((card) => {
              const def = getCardDef(card.key)
              const disabledCard =
                disabled ||
                !canAct ||
                Number(card.cost || 0) > Number(currentEnergy || 0)
              const imageSrc = def?.cardImage || card?.cardImage || "/reg.png"
              const isSelected = selectedCard?.instanceId === card.instanceId

              return (
                <Box
                  key={card.instanceId}
                  component={motion.button}
                  type="button"
                  disabled={disabledCard}
                  aria-pressed={isSelected}
                  aria-label={`${card.name}. ${def?.effects?.map(effect => effect.label).join(", ") || ""}. Energy ${card.cost}`}
                  whileHover={
                    disabledCard
                      ? undefined
                      : {
                          scale: isSelected ? 1.18 : 1.1,
                          y: isSelected ? -12 : -6,
                        }
                  }
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    if (disabledCard) return
                    setSelectedCard((prev) =>
                      prev?.instanceId === card.instanceId ? null : card
                    )
                  }}
                  sx={{
                    padding: 0,
                    border: 0,
                    width: `${cardWidth}px`,
                    minWidth: `${cardWidth}px`,
                    height: `${cardHeight}px`,
                    opacity: disabledCard ? 0.45 : 1,
                    cursor: disabledCard ? "not-allowed" : "pointer",
                    transition:
                      "opacity 140ms ease, transform 140ms ease, box-shadow 140ms ease",
                    userSelect: "none",
                    borderRadius: 3,
                    overflow: "hidden",
                    boxShadow: isSelected
                      ? "0 0 0 2px #b0a0ec, 0 18px 40px rgba(0,0,0,0.42)"
                      : "0 18px 40px rgba(0,0,0,0.42)",
                    background: "black",
                    transformOrigin: "center bottom",
                    position: "relative",
                    transform: isSelected ? "translateY(-10px) scale(1.08)" : "none",
                    zIndex: isSelected ? 5 : 1,
                  }}
                >
                  <Box
                    component="img"
                    src={imageSrc}
                    alt={card.name}
                    draggable={false}
                    sx={{
                      width: "100%",
                      height: "100%",
                      display: "block",
                      objectFit: "cover",
                      pointerEvents: "none",
                    }}
                  />
                </Box>
              )
            })}
          </Stack>
        </Box>
      </Stack>
    </Box>
  )
}

function EnemyActionCard({ card, visible }) {
  const def = card ? getCardDef(card.key) : null
  if (!card || !def || !visible) return null

  return (
    <Box
      component={motion.div}
      initial={{
        left: ENEMY_LEFT,
        top: `${ENEMY_EFFECT_Y}px`,
        x: "-50%",
        y: "-50%",
        opacity: 0,
        scale: 0.72,
      }}
      animate={{
        left: MID_LEFT,
        top: `${ENEMY_CARD_PREVIEW_Y}px`,
        opacity: [0, 1, 1],
        scale: [0.72, 1, 1],
        y: ["-50%", "-58%", "-50%"],
      }}
      exit={{
        opacity: 0,
        scale: 0.92,
      }}
      transition={{
        duration: 0.55,
        ease: "easeOut",
      }}
      sx={{
        position: "absolute",
        width: { xs: 92, sm: 108, md: 124 },
        borderRadius: 3,
        overflow: "hidden",
        boxShadow: "0 18px 40px rgba(0,0,0,0.42)",
        zIndex: 14,
        pointerEvents: "none",
      }}
    >
      <Box
        component="img"
        src={def.cardImage}
        alt={card.name}
        sx={{
          width: "100%",
          display: "block",
          objectFit: "cover",
        }}
      />
    </Box>
  )
}

function BattleEffectLayer({ effects }) {
  return (
    <AnimatePresence>
      {effects.map((fx) => {
        const def = getCardDef(fx.cardKey)
        const motionDef = def?.effectMotion
        if (!def || !motionDef) return null

        if (motionDef.type === "projectile") {
          return (
            <Box
              key={fx.id}
              component={motion.img}
              src={def.effectImage}
              alt={def.name}
              initial={{
                left: fx.from.x,
                top: fx.from.y,
                x: "-50%",
                y: "-50%",
                opacity: 0,
                scale: motionDef.scale?.[0] ?? 0.8,
              }}
              animate={{
                left: fx.to.x,
                top: fx.to.y,
                opacity: motionDef.opacity || [0, 1, 1, 0],
                scale: motionDef.scale || [0.8, 1, 0.95],
                y: motionDef.y || [0, 0, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: motionDef.duration || 0.65,
                ease: "easeInOut",
              }}
              sx={{
                position: "absolute",
                width: motionDef.width || 140,
                pointerEvents: "none",
                zIndex: 10,
                filter: "drop-shadow(0 0 18px rgba(255,255,255,0.18))",
              }}
            />
          )
        }

        return (
          <Box
            key={fx.id}
            component={motion.img}
            src={def.effectImage}
            alt={def.name}
            initial={{
              left: fx.to.x,
              top: fx.to.y,
              x: "-50%",
              y: "-50%",
              opacity: 0,
              scale: motionDef.scale?.[0] ?? 0.3,
              rotate: 0,
            }}
            animate={{
              opacity: motionDef.opacity || [0, 1, 0],
              scale: motionDef.scale || [0.3, 1.08, 1.2],
              rotate: motionDef.rotate || 0,
              x: motionDef.x || "-50%",
              y: motionDef.y || "-50%",
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: motionDef.duration || 0.8,
              ease: "easeOut",
            }}
            sx={{
              position: "absolute",
              width: motionDef.width || 180,
              pointerEvents: "none",
              zIndex: 10,
              filter: "drop-shadow(0 0 18px rgba(255,255,255,0.18))",
            }}
          />
        )
      })}
    </AnimatePresence>
  )
}

function VictoryCelebration({ visible }) {
  if (!visible) return null

  const particles = new Array(10).fill(null)

  return (
    <AnimatePresence>
      <Box
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 30,
          pointerEvents: "none",
        }}
      >
        <Box
          component={motion.div}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0.85, 1.05, 1] }}
          transition={{ duration: 1.35, ease: "easeOut" }}
          sx={{
            position: "absolute",
            left: PLAYER_LEFT,
            top: COMBATANT_CENTER_Y - 120,
            transform: "translate(-50%, -50%)",
            px: 2.2,
            py: 1,
            borderRadius: 999,
            color: "rgba(245,248,255,0.98)",
            fontWeight: 900,
            letterSpacing: 1.1,
            background: "black",
            boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
          }}
        >
          Victory!
        </Box>

        <Box
          component={motion.div}
          initial={{ scale: 0.2, opacity: 0 }}
          animate={{ scale: [0.2, 1.35, 1.7], opacity: [0, 0.45, 0] }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          sx={{
            position: "absolute",
            left: PLAYER_LEFT,
            top: COMBATANT_CENTER_Y,
            width: 220,
            height: 220,
            borderRadius: "50%",
            boxShadow: "0 0 40px rgba(34,211,238,0.35)",
            transform: "translate(-50%, -50%)",
          }}
        />

        <Box
          component={motion.div}
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: [0.3, 1.1, 1.45], opacity: [0, 0.35, 0] }}
          transition={{ duration: 1.05, ease: "easeOut", delay: 0.12 }}
          sx={{
            position: "absolute",
            left: PLAYER_LEFT,
            top: COMBATANT_CENTER_Y,
            width: 300,
            height: 300,
            borderRadius: "50%",
            boxShadow: "0 0 46px rgba(124,58,237,0.28)",
            transform: "translate(-50%, -50%)",
          }}
        />

        {particles.map((_, index) => {
          const angle = (Math.PI * 2 * index) / particles.length
          const distance = 95 + (index % 3) * 22
          const dx = Math.cos(angle) * distance
          const dy = Math.sin(angle) * distance

          return (
            <Box
              key={index}
              component={motion.div}
              initial={{
                left: PLAYER_LEFT,
                top: COMBATANT_CENTER_Y,
                x: "-50%",
                y: "-50%",
                opacity: 0,
                scale: 0.4,
              }}
              animate={{
                left: `calc(${PLAYER_LEFT} + ${dx}px)`,
                top: COMBATANT_CENTER_Y + dy,
                opacity: [0, 1, 0],
                scale: [0.4, 1, 0.65],
              }}
              transition={{
                duration: 0.85,
                ease: "easeOut",
                delay: 0.08 + index * 0.03,
              }}
              sx={{
                position: "absolute",
                width: 12,
                height: 12,
                borderRadius: "50%",
                background:
                  index % 2 === 0
                    ? "rgba(34,211,238,0.95)"
                    : "rgba(124,58,237,0.95)",
                boxShadow:
                  index % 2 === 0
                    ? "0 0 16px rgba(34,211,238,0.75)"
                    : "0 0 16px rgba(124,58,237,0.75)",
              }}
            />
          )
        })}
      </Box>
    </AnimatePresence>
  )
}

export default function SpaceRocketGame() {
  const theme = useTheme()
  const isXs = useMediaQuery(theme.breakpoints.down("sm"))
  const isSm = useMediaQuery(theme.breakpoints.between("sm", "md"))

  const [mounted, setMounted] = useState(false)
  const [player, setPlayer] = useState(null)
  const [enemy, setEnemy] = useState(null)
  const [turnTeam, setTurnTeam] = useState("player")
  const [turnNumber, setTurnNumber] = useState(1)
  const [notice, setNotice] = useState({ type: "", text: "" })
  const [battleEffects, setBattleEffects] = useState([])
  const [selectedCard, setSelectedCard] = useState(null)
  const [enemyActing, setEnemyActing] = useState(false)
  const [enemyActionCard, setEnemyActionCard] = useState(null)
  const [victoryCelebrating, setVictoryCelebrating] = useState(false)
  const [handAreaWidth, setHandAreaWidth] = useState(0)

  const resetTimeoutRef = useRef(null)
  const playerRef = useRef(null)
  const enemyRef = useRef(null)
  const enemyTurnRunningRef = useRef(false)
  const battleResetRef = useRef(false)
  const battleVersionRef = useRef(0)
  const handMeasureRef = useRef(null)

  useEffect(() => {
    setMounted(true)
    const initialPlayer = makePlayerState(true)
    const initialEnemy = makeEnemyState()
    setPlayer(initialPlayer)
    setEnemy(initialEnemy)
    playerRef.current = initialPlayer
    enemyRef.current = initialEnemy
  }, [])

  useEffect(() => {
    playerRef.current = player
  }, [player])

  useEffect(() => {
    enemyRef.current = enemy
  }, [enemy])

  useEffect(() => {
    return () => {
      battleVersionRef.current += 1
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (!handMeasureRef.current) return

    const node = handMeasureRef.current
    const updateWidth = () => {
      setHandAreaWidth(node.getBoundingClientRect().width || 0)
    }

    updateWidth()

    const observer = new ResizeObserver(() => {
      updateWidth()
    })

    observer.observe(node)
    window.addEventListener("resize", updateWidth)

    return () => {
      observer.disconnect()
      window.removeEventListener("resize", updateWidth)
    }
  }, [mounted, player?.hand?.length])

  const ready = mounted && player && enemy
  const playerCanAct =
    ready &&
    turnTeam === "player" &&
    !enemyActing &&
    !victoryCelebrating

  const activeCard = selectedCard
  const activeDef = activeCard ? getCardDef(activeCard.key) : null

  const gap = isXs ? 6 : isSm ? 8 : 10
  const horizontalPadding = isXs ? 28 : isSm ? 36 : 46
  const maxCardWidth = isXs ? 88 : isSm ? 104 : 126
  const minCardWidth = isXs ? 54 : isSm ? 64 : 74
  const handCount = Math.max(1, player?.hand?.length || 1)
  const usableWidth = Math.max(0, handAreaWidth - horizontalPadding)
  const computedCardWidth = usableWidth
    ? Math.floor((usableWidth - gap * (handCount - 1)) / handCount)
    : maxCardWidth
  const cardWidth = Math.max(minCardWidth, Math.min(maxCardWidth, computedCardWidth))
  const cardHeight = Math.round(cardWidth * 1.42)

  function makeEffect({ cardKey, from, to }) {
    const id = `${cardKey}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    return { id, cardKey, from, to }
  }

  function pushEffect(effect, durationMs = 900) {
    const version = battleVersionRef.current
    setBattleEffects((prev) => [...prev, effect])
    window.setTimeout(() => {
      if (version !== battleVersionRef.current) return
      setBattleEffects((prev) => prev.filter((fx) => fx.id !== effect.id))
    }, durationMs)
  }

  function finishBattleReset(message) {
    battleVersionRef.current += 1
    battleResetRef.current = true
    enemyTurnRunningRef.current = false
    setEnemyActing(false)
    setEnemyActionCard(null)
    setVictoryCelebrating(false)

    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current)

    setNotice({ type: "success", text: message })
    resetTimeoutRef.current = setTimeout(() => {
      const nextPlayer = makePlayerState(true)
      const nextEnemy = makeEnemyState()
      setPlayer(nextPlayer)
      setEnemy(nextEnemy)
      playerRef.current = nextPlayer
      enemyRef.current = nextEnemy
      setTurnTeam("player")
      setTurnNumber((prev) => prev + 1)
      setEnemyActing(false)
      setEnemyActionCard(null)
      setSelectedCard(null)
      setBattleEffects([])
      setNotice({ type: "", text: "" })
      setVictoryCelebrating(false)
      battleResetRef.current = false
    }, 1200)
  }

  function resetBattle(message) {
    finishBattleReset(message)
  }

  function celebrateVictoryThenReset() {
    battleResetRef.current = true
    enemyTurnRunningRef.current = false
    setEnemyActing(false)
    setEnemyActionCard(null)
    setSelectedCard(null)
    setVictoryCelebrating(true)
    setNotice({ type: "success", text: "Enemy defeated!" })

    pushEffect(
      makeEffect({
        cardKey: "ion_shield",
        from: { x: PLAYER_LEFT, y: `${PLAYER_EFFECT_Y}px` },
        to: { x: PLAYER_LEFT, y: `${PLAYER_EFFECT_Y}px` },
      }),
      1150
    )

    window.setTimeout(() => {
      pushEffect(
        makeEffect({
          cardKey: "ion_shield",
          from: { x: PLAYER_LEFT, y: `${PLAYER_EFFECT_Y}px` },
          to: { x: PLAYER_LEFT, y: `${PLAYER_EFFECT_Y}px` },
        }),
        1150
      )
    }, 180)

    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current)
    resetTimeoutRef.current = setTimeout(() => {
      finishBattleReset("Enemy defeated. A new enemy rises.")
    }, 1450)
  }

  function applyCardEffects(source, target, card, sourceTeam) {
    const def = getCardDef(card.key)
    const effects = Array.isArray(def?.effects) ? def.effects : []

    let nextSource = { ...source }
    let nextTarget = { ...target }

    effects.forEach((effect) => {
      if (effect.kind === "damage") {
        nextTarget = applyDamage(nextTarget, Number(effect.amount || 0), sourceTeam)
      }
      if (effect.kind === "shield") {
        nextTarget = {
          ...nextTarget,
          shield: Number(nextTarget.shield || 0) + Number(effect.amount || 0),
          shieldActiveAgainst: sourceTeam === "player" ? "enemy" : "player",
        }
      }
    })

    return { nextSource, nextTarget }
  }

  function removeSpecificCard(actor, cardInstanceId) {
    const handIndex = actor.hand.findIndex((card) => card.instanceId === cardInstanceId)
    if (handIndex === -1) return actor
    const hand = [...actor.hand]
    const [card] = hand.splice(handIndex, 1)
    const discard = [...actor.discard, card]
    return { ...actor, hand, discard }
  }

  function pickEnemyTurnMoves(count = ENEMY_MOVES_PER_TURN) {
    const result = []
    for (let i = 0; i < count; i += 1) {
      const key = ENEMY_MOVE_POOL[Math.floor(Math.random() * ENEMY_MOVE_POOL.length)]
      const def = getCardDef(key)
      if (def) result.push(cloneCard(def))
    }
    return result
  }

  function startPlayerTurn() {
    enemyTurnRunningRef.current = false
    setPlayer((prev) => {
      const expired = expireShieldForTurn(prev, "enemy")
      let next = { ...expired, energy: expired.energyPerTurn }
      next = drawCards(next, PLAYER_OPENING_HAND)
      playerRef.current = next
      return next
    })
    setTurnTeam("player")
    setTurnNumber((prev) => prev + 1)
    setEnemyActing(false)
    setEnemyActionCard(null)
    setSelectedCard(null)
  }

  async function runEnemyTurn() {
    if (enemyTurnRunningRef.current || victoryCelebrating) return
    const version = battleVersionRef.current

    enemyTurnRunningRef.current = true
    battleResetRef.current = false
    setEnemyActing(true)
    setTurnTeam("enemy")
    setSelectedCard(null)

    const wait = (ms) =>
      new Promise((resolve) => {
        window.setTimeout(resolve, ms)
      })

    try {
      let currentEnemy = { ...enemyRef.current, energy: ENEMY_ENERGY_PER_TURN }
      let currentPlayer = { ...playerRef.current }
      const queuedMoves = pickEnemyTurnMoves(ENEMY_MOVES_PER_TURN)

      enemyRef.current = currentEnemy
      setEnemy({ ...currentEnemy })

      await wait(500)
      if (version !== battleVersionRef.current) return

      for (const card of queuedMoves) {
        if (!card) break
        if (currentEnemy.energy <= 0) break
        if (battleResetRef.current) return

        const def = getCardDef(card.key)
        if (!def) continue

        setEnemyActionCard(card)

        await wait(850)
        if (version !== battleVersionRef.current) return

        if (def.targetType === TARGET_TYPES.ENEMY) {
          pushEffect(
            makeEffect({
              cardKey: card.key,
              from: { x: MID_LEFT, y: `${ENEMY_CARD_PREVIEW_Y}px` },
              to: { x: PLAYER_LEFT, y: `${PLAYER_EFFECT_Y}px` },
            }),
            Math.round((def.effectMotion?.duration || 0.8) * 1000 + 260)
          )

          const applied = applyCardEffects(currentEnemy, currentPlayer, card, "enemy")
          currentEnemy = {
            ...applied.nextSource,
            energy: Math.max(0, Number(currentEnemy.energy || 0) - Number(card.cost || 0)),
          }
          currentPlayer = applied.nextTarget
        }

        if (def.targetType === TARGET_TYPES.SELF) {
          pushEffect(
            makeEffect({
              cardKey: card.key,
              from: { x: MID_LEFT, y: `${ENEMY_CARD_PREVIEW_Y}px` },
              to: { x: ENEMY_LEFT, y: `${ENEMY_EFFECT_Y}px` },
            }),
            Math.round((def.effectMotion?.duration || 0.8) * 1000 + 260)
          )

          const applied = applyCardEffects(currentEnemy, currentEnemy, card, "enemy")
          currentEnemy = {
            ...applied.nextTarget,
            energy: Math.max(0, Number(currentEnemy.energy || 0) - Number(card.cost || 0)),
          }
        }

        enemyRef.current = currentEnemy
        playerRef.current = currentPlayer
        setEnemy({ ...currentEnemy })
        setPlayer({ ...currentPlayer })

        await wait(1700)
        if (version !== battleVersionRef.current) return

        setEnemyActionCard(null)

        await wait(350)
        if (version !== battleVersionRef.current) return

        if (currentPlayer.health <= 0) {
          battleResetRef.current = true
          resetBattle("Your rocketship was destroyed. Battle restarted.")
          return
        }

        if (currentEnemy.health <= 0) {
          celebrateVictoryThenReset()
          return
        }
      }

      currentPlayer = expireShieldForTurn(currentPlayer, "enemy")
      enemyRef.current = currentEnemy
      playerRef.current = currentPlayer
      setEnemy({ ...currentEnemy })
      setPlayer({ ...currentPlayer })

      if (!battleResetRef.current) {
        startPlayerTurn()
      }
    } catch (error) {
      if (version !== battleVersionRef.current) return
      console.error("Enemy turn failed:", error)
      setNotice({
        type: "error",
        text: error?.message || "Enemy turn failed. Resetting turn.",
      })

      if (!battleResetRef.current) {
        setEnemyActionCard(null)
        setEnemyActing(false)
        enemyTurnRunningRef.current = false
        setTurnTeam("player")
      }
    } finally {
      if (version === battleVersionRef.current && !battleResetRef.current) {
        setEnemyActionCard(null)
        setEnemyActing(false)
        enemyTurnRunningRef.current = false
      }
    }
  }

  function clearSelection() {
    setSelectedCard(null)
  }

  async function handleTargetClick({ card, targetType }) {
    if (!ready || !playerCanAct || !card?.instanceId) {
      clearSelection()
      return
    }

    const sourceCard = player.hand.find((c) => c.instanceId === card.instanceId)
    if (!sourceCard) {
      clearSelection()
      return
    }

    if (Number(sourceCard.cost || 0) > Number(player.energy || 0)) {
      clearSelection()
      return
    }

    const def = getCardDef(sourceCard.key)
    let nextPlayer = { ...player }
    let nextEnemy = { ...enemy }
    let played = false

    if (targetType === "enemy" && def?.targetType === TARGET_TYPES.ENEMY) {
      pushEffect(
        makeEffect({
          cardKey: sourceCard.key,
          from: { x: PLAYER_LEFT, y: `${PLAYER_CARD_EFFECT_Y}px` },
          to: { x: ENEMY_LEFT, y: `${PLAYER_CARD_EFFECT_Y}px` },
        }),
        Math.round((def.effectMotion?.duration || 0.8) * 1000 + 150)
      )

      const applied = applyCardEffects(nextPlayer, nextEnemy, sourceCard, "player")
      nextPlayer = removeSpecificCard(applied.nextSource, sourceCard.instanceId)
      nextPlayer.energy = Math.max(0, Number(player.energy || 0) - Number(sourceCard.cost || 0))
      nextEnemy = applied.nextTarget
      played = true
    }

    if (targetType === "self" && def?.targetType === TARGET_TYPES.SELF) {
      pushEffect(
        makeEffect({
          cardKey: sourceCard.key,
          from: { x: PLAYER_LEFT, y: `${PLAYER_CARD_EFFECT_Y}px` },
          to: { x: PLAYER_LEFT, y: `${PLAYER_CARD_EFFECT_Y}px` },
        }),
        Math.round((def.effectMotion?.duration || 0.8) * 1000 + 150)
      )

      const applied = applyCardEffects(nextPlayer, nextPlayer, sourceCard, "player")
      nextPlayer = applied.nextTarget
      nextPlayer = removeSpecificCard(nextPlayer, sourceCard.instanceId)
      nextPlayer.energy = Math.max(0, Number(player.energy || 0) - Number(sourceCard.cost || 0))
      played = true
    }

    if (!played) return

    playerRef.current = nextPlayer
    enemyRef.current = nextEnemy
    setPlayer(nextPlayer)
    setEnemy(nextEnemy)
    clearSelection()

    if (nextEnemy.health <= 0) {
      celebrateVictoryThenReset()
      return
    }

    if (nextPlayer.health <= 0) {
      resetBattle("Your rocketship was destroyed. Battle restarted.")
      return
    }

    if (nextPlayer.energy <= 0) {
      const cleanedEnemy = expireShieldForTurn(nextEnemy, "player")
      enemyRef.current = cleanedEnemy
      setEnemy(cleanedEnemy)

      const discardedPlayer = discardHand(nextPlayer)
      playerRef.current = discardedPlayer
      setPlayer(discardedPlayer)

      await runEnemyTurn()
    }
  }

  async function handlePassTurn() {
    if (!playerCanAct || victoryCelebrating) return

    setSelectedCard(null)

    const cleanedEnemy = expireShieldForTurn(enemyRef.current, "player")
    enemyRef.current = cleanedEnemy
    setEnemy(cleanedEnemy)

    const discardedPlayer = discardHand(playerRef.current)
    playerRef.current = discardedPlayer
    setPlayer(discardedPlayer)

    await runEnemyTurn()
  }

  function handleManualReset() {
    battleVersionRef.current += 1
    battleResetRef.current = false
    enemyTurnRunningRef.current = false
    setVictoryCelebrating(false)
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current)
    const nextPlayer = makePlayerState(true)
    const nextEnemy = makeEnemyState()
    setPlayer(nextPlayer)
    setEnemy(nextEnemy)
    playerRef.current = nextPlayer
    enemyRef.current = nextEnemy
    setTurnTeam("player")
    setTurnNumber(1)
    setEnemyActing(false)
    setEnemyActionCard(null)
    setSelectedCard(null)
    setBattleEffects([])
    setNotice({ type: "", text: "" })
  }

  if (!ready) {
    return (
      <Box
        sx={{
          width: "100%",
          minHeight: "100vh",
          background: "black",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
        }}
      >
        <Typography sx={{ color: "rgba(216,229,254,0.84)" }}>
          Loading battle...
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      onClick={() => {
        if (selectedCard) setSelectedCard(null)
      }}
      sx={{
        width: "100vw",
        maxWidth: "100%",
        px: 0,
        pb: 0,
      }}
    >
      <Box sx={{ width: "100%" }}>
        <Stack spacing={1.25}>
          <Box
            sx={{
              borderRadius: 4,
              background: "black",
              boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
              px: { xs: 1.5, sm: 2, md: 2.5 },
              py: 1.5,
            }}
          >
            <Stack spacing={1.2}>
              <Stack
                direction={{ xs: "column", lg: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", lg: "center" }}
                spacing={1.2}
              >
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <StatPill label="Turn" value={turnNumber} small />
                  <StatPill
                    label="Active"
                    value={
                      victoryCelebrating
                        ? "victory"
                        : turnTeam === "player"
                        ? "player"
                        : "enemy"
                    }
                    small
                  />
                  <StatPill label="Player EN" value={player.energy} small />
                  <StatPill label="Enemy EN" value={enemy.energy} small />
                  <StatPill label="Hand" value={player.hand.length} small />
                </Stack>
              </Stack>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent="space-between"
              >
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button
                    onClick={handlePassTurn}
                    disabled={!playerCanAct}
                    startIcon={<HourglassBottomRoundedIcon />}
                    sx={{
                      textTransform: "none",
                      borderRadius: 3,
                      py: 0.9,
                      px: 1.6,
                      minHeight: 38,
                    }}
                  >
                    Pass Turn
                  </Button>

                  <Button
                    onClick={handleManualReset}
                    startIcon={<ReplayRoundedIcon />}
                    sx={{
                      textTransform: "none",
                      borderRadius: 3,
                      py: 0.9,
                      px: 1.6,
                      minHeight: 38,
                    }}
                  >
                    Reset Battle
                  </Button>
                </Stack>

                {activeDef ? (
                  <Chip
                    label={`Target: ${activeDef.targetType === TARGET_TYPES.SELF ? "Self" : "Enemy"}`}
                    sx={{
                      color: "rgba(245,248,255,0.96)",
                      background: "black",
                    }}
                  />
                ) : null}
              </Stack>

              {notice.text ? (
                <Alert
                  severity={notice.type === "success" ? "success" : "error"}
                  sx={{ borderRadius: 2.5 }}
                >
                  {notice.text}
                </Alert>
              ) : null}
            </Stack>
          </Box>

          <Box
            sx={{
              width: "100%",
              borderRadius: 4,
              background: "black",
              p: { xs: 1, sm: 1.5, md: 2 },
            }}
          >
            <Box
              sx={{
                position: "relative",
                width: "100%",
                minHeight: BATTLEFIELD_HEIGHT,
                borderRadius: 4,
                overflow: "hidden",
                background: "black",
              }}
            >
              <BattlefieldPlayer
                player={player}
                activeCard={activeCard}
                onTargetClick={handleTargetClick}
              />

              <BattlefieldMonster
                monster={enemy}
                activeCard={activeCard}
                onTargetClick={handleTargetClick}
              />

              {playerCanAct && player.energy <= 0 ? (
                <Box
                  sx={{
                    position: "absolute",
                    left: "50%",
                    top: PASS_TURN_TOP_PX,
                    transform: "translateX(-50%)",
                    zIndex: 6,
                  }}
                >
                  <Button
                    onClick={handlePassTurn}
                    startIcon={<HourglassBottomRoundedIcon />}
                    sx={{
                      textTransform: "none",
                      borderRadius: 999,
                      px: 2,
                      py: 1,
                      minHeight: 42,
                      color: "rgba(245,248,255,0.96)",
                      background: "black",
                      boxShadow: "0 12px 28px rgba(0,0,0,0.35)",
                      "&:hover": {
                        background: "black",
                      },
                    }}
                  >
                    Pass Turn
                  </Button>
                </Box>
              ) : null}

              <AnimatePresence mode="wait">
                {enemyActionCard ? (
                  <EnemyActionCard
                    key={enemyActionCard.instanceId}
                    card={enemyActionCard}
                    visible
                  />
                ) : null}
              </AnimatePresence>

              <BattleEffectLayer effects={battleEffects} />
              <VictoryCelebration visible={victoryCelebrating} />
            </Box>
          </Box>

          <HandContainer
            cards={player.hand}
            canAct={playerCanAct}
            currentEnergy={player.energy}
            selectedCard={selectedCard}
            setSelectedCard={setSelectedCard}
            disabled={victoryCelebrating}
            handMeasureRef={handMeasureRef}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            gap={gap}
            turnTeam={turnTeam}
            enemyActing={enemyActing}
          />
        </Stack>
      </Box>
    </Box>
  )
}
