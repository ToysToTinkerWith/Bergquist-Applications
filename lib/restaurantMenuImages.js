import images from "./restaurantMenuImages.json"

const byItem = new Map(images.map(image => [`${image.group}|${image.name}`, image]))
const byKey = new Map(images.map(image => [image.key, image]))

export function restaurantMenuImage(group, name) {
  return byItem.get(`${group}|${name}`) || null
}

export function restaurantFeaturedImage(key) {
  return byKey.get(key)?.src || ""
}
