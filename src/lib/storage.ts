import { supabase } from './supabase'

export type UploadResult = { url: string; error: null } | { url: null; error: string }

const MAX_SIZE_BYTES = 1 * 1024 * 1024 // 1 MB

const SUPPORTED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
])

export function validateImageFile(file: File): string | null {
  // HEIC files often report as '' or 'application/octet-stream' — detect by extension too
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  const isHeic = ext === 'heic' || ext === 'heif'
  const isSupported = SUPPORTED_TYPES.has(file.type) || isHeic

  if (!isSupported) return 'File type not supported. Use JPG, PNG, GIF, WebP, or HEIC.'
  if (file.size > MAX_SIZE_BYTES) return `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max size is 1 MB.`
  return null
}

export async function uploadImage(file: File, userId: string): Promise<UploadResult> {
  try {
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${userId}/${crypto.randomUUID()}.${ext}`

    const { data, error } = await supabase.storage
      .from('images')
      .upload(path, file)

    if (error || !data) {
      console.error('Image upload failed:', error)
      return { url: null, error: 'Upload failed. Please try again.' }
    }

    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(data.path)

    return { url: urlData.publicUrl, error: null }
  } catch (err) {
    console.error('Image upload error:', err)
    return { url: null, error: 'Upload failed. Please try again.' }
  }
}
