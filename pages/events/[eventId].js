// pages/events/[eventId].jsx

import React from "react"
import Head from "next/head"
import { useRouter } from "next/router"
import EventGalleryViewer from "../../components/EventGalleryViewer"

export default function EventViewerPage() {
  const router = useRouter()
  const { eventId } = router.query

  if (!eventId) {
    return null
  }

  return (
    <>
      <Head>
        <title>Event Viewer</title>
        <meta
          name="description"
          content="Read-only event page with event details and image gallery."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <EventGalleryViewer eventId={eventId} />
    </>
  )
}