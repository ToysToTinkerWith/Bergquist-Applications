import { doc, collection, setDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { db, storage } from "../Firebase/FirebaseInit"
import { PHOTO_TYPES, isEventPhotoPath, persistEventPhotos, validateEventPhotos, validatePhotoFiles } from "./schedulerPhotos.mjs"

async function removePhoto(eventId, image) {
  if (!isEventPhotoPath(image?.path, eventId)) return
  try {
    await deleteObject(ref(storage, image.path))
  } catch (error) {
    if (error.code !== "storage/object-not-found") throw error
  }
}

export async function saveSchedulerEvent({ eventId, payload, existingImages = [], newImages = [], removedImages = [] }) {
  validateEventPhotos(existingImages, newImages)
  await validatePhotoFiles(newImages.map(image => image.file), existingImages.length)
  const eventRef = eventId ? doc(db, "scheduleEvents", eventId) : doc(collection(db, "scheduleEvents"))
  // Storage rules may look up this document and its owner during uploads.
  if (!eventId) await setDoc(eventRef, { ...payload, images: [] })
  try {
    await persistEventPhotos({
      existingImages, newImages, removedImages,
      upload: async image => {
        const id = crypto.randomUUID()
        const path = `scheduleEvents/${eventRef.id}/${id}.${PHOTO_TYPES[image.file.type]}`
        const storageRef = ref(storage, path)
        try {
          await uploadBytes(storageRef, image.file, { contentType: image.file.type })
          const url = await getDownloadURL(storageRef)
          return { id, path, url, message: image.message, fileName: image.file.name.slice(0, 255), contentType: image.file.type, size: image.file.size, createdAt: Timestamp.now() }
        } catch (error) {
          await removePhoto(eventRef.id, { path }).catch(() => {})
          throw error
        }
      },
      commit: images => {
        if (eventId) return updateDoc(eventRef, { ...payload, images })
        if (images.length) return updateDoc(eventRef, { images })
      },
      remove: image => removePhoto(eventRef.id, image),
    })
  } catch (error) {
    // persistEventPhotos finishes file cleanup while the owner document exists.
    if (!eventId) {
      try {
        await deleteDoc(eventRef)
      } catch {
        throw new Error("Photos could not be saved and the new event could not be removed. Refresh the calendar before retrying.", { cause: error })
      }
    }
    throw error
  }
  return eventRef.id
}

export async function deleteSchedulerEvent(eventId, images) {
  await deleteDoc(doc(db, "scheduleEvents", eventId))
  await Promise.allSettled(images.map(image => removePhoto(eventId, image)))
}
