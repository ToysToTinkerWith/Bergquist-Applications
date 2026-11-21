import algosdk from "algosdk"
import { adminFieldValue, getAdminAuth, getFirestore } from "./firebaseAdmin"

export const ALGOD_SERVER =
  process.env.ALGOD_SERVER || "https://mainnet-api.algonode.cloud"
export const ALGOD_PORT = Number(process.env.ALGOD_PORT || 443)
export const INDEXER_SERVER =
  process.env.ALGO_INDEXER_SERVER || "https://mainnet-idx.algonode.cloud"
export const INDEXER_PORT = Number(process.env.ALGO_INDEXER_PORT || 443)
export const ALGORAND_NETWORK = process.env.ALGORAND_NETWORK || "mainnet"

export const MAX_IMMEDIATE_TXNS = 16
export const MAX_BATCH_PREVIEW_RECIPIENTS = 2000
export const MAX_EXECUTION_MICROALGOS = 10_000_000
export const MAX_EXECUTION_ASSET_UNITS = 1_000_000_000

export function getAlgodClient() {
  return new algosdk.Algodv2("", ALGOD_SERVER, ALGOD_PORT)
}

export function getIndexerClient() {
  return new algosdk.Indexer("", INDEXER_SERVER, INDEXER_PORT)
}

export async function verifyFirebaseUser(req) {
  const authHeader = req.headers.authorization || ""
  const bodyToken = req.body?.idToken || ""
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "").trim()
    : String(bodyToken || "").trim()

  if (!token) {
    const error = new Error("Missing Firebase auth token.")
    error.statusCode = 401
    throw error
  }

  return getAdminAuth().verifyIdToken(token)
}

export async function loadCustodialWallet(uid) {
  if (!uid) {
    const error = new Error("Missing user id.")
    error.statusCode = 401
    throw error
  }

  const db = getFirestore()
  const [walletSnap, secretSnap] = await Promise.all([
    db.collection("algoWallets").doc(uid).get(),
    db.collection("algoWalletSecrets").doc(uid).get(),
  ])

  if (!walletSnap.exists) {
    const error = new Error("No Algorand wallet exists for this account yet.")
    error.statusCode = 404
    throw error
  }

  const wallet = walletSnap.data() || {}
  const secret = secretSnap.exists ? secretSnap.data() || {} : {}
  const address = String(wallet.address || "").trim()
  const mnemonic = String(secret.mnemonic || "").trim()

  if (!address || !algosdk.isValidAddress(address)) {
    const error = new Error("The saved wallet address is not valid.")
    error.statusCode = 400
    throw error
  }

  return {
    address,
    mnemonic,
    hasMnemonic: Boolean(mnemonic),
  }
}

export function cleanText(value, fallback = "") {
  return String(value ?? fallback).trim()
}

export function cleanAddress(value) {
  const address = cleanText(value)
  return algosdk.isValidAddress(address) ? address : ""
}

export function microalgosFromAlgo(value) {
  const number = Number(value)
  if (!Number.isFinite(number) || number <= 0) return 0
  return Math.round(number * 1_000_000)
}

export function asPositiveInteger(value, fallback = 0) {
  const number = Number(value)
  if (!Number.isFinite(number) || number <= 0) return fallback
  return Math.floor(number)
}

export function normalizeNote(value) {
  const note = cleanText(value).slice(0, 700)
  return note ? new TextEncoder().encode(note) : undefined
}

export function confirmationTextForPlan(plan) {
  if (!plan) return ""

  if (plan.action === "algo_transfer") {
    return `SEND ${formatAlgo(plan.amountMicroAlgos)} ALGO TO ${plan.to}`
  }

  if (plan.action === "asset_transfer") {
    return `SEND ${plan.assetAmount} UNITS OF ASSET ${plan.assetId} TO ${plan.to}`
  }

  if (plan.action === "scheduled_transfer") {
    const value =
      plan.transferType === "asset"
        ? `${plan.assetAmount} UNITS OF ASSET ${plan.assetId}`
        : `${formatAlgo(plan.amountMicroAlgos)} ALGO`
    return `SCHEDULE ${value} TO ${plan.to}`
  }

  if (plan.action === "asset_holder_airdrop") {
    return `CREATE AIRDROP JOB FOR ASSET ${plan.holderAssetId}`
  }

  return ""
}

