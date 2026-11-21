"use client"

import React, { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { restaurantMenuImage } from "../../../lib/restaurantMenuImages"
import getStripe from "../../../lib/get-stripe" // adjust path if your component lives elsewhere

const MENU = [
  {
    id: "pizza",
    title: "Pizza",
    subtitle: "Thin crust, thick crust, build-your-own, and slices",
    groups: [
      {
        title: "Create Your Own Neapolitan Pizza",
        note: "Thin crust. Sizes were not specified in the provided menu text.",
        items: [
          { name: "Pizza With One Topping", price: 15.75 },
          { name: "Pizza With Two Toppings", price: 16.75 },
          { name: "Pizza With Three Toppings", price: 17.75 },
          { name: "Pizza With Four Toppings", price: 18.75 },
        ],
      },
      {
        title: "Neapolitan Thin Crust Specialty Pizzas",
        items: [
          { name: "Plain Pizza", desc: "Classic cheese or create your own pizza.", price: 14.75 },
          {
            name: "Italiana Special Pizza",
            desc:
              "Homemade meatball, homemade sausage, pepperoni, onions, green peppers, mushrooms, olives and anchovies.",
            price: 20.25,
          },
          {
            name: "Meat Lovers Italian Deli Pizza",
            desc: "Homemade sausage meatballs, Italian salami, pepperoni.",
            price: 18.75,
          },
          { name: "Ham Pineapple Pizza", price: 16.75 },
          {
            name: "Clam Garlic Pizza",
            desc: "We invented this one! Chopped clams, garlic, parsley spices in olive oil or pizza sauce base.",
            price: 20.25,
          },
          {
            name: "Chicken Bacon Ranch Pizza",
            desc: "Ranch or pizza sauce base with chicken, red onions, bacon and cilantro.",
            price: 20.25,
          },
          {
            name: "Chicken Caesar Pizza",
            desc: "Olive oil base with mozzarella, parmesan romano, topped with our famous chicken caesar salad.",
            price: 20.25,
          },
          {
            name: "BBQ Chicken Pizza",
            desc: "Carters BBQ sauce base with chicken, bacon, mozzarella, asiago, red onion and cilantro.",
            price: 20.25,
          },
          {
            name: "Greek Pizza",
            desc: "Olives, feta, Roma tomatoes, oregano, pizza sauce, and mozzarella cheese.",
            price: 19.75,
          },
          {
            name: "Spinach Feta Pizza",
            desc: "Garlic and olive oil base, sautéed spinach and onion, feta, romano mozzarella.",
            price: 18.75,
          },
          {
            name: "Veggie Pizza",
            desc: "Onions, green peppers, mushrooms, olives, pizza sauce and mozzarella.",
            price: 18.75,
          },
          {
            name: "Pesto Pizza",
            desc: "Basil, garlic, olive oil, parmesan and mozzarella cheese and pizza sauce.",
            price: 18.75,
          },
          {
            name: "Esta Feta Pizza",
            desc: "Pesto base, artichokes, Roma tomatoes, green onions, roasted red peppers, feta and garlic.",
            price: 20.25,
          },
        ],
      },
      {
        title: "Sicilian Thick Crust Specialty Pizzas",
        items: [
          { name: "Plain Pizza", price: 15.5 },
          {
            name: "Italiana Special Pizza",
            desc:
              "Homemade meatball, homemade sausage, pepperoni, onions, green peppers, mushrooms, olives and anchovies.",
            price: 22.25,
          },
          {
            name: "Meat Lovers Italian Deli Pizza",
            desc: "Homemade sausage meatballs, Italian salami, pepperoni.",
            price: 19.5,
          },
          { name: "Ham Pineapple Pizza", price: 17.75 },
          {
            name: "Clam Garlic Pizza",
            desc: "We invented this one! Chopped clams, garlic, parsley spices in olive oil or pizza sauce base.",
            price: 22.25,
          },
          {
            name: "Chicken Bacon Ranch Pizza",
            desc: "Ranch or pizza sauce base with chicken, red onions, bacon and cilantro.",
            price: 21.25,
          },
          {
            name: "BBQ Chicken Pizza",
            desc: "Carters BBQ sauce base with chicken, bacon, mozzarella, asiago, red onion and cilantro.",
            price: 21.25,
          },
          {
            name: "Greek Pizza",
            desc: "Olives, feta, Roma tomatoes, oregano, pizza sauce, and mozzarella cheese.",
            price: 21.25,
          },
          {
            name: "Spinach Feta Pizza",
            desc: "Garlic and olive oil base, sautéed spinach and onion, feta, romano mozzarella.",
            price: 19.5,
          },
          {
            name: "Veggie Pizza",
            desc: "Onions, green peppers, mushrooms, olives, pizza sauce and mozzarella.",
            price: 19.5,
          },
          {
            name: "Pesto Pizza",
            desc: "Basil, garlic, olive oil, parmesan and mozzarella cheese and pizza sauce.",
            price: 19.5,
          },
          {
            name: "Esta Feta Pizza",
            desc: "Pesto base, artichokes, Roma tomatoes, green onions, roasted red peppers, feta and garlic.",
            price: 22.25,
          },
        ],
      },
      {
        title: "Create Your Own Sicilian Pizza",
        note: "Build-your-own. Pricing details were not included in the menu text provided.",
        items: [{ name: "Create Your Own Sicilian Pizza", desc: "Pricing not provided.", price: null }],
      },
      {
        title: "Pizza by the Slice",
        items: [
          {
            name: "Plain Pizza By The Slice",
            desc: "Premium mozzarella cheese, and our special blend of pizza sauce.",
            price: 3.35,
          },
        ],
      },
    ],
  },
  {
    id: "pasta",
    title: "Pasta",
    subtitle: "Comfort classics",
    groups: [
      {
        title: "Pasta Dishes",
        items: [
          {
            name: "Spaghetti",
            desc: "With marinara sauce and a choice of homemade meatballs, sausage or veggie.",
            price: 11.0,
          },
          { name: "Jumbo Cheese Ravioli", price: 6.75 },
          {
            name: "Greek Pasta",
            desc:
              "Pasta topped with chicken breast, sautéed with mushrooms, kalamata olives, feta cheese, fresh basil spinach. Choice of olive oil or marinara sauce.",
            price: 8.0,
          },
          {
            name: "Pasta Pesto",
            desc: "With our famous basil pesto, sautéed roasted red peppers, garlic and pure olive oil.",
            price: 7.0,
          },
        ],
      },
    ],
  },
  {
    id: "salads",
    title: "Salads",
    subtitle: "Fresh + classic",
    groups: [
      {
        title: "Salads",
        items: [
          {
            name: "Spinach Salad",
            desc:
              "Whole leaf spinach with tomatoes, feta cheese and kalamata olives served with our famous Italiana Pizzeria Italian dressing.",
            price: 4.5,
          },
        ],
      },
    ],
  },
  {
    id: "appetizers",
    title: "Appetizers",
    subtitle: "Start strong",
    groups: [
      {
        title: "Appetizers",
        items: [
          { name: "Bread Plate", desc: "Artisan bread, roasted garlic, a balsamic reduction, pure olive oil.", price: 5.0 },
          {
            name: "Antipasta Plate",
            desc: "Artisan bread, salami, prosciutto, ham, provolone, artichokes, kalamata olives and banana peppers.",
            price: 10.0,
          },
          {
            name: "Roasted Stuffed Portobella",
            desc: "Stuffed with spinach, roasted red peppers, ricotta cheese, topped with feta cheese.",
            price: 8.0,
          },
        ],
      },
    ],
  },
  {
    id: "sandwiches",
    title: "Sandwiches",
    subtitle: "Baked, stacked, and satisfying",
    groups: [
      {
        title: "Sandwiches",
        items: [
          {
            name: "Italian Hero",
            desc: "Homemade meatball or sausage, marinara sauce, provolone and mozzarella on an organic baguette.",
            price: 9.0,
          },
          {
            name: "European Style Grilled Chicken",
            desc: "Served on our famous focaccia with garlic aioli, roasted red peppers pesto.",
            price: 9.0,
          },
          {
            name: "Vegetarian Sandwich",
            desc:
              "Onions, mushrooms, olives, Roma tomatoes, roasted red peppers, fresh mixed greens, provolone on an organic baguette, topped with marinara and seasonings.",
            price: 9.0,
          },
          {
            name: "Italian Deli Sandwich",
            desc:
              "Salami, ham, provolone, prosciutto, fresh mixed greens and banana peppers on focaccia with salad dressing drizzle.",
            price: 10.0,
          },
          {
            name: "Portobello Sandwich",
            desc: "Sautéed portobella mushrooms, red onions, provolone and mozzarella, marinara on an organic baguette.",
            price: 10.0,
          },
          {
            name: "Steak Sandwich",
            desc:
              "Italian herb roast beef, sautéed red onions, fresh mixed greens, mozzarella, provolone and horseradish on an organic baguette.",
            price: 12.0,
          },
        ],
      },
    ],
  },
  {
    id: "desserts",
    title: "Desserts",
    subtitle: "Finish on a high note",
    groups: [
      {
        title: "Desserts",
        items: [
          { name: "Chocolate Decadence Cake", desc: "Rich, dense, moist and delicious for chocolate lovers.", price: 6.5 },
          { name: "Brooklyn Cheesecake", desc: "Classic cheesecake with graham cracker crust.", price: 6.5 },
        ],
      },
    ],
  },
  {
    id: "beverages",
    title: "Beverages",
    subtitle: "Classic café + refreshers",
    groups: [
      {
        title: "Beverages",
        items: [
          { name: "Iced Tea", price: 2.0 },
          { name: "Coffee", price: 2.0 },
          { name: "Milk", price: 2.0 },
          { name: "Chocolate Milk", price: 2.0 },
          { name: "Hot Chocolate", price: 2.0 },
          { name: "Hot Apple Cider", price: 2.0 },
          { name: "Apple Juice", price: 2.0 },
          { name: "Cranberry Juice", price: 2.0 },
          { name: "Orange Juice", price: 2.0 },
          { name: "Pellegrino Mineral Water", price: 3.0 },
          { name: "Limonata Aranciata", price: 3.0 },
          { name: "Thomas Kemper Root Beer", price: 3.0 },
          { name: "Craft Ginger Beer", price: 3.0 },
        ],
      },
    ],
  },
]

const CATEGORY_META = [
  { id: "pizza", img: "/restaurant/pizza.png" },
  { id: "pasta", img: "/restaurant/pasta.png" },
  { id: "salads", img: "/restaurant/salads.png" },
  { id: "appetizers", img: "/restaurant/appetizers.png" },
  { id: "sandwiches", img: "/restaurant/sandwiches.png" },
  { id: "desserts", img: "/restaurant/desserts.png" },
  { id: "beverages", img: "/restaurant/beverages.png" },
]


/**
 * OPTION LISTS (shown inline in the cart, full width)
 */
const TOPPING_OPTIONS = [
  "Pepperoni",
  "Sausage",
  "Mushrooms",
  "Onions",
  "Green Peppers",
  "Black Olives",
  "Bacon",
  "Ham",
  "Pineapple",
  "Jalapeños",
  "Extra Cheese",
  "Tomatoes",
]

const DRESSING_OPTIONS = ["Italian", "Ranch", "Caesar", "Balsamic Vinaigrette", "Blue Cheese", "Thousand Island"]

function money(v) {
  if (v === null || v === undefined) return "—"
  const n = Number(v)
  if (!Number.isFinite(n)) return "—"
  const s = n.toFixed(2)
  return s.endsWith("00") ? `$${n.toFixed(0)}` : `$${s}`
}
function safePrice(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}
function toCents(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.round(n * 100))
}
function makeItemKey(categoryId, groupTitle, itemName) {
  return `${categoryId}__${groupTitle}__${itemName}`
}
function blurActiveElement() {
  try {
    if (typeof document === "undefined") return
    const el = document.activeElement
    if (el && typeof el.blur === "function") el.blur()
  } catch {
    // ignore
  }
}

