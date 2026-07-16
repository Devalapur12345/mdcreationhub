'use client'

import { useEffect, useState } from 'react'
import type { TestimonialVideo } from '@/lib/testimonials'

export default function TestimonialsClient() {
  const [videos, setVideos] = useState<TestimonialVideo[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadVideos = async () => {
      try {
        const response = await fetch('/api/testimonials', { cache: 'no-store' })
        const data = (await response.json()) as { videos?: TestimonialVideo[] }

        if (response.ok) {
          setVideos(data.videos ?? [])
        }
      } catch {
        setVideos([])
      } finally {
        setIsLoading(false)
      }
    }

    loadVideos()
  }, [])

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground">Loading testimonials...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground">No testimonial videos added yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {videos.map((video) => (
              <article
                key={video.id}
                className="overflow-hidden rounded-lg border border-border bg-card shadow-lg"
              >
                <div className="aspect-[9/16] bg-secondary/30">
                  <video
                    src={video.src}
                    controls
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-5">
                  <h2 className="text-lg font-semibold text-foreground">{video.title}</h2>
                  {video.description && <p className="mt-2 text-sm text-muted-foreground">{video.description}</p>}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
