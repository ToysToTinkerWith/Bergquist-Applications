import { useEffect, useRef, useState } from 'react'

export default function DeferredContent({ children, minHeight = 360, margin = '350px' }) {
  const ref = useRef(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (!window.IntersectionObserver) { setReady(true); return }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setReady(true); observer.disconnect() }
    }, { rootMargin: margin })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [margin])
  return <div ref={ref} style={ready ? undefined : { minHeight }}>{ready ? children : null}</div>
}
