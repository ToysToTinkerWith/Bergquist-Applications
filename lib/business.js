export const SITE_URL = "https://bergquistapplications.com"
export const BUSINESS_NAME = "Bergquist Applications"
export const SEARCH_TITLE = "Custom Websites & Web Apps | Bergquist Applications"
export const SEARCH_DESCRIPTION = "Custom websites and applications, built around your business. Work directly with Anders Bergquist on thoughtful design, online bookings, payments, and useful business tools. Website packages from $500 plus $20/month maintenance. Remote collaboration and in-person meetings on Whidbey Island."
export const SERVICE_AREA = "Remote collaboration. In-person meetings on Whidbey Island by arrangement."

export const businessGraph = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: BUSINESS_NAME, url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/brand/logo-512.png`, width: 512, height: 512 },
      description: "Custom websites and web applications for small businesses and makers, built by Anders Bergquist. Remote collaboration and in-person meetings on Whidbey Island by arrangement.", email: "abergquist96@gmail.com",
      founder: { "@id": `${SITE_URL}/about#anders` }, areaServed: { "@type": "Place", name: "Whidbey Island, Washington" } },
    { "@type": "Person", "@id": `${SITE_URL}/about#anders`, name: "Anders Bergquist", url: `${SITE_URL}/about`, jobTitle: "Web developer",
      worksFor: { "@id": `${SITE_URL}/#organization` },
      alumniOf: { "@type": "CollegeOrUniversity", name: "Western Washington University" } },
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: BUSINESS_NAME, url: `${SITE_URL}/`, publisher: { "@id": `${SITE_URL}/#organization` } },
  ],
}
