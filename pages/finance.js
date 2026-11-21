import React from "react"
import dynamic from "next/dynamic"
import DeferredContent from "../components/DeferredContent"

const StripeCatalog = dynamic(() => import("../components/StripeCatalog"), { ssr: false })
const StripePurchaseAnalytics = dynamic(() => import("../components/StripePurchaseAnalytics"), { ssr: false })
const TinymanPoolCandles = dynamic(() => import("../components/TinymanPoolCandles"), { ssr: false })
const AlgorandWalletManager = dynamic(() => import("../components/AlgorandWalletManager"), { ssr: false })


export default function BoilerplateComponent() {
  return (
    <div>
        <StripeCatalog
            title="Online Catalog"
            subtitle="Browse active products from Stripe, add items to your cart, and complete payment with Stripe Checkout."
            lastUpdated="March 10, 2026"
            productsApi="/api/products/active"
            checkoutApi="/api/checkout-sessions/example"
            successPathTemplate="/receipts/{ORDER_ID}"
            cancelPath="/components/restaurant-ordering/order"
            showPageSection
            taxRate={0.08}
        />
        <DeferredContent minHeight={600}><StripePurchaseAnalytics
            title="Restaurant Product Analytics"
            subtitle="See which menu items are being purchased most and how sales trend over time."
            lastUpdated="March 11, 2026"
            analyticsApi="/api/analytics/product-purchases"
            defaultDays={90}
            showPageSection
        /></DeferredContent>
        <DeferredContent minHeight={500}><AlgorandWalletManager /></DeferredContent>
        <DeferredContent minHeight={500}><TinymanPoolCandles /></DeferredContent>
    </div>
  )
}
