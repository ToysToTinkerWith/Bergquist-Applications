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
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material"
import { QRCodeSVG } from "qrcode.react"

import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined"
import GoogleIcon from "@mui/icons-material/Google"
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined"
import LockOutlinedIcon from "@mui/icons-material/LockOutlined"
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined"
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined"
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded"
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded"
import VpnKeyRoundedIcon from "@mui/icons-material/VpnKeyRounded"
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded"

import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth"

import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore"

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
        backgroundImage:
          "linear-gradient(90deg, #7C3AED 0%, #4F46E5 35%, #22D3EE 100%)",
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
          transition:
            "border-color 160ms ease, box-shadow 160ms ease, background 160ms ease",
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

export default function AlgorandWalletManager({ maxWidth = 1200 }) {
  const [tab, setTab] = useState(0)

  const [user, setUser] = useState(null)
  const [walletDoc, setWalletDoc] = useState(null)
  const [walletSecretDoc, setWalletSecretDoc] = useState(null)
  const [walletSummary, setWalletSummary] = useState(null)

  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showMnemonic, setShowMnemonic] = useState(false)

  const [loading, setLoading] = useState(false)
  const [walletLoading, setWalletLoading] = useState(true)
  const [secretLoading, setSecretLoading] = useState(true)
  const [chainLoading, setChainLoading] = useState(false)
  const [notice, setNotice] = useState({ type: "", text: "" })

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser || null)
      setWalletDoc(null)
      setWalletSecretDoc(null)
      setWalletSummary(null)
      setWalletLoading(false)
      setSecretLoading(false)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!user?.uid) {
      setWalletDoc(null)
      setWalletSummary(null)
      setWalletLoading(false)
      return
    }

    setWalletLoading(true)

    const ref = doc(db, "algoWallets", user.uid)
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setWalletDoc(snap.exists() ? snap.data() : null)
        setWalletLoading(false)
      },
      () => {
        setWalletLoading(false)
      }
    )

    return () => unsub()
  }, [user])

  useEffect(() => {
    if (!user?.uid) {
      setWalletSecretDoc(null)
      setSecretLoading(false)
      return
    }

    setSecretLoading(true)

    const ref = doc(db, "algoWalletSecrets", user.uid)
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setWalletSecretDoc(snap.exists() ? snap.data() : null)
        setSecretLoading(false)
      },
      () => {
        setWalletSecretDoc(null)
        setSecretLoading(false)
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
        if (!cancelled) {
          setWalletSummary(summary)
        }
      } catch {
        if (!cancelled) {
          setWalletSummary({
            address: walletDoc.address,
            algoMicro: 0,
            assets: [],
            existsOnChain: false,
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

  const mapFirebaseError = (error) => {
    const code = String(error?.code || "")

    if (code.includes("invalid-email")) return "That email address is not valid."
    if (code.includes("missing-password")) return "Enter your password to continue."
    if (code.includes("weak-password")) {
      return "Use a stronger password with at least 6 characters."
    }
    if (code.includes("email-already-in-use")) return "That email is already in use."
    if (code.includes("user-not-found")) return "No account was found for that email."
    if (code.includes("wrong-password")) return "The password is incorrect."
    if (code.includes("invalid-credential")) {
      return "The email or password is incorrect."
    }
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
      await signInWithPopup(auth, provider)
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
      if (!email.trim()) throw new Error("Please enter your email.")
      if (!password.trim()) throw new Error("Please enter your password.")

      if (tab === 0) {
        await signInWithEmailAndPassword(auth, email.trim(), password)
        setNotice({
          type: "success",
          text: "Signed in successfully.",
        })
      } else {
        const cred = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        )
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
    } catch (error) {
      setNotice({
        type: "error",
        text: mapFirebaseError(error),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateWallet = async () => {
    if (!user?.uid) return
    if (walletDoc?.address) return

    setLoading(true)
    setNotice({ type: "", text: "" })

    try {
      const publicRef = doc(db, "algoWallets", user.uid)
      const secretRef = doc(db, "algoWalletSecrets", user.uid)

      const [existingPublic, existingSecret] = await Promise.all([
        getDoc(publicRef),
        getDoc(secretRef),
      ])

      if (existingPublic.exists() || existingSecret.exists()) {
        setNotice({
          type: "error",
          text: "A wallet already exists for this account.",
        })
        return
      }

      const account = algosdk.generateAccount()
      const address =
        typeof account.addr === "string" ? account.addr : account.addr.toString()
      const mnemonic = algosdk.secretKeyToMnemonic(account.sk)

      await Promise.all([
        setDoc(publicRef, {
          address,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
        setDoc(secretRef, {
          mnemonic,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
      ])

      setNotice({
        type: "success",
        text: "Algorand wallet generated and saved.",
      })
      setShowMnemonic(false)
    } catch (error) {
      setNotice({
        type: "error",
        text: error?.message || "Failed to generate wallet.",
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
  const otherAssets = useMemo(() => walletSummary?.assets || [], [walletSummary])
  const mnemonic = walletSecretDoc?.mnemonic || ""

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        background: "black",
        px: { xs: 0.75, sm: 1.5 },
        py: { xs: 1, sm: 1.5 },
      }}
    >
      <Box sx={{ width: "100%", maxWidth }}>
        <Box
          sx={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 4,
            background: "black",
            boxShadow: "none",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background: "none",
            }}
          />

          <Box sx={{ position: "relative", p: { xs: 1, sm: 1.4, md: 1.8 } }}>
            {notice.text ? (
              <Alert
                severity={notice.type === "success" ? "success" : "error"}
                sx={{
                  mt: 1,
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

            <Box
              sx={{
                mt: notice.text ? 1.2 : 0,
                borderRadius: 3,
                border: "1px solid rgba(216,229,254,0.12)",
                background: "rgba(255,255,255,0.03)",
                p: { xs: 1.25, sm: 1.7 },
              }}
            >
              <GradientTitle variant="h5" sx={{ textShadow: "none", mb: 1.5 }}>
                Your Wallet
              </GradientTitle>

              {!user ? (
                <Stack spacing={1.5}>
                  <SubText sx={{ fontSize: 15 }}>
                    You must be signed in before generating a wallet.
                  </SubText>

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

                    <Box sx={{ p: { xs: 1.25, sm: 1.6 } }}>
                      <Stack spacing={1.35}>
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
                                <EmailOutlinedIcon
                                  sx={{ color: "rgba(216,229,254,0.6)" }}
                                />
                              </InputAdornment>
                            ),
                          }}
                        />

                        <AuthField
                          label="Password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete={
                            tab === 0 ? "current-password" : "new-password"
                          }
                          helperText={
                            tab === 1
                              ? "Use at least 6 characters for your password."
                              : "Enter your existing password to continue."
                          }
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <LockOutlinedIcon
                                  sx={{ color: "rgba(216,229,254,0.6)" }}
                                />
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
                            py: 1.2,
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
                            py: 1.25,
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
                                color: "rgba(245,255,255,0.96)",
                              },
                            }}
                          >
                            Forgot password?
                          </Button>
                        ) : null}
                      </Stack>
                    </Box>
                  </Box>
                </Stack>
              ) : walletLoading ? (
                <Typography sx={{ color: "rgba(216,229,254,0.82)" }}>
                  Loading wallet…
                </Typography>
              ) : walletDoc ? (
                <Stack spacing={1.5}>
                  <Box
                    sx={{
                      borderRadius: 3,
                      border: "1px solid rgba(216,229,254,0.12)",
                      background: "rgba(0,0,0,0.28)",
                      p: 1.35,
                    }}
                  >
                    <Typography
                      sx={{
                        color: "rgba(216,229,254,0.56)",
                        fontSize: 12.5,
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        fontWeight: 900,
                        mb: 0.7,
                      }}
                    >
                      Public Address
                    </Typography>

                    <Typography
                      sx={{
                        color: "rgba(245,248,255,0.96)",
                        fontSize: 14,
                        wordBreak: "break-all",
                        lineHeight: 1.7,
                      }}
                    >
                      {walletDoc.address}
                    </Typography>

                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ mt: 1.1, flexWrap: "wrap" }}
                    >
                      <Button
                        onClick={() => handleCopy(walletDoc.address, "Address")}
                        startIcon={<ContentCopyRoundedIcon />}
                        sx={{
                          textTransform: "none",
                          borderRadius: 999,
                          color: "rgba(216,229,254,0.88)",
                          border: "1px solid rgba(216,229,254,0.12)",
                          background: "rgba(255,255,255,0.03)",
                        }}
                      >
                        Copy Address
                      </Button>
                    </Stack>
                  </Box>

                  <Box
                    sx={{
                      borderRadius: 3,
                      border: "1px solid rgba(216,229,254,0.12)",
                      background: "rgba(0,0,0,0.28)",
                      p: 1.35,
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
                          ALGO Held
                        </Typography>
                        <Typography
                          sx={{
                            color: "rgba(245,248,255,0.96)",
                            fontSize: 18,
                            fontWeight: 900,
                          }}
                        >
                          {chainLoading
                            ? "Loading..."
                            : `${formatAlgo(walletSummary?.algoMicro || 0)} ALGO`}
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
                            : `${otherAssets.length} asset${
                                otherAssets.length === 1 ? "" : "s"
                              }`}
                        </Typography>
                      </Box>

                      {otherAssets.length ? (
                        <Stack spacing={1} sx={{ pt: 0.35 }}>
                          {otherAssets.map((asset) => (
                            <Box
                              key={asset.assetId}
                              sx={{
                                borderRadius: 2.5,
                                border: "1px solid rgba(216,229,254,0.12)",
                                background: "rgba(255,255,255,0.03)",
                                p: 1.1,
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
                                      fontSize: 14,
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    {asset.name}
                                  </Typography>
                                  <Typography
                                    sx={{
                                      color: "rgba(216,229,254,0.62)",
                                      fontSize: 12.5,
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    ID: {asset.assetId}
                                    {asset.unitName ? ` • ${asset.unitName}` : ""}
                                  </Typography>
                                </Box>

                                <Chip
                                  label={formatAssetAmount(
                                    asset.amount,
                                    asset.decimals
                                  )}
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
                      ) : null}
                    </Stack>
                  </Box>

                  <Box
                    sx={{
                      borderRadius: 3,
                      border: "1px solid rgba(216,229,254,0.12)",
                      background: "rgba(0,0,0,0.28)",
                      p: 1.35,
                    }}
                  >
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      spacing={1.1}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          sx={{
                            color: "rgba(216,229,254,0.56)",
                            fontSize: 12.5,
                            textTransform: "uppercase",
                            letterSpacing: 1,
                            fontWeight: 900,
                            mb: 0.7,
                          }}
                        >
                          Seed Phrase
                        </Typography>

                        <Typography
                          sx={{
                            color: "rgba(245,248,255,0.92)",
                            fontSize: 14,
                            lineHeight: 1.8,
                            wordBreak: "break-word",
                            filter: showMnemonic ? "none" : "blur(8px)",
                            userSelect: showMnemonic ? "text" : "none",
                            transition: "filter 180ms ease",
                          }}
                        >
                          {secretLoading
                            ? "Loading..."
                            : mnemonic || "No secret seed phrase found."}
                        </Typography>
                      </Box>

                      <Stack direction="row" spacing={1}>
                        <Button
                          onClick={() => setShowMnemonic((v) => !v)}
                          disabled={secretLoading || !mnemonic}
                          startIcon={
                            showMnemonic ? (
                              <VisibilityOffOutlinedIcon />
                            ) : (
                              <VisibilityOutlinedIcon />
                            )
                          }
                          sx={{
                            textTransform: "none",
                            borderRadius: 999,
                            color: "rgba(216,229,254,0.88)",
                            border: "1px solid rgba(216,229,254,0.12)",
                            background: "rgba(255,255,255,0.03)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {showMnemonic ? "Hide" : "Reveal"}
                        </Button>

                        <Button
                          onClick={() => handleCopy(mnemonic, "Seed phrase")}
                          disabled={secretLoading || !mnemonic}
                          startIcon={<ContentCopyRoundedIcon />}
                          sx={{
                            textTransform: "none",
                            borderRadius: 999,
                            color: "rgba(216,229,254,0.88)",
                            border: "1px solid rgba(216,229,254,0.12)",
                            background: "rgba(255,255,255,0.03)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Copy
                        </Button>
                      </Stack>
                    </Stack>
                  </Box>

                  <Box sx={{ display: "flex", justifyContent: "center", pt: 0.15 }}>
                    <Box
                      sx={{
                        borderRadius: 3,
                        p: 1.15,
                        background: "white",
                        boxShadow: "0 12px 34px rgba(0,0,0,0.25)",
                      }}
                    >
                      <QRCodeSVG value={walletDoc.address} size={160} />
                    </Box>
                  </Box>
                </Stack>
              ) : (
                <Stack spacing={1.5}>
                  <SubText sx={{ fontSize: 15 }}>
                    Generate a new Algorand wallet and store its public address in
                    Firestore under your user account, while storing the seed phrase
                    in the private secrets collection.
                  </SubText>

                  <Button
                    onClick={handleGenerateWallet}
                    disabled={loading}
                    startIcon={<VpnKeyRoundedIcon />}
                    endIcon={<ArrowForwardRoundedIcon />}
                    sx={{
                      alignSelf: "flex-start",
                      textTransform: "none",
                      fontFamily: "Bemora",
                      letterSpacing: 0.7,
                      borderRadius: 3,
                      py: 1.15,
                      px: 2,
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
                    Generate Wallet
                  </Button>
                </Stack>
              )}
            </Box>

            {user ? (
              <Box
                sx={{
                  mt: 1.4,
                  borderRadius: 3,
                  border: "1px solid rgba(216,229,254,0.12)",
                  background: "rgba(255,255,255,0.03)",
                  p: { xs: 1.25, sm: 1.7 },
                }}
              >
                <GradientTitle variant="h5" sx={{ textShadow: "none", mb: 1.5 }}>
                  Your Account
                </GradientTitle>

                <Stack spacing={1.5}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
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
                          mb: 0.25,
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
                          mt: 0.5,
                          color: "rgba(216,229,254,0.62)",
                          fontSize: 13.5,
                        }}
                      >
                        Provider:{" "}
                        {Array.isArray(user.providerData) &&
                        user.providerData.length
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
                      p: 1.35,
                    }}
                  >
                    <Stack spacing={1}>
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
                    </Stack>
                  </Box>

                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.1}
                    justifyContent="flex-end"
                  >
                    <Button
                      onClick={handleSignOut}
                      disabled={loading}
                      startIcon={<LogoutRoundedIcon />}
                      sx={{
                        textTransform: "none",
                        fontFamily: "Bemora",
                        letterSpacing: 0.7,
                        borderRadius: 3,
                        py: 1.1,
                        px: 2,
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
            ) : null}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
