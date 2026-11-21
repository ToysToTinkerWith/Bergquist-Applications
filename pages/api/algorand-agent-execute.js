import {
  cleanText,
  confirmationTextForPlan,
  createAssetTransferTransaction,
  createPaymentTransaction,
  loadCustodialWallet,
  loadPlan,
  markPlanStatus,
  MAX_EXECUTION_ASSET_UNITS,
  MAX_EXECUTION_MICROALGOS,
  signAndSendTransactions,
  verifyFirebaseUser,
} from "../../lib/algorandAgent"
import { adminFieldValue, getFirestore } from "../../lib/firebaseAdmin"

function assertConfirmation(plan, confirmationText) {
  const expected = confirmationTextForPlan(plan)
  if (!expected || cleanText(confirmationText) !== expected) {
    const error = new Error("Confirmation text did not match the payment plan.")
    error.statusCode = 400
    throw error
  }
}

function assertImmediateLimits(plan) {
  if (
    plan.action === "algo_transfer" &&
    Number(plan.amountMicroAlgos || 0) > MAX_EXECUTION_MICROALGOS
  ) {
    const error = new Error(
      "This ALGO transfer is above the immediate signing limit. Create a scheduled/batch job instead."
    )
    error.statusCode = 400
    throw error
  }

  if (
    plan.action === "asset_transfer" &&
    Number(plan.assetAmount || 0) > MAX_EXECUTION_ASSET_UNITS
  ) {
    const error = new Error(
      "This asset transfer is above the immediate signing limit. Create a scheduled/batch job instead."
    )
    error.statusCode = 400
    throw error
  }
}

function getPaymentJobTotal(plan, kind) {
  const estimated = Number(
    plan?.estimatedTransactionCount || plan?.previewRecipientCount || plan?.recipientCount || 0
  )
  if (estimated > 0) return estimated
  return kind === "scheduled" ? 1 : 0
}

function getInitialJobStatusMessage(plan, kind) {
  if (kind === "scheduled") {
    return plan?.startLocal
      ? `Waiting for scheduled start: ${plan.startLocal}.`
      : "Waiting for the scheduled payment worker."
  }

  return "Queued for batched payment execution."
}

async function createPaymentJob({ uid, plan, kind }) {
  const jobRef = getFirestore()
    .collection("users")
    .doc(uid)
    .collection("algorandPaymentJobs")
    .doc()

  const job = {
    kind,
    planId: plan.planId,
    action: plan.action,
    status: kind === "scheduled" ? "scheduled" : "queued",
    plan,
    totalCount: getPaymentJobTotal(plan, kind),
    statusMessage: getInitialJobStatusMessage(plan, kind),
    scheduledForLocal: plan.startLocal || "",
    frequency: plan.frequency || "",
    batchSize: 16,
    processedCount: 0,
    failureCount: 0,
    nextCursor: "",
    createdAt: adminFieldValue.serverTimestamp(),
    updatedAt: adminFieldValue.serverTimestamp(),
  }

  await jobRef.set(job)

  return {
    id: jobRef.id,
    ...job,
    createdAt: null,
    updatedAt: null,
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    res.status(405).json({ error: "Method not allowed." })
    return
  }

  try {
    const decodedUser = await verifyFirebaseUser(req)
    const planId = cleanText(req.body?.planId)
    if (!planId) {
      res.status(400).json({ error: "Missing planId." })
      return
    }

    const plan = await loadPlan({ uid: decodedUser.uid, planId })
    if (plan.status && plan.status !== "draft") {
      res.status(400).json({ error: "This payment plan is no longer a draft." })
      return
    }

    assertConfirmation(plan, req.body?.confirmationText)

    const wallet = await loadCustodialWallet(decodedUser.uid)
    if (!wallet.mnemonic) {
      res.status(400).json({
        error: "No mnemonic is available for this custodial wallet.",
      })
      return
    }

    if (plan.action === "scheduled_transfer") {
      const job = await createPaymentJob({
        uid: decodedUser.uid,
        plan,
        kind: "scheduled",
      })
      await markPlanStatus({
        uid: decodedUser.uid,
        planId,
        status: "scheduled",
        extra: { jobId: job.id },
      })
      res.status(200).json({
        mode: "job",
        answer:
          "Scheduled payment job created. A worker can execute it at the planned time.",
        job,
      })
      return
    }

    if (plan.action === "asset_holder_airdrop") {
      const job = await createPaymentJob({
        uid: decodedUser.uid,
        plan,
        kind: "airdrop",
      })
      await markPlanStatus({
        uid: decodedUser.uid,
        planId,
        status: "queued",
        extra: { jobId: job.id },
      })
      res.status(200).json({
        mode: "job",
        answer:
          "Holder-airdrop job created. It is queued for batched execution with reviewable progress.",
        job,
      })
      return
    }

    assertImmediateLimits(plan)

    let txn
    if (plan.action === "algo_transfer") {
      txn = await createPaymentTransaction({
        from: wallet.address,
        to: plan.to,
        amountMicroAlgos: Number(plan.amountMicroAlgos || 0),
        note: plan.note,
      })
    } else if (plan.action === "asset_transfer") {
      txn = await createAssetTransferTransaction({
        from: wallet.address,
        to: plan.to,
        assetId: Number(plan.assetId || 0),
        assetAmount: Number(plan.assetAmount || 0),
        note: plan.note,
      })
    } else {
      res.status(400).json({
        error: "This payment plan cannot be executed by this endpoint.",
      })
      return
    }

    const result = await signAndSendTransactions({
      mnemonic: wallet.mnemonic,
      transactions: [txn],
    })

    await markPlanStatus({
      uid: decodedUser.uid,
      planId,
      status: "submitted",
      extra: {
        txId: result.txId,
        submittedAt: adminFieldValue.serverTimestamp(),
      },
    })

    res.status(200).json({
      mode: "submitted",
      answer: "Transaction signed and submitted to Algorand.",
      txId: result.txId,
      confirmation: result.confirmation || null,
    })
  } catch (error) {
    console.error("algorand-agent-execute error:", error)
    res.status(error.statusCode || 500).json({
      error: error.message || "Failed to execute Algorand payment plan.",
    })
  }
}