/**
 * Determines which items require selectable options inside the cart.
 * - Pizza with N toppings: requires exactly N toppings selected.
 * - Garden Salad / Spinach Salad: requires 1 dressing selected.
 */
function getOptionRequirementsForItemName(name) {
  const n = String(name || "")

  const pizzaMatch = n.match(/Pizza With (One|Two|Three|Four) Topping/i)
  if (pizzaMatch) {
    const word = (pizzaMatch[1] || "").toLowerCase()
    const map = { one: 1, two: 2, three: 3, four: 4 }
    const toppingsRequired = map[word] || 0
    return {
      kind: "toppings",
      toppingsRequired,
      dressingRequired: 0,
      title: `Choose ${toppingsRequired} topping${toppingsRequired === 1 ? "" : "s"}`,
    }
  }

  if (/Garden Salad/i.test(n) || /Spinach Salad/i.test(n)) {
    return {
      kind: "dressing",
      toppingsRequired: 0,
      dressingRequired: 1,
      title: "Choose a dressing",
    }
  }

  return { kind: null, toppingsRequired: 0, dressingRequired: 0, title: "" }
}

/**
 * Human-readable label used for Stripe checkout visibility.
 */
function formatSelectionsForCheckout(req, unit) {
  if (!req?.kind) return ""
  if (req.kind === "toppings") {
    const tops = Array.isArray(unit?.toppings) ? unit.toppings : []
    return `Toppings: ${tops.length ? tops.join(", ") : "—"}`
  }
  if (req.kind === "dressing") {
    const d = unit?.dressing || ""
    return `Dressing: ${d || "—"}`
  }
  return ""
}

function CategoryImageButton({ imgSrc, isActive, onClick, ariaLabel, buttonStyle, frameStyle }) {
  const baseBtn = {
    position: "relative",
    border: "1px solid rgba(244,240,230,0.12)",
    background: "rgba(0,0,0,0.22)",
    borderRadius: 14,
    padding: 0,
    overflow: "hidden",
    cursor: "pointer",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
    aspectRatio: "1 / 1",
    appearance: "none",
    WebkitAppearance: "none",
    outline: "none",
    boxSizing: "border-box",
  }

  const activeBtn = isActive
    ? {
        borderColor: "rgba(176,160,236,0.45)",
        background: "linear-gradient(180deg, rgba(176,160,236,0.10), rgba(0,0,0,0.22))",
      }
    : null

  const baseFrame = {
    display: "block",
    width: "100%",
    height: "100%",
    padding: 8,
    background:
      "radial-gradient(260px 90px at 30% 0%, rgba(176,160,236,0.10), transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0.0))",
    boxSizing: "border-box",
  }

  const glow = {
    position: "absolute",
    inset: -30,
    background: "radial-gradient(circle at 50% 40%, rgba(176,160,236,0.16), transparent 55%)",
    opacity: isActive ? 0.95 : 0,
    pointerEvents: "none",
    transition: "opacity .18s ease",
  }

  return (
    <motion.button
      type="button"
      onClick={(e) => {
        e.currentTarget.blur?.()
        blurActiveElement()
        onClick?.()
      }}
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -1 }}
      transition={{ duration: 0.14 }}
      aria-label={ariaLabel}
      title={ariaLabel}
      style={{ ...baseBtn, ...(activeBtn || {}), ...(buttonStyle || {}) }}
    >
      <span aria-hidden="true" style={{ ...baseFrame, ...(frameStyle || {}) }}>
        <img
          src={imgSrc}
          alt=""
          draggable="false"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            filter: "saturate(1.05) contrast(1.02)",
            display: "block",
          }}
        />
      </span>
      <span aria-hidden="true" style={glow} />
    </motion.button>
  )
}

/**
 * IMPORTANT: To prevent any "sticky" border after select/deselect,
 * we compute borderColor + boxShadow explicitly each render (no style-object merging
 * that could ever leave a prior shadow behind).
 */
function OptionPill({ label, active, disabled, onClick, styles, ariaLabel }) {
  const borderColor = active ? "rgba(176,160,236,0.46)" : "rgba(255,255,255,0.14)"

  // Base boxShadow always the same; active adds a consistent inner ring.
  const boxShadow = active
    ? "inset 0 0 0 1px rgba(176,160,236,0.22), inset 0 1px 0 rgba(255,255,255,0.04)"
    : "inset 0 1px 0 rgba(255,255,255,0.04)"

  const background = active
    ? "radial-gradient(circle at 30% 20%, rgba(176,160,236,0.16), transparent 60%), rgba(0,0,0,0.14)"
    : "rgba(0,0,0,0.16)"

  const opacity = disabled ? 0.55 : 1

  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { scale: 0.98 }}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (disabled) return
        e.currentTarget.blur?.()
        blurActiveElement()
        onClick?.()
      }}
      aria-label={ariaLabel || label}
      aria-pressed={!!active}
      disabled={disabled}
      style={{
        ...styles.optionPill,
        borderColor,
        boxShadow,
        background,
        opacity,
        transition: "border-color 120ms ease, box-shadow 120ms ease, background 120ms ease, opacity 120ms ease",
      }}
      title={label}
    >
      {label}
    </motion.button>
  )
}

/**
 * CartRow:
 * - For optioned items, we show ONE option selector per quantity.
 * - Each unit can have distinct toppings/dressing.
 * - Each unit selector can be flagged in red if that unit is incomplete.
 *
 * IMPORTANT CHANGE:
 * - Only show "#n" tags in the cart UI when qty > 1 (and req.kind exists).
 */
