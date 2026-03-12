// components/NavBar.jsx
// Requires: @mui/material, framer-motion, next/router (Next.js)
// Theme: matches SplashVideoHero (black, soft glow, gradient text)
//
// Fixes mobile "vertical white bar" (horizontal overflow) by:
// - Removing large fixed padding on xs
// - Clipping horizontal overflow on the wrapper
// - Adding minWidth: 0 to flex containers so children can shrink
// - Constraining logo maxWidth on mobile
// - Allowing nav buttons to wrap on xs (prevents pushing past viewport)

import React, { useMemo } from "react"
import { Box, Button } from "@mui/material"
import { motion } from "framer-motion"
import { useRouter } from "next/router"

export default function NavBar({
  logoSrc = "/logo.png",
  maxWidth = 1200,
  height = 72,
}) {
  const router = useRouter()

  const items = useMemo(
    () => [
      { label: "Home", href: "/" },
      { label: "Applications", href: "/applications" },
      { label: "Contact", href: "/contact" },
    ],
    []
  )

  const isActive = (href) => (router.pathname || "") === href

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        backgroundColor: "black",

        // KEY: prevent tiny overflow from showing as right-side bar on mobile
        overflowX: "clip", // if you prefer widest support: "hidden"

        // Avoid large fixed padding on small screens
        px: { xs: 2, sm: 4 },
        py: { xs: 2, sm: 4 },
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth,
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,

          // IMPORTANT: allow flex children to shrink instead of overflow
          minWidth: 0,

          // prevent double-padding on xs (outer wrapper already pads)
          px: { xs: 0, sm: 3, md: 4 },
        }}
      >
        {/* Left: Logo */}
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
              maxWidth: "60vw", // prevents logo from forcing overflow on mobile
              display: "block",
              userSelect: "none",
            }}
          />
        </Box>

        {/* Right: Buttons */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: { xs: 0.5, sm: 1.25 },

            // IMPORTANT: allow shrinking + wrapping so we never overflow viewport
            minWidth: 0,
            flexWrap: { xs: "wrap", sm: "nowrap" },
          }}
        >
          {items.map((it) => {
            const active = isActive(it.href)

            return (
              <Button
                key={it.href}
                onClick={() => router.push(it.href)}
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
      </Box>
    </Box>
  )
}
