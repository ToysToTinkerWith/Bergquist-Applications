import OpenAI from "openai"
import {
  MAX_BATCH_PREVIEW_RECIPIENTS,
  asPositiveInteger,
  cleanAddress,
  cleanText,
  loadCustodialWallet,
  microalgosFromAlgo,
  previewAssetHolders,
  publicPlan,
  storePlan,
  verifyFirebaseUser,
} from "../../lib/algorandAgent"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.DALLE_KEY,
})

function parseJson(text) {
  const raw = String(text || "").trim()
  try {
    return JSON.parse(raw)
  } catch {}

  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) return null

  try {
    return JSON.parse(match[0])
  } catch {
    return null
  }
}

function normalizeFrequency(value) {
  const text = cleanText(value).toLowerCase()
  if (["once", "daily", "weekly", "monthly"].includes(text)) return text
  return "once"
}

function normalizeClarificationContext(value) {
  const originalPrompt = cleanText(value?.originalPrompt).slice(0, 1200)
  const messages = Array.isArray(value?.messages)
    ? value.messages
        .map((message) => ({
          role: message?.role === "assistant" ? "assistant" : "user",
          content: cleanText(message?.content).slice(0, 700),
        }))
        .filter((message) => message.content)
        .slice(-8)
    : []

  if (!originalPrompt && !messages.length) return null

  return {
    originalPrompt,
    messages,
  }
}

function buildEffectivePrompt(prompt, clarificationContext) {
  if (!clarificationContext) return prompt

  const priorMessages = clarificationContext.messages
    .map((message) => `${message.role === "assistant" ? "Assistant" : "User"}: ${message.content}`)
    .join("\n")

  return [
    "The latest user message is an answer to a clarification question for the same Algorand payment draft.",
    "Use all of this context together. Do not treat the latest answer as a new standalone request.",
    "",
    clarificationContext.originalPrompt
      ? `Original request:\n${clarificationContext.originalPrompt}`
      : "",
    priorMessages ? `Prior clarification conversation:\n${priorMessages}` : "",
    `Latest user answer:\n${prompt}`,
  ]
    .filter(Boolean)
    .join("\n\n")
}

function buildStoredPrompt(prompt, clarificationContext) {
  if (!clarificationContext) return prompt

  const priorMessages = clarificationContext.messages
    .map((message) => `${message.role === "assistant" ? "Assistant" : "User"}: ${message.content}`)
    .join("\n")

  return [
    clarificationContext.originalPrompt
      ? `Original request: ${clarificationContext.originalPrompt}`
      : "",
    priorMessages,
    `Latest answer: ${prompt}`,
  ]
    .filter(Boolean)
    .join("\n")
}

