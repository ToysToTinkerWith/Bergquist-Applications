import React, { useMemo } from "react"
import { motion } from "framer-motion"
import useMediaQuery from "@mui/material/useMediaQuery"

export default function RestaurantPizzeriaFooter({
  logoSrc = "/restaurant/smallLogo.png",
  restaurantName = "Italiana",
  onOrderOnline,
  onMenu,
  year = new Date().getFullYear(),
}) {
  const isTabletDown = useMediaQuery("(max-width:720px)", { noSsr: true })
  const isMobile = useMediaQuery("(max-width:520px)", { noSsr: true })
  const isTiny = useMediaQuery("(max-width:380px)", { noSsr: true })

  const tokens = useMemo(
    () => ({
      ink: "#f4f0e6",
      ink2: "rgba(244,240,230,.82)",
      ink3: "rgba(244,240,230,.62)",
      gold: "rgba(176,160,236,.95)",
      shadow: "rgba(0,0,0,.55)",
      fontFamily: "ui-serif, Georgia, Times New Roman, Times, serif",
    }),
    []
  )

  const styles = useMemo(() => {
    const padX = isTabletDown ? 18 : 48
    const logoH = isMobile ? 88 : 94
    const btnPad = isMobile ? "10px 14px" : "11px 16px"
    const btnFont = isMobile ? 11 : 12
    const shellPad = isMobile ? "34px 0 18px" : "44px 0 22px"

    return {
      shell: {
        position: "relative",
        width: "100%",
        padding: shellPad,
        overflow: "hidden",
        borderTop: "1px solid rgba(176,160,236,.18)",
        background:
          "radial-gradient(circle at 18% 0%, rgba(176,160,236,.12), transparent 52%)," +
          "radial-gradient(circle at 90% 40%, rgba(244,240,230,.06), transparent 55%)," +
          "linear-gradient(180deg, rgba(8,8,8,.96), rgba(0,0,0,.98))",
        fontFamily: tokens.fontFamily,
      },
      glowTop: {
        position: "absolute",
        inset: "-120px -80px auto -80px",
        height: 220,
        background:
          "radial-gradient(circle at 35% 40%, rgba(176,160,236,.16), transparent 62%)," +
          "radial-gradient(circle at 70% 60%, rgba(244,240,230,.05), transparent 65%)",
        filter: "blur(18px)",
        opacity: 0.55,
        pointerEvents: "none",
      },

      // ✅ FIX: Always allow wrap; on mobile force brand full row + actions full row.
      inner: {
        position: "relative",
        width: "min(1100px, 100%)",
        margin: "0 auto",
        padding: `0 ${padX}px`,
        display: "flex",
        flexWrap: "wrap", // ✅ key: prevents overlap when space gets tight
        alignItems: "center",
        justifyContent: "space-between",
        columnGap: 18,
        rowGap: isMobile ? 14 : 18,
      },

      // ✅ FIX: Brand takes full width on mobile so actions cannot sit beside it
      brand: {
        display: "flex",
        alignItems: "center",
        gap: 14,
        minWidth: 0,
        flex: isMobile ? "0 0 100%" : "1 1 auto", // ✅ full row on mobile
      },
      logoLink: {
        display: "flex",
        alignItems: "center",
        textDecoration: "none",
      },
      logo: {
        height: logoH,
        width: "auto",
        display: "block",
        objectFit: "contain",
        filter: "drop-shadow(0 16px 24px rgba(0,0,0,.55))",
        opacity: 0.96,
      },
      meta: {
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      },
      name: {
        color: tokens.ink,
        fontWeight: 700,
        letterSpacing: ".06em",
        textTransform: "uppercase",
        fontSize: 12,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        display: isTiny ? "none" : "block",
      },
      tagline: {
        color: tokens.ink3,
        fontSize: 12,
        lineHeight: 1.35,
        maxWidth: isTiny ? 0 : isTabletDown ? 320 : 420,
        display: isTiny ? "none" : "block",
      },

      // ✅ FIX: Actions becomes its own row on mobile (full width + centered)
      actions: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
        justifyContent: isMobile ? "center" : "flex-end",
        flex: isMobile ? "0 0 100%" : "0 0 auto", // ✅ full row on mobile
      },
      btn: {
        borderRadius: 999,
        padding: btnPad,
        border: "1px solid rgba(255,255,255,.12)",
        background: "rgba(255,255,255,.04)",
        color: tokens.ink,
        fontSize: btnFont,
        letterSpacing: ".14em",
        textTransform: "uppercase",
        cursor: "pointer",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,.05), 0 10px 22px rgba(0,0,0,.32)",
        whiteSpace: "nowrap",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      },
      btnPrimary: {
        borderColor: "rgba(176,160,236,.55)",
        background:
          "radial-gradient(circle at 30% 20%, rgba(176,160,236,.18), transparent 55%), rgba(255,255,255,.04)",
      },
      btnSecondary: {
        borderColor: "rgba(244,240,230,.16)",
        background: "rgba(255,255,255,.03)",
      },

      bottom: {
        position: "relative",
        width: "min(1100px, 100%)",
        margin: "18px auto 0",
        padding: `14px ${padX}px 0`,
        borderTop: "1px solid rgba(255,255,255,.07)",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "center" : "center",
        justifyContent: isMobile ? "center" : "space-between",
        gap: isMobile ? 10 : 12,
        flexWrap: "wrap",
        textAlign: isMobile ? "center" : "left",
      },

      legal: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
        color: tokens.ink3,
        fontSize: 12,
        lineHeight: 1.4,
        justifyContent: isMobile ? "center" : "flex-start",
      },
      dot: { opacity: 0.55 },
      link: {
        color: "rgba(176,160,236,.92)",
        textDecoration: "none",
        borderBottom: "1px solid rgba(176,160,236,.28)",
        paddingBottom: 2,
      },

      credit: {
        color: "rgba(244,240,230,.56)",
        fontSize: 12,
        letterSpacing: ".02em",
        textDecoration: "none",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        borderBottom: "1px solid rgba(176,160,236,.18)",
        paddingBottom: 2,
      },
      creditName: {
        color: "rgba(176,160,236,.92)",
        fontWeight: 700,
      },
    }
  }, [isTabletDown, isMobile, isTiny, tokens])

  const goOrder = () => {
    if (typeof onOrderOnline === "function") return onOrderOnline()
    window.location.href = "/components/restaurant-ordering/order"
  }

  const goMenu = () => {
    if (typeof onMenu === "function") return onMenu()
    window.location.href = "/components/restaurant-ordering/menu"
  }

  return (
    <footer style={styles.shell} role="contentinfo">
      <div style={styles.glowTop} aria-hidden="true" />

      <div style={styles.inner}>
        <motion.div
          style={styles.brand}
          initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <a href="#" style={styles.logoLink} aria-label={restaurantName}>
            <img
              src={logoSrc}
              alt={restaurantName}
              style={styles.logo}
              draggable="false"
            />
          </a>

          <div style={styles.meta}>
            <div style={styles.name}>{restaurantName}</div>
            <div style={styles.tagline}>
              Handcrafted pies, pasta, and neighborhood hospitality.
            </div>
          </div>
        </motion.div>

        <motion.nav
          style={styles.actions}
          aria-label="Footer"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
        >
          <motion.button
            type="button"
            style={{ ...styles.btn, ...styles.btnPrimary }}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={goOrder}
          >
            Order Online
          </motion.button>

          <motion.button
            type="button"
            style={{ ...styles.btn, ...styles.btnSecondary }}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={goMenu}
          >
            Menu
          </motion.button>
        </motion.nav>
      </div>

      <div style={styles.bottom}>
        

        <a
          style={styles.credit}
          href="https://bergquistapplications.com/"
          target="_blank"
          rel="noreferrer"
          aria-label="Designed and built by Bergquist Applications"
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "rgba(244,240,230,.78)"
            e.currentTarget.style.borderBottomColor = "rgba(176,160,236,.55)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(244,240,230,.56)"
            e.currentTarget.style.borderBottomColor = "rgba(176,160,236,.18)"
          }}
        >
          Designed &amp; built by{" "}
          <span style={styles.creditName}>Bergquist Applications</span>
        </a>
      </div>
    </footer>
  )
}
