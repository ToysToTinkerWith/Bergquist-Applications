import React, { useEffect, useRef, useState } from "react"
import styles from "../styles/about.module.css"

// Individual pen strokes preserve the order and pauses of a handwritten signature.
const strokes = [
  "M8 79 C29 63 45 29 58 16 C63 10 67 12 65 23 L53 78 M23 57 Q45 49 72 53",
  "M65 70 Q76 62 81 49 L77 73 C89 49 105 45 99 60 L94 74 Q101 78 112 65",
  "M132 51 C110 40 101 79 117 75 C139 69 150 23 145 18 C138 13 124 74 134 76 Q142 77 151 65",
  "M150 64 C175 65 173 44 160 51 C143 61 149 82 175 69",
  "M175 69 L186 49 Q177 67 187 60 Q197 42 203 51 L198 60 Q204 64 211 56",
  "M232 51 C218 40 208 51 220 61 C239 77 207 84 202 74 Q224 76 243 65",
  "M260 82 C272 63 282 37 293 18 C304 3 323 12 313 29 C303 44 285 48 279 47 C328 25 333 56 305 72 C291 80 273 83 276 70",
  "M316 65 C342 65 340 44 327 51 C310 61 316 82 342 69",
  "M342 69 L353 49 Q344 67 354 60 Q364 42 370 51 L365 60 Q371 64 378 56",
  "M401 52 C381 43 371 78 385 74 Q398 69 403 51 C403 73 395 108 379 112 C363 114 378 91 409 75",
  "M436 51 C414 43 402 77 419 76 Q431 71 438 50 L426 105 Q433 90 450 74",
  "M451 51 C439 73 444 81 454 72 L469 51 C458 78 465 80 478 65",
  "M484 51 C475 72 478 78 491 69",
  "M489 36 L490 34",
  "M515 51 C501 42 492 51 504 62 C520 77 493 82 489 75 Q511 76 527 65",
  "M549 29 C542 45 529 75 538 77 Q545 78 556 65 M526 51 Q542 47 557 49",
  "M298 97 C376 85 461 90 558 86",
]

export default function AndersSignature() {
  const ref = useRef(null)
  const [state, setState] = useState("complete")
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (motion.matches || !window.IntersectionObserver) return
    setState("waiting")
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setState("writing"); observer.disconnect() }
    }, { threshold: .65 })
    observer.observe(ref.current)
    const stop = () => { if (motion.matches) { setState("complete"); observer.disconnect() } }
    motion.addEventListener("change", stop)
    return () => { observer.disconnect(); motion.removeEventListener("change", stop) }
  }, [])
  return <div ref={ref} className={styles.signature} role="img" aria-label="Anders Bergquist's signature" data-signature={state}>
    <svg viewBox="0 0 580 126" aria-hidden="true" focusable="false">
      {strokes.map((d, index) => <path key={index} d={d} pathLength="1" style={{ "--stroke-delay": `${index * .19}s` }} />)}
    </svg>
  </div>
}
