import { supabase } from './supabase'

export async function uploadImage(file: File, userId: string): Promise<string | null> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/${crypto.randomUUID()}.${ext}`

  const { data, error } = await supabase.storage
    .from('images')
    .upload(path, file)

  if (error || !data) {
    console.error('Image upload failed:', error)
    return null
  }

  const { data: urlData } = supabase.storage
    .from('images')
    .getPublicUrl(data.path)

  return urlData.publicUrl
}
