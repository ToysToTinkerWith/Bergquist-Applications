import { featureGallery } from "./featureGallery"
export const outcomes = ["All", "Get inquiries", "Book services", "Sell online", "Manage customers", "Understand your business", "Interactive design"]

export const exampleGuides = {
  "quote-builder": {
    problem: "Project details arrive across calls, texts, and emails before you can prepare a quote.",
    task: "Configure a service and submit a sample request. Switch to Business view to review it and send a quote, then accept it as the customer.",
    benefit: "Collect consistent project information and give each inquiry a clear next step.",
    connections: "Customer records, photo uploads, email notifications, booking, and payments.",
    cta: "Discuss a quoting workflow",
  },
  "appointment-booking": {
    problem: "Choosing an appointment takes several messages, and the details can get lost.",
    task: "Choose a service, date, and available time. Confirm a sample booking, then try rescheduling it.",
    benefit: "Let customers choose from available appointments and keep the service details together.",
    connections: "Staff calendars, reminders, deposits, service areas, and your customer portal.",
    cta: "Discuss online booking",
  },
  "customer-portal": {
    problem: "Customers need updates while your team needs a clear record of decisions and progress.",
    task: "Load the sample project or continue your booking. Advance the work in Business view, then approve completion and review a sample invoice in Customer view.",
    benefit: "Give customers one place to follow work, provide documents, and approve milestones.",
    connections: "Bookings, documents, project photos, approvals, invoices, and payments.",
    cta: "Discuss a customer portal",
  },
  "inquiry-pipeline": {
    problem: "A contact form collects a message, but it is still easy to lose track of who needs a reply.",
    task: "Review the shared sample inquiry, assign an owner, record a follow-up note, and prepare the quote. Follow its status as the customer books.",
    benefit: "Turn a website inquiry into an organized follow-up process.",
    connections: "Contact forms, your CRM, team notifications, quoting, and scheduling.",
    cta: "Discuss inquiry management",
  },
  "service-configurator": {
    problem: "Customers are unsure which service options they need or what affects the price.",
    task: "Change the service, project size, and optional extras. See the sample estimate update, then send those choices into a quote request.",
    benefit: "Help customers understand their options before your first conversation.",
    connections: "Product catalogs, quote requests, inventory, deposits, and ordering.",
    cta: "Discuss a service configurator",
  },
  "document-intake": {
    problem: "Required files and approvals get buried in email threads.",
    task: "Attach a sample image or PDF, choose its purpose, and switch to Business view to review it or request a replacement.",
    benefit: "Keep project documents and review decisions together with a visible checklist.",
    connections: "Customer accounts, secure file storage, project checklists, and notifications.",
    cta: "Discuss document intake",
  },
  "stripe-catalog-financial": {
    problem: "Customers need a clear way to choose products and review their order.",
    task: "Find a product, adjust your cart, place a demo order, and download the sample receipt.",
    benefit: "Make purchasing straightforward and keep order information structured.",
    connections: "Payment processing, stock management, fulfillment, receipts, and reporting.",
    cta: "Discuss selling online",
  },
  "restaurant-ordering": {
    problem: "Phone orders interrupt service and make options harder to communicate.",
    task: "Browse the menu, choose a dish, and review its options and cart before checkout.",
    benefit: "Give customers a clear ordering experience with organized item selections.",
    connections: "Payments, kitchen tickets, pickup times, order notifications, and menu management.",
    cta: "Discuss online ordering",
  },
  "stripe-analytics-financial": {
    problem: "Sales records are difficult to compare when they are scattered across separate views.",
    task: "Change the date range, filter a product, compare chart and table views, and export a report.",
    benefit: "See changes in sales and product performance in one workspace.",
    connections: "Your sales platform, bookings, customer records, and accounting exports.",
    cta: "Discuss a business dashboard",
  },
  "business-notes": {
    problem: "Job photos, appointments, customer details, costs, and next steps are easy to lose across messages and notes.",
    task: "Type or dictate a business note and use Add photos to choose images from your device. Choose whether to create a job or an unpublished social draft, review the AI suggestions, and follow the details into the connected views.",
    benefit: "Capture a business update once and keep its photos, work, and next steps together in a private workspace.",
    connections: "Private photo storage, job progress, your calendar, tasks, customer follow-ups, expenses, location maps, and social captions for manual review and sharing.",
    cta: "Discuss a private business notebook",
  },
  "ai-chat-bot": {
    problem: "Visitors have questions before they know which service or next step fits their needs.",
    task: "Describe a business need and ask the assistant which website features could help. Follow its suggested next step.",
    benefit: "Help visitors explore services and prepare a more useful conversation with your team.",
    connections: "Approved business information, service pages, inquiry forms, and human support.",
    cta: "Discuss a customer assistant",
  },
  "interactive-design": {
    problem: "Some products, places, and stories are easier to understand through exploration.",
    task: "Open an interactive world and explore its controls. Consider how the interaction could explain your product or tell your story.",
    benefit: "Create a distinctive experience for product demonstrations, education, and brand storytelling.",
    connections: "Product information, educational content, campaign pages, and guided tours.",
    cta: "Discuss an interactive experience",
  },
}

export function guideFor(item) {
  const feature = featureGallery[item.key]
  if (feature) return { ...(exampleGuides[item.key] || {}), task: feature.hint || "Open the example and try the controls.", benefit: feature.benefit }
  return exampleGuides[item.key] || (item.category === "Design" ? exampleGuides["interactive-design"] : null) || { problem: "Visitors need a clear way to explore complex information.", task: "Explore the controls and try changing the view.", benefit: item.description, connections: "Your content, business data, and website.", cta: "Discuss this website feature" }
}

export const exampleContact = key => `/contact?component=${encodeURIComponent(key)}`
