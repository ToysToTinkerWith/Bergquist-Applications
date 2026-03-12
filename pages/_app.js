import React, { useMemo, useEffect } from "react"
import { useRouter } from "next/router"

import PropTypes from "prop-types"
import { ThemeProvider } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import theme from "../theme"

import NavBar from "../components/nav"
import Footer from "../components/footer"
import ChatBot from "../components/chatBot"

import Script from "next/script"

import "../style.css"

const GA_ID = process.env.NEXT_PUBLIC_ANALYTICS_MEASUREMENT_ID

export default function MyApp(props) {
  const { Component, pageProps } = props
  const router = useRouter()

  // SSR-safe: use router.pathname (not asPath) for matching
  const hideChrome = useMemo(() => {
    const path = String(router.pathname || "").toLowerCase()
    return path.includes("restaurant")
  }, [router.pathname])

  // Track SPA navigation pageviews
  useEffect(() => {
    if (!GA_ID) return

    const handleRouteChange = (url) => {
      // Send a page_view for the new route
      window.gtag?.("config", GA_ID, {
        page_path: url,
      })
    }

    router.events.on("routeChangeComplete", handleRouteChange)
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange)
    }
  }, [router.events])

  return (
    <React.Fragment>
      {GA_ID && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          />
          <Script id="gtag-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              // Disable the automatic page_view on initial load
              // (we'll handle pageviews ourselves to avoid duplicates)
              gtag('config', '${GA_ID}', {
                anonymize_ip: true,
                send_page_view: false
              });

              // Send the initial page_view
              gtag('event', 'page_view', {
                page_path: window.location.pathname + window.location.search
              });
            `}
          </Script>
        </>
      )}

      <ThemeProvider theme={theme}>
        <CssBaseline />

        {!hideChrome && <NavBar />}

        <Component {...pageProps} />

        {!hideChrome && <Footer />}
        {!hideChrome && <ChatBot />}
      </ThemeProvider>
    </React.Fragment>
  )
}

MyApp.propTypes = {
  Component: PropTypes.elementType.isRequired,
  pageProps: PropTypes.object.isRequired,
}