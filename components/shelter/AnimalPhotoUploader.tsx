'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/shared/Button'
import type { SelectedAnimalPhoto } from '@/components/shelter/AnimalFormPanel'

// Must match the content types POST /api/uploads (and the pets Storage bucket) accept.
const allowedContentTypes = ['image/jpeg', 'image/png', 'image/webp']
const maxFileSizeBytes = 5 * 1024 * 1024

export function AnimalPhotoUploader({
  photos,
  onChange,
}: {
  photos: SelectedAnimalPhoto[]
  onChange: (photos: SelectedAnimalPhoto[]) => void
}) {
  const [error, setError] = useState<string | null>(null)
  const photosRef = useRef(photos)

  useEffect(() => {
    photosRef.current = photos
  }, [photos])

  useEffect(() => {
    return () => {
      photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl))
    }
  }, [])

  function addPhotos(files: FileList | null) {
    if (!files) return

    const nextPhotos: SelectedAnimalPhoto[] = []
    const rejected: string[] = []

    Array.from(files).forEach((file) => {
      if (!allowedContentTypes.includes(file.type)) {
        rejected.push(`${file.name} must be a JPG, PNG or WebP image.`)
        return
      }
      if (file.size > maxFileSizeBytes) {
        rejected.push(`${file.name} is larger than 5MB.`)
        return
      }
      nextPhotos.push({
        id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      })
    })

    if (rejected.length) {
      setError(rejected[0])
    } else {
      setError(null)
    }

    if (nextPhotos.length) {
      onChange([...photos, ...nextPhotos])
    }
  }

  function removePhoto(photoId: string) {
    const removedPhoto = photos.find((photo) => photo.id === photoId)
    if (removedPhoto) URL.revokeObjectURL(removedPhoto.previewUrl)
    onChange(photos.filter((photo) => photo.id !== photoId))
  }

  return (
    <div>
      <label
        htmlFor="animal-photos"
        onDragOver={(event) => {
          event.preventDefault()
        }}
        onDrop={(event) => {
          event.preventDefault()
          addPhotos(event.dataTransfer.files)
        }}
        className="group flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-violet-300 bg-gradient-to-br from-violet-50 via-white to-teal-50 px-4 py-6 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-violet-400 hover:shadow-lg"
      >
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-xs font-black text-violet-700 shadow-sm transition group-hover:scale-105" aria-hidden="true">
          Camera
        </span>
        <span className="mt-3 text-sm font-black text-slate-950">Add animal photos</span>
        <span className="mt-1 text-xs font-semibold text-slate-500">Tap to choose images or drag them here</span>
        <span className="mt-2 rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-violet-700 shadow-sm">
          JPG, PNG or WebP, up to 5MB each
        </span>
      </label>
      <input
        id="animal-photos"
        type="file"
        accept={allowedContentTypes.join(',')}
        multiple
        onChange={(event) => {
          addPhotos(event.target.files)
          event.target.value = ''
        }}
        className="sr-only"
      />
      {error ? <p className="mt-2 text-xs font-bold text-rose-600">{error}</p> : null}

      <div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-500">
        <span>{photos.length} selected</span>
        <span>Uploaded when you submit</span>
      </div>

      {photos.length ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo) => (
            <div key={photo.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
              <img src={photo.previewUrl} alt={photo.file.name} className="h-28 w-full object-cover" />
              <div className="p-2">
                <p className="truncate text-xs font-bold text-slate-700">{photo.file.name}</p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-2"
                  fullWidth
                  onClick={() => removePhoto(photo.id)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
