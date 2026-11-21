import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import RadarRoundedIcon from '@mui/icons-material/RadarRounded'
import styles from '../styles/site-chrome.module.css'

const loadAssistant = () => import('./chatBot')
const ChatBot = dynamic(loadAssistant, { ssr: false })

export default function FloatingAssistant() {
  const [active, setActive] = useState(false)
  const [hidden, setHidden] = useState(false)
  const button = useRef(null)
  useEffect(() => {
    if (!window.IntersectionObserver) return
    const footer = document.querySelector('[data-site-footer]')
    if (!footer) return
    const observer = new IntersectionObserver(([entry]) => setHidden(entry.isIntersecting), { rootMargin: '0px 0px -80px 0px' })
    observer.observe(footer)
    return () => observer.disconnect()
  }, [])
  if (active) return <ChatBot defaultExpanded />
  return <button ref={button} type="button" className={styles.assistantLauncher} aria-label="Open AI assistant" aria-expanded="false" data-home-assistant-toggle data-assistant-floating="true" data-footer-hidden={hidden ? 'true' : 'false'} hidden={hidden}
    onPointerEnter={() => { void loadAssistant() }} onFocus={() => { void loadAssistant() }} onClick={() => setActive(true)}><RadarRoundedIcon sx={{ fontSize: 30 }} /></button>
}
