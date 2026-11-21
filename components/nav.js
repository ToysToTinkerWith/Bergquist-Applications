// Inactive account-enabled navigation, retained for a future account-system return.
// The public site currently mounts PublicNavigation instead.
// Requires:
// - @mui/material
// - framer-motion
// - next/router
// - firebase/auth
// - firebase/firestore
// - algosdk
// - qrcode.react
//
// Install if needed:
// npm install algosdk qrcode.react
//
// Make sure your Firebase init exports:
//   export const auth = getAuth(app)
//   export const db = getFirestore(app)

import SiteLink from "./SiteLink"
import React, { useEffect, useMemo, useState } from "react"
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  Modal,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material"
import { useTheme } from "@mui/material/styles"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/router"
import { QRCodeSVG } from "qrcode.react"

import CloseRoundedIcon from "@mui/icons-material/CloseRounded"
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined"
import GoogleIcon from "@mui/icons-material/Google"
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined"
import LockOutlinedIcon from "@mui/icons-material/LockOutlined"
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined"
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined"
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded"
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded"
import TokenRoundedIcon from "@mui/icons-material/TokenRounded"
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded"
import MenuRoundedIcon from "@mui/icons-material/MenuRounded"
import WidgetsRoundedIcon from "@mui/icons-material/WidgetsRounded"

import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  linkWithPopup,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth"
import { doc, onSnapshot } from "firebase/firestore"

import algosdk from "algosdk"
import { auth, db } from "../Firebase/FirebaseInit"

const indexerClient = new algosdk.Indexer(
  "",
  "https://mainnet-idx.algonode.cloud",
  443
)

function GradientTitle({ children, variant = "h5", align = "left", sx = {} }) {
  return (
    <Typography
      variant={variant}
      align={align}
      sx={{
        fontFamily: "Bemora",
        letterSpacing: 1.1,
        lineHeight: 1.2,
        backgroundImage: "linear-gradient(90deg, #7C3AED 0%, #4F46E5 35%, #22D3EE 100%)",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        textShadow: "0 10px 35px rgba(0,0,0,0.55)",
        ...sx,
      }}
    >
      {children}
    </Typography>
  )
}

function SubText({ children, sx = {} }) {
  return (
    <Typography
      variant="body1"
      sx={{
        color: "rgba(216, 229, 254, 0.84)",
        lineHeight: 1.75,
        ...sx,
      }}
    >
      {children}
    </Typography>
  )
}

function AuthField(props) {
  return (
    <TextField
      fullWidth
      variant="outlined"
      {...props}
      sx={{
        "& .MuiOutlinedInput-root": {
          borderRadius: 2.5,
          color: "rgba(245,248,255,0.96)",
          background: "rgba(255,255,255,0.03)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
          transition: "border-color 160ms ease, box-shadow 160ms ease, background 160ms ease",
          "& fieldset": {
            borderColor: "rgba(216, 229, 254, 0.14)",
          },
          "&:hover fieldset": {
            borderColor: "rgba(216, 229, 254, 0.24)",
          },
          "&.Mui-focused": {
            background: "rgba(255,255,255,0.045)",
            boxShadow:
              "0 0 0 4px rgba(34,211,238,0.12), 0 10px 30px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)",
          },
          "&.Mui-focused fieldset": {
            borderColor: "rgba(34,211,238,0.65)",
          },
        },
        "& .MuiInputLabel-root": {
          color: "rgba(216,229,254,0.72)",
        },
        "& .MuiInputLabel-root.Mui-focused": {
          color: "rgba(216,229,254,0.92)",
        },
        "& .MuiFormHelperText-root": {
          color: "rgba(216,229,254,0.62)",
          mx: 0.25,
          mt: 0.85,
        },
        ...props.sx,
      }}
    />
  )
}

function getDisplayName(user) {
  if (!user) return ""
  return user.displayName || user.email || "Profile"
}

function getInitials(user) {
  const name = getDisplayName(user)
  if (!name) return "U"

  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase()
  }
  return String(parts[0]?.slice(0, 2) || "U").toUpperCase()
}

function formatAlgo(microalgos) {
  const value = Number(microalgos || 0) / 1_000_000
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  }).format(value)
}

function formatAssetAmount(amount, decimals = 0) {
  const raw = Number(amount || 0)
  const value = raw / Math.pow(10, Number(decimals || 0))
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: Math.min(Number(decimals || 0), 8),
  }).format(value)
}

async function fetchAlgorandWalletSummary(address) {
  if (!address) return null

  try {
    const accountRes = await indexerClient.lookupAccountByID(address).do()
    const account = accountRes?.account || {}

    const rawAssets = Array.isArray(account.assets) ? account.assets : []
    const nonZeroAssets = rawAssets.filter((a) => Number(a?.amount || 0) > 0)

    const assetResults = await Promise.allSettled(
      nonZeroAssets.map(async (holding) => {
        const assetId = holding["asset-id"]

        let decimals = 0
        let name = `Asset ${assetId}`
        let unitName = ""

        try {
          const assetRes = await indexerClient.lookupAssetByID(assetId).do()
          const params = assetRes?.asset?.params || {}

          decimals = Number(params.decimals || 0)
          name = params.name || name
          unitName = params["unit-name"] || ""
        } catch {
          // keep fallback values
        }

        return {
          assetId,
          amount: holding.amount || 0,
          isFrozen: Boolean(holding["is-frozen"]),
          decimals,
          name,
          unitName,
        }
      })
    )

    const assets = assetResults
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value)
      .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))

    return {
      address: account.address || address,
      algoMicro: Number(account.amount || 0),
      assets,
      existsOnChain: true,
    }
  } catch (error) {
    const msg = String(error?.message || "").toLowerCase()

    if (
      msg.includes("no accounts found") ||
      msg.includes("404") ||
      msg.includes("not found")
    ) {
      return {
        address,
        algoMicro: 0,
        assets: [],
        existsOnChain: false,
      }
    }

    throw error
  }
}

