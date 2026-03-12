import React, { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"


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
            desc:
              "We invented this one! Chopped clams, garlic, parsley spices in olive oil or pizza sauce base.",
            price: 20.25,
          },
          {
            name: "Chicken Bacon Ranch Pizza",
            desc: "Ranch or pizza sauce base with chicken, red onions, bacon and cilantro.",
            price: 20.25,
          },
          {
            name: "Chicken Caesar Pizza",
            desc:
              "Olive oil base with mozzarella, parmesan romano, topped with our famous chicken caesar salad.",
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
            desc:
              "We invented this one! Chopped clams, garlic, parsley spices in olive oil or pizza sauce base.",
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
            desc:
              "Artisan bread, salami, prosciutto, ham, provolone, artichokes, kalamata olives and banana peppers.",
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
            desc:
              "Homemade meatball or sausage, marinara sauce, provolone and mozzarella on an organic baguette.",
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
            desc:
              "Sautéed portobella mushrooms, red onions, provolone and mozzarella, marinara on an organic baguette.",
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

const ITEM_IMAGE_BY_CATEGORY = {
  pizza: "/restaurant/menu/pizza.jpg",
  pasta: "/restaurant/menu/pasta.jpg",
  salads: "/restaurant/menu/salad.jpg",
  sandwiches: "/restaurant/menu/sandwich.jpg",
  beverages: "/restaurant/menu/beverage.jpg",
  appetizers: "/restaurant/menu/appetizer.jpg",
  desserts: "/restaurant/menu/pizza.jpg", // fallback (no dessert.jpg provided)
}

function money(v) {
  if (v === null || v === undefined) return "—"
  const s = Number(v).toFixed(2)
  return s.endsWith("00") ? `$${Number(v).toFixed(0)}` : `$${s}`
}

function useMedia(query) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()

    if (mql.addEventListener) mql.addEventListener("change", onChange)
    else mql.addListener(onChange)

    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", onChange)
      else mql.removeListener(onChange)
    }
  }, [query])

  return matches
}

function CategoryImageButton({
  id,
  imgSrc,
  isActive,
  onClick,
  ariaLabel,
  btnStyle,
  frameStyle,
  imgStyle,
  glowStyle,
  onFocus,
  onBlur,
  onKeyDown,
}) {
  return (
    <motion.button
      type="button"
      data-cat={id}
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -1 }}
      transition={{ duration: 0.14 }}
      aria-label={ariaLabel}
      title={ariaLabel}
      style={btnStyle}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
    >
      <span aria-hidden="true" style={frameStyle}>
        <img src={imgSrc} alt="" style={imgStyle} />
      </span>
      <span aria-hidden="true" style={glowStyle} />
    </motion.button>
  )
}

