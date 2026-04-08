import { useState, useRef } from 'react'
import { ImagePlus, X } from 'lucide-react'
import Modal from '../ui/Modal'
import { useAppStore } from '../../store/appStore'
import type { Memory } from '../../types'
import { format } from 'date-fns'

interface MemoryModalProps {
  folderId: string
  memory?: Memory
  onClose: () => void
}

function toBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result as string)
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

export default function MemoryModal({ folderId, memory, onClose }: MemoryModalProps) {
  const { addMemory, updateMemory } = useAppStore()
  const [title, setTitle] = useState(memory?.title ?? '')
  const [date, setDate] = useState(memory?.date ?? format(new Date(), 'yyyy-MM-dd'))
  const [notes, setNotes] = useState(memory?.notes ?? '')
  const [images, setImages] = useState<string[]>(memory?.images ?? [])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files) return
    const remaining = 5 - images.length
    const toProcess = Array.from(files).slice(0, remaining)
    setUploading(true)
    const encoded = await Promise.all(toProcess.map(toBase64))
    setImages((prev) => [...prev, ...encoded])
    setUploading(false)
  }

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    if (memory) {
      updateMemory(memory.id, title.trim(), date, notes.trim(), images)
    } else {
      addMemory(folderId, title.trim(), date, notes.trim(), images)
    }
    onClose()
  }

  return (
    <Modal title={memory ? 'Edit memory' : 'Log a memory'} onClose={onClose} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
            <input
              type="text"
              className="notion-input"
              placeholder="e.g. Cafe hopping"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
            <input
              type="date"
              className="notion-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
          <textarea
            className="notion-input resize-none"
            rows={4}
            placeholder="What happened? What do you want to remember?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Photos <span className="text-gray-400 font-normal">({images.length}/5)</span>
          </label>

          {images.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-2">
              {images.map((src, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden group">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5
                               opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
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
                className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300
                           rounded-lg text-xs text-gray-500 hover:border-gray-400 hover:text-gray-700
                           transition-colors disabled:opacity-50 w-full justify-center"
              >
                <ImagePlus size={14} />
                {uploading ? 'Adding...' : 'Add photos'}
              </button>
            </>
          )}
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <button type="button" onClick={onClose} className="notion-btn-secondary">
            Cancel
          </button>
          <button type="submit" className="notion-btn-primary">
            {memory ? 'Save changes' : 'Log memory'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
