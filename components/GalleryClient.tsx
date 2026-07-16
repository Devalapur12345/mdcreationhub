'use client'

import { useEffect, useState } from 'react'
import { RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react'
import { defaultImages, galleryFilters, type GalleryImage } from '@/lib/gallery'

export default function GalleryClient() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [customImages, setCustomImages] = useState<GalleryImage[]>([])
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)

  useEffect(() => {
    const loadCustomImages = async () => {
      try {
        const response = await fetch('/api/gallery', { cache: 'no-store' })
        const data = (await response.json()) as { images?: GalleryImage[] }

        if (response.ok) {
          setCustomImages(data.images ?? [])
        }
      } catch {
        setCustomImages([])
      }
    }

    loadCustomImages()
  }, [])

  useEffect(() => {
    if (!selectedImage) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedImage(null)
        setZoomLevel(1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedImage])

  const images = [...customImages, ...defaultImages]
  const filteredImages = activeCategory === 'all' ? images : images.filter((img) => img.category === activeCategory)

  const openPreview = (image: GalleryImage) => {
    setSelectedImage(image)
    setZoomLevel(1)
  }

  const closePreview = () => {
    setSelectedImage(null)
    setZoomLevel(1)
  }

  const zoomIn = () => setZoomLevel((value) => Math.min(value + 0.25, 3))
  const zoomOut = () => setZoomLevel((value) => Math.max(value - 0.25, 1))
  const resetZoom = () => setZoomLevel(1)

  return (
    <>
      <section className="py-12 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center gap-4 flex-wrap">
            {galleryFilters.map((gallery) => (
              <button
                key={gallery.id}
                onClick={() => setActiveCategory(gallery.id)}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  activeCategory === gallery.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                }`}
              >
                {gallery.category}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredImages.map((image) => (
              <button
                key={image.id}
                type="button"
                onClick={() => openPreview(image)}
                className="group relative bg-card rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 text-left"
              >
                <div className="relative h-64 md:h-72 overflow-hidden bg-secondary/30">
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                    <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center">
                      <p className="font-semibold text-lg">{image.title}</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">{image.title}</h3>
                  <p className="text-sm text-muted-foreground capitalize">{image.category}</p>
                </div>
              </button>
            ))}
          </div>

          {filteredImages.length === 0 && (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">No images found in this category.</p>
            </div>
          )}
        </div>
      </section>

      {selectedImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={closePreview}
        >
          <div
            className="relative w-full max-w-6xl rounded-2xl bg-card p-3 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="absolute right-3 top-3 z-10 flex gap-2">
              <button
                type="button"
                onClick={zoomOut}
                className="rounded-full bg-background/90 p-2 text-foreground shadow-md hover:bg-secondary"
                aria-label="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={resetZoom}
                className="rounded-full bg-background/90 p-2 text-foreground shadow-md hover:bg-secondary"
                aria-label="Reset zoom"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={zoomIn}
                className="rounded-full bg-background/90 p-2 text-foreground shadow-md hover:bg-secondary"
                aria-label="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={closePreview}
                className="rounded-full bg-background/90 p-2 text-foreground shadow-md hover:bg-secondary"
                aria-label="Close preview"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-hidden rounded-xl bg-background/80">
              <img
                src={selectedImage.src}
                alt={selectedImage.alt}
                className="h-[75vh] w-full object-contain transition-transform duration-200"
                style={{ transform: `scale(${zoomLevel})` }}
              />
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-foreground">{selectedImage.title}</h3>
                <p className="text-sm capitalize text-muted-foreground">{selectedImage.category}</p>
              </div>
              <p className="text-sm text-muted-foreground">{selectedImage.alt}</p>
            </div>
          </div>
        </div>
      )}

      <section className="py-20 bg-primary/10">
        <div className="max-w-2xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">Impressed by Our Work?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Call us to create something equally beautiful for your special occasion
          </p>
          <a
            href="/contact"
            className="inline-block px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-accent transition-colors font-semibold text-lg"
          >
            Contact Us
          </a>
        </div>
      </section>
    </>
  )
}
