import React, { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import styles from "../styles/business-pages.module.css"

const PlanetMesh = dynamic(() => import("./MoonMesh"), {
  ssr: false,
  loading: () => <div className={styles.planetLoading} aria-hidden="true" />,
})

const SERVICE_PLANETS = {
  "business-websites": { planet: "venus", label: "Venus" },
  "custom-web-applications": { planet: "jupiter", label: "Jupiter" },
  "commerce-payments": { planet: "saturn", label: "Saturn" },
  "ai-integrations": { planet: "neptune", label: "Neptune" },
}

function useNearViewport() {
  const ref = useRef(null)
  const [near, setNear] = useState(false)

  useEffect(() => {
    if (near) return

    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
      setNear(true)
      return
    }

    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return
      setNear(true)
      observer.disconnect()
    }, { rootMargin: "180px 0px", threshold: 0.01 })

    observer.observe(node)

    return () => observer.disconnect()
  }, [near])

  return [ref, near]
}

export default function ServicePlanetBreak({ serviceSlug }) {
  const asset = SERVICE_PLANETS[serviceSlug] || { planet: "mars", label: "Mars" }
  const [ref, near] = useNearViewport()

  return (
    <section className={styles.planetBreak} aria-label={`${asset.label} rotating planet asset`}>
      <div ref={ref} className={styles.planetFrame} data-service-planet={asset.planet}>
        {near ? (
          <PlanetMesh
            compact
            planet={asset.planet}
            minHeight={{ xs: 280, sm: 330, md: 380 }}
            enableWheelZoom={false}
          />
        ) : (
          <div className={styles.planetLoading} aria-hidden="true" />
        )}
      </div>
    </section>
  )
}
