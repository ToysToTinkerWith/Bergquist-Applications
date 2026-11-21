// pages/api/home-component-images.js

import fs from "fs"
import path from "path"

export default function handler(req, res) {
  try {
    const dir = path.join(process.cwd(), "public", "home", "components")

    const allowedExtensions = new Set([
      ".png",
      ".jpg",
      ".jpeg",
      ".webp",
      ".avif",
      ".gif",
    ])

    const items = fs
      .readdirSync(dir)
      .filter((file) => allowedExtensions.has(path.extname(file).toLowerCase()))
      .sort((a, b) => a.localeCompare(b))
      .map((filename) => ({
        filename,
        src: `/home/components/${filename}`,
      }))

    res.status(200).json({ items })
  } catch (error) {
    res.status(500).json({
      items: [],
      error: error?.message || "Failed to read component images",
    })
  }
}