function AssetsModal({ open, onClose, assets = [] }) {
  return (
    <Modal open={open} onClose={onClose} closeAfterTransition>
      <AnimatePresence>
        {open ? (
          <Box
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            sx={{
              position: "fixed",
              inset: 0,
              bgcolor: "rgba(0,0,0,0.72)",
              backdropFilter: "blur(10px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              px: { xs: 2, sm: 3, md: 4 },
              py: { xs: 2, sm: 3, md: 4 },
            }}
          >
            <Box
              component={motion.div}
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.985 }}
              transition={{ duration: 0.26, ease: "easeOut" }}
              sx={{
                width: "100%",
                maxWidth: 720,
                maxHeight: "100%",
                overflowY: "auto",
                position: "relative",
                borderRadius: 4,
                overflowX: "hidden",
                background:
                  "linear-gradient(180deg, rgba(124,58,237,0.09) 0%, rgba(34,211,238,0.04) 100%), rgba(0,0,0,0.92)",
                border: "1px solid rgba(216,229,254,0.12)",
                boxShadow: "0 30px 90px rgba(0,0,0,0.62)",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  background:
                    "radial-gradient(circle at top left, rgba(124,58,237,0.18), transparent 34%), radial-gradient(circle at top right, rgba(34,211,238,0.12), transparent 32%)",
                }}
              />

              <Box sx={{ position: "relative", p: { xs: 2.1, sm: 2.6, md: 3 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ pr: 2 }}>
                    <GradientTitle variant="h4" sx={{ mb: 0.5 }}>
                      Other Assets
                    </GradientTitle>
                    <SubText sx={{ fontSize: 15, color: "rgba(216,229,254,0.72)" }}>
                      Non-ALGO assets currently held in this wallet.
                    </SubText>
                  </Box>

                  <IconButton
                    onClick={onClose}
                    sx={{
                      color: "rgba(216,229,254,0.84)",
                      border: "1px solid rgba(216,229,254,0.12)",
                      background: "rgba(255,255,255,0.03)",
                      "&:hover": { background: "rgba(255,255,255,0.08)" },
                    }}
                  >
                    <CloseRoundedIcon />
                  </IconButton>
                </Stack>

                <Box sx={{ mt: 2 }}>
                  {assets.length ? (
                    <Stack spacing={1.2}>
                      {assets.map((asset) => (
                        <Box
                          key={asset.assetId}
                          sx={{
                            borderRadius: 3,
                            border: "1px solid rgba(216,229,254,0.12)",
                            background: "rgba(255,255,255,0.03)",
                            p: 1.5,
                          }}
                        >
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            justifyContent="space-between"
                            alignItems={{ xs: "flex-start", sm: "center" }}
                            spacing={1}
                          >
                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                sx={{
                                  color: "rgba(245,248,255,0.96)",
                                  fontWeight: 900,
                                  fontSize: 15,
                                  wordBreak: "break-word",
                                }}
                              >
                                {asset.name}
                              </Typography>
                              <Typography
                                sx={{
                                  color: "rgba(216,229,254,0.62)",
                                  fontSize: 13,
                                  wordBreak: "break-word",
                                }}
                              >
                                ID: {asset.assetId}
                                {asset.unitName ? ` • ${asset.unitName}` : ""}
                              </Typography>
                            </Box>

                            <Chip
                              label={formatAssetAmount(asset.amount, asset.decimals)}
                              sx={{
                                color: "rgba(245,248,255,0.96)",
                                background: "rgba(124,58,237,0.18)",
                                border: "1px solid rgba(216,229,254,0.12)",
                              }}
                            />
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Box
                      sx={{
                        borderRadius: 3,
                        border: "1px solid rgba(216,229,254,0.12)",
                        background: "rgba(255,255,255,0.03)",
                        p: 2,
                      }}
                    >
                      <Typography sx={{ color: "rgba(216,229,254,0.82)" }}>
                        No additional assets found in this wallet.
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        ) : null}
      </AnimatePresence>
    </Modal>
  )
}

function NavLinksPopup({ open, onClose, items, isActive, onNavigate }) {
  return (
    <Modal open={open} onClose={onClose} closeAfterTransition>
      <AnimatePresence>
        {open ? (
          <Box
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            sx={{
              position: "fixed",
              inset: 0,
              bgcolor: "rgba(0,0,0,0.72)",
              backdropFilter: "blur(10px)",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
              px: { xs: 2, sm: 3 },
              pt: { xs: 10, sm: 12 },
              pb: 3,
              zIndex: 1400,
            }}
          >
            <Box
              component={motion.div}
              initial={{ opacity: 0, y: 20, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.985 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              sx={{
                width: "100%",
                maxWidth: 420,
                position: "relative",
                borderRadius: 4,
                overflow: "hidden",
                background:
                  "linear-gradient(180deg, rgba(124,58,237,0.09) 0%, rgba(34,211,238,0.04) 100%), rgba(0,0,0,0.94)",
                border: "1px solid rgba(216,229,254,0.12)",
                boxShadow: "0 30px 90px rgba(0,0,0,0.62)",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  background:
                    "radial-gradient(circle at top left, rgba(124,58,237,0.18), transparent 34%), radial-gradient(circle at top right, rgba(34,211,238,0.12), transparent 32%)",
                }}
              />

              <Box sx={{ position: "relative", p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                  <GradientTitle variant="h5" sx={{ textShadow: "none" }}>
                    Navigation
                  </GradientTitle>

                  <IconButton
                    onClick={onClose}
                    sx={{
                      color: "rgba(216,229,254,0.84)",
                      border: "1px solid rgba(216,229,254,0.12)",
                      background: "rgba(255,255,255,0.03)",
                      "&:hover": { background: "rgba(255,255,255,0.08)" },
                    }}
                  >
                    <CloseRoundedIcon />
                  </IconButton>
                </Stack>

                <Stack spacing={1}>
                  {items.map((it) => {
                    const active = isActive(it.href)

                    return (
                      <Button
                        key={it.href}
                        component={SiteLink}
                        href={it.href}
                        onClick={event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) onClose() }}
                        fullWidth
                        startIcon={<WidgetsRoundedIcon />}
                        sx={{
                          justifyContent: "flex-start",
                          textTransform: "none",
                          fontFamily: "Bemora",
                          letterSpacing: 0.6,
                          borderRadius: 3,
                          py: 1.3,
                          px: 1.6,
                          color: active
                            ? "rgba(245,248,255,0.96)"
                            : "rgba(216,229,254,0.82)",
                          background: active
                            ? "linear-gradient(90deg, rgba(124,58,237,0.18) 0%, rgba(79,70,229,0.14) 35%, rgba(34,211,238,0.14) 100%)"
                            : "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(216,229,254,0.12)",
                          boxShadow: active
                            ? "0 12px 34px rgba(0,0,0,0.22), 0 0 24px rgba(34,211,238,0.06)"
                            : "none",
                          "&:hover": {
                            background:
                              "linear-gradient(90deg, rgba(124,58,237,0.18) 0%, rgba(79,70,229,0.14) 35%, rgba(34,211,238,0.14) 100%)",
                            color: "rgba(245,248,255,0.96)",
                          },
                          "& .MuiButton-startIcon": {
                            color: "rgba(216,229,254,0.72)",
                          },
                        }}
                      >
                        {it.label}
                      </Button>
                    )
                  })}
                </Stack>
              </Box>
            </Box>
          </Box>
        ) : null}
      </AnimatePresence>
    </Modal>
  )
}

export default function NavBar({
  logoSrc = "/logo.png",
  maxWidth = 1200,
  height = 72,
}) {
  const router = useRouter()
  const theme = useTheme()
  const collapseNav = useMediaQuery(theme.breakpoints.down("md"))

  const items = useMemo(
    () => [
      { label: "Home", href: "/" },
      { label: "Components", href: "/components" },
      { label: "Applications", href: "/applications" },
      { label: "Profile", href: "/profile" },
      { label: "Contact", href: "/contact" },
    ],
    []
  )

  const isActive = (href) => (router.pathname || "") === href

  const [authOpen, setAuthOpen] = useState(false)
  const [assetsOpen, setAssetsOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [tab, setTab] = useState(0)
  const [user, setUser] = useState(null)
  const [walletDoc, setWalletDoc] = useState(null)
  const [walletSummary, setWalletSummary] = useState(null)

  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [chainLoading, setChainLoading] = useState(false)
  const [notice, setNotice] = useState({ type: "", text: "" })

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser || null)
      setWalletDoc(null)
      setWalletSummary(null)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!user?.uid) {
      setWalletDoc(null)
      setWalletSummary(null)
      return
    }

    const ref = doc(db, "algoWallets", user.uid)
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.exists() ? snap.data() : null
        setWalletDoc(data)
      },
      () => {
        setNotice({
          type: "error",
          text: "Unable to load wallet data.",
        })
      }
    )

    return () => unsub()
  }, [user])

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!walletDoc?.address) {
        setWalletSummary(null)
        return
      }

      setChainLoading(true)
      try {
        const summary = await fetchAlgorandWalletSummary(walletDoc.address)
        if (!cancelled) setWalletSummary(summary)
      } catch (error) {
        if (!cancelled) {
          const msg = String(error?.message || "").toLowerCase()

          if (
            msg.includes("no accounts found") ||
            msg.includes("404") ||
            msg.includes("not found")
          ) {
            setWalletSummary({
              address: walletDoc.address,
              algoMicro: 0,
              assets: [],
              existsOnChain: false,
            })
            return
          }

          setWalletSummary(null)
          setNotice({
            type: "error",
            text: error?.message || "Could not load on-chain wallet balances.",
          })
        }
      } finally {
        if (!cancelled) setChainLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [walletDoc?.address])

  const clearForm = () => {
    setDisplayName("")
    setEmail("")
    setPassword("")
    setShowPassword(false)
  }

  const openAuth = () => {
    setAuthOpen(true)
    setNotice({ type: "", text: "" })
  }

  const closeAuth = () => {
    setAuthOpen(false)
    setNotice({ type: "", text: "" })
  }

  const handleNavigate = (href) => {
    setMobileNavOpen(false)
    router.push(href)
  }

  const mapFirebaseError = (error) => {
    const code = String(error?.code || "")

    if (code.includes("invalid-email")) return "That email address is not valid."
    if (code.includes("missing-password")) return "Enter your password to continue."
    if (code.includes("weak-password")) return "Use a stronger password with at least 6 characters."
    if (code.includes("email-already-in-use")) return "That email is already in use."
    if (code.includes("user-not-found")) return "No account was found for that email."
    if (code.includes("wrong-password")) return "The password is incorrect."
    if (code.includes("invalid-credential")) return "The email or password is incorrect."
    if (code.includes("popup-closed-by-user")) {
      return "The Google sign-in window was closed before completing sign-in."
    }
    if (code.includes("too-many-requests")) {
      return "Too many attempts. Please wait a moment and try again."
    }
    return error?.message || "Something went wrong. Please try again."
  }

  const handleGoogleAuth = async () => {
    setLoading(true)
    setNotice({ type: "", text: "" })

    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: "select_account" })
      const existingUser = auth.currentUser

      if (existingUser?.isAnonymous) {
        try {
          await linkWithPopup(existingUser, provider)
        } catch (error) {
          if (
            String(error?.code || "").includes("credential-already-in-use") ||
            String(error?.code || "").includes("email-already-in-use")
          ) {
            await signInWithPopup(auth, provider)
          } else {
            throw error
          }
        }
      } else {
        await signInWithPopup(auth, provider)
      }
      setNotice({
        type: "success",
        text: "Signed in with Google successfully.",
      })
      clearForm()
    } catch (error) {
      setNotice({
        type: "error",
        text: mapFirebaseError(error),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSubmit = async () => {
    setLoading(true)
    setNotice({ type: "", text: "" })

    try {
      if (!email.trim()) {
        throw new Error("Please enter your email.")
      }
      if (!password.trim()) {
        throw new Error("Please enter your password.")
      }

      if (tab === 0) {
        await signInWithEmailAndPassword(auth, email.trim(), password)
        setNotice({
          type: "success",
          text: "Signed in successfully.",
        })
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)

        if (displayName.trim()) {
          await updateProfile(cred.user, { displayName: displayName.trim() })
        }

        setNotice({
          type: "success",
          text: "Account created successfully.",
        })
      }

      clearForm()
    } catch (error) {
      setNotice({
        type: "error",
        text: mapFirebaseError(error),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    setNotice({ type: "", text: "" })

    if (!email.trim()) {
      setNotice({
        type: "error",
        text: "Enter your email first, then click reset password.",
      })
      return
    }

    setLoading(true)
    try {
      await sendPasswordResetEmail(auth, email.trim())
      setNotice({
        type: "success",
        text: "Password reset email sent.",
      })
    } catch (error) {
      setNotice({
        type: "error",
        text: mapFirebaseError(error),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    setLoading(true)
    setNotice({ type: "", text: "" })

    try {
      await signOut(auth)
      setNotice({
        type: "success",
        text: "Signed out successfully.",
      })
      setAuthOpen(false)
    } catch (error) {
      setNotice({
        type: "error",
        text: mapFirebaseError(error),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value || "")
      setNotice({
        type: "success",
        text: `${label} copied to clipboard.`,
      })
    } catch {
      setNotice({
        type: "error",
        text: `Could not copy ${label.toLowerCase()}.`,
      })
    }
  }

  const profileName = getDisplayName(user)
  const profileEmail = user?.email || "No email available"
  const otherAssets = walletSummary?.assets || []

  return (
    <>
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          background: "black",
          overflowX: "clip",
          px: { xs: 2, sm: 4 },
          py: { xs: 2, sm: 4 },
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth,
            display: "flex",
            flexDirection: "column",
            gap: 1.35,
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              width: "100%",
              minHeight: height,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              minWidth: 0,
              px: { xs: 0, sm: 3, md: 4 },
            }}
          >
            <Box
              component={motion.button}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/")}
              aria-label="Go to home"
              style={{
                border: "none",
                background: "transparent",
                padding: 0,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 12,
                minWidth: 0,
              }}
            >
              <Box
                component="img"
                src={logoSrc}
                alt="Logo"
                sx={{
                  height: { xs: 56, sm: 78 },
                  width: "auto",
                  maxWidth: "60vw",
                  display: "block",
                  userSelect: "none",
                }}
              />
            </Box>

            {collapseNav ? (
              <Button
                onClick={() => setMobileNavOpen(true)}
                disableRipple
                startIcon={<MenuRoundedIcon />}
                sx={{
                  textTransform: "none",
                  fontFamily: "Bemora",
                  letterSpacing: 0.8,
                  borderRadius: 999,
                  px: { xs: 1.4, sm: 1.8 },
                  py: 1.05,
                  whiteSpace: "nowrap",
                  color: "rgba(245,248,255,0.98)",
                  background:
                    "linear-gradient(90deg, rgba(124,58,237,0.14) 0%, rgba(79,70,229,0.12) 35%, rgba(34,211,238,0.12) 100%)",
                  border: "1px solid rgba(216,229,254,0.16)",
                  boxShadow:
                    "0 0 0 1px rgba(255,255,255,0.02), 0 16px 45px rgba(0,0,0,0.28), 0 0 24px rgba(34,211,238,0.05)",
                  "& .MuiButton-startIcon": {
                    color: "rgba(216,229,254,0.94)",
                  },
                  "&:hover": {
                    background:
                      "linear-gradient(90deg, rgba(124,58,237,0.20) 0%, rgba(79,70,229,0.18) 35%, rgba(34,211,238,0.18) 100%)",
                    borderColor: "rgba(34,211,238,0.28)",
                  },
                }}
              >
                Menu
              </Button>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: { xs: 0.5, sm: 1.25 },
                  minWidth: 0,
                  flexWrap: "nowrap",
                }}
              >
                {items.map((it) => {
                  const active = isActive(it.href)

                  return (
                    <Button
                      key={it.href}
                      component={SiteLink}
                      href={it.href}
                      disableRipple
                      sx={{
                        position: "relative",
                        textTransform: "none",
                        fontFamily: "Bemora",
                        letterSpacing: 0.6,
                        px: { xs: 1.25, sm: 1.75 },
                        py: 1,
                        minWidth: 0,
                        whiteSpace: "nowrap",
                        borderRadius: 2,
                        color: active
                          ? "rgba(245, 248, 255, 0.95)"
                          : "rgba(216, 229, 254, 0.82)",
                        "&:hover": {
                          backgroundColor: "rgba(255,255,255,0.05)",
                          color: "rgba(245, 248, 255, 0.95)",
                        },
                        "&::after": {
                          content: '""',
                          position: "absolute",
                          left: "12%",
                          right: "12%",
                          bottom: 6,
                          height: 2,
                          borderRadius: 999,
                          background: active ? "#fff" : "transparent",
                          transform: active ? "scaleX(1)" : "scaleX(0.85)",
                          transition: "all 180ms ease",
                        },
                      }}
                    >
                      {it.label}
                    </Button>
                  )
                })}
              </Box>
            )}
          </Box>

          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-end",
              px: { xs: 0, sm: 3, md: 4 },
            }}
          >
            {user ? (
              <Button
                onClick={() => router.push("/profile")}
                disableRipple
                component={motion.button}
                whileHover={{ y: -1, scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                startIcon={
                  <Avatar
                    src={user.photoURL || ""}
                    alt={profileName}
                    sx={{
                      width: 28,
                      height: 28,
                      fontSize: 12,
                      fontWeight: 900,
                      background:
                        "linear-gradient(135deg, rgba(124,58,237,0.95) 0%, rgba(34,211,238,0.9) 100%)",
                      color: "white",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                    }}
                  >
                    {getInitials(user)}
                  </Avatar>
                }
                endIcon={<ArrowForwardRoundedIcon />}
                sx={{
                  textTransform: "none",
                  fontFamily: "Bemora",
                  letterSpacing: 0.8,
                  borderRadius: 999,
                  px: { xs: 1.35, sm: 2.1 },
                  py: 1.05,
                  maxWidth: { xs: "100%", sm: 260 },
                  whiteSpace: "nowrap",
                  color: "rgba(245,248,255,0.98)",
                  background: "transparent",
                  border: "1px solid rgba(216,229,254,0.16)",
                  boxShadow:
                    "0 0 0 1px rgba(255,255,255,0.02), 0 16px 45px rgba(0,0,0,0.22), 0 0 28px rgba(34,211,238,0.05)",
                  "&:hover": {
                    background: "rgba(255,255,255,0.04)",
                    borderColor: "rgba(34,211,238,0.28)",
                    boxShadow:
                      "0 0 0 4px rgba(34,211,238,0.06), 0 16px 45px rgba(0,0,0,0.28), 0 0 34px rgba(34,211,238,0.08)",
                  },
                }}
              >
                <Box
                  component="span"
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    display: "block",
                    maxWidth: { xs: 110, sm: 132 },
                  }}
                >
                  {profileName}
                </Box>
              </Button>
            ) : (
              <Button
                onClick={openAuth}
                disableRipple
                component={motion.button}
                whileHover={{ y: -1, scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                startIcon={<AccountCircleOutlinedIcon />}
                endIcon={<ArrowForwardRoundedIcon />}
                sx={{
                  textTransform: "none",
                  fontFamily: "Bemora",
                  letterSpacing: 0.8,
                  borderRadius: 999,
                  px: { xs: 1.5, sm: 2.1 },
                  py: 1.05,
                  whiteSpace: "nowrap",
                  color: "rgba(245,248,255,0.98)",
                  background:
                    "linear-gradient(90deg, rgba(124,58,237,0.18) 0%, rgba(79,70,229,0.16) 35%, rgba(34,211,238,0.16) 100%)",
                  border: "1px solid rgba(216,229,254,0.16)",
                  boxShadow:
                    "0 0 0 1px rgba(255,255,255,0.02), 0 16px 45px rgba(0,0,0,0.35), 0 0 28px rgba(34,211,238,0.08)",
                  "& .MuiButton-startIcon, & .MuiButton-endIcon": {
                    color: "rgba(216,229,254,0.94)",
                  },
                  "&:hover": {
                    background:
                      "linear-gradient(90deg, rgba(124,58,237,0.24) 0%, rgba(79,70,229,0.22) 35%, rgba(34,211,238,0.22) 100%)",
                    borderColor: "rgba(34,211,238,0.28)",
                    boxShadow:
                      "0 0 0 4px rgba(34,211,238,0.08), 0 16px 45px rgba(0,0,0,0.4), 0 0 34px rgba(34,211,238,0.12)",
                  },
                }}
              >
                Sign In
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      <NavLinksPopup
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        items={items}
        isActive={isActive}
        onNavigate={handleNavigate}
      />

      <AssetsModal
        open={assetsOpen}
        onClose={() => setAssetsOpen(false)}
        assets={otherAssets}
      />

      <Modal open={authOpen} onClose={closeAuth} closeAfterTransition>
        <AnimatePresence>
          {authOpen ? (
            <Box
              component={motion.div}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              sx={{
                position: "fixed",
                inset: 0,
                bgcolor: "rgba(0,0,0,0.72)",
                backdropFilter: "blur(10px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: { xs: 2, sm: 3, md: 4 },
                py: { xs: 2, sm: 3, md: 4 },
              }}
            >
              <Box
                component={motion.div}
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.985 }}
                transition={{ duration: 0.26, ease: "easeOut" }}
                sx={{
                  width: "100%",
                  maxWidth: 560,
                  maxHeight: "100%",
                  overflowY: "auto",
                  position: "relative",
                  borderRadius: 4,
                  overflowX: "hidden",
                  background:
                    "linear-gradient(180deg, rgba(124,58,237,0.09) 0%, rgba(34,211,238,0.04) 100%), rgba(0,0,0,0.92)",
                  border: "1px solid rgba(216,229,254,0.12)",
                  boxShadow: "0 30px 90px rgba(0,0,0,0.62)",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background:
                      "radial-gradient(circle at top left, rgba(124,58,237,0.18), transparent 34%), radial-gradient(circle at top right, rgba(34,211,238,0.12), transparent 32%)",
                  }}
                />

                <Box sx={{ position: "relative", p: { xs: 2.1, sm: 2.6, md: 3 } }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ pr: 2 }}>
                      <GradientTitle variant="h4" sx={{ mb: 0.5 }}>
                        {user ? "Profile" : "Access Portal"}
                      </GradientTitle>
                      <SubText sx={{ fontSize: 15, color: "rgba(216,229,254,0.72)" }}>
                        {user
                          ? "Your signed-in account details."
                          : "Sign in with Google or use email authentication in the same visual style as the rest of the site."}
                      </SubText>
                    </Box>

                    <IconButton
                      onClick={closeAuth}
                      sx={{
                        color: "rgba(216,229,254,0.84)",
                        border: "1px solid rgba(216,229,254,0.12)",
                        background: "rgba(255,255,255,0.03)",
                        "&:hover": {
                          background: "rgba(255,255,255,0.08)",
                        },
                      }}
                    >
                      <CloseRoundedIcon />
                    </IconButton>
                  </Stack>

                  {notice.text ? (
                    <Alert
                      severity={notice.type === "success" ? "success" : "error"}
                      sx={{
                        mt: 2,
                        borderRadius: 2.5,
                        background:
                          notice.type === "success"
                            ? "rgba(46, 125, 50, 0.16)"
                            : "rgba(211, 47, 47, 0.14)",
                        color: "rgba(245,248,255,0.94)",
                        border:
                          notice.type === "success"
                            ? "1px solid rgba(76, 175, 80, 0.28)"
                            : "1px solid rgba(244, 67, 54, 0.24)",
                        "& .MuiAlert-icon": {
                          color: "inherit",
                        },
                      }}
                    >
                      {notice.text}
                    </Alert>
                  ) : null}

                  {user ? (
                    <Box
                      sx={{
                        mt: 2.25,
                        borderRadius: 3,
                        overflow: "hidden",
                        border: "1px solid rgba(216,229,254,0.12)",
                        background: "rgba(255,255,255,0.03)",
                        p: { xs: 2, sm: 2.4 },
                      }}
                    >
                      <Stack spacing={2}>
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={2}
                          alignItems={{ xs: "flex-start", sm: "center" }}
                        >
                          <Avatar
                            src={user.photoURL || ""}
                            alt={profileName}
                            sx={{
                              width: 78,
                              height: 78,
                              fontSize: 28,
                              fontWeight: 900,
                              background:
                                "linear-gradient(135deg, rgba(124,58,237,0.95) 0%, rgba(34,211,238,0.9) 100%)",
                              color: "white",
                              boxShadow: "0 16px 45px rgba(0,0,0,0.28)",
                            }}
                          >
                            {getInitials(user)}
                          </Avatar>

                          <Box sx={{ minWidth: 0 }}>
                            <GradientTitle
                              variant="h5"
                              sx={{
                                mb: 0.35,
                                textShadow: "none",
                                wordBreak: "break-word",
                              }}
                            >
                              {profileName}
                            </GradientTitle>

                            <Typography
                              sx={{
                                color: "rgba(216,229,254,0.84)",
                                fontSize: 15,
                                fontWeight: 700,
                                wordBreak: "break-word",
                              }}
                            >
                              {profileEmail}
                            </Typography>

                            <Typography
                              sx={{
                                mt: 0.65,
                                color: "rgba(216,229,254,0.62)",
                                fontSize: 13.5,
                              }}
                            >
                              Provider:{" "}
                              {Array.isArray(user.providerData) && user.providerData.length
                                ? user.providerData
                                    .map((p) => p?.providerId)
                                    .filter(Boolean)
                                    .join(" • ")
                                : "firebase"}
                            </Typography>
                          </Box>
                        </Stack>

                        <Divider sx={{ borderColor: "rgba(216,229,254,0.12)" }} />

                        <Box
                          sx={{
                            borderRadius: 3,
                            border: "1px solid rgba(216,229,254,0.12)",
                            background: "rgba(0,0,0,0.28)",
                            p: 1.5,
                          }}
                        >
                          <Stack spacing={1.1}>
                            <Box>
                              <Typography
                                sx={{
                                  color: "rgba(216,229,254,0.56)",
                                  fontSize: 12.5,
                                  textTransform: "uppercase",
                                  letterSpacing: 1,
                                  fontWeight: 900,
                                }}
                              >
                                UID
                              </Typography>
                              <Typography
                                sx={{
                                  color: "rgba(245,248,255,0.9)",
                                  fontSize: 13.5,
                                  wordBreak: "break-all",
                                }}
                              >
                                {user.uid}
                              </Typography>
                            </Box>

                            <Box>
                              <Typography
                                sx={{
                                  color: "rgba(216,229,254,0.56)",
                                  fontSize: 12.5,
                                  textTransform: "uppercase",
                                  letterSpacing: 1,
                                  fontWeight: 900,
                                }}
                              >
                                Email Verified
                              </Typography>
                              <Typography
                                sx={{
                                  color: "rgba(245,248,255,0.9)",
                                  fontSize: 13.5,
                                }}
                              >
                                {user.emailVerified ? "Yes" : "No"}
                              </Typography>
                            </Box>

                            {walletDoc?.address ? (
                              <>
                                <Divider sx={{ borderColor: "rgba(216,229,254,0.12)" }} />

                                <Box>
                                  <Typography
                                    sx={{
                                      color: "rgba(216,229,254,0.56)",
                                      fontSize: 12.5,
                                      textTransform: "uppercase",
                                      letterSpacing: 1,
                                      fontWeight: 900,
                                    }}
                                  >
                                    Wallet Address
                                  </Typography>
                                  <Typography
                                    sx={{
                                      color: "rgba(245,248,255,0.9)",
                                      fontSize: 13.5,
                                      wordBreak: "break-all",
                                    }}
                                  >
                                    {walletDoc.address}
                                  </Typography>
                                </Box>

                                <Box>
                                  <Typography
                                    sx={{
                                      color: "rgba(216,229,254,0.56)",
                                      fontSize: 12.5,
                                      textTransform: "uppercase",
                                      letterSpacing: 1,
                                      fontWeight: 900,
                                    }}
                                  >
                                    ALGO Held
                                  </Typography>
                                  <Typography
                                    sx={{
                                      color: "rgba(245,248,255,0.96)",
                                      fontSize: 16,
                                      fontWeight: 900,
                                    }}
                                  >
                                    {chainLoading
                                      ? "Loading..."
                                      : `${formatAlgo(walletSummary?.algoMicro)} ALGO`}
                                  </Typography>
                                </Box>

                                <Box>
                                  <Typography
                                    sx={{
                                      color: "rgba(216,229,254,0.56)",
                                      fontSize: 12.5,
                                      textTransform: "uppercase",
                                      letterSpacing: 1,
                                      fontWeight: 900,
                                    }}
                                  >
                                    Other Assets
                                  </Typography>
                                  <Typography
                                    sx={{
                                      color: "rgba(245,248,255,0.9)",
                                      fontSize: 13.5,
                                    }}
                                  >
                                    {chainLoading
                                      ? "Loading..."
                                      : `${otherAssets.length} asset${otherAssets.length === 1 ? "" : "s"}`}
                                  </Typography>
                                </Box>
                              </>
                            ) : null}
                          </Stack>
                        </Box>

                        {walletDoc?.address ? (
                          <>
                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              spacing={1.1}
                              flexWrap="wrap"
                            >
                              <Button
                                onClick={() => handleCopy(walletDoc.address, "Address")}
                                startIcon={<ContentCopyRoundedIcon />}
                                sx={{
                                  textTransform: "none",
                                  borderRadius: 3,
                                  py: 1.2,
                                  px: 2,
                                  color: "rgba(216,229,254,0.84)",
                                  border: "1px solid rgba(216,229,254,0.12)",
                                  background: "rgba(255,255,255,0.03)",
                                  "&:hover": {
                                    background: "rgba(255,255,255,0.07)",
                                  },
                                }}
                              >
                                Copy Wallet Address
                              </Button>

                              <Button
                                onClick={() => setAssetsOpen(true)}
                                startIcon={<TokenRoundedIcon />}
                                sx={{
                                  textTransform: "none",
                                  borderRadius: 3,
                                  py: 1.2,
                                  px: 2,
                                  color: "rgba(216,229,254,0.84)",
                                  border: "1px solid rgba(216,229,254,0.12)",
                                  background: "rgba(255,255,255,0.03)",
                                  "&:hover": {
                                    background: "rgba(255,255,255,0.07)",
                                  },
                                }}
                              >
                                View Other Assets
                              </Button>
                            </Stack>

                            <Box sx={{ display: "flex", justifyContent: "center", pt: 0.5 }}>
                              <Box
                                sx={{
                                  borderRadius: 3,
                                  p: 1.4,
                                  background: "white",
                                  boxShadow: "0 12px 34px rgba(0,0,0,0.25)",
                                }}
                              >
                                <QRCodeSVG value={walletDoc.address} size={160} />
                              </Box>
                            </Box>
                          </>
                        ) : null}

                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={1.2}
                          justifyContent="flex-end"
                        >
                          <Button
                            onClick={closeAuth}
                            sx={{
                              textTransform: "none",
                              borderRadius: 3,
                              py: 1.2,
                              px: 2,
                              color: "rgba(216,229,254,0.84)",
                              border: "1px solid rgba(216,229,254,0.12)",
                              background: "rgba(255,255,255,0.03)",
                              "&:hover": {
                                background: "rgba(255,255,255,0.07)",
                              },
                            }}
                          >
                            Close
                          </Button>

                          <Button
                            onClick={handleSignOut}
                            disabled={loading}
                            startIcon={<LogoutRoundedIcon />}
                            sx={{
                              textTransform: "none",
                              fontFamily: "Bemora",
                              letterSpacing: 0.7,
                              borderRadius: 3,
                              py: 1.2,
                              px: 2.1,
                              color: "rgba(245,248,255,0.98)",
                              background:
                                "linear-gradient(90deg, rgba(124,58,237,0.20) 0%, rgba(79,70,229,0.18) 35%, rgba(34,211,238,0.18) 100%)",
                              border: "1px solid rgba(216,229,254,0.16)",
                              boxShadow:
                                "0 0 0 1px rgba(255,255,255,0.02), 0 16px 45px rgba(0,0,0,0.35), 0 0 30px rgba(34,211,238,0.08)",
                              "&:hover": {
                                background:
                                  "linear-gradient(90deg, rgba(124,58,237,0.26) 0%, rgba(79,70,229,0.24) 35%, rgba(34,211,238,0.24) 100%)",
                              },
                            }}
                          >
                            Log Out
                          </Button>
                        </Stack>
                      </Stack>
                    </Box>
                  ) : (
                    <>
                      <Box sx={{ mt: 2.2 }}>
                        <Button
                          fullWidth
                          onClick={handleGoogleAuth}
                          disabled={loading}
                          startIcon={<GoogleIcon />}
                          sx={{
                            textTransform: "none",
                            fontWeight: 900,
                            fontSize: 15,
                            borderRadius: 3,
                            py: 1.4,
                            color: "rgba(245,248,255,0.96)",
                            border: "1px solid rgba(216,229,254,0.14)",
                            background:
                              "linear-gradient(90deg, rgba(124,58,237,0.12) 0%, rgba(79,70,229,0.10) 35%, rgba(34,211,238,0.10) 100%)",
                            boxShadow: "0 16px 45px rgba(0,0,0,0.25)",
                            "&:hover": {
                              background:
                                "linear-gradient(90deg, rgba(124,58,237,0.18) 0%, rgba(79,70,229,0.14) 35%, rgba(34,211,238,0.14) 100%)",
                            },
                          }}
                        >
                          Continue with Google
                        </Button>
                      </Box>

                      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ my: 2 }}>
                        <Divider sx={{ flex: 1, borderColor: "rgba(216,229,254,0.12)" }} />
                        <Typography
                          sx={{
                            color: "rgba(216,229,254,0.54)",
                            fontSize: 12.5,
                            fontWeight: 800,
                            letterSpacing: 1,
                            textTransform: "uppercase",
                          }}
                        >
                          or use email
                        </Typography>
                        <Divider sx={{ flex: 1, borderColor: "rgba(216,229,254,0.12)" }} />
                      </Stack>

                      <Box
                        sx={{
                          borderRadius: 3,
                          overflow: "hidden",
                          border: "1px solid rgba(216,229,254,0.12)",
                          background: "rgba(255,255,255,0.03)",
                        }}
                      >
                        <Tabs
                          value={tab}
                          onChange={(_, v) => {
                            setTab(v)
                            setNotice({ type: "", text: "" })
                          }}
                          variant="fullWidth"
                          sx={{
                            minHeight: 52,
                            "& .MuiTabs-indicator": {
                              height: 3,
                              borderRadius: 999,
                              background:
                                "linear-gradient(90deg, #7C3AED 0%, #4F46E5 35%, #22D3EE 100%)",
                            },
                            "& .MuiTab-root": {
                              minHeight: 52,
                              textTransform: "none",
                              color: "rgba(216,229,254,0.7)",
                              fontWeight: 800,
                              letterSpacing: 0.4,
                            },
                            "& .Mui-selected": {
                              color: "rgba(245,248,255,0.96) !important",
                            },
                          }}
                        >
                          <Tab label="Sign In" />
                          <Tab label="Create Account" />
                        </Tabs>

                        <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
                          <Stack spacing={1.5}>
                            {tab === 1 ? (
                              <AuthField
                                label="Display Name"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                autoComplete="name"
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <AccountCircleOutlinedIcon
                                        sx={{ color: "rgba(216,229,254,0.6)" }}
                                      />
                                    </InputAdornment>
                                  ),
                                }}
                              />
                            ) : null}

                            <AuthField
                              label="Email"
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              autoComplete="email"
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <EmailOutlinedIcon sx={{ color: "rgba(216,229,254,0.6)" }} />
                                  </InputAdornment>
                                ),
                              }}
                            />

                            <AuthField
                              label="Password"
                              type={showPassword ? "text" : "password"}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              autoComplete={tab === 0 ? "current-password" : "new-password"}
                              helperText={
                                tab === 1
                                  ? "Use at least 6 characters for your password."
                                  : "Enter your existing password to continue."
                              }
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <LockOutlinedIcon sx={{ color: "rgba(216,229,254,0.6)" }} />
                                  </InputAdornment>
                                ),
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <IconButton
                                      onClick={() => setShowPassword((v) => !v)}
                                      edge="end"
                                      sx={{ color: "rgba(216,229,254,0.65)" }}
                                    >
                                      {showPassword ? (
                                        <VisibilityOffOutlinedIcon />
                                      ) : (
                                        <VisibilityOutlinedIcon />
                                      )}
                                    </IconButton>
                                  </InputAdornment>
                                ),
                              }}
                            />

                            <Button
                              fullWidth
                              onClick={handleEmailSubmit}
                              disabled={loading}
                              endIcon={<ArrowForwardRoundedIcon />}
                              sx={{
                                textTransform: "none",
                                fontFamily: "Bemora",
                                letterSpacing: 0.7,
                                borderRadius: 3,
                                py: 1.35,
                                color: "rgba(245,248,255,0.98)",
                                background:
                                  "linear-gradient(90deg, rgba(124,58,237,0.20) 0%, rgba(79,70,229,0.18) 35%, rgba(34,211,238,0.18) 100%)",
                                border: "1px solid rgba(216,229,254,0.16)",
                                boxShadow:
                                  "0 0 0 1px rgba(255,255,255,0.02), 0 16px 45px rgba(0,0,0,0.35), 0 0 30px rgba(34,211,238,0.08)",
                                "&:hover": {
                                  background:
                                    "linear-gradient(90deg, rgba(124,58,237,0.26) 0%, rgba(79,70,229,0.24) 35%, rgba(34,211,238,0.24) 100%)",
                                },
                              }}
                            >
                              {tab === 0 ? "Sign In with Email" : "Create Account"}
                            </Button>

                            {tab === 0 ? (
                              <Button
                                onClick={handleResetPassword}
                                disabled={loading}
                                sx={{
                                  alignSelf: "flex-start",
                                  textTransform: "none",
                                  color: "rgba(216,229,254,0.76)",
                                  px: 0.25,
                                  "&:hover": {
                                    background: "transparent",
                                    color: "rgba(245,248,255,0.96)",
                                  },
                                }}
                              >
                                Forgot password?
                              </Button>
                            ) : null}
                          </Stack>
                        </Box>
                      </Box>
                    </>
                  )}
                </Box>
              </Box>
            </Box>
          ) : null}
        </AnimatePresence>
      </Modal>
    </>
  )
}
