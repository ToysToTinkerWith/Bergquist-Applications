import Head from "next/head"
import { BUSINESS_NAME, SITE_URL } from "../lib/business"
import { SOCIAL_IMAGE_PATH, SOCIAL_IMAGE_URL, SOCIAL_IMAGE_ALT, SOCIAL_IMAGE_WIDTH, SOCIAL_IMAGE_HEIGHT } from "../lib/socialPreview"

export default function PageSeo({ title, description, path, image = SOCIAL_IMAGE_PATH, imageAlt, schema, breadcrumbs }) {
  const fullTitle = `${title} | ${BUSINESS_NAME}`
  const defaultImage = image === SOCIAL_IMAGE_PATH || image === SOCIAL_IMAGE_URL
  const imageUrl = defaultImage ? SOCIAL_IMAGE_URL : /^https?:\/\//.test(image) ? image : `${SITE_URL}${image}`
  const previewAlt = imageAlt || (defaultImage ? SOCIAL_IMAGE_ALT : fullTitle)
  return <Head>
    <title>{fullTitle}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={`${SITE_URL}${path}`} />
    <meta property="og:title" content={fullTitle} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={`${SITE_URL}${path}`} />
    <meta property="og:type" content="website" />
    <meta property="og:image" content={imageUrl} />
    {defaultImage && <meta property="og:image:width" content={SOCIAL_IMAGE_WIDTH} />}
    {defaultImage && <meta property="og:image:height" content={SOCIAL_IMAGE_HEIGHT} />}
    <meta property="og:image:alt" content={previewAlt} />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={fullTitle} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={imageUrl} />
    <meta name="twitter:image:alt" content={previewAlt} />
    {schema && <script key="page-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />}
    {breadcrumbs && <script key="breadcrumb-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: breadcrumbs.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: `${SITE_URL}${item.path}` })) }).replace(/</g, "\\u003c") }} />}
  </Head>
}
