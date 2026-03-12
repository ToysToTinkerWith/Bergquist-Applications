import React from "react"
import { motion } from "framer-motion"

export default function RestaurantPizzeriaHero({
  logoSrc = "/restaurant/logo.png",
  restaurantName = "Italiana",
  blurb = "A warm, family-style Italian restaurant serving classic favorites with fresh ingredients and a warm, small town feel.",
  onOrderOnline,
  onMenu,
}) {
  return (
    <div className="vpz-heroShell">
      <div className="vpz-bgImage" aria-hidden="true" />

      <motion.section
        className="vpz-heroCard"
        initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className="vpz-logoWrap">
          <motion.img
            src={logoSrc}
            alt={restaurantName}
            className="vpz-logo"
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 }}
          />
          <div className="vpz-logoGlow" aria-hidden="true" />
        </div>

        <div className="vpz-text">
          {/* UPDATED: kicker now includes horizontal lines */}
          <div className="vpz-kickerRow" role="presentation">
            <span className="vpz-kickerLine" aria-hidden="true" />
            <span className="vpz-kickerText">Italian Restaurant</span>
            <span className="vpz-kickerLine" aria-hidden="true" />
          </div>

          <p className="vpz-blurb">{blurb}</p>
        </div>

       
      </motion.section>

      <style>{css}</style>
    </div>
  )
}

const css = `
  :root{
    --vpz-ink:#f4f0e6;
    --vpz-ink2:rgba(244,240,230,.82);
    --vpz-ink3:rgba(244,240,230,.62);
    --vpz-line:rgba(244,240,230,.18);
    --vpz-gold:rgba(214,177,104,.95);
    --vpz-shadow:rgba(0,0,0,.55);
  }

  *{ box-sizing:border-box; }

  .vpz-heroShell{
    min-height: 100vh;
    display:grid;
    place-items:center;
    padding: 22px 14px;
    color: var(--vpz-ink);
    font-family: ui-serif, Georgia, Times New Roman, Times, serif;
    position:relative;
    overflow:hidden;
    background:#000;
  }

  .vpz-bgImage{
    position:absolute; inset:0;
    background-image: url(/restaurant/dark.png);
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    transform: scale(1.03);
    filter: contrast(1.02) brightness(1.45);
    opacity: 1;
    z-index: 0;
    pointer-events:none;
  }

  .vpz-heroCard{
    width: min(680px, 100%);
    border: none;
    border-radius: 22px;
    background: transparent;
    box-shadow: none;
    padding: 18px 16px 14px;
    position:relative;
    overflow:visible;
    z-index: 1;
    backdrop-filter: none;
  }

  .vpz-logoWrap{
    position:relative;
    width: min(360px, 82%);
    margin: 6px auto 14px;
    padding: 0;
    border: none;
    background: transparent;
    border-radius: 0;
  }

  .vpz-logo{
    width:100%;
    height:auto;
    display:block;
    object-fit:contain;
    filter: drop-shadow(0 18px 28px rgba(0,0,0,.65));
  }

  .vpz-logoGlow{
    position:absolute;
    inset:-90px;
    background:
      radial-gradient(circle at 40% 20%, rgba(214,177,104,.12), transparent 58%),
      radial-gradient(circle at 75% 75%, rgba(244,240,230,.06), transparent 62%);
    pointer-events:none;
    mix-blend-mode: screen;
    opacity:.40;
  }

  .vpz-text{
    text-align:center;
    padding: 0 8px;
    text-shadow: 0 10px 26px rgba(0,0,0,.55);
  }

  /* UPDATED: Kicker with tasteful horizontal lines */
  .vpz-kickerRow{
    display:flex;
    align-items:center;
    justify-content:center;
    gap: 10px;
    margin-bottom: 6px;
  }

  .vpz-kickerText{
    letter-spacing:.18em;
    text-transform:uppercase;
    font-size:12px;
    color: var(--vpz-ink3);
    white-space: nowrap;
  }

  .vpz-kickerLine{
    height: 1px;
    width: min(140px, 20vw);
    background: linear-gradient(90deg, transparent, rgba(244,240,230,.28), transparent);
    opacity: .9;
  }

  .vpz-blurb{
    margin: 10px auto 0;
    max-width: 54ch;
    font-size: 14px;
    line-height: 1.55;
    color: var(--vpz-ink2);
  }

  .vpz-actions{
    display:flex;
    gap: 10px;
    justify-content:center;
    margin-top: 16px;
    flex-wrap:wrap;
  }

  .vpz-btn{
    border-radius: 999px;
    padding: 11px 16px;
    border: 1px solid rgba(255,255,255,.14);
    /* UPDATED: solid (non-see-through) button background */
    background: linear-gradient(180deg, rgba(18,18,18,.98), rgba(6,6,6,.98));
    color: var(--vpz-ink);
    font-size: 12px;
    letter-spacing: .14em;
    text-transform: uppercase;
    cursor:pointer;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.06),
      0 10px 26px rgba(0,0,0,.35);
  }

  .vpsz-primary{
    border-color: rgba(214,177,104,.55);
    background:
      radial-gradient(circle at 30% 20%, rgba(214,177,104,.18), transparent 52%),
      linear-gradient(180deg, rgba(26,22,14,.98), rgba(8,8,8,.98));
  }

  .vpsz-secondary{
    border-color: rgba(244,240,230,.20);
    background: linear-gradient(180deg, rgba(22,22,22,.98), rgba(8,8,8,.98));
  }

  .vpz-btn:focus{
    outline:none;
    box-shadow:
      0 0 0 3px rgba(214,177,104,.16),
      inset 0 1px 0 rgba(255,255,255,.06),
      0 10px 26px rgba(0,0,0,.35);
  }

  @media (max-width: 420px){
    .vpz-heroCard{ border-radius: 18px; }
    .vpz-logoWrap{ width: min(340px, 90%); }
    .vpz-btn{ padding: 10px 14px; font-size: 11px; }
    .vpz-kickerLine{ width: min(110px, 18vw); }
  }
`
