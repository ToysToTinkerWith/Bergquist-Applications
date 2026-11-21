import {
  getIndexerClient,
  loadCustodialWallet,
  verifyFirebaseUser,
} from "../../lib/algorandAgent"

const TINYMAN_ASA_LIST_URL = "https://asa-list.tinyman.org/assets.json"
const TINYMAN_ASSET_ICON_BASE = "https://asa-list.tinyman.org/assets"
const ASA_LIST_CACHE_MS = 60 * 60 * 1000
const MAX_ASSETS_TO_ENRICH = 80

let asaListCache = {
  loadedAt: 0,
  data: null,
}

function asAssetId(value) {
  const text = String(value || "").trim()
  return /^\d+$/.test(text) ? text : ""
}

function asAmountString(value) {
  if (value == null) return "0"
  return String(value).replace(/[^\d]/g, "") || "0"
}

async function loadTinymanAsaList() {
  if (
    asaListCache.data &&
    Date.now() - asaListCache.loadedAt < ASA_LIST_CACHE_MS
  ) {
    return asaListCache.data
  }

  const response = await fetch(TINYMAN_ASA_LIST_URL)
  if (!response.ok) throw new Error("Could not load ASA icon list.")
  const data = await response.json()
  asaListCache = {
    loadedAt: Date.now(),
    data: data && typeof data === "object" ? data : {},
  }
  return asaListCache.data
}

function tinymanIconUrl(assetId, assetListEntry) {
  return (
    assetListEntry?.logo?.png ||
    `${TINYMAN_ASSET_ICON_BASE}/${encodeURIComponent(assetId)}/icon.png`
  )
}

async function fetchAssetInfo(indexer, assetId, asaList) {
  const listEntry = asaList?.[String(assetId)] || null
  let params = {}

  try {
    const assetResponse = await indexer.lookupAssetByID(Number(assetId)).do()
    params = assetResponse?.asset?.params || {}
  } catch {
    params = {}
  }

  return {
    assetId: String(assetId),
    name: params.name || listEntry?.name || `Asset ${assetId}`,
    unitName: params["unit-name"] || listEntry?.unit_name || "",
    decimals: Number(params.decimals ?? listEntry?.decimals ?? 0) || 0,
    url: params.url || listEntry?.url || "",
    iconUrl: tinymanIconUrl(assetId, listEntry),
    iconSource: listEntry?.logo?.png ? "tinyman-list" : "tinyman-dynamic",
  }
}

function sortAssets(a, b) {
  const left = BigInt(asAmountString(a.amount))
  const right = BigInt(asAmountString(b.amount))
  if (left === right) return Number(a.assetId) - Number(b.assetId)
  return right > left ? 1 : -1
}

export default async function algorandWalletHoldings(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    res.status(405).json({ error: "Method not allowed." })
    return
  }

  try {
    const decodedUser = await verifyFirebaseUser(req)
    const wallet = await loadCustodialWallet(decodedUser.uid)
    const indexer = getIndexerClient()
    const [accountResponse, asaList] = await Promise.all([
      indexer.lookupAccountByID(wallet.address).do().catch((error) => {
        const message = String(error?.message || "").toLowerCase()
        if (
          message.includes("no accounts found") ||
          message.includes("404") ||
          message.includes("not found")
        ) {
          return { account: null }
        }
        throw error
      }),
      loadTinymanAsaList().catch(() => ({})),
    ])

    const account = accountResponse?.account || {}
    const rawAssets = Array.isArray(account.assets) ? account.assets : []
    const heldAssets = rawAssets
      .map((holding) => ({
        assetId: asAssetId(holding?.["asset-id"]),
        amount: asAmountString(holding?.amount),
        isFrozen: Boolean(holding?.["is-frozen"]),
      }))
      .filter((holding) => holding.assetId && BigInt(holding.amount) > 0n)
      .slice(0, MAX_ASSETS_TO_ENRICH)

    const enrichedAssets = await Promise.all(
      heldAssets.map(async (holding) => ({
        ...holding,
        ...(await fetchAssetInfo(indexer, holding.assetId, asaList)),
      }))
    )

    const algoEntry = asaList?.["0"] || null

    res.status(200).json({
      wallet: {
        address: wallet.address,
      },
      algo: {
        assetId: "0",
        name: "Algorand",
        unitName: "ALGO",
        decimals: 6,
        amount: asAmountString(account.amount),
        iconUrl: tinymanIconUrl("0", algoEntry),
      },
      assets: enrichedAssets.sort(sortAssets),
      assetCount: rawAssets.length,
      nonZeroAssetCount: enrichedAssets.length,
      existsOnChain: Boolean(account.address || account.amount || rawAssets.length),
    })
  } catch (error) {
    console.error("algorand-wallet-holdings error:", error)
    res.status(error.statusCode || 500).json({
      error: error.message || "Could not load Algorand wallet holdings.",
    })
  }
}