function CartRow({
  itemKey,
  name,
  unitPrice,
  qty,
  imgSrc,
  req,
  unitOptions, // array length === qty for optioned items
  issuesForUnits, // { [unitIndex]: "message" }
  anyIssue,
  onInc,
  onDec,
  onRemove,
  onImageClick,
  onToggleToppingUnit,
  onSetDressingUnit,
  styles,
}) {
  const line = unitPrice * qty

  return (
    <div style={{ ...styles.cartRowWrap, ...(anyIssue ? styles.cartRowWrapIssue : null) }}>
      <div style={styles.cartRow}>
        <motion.button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            e.currentTarget.blur?.()
            blurActiveElement()
            onImageClick?.()
          }}
          whileTap={{ scale: 0.98 }}
          aria-label={`View larger image for ${name}`}
          title="View image"
          style={styles.cartThumbBtn}
        >
          {imgSrc ? (
            <img src={imgSrc} alt={name} draggable="false" style={styles.cartThumbImg} />
          ) : (
            <div aria-hidden="true" style={styles.cartThumbFallback} />
          )}
        </motion.button>

        <div style={styles.cartLeft}>
          <div style={styles.cartName}>{name}</div>
          <div style={styles.cartMeta}>
            <span style={styles.cartUnit}>{money(unitPrice)}</span>
            <span aria-hidden="true" style={styles.dot}>
              ·
            </span>
            <span style={styles.cartQtyLabel}>Qty</span>
          </div>
        </div>

        <div style={styles.cartRight}>
          <div style={styles.qty}>
            <motion.button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                e.currentTarget.blur?.()
                blurActiveElement()
                onDec()
              }}
              whileTap={{ scale: 0.98 }}
              aria-label={`Decrease quantity for ${name}`}
              style={styles.qtyBtn}
            >
              −
            </motion.button>

            <div style={styles.qtyVal} aria-label={`Quantity ${qty}`}>
              {qty}
            </div>

            <motion.button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                e.currentTarget.blur?.()
                blurActiveElement()
                onInc()
              }}
              whileTap={{ scale: 0.98 }}
              aria-label={`Increase quantity for ${name}`}
              style={styles.qtyBtn}
            >
              +
            </motion.button>
          </div>

          <div style={styles.cartLine}>{money(line)}</div>

          <motion.button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              e.currentTarget.blur?.()
              blurActiveElement()
              onRemove()
            }}
            whileTap={{ scale: 0.98 }}
            aria-label={`Remove ${name} from cart`}
            title="Remove"
            style={styles.cartRemove}
          >
            ✕
          </motion.button>
        </div>
      </div>

      {/* FULL-WIDTH INLINE OPTIONS (one per qty, with per-unit validation) */}
      {req?.kind ? (
        <div style={styles.optionSection} aria-label={`Options for ${name}`}>
          {Array.from({ length: qty }).map((_, unitIndex) => {
            const unit = unitOptions?.[unitIndex] || (req.kind === "toppings" ? { toppings: [] } : { dressing: "" })
            const selectedToppings = Array.isArray(unit?.toppings) ? unit.toppings : []
            const selectedDressing = unit?.dressing || ""
            const unitIssue = issuesForUnits?.[unitIndex] || ""
            const unitHasIssue = !!unitIssue

            return (
              <div
                key={`${itemKey}__u${unitIndex}`}
                style={{
                  ...styles.optionUnitWrap,
                  ...(unitHasIssue ? styles.optionUnitWrapIssue : null),
                }}
                aria-label={`${req.title} for item ${unitIndex + 1} of ${qty}`}
              >
                <div style={styles.optionHeadRow}>
                  <div style={styles.optionTitle}>
                    {req.title}
                    {/* IMPORTANT CHANGE: only show #n tag when qty > 1 */}
                    {qty > 1 ? <span style={styles.optionUnitTag}>#{unitIndex + 1}</span> : null}
                  </div>

                  {req.kind === "toppings" ? (
                    <div style={styles.optionCount}>
                      {selectedToppings.length}/{req.toppingsRequired}
                    </div>
                  ) : null}
                </div>

                {req.kind === "toppings" ? (
                  <>
                    <div style={styles.optionGrid} role="group" aria-label={`Select ${req.toppingsRequired} toppings`}>
                      {TOPPING_OPTIONS.map((t) => {
                        const active = selectedToppings.includes(t)
                        const atLimit = !active && selectedToppings.length >= req.toppingsRequired
                        return (
                          <OptionPill
                            key={`${itemKey}__u${unitIndex}__${t}`}
                            label={t}
                            active={active}
                            disabled={atLimit}
                            onClick={() => onToggleToppingUnit?.(unitIndex, t, req.toppingsRequired)}
                            styles={styles}
                            ariaLabel={`${active ? "Remove" : "Add"} topping ${t} for item ${unitIndex + 1}`}
                          />
                        )
                      })}
                    </div>

                    {unitIssue ? <div style={styles.optionIssueText}>{unitIssue}</div> : null}
                    {!unitIssue ? (
                      <div style={styles.optionHint}>Select exactly {req.toppingsRequired} topping(s) for this pizza.</div>
                    ) : null}
                  </>
                ) : null}

                {req.kind === "dressing" ? (
                  <>
                    <div style={styles.optionGrid} role="radiogroup" aria-label="Select a dressing">
                      {DRESSING_OPTIONS.map((d) => {
                        const active = selectedDressing === d
                        return (
                          <OptionPill
                            key={`${itemKey}__u${unitIndex}__${d}`}
                            label={d}
                            active={active}
                            disabled={false}
                            onClick={() => onSetDressingUnit?.(unitIndex, d)}
                            styles={styles}
                            ariaLabel={`${active ? "Selected" : "Select"} dressing ${d} for item ${unitIndex + 1}`}
                          />
                        )
                      })}
                    </div>

                    {unitIssue ? <div style={styles.optionIssueText}>{unitIssue}</div> : null}
                    {!unitIssue ? <div style={styles.optionHint}>Select 1 dressing for this salad.</div> : null}
                  </>
                ) : null}
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

export default function RestaurantOrderOnline({
  logoSrc = "/restaurant/logo.png",
  restaurantName = "",
  locationLine = "",
  homePath = "/components/restaurant-ordering",
  menuPath = "/components/restaurant-ordering/menu",
}) {
  const go = (path) => (e) => {
    e?.preventDefault?.()
    if (typeof window !== "undefined") window.location.href = path
  }

  const TAX_RATE = 0.08

  const [activeId, setActiveId] = useState(MENU[0].id)
  /**
   * Cart state:
   * cart[key] = {
   *   key, name, unitPrice, qty, imgSrc,
   *   unitOptions?: Array<{ toppings?: string[]; dressing?: string }>
   * }
   */
  const [cart, setCart] = useState({})
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutBusy, setCheckoutBusy] = useState(false)
  const [checkoutErr, setCheckoutErr] = useState("")

  // Image modal state
  const [imgModalOpen, setImgModalOpen] = useState(false)
  const [imgModalSrc, setImgModalSrc] = useState("")
  const [imgModalAlt, setImgModalAlt] = useState("")

  const active = useMemo(() => MENU.find((c) => c.id === activeId) || MENU[0], [activeId])

  const navItems = useMemo(() => CATEGORY_META.map((m) => MENU.find((x) => x.id === m.id)).filter(Boolean), [])
  const catMetaById = useMemo(() => {
    const map = new Map()
    for (const m of CATEGORY_META) map.set(m.id, m)
    return map
  }, [])

  const cartItems = useMemo(() => Object.values(cart), [cart])

  const totals = useMemo(() => {
    let subtotalCents = 0
    let count = 0
    for (const it of cartItems) {
      subtotalCents += toCents(it.unitPrice) * it.qty
      count += it.qty
    }
    const taxCents = Math.round(subtotalCents * TAX_RATE)
    const totalCents = subtotalCents + taxCents
    return { count, subtotal: subtotalCents / 100, tax: taxCents / 100, total: totalCents / 100 }
  }, [cartItems])

    /**
   * Validation: each UNIT of an optioned item must be complete.
   * Produces:
   * - hasIssues
   * - issuesByKey: { [itemKey]: { any: boolean, units: { [unitIndex]: msg } } }
   * - summaryLines: array of human strings
   *
   * CHANGE:
   * - Only mention #n (e.g. #1/#2) if there are multiple of that same item (it.qty > 1).
   */
  const optionValidation = useMemo(() => {
    const issuesByKey = {}
    const summaryLines = []

    for (const it of cartItems) {
      const req = getOptionRequirementsForItemName(it.name)
      if (!req?.kind) continue

      const unitOptions = Array.isArray(it.unitOptions) ? it.unitOptions : []
      const units = {}

      const hasMultiple = it.qty > 1

      // Ensure we validate per-qty units; if array is shorter, treat missing units as empty selections.
      for (let i = 0; i < it.qty; i++) {
        const unit = unitOptions[i] || (req.kind === "toppings" ? { toppings: [] } : { dressing: "" })

        if (req.kind === "toppings") {
          const sel = Array.isArray(unit?.toppings) ? unit.toppings : []
          const need = req.toppingsRequired

          if (need > 0 && sel.length !== need) {
            // Only add "#n" when there are multiple of the same item
            const unitSuffix = hasMultiple ? ` for #${i + 1}` : ""
            const msg = `Select ${need} topping${need === 1 ? "" : "s"}${unitSuffix} (currently ${sel.length}).`
            units[i] = msg

            // Summary line: only include "#n" when multiple
            const summaryPrefix = hasMultiple ? `${it.name} #${i + 1}` : it.name
            summaryLines.push(`${summaryPrefix}: ${msg}`)
          }
        }

        if (req.kind === "dressing") {
          const sel = unit?.dressing || ""
          if (!sel) {
            const unitSuffix = hasMultiple ? ` for #${i + 1}` : ""
            const msg = `Select 1 dressing${unitSuffix}.`
            units[i] = msg

            const summaryPrefix = hasMultiple ? `${it.name} #${i + 1}` : it.name
            summaryLines.push(`${summaryPrefix}: ${msg}`)
          }
        }
      }

      if (Object.keys(units).length) {
        issuesByKey[it.key] = { any: true, units }
      }
    }

    return {
      hasIssues: summaryLines.length > 0,
      issuesByKey,
      summaryLines,
    }
  }, [cartItems])


  function addToCart({ key, name, unitPrice, imgSrc }) {
    const req = getOptionRequirementsForItemName(name)

    setCart((prev) => {
      const existing = prev[key]
      const nextQty = (existing?.qty || 0) + 1

      // For optioned items, we store ONE options object per unit.
      const nextUnitOptions = (() => {
        if (!req?.kind) return existing?.unitOptions // keep undefined
        const arr = Array.isArray(existing?.unitOptions) ? [...existing.unitOptions] : []
        if (req.kind === "toppings") arr.push({ toppings: [] })
        if (req.kind === "dressing") arr.push({ dressing: "" })
        return arr
      })()

      return {
        ...prev,
        [key]: {
          key,
          name,
          unitPrice,
          qty: nextQty,
          imgSrc: imgSrc || existing?.imgSrc || "",
          ...(req?.kind ? { unitOptions: nextUnitOptions } : null),
        },
      }
    })
  }

  function inc(key) {
    setCart((prev) => {
      const it = prev[key]
      if (!it) return prev

      const req = getOptionRequirementsForItemName(it.name)
      const nextQty = it.qty + 1

      let nextUnitOptions = it.unitOptions
      if (req?.kind) {
        const arr = Array.isArray(it.unitOptions) ? [...it.unitOptions] : []
        if (req.kind === "toppings") arr.push({ toppings: [] })
        if (req.kind === "dressing") arr.push({ dressing: "" })
        nextUnitOptions = arr
      }

      return {
        ...prev,
        [key]: {
          ...it,
          qty: nextQty,
          ...(req?.kind ? { unitOptions: nextUnitOptions } : null),
        },
      }
    })
  }

  function dec(key) {
    setCart((prev) => {
      const it = prev[key]
      if (!it) return prev

      const req = getOptionRequirementsForItemName(it.name)
      const nextQty = Math.max(0, it.qty - 1)

      if (nextQty === 0) {
        const { [key]: _, ...rest } = prev
        return rest
      }

      let nextUnitOptions = it.unitOptions
      if (req?.kind) {
        const arr = Array.isArray(it.unitOptions) ? [...it.unitOptions] : []
        // remove LAST unit’s selections
        arr.pop()
        nextUnitOptions = arr
      }

      return {
        ...prev,
        [key]: {
          ...it,
          qty: nextQty,
          ...(req?.kind ? { unitOptions: nextUnitOptions } : null),
        },
      }
    })
  }

  function remove(key) {
    setCart((prev) => {
      const { [key]: _, ...rest } = prev
      return rest
    })
  }

  function clearCart() {
    setCart({})
    setCheckoutErr("")
  }

  function openImageModal(src, alt) {
    if (!src) return
    setImgModalSrc(src)
    setImgModalAlt(alt || "")
    setImgModalOpen(true)
  }

  function closeImageModal() {
    setImgModalOpen(false)
    setTimeout(() => {
      setImgModalSrc("")
      setImgModalAlt("")
    }, 180)
  }

  function toggleToppingUnit(itemKey, unitIndex, topping, requiredCount) {
    setCart((prev) => {
      const it = prev[itemKey]
      if (!it) return prev

      const req = getOptionRequirementsForItemName(it.name)
      if (req.kind !== "toppings") return prev

      const units = Array.isArray(it.unitOptions) ? [...it.unitOptions] : []
      // ensure length
      while (units.length < it.qty) units.push({ toppings: [] })

      const unit = units[unitIndex] || { toppings: [] }
      const existing = Array.isArray(unit.toppings) ? unit.toppings : []
      const has = existing.includes(topping)

      let nextTops = existing
      if (has) {
        nextTops = existing.filter((x) => x !== topping)
      } else {
        if (existing.length >= requiredCount) return prev
        nextTops = [...existing, topping]
      }

      units[unitIndex] = { ...unit, toppings: nextTops }

      return {
        ...prev,
        [itemKey]: { ...it, unitOptions: units },
      }
    })
  }

  function setDressingUnit(itemKey, unitIndex, dressing) {
    setCart((prev) => {
      const it = prev[itemKey]
      if (!it) return prev

      const req = getOptionRequirementsForItemName(it.name)
      if (req.kind !== "dressing") return prev

      const units = Array.isArray(it.unitOptions) ? [...it.unitOptions] : []
      while (units.length < it.qty) units.push({ dressing: "" })

      const unit = units[unitIndex] || { dressing: "" }
      units[unitIndex] = { ...unit, dressing }

      return { ...prev, [itemKey]: { ...it, unitOptions: units } }
    })
  }

  async function redirectToCheckout() {
    try {
      setCheckoutErr("")
      if (!cartItems.length) return

      // BLOCK checkout if options incomplete
      if (optionValidation.hasIssues) {
        setCheckoutErr("Please complete the required selections highlighted in red before checking out.")
        return
      }

      setCheckoutBusy(true)

      /**
       * IMPORTANT: To make toppings apparent in Stripe Checkout UI,
       * we EXPAND optioned items into per-unit line items with qty=1,
       * and append selections to the name.
       *
       * CHANGE REQUEST:
       * - Only add "(#n)" when there are MULTIPLE of that item (qty > 1)
       *   AND the item requires options (which is why we're in this branch).
       *
       * Non-option items keep their qty.
       */
      const cart_items = []
      for (const it of cartItems) {
        if (!(it.qty > 0 && toCents(it.unitPrice) > 0 && it.name)) continue

        const req = getOptionRequirementsForItemName(it.name)
        if (!req?.kind) {
          cart_items.push({ name: it.name, unitPrice: it.unitPrice, qty: it.qty })
          continue
        }

        const units = Array.isArray(it.unitOptions) ? it.unitOptions : []
        for (let i = 0; i < it.qty; i++) {
          const unit = units[i] || (req.kind === "toppings" ? { toppings: [] } : { dressing: "" })
          const label = formatSelectionsForCheckout(req, unit)

          // IMPORTANT CHANGE: only add (#n) when qty > 1 for optioned items
          const suffix = it.qty > 1 ? ` (#${i + 1})` : ""

          cart_items.push({
            name: `${it.name} — ${label}${suffix}`,
            unitPrice: it.unitPrice,
            qty: 1,
            // Keep the raw data available if your API stores it (safe to ignore server-side).
            options: unit,
          })
        }
      }

      if (!cart_items.length) {
        setCheckoutErr("No priced items found in cart.")
        setCheckoutBusy(false)
        return
      }

      const origin = window.location.origin
      const success_url = `${origin}/components/restaurant-ordering/order/{ORDER_ID}`
      const cancel_url = `${origin}/components/restaurant-ordering/order/{ORDER_ID}?canceled=1`

      const response = await fetch("/api/checkout-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart_items,
          success_url,
          cancel_url,
          tax_rate: TAX_RATE,
        }),
      })

      if (!response.ok) {
        const text = await response.text().catch(() => "")
        throw new Error(text || `Checkout session failed (${response.status})`)
      }

      const { id } = await response.json()
      if (!id) throw new Error("No session id returned from /api/checkout-sessions.")

      const stripe = await getStripe()
      await stripe.redirectToCheckout({ sessionId: id })
    } catch (e) {
      setCheckoutErr(e?.message || "Checkout failed.")
      setCheckoutBusy(false)
    }
  }

  const palette = useMemo(
    () => ({
      bg: "#070708",
      ink: "#f4f0e6",
      ink2: "rgba(244,240,230,0.76)",
      ink3: "rgba(244,240,230,0.60)",
      line2: "rgba(244,240,230,0.12)",
      gold: "rgba(176,160,236,0.95)",
      shadow: "rgba(0,0,0,0.55)",
      danger: "rgba(255,92,92,0.92)",
      dangerSoft: "rgba(255,92,92,0.12)",
    }),
    []
  )

  const styles = useMemo(() => {
    const framePadBottom = 110
    const fabSize = 76
    const fabRadius = 22
    const logoWrapSize = 96
    const logoWrapRadius = 16
    const logoWrapPad = 10
    const titleSize = 26
    const navBtnPad = "11px 16px"
    const navBtnFont = 12

    return {
      shell: {
        position: "relative",
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 700px at 20% 0%, rgba(244,240,230,0.07), transparent 60%), radial-gradient(900px 600px at 80% 20%, rgba(176,160,236,0.08), transparent 55%), linear-gradient(180deg, #050506 0%, #09090b 65%, #070708 100%)",
        color: palette.ink,
        fontFamily: 'ui-serif, Georgia, "Times New Roman", Times, serif',
      },

      bgTexture: {
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(2px 2px at 10% 20%, rgba(244,240,230,0.08), transparent 55%), radial-gradient(2px 2px at 60% 40%, rgba(244,240,230,0.06), transparent 55%), radial-gradient(2px 2px at 30% 70%, rgba(244,240,230,0.05), transparent 55%), radial-gradient(2px 2px at 80% 80%, rgba(244,240,230,0.06), transparent 55%), linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0))",
        opacity: 0.55,
        pointerEvents: "none",
        mixBlendMode: "screen",
      },

      frame: {
        position: "relative",
        maxWidth: 1180,
        margin: "0 auto",
        padding: `16px 12px ${framePadBottom}px`,
        boxSizing: "border-box",
      },

      header: {
        border: `1px solid ${palette.line2}`,
        borderRadius: 18,
        background: "linear-gradient(180deg, rgba(244,240,230,0.06), rgba(244,240,230,0.02))",
        boxShadow: `0 18px 60px ${palette.shadow}`,
        padding: "14px 14px 12px",
        overflow: "hidden",
      },

      headerRow: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
      },

      brand: { display: "flex", gap: 14, alignItems: "center", minWidth: 0 },

      logoWrap: {
        position: "relative",
        width: logoWrapSize,
        height: logoWrapSize,
        borderRadius: logoWrapRadius,
        border: `1px solid ${palette.line2}`,
        background:
          "radial-gradient(120px 120px at 50% 0%, rgba(244,240,230,0.06), rgba(0,0,0,0.0)), linear-gradient(180deg, rgba(0,0,0,0.65), rgba(0,0,0,0.35))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: logoWrapPad,
        flex: "0 0 auto",
        boxSizing: "border-box",
      },

      logo: {
        width: "100%",
        height: "100%",
        objectFit: "contain",
        filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.6))",
        display: "block",
      },

      logoGlow: {
        position: "absolute",
        inset: -40,
        background:
          "radial-gradient(circle at 40% 20%, rgba(176,160,236,0.18), transparent 55%), radial-gradient(circle at 70% 70%, rgba(244,240,230,0.10), transparent 55%)",
        pointerEvents: "none",
        mixBlendMode: "screen",
        opacity: 0.65,
      },

      brandText: { minWidth: 0 },

      kicker: {
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        fontSize: 12,
        color: palette.ink3,
        marginBottom: 4,
      },

      title: {
        margin: 0,
        fontSize: titleSize,
        lineHeight: 1.06,
        letterSpacing: "0.02em",
      },

      subtitle: {
        marginTop: 6,
        fontSize: 13,
        color: palette.ink2,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      },

      navActionsHeader: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
        justifyContent: "flex-end",
        paddingTop: 2,
      },

      navBtn: {
        borderRadius: 999,
        padding: navBtnPad,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "linear-gradient(180deg, rgba(18,18,18,0.98), rgba(6,6,6,0.98))",
        color: palette.ink,
        fontSize: navBtnFont,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        cursor: "pointer",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 12px 24px rgba(0,0,0,0.32)",
        whiteSpace: "nowrap",
        userSelect: "none",
      },

      navPrimary: {
        borderColor: "rgba(176,160,236,0.55)",
        background:
          "radial-gradient(circle at 30% 20%, rgba(176,160,236,0.20), transparent 52%), linear-gradient(180deg, rgba(26,22,14,0.98), rgba(8,8,8,0.98))",
      },

      navSecondary: {
        borderColor: "rgba(244,240,230,0.20)",
        background: "linear-gradient(180deg, rgba(22,22,22,0.98), rgba(8,8,8,0.98))",
      },

      navBtnDisabled: { opacity: 0.55, cursor: "not-allowed" },

      bodyOrder: {
        display: "grid",
        gap: 14,
        marginTop: 16,
        alignItems: "start",
      },

      asideNav: {
        position: "sticky",
        top: 16,
        alignSelf: "start",
      },

      navInner: {
        border: `1px solid ${palette.line2}`,
        borderRadius: 18,
        background: "linear-gradient(180deg, rgba(244,240,230,0.045), rgba(244,240,230,0.015))",
        boxShadow: `0 18px 60px ${palette.shadow}`,
        overflow: "hidden",
      },

      navTitle: {
        padding: "14px 14px 10px",
        fontSize: 12,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: palette.ink3,
        borderBottom: `1px solid ${palette.line2}`,
        background: "rgba(0,0,0,0.18)",
      },

      navImgGrid: {
        padding: 12,
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 10,
      },

      navFooter: {
        borderTop: `1px solid ${palette.line2}`,
        padding: "12px 14px",
        background: "rgba(0,0,0,0.18)",
      },

      navFootNote: {
        fontSize: 12,
        color: "rgba(244,240,230,0.62)",
        lineHeight: 1.35,
      },

      content: { minWidth: 0 },

      card: {
        border: `1px solid ${palette.line2}`,
        borderRadius: 18,
        background: "linear-gradient(180deg, rgba(244,240,230,0.055), rgba(244,240,230,0.02))",
        boxShadow: `0 18px 60px ${palette.shadow}`,
        overflow: "hidden",
      },

      cardHeader: {
        padding: "14px 14px 10px",
        background:
          "radial-gradient(700px 180px at 25% 0%, rgba(176,160,236,0.10), transparent 70%), radial-gradient(800px 220px at 80% 10%, rgba(244,240,230,0.06), transparent 70%), rgba(0,0,0,0.18)",
        borderBottom: `1px solid ${palette.line2}`,
      },

      cardKicker: {
        fontSize: 12,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: palette.ink3,
        marginBottom: 6,
      },

      cardTitle: {
        margin: 0,
        fontSize: 22,
        lineHeight: 1.12,
        letterSpacing: "0.02em",
      },

      cardSubtitle: {
        marginTop: 8,
        fontSize: 12,
        color: palette.ink2,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      },

      mobileCats: {
        gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
        gap: 10,
        padding: 10,
        borderBottom: `1px solid ${palette.line2}`,
        background: "rgba(0,0,0,0.12)",
      },

      groups: { padding: "2px 12px 14px" },

      group: {
        marginTop: 12,
        border: `1px solid ${palette.line2}`,
        borderRadius: 16,
        background: "rgba(0,0,0,0.22)",
        overflow: "hidden",
      },

      groupHead: {
        padding: "11px 11px 9px",
        borderBottom: `1px solid ${palette.line2}`,
        background: "rgba(0,0,0,0.22)",
      },

      groupTitle: {
        fontSize: 13,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "rgba(244,240,230,0.86)",
      },

      groupNote: {
        marginTop: 6,
        fontSize: 12,
        color: "rgba(244,240,230,0.62)",
        lineHeight: 1.35,
      },

      listGrid: {
        padding: 10,
        display: "grid",
        gap: 10,
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      },

      itemOrder: {
        position: "relative",
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        padding: 12,
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 14,
        background: "linear-gradient(180deg, rgba(244,240,230,0.03), rgba(0,0,0,0.0))",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
        boxSizing: "border-box",
        isolation: "isolate",
        transform: "translateZ(0)",
        backfaceVisibility: "hidden",
        WebkitFontSmoothing: "antialiased",
        willChange: "transform",
      },

      itemOrderInCart: {
        boxShadow:
          "inset 0 0 0 1px rgba(176,160,236,0.34), inset 0 1px 0 rgba(255,255,255,0.03), 0 18px 50px rgba(0,0,0,0.28)",
        background:
          "radial-gradient(circle at 20% 0%, rgba(176,160,236,0.10), transparent 55%), linear-gradient(180deg, rgba(244,240,230,0.03), rgba(0,0,0,0.0))",
      },

      itemImgBtn: {
        width: 58,
        height: 58,
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(0,0,0,0.25)",
        flex: "0 0 auto",
        padding: 0,
        cursor: "pointer",
        outline: "none",
        WebkitTapHighlightColor: "transparent",
        boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
        transform: "translateZ(0)",
      },

      itemImg: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
        transform: "scale(1.03)",
      },

      itemImgEmpty: {
        width: 58,
        height: 58,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(0,0,0,0.25)",
        flex: "0 0 auto",
        boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
      },

      itemMid: { minWidth: 0, flex: 1, display: "flex", flexDirection: "column", gap: 8 },

      itemNameRow: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 10,
      },

      itemName: {
        fontSize: 15,
        letterSpacing: "0.02em",
        color: "rgba(244,240,230,0.92)",
        lineHeight: 1.15,
      },

      inCartBadge: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 10px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(0,0,0,0.18)",
        color: "rgba(244,240,230,0.78)",
        fontSize: 11,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        flex: "0 0 auto",
      },

      inCartQty: { color: "rgba(176,160,236,0.95)", fontWeight: 700, letterSpacing: "0.10em" },

      itemDesc: { fontSize: 13, lineHeight: 1.35, color: "rgba(244,240,230,0.66)" },

      itemMetaRow: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },

      itemPricePill: {
        fontSize: 13,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "rgba(176,160,236,0.95)",
        padding: "7px 10px",
        borderRadius: 999,
        border: "1px solid rgba(176,160,236,0.30)",
        background: "rgba(176,160,236,0.08)",
        whiteSpace: "nowrap",
      },

      removeBtn: {
        borderRadius: 999,
        padding: "10px 14px",
        border: "1px solid rgba(255,255,255,0.18)",
        background: "linear-gradient(180deg, rgba(22,22,22,0.98), rgba(8,8,8,0.98))",
        color: "rgba(244,240,230,0.86)",
        fontSize: 11,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        cursor: "pointer",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 12px 24px rgba(0,0,0,0.22)",
        userSelect: "none",
        whiteSpace: "nowrap",
        outline: "none",
        WebkitTapHighlightColor: "transparent",
      },

      addBtn: {
        marginLeft: "auto",
        borderRadius: 999,
        padding: "10px 14px",
        border: "1px solid rgba(176,160,236,0.40)",
        background:
          "radial-gradient(circle at 30% 20%, rgba(176,160,236,0.18), transparent 58%), linear-gradient(180deg, rgba(22,18,12,0.98), rgba(8,8,8,0.98))",
        color: "rgba(244,240,230,0.92)",
        fontSize: 11,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        cursor: "pointer",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 12px 24px rgba(0,0,0,0.28)",
        userSelect: "none",
        whiteSpace: "nowrap",
        outline: "none",
        WebkitTapHighlightColor: "transparent",
      },

      addBtnDisabled: {
        opacity: 0.45,
        cursor: "not-allowed",
        borderColor: "rgba(255,255,255,0.12)",
        background: "linear-gradient(180deg, rgba(18,18,18,0.98), rgba(6,6,6,0.98))",
      },

      bottomSeal: { display: "flex", alignItems: "center", gap: 10, padding: "12px 14px 16px", opacity: 0.85 },

      bottomSealLine: {
        height: 1,
        flex: 1,
        background: "linear-gradient(90deg, transparent, rgba(244,240,230,0.20), transparent)",
      },

      bottomSealText: {
        fontSize: 11,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: "rgba(244,240,230,0.62)",
      },

      cartFab: {
        position: "fixed",
        right: 18,
        bottom: 18,
        zIndex: 90,
        width: fabSize,
        height: fabSize,
        borderRadius: fabRadius,
        border: "1px solid rgba(176,160,236,0.50)",
        background:
          "radial-gradient(circle at 30% 20%, rgba(176,160,236,0.24), transparent 55%), linear-gradient(180deg, rgba(22,18,12,0.98), rgba(6,6,6,0.98))",
        boxShadow: "0 20px 70px rgba(0,0,0,0.60), inset 0 1px 0 rgba(255,255,255,0.06)",
        color: "rgba(244,240,230,0.95)",
        cursor: "pointer",
        display: "grid",
        placeItems: "center",
        outline: "none",
        WebkitTapHighlightColor: "transparent",
      },

      cartFabIcon: { fontSize: 28, filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.45))" },

      cartFabBadge: {
        position: "absolute",
        right: -8,
        top: -8,
        minWidth: 30,
        height: 30,
        padding: "0 10px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.16)",
        background:
          "radial-gradient(circle at 30% 30%, rgba(176,160,236,0.26), transparent 60%), rgba(0,0,0,0.78)",
        color: "rgba(244,240,230,0.92)",
        fontSize: 13,
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        display: "grid",
        placeItems: "center",
        boxShadow: "0 12px 30px rgba(0,0,0,0.40)",
      },

      drawerOverlay: {
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.66)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        justifyContent: "flex-end",
      },

      drawer: {
        width: "min(420px, 92vw)",
        height: "100%",
        borderLeft: "1px solid rgba(255,255,255,0.10)",
        background: "linear-gradient(180deg, rgba(14,14,14,0.92), rgba(6,6,6,0.92))",
        boxShadow: "-30px 0 90px rgba(0,0,0,0.55)",
        display: "flex",
        flexDirection: "column",
      },

      drawerHead: {
        padding: "14px 14px 12px",
        borderBottom: "1px solid rgba(255,255,255,0.10)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        background: "radial-gradient(700px 200px at 20% 0%, rgba(176,160,236,0.12), transparent 65%), rgba(0,0,0,0.18)",
      },

      drawerTitle: {
        fontSize: 12,
        letterSpacing: "0.20em",
        textTransform: "uppercase",
        color: "rgba(244,240,230,0.86)",
        display: "flex",
        alignItems: "center",
        gap: 10,
      },

      drawerBadge: {
        display: "inline-grid",
        placeItems: "center",
        minWidth: 24,
        height: 24,
        padding: "0 8px",
        borderRadius: 999,
        border: "1px solid rgba(176,160,236,0.30)",
        background: "rgba(176,160,236,0.10)",
        color: "rgba(176,160,236,0.95)",
        fontSize: 12,
        letterSpacing: "0.08em",
      },

      drawerClose: {
        width: 38,
        height: 38,
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(0,0,0,0.20)",
        color: "rgba(244,240,230,0.86)",
        cursor: "pointer",
        outline: "none",
        WebkitTapHighlightColor: "transparent",
      },

      drawerBody: { padding: 12, overflow: "auto", flex: 1 },

      checkoutErr: {
        marginBottom: 10,
        padding: "10px 10px",
        borderRadius: 14,
        border: "1px solid rgba(176,160,236,0.22)",
        background: "rgba(176,160,236,0.08)",
        color: "rgba(244,240,230,0.82)",
        fontSize: 12,
        lineHeight: 1.35,
      },

      validationBox: {
        marginBottom: 10,
        padding: "10px 10px",
        borderRadius: 14,
        border: `1px solid rgba(255,92,92,0.30)`,
        background: palette.dangerSoft,
        color: "rgba(244,240,230,0.86)",
        fontSize: 12,
        lineHeight: 1.35,
      },

      validationTitle: {
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        fontSize: 11,
        color: "rgba(244,240,230,0.86)",
        marginBottom: 8,
      },

      validationList: {
        display: "grid",
        gap: 6,
        margin: 0,
        paddingLeft: 18,
        color: "rgba(244,240,230,0.82)",
      },

      drawerFoot: {
        borderTop: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.18)",
        padding: "12px 14px 14px",
      },

      cartRows: { display: "grid", gap: 10 },

      cartRowWrap: {
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.20)",
        overflow: "hidden",
      },

      cartRowWrapIssue: {
        border: `1px solid ${palette.danger}`,
        boxShadow: `0 0 0 1px rgba(255,92,92,0.35), 0 14px 36px rgba(0,0,0,0.35)`,
      },

      cartRow: {
        padding: 10,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 10,
        boxSizing: "border-box",
      },

      cartThumbBtn: {
        width: 48,
        height: 48,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.22)",
        padding: 0,
        overflow: "hidden",
        cursor: "pointer",
        flex: "0 0 auto",
        boxShadow: "0 10px 24px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.04)",
        outline: "none",
        WebkitTapHighlightColor: "transparent",
      },

      cartThumbImg: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
        transform: "scale(1.03)",
        filter: "saturate(1.03) contrast(1.02)",
      },

      cartThumbFallback: {
        width: "100%",
        height: "100%",
        background: "radial-gradient(80px 60px at 30% 20%, rgba(176,160,236,0.12), transparent 60%), rgba(0,0,0,0.25)",
      },

      cartLeft: { minWidth: 0, flex: 1 },

      cartName: { fontSize: 14, lineHeight: 1.2, color: "rgba(244,240,230,0.92)", marginBottom: 6 },

      cartMeta: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: "rgba(244,240,230,0.62)",
        fontSize: 12,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        flexWrap: "wrap",
      },

      dot: { opacity: 0.6 },

      cartUnit: { color: "rgba(176,160,236,0.90)" },

      cartQtyLabel: { color: "rgba(244,240,230,0.62)" },

      cartRight: { flex: "0 0 auto", display: "flex", alignItems: "center", gap: 10 },

      qty: {
        display: "flex",
        alignItems: "center",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 999,
        overflow: "hidden",
        background: "rgba(0,0,0,0.18)",
      },

      qtyBtn: {
        width: 34,
        height: 34,
        border: 0,
        background: "transparent",
        color: "rgba(244,240,230,0.90)",
        cursor: "pointer",
        outline: "none",
        WebkitTapHighlightColor: "transparent",
      },

      qtyVal: {
        minWidth: 34,
        height: 34,
        display: "grid",
        placeItems: "center",
        color: "rgba(244,240,230,0.86)",
        fontSize: 12,
        letterSpacing: "0.12em",
      },

      cartLine: {
        fontSize: 12,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "rgba(176,160,236,0.95)",
        padding: "7px 10px",
        borderRadius: 999,
        border: "1px solid rgba(176,160,236,0.30)",
        background: "rgba(176,160,236,0.08)",
        whiteSpace: "nowrap",
      },

      cartRemove: {
        width: 34,
        height: 34,
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(0,0,0,0.18)",
        color: "rgba(244,240,230,0.85)",
        cursor: "pointer",
        outline: "none",
        WebkitTapHighlightColor: "transparent",
      },

      cartEmpty: {
        padding: "16px 10px",
        border: "1px dashed rgba(255,255,255,0.14)",
        borderRadius: 14,
        background: "rgba(0,0,0,0.18)",
        color: "rgba(244,240,230,0.72)",
        lineHeight: 1.4,
      },

      cartEmptyHint: { marginTop: 8, fontSize: 12, color: "rgba(244,240,230,0.55)" },

      breakdown: {
        display: "grid",
        gap: 8,
        paddingBottom: 10,
        marginBottom: 10,
        borderBottom: "1px solid rgba(255,255,255,0.10)",
      },

      breakRow: {
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 10,
      },

      breakLabel: {
        fontSize: 12,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "rgba(244,240,230,0.70)",
      },

      breakVal: {
        fontSize: 12,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "rgba(176,160,236,0.92)",
      },

      breakTotalLabel: {
        fontSize: 12,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "rgba(244,240,230,0.86)",
      },

      breakTotalVal: {
        fontSize: 14,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "rgba(176,160,236,0.95)",
      },

      cartActions: { display: "flex", gap: 10 },
      cartBtn: { flex: 1, justifyContent: "center" },

      cartFinePrint: { marginTop: 10, fontSize: 12, color: "rgba(244,240,230,0.55)", lineHeight: 1.35 },

      // Inline cart option selector styling (full width)
      optionSection: {
        borderTop: "1px solid rgba(255,255,255,0.10)",
        padding: "10px 10px 12px",
        background:
          "radial-gradient(520px 120px at 15% 0%, rgba(176,160,236,0.08), transparent 68%), rgba(0,0,0,0.12)",
        display: "grid",
        gap: 12,
      },

      // NEW: per-unit wrapper so each quantity gets its own selection area
      optionUnitWrap: {
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.14)",
        padding: 10,
      },

      optionUnitWrapIssue: {
        border: `1px solid ${palette.danger}`,
        boxShadow: `0 0 0 1px rgba(255,92,92,0.25)`,
      },

      optionUnitTag: {
        display: "inline-block",
        marginLeft: 8,
        padding: "4px 8px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(0,0,0,0.16)",
        color: "rgba(244,240,230,0.70)",
        letterSpacing: "0.10em",
        fontSize: 10,
        transform: "translateY(-1px)",
      },

      optionHeadRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        marginBottom: 10,
      },

      optionTitle: {
        fontSize: 11,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "rgba(244,240,230,0.84)",
      },

      optionCount: {
        fontSize: 11,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "rgba(176,160,236,0.92)",
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid rgba(176,160,236,0.28)",
        background: "rgba(176,160,236,0.08)",
        whiteSpace: "nowrap",
      },

      optionGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 8,
      },

      optionPill: {
        width: "100%",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(0,0,0,0.16)",
        color: "rgba(244,240,230,0.86)",
        padding: "10px 10px",
        textAlign: "left",
        cursor: "pointer",
        outline: "none",
        WebkitTapHighlightColor: "transparent",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
        fontSize: 12,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        userSelect: "none",
      },

      optionHint: {
        marginTop: 10,
        fontSize: 12,
        color: "rgba(244,240,230,0.60)",
        lineHeight: 1.35,
      },

      optionIssueText: {
        marginTop: 10,
        fontSize: 12,
        color: palette.danger,
        lineHeight: 1.35,
      },

      imgModalOverlay: {
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,0.70)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        display: "grid",
        placeItems: "center",
        padding: 14,
      },

      imgModalCard: {
        width: "min(860px, 96vw)",
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.14)",
        background:
          "radial-gradient(900px 260px at 20% 0%, rgba(176,160,236,0.10), transparent 65%), linear-gradient(180deg, rgba(18,18,18,0.96), rgba(6,6,6,0.96))",
        boxShadow: "0 30px 120px rgba(0,0,0,0.70), inset 0 1px 0 rgba(255,255,255,0.06)",
        overflow: "hidden",
        cursor: "pointer",
      },

      imgModalImgWrap: {
        width: "100%",
        aspectRatio: "16 / 10",
        background: "rgba(0,0,0,0.25)",
        display: "grid",
        placeItems: "center",
      },

      imgModalImg: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
        transform: "translateZ(0)",
      },

      imgModalCaption: {
        padding: "12px 14px 14px",
        borderTop: "1px solid rgba(255,255,255,0.10)",
        color: "rgba(244,240,230,0.78)",
        fontSize: 12,
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
      },

      imgModalHint: {
        color: "rgba(244,240,230,0.55)",
        letterSpacing: "0.12em",
        fontSize: 11,
      },
    }
  }, [palette])

  function mobileCatGridSpan(catId) {
    const map = {
      pizza: "1 / span 4",
      pasta: "5 / span 4",
      salads: "9 / span 4",
      appetizers: "1 / span 3",
      sandwiches: "4 / span 3",
      desserts: "7 / span 3",
      beverages: "10 / span 3",
    }
    return map[catId] || "auto"
  }

  function sidebarButtonOverrides(catId) {
    const isWideTile = catId === "pizza" || catId === "pasta" || catId === "salads"
    if (!isWideTile) return null
    return {
      buttonStyle: {
        gridColumn: "1 / -1",
        aspectRatio: "2.15 / 1",
        minHeight: 76,
        borderRadius: 16,
      },
      frameStyle: { padding: 12 },
    }
  }

  return (
    <div style={styles.shell} className="vpz-shell">
      <style jsx>{`
        .vpz-bodyOrder {
          grid-template-columns: 1fr;
        }
        .vpz-asideNav {
          display: none;
        }
        .vpz-mobileCats {
          display: grid;
        }
        @media (min-width: 740px) {
          .vpz-bodyOrder {
            grid-template-columns: clamp(210px, 22vw, 250px) 1fr;
          }
          .vpz-asideNav {
            display: block;
          }
          .vpz-mobileCats {
            display: none;
          }
        }

        /* Ensure no browser focus / tap highlight leaks show as white rings */
        .vpz-shell * {
          -webkit-tap-highlight-color: transparent;
        }
        .vpz-shell *:focus,
        .vpz-shell *:focus-visible,
        .vpz-shell *:focus-within {
          outline: none !important;
          box-shadow: none !important;
        }
        .vpz-shell button::-moz-focus-inner {
          border: 0;
        }
      `}</style>

      <div aria-hidden="true" style={styles.bgTexture} />

      <div style={styles.frame}>
        <header style={styles.header}>
          <div style={styles.headerRow}>
            <div style={styles.brand}>
              <div style={styles.logoWrap}>
                <img style={styles.logo} src={logoSrc} alt={restaurantName} draggable="false" />
                <div aria-hidden="true" style={styles.logoGlow} />
              </div>

              <div style={styles.brandText}>
                <div style={styles.kicker}>Order Online</div>
                <h1 style={styles.title}>{restaurantName}</h1>
                <div style={styles.subtitle}>{locationLine}</div>
              </div>
            </div>

            <nav style={styles.navActionsHeader} aria-label="Header actions">
              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  e.currentTarget.blur?.()
                  blurActiveElement()
                  go(homePath)(e)
                }}
                style={{ ...styles.navBtn, ...styles.navSecondary }}
              >
                Home
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  e.currentTarget.blur?.()
                  blurActiveElement()
                  go(menuPath)(e)
                }}
                style={{ ...styles.navBtn, ...styles.navPrimary }}
              >
                Menu
              </motion.button>
            </nav>
          </div>
        </header>

        <div style={styles.bodyOrder} className="vpz-bodyOrder">
          <aside style={styles.asideNav} className="vpz-asideNav" aria-label="Menu categories (left)">
            <div style={styles.navInner}>
              <div style={styles.navTitle}>Categories</div>

              <div style={styles.navImgGrid}>
                {navItems.map((c) => {
                  const meta = catMetaById.get(c.id)
                  const isActive = c.id === activeId
                  const overrides = sidebarButtonOverrides(c.id)
                  return (
                    <CategoryImageButton
                      key={c.id}
                      imgSrc={meta?.img || "/restaurant/pizza.png"}
                      isActive={isActive}
                      ariaLabel={c.title}
                      onClick={() => setActiveId(c.id)}
                      buttonStyle={overrides?.buttonStyle}
                      frameStyle={overrides?.frameStyle}
                    />
                  )
                })}
              </div>

              <div style={styles.navFooter}>
                <div style={styles.navFootNote}>Tap a category. Add items to your cart.</div>
              </div>
            </div>
          </aside>

          <main style={styles.content} aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.section
                key={active.id}
                initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
                transition={{ duration: 0.22 }}
                style={styles.card}
              >
                <div style={styles.cardHeader}>
                  <div style={styles.cardKicker}>Italiana Style</div>
                  <h2 style={styles.cardTitle}>{active.title}</h2>
                  {active.subtitle ? <div style={styles.cardSubtitle}>{active.subtitle}</div> : null}
                </div>

                <div style={styles.mobileCats} className="vpz-mobileCats" aria-label="Menu categories (mobile)">
                  {navItems.map((c) => {
                    const meta = catMetaById.get(c.id)
                    const isActive = c.id === activeId
                    return (
                      <CategoryImageButton
                        key={c.id}
                        imgSrc={meta?.img || "/restaurant/pizza.png"}
                        isActive={isActive}
                        ariaLabel={c.title}
                        onClick={() => setActiveId(c.id)}
                        buttonStyle={{ gridColumn: mobileCatGridSpan(c.id) }}
                      />
                    )
                  })}
                </div>

                <div style={styles.groups}>
                  {active.groups.map((g, idx) => {


                    return (
                      <div key={`${active.id}-${idx}`} style={styles.group}>
                        <div style={styles.groupHead}>
                          <div style={styles.groupTitle}>{g.title}</div>
                          {g.note ? <div style={styles.groupNote}>{g.note}</div> : null}
                        </div>

                        <div style={styles.listGrid}>
                          {(g.items || []).map((it, i) => {
                            const photo = restaurantMenuImage(g.title, it.name)
                            const imgSrc = photo?.src || ""
                            const itemKey = makeItemKey(active.id, g.title, it.name)
                            const unitPrice = safePrice(it.price)
                            const isOrderable = it.price !== null && it.price !== undefined && toCents(it.price) > 0
                            const inCartQty = cart[itemKey]?.qty || 0

                            return (
                              <motion.article
                                key={`${it.name}-${i}`}
                                whileHover={{ y: -2 }}
                                transition={{ duration: 0.16, ease: "easeOut" }}
                                style={{
                                  ...styles.itemOrder,
                                  ...(inCartQty > 0 ? styles.itemOrderInCart : null),
                                }}
                              >
                                {imgSrc ? (
                                  <motion.button
                                    type="button"
                                    whileTap={{ scale: 0.98 }}
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      e.currentTarget.blur?.()
                                      blurActiveElement()
                                      openImageModal(imgSrc, it.name)
                                    }}
                                    aria-label={`View larger image for ${it.name}`}
                                    title="View image"
                                    style={styles.itemImgBtn}
                                  >
                                    <img style={styles.itemImg} src={imgSrc} alt={`${it.name}${photo?.caption ? ` - ${photo.caption}` : ""}`} loading="lazy" decoding="async" width="800" height="800" draggable="false" />
                                  </motion.button>
                                ) : (
                                  <div style={styles.itemImgEmpty} aria-hidden="true" />
                                )}

                                <div style={styles.itemMid}>
                                  <div style={styles.itemNameRow}>
                                    <div style={styles.itemName}>{it.name}</div>

                                    {inCartQty > 0 ? (
                                      <div style={styles.inCartBadge} aria-label={`In cart quantity ${inCartQty}`}>
                                        In cart: <span style={styles.inCartQty}>{inCartQty}</span>
                                      </div>
                                    ) : null}
                                  </div>

                                  {it.desc ? <div style={styles.itemDesc}>{it.desc}</div> : null}
                                  {photo?.caption && <div style={styles.itemDesc}>{photo.caption}</div>}

                                  <div style={styles.itemMetaRow}>
                                    <div style={styles.itemPricePill}>{money(it.price)}</div>

                                    {inCartQty > 0 ? (
                                      <motion.button
                                        type="button"
                                        whileTap={{ scale: 0.98 }}
                                        whileHover={{ y: -1 }}
                                        onClick={(e) => {
                                          e.currentTarget.blur?.()
                                          blurActiveElement()
                                          remove(itemKey)
                                        }}
                                        aria-label={`Remove ${it.name} from cart`}
                                        title="Remove from cart"
                                        style={styles.removeBtn}
                                      >
                                        Remove
                                      </motion.button>
                                    ) : null}

                                    <motion.button
                                      type="button"
                                      whileTap={isOrderable ? { scale: 0.98 } : undefined}
                                      whileHover={isOrderable ? { y: -1 } : undefined}
                                      onClick={(e) => {
                                        if (!isOrderable) return
                                        e.currentTarget.blur?.()
                                        blurActiveElement()
                                        addToCart({ key: itemKey, name: it.name, unitPrice, imgSrc })
                                      }}
                                      disabled={!isOrderable}
                                      aria-disabled={!isOrderable}
                                      aria-label={isOrderable ? `Add ${it.name} to cart` : `${it.name} not orderable`}
                                      title={isOrderable ? "Add to cart" : "Price not available"}
                                      style={{
                                        ...styles.addBtn,
                                        ...(isOrderable ? null : styles.addBtnDisabled),
                                      }}
                                    >
                                      {inCartQty > 0 ? "Add another" : "Add to cart"}
                                    </motion.button>
                                  </div>
                                </div>
                              </motion.article>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div aria-hidden="true" style={styles.bottomSeal}>
                  <span style={styles.bottomSealLine} />
                  <span style={styles.bottomSealText}>WHIDBEY ISLAND</span>
                  <span style={styles.bottomSealLine} />
                </div>
              </motion.section>
            </AnimatePresence>
          </main>
        </div>
      </div>

      <motion.button
        type="button"
        onClick={(e) => {
          e.currentTarget.blur?.()
          blurActiveElement()
          setCartOpen(true)
        }}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        aria-label="Open cart"
        title="Cart"
        style={styles.cartFab}
      >
        <span aria-hidden="true" style={styles.cartFabIcon}>
          🛒
        </span>

        {totals.count > 0 ? (
          <motion.span
            key={totals.count}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.16 }}
            aria-label={`${totals.count} items in cart`}
            title={`${totals.count} items`}
            style={styles.cartFabBadge}
          >
            {totals.count}
          </motion.span>
        ) : null}
      </motion.button>

      {/* IMAGE MODAL (click anywhere to close) */}
      <AnimatePresence>
        {imgModalOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14 }}
            onClick={() => {
              blurActiveElement()
              closeImageModal()
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Item image preview"
            style={styles.imgModalOverlay}
          >
            <motion.div
              initial={{ scale: 0.98, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.985, y: 8, opacity: 0 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              style={styles.imgModalCard}
            >
              <div style={styles.imgModalImgWrap}>
                {imgModalSrc ? <img src={imgModalSrc} alt={imgModalAlt} style={styles.imgModalImg} /> : null}
              </div>
              <div style={styles.imgModalCaption}>
                <span>{imgModalAlt || "Item"}</span>
                <span style={styles.imgModalHint}>Click anywhere to close</span>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* CART DRAWER */}
      <AnimatePresence>
        {cartOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={() => {
              blurActiveElement()
              setCartOpen(false)
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Cart drawer"
            style={styles.drawerOverlay}
          >
            <motion.aside
              initial={{ x: 380, opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 380, opacity: 0.5 }}
              transition={{ type: "spring", stiffness: 420, damping: 36 }}
              onClick={(e) => e.stopPropagation()}
              style={styles.drawer}
            >
              <div style={styles.drawerHead}>
                <div style={styles.drawerTitle}>
                  Cart{" "}
                  {totals.count > 0 ? (
                    <span style={styles.drawerBadge} aria-label={`${totals.count} items`}>
                      {totals.count}
                    </span>
                  ) : null}
                </div>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.currentTarget.blur?.()
                    blurActiveElement()
                    setCartOpen(false)
                  }}
                  aria-label="Close cart"
                  title="Close"
                  style={styles.drawerClose}
                >
                  ✕
                </motion.button>
              </div>

              <div style={styles.drawerBody} role="region" aria-label="Cart items">
                {checkoutErr ? <div style={styles.checkoutErr}>{checkoutErr}</div> : null}

                {optionValidation.hasIssues ? (
                  <div style={styles.validationBox} aria-label="Required selections missing">
                    <div style={styles.validationTitle}>Selections required before checkout</div>
                    <ul style={styles.validationList}>
                      {optionValidation.summaryLines.slice(0, 10).map((line, idx) => (
                        <li key={`v-${idx}`}>{line}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {cartItems.length ? (
                  <div style={styles.cartRows}>
                    {cartItems.map((it) => {
                      const req = getOptionRequirementsForItemName(it.name)
                      const issueObj = optionValidation.issuesByKey[it.key] || { any: false, units: {} }
                      const anyIssue = !!issueObj.any
                      const issuesForUnits = issueObj.units || {}

                      return (
                        <CartRow
                          key={it.key}
                          itemKey={it.key}
                          name={it.name}
                          unitPrice={it.unitPrice}
                          qty={it.qty}
                          imgSrc={it.imgSrc}
                          req={req}
                          unitOptions={it.unitOptions || []}
                          issuesForUnits={issuesForUnits}
                          anyIssue={anyIssue}
                          onInc={() => inc(it.key)}
                          onDec={() => dec(it.key)}
                          onRemove={() => remove(it.key)}
                          onImageClick={() => openImageModal(it.imgSrc, it.name)}
                          onToggleToppingUnit={(unitIndex, topping, requiredCount) =>
                            toggleToppingUnit(it.key, unitIndex, topping, requiredCount)
                          }
                          onSetDressingUnit={(unitIndex, dressing) => setDressingUnit(it.key, unitIndex, dressing)}
                          styles={styles}
                        />
                      )
                    })}
                  </div>
                ) : (
                  <div style={styles.cartEmpty}>
                    Your cart is empty.
                    <div style={styles.cartEmptyHint}>Add items from the menu.</div>
                  </div>
                )}
              </div>

              <div style={styles.drawerFoot}>
                <div style={styles.breakdown} aria-label="Order total breakdown">
                  <div style={styles.breakRow}>
                    <div style={styles.breakLabel}>Subtotal</div>
                    <div style={styles.breakVal}>{money(totals.subtotal)}</div>
                  </div>

                  <div style={styles.breakRow}>
                    <div style={styles.breakLabel}>Tax (8%)</div>
                    <div style={styles.breakVal}>{money(totals.tax)}</div>
                  </div>

                  <div style={styles.breakRow}>
                    <div style={styles.breakTotalLabel}>Total</div>
                    <div style={styles.breakTotalVal}>{money(totals.total)}</div>
                  </div>
                </div>

                <div style={styles.cartActions}>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                      e.currentTarget.blur?.()
                      blurActiveElement()
                      clearCart()
                    }}
                    disabled={!cartItems.length || checkoutBusy}
                    aria-disabled={!cartItems.length || checkoutBusy}
                    style={{
                      ...styles.navBtn,
                      ...styles.navSecondary,
                      ...(styles.cartBtn || {}),
                      ...(!cartItems.length || checkoutBusy ? styles.navBtnDisabled : null),
                    }}
                  >
                    Clear
                  </motion.button>

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    disabled={!cartItems.length || checkoutBusy || optionValidation.hasIssues}
                    aria-disabled={!cartItems.length || checkoutBusy || optionValidation.hasIssues}
                    onClick={(e) => {
                      e.currentTarget.blur?.()
                      blurActiveElement()
                      redirectToCheckout()
                    }}
                    title={
                      optionValidation.hasIssues
                        ? "Complete required selections before checkout"
                        : checkoutBusy
                        ? "Starting checkout"
                        : "Checkout"
                    }
                    style={{
                      ...styles.navBtn,
                      ...styles.navPrimary,
                      ...(styles.cartBtn || {}),
                      ...(!cartItems.length || checkoutBusy || optionValidation.hasIssues ? styles.navBtnDisabled : null),
                    }}
                  >
                    {optionValidation.hasIssues ? "Complete selections" : checkoutBusy ? "Starting…" : "Checkout"}
                  </motion.button>
                </div>

                <div style={styles.cartFinePrint}>Tax is calculated at 8% and included in the total shown.</div>
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
