import React, { forwardRef } from "react"
import Link from "next/link"
import { useRouter } from "next/router"

// Keep internal MUI links in the current app, preserving downloaded 3D assets.
const SiteLink = forwardRef(function SiteLink({ href, children, onFocus, ...props }, ref) {
  const router = useRouter()
  return <Link href={href} passHref prefetch={false}>
    <a {...props} ref={ref} onFocus={event => {
      onFocus?.(event)
      if (typeof href === "string" && href.startsWith("/")) router.prefetch(href).catch(() => {})
    }}>{children}</a>
  </Link>
})

export default SiteLink
