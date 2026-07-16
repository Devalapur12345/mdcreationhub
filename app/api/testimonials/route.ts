import { randomUUID } from 'crypto'
import { mkdir, readFile, unlink, writeFile } from 'fs/promises'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import type { TestimonialVideo } from '@/lib/testimonials'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const uploadsDir = path.join(process.cwd(), 'public', 'testimonials', 'uploads')
const manifestPath = path.join(uploadsDir, 'videos.json')
const maxFileSize = 50 * 1024 * 1024

const allowedTypes = new Map([
  ['video/mp4', 'mp4'],
  ['video/webm', 'webm'],
  ['video/quicktime', 'mov'],
])

async function ensureUploadsDir() {
  await mkdir(uploadsDir, { recursive: true })
}

async function readVideos() {
  await ensureUploadsDir()

  try {
    const file = await readFile(manifestPath, 'utf8')
    return JSON.parse(file) as TestimonialVideo[]
  } catch {
    return []
  }
}

async function saveVideos(videos: TestimonialVideo[]) {
  await ensureUploadsDir()
  await writeFile(manifestPath, JSON.stringify(videos, null, 2), 'utf8')
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ message }, { status })
}

export async function GET() {
  const videos = await readVideos()
  return NextResponse.json({ videos })
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin()

  if (authError) {
    return authError
  }

  const formData = await request.formData()
  const file = formData.get('video')
  const titleValue = formData.get('title')
  const descriptionValue = formData.get('description')

  if (!(file instanceof File)) {
    return jsonError('Please choose a video.')
  }

  if (file.size > maxFileSize) {
    return jsonError('Please choose a video smaller than 50 MB.')
  }

  const extension = allowedTypes.get(file.type)

  if (!extension) {
    return jsonError('Only MP4, WebM, and MOV videos are allowed.')
  }

  const videoTitle = String(titleValue || '').trim() || 'Client Testimonial'
  const videoDescription = String(descriptionValue || '').trim()
  const videoId = `testimonial-${Date.now()}-${randomUUID()}`
  const fileName = `${videoId}.${extension}`
  const publicSrc = `/testimonials/uploads/${fileName}`
  const bytes = Buffer.from(await file.arrayBuffer())

  await ensureUploadsDir()
  await writeFile(path.join(uploadsDir, fileName), bytes)

  const uploadedVideo: TestimonialVideo = {
    id: videoId,
    src: publicSrc,
    title: videoTitle,
    description: videoDescription,
    isCustom: true,
  }

  const videos = await readVideos()
  const nextVideos = [uploadedVideo, ...videos]
  await saveVideos(nextVideos)

  return NextResponse.json({ video: uploadedVideo, videos: nextVideos }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const authError = await requireAdmin()

  if (authError) {
    return authError
  }

  const videoId = request.nextUrl.searchParams.get('id')

  if (!videoId) {
    return jsonError('Missing video id.')
  }

  const videos = await readVideos()
  const videoToDelete = videos.find((video) => video.id === videoId)
  const nextVideos = videos.filter((video) => video.id !== videoId)

  if (videoToDelete?.src.startsWith('/testimonials/uploads/')) {
    const fileName = path.basename(videoToDelete.src)

    try {
      await unlink(path.join(uploadsDir, fileName))
    } catch {
      // Keep the manifest correct even if the video file was already removed.
    }
  }

  await saveVideos(nextVideos)

  return NextResponse.json({ videos: nextVideos })
}
