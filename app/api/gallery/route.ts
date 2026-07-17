import { randomUUID } from 'crypto'
import { mkdir, readFile, unlink, writeFile } from 'fs/promises'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import type { GalleryCategory, GalleryImage } from '@/lib/gallery'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const uploadsDir = path.join(process.cwd(), 'public', 'gallery', 'uploads')
const manifestPath = path.join(uploadsDir, 'images.json')
const maxFileSize = 2 * 1024 * 1024

const allowedTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
])

const allowedCategories: GalleryCategory[] = ['floral', 'luxury', 'gifts', 'sweets']

async function ensureUploadsDir() {
  await mkdir(uploadsDir, { recursive: true })
}

async function readImages() {
  await ensureUploadsDir()

  try {
    const file = await readFile(manifestPath, 'utf8')
    return JSON.parse(file) as GalleryImage[]
  } catch {
    return []
  }
}

async function saveImages(images: GalleryImage[]) {
  await ensureUploadsDir()
  await writeFile(manifestPath, JSON.stringify(images, null, 2), 'utf8')
}

function jsonResponse(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init)
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  return response
}

function jsonError(message: string, status = 400) {
  return jsonResponse({ message }, { status })
}

export async function GET() {
  const images = await readImages()
  return jsonResponse({ images })
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request)

  if (authError) {
    return authError
  }

  const formData = await request.formData()
  const file = formData.get('image')
  const titleValue = formData.get('title')
  const categoryValue = formData.get('category')

  if (!(file instanceof File)) {
    return jsonError('Please choose an image.')
  }

  if (file.size > maxFileSize) {
    return jsonError('Please choose an image smaller than 2 MB.')
  }

  const extension = allowedTypes.get(file.type)

  if (!extension) {
    return jsonError('Only JPG, PNG, and WebP images are allowed.')
  }

  const category = String(categoryValue || 'gifts') as GalleryCategory

  if (!allowedCategories.includes(category)) {
    return jsonError('Please choose a valid category.')
  }

  const imageTitle = String(titleValue || '').trim() || 'Gallery Image'
  const imageId = `custom-${Date.now()}-${randomUUID()}`
  const fileName = `${imageId}.${extension}`
  const publicSrc = `/gallery/uploads/${fileName}`
  const bytes = Buffer.from(await file.arrayBuffer())

  await ensureUploadsDir()
  await writeFile(path.join(uploadsDir, fileName), bytes)

  const uploadedImage: GalleryImage = {
    id: imageId,
    src: publicSrc,
    alt: imageTitle,
    category,
    title: imageTitle,
    isCustom: true,
  }

  const images = await readImages()
  const nextImages = [uploadedImage, ...images]
  await saveImages(nextImages)

  return jsonResponse({ image: uploadedImage, images: nextImages }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const authError = await requireAdmin(request)

  if (authError) {
    return authError
  }

  const imageId = request.nextUrl.searchParams.get('id') || (await request.json().catch(() => null) as { id?: string } | null)?.id

  if (!imageId) {
    return jsonError('Missing image id.')
  }

  const images = await readImages()
  const imageToDelete = images.find((image) => image.id === imageId)
  const nextImages = images.filter((image) => image.id !== imageId)

  if (imageToDelete?.src.startsWith('/gallery/uploads/')) {
    const fileName = path.basename(imageToDelete.src)

    try {
      await unlink(path.join(uploadsDir, fileName))
    } catch {
      // The gallery index should still be cleaned up if the file is already gone.
    }
  }

  await saveImages(nextImages)

  return jsonResponse({ images: nextImages })
}
