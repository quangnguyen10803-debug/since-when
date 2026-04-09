import { useState, useRef, useEffect } from 'react'
import { ImagePlus, X, AlertCircle } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { uploadImage, validateImageFile } from '../../lib/storage'
import type { Memory } from '../../types'
import { format } from 'date-fns'

interface InlineMemoryFormProps {
  folderId: string
  memory?: Memory
  onDone: () => void
}

interface ImageEntry {
  url: string
  name: string
}

interface FileError {
  name: string
  message: string
}

function autoResize(el: HTMLTextAreaElement) {
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

export default function InlineMemoryForm({ folderId, memory, onDone }: InlineMemoryFormProps) {
  const { addMemory, updateMemory } = useAppStore()
  const user = useAuthStore((s) => s.user)

  const [title, setTitle] = useState(memory?.title ?? '')
  const [date, setDate] = useState(memory?.date ?? format(new Date(), 'yyyy-MM-dd'))
  const [notes, setNotes] = useState(memory?.notes ?? '')
  const [images, setImages] = useState<ImageEntry[]>(
    (memory?.images ?? []).map((url) => ({ url, name: '' }))
  )
  const [uploading, setUploading] = useState(false)
  const [fileErrors, setFileErrors] = useState<FileError[]>([])
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const notesRef = useRef<HTMLTextAreaElement>(null)

  // Resize textarea on mount (handles edit mode with existing text)
  useEffect(() => {
    if (notesRef.current) autoResize(notesRef.current)
  }, [])

  const handleFiles = async (files: FileList | null) => {
    if (!files || !user) return
    const remaining = 5 - images.length
    const toProcess = Array.from(files).slice(0, remaining)
    if (!toProcess.length) return

    // Validate each file first
    const errors: FileError[] = []
    const valid: File[] = []
    for (const file of toProcess) {
      const err = validateImageFile(file)
      if (err) {
        errors.push({ name: file.name, message: err })
      } else {
        valid.push(file)
      }
    }
    setFileErrors(errors)
    if (!valid.length) return

    setUploading(true)
    const results = await Promise.all(valid.map((f) => uploadImage(f, user.id)))
    const uploadErrors: FileError[] = []
    const succeeded: ImageEntry[] = []

    results.forEach((result, i) => {
      if (result.error) {
        uploadErrors.push({ name: valid[i].name, message: result.error })
      } else {
        succeeded.push({ url: result.url!, name: valid[i].name })
      }
    })

    setFileErrors((prev) => [...prev, ...uploadErrors])
    setImages((prev) => [...prev, ...succeeded])
    setUploading(false)
  }

  const removeImage = (idx: number) => setImages((prev) => prev.filter((_, i) => i !== idx))
  const dismissError = (idx: number) => setFileErrors((prev) => prev.filter((_, i) => i !== idx))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      const urls = images.map((img) => img.url)
      if (memory) {
        await updateMemory(memory.id, title.trim(), date, notes.trim(), urls)
      } else {
        await addMemory(folderId, title.trim(), date, notes.trim(), urls)
      }
      onDone()
    } catch (err) {
      console.error('Failed to save memory:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-2 border-black p-3 bg-white space-y-2"
      style={{ boxShadow: '4px 4px 0px #000' }}
    >
      {/* Title + Date row */}
      <div className="flex gap-2">
        <input
          type="text"
          className="brutal-input flex-1"
          placeholder="Title, e.g. Cafe hopping"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />
        <input
          type="date"
          className="brutal-input w-36"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      {/* Notes — borderless, canvas-like, auto-grows */}
      <textarea
        ref={notesRef}
        className="w-full text-sm text-black placeholder:text-gray-400 bg-transparent resize-none leading-relaxed"
        style={{
          border: 'none',
          outline: 'none',
          minHeight: 48,
          fontFamily: 'JetBrains Mono, monospace',
        }}
        placeholder="Write notes… what happened, what do you want to remember?"
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value)
          autoResize(e.target)
        }}
      />

      {/* File errors */}
      {fileErrors.length > 0 && (
        <div className="space-y-1">
          {fileErrors.map((err, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-[10px] font-bold bg-black text-[#FFE500] px-2 py-1.5 border-2 border-black"
            >
              <AlertCircle size={11} className="flex-shrink-0 mt-px" />
              <span className="flex-1 leading-snug">
                <span className="opacity-70">{err.name}: </span>{err.message}
              </span>
              <button type="button" onClick={() => dismissError(i)} className="flex-shrink-0 opacity-70 hover:opacity-100">
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Images */}
      <div>
        {images.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-2">
            {images.map((img, i) => (
              <div key={i} className="relative w-16 h-16 overflow-hidden group/img flex-shrink-0 border-2 border-black">
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-0.5 right-0.5 bg-black text-[#FFE500] border border-black p-0.5
                             opacity-0 group-hover/img:opacity-100 transition-opacity"
                >
                  <X size={9} />
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
              accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif,.heic,.heif"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 text-[11px] font-bold text-black
                         border-2 border-dashed border-black hover:bg-[#FFFFE0]
                         px-3 py-1.5 transition-none disabled:opacity-50"
            >
              <ImagePlus size={12} />
              {uploading ? 'Uploading…' : `Add photos (${images.length}/5)`}
            </button>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onDone} disabled={saving} className="brutal-btn-secondary">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || uploading}
          className="brutal-btn-primary"
        >
          {saving ? 'Saving…' : memory ? 'Save changes' : 'Log memory'}
        </button>
      </div>
    </form>
  )
}
