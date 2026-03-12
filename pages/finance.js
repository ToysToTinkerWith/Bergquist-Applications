import React from "react"

import StripeCatalog from "../components/StripeCatalog"
import StripePurchaseAnalytics from "../components/StripePurchaseAnalytics"


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
            cancelPath="/applications/restaurant/order"
            showPageSection
            taxRate={0.08}
        />
        <StripePurchaseAnalytics
            title="Restaurant Product Analytics"
            subtitle="See which menu items are being purchased most and how sales trend over time."
            lastUpdated="March 11, 2026"
            analyticsApi="/api/analytics/product-purchases"
            defaultDays={90}
            showPageSection
        />
    </div>
  )
}