export default function RestaurantMenu({
  logoSrc = "/restaurant/logo.png",
  restaurantName = "",
  locationLine = "",
  homePath = "/applications/restaurant",
  orderPath = "/applications/restaurant/order",
}) {
  const go = (path) => (e) => {
    e?.preventDefault?.()
    if (typeof window !== "undefined") window.location.href = path
  }

  // Breakpoints matching your CSS
  const isMax520 = useMedia("(max-width: 520px)")
  const isMax420 = useMedia("(max-width: 420px)")
  const isMin560 = useMedia("(min-width: 560px)")
  const isMin740 = useMedia("(min-width: 740px)")
  const isMin1240 = useMedia("(min-width: 1240px)")

  const [activeId, setActiveId] = useState(MENU[0].id)
  const [modal, setModal] = useState(null) // { title, src } | null
  const [focusKey, setFocusKey] = useState(null)

  const active = useMemo(() => MENU.find((c) => c.id === activeId) || MENU[0], [activeId])

  const navItems = useMemo(() => {
    return CATEGORY_META.map((m) => MENU.find((x) => x.id === m.id)).filter(Boolean)
  }, [])

  const catMetaById = useMemo(() => {
    const map = new Map()
    for (const m of CATEGORY_META) map.set(m.id, m)
    return map
  }, [])

  const getItemImageForCategory = (categoryId) => ITEM_IMAGE_BY_CATEGORY[categoryId] || ""

  function openModal(next) {
    setModal(next)
  }
  function closeModal() {
    setModal(null)
  }

  const tokens = useMemo(
    () => ({
      ink: "#f4f0e6",
      ink2: "rgba(244,240,230,.76)",
      ink3: "rgba(244,240,230,.60)",
      line2: "rgba(244,240,230,.12)",
      gold: "rgba(214,177,104,.95)",
      shadow: "rgba(0,0,0,.55)",
      fontFamily: 'ui-serif, Georgia, "Times New Roman", Times, serif',
    }),
    []
  )

  const listCols = useMemo(() => {
    if (isMin1240) return 3
    if (isMin560) return 2
    return 1
  }, [isMin1240, isMin560])

  const styles = useMemo(() => {
    const navBtnPad = isMax520 ? "10px 14px" : "11px 16px"
    const navBtnFont = isMax520 ? 11 : 12

    const logoSize = isMax420 ? 84 : 96
    const logoPad = isMax420 ? 8 : 10
    const logoRadius = isMax420 ? 14 : 16

    const titleSize = isMax420 ? 24 : 26

    const bodyGap = isMin740 ? 14 : 12
    const bodyTop = isMin740 ? 16 : 12

    const itemImgSize = isMin560 ? 58 : 54

    return {
      shell: {
        position: "relative",
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 700px at 20% 0%, rgba(244,240,230,.07), transparent 60%)," +
          "radial-gradient(900px 600px at 80% 20%, rgba(214,177,104,.08), transparent 55%)," +
          "linear-gradient(180deg, #050506 0%, #09090b 65%, #070708 100%)",
        color: tokens.ink,
        fontFamily: tokens.fontFamily,
      },

      bgTexture: {
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(2px 2px at 10% 20%, rgba(244,240,230,.08), transparent 55%)," +
          "radial-gradient(2px 2px at 60% 40%, rgba(244,240,230,.06), transparent 55%)," +
          "radial-gradient(2px 2px at 30% 70%, rgba(244,240,230,.05), transparent 55%)," +
          "radial-gradient(2px 2px at 80% 80%, rgba(244,240,230,.06), transparent 55%)," +
          "linear-gradient(90deg, rgba(255,255,255,.02), rgba(255,255,255,0))",
        opacity: 0.55,
        pointerEvents: "none",
        mixBlendMode: "screen",
      },

      frame: {
        position: "relative",
        maxWidth: 1180,
        margin: "0 auto",
        padding: "16px 12px 30px",
      },

      header: {
        border: `1px solid ${tokens.line2}`,
        borderRadius: 18,
        background: "linear-gradient(180deg, rgba(244,240,230,.06), rgba(244,240,230,.02))",
        boxShadow: `0 18px 60px ${tokens.shadow}`,
        padding: "14px 14px 12px",
        overflow: "hidden",
      },

      headerRow: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
      },

      brand: {
        display: "flex",
        gap: 14,
        alignItems: "center",
        minWidth: 0,
      },

      logoWrap: {
        position: "relative",
        width: logoSize,
        height: logoSize,
        borderRadius: logoRadius,
        border: `1px solid ${tokens.line2}`,
        background:
          "radial-gradient(120px 120px at 50% 0%, rgba(244,240,230,.06), rgba(0,0,0,.0))," +
          "linear-gradient(180deg, rgba(0,0,0,.65), rgba(0,0,0,.35))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: logoPad,
        flex: "0 0 auto",
      },

      logo: {
        width: "100%",
        height: "100%",
        objectFit: "contain",
        filter: "drop-shadow(0 10px 18px rgba(0,0,0,.6))",
        display: "block",
      },

      logoGlow: {
        position: "absolute",
        inset: -40,
        background:
          "radial-gradient(circle at 40% 20%, rgba(214,177,104,.18), transparent 55%)," +
          "radial-gradient(circle at 70% 70%, rgba(244,240,230,.10), transparent 55%)",
        pointerEvents: "none",
        mixBlendMode: "screen",
        opacity: 0.65,
      },

      brandText: { minWidth: 0 },

      kicker: {
        letterSpacing: ".18em",
        textTransform: "uppercase",
        fontSize: 12,
        color: tokens.ink3,
        marginBottom: 4,
      },

      title: {
        margin: 0,
        fontSize: titleSize,
        lineHeight: 1.06,
        letterSpacing: ".02em",
      },

      subtitle: {
        marginTop: 6,
        fontSize: 13,
        color: tokens.ink2,
        letterSpacing: ".08em",
        textTransform: "uppercase",
      },

      navActionsHeader: {
        display: "flex",
        alignItems: "center",
        gap: isMax520 ? 8 : 10,
        flexWrap: "wrap",
        justifyContent: "flex-end",
        paddingTop: 2,
      },

      navBtnBase: (isFocused) => ({
        borderRadius: 999,
        padding: navBtnPad,
        border: "1px solid rgba(255,255,255,.14)",
        background: "linear-gradient(180deg, rgba(18,18,18,.98), rgba(6,6,6,.98))",
        color: tokens.ink,
        fontSize: navBtnFont,
        letterSpacing: ".14em",
        textTransform: "uppercase",
        cursor: "pointer",
        boxShadow: isFocused
          ? "0 0 0 3px rgba(214,177,104,.16), inset 0 1px 0 rgba(255,255,255,.06), 0 12px 24px rgba(0,0,0,.32)"
          : "inset 0 1px 0 rgba(255,255,255,.06), 0 12px 24px rgba(0,0,0,.32)",
        whiteSpace: "nowrap",
        userSelect: "none",
        outline: "none",
      }),

      navBtnPrimary: {
        borderColor: "rgba(214,177,104,.55)",
        background:
          "radial-gradient(circle at 30% 20%, rgba(214,177,104,.20), transparent 52%)," +
          "linear-gradient(180deg, rgba(26,22,14,.98), rgba(8,8,8,.98))",
      },

      navBtnSecondary: {
        borderColor: "rgba(244,240,230,.20)",
        background: "linear-gradient(180deg, rgba(22,22,22,.98), rgba(8,8,8,.98))",
      },

      body: {
        display: "grid",
        gridTemplateColumns: isMin740 ? "clamp(210px, 22vw, 250px) 1fr" : "1fr",
        gap: bodyGap,
        marginTop: bodyTop,
      },

      navAside: {
        display: isMin740 ? "block" : "none",
        position: "sticky",
        top: 16,
        alignSelf: "start",
      },

      navInner: {
        border: `1px solid ${tokens.line2}`,
        borderRadius: 18,
        background: "linear-gradient(180deg, rgba(244,240,230,.045), rgba(244,240,230,.015))",
        boxShadow: `0 18px 60px ${tokens.shadow}`,
        overflow: "hidden",
      },

      navTitle: {
        padding: "14px 14px 10px",
        fontSize: 12,
        letterSpacing: ".18em",
        textTransform: "uppercase",
        color: tokens.ink3,
        borderBottom: `1px solid ${tokens.line2}`,
        background: "rgba(0,0,0,.18)",
      },

      navImgGrid: {
        padding: 12,
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 10,
      },

      navFooter: {
        borderTop: `1px solid ${tokens.line2}`,
        padding: "12px 14px",
        background: "rgba(0,0,0,.18)",
      },

      navFootNote: {
        fontSize: 12,
        color: "rgba(244,240,230,.62)",
        lineHeight: 1.35,
      },

      content: { minWidth: 0 },

      card: {
        border: `1px solid ${tokens.line2}`,
        borderRadius: 18,
        background: "linear-gradient(180deg, rgba(244,240,230,.055), rgba(244,240,230,.02))",
        boxShadow: `0 18px 60px ${tokens.shadow}`,
        overflow: "hidden",
      },

      cardHeader: {
        padding: "14px 14px 10px",
        background:
          "radial-gradient(700px 180px at 25% 0%, rgba(214,177,104,.10), transparent 70%)," +
          "radial-gradient(800px 220px at 80% 10%, rgba(244,240,230,.06), transparent 70%)," +
          "rgba(0,0,0,.18)",
        borderBottom: `1px solid ${tokens.line2}`,
      },

      cardKicker: {
        fontSize: 12,
        letterSpacing: ".18em",
        textTransform: "uppercase",
        color: tokens.ink3,
        marginBottom: 6,
      },

      cardTitle: {
        margin: 0,
        fontSize: 22,
        lineHeight: 1.12,
        letterSpacing: ".02em",
      },

      cardSubtitle: {
        marginTop: 8,
        fontSize: 12,
        color: tokens.ink2,
        letterSpacing: ".08em",
        textTransform: "uppercase",
      },

      mobileCats: {
        display: isMin740 ? "none" : "grid",
        gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
        gap: 10,
        padding: 10,
        borderBottom: `1px solid ${tokens.line2}`,
        background: "rgba(0,0,0,.12)",
      },

      groups: {
        padding: "2px 12px 14px",
      },

      group: {
        marginTop: 12,
        border: `1px solid ${tokens.line2}`,
        borderRadius: 16,
        background: "rgba(0,0,0,.22)",
        overflow: "hidden",
      },

      groupHead: {
        padding: "11px 11px 9px",
        borderBottom: `1px solid ${tokens.line2}`,
        background: "rgba(0,0,0,.22)",
      },

      groupTitle: {
        fontSize: 13,
        letterSpacing: ".14em",
        textTransform: "uppercase",
        color: "rgba(244,240,230,.86)",
      },

      groupNote: {
        marginTop: 6,
        fontSize: 12,
        color: "rgba(244,240,230,.62)",
        lineHeight: 1.35,
      },

      listGrid: {
        padding: 10,
        display: "grid",
        gap: isMin740 ? 12 : 10,
        gridTemplateColumns: `repeat(${listCols}, minmax(0, 1fr))`,
      },

      item: (isFocused) => ({
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        padding: 12,
        border: "1px solid rgba(244,240,230,.10)",
        borderRadius: 14,
        background: "linear-gradient(180deg, rgba(244,240,230,.03), rgba(0,0,0,.0))",
        boxShadow: isFocused
          ? "inset 0 1px 0 rgba(255,255,255,.03), 0 0 0 2px rgba(214,177,104,.24)"
          : "inset 0 1px 0 rgba(255,255,255,.03)",
        cursor: "pointer",
        userSelect: "none",
        outline: "none",
      }),

      itemImg: {
        width: itemImgSize,
        height: itemImgSize,
        borderRadius: 12,
        border: "1px solid rgba(244,240,230,.12)",
        background: "rgba(0,0,0,.25)",
        flex: "0 0 auto",
        objectFit: "cover",
        transform: "scale(1.03)",
        boxShadow: "0 10px 24px rgba(0,0,0,.35)",
        display: "block",
      },

      itemLeft: { minWidth: 0, flex: 1 },

      itemName: {
        fontSize: 15,
        letterSpacing: ".02em",
        color: "rgba(244,240,230,.92)",
        lineHeight: 1.15,
      },

      itemDesc: {
        marginTop: 6,
        fontSize: 13,
        lineHeight: 1.35,
        color: "rgba(244,240,230,.66)",
      },

      itemRight: { flex: "0 0 auto" },

      itemPrice: {
        fontSize: 13,
        letterSpacing: ".14em",
        textTransform: "uppercase",
        color: tokens.gold,
        padding: "7px 10px",
        borderRadius: 999,
        border: "1px solid rgba(214,177,104,.30)",
        background: "rgba(214,177,104,.08)",
        whiteSpace: "nowrap",
      },

      bottomSeal: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 14px 16px",
        opacity: 0.85,
      },

      bottomSealLine: {
        height: 1,
        flex: 1,
        background: "linear-gradient(90deg, transparent, rgba(244,240,230,.20), transparent)",
      },

      bottomSealText: {
        fontSize: 11,
        letterSpacing: ".22em",
        textTransform: "uppercase",
        color: "rgba(244,240,230,.62)",
      },

      // Category button core
      catBtn: (isActive, isFocused, extra = {}) => ({
        position: "relative",
        border: `1px solid ${isActive ? "rgba(214,177,104,.45)" : "rgba(244,240,230,.12)"}`,
        background: isActive
          ? "linear-gradient(180deg, rgba(214,177,104,.10), rgba(0,0,0,.22))"
          : "rgba(0,0,0,.22)",
        borderRadius: extra.borderRadius ?? 14,
        padding: 0,
        overflow: "hidden",
        cursor: "pointer",
        boxShadow: isFocused
          ? "inset 0 1px 0 rgba(255,255,255,.03), 0 0 0 2px rgba(214,177,104,.22)"
          : "inset 0 1px 0 rgba(255,255,255,.03)",
        appearance: "none",
        WebkitAppearance: "none",
        outline: "none",
        aspectRatio: extra.aspectRatio ?? "1 / 1",
        minHeight: extra.minHeight,
        gridColumn: extra.gridColumn,
      }),

      catFrame: (extra = {}) => ({
        display: "block",
        width: "100%",
        height: "100%",
        padding: extra.padding ?? 8,
        background:
          "radial-gradient(260px 90px at 30% 0%, rgba(214,177,104,.10), transparent 60%)," +
          "linear-gradient(180deg, rgba(255,255,255,.03), rgba(0,0,0,.0))",
      }),

      catImg: {
        width: "100%",
        height: "100%",
        objectFit: "contain",
        filter: "saturate(1.05) contrast(1.02)",
        display: "block",
      },

      catGlow: (isActive) => ({
        position: "absolute",
        inset: -30,
        background: "radial-gradient(circle at 50% 40%, rgba(214,177,104,.16), transparent 55%)",
        opacity: isActive ? 0.95 : 0,
        pointerEvents: "none",
        transition: "opacity .18s ease",
      }),

      modalOverlay: {
        position: "fixed",
        inset: 0,
        zIndex: 60,
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
        background: "linear-gradient(180deg, rgba(14,14,14,.92), rgba(6,6,6,.92))",
        boxShadow: "0 30px 80px rgba(0,0,0,.55)",
        overflow: "hidden",
      },

      modalTitle: {
        padding: "12px 14px 10px",
        fontSize: 13,
        letterSpacing: ".10em",
        textTransform: "uppercase",
        color: "rgba(214,177,104,.90)",
        borderBottom: "1px solid rgba(244,240,230,.10)",
        background: "linear-gradient(90deg, rgba(214,177,104,.10), rgba(0,0,0,0))",
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
  }, [tokens, isMax520, isMax420, isMin560, isMin740, listCols])

  const mobileGridColumn = useMemo(
    () => ({
      pizza: "1 / span 4",
      pasta: "5 / span 4",
      salads: "9 / span 4",
      appetizers: "1 / span 3",
      sandwiches: "4 / span 3",
      desserts: "7 / span 3",
      beverages: "10 / span 3",
    }),
    []
  )

  return (
    <div style={styles.shell}>
      <div style={styles.bgTexture} aria-hidden="true" />

      <div style={styles.frame}>
        <header style={styles.header}>
          <div style={styles.headerRow}>
            <div style={styles.brand}>
              <div style={styles.logoWrap}>
                <img style={styles.logo} src={logoSrc} alt={restaurantName} draggable="false" />
                <div style={styles.logoGlow} aria-hidden="true" />
              </div>

              <div style={styles.brandText}>
                <div style={styles.kicker}>Menu</div>
                <h1 style={styles.title}>{restaurantName}</h1>
                <div style={styles.subtitle}>{locationLine}</div>
              </div>
            </div>

            <nav style={styles.navActionsHeader} aria-label="Header actions">
              <motion.button
                type="button"
                style={{ ...styles.navBtnBase(focusKey === "nav:home"), ...styles.navBtnSecondary }}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={go(homePath)}
                onFocus={() => setFocusKey("nav:home")}
                onBlur={() => setFocusKey(null)}
              >
                Home
              </motion.button>

              <motion.button
                type="button"
                style={{ ...styles.navBtnBase(focusKey === "nav:order"), ...styles.navBtnPrimary }}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={go(orderPath)}
                onFocus={() => setFocusKey("nav:order")}
                onBlur={() => setFocusKey(null)}
              >
                Order Online
              </motion.button>
            </nav>
          </div>
        </header>

        <div style={styles.body}>
          {/* Desktop left categories */}
          <aside style={styles.navAside} aria-label="Menu categories (left)">
            <div style={styles.navInner}>
              <div style={styles.navTitle}>Categories</div>

              <div style={styles.navImgGrid}>
                {navItems.map((c) => {
                  const meta = catMetaById.get(c.id)
                  const isActive = c.id === activeId
                  const isFocused = focusKey === `cat:${c.id}`

                  const isWide = c.id === "pizza" || c.id === "pasta" || c.id === "salads"
                  const extra = isWide
                    ? { gridColumn: "1 / -1", aspectRatio: "2.15 / 1", minHeight: 76, borderRadius: 16 }
                    : { aspectRatio: "1 / 1" }

                  const frameExtra = isWide ? { padding: 12 } : { padding: 8 }

                  return (
                    <CategoryImageButton
                      key={c.id}
                      id={c.id}
                      imgSrc={meta?.img || "/restaurant/pizza.png"}
                      isActive={isActive}
                      ariaLabel={c.title}
                      onClick={() => setActiveId(c.id)}
                      btnStyle={styles.catBtn(isActive, isFocused, extra)}
                      frameStyle={styles.catFrame(frameExtra)}
                      imgStyle={styles.catImg}
                      glowStyle={styles.catGlow(isActive)}
                      onFocus={() => setFocusKey(`cat:${c.id}`)}
                      onBlur={() => setFocusKey(null)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          setActiveId(c.id)
                        }
                      }}
                    />
                  )
                })}
              </div>

              <div style={styles.navFooter}>
                <div style={styles.navFootNote}>
                  Prices shown as provided. Some build-your-own Sicilian pricing was not included.
                </div>
              </div>
            </div>
          </aside>

          <main style={styles.content} aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.section
                key={active.id}
                style={styles.card}
                initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
                transition={{ duration: 0.22 }}
              >
                <div style={styles.cardHeader}>
                  <div style={styles.cardKicker}>Italiana Style</div>
                  <h2 style={styles.cardTitle}>{active.title}</h2>
                  {active.subtitle ? <div style={styles.cardSubtitle}>{active.subtitle}</div> : null}
                </div>

                {/* Mobile categories (above items) */}
                <div style={styles.mobileCats} aria-label="Menu categories (mobile)">
                  {navItems.map((c) => {
                    const meta = catMetaById.get(c.id)
                    const isActive = c.id === activeId
                    const isFocused = focusKey === `mcat:${c.id}`

                    return (
                      <CategoryImageButton
                        key={c.id}
                        id={c.id}
                        imgSrc={meta?.img || "/restaurant/pizza.png"}
                        isActive={isActive}
                        ariaLabel={c.title}
                        onClick={() => setActiveId(c.id)}
                        btnStyle={styles.catBtn(isActive, isFocused, {
                          aspectRatio: "1 / 1",
                          gridColumn: mobileGridColumn[c.id] || "auto",
                        })}
                        frameStyle={styles.catFrame({ padding: 8 })}
                        imgStyle={styles.catImg}
                        glowStyle={styles.catGlow(isActive)}
                        onFocus={() => setFocusKey(`mcat:${c.id}`)}
                        onBlur={() => setFocusKey(null)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            setActiveId(c.id)
                          }
                        }}
                      />
                    )
                  })}
                </div>

                <div style={styles.groups}>
                  {active.groups.map((g, idx) => {
                    const imgSrc = getItemImageForCategory(active.id)

                    return (
                      <div key={`${active.id}-${idx}`} style={styles.group}>
                        <div style={styles.groupHead}>
                          <div style={styles.groupTitle}>{g.title}</div>
                          {g.note ? <div style={styles.groupNote}>{g.note}</div> : null}
                        </div>

                        <div style={styles.listGrid}>
                          {(g.items || []).map((it, i) => {
                            const itemKey = `item:${active.id}:${idx}:${i}`
                            const isFocused = focusKey === itemKey

                            return (
                              <motion.article
                                key={`${it.name}-${i}`}
                                style={styles.item(isFocused)}
                                whileHover={{ y: -2 }}
                                transition={{ duration: 0.16, ease: "easeOut" }}
                                onClick={() => (imgSrc ? openModal({ title: it.name, src: imgSrc }) : null)}
                                role="button"
                                tabIndex={0}
                                aria-label={imgSrc ? `Open image for ${it.name}` : it.name}
                                onFocus={() => setFocusKey(itemKey)}
                                onBlur={() => setFocusKey(null)}
                                onKeyDown={(e) => {
                                  if ((e.key === "Enter" || e.key === " ") && imgSrc) {
                                    e.preventDefault()
                                    openModal({ title: it.name, src: imgSrc })
                                  }
                                }}
                              >
                                {imgSrc ? (
                                  <img style={styles.itemImg} src={imgSrc} alt={it.name} draggable="false" />
                                ) : (
                                  <div style={styles.itemImg} aria-hidden="true" />
                                )}

                                <div style={styles.itemLeft}>
                                  <div style={styles.itemName}>{it.name}</div>
                                  {it.desc ? <div style={styles.itemDesc}>{it.desc}</div> : null}
                                </div>

                                <div style={styles.itemRight}>
                                  <div style={styles.itemPrice}>{money(it.price)}</div>
                                </div>
                              </motion.article>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div style={styles.bottomSeal} aria-hidden="true">
                  <span style={styles.bottomSealLine} />
                  <span style={styles.bottomSealText}>WHIDBEY ISLAND</span>
                  <span style={styles.bottomSealLine} />
                </div>
              </motion.section>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Modal: clicking ANYWHERE closes */}
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
              <img style={styles.modalImg} src={modal.src} alt={modal.title} draggable="false" />
              <div style={styles.modalHint}>Click anywhere to close</div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
