import React, { useMemo, useEffect } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import FloatingAssistant from "../components/FloatingAssistant"
import { logFirebasePageView } from "../lib/clientAnalytics"
import { businessGraph, SEARCH_DESCRIPTION } from "../lib/business"

import PropTypes from "prop-types"
import { ThemeProvider } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import theme from "../theme"

import NavBar from "../components/PublicNavigation"
import Footer from "../components/footer"
import PrimaryPageHierarchy from "../components/PrimaryPageHierarchy"

import "../style.css"

export default function MyApp(props) {
  const { Component, pageProps } = props
  const router = useRouter()

  // SSR-safe: use router.pathname (not asPath) for matching
  const hideChrome = useMemo(() => {
    const path = String(router.pathname || "").toLowerCase()
    return path.includes("restaurant")
  }, [router.pathname])

  useEffect(() => {
    const handleRouteChange = url => {
      logFirebasePageView(url)
    }
    handleRouteChange()

    router.events.on("routeChangeComplete", handleRouteChange)
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange)
    }
  }, [router.events])

  return (
    <React.Fragment>
      <ThemeProvider theme={theme}>
        <Head><title>Bergquist Applications</title><meta name="description" content={SEARCH_DESCRIPTION} /><meta name="theme-color" content="#050607" /><meta property="og:site_name" content="Bergquist Applications" />
          <script key="business-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessGraph) }} />
        </Head>
        <CssBaseline />
        <PrimaryPageHierarchy path={router.pathname} />

        <div className={hideChrome ? undefined : "siteTypography"}>
        {!hideChrome && <NavBar />}

        <Component {...pageProps} />

        {!hideChrome && <Footer />}
        {!hideChrome && (!pageProps.componentKey || pageProps.componentCategory === "Design") && <FloatingAssistant key={router.pathname} />}
        </div>
      </ThemeProvider>
    </React.Fragment>
  )
}

MyApp.propTypes = {
  Component: PropTypes.elementType.isRequired,
  pageProps: PropTypes.object.isRequired,
}