function normalizePlan(raw, prompt) {
  const action = cleanText(raw?.action).toLowerCase()
  const note = cleanText(raw?.note || raw?.memo || "").slice(0, 700)
  const summary = cleanText(raw?.summary || raw?.answer || "")

  if (action === "clarify") {
    return {
      action: "clarify",
      answer:
        cleanText(raw?.answer || raw?.question) ||
        "What recipient, amount, and asset should I use?",
    }
  }

  if (action === "unsupported") {
    return {
      action: "unsupported",
      answer:
        cleanText(raw?.answer) ||
        "I can draft ALGO transfers, ASA transfers, scheduled transfer jobs, and holder-airdrop jobs right now.",
    }
  }

  if (action === "algo_transfer") {
    const to = cleanAddress(raw?.to || raw?.recipient)
    const amountMicroAlgos =
      asPositiveInteger(raw?.amountMicroAlgos) ||
      microalgosFromAlgo(raw?.amountAlgo || raw?.algoAmount || raw?.amount)

    if (!to || !amountMicroAlgos) {
      return {
        action: "clarify",
        answer: "What Algorand address and ALGO amount should I send?",
      }
    }

    return {
      action,
      to,
      amountMicroAlgos,
      note,
      summary:
        summary ||
        `Send ${amountMicroAlgos / 1_000_000} ALGO to ${to}.`,
      estimatedTransactionCount: 1,
    }
  }

  if (action === "asset_transfer") {
    const to = cleanAddress(raw?.to || raw?.recipient)
    const assetId = asPositiveInteger(raw?.assetId || raw?.assetIndex)
    const assetAmount = asPositiveInteger(raw?.assetAmount || raw?.amount)

    if (!to || !assetId || !assetAmount) {
      return {
        action: "clarify",
        answer:
          "What recipient address, asset ID, and asset-unit amount should I send?",
      }
    }

    return {
      action,
      to,
      assetId,
      assetAmount,
      note,
      summary:
        summary ||
        `Send ${assetAmount} units of asset ${assetId} to ${to}.`,
      estimatedTransactionCount: 1,
    }
  }

  if (action === "scheduled_transfer") {
    const transferType = cleanText(raw?.transferType).toLowerCase() === "asset"
      ? "asset"
      : "algo"
    const to = cleanAddress(raw?.to || raw?.recipient)
    const startLocal = cleanText(raw?.startLocal || raw?.startDateTime)
    const frequency = normalizeFrequency(raw?.frequency)
    const assetId = asPositiveInteger(raw?.assetId || raw?.assetIndex)
    const assetAmount = asPositiveInteger(raw?.assetAmount || raw?.amount)
    const amountMicroAlgos =
      asPositiveInteger(raw?.amountMicroAlgos) ||
      microalgosFromAlgo(raw?.amountAlgo || raw?.algoAmount || raw?.amount)

    if (!to || !startLocal) {
      return {
        action: "clarify",
        answer: "What recipient address and date/time should I schedule?",
      }
    }

    if (transferType === "asset" && (!assetId || !assetAmount)) {
      return {
        action: "clarify",
        answer: "What asset ID and asset-unit amount should I schedule?",
      }
    }

    if (transferType === "algo" && !amountMicroAlgos) {
      return {
        action: "clarify",
        answer: "How much ALGO should I schedule?",
      }
    }

    return {
      action,
      transferType,
      to,
      ...(transferType === "asset"
        ? { assetId, assetAmount }
        : { amountMicroAlgos }),
      startLocal,
      frequency,
      note,
      summary:
        summary ||
        `Schedule a ${frequency} ${transferType} transfer to ${to}.`,
      estimatedTransactionCount: 1,
    }
  }

  if (action === "asset_holder_airdrop") {
    const holderAssetId = asPositiveInteger(raw?.holderAssetId || raw?.assetId)
    const transferType = cleanText(raw?.transferType).toLowerCase() === "asset"
      ? "asset"
      : "algo"
    const outgoingAssetId = asPositiveInteger(
      raw?.outgoingAssetId || raw?.sendAssetId
    )
    const assetAmount = asPositiveInteger(raw?.assetAmount || raw?.amount)
    const amountMicroAlgos =
      asPositiveInteger(raw?.amountMicroAlgos) ||
      microalgosFromAlgo(raw?.amountAlgo || raw?.algoAmount || raw?.amount)
    const maxRecipients = Math.min(
      asPositiveInteger(raw?.maxRecipients, 250),
      MAX_BATCH_PREVIEW_RECIPIENTS
    )
    const frequency = normalizeFrequency(raw?.frequency)
    const startLocal = cleanText(raw?.startLocal || raw?.startDateTime)

    if (!holderAssetId) {
      return {
        action: "clarify",
        answer: "Which asset ID should I use to find holder accounts?",
      }
    }

    if (transferType === "asset" && (!outgoingAssetId || !assetAmount)) {
      return {
        action: "clarify",
        answer:
          "What outgoing asset ID and asset-unit amount should each holder receive?",
      }
    }

    if (transferType === "algo" && !amountMicroAlgos) {
      return {
        action: "clarify",
        answer: "How much ALGO should each holder receive?",
      }
    }

    return {
      action,
      holderAssetId,
      transferType,
      ...(transferType === "asset"
        ? { outgoingAssetId, assetAmount }
        : { amountMicroAlgos }),
      maxRecipients,
      frequency,
      ...(startLocal ? { startLocal } : {}),
      note,
      summary:
        summary ||
        `Create a holder-airdrop job for accounts holding asset ${holderAssetId}.`,
      estimatedTransactionCount: maxRecipients,
    }
  }

  return {
    action: "clarify",
    answer:
      "Should this be an ALGO transfer, an asset transfer, a scheduled transfer, or an airdrop job?",
  }
}

async function askModelForPlan({ prompt, walletAddress, timeZone }) {
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_HERO_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You turn plain-language Algorand payment requests into conservative JSON plans. Never invent recipient addresses, asset IDs, dates, or amounts. Ask one clarifying question when details are missing. Do not create arbitrary smart-contract calls. Return only valid JSON.",
      },
      {
        role: "system",
        content:
          "When the prompt includes an original request, prior clarification conversation, and latest user answer, merge those details into one payment plan. For example, if the original request was an asset-holder airdrop and the latest answer is a number after a maximum-recipient question, use that number as maxRecipients.",
      },
      {
        role: "system",
        content:
          'Return one of these JSON shapes: {"action":"clarify","answer":"one question"} or {"action":"unsupported","answer":"short reason"} or {"action":"algo_transfer","to":"Algorand address","amountAlgo":number,"note":"optional","summary":"short"} or {"action":"asset_transfer","to":"Algorand address","assetId":number,"assetAmount":integer,"note":"optional","summary":"short"} or {"action":"scheduled_transfer","transferType":"algo|asset","to":"Algorand address","amountAlgo":number,"assetId":number,"assetAmount":integer,"startLocal":"YYYY-MM-DDTHH:mm","frequency":"once|daily|weekly|monthly","note":"optional","summary":"short"} or {"action":"asset_holder_airdrop","holderAssetId":number,"transferType":"algo|asset","amountAlgo":number,"outgoingAssetId":number,"assetAmount":integer,"maxRecipients":integer,"startLocal":"optional YYYY-MM-DDTHH:mm","frequency":"once|daily|weekly|monthly","note":"optional","summary":"short"}. For asset amounts, use base asset units exactly as requested; do not adjust for decimals.',
      },
      {
        role: "system",
        content: `Wallet address: ${walletAddress}\nTimezone: ${timeZone}`,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.1,
    max_tokens: 520,
  })

  return parseJson(completion.choices?.[0]?.message?.content) || {}
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    res.status(405).json({ error: "Method not allowed." })
    return
  }

  try {
    if (!process.env.OPENAI_API_KEY && !process.env.DALLE_KEY) {
      res.status(500).json({ error: "OpenAI API key is not configured." })
      return
    }

    const prompt = cleanText(req.body?.prompt)
    if (!prompt) {
      res.status(400).json({ error: "Prompt is required." })
      return
    }

    const decodedUser = await verifyFirebaseUser(req)
    const wallet = await loadCustodialWallet(decodedUser.uid)
    const timeZone = cleanText(req.body?.timeZone, "America/Los_Angeles")
    const clarificationContext = normalizeClarificationContext(
      req.body?.clarificationContext
    )
    const effectivePrompt = buildEffectivePrompt(prompt, clarificationContext)
    const storedPrompt = buildStoredPrompt(prompt, clarificationContext)
    const rawPlan = await askModelForPlan({
      prompt: effectivePrompt,
      walletAddress: wallet.address,
      timeZone,
    })
    const normalized = normalizePlan(rawPlan, effectivePrompt)

    if (normalized.action === "clarify" || normalized.action === "unsupported") {
      res.status(200).json({
        mode: normalized.action,
        answer: normalized.answer,
        wallet: {
          address: wallet.address,
          hasMnemonic: wallet.hasMnemonic,
        },
      })
      return
    }

    if (normalized.action === "asset_holder_airdrop") {
      const recipients = await previewAssetHolders({
        assetId: normalized.holderAssetId,
        limit: normalized.maxRecipients,
      }).catch(() => [])
      normalized.recipientPreview = recipients.slice(0, 20)
      normalized.previewRecipientCount = recipients.length
    }

    const storedPlan = await storePlan({
      uid: decodedUser.uid,
      prompt: storedPrompt,
      plan: normalized,
    })

    res.status(200).json({
      mode: "plan",
      answer: "Review this Algorand payment plan before anything is signed.",
      wallet: {
        address: wallet.address,
        hasMnemonic: wallet.hasMnemonic,
      },
      plan: publicPlan(storedPlan),
    })
  } catch (error) {
    console.error("algorand-agent-plan error:", error)
    res.status(error.statusCode || 500).json({
      error: error.message || "Failed to create Algorand payment plan.",
    })
  }
}
