/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/work/italiana", destination: "/components/restaurant-ordering", permanent: true },
      { source: "/applications/italiana", destination: "/components/restaurant-ordering", permanent: true },
      { source: "/applications/restaurant/:path*", destination: "/components/restaurant-ordering/:path*", permanent: true },
      { source: "/work", destination: "/applications", permanent: true },
      ...["upgrade-aprons", "new-standard", "island-flourish", "comtree"].map(slug => ({
        source: `/work/${slug}`, destination: `/applications/${slug}`, permanent: true,
      })),
    ]
  },
  distDir: process.env.NEXT_BUILD_DIR || ".next",
  experimental: {
    // Prevent Next from leaving ESM deps to Node to resolve at runtime
    esmExternals: false,
  },
  transpilePackages: [
    "@mui/material",
    "@mui/system",
    "@mui/icons-material",
    "@mui/x-date-pickers",
  ],
}

module.exports = nextConfig
