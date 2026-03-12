import React from "react"
import { motion } from "framer-motion"

export default function RestaurantPizzeriaNav({
  logoSrc = "/restaurant/smalllogo.png",
  restaurantName = "Italiana",
}) {
  const go = (path) => (e) => {
    e?.preventDefault?.()
    // Works in any React app (Next.js, CRA, Vite, etc.)
    if (typeof window !== "undefined") window.location.href = path
  }

  return (
    <header className="vpz-navShell">
      <div className="vpz-navInner">
        <motion.a
          href="/"
          className="vpz-brand"
          aria-label={restaurantName}
          initial={{ opacity: 0, y: -10, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <img
            src={logoSrc}
            alt={restaurantName}
            className="vpz-navLogo"
            draggable="false"
          />
        </motion.a>

        <nav className="vpz-navActions" aria-label="Primary">
          <motion.button
            type="button"
            className="vpz-navBtn vpz-navPrimary"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={go("restaurant/order")}
          >
            Order Online
          </motion.button>

          <motion.button
            type="button"
            className="vpz-navBtn vpz-navSecondary"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={go("restaurant/menu")}
          >
            Menu
          </motion.button>
        </nav>
      </div>

      <style>{css}</style>
    </header>
  )
}

const css = `
  :root{
    --vpz-ink:#f4f0e6;
    --vpz-ink2:rgba(244,240,230,.82);
    --vpz-ink3:rgba(244,240,230,.62);
    --vpz-gold:rgba(214,177,104,.95);
  }

  *{ box-sizing:border-box; }

  .vpz-navShell{
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 999;
    height: 110px;
    display: flex;
    align-items: center;
    padding: 32px 48px;
    background: transparent;
    border: none;
    pointer-events: none;
  }

  .vpz-navInner{
    width: min(1100px, 100%);
    margin: 0 auto;
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap: 16px;
    pointer-events: auto;
  }

  .vpz-brand{
    position:relative;
    display:flex;
    align-items:center;
    text-decoration:none;
    user-select:none;
    min-width: 0;
    transform: translateX(clamp(8px, 2.4vw - 6px, 44px));
  }

  .vpz-navLogo{
    height: clamp(140px, 6vw, 92px);
    width: auto;
    display:block;
    object-fit: contain;
    filter: drop-shadow(0 18px 26px rgba(0,0,0,.60));
  }

  .vpz-navActions{
    display:flex;
    align-items:center;
    gap: 10px;
    flex-wrap: wrap;
    justify-content:flex-end;
  }

  .vpz-navBtn{
    border-radius: 999px;
    padding: 11px 16px;
    border: 1px solid rgba(255,255,255,.14);
    background: linear-gradient(180deg, rgba(18,18,18,.98), rgba(6,6,6,.98));
    color: var(--vpz-ink);
    font-size: 12px;
    letter-spacing: .14em;
    text-transform: uppercase;
    cursor:pointer;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.06),
      0 12px 24px rgba(0,0,0,.32);
    white-space: nowrap;
  }

  .vpz-navPrimary{
    border-color: rgba(214,177,104,.55);
    background:
      radial-gradient(circle at 30% 20%, rgba(214,177,104,.20), transparent 52%),
      linear-gradient(180deg, rgba(26,22,14,.98), rgba(8,8,8,.98));
  }

  .vpz-navSecondary{
    border-color: rgba(244,240,230,.20);
    background: linear-gradient(180deg, rgba(22,22,22,.98), rgba(8,8,8,.98));
  }

  .vpz-navBtn:focus{
    outline:none;
    box-shadow:
      0 0 0 3px rgba(214,177,104,.16),
      inset 0 1px 0 rgba(255,255,255,.06),
      0 12px 24px rgba(0,0,0,.32);
  }

  @media (max-width: 520px){
    .vpz-navShell{ height: 96px; padding: 12px 12px; }
    .vpz-brand{ transform: translateX(22px); }
    .vpz-navBtn{ padding: 10px 14px; font-size: 11px; }
  }

  @media (max-width: 360px){
    .vpz-brand{ transform: translateX(30px); }
  }

  @media (max-width: 380px){
    .vpz-navShell{ height: 92px; }
    .vpz-navActions{ gap: 8px; }
    .vpz-navBtn{ letter-spacing: .12em; }
  }
`