export function formatAlgo(microalgos) {
  return (Number(microalgos || 0) / 1_000_000).toLocaleString("en-US", {
    maximumFractionDigits: 6,
  })
}

export function makePlanId() {
  return `algo_plan_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

export function publicPlan(plan) {
  if (!plan) return null

  const confirmationText = confirmationTextForPlan(plan)
  return {
    ...plan,
    confirmationText,
    network: ALGORAND_NETWORK,
  }
}

export async function storePlan({ uid, prompt, plan }) {
  const planId = makePlanId()
  const confirmationText = confirmationTextForPlan(plan)
  const storedPlan = {
    ...plan,
    planId,
    prompt: cleanText(prompt),
    confirmationText,
    network: ALGORAND_NETWORK,
    status: "draft",
    createdAt: adminFieldValue.serverTimestamp(),
    updatedAt: adminFieldValue.serverTimestamp(),
  }

  await getFirestore()
    .collection("users")
    .doc(uid)
    .collection("algorandPaymentPlans")
    .doc(planId)
    .set(storedPlan)

  return publicPlan(storedPlan)
}

export async function loadPlan({ uid, planId }) {
  const snap = await getFirestore()
    .collection("users")
    .doc(uid)
    .collection("algorandPaymentPlans")
    .doc(planId)
    .get()

  if (!snap.exists) {
    const error = new Error("Payment plan was not found.")
    error.statusCode = 404
    throw error
  }

  return {
    planId: snap.id,
    ...snap.data(),
  }
}

export async function markPlanStatus({ uid, planId, status, extra = {} }) {
  await getFirestore()
    .collection("users")
    .doc(uid)
    .collection("algorandPaymentPlans")
    .doc(planId)
    .set(
      {
        status,
        ...extra,
        updatedAt: adminFieldValue.serverTimestamp(),
      },
      { merge: true }
    )
}

export async function createPaymentTransaction({ from, to, amountMicroAlgos, note }) {
  const params = await getAlgodClient().getTransactionParams().do()

  return algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from,
    to,
    amount: amountMicroAlgos,
    note: normalizeNote(note),
    suggestedParams: params,
  })
}

export async function createAssetTransferTransaction({
  from,
  to,
  assetId,
  assetAmount,
  note,
}) {
  const params = await getAlgodClient().getTransactionParams().do()

  return algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from,
    to,
    assetIndex: assetId,
    amount: assetAmount,
    note: normalizeNote(note),
    suggestedParams: params,
  })
}

export async function signAndSendTransactions({ mnemonic, transactions }) {
  if (!mnemonic) {
    const error = new Error("No mnemonic is available for this wallet.")
    error.statusCode = 400
    throw error
  }

  if (!transactions.length || transactions.length > MAX_IMMEDIATE_TXNS) {
    const error = new Error(
      `Immediate signing supports 1 to ${MAX_IMMEDIATE_TXNS} transactions.`
    )
    error.statusCode = 400
    throw error
  }

  const account = algosdk.mnemonicToSecretKey(mnemonic)
  if (transactions.length > 1) algosdk.assignGroupID(transactions)

  const signedTransactions = transactions.map((txn) => txn.signTxn(account.sk))
  const algod = getAlgodClient()
  const response = await algod.sendRawTransaction(signedTransactions).do()
  const txId = response.txId || transactions[0].txID().toString()
  const confirmation =
    typeof algosdk.waitForConfirmation === "function"
      ? await algosdk.waitForConfirmation(algod, txId, 4).catch(() => null)
      : null

  return {
    txId,
    confirmation,
  }
}

export async function previewAssetHolders({ assetId, limit = 200 }) {
  const indexer = getIndexerClient()
  const recipients = []
  let nextToken = ""

  while (recipients.length < Math.min(limit, MAX_BATCH_PREVIEW_RECIPIENTS)) {
    let request = indexer.lookupAssetBalances(assetId).limit(100)
    if (nextToken) request = request.nextToken(nextToken)
    const response = await request.do()
    const balances = Array.isArray(response.balances) ? response.balances : []

    for (const balance of balances) {
      if (Number(balance.amount || 0) <= 0) continue
      const address = String(balance.address || "")
      if (algosdk.isValidAddress(address)) recipients.push(address)
      if (recipients.length >= limit) break
    }

    nextToken = response["next-token"] || ""
    if (!nextToken || !balances.length) break
  }

  return recipients
}
