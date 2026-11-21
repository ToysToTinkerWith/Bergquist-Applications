import React, { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { restaurantFeaturedImage } from "../../lib/restaurantMenuImages"
import useMediaQuery from "@mui/material/useMediaQuery"

export default function RestaurantFavorites({
  categories = [
    {
      key: "pizza",
      name: "Pizza",
      icon: "/restaurant/pizza.png",
      items: [
        {
          key: "pizza-neapolitan-special",
          title: "Neapolitan House Special",
          desc: "Thin crust, bright tomato sauce, mozzarella, basil, and a finishing drizzle of olive oil.",
          imageSrc: restaurantFeaturedImage("neapolitan-house-special"),
        },
        {
          key: "pizza-sicilian-pepperoni",
          title: "Sicilian Pepperoni",
          desc: "Thick crust, mozzarella, classic pepperoni, and a hearty red sauce—crispy edges, soft center.",
          imageSrc: restaurantFeaturedImage("sicilian-pepperoni"),
        },
      ],
    },
    {
      key: "pasta",
      name: "Pasta",
      icon: "/restaurant/pasta.png",
      items: [
        {
          key: "pasta-baked-ziti",
          title: "Baked Ziti",
          desc: "Penne in marinara with melted mozzarella and ricotta, baked until bubbling and golden.",
          imageSrc: restaurantFeaturedImage("baked-ziti"),
        },
        {
          key: "pasta-spaghetti-meatballs",
          title: "Spaghetti & Meatballs",
          desc: "Classic spaghetti with house marinara and tender meatballs, finished with parmesan.",
          imageSrc: restaurantFeaturedImage("spaghetti"),
        },
      ],
    },
    {
      key: "salads",
      name: "Salads",
      icon: "/restaurant/salads.png",
      items: [
        {
          key: "salad-caesar",
          title: "Classic Caesar",
          desc: "Crisp romaine, parmesan, garlic croutons, and creamy Caesar dressing.",
          imageSrc: restaurantFeaturedImage("classic-caesar"),
        },
        {
          key: "salad-garden",
          title: "Garden Salad",
          desc: "Mixed greens, tomatoes, cucumbers, red onion, and a simple house vinaigrette.",
          imageSrc: restaurantFeaturedImage("garden-salad"),
        },
      ],
    },
  ],
}) {
  const [modal, setModal] = useState(null) // { key, title, src } | null
  const [focusedKey, setFocusedKey] = useState(null)

  // Keep SSR stable for responsive sizing
  const isDesktop = useMediaQuery("(min-width:900px)", { noSsr: true })
  const isSmall = useMediaQuery("(max-width:420px)", { noSsr: true })

  const tokens = useMemo(
    () => ({
      ink: "#f4f0e6",
      ink2: "rgba(244,240,230,.82)",
      ink3: "rgba(244,240,230,.62)",
      gold: "rgba(176,160,236,.95)",
      shadow: "rgba(0,0,0,.55)",
      // Hero font
      fontFamily: "ui-serif, Georgia, Times New Roman, Times, serif",
    }),
    []
  )

  const categoryImageByKey = useMemo(
    () => ({
      pizza: "/restaurant/menu/pizza.jpg",
      pasta: "/restaurant/menu/pasta.jpg",
      salads: "/restaurant/menu/salad.jpg",
    }),
    []
  )

  const styles = useMemo(() => {
    const kickerLineWidth = isSmall ? "min(110px, 18vw)" : "min(170px, 22vw)"
    const iconSize = isSmall ? 80 : 86
    const itemMediaSize = isSmall ? 66 : 72
    const itemMediaRadius = isSmall ? 15 : 16
    const itemTitleSize = isSmall ? 14 : 15

    return {
      shell: {
        position: "relative",
        padding: "34px 14px",
        display: "flex",
        justifyContent: "center",
        overflow: "hidden",
        background: "#060606",
        color: tokens.ink,

        // ✅ Match Hero font styling
        fontFamily: tokens.fontFamily,
      },
      bg: {
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        background:
          "radial-gradient(circle at 78% 22%, rgba(176,160,236,.20), transparent 55%)," +
          "radial-gradient(circle at 18% 78%, rgba(176,160,236,.10), transparent 58%)," +
          "linear-gradient(180deg, rgba(12,12,12,1), rgba(5,5,5,1))",
        filter: "saturate(1.05) contrast(1.02)",
        opacity: 1,
      },
      glow: {
        position: "absolute",
        inset: "-140px -60px",
        zIndex: 0,
        background:
          "radial-gradient(circle at 30% 20%, rgba(176,160,236,.10), transparent 60%)," +
          "radial-gradient(circle at 75% 80%, rgba(244,240,230,.05), transparent 62%)",
        pointerEvents: "none",
        opacity: 0.55,
      },
      wrap: {
        width: "min(1040px, 100%)",
        position: "relative",
        zIndex: 1,
      },

      head: {
        textAlign: "center",
        padding: "6px 8px 16px",

        // ✅ Match Hero text shadow feel
        textShadow: `0 10px 26px ${tokens.shadow}`,
      },
      kickerRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        marginBottom: 8,
      },
      kickerText: {
        letterSpacing: ".18em",
        textTransform: "uppercase",
        fontSize: 12,
        color: tokens.ink3,
        whiteSpace: "nowrap",
      },
      kickerLine: {
        height: 1,
        width: kickerLineWidth,
        background:
          "linear-gradient(90deg, transparent, rgba(244,240,230,.28), transparent)",
        opacity: 0.9,
      },
      blurb: {
        margin: "0 auto",
        maxWidth: "72ch",
        fontSize: 14,
        lineHeight: 1.6,
        color: tokens.ink2,
      },
      catsGrid: {
        display: "grid",
        gridTemplateColumns: isDesktop ? "repeat(3, 1fr)" : "1fr",
        gap: isDesktop ? 14 : 16,
        alignItems: isDesktop ? "start" : "stretch",
      },
      cat: {
        padding: "14px 14px",
        height: isDesktop ? "100%" : "auto",
      },
      catHero: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "4px 6px 12px",
      },
      catIcon: {
        width: iconSize,
        height: iconSize,
        objectFit: "contain",
        filter: "drop-shadow(0 14px 22px rgba(0,0,0,.55))",
        opacity: 0.99,
      },
      catRule: {
        height: 1,
        width: "100%",
        background:
          "linear-gradient(90deg, transparent, rgba(176,160,236,.35), rgba(244,240,230,.10), transparent)",
        opacity: 0.9,
      },

      items: {
        display: "grid",
        gap: 10,
      },
      item: (isFocused) => ({
        display: "flex",
        gap: 12,
        alignItems: "center",
        borderRadius: 16,
        padding: "12px 12px",
        background:
          "linear-gradient(180deg, rgba(18,18,18,.92), rgba(6,6,6,.92))",
        border: "1px solid rgba(244,240,230,.10)",
        boxShadow: isFocused
          ? "inset 0 1px 0 rgba(255,255,255,.06), 0 0 0 2px rgba(176,160,236,.28)"
          : "inset 0 1px 0 rgba(255,255,255,.06)",
        cursor: "pointer",
        userSelect: "none",
        outline: "none",
      }),
      itemMedia: {
        width: itemMediaSize,
        height: itemMediaSize,
        borderRadius: itemMediaRadius,
        flex: "0 0 auto",
        objectFit: "cover",
        border: "1px solid rgba(244,240,230,.12)",
        background: "rgba(255,255,255,.03)",
        display: "block",
      },
      itemMediaEmpty: {
        width: itemMediaSize,
        height: itemMediaSize,
        borderRadius: itemMediaRadius,
        flex: "0 0 auto",
        position: "relative",
        border: "1px dashed rgba(176,160,236,.40)",
        background:
          "radial-gradient(circle at 30% 20%, rgba(176,160,236,.10), transparent 60%), rgba(0,0,0,.20)",
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
      },
      itemMediaEmptyLabel: {
        fontSize: 11,
        letterSpacing: ".14em",
        textTransform: "uppercase",
        color: "rgba(244,240,230,.55)",
      },
      itemText: { minWidth: 0 },
      itemTitle: {
        fontSize: itemTitleSize,
        lineHeight: 1.2,
        color: tokens.ink,
        marginBottom: 6,
      },
      itemDesc: {
        fontSize: 13,
        lineHeight: 1.55,
        color: tokens.ink2,
      },

      // Modal
      modalOverlay: {
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "grid",
        placeItems: "center",
        padding: 16,
        background: "rgba(0,0,0,.72)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      },
      modalPanel: {
        width: "min(920px, 100%)",
        borderRadius: 18,
        border: "1px solid rgba(244,240,230,.12)",
        background:
          "linear-gradient(180deg, rgba(14,14,14,.92), rgba(6,6,6,.92))",
        boxShadow: "0 30px 80px rgba(0,0,0,.55)",
        overflow: "hidden",
      },
      modalTitle: {
        padding: "12px 14px 10px",
        fontSize: 13,
        letterSpacing: ".10em",
        textTransform: "uppercase",
        color: "rgba(176,160,236,.90)",
        borderBottom: "1px solid rgba(244,240,230,.10)",
        background:
          "linear-gradient(90deg, rgba(176,160,236,.10), rgba(0,0,0,0))",
      },
      modalImg: {
        display: "block",
        width: "100%",
        height: "auto",
        maxHeight: "min(70vh, 720px)",
        objectFit: "cover",
        background: "#000",
      },
      modalHint: {
        padding: "10px 14px 12px",
        fontSize: 12,
        color: "rgba(244,240,230,.70)",
        borderTop: "1px solid rgba(244,240,230,.10)",
        textAlign: "center",
      },
    }
  }, [isDesktop, isSmall, tokens])

  function openModal(next) {
    setModal(next)
  }

  function closeModal() {
    setModal(null)
  }

  return (
    <section style={styles.shell} aria-label="Village Pizzeria Favorites">
      <div style={styles.bg} aria-hidden="true" />
      <div style={styles.glow} aria-hidden="true" />

      <motion.div
        style={styles.wrap}
        initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <header style={styles.head}>
          <div style={styles.kickerRow} role="presentation">
            <span style={styles.kickerLine} aria-hidden="true" />
            <span style={styles.kickerText}>House Favorites</span>
            <span style={styles.kickerLine} aria-hidden="true" />
          </div>

          <p style={styles.blurb}>
            A few guest favorites across pizza, pasta, and salads—presented
            simply, in the Italiana style.
          </p>
        </header>

        <div style={styles.catsGrid}>
          {categories.map((cat, catIdx) => (
            <motion.section
              key={cat.key}
              style={styles.cat}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.35,
                ease: "easeOut",
                delay: 0.04 * catIdx,
              }}
            >
              <div style={styles.catHero} aria-hidden="true">
                <img style={styles.catIcon} src={cat.icon} alt="" />
                <div style={styles.catRule} />
              </div>

              <div style={styles.items}>
                {cat.items.slice(0, 2).map((it) => {
                  const catImg = categoryImageByKey[cat.key] || ""
                  const mediaSrc = it.imageSrc || catImg
                  const isFocused = focusedKey === it.key

                  return (
                    <motion.article
                      key={it.key}
                      style={styles.item(isFocused)}
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      onClick={() =>
                        openModal({ key: it.key, title: it.title, src: mediaSrc })
                      }
                      role="button"
                      tabIndex={0}
                      aria-label={`Open image for ${it.title}`}
                      onFocus={() => setFocusedKey(it.key)}
                      onBlur={() => setFocusedKey(null)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          openModal({ key: it.key, title: it.title, src: mediaSrc })
                        }
                      }}
                    >
                      {mediaSrc ? (
                        <img
                          style={styles.itemMedia}
                          loading="lazy" decoding="async" src={mediaSrc}
                          alt={it.title}
                          draggable="false"
                        />
                      ) : (
                        <div style={styles.itemMediaEmpty} aria-hidden="true">
                          <div style={styles.itemMediaEmptyLabel}>Image</div>
                        </div>
                      )}

                      <div style={styles.itemText}>
                        <div style={styles.itemTitle}>{it.title}</div>
                        <div style={styles.itemDesc}>{it.desc}</div>
                      </div>
                    </motion.article>
                  )
                })}
              </div>
            </motion.section>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {modal?.src ? (
          <motion.div
            style={styles.modalOverlay}
            role="dialog"
            aria-modal="true"
            aria-label={modal.title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={closeModal}
          >
            <motion.div
              style={styles.modalPanel}
              initial={{ opacity: 0, y: 8, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.985 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <div style={styles.modalTitle}>{modal.title}</div>
              <img
                style={styles.modalImg}
                src={modal.src}
                alt={modal.title}
                draggable="false"
              />
              <div style={styles.modalHint}>Click anywhere to close</div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  )
}
