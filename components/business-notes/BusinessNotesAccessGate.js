import { useState } from "react"
import LockOutlinedIcon from "@mui/icons-material/LockOutlined"
import GoogleIcon from "@mui/icons-material/Google"
import { s } from "../showcase/Workspace"
import n from "../../styles/business-notes.module.css"

export default function BusinessNotesAccessGate({ status, message, onRetry }) {
  const [signingIn, setSigningIn] = useState(false), [error, setError] = useState("")
  async function signIn() {
    if (signingIn) return
    // Firebase's existing local authorized domain is localhost, not 127.0.0.1.
    if (process.env.NODE_ENV === "development" && window.location.hostname === "127.0.0.1") {
      const local = new URL(window.location.href)
      local.hostname = "localhost"
      window.location.assign(local.href)
      return
    }
    setSigningIn(true); setError("")
    try {
      const [{ auth }, { GoogleAuthProvider, signInWithPopup }] = await Promise.all([import("../../Firebase/FirebaseInit"), import("firebase/auth")])
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: "select_account" })
      await signInWithPopup(auth, provider)
      onRetry?.()
    } catch (failure) {
      const messages = { "auth/popup-blocked": "Your browser blocked the sign-in window. Allow this window and try again.", "auth/popup-closed-by-user": "Sign-in was closed. You can try again when you’re ready.", "auth/unauthorized-domain": "Google sign-in is not enabled for this website address yet.", "auth/operation-not-allowed": "Google sign-in must be enabled for this Firebase project first.", "auth/account-exists-with-different-credential": "This email uses another sign-in method. Link Google sign-in from your account before continuing." }
      setError(messages[failure.code] || "Google sign-in couldn’t be completed. Please try again.")
    } finally { setSigningIn(false) }
  }
  const checking = status === "checking"
  return <section className={n.accessGate} aria-label="Private business notebook">
    <span className={n.lockIcon}><LockOutlinedIcon /></span><span className={n.eyebrow}>YOUR PRIVATE WORKSPACE</span>
    <h3>{checking ? "Checking notebook access…" : status === "denied" ? "This notebook is private." : "A quieter place to run your business."}</h3>
    <p>{checking ? "Checking your sign-in and notebook permission." : status === "denied" ? "This account doesn’t have access. Sign in with the approved Google account to continue." : status === "unconfigured" ? "Notebook access hasn’t been configured on this server yet." : status === "error" ? message || "We couldn’t check your notebook access. Please try again." : "Sign in with the approved Google account to capture notes and keep your schedule, tasks, and places together."}</p>
    {!checking && <div className={n.accessActions}><button className={s.primary} type="button" disabled={signingIn} onClick={signIn}><GoogleIcon fontSize="small" />{signingIn ? "Opening Google sign-in…" : status === "denied" ? "Use another Google account" : "Sign in with Google"}</button>{["error", "unconfigured"].includes(status) && <button className={s.button} type="button" onClick={onRetry}>Check again</button>}</div>}
    {error && <p className={s.error} role="alert">{error}</p>}
    <small>Access is checked by the server. Other accounts cannot process or retrieve notebook data.</small>
  </section>
}
