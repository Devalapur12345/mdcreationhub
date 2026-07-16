'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { ImagePlus, LogOut, Trash2, Video } from 'lucide-react'
import {
  galleryFilters,
  type GalleryCategory,
  type GalleryImage,
} from '@/lib/gallery'
import type { TestimonialVideo } from '@/lib/testimonials'

const maxFileSize = 2 * 1024 * 1024
const maxVideoFileSize = 50 * 1024 * 1024

export default function AdminGalleryManager() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<GalleryCategory>('gifts')
  const [file, setFile] = useState<File | null>(null)
  const [images, setImages] = useState<GalleryImage[]>([])
  const [message, setMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [videoTitle, setVideoTitle] = useState('')
  const [videoDescription, setVideoDescription] = useState('')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videos, setVideos] = useState<TestimonialVideo[]>([])
  const [videoMessage, setVideoMessage] = useState('')
  const [isVideoSaving, setIsVideoSaving] = useState(false)

  const categoryOptions = useMemo(
    () => galleryFilters.filter((filter) => filter.id !== 'all') as { category: string; id: GalleryCategory }[],
    [],
  )

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/admin/session', { cache: 'no-store' })
        const data = (await response.json()) as { isLoggedIn?: boolean }
        setIsLoggedIn(Boolean(data.isLoggedIn))
      } catch {
        setIsLoggedIn(false)
      }
    }

    checkSession()
  }, [])

  useEffect(() => {
    if (!isLoggedIn) {
      return
    }

    const loadImages = async () => {
      try {
        const response = await fetch('/api/gallery', { cache: 'no-store' })
        const data = (await response.json()) as { images?: GalleryImage[] }
        setImages(data.images ?? [])
      } catch {
        setMessage('Could not load uploaded images.')
      }
    }

    loadImages()
  }, [isLoggedIn])

  useEffect(() => {
    if (!isLoggedIn) {
      return
    }

    const loadVideos = async () => {
      try {
        const response = await fetch('/api/testimonials', { cache: 'no-store' })
        const data = (await response.json()) as { videos?: TestimonialVideo[] }
        setVideos(data.videos ?? [])
      } catch {
        setVideoMessage('Could not load testimonial videos.')
      }
    }

    loadVideos()
  }, [isLoggedIn])

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!username.trim() || !password.trim()) {
      setMessage('Please enter both username and password.')
      return
    }

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })
      const data = (await response.json()) as { message?: string }

      if (!response.ok) {
        setMessage(data.message || 'Wrong credentials. Please try again.')
        return
      }

      setIsLoggedIn(true)
      setUsername('')
      setPassword('')
      setMessage('')
    } catch {
      setMessage('Could not login. Please try again.')
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
    } catch {
      // The local UI should still leave the admin area even if the request fails.
    }

    setIsLoggedIn(false)
    setUsername('')
    setPassword('')
    setMessage('')
  }

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!file) {
      setMessage('Please choose an image.')
      return
    }

    if (file.size > maxFileSize) {
      setMessage('Please choose an image smaller than 2 MB.')
      return
    }

    const formData = new FormData()
    formData.append('title', title)
    formData.append('category', category)
    formData.append('image', file)

    setIsSaving(true)
    setMessage('Uploading image...')

    try {
      const response = await fetch('/api/gallery', {
        method: 'POST',
        body: formData,
      })
      const data = (await response.json()) as { images?: GalleryImage[]; message?: string }

      if (!response.ok) {
        setMessage(data.message || 'Could not upload this image.')
        return
      }

      setImages(data.images ?? [])
      setTitle('')
      setCategory('gifts')
      setFile(null)
      setMessage('Image added to live gallery.')
    } catch {
      setMessage('Could not upload this image. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const removeImage = async (imageId: string) => {
    setMessage('Removing image...')

    try {
      const response = await fetch(`/api/gallery?id=${encodeURIComponent(imageId)}`, {
        method: 'DELETE',
      })
      const data = (await response.json()) as { images?: GalleryImage[]; message?: string }

      if (!response.ok) {
        setMessage(data.message || 'Could not remove this image.')
        return
      }

      setImages(data.images ?? [])
      setMessage('Image removed from live gallery.')
    } catch {
      setMessage('Could not remove this image. Please try again.')
    }
  }

  const handleVideoUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!videoFile) {
      setVideoMessage('Please choose a video.')
      return
    }

    if (videoFile.size > maxVideoFileSize) {
      setVideoMessage('Please choose a video smaller than 50 MB.')
      return
    }

    const formData = new FormData()
    formData.append('title', videoTitle)
    formData.append('description', videoDescription)
    formData.append('video', videoFile)

    setIsVideoSaving(true)
    setVideoMessage('Uploading video...')

    try {
      const response = await fetch('/api/testimonials', {
        method: 'POST',
        body: formData,
      })
      const data = (await response.json()) as { videos?: TestimonialVideo[]; message?: string }

      if (!response.ok) {
        setVideoMessage(data.message || 'Could not upload this video.')
        return
      }

      setVideos(data.videos ?? [])
      setVideoTitle('')
      setVideoDescription('')
      setVideoFile(null)
      setVideoMessage('Video added to testimonials.')
    } catch {
      setVideoMessage('Could not upload this video. Please try again.')
    } finally {
      setIsVideoSaving(false)
    }
  }

  const removeVideo = async (videoId: string) => {
    setVideoMessage('Removing video...')

    try {
      const response = await fetch(`/api/testimonials?id=${encodeURIComponent(videoId)}`, {
        method: 'DELETE',
      })
      const data = (await response.json()) as { videos?: TestimonialVideo[]; message?: string }

      if (!response.ok) {
        setVideoMessage(data.message || 'Could not remove this video.')
        return
      }

      setVideos(data.videos ?? [])
      setVideoMessage('Video removed from testimonials.')
    } catch {
      setVideoMessage('Could not remove this video. Please try again.')
    }
  }

  if (!isLoggedIn) {
    return (
      <main className="min-h-[70vh] bg-background py-20">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
            <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Admin Login</h1>
            <p className="text-muted-foreground mb-8">Login to add or remove gallery images and testimonial videos.</p>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="Enter password"
                />
              </div>

              {message && <p className="text-sm text-destructive">{message}</p>}

              <button
                type="submit"
                className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-accent transition-colors font-semibold"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="bg-background py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Gallery & Testimonial Admin</h1>
            <p className="text-muted-foreground">Images and videos are saved in public upload folders.</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8">
          <form onSubmit={handleUpload} className="bg-card border border-border rounded-lg p-6 shadow-lg h-fit space-y-5">
            <div>
              <h2 className="text-2xl font-serif font-bold text-foreground mb-2">Add Image</h2>
              <p className="text-sm text-muted-foreground">Use a compressed JPG or PNG under 2 MB.</p>
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                Image Title
              </label>
              <input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder="Gift basket"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-foreground mb-2">
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(event) => setCategory(event.target.value as GalleryCategory)}
                className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              >
                {categoryOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="image" className="block text-sm font-medium text-foreground mb-2">
                Image
              </label>
              <input
                id="image"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                key={file ? 'has-file' : 'empty-file'}
                className="w-full text-sm text-muted-foreground file:mr-4 file:rounded-lg file:border-0 file:bg-secondary file:px-4 file:py-3 file:text-foreground hover:file:bg-secondary/80"
              />
            </div>

            {message && <p className="text-sm text-muted-foreground">{message}</p>}

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex w-full items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-accent transition-colors font-semibold"
            >
              <ImagePlus className="h-5 w-5" />
              {isSaving ? 'Uploading...' : 'Add to Gallery'}
            </button>
          </form>

          <section>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-5">Uploaded Images</h2>

            {images.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-8 text-center">
                <p className="text-muted-foreground">No uploaded images yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {images.map((image) => (
                  <div key={image.id} className="bg-card border border-border rounded-lg overflow-hidden shadow-lg">
                    <div className="h-56 bg-secondary/30">
                      <img src={image.src} alt={image.alt} className="h-full w-full object-cover" />
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-foreground">{image.title}</h3>
                          <p className="text-sm text-muted-foreground capitalize">{image.category}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(image.id)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-destructive text-white hover:opacity-90 transition-opacity"
                          aria-label={`Remove ${image.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8">
          <form
            onSubmit={handleVideoUpload}
            className="bg-card border border-border rounded-lg p-6 shadow-lg h-fit space-y-5"
          >
            <div>
              <h2 className="text-2xl font-serif font-bold text-foreground mb-2">Add Testimonial Reel</h2>
              <p className="text-sm text-muted-foreground">Upload a vertical MP4, WebM, or MOV video under 50 MB.</p>
            </div>

            <div>
              <label htmlFor="video-title" className="block text-sm font-medium text-foreground mb-2">
                Video Title
              </label>
              <input
                id="video-title"
                value={videoTitle}
                onChange={(event) => setVideoTitle(event.target.value)}
                className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder="Happy client"
              />
            </div>

            <div>
              <label htmlFor="video-description" className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                id="video-description"
                value={videoDescription}
                onChange={(event) => setVideoDescription(event.target.value)}
                className="min-h-28 w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder="Short note about this testimonial"
              />
            </div>

            <div>
              <label htmlFor="testimonial-video" className="block text-sm font-medium text-foreground mb-2">
                Reel Video
              </label>
              <input
                id="testimonial-video"
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={(event) => setVideoFile(event.target.files?.[0] ?? null)}
                key={videoFile ? 'has-video' : 'empty-video'}
                className="w-full text-sm text-muted-foreground file:mr-4 file:rounded-lg file:border-0 file:bg-secondary file:px-4 file:py-3 file:text-foreground hover:file:bg-secondary/80"
              />
            </div>

            {videoMessage && <p className="text-sm text-muted-foreground">{videoMessage}</p>}

            <button
              type="submit"
              disabled={isVideoSaving}
              className="inline-flex w-full items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-accent transition-colors font-semibold disabled:opacity-70"
            >
              <Video className="h-5 w-5" />
              {isVideoSaving ? 'Uploading...' : 'Add Testimonial Video'}
            </button>
          </form>

          <section>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-5">Testimonial Videos</h2>

            {videos.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-8 text-center">
                <p className="text-muted-foreground">No testimonial videos yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {videos.map((video) => (
                  <div key={video.id} className="bg-card border border-border rounded-lg overflow-hidden shadow-lg">
                    <div className="aspect-[9/16] bg-secondary/30">
                      <video src={video.src} controls playsInline className="h-full w-full object-cover" />
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-foreground">{video.title}</h3>
                          {video.description && (
                            <p className="mt-1 text-sm text-muted-foreground">{video.description}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeVideo(video.id)}
                          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive text-white hover:opacity-90 transition-opacity"
                          aria-label={`Remove ${video.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
