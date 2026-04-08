import { useState, useRef } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { uploadImage } from '../../lib/storage'
import type { Memory } from '../../types'
import { format } from 'date-fns'

interface InlineMemoryFormProps {
  folderId: string
  memory?: Memory // if provided → edit mode
  onDone: () => void
}

export default function InlineMemoryForm({ folderId, memory, onDone }: InlineMemoryFormProps) {
  const { addMemory, updateMemory } = useAppStore()
  const user = useAuthStore((s) => s.user)

  const [title, setTitle] = useState(memory?.title ?? '')
  const [date, setDate] = useState(memory?.date ?? format(new Date(), 'yyyy-MM-dd'))
  const [notes, setNotes] = useState(memory?.notes ?? '')
  const [images, setImages] = useState<string[]>(memory?.images ?? [])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files || !user) return
    const toProcess = Array.from(files).slice(0, 5 - images.length)
    if (!toProcess.length) return
    setUploading(true)
    const urls = await Promise.all(toProcess.map((f) => uploadImage(f, user.id)))
    setImages((prev) => [...prev, ...(urls.filter(Boolean) as string[])])
    setUploading(false)
  }

  const removeImage = (idx: number) => setImages((prev) => prev.filter((_, i) => i !== idx))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    if (memory) {
      await updateMemory(memory.id, title.trim(), date, notes.trim(), images)
    } else {
      await addMemory(folderId, title.trim(), date, notes.trim(), images)
    }
    setSaving(false)
    onDone()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-2 border-gray-900 rounded-xl p-4 bg-white space-y-3"
    >
      {/* Title + Date row */}
      <div className="flex gap-2">
        <input
          type="text"
          className="notion-input flex-1"
          placeholder="Title, e.g. Cafe hopping"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />
        <input
          type="date"
          className="notion-input w-36"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      {/* Notes */}
      <textarea
        className="notion-input resize-none w-full"
        rows={3}
        placeholder="Add notes… what happened, what do you want to remember?"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      {/* Images */}
      <div>
        {images.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-2">
            {images.map((src, i) => (
              <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden group/img flex-shrink-0">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5
                             opacity-0 group-hover/img:opacity-100 transition-opacity"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
        {images.length < 5 && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600
                         border border-dashed border-gray-200 hover:border-gray-300 rounded-lg
                         px-3 py-1.5 transition-colors disabled:opacity-50"
            >
              <ImagePlus size={13} />
              {uploading ? 'Uploading…' : `Add photos (${images.length}/5)`}
            </button>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onDone} disabled={saving} className="notion-btn-secondary">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || uploading}
          className="notion-btn-primary disabled:opacity-60"
        >
          {saving ? 'Saving…' : memory ? 'Save changes' : 'Log memory'}
        </button>
      </div>
    </form>
  )
}
