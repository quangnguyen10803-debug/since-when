import { useState, useRef } from 'react'
import { ImagePlus, X } from 'lucide-react'
import Modal from '../ui/Modal'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { uploadImage } from '../../lib/storage'
import { FOLDER_COLORS, COLOR_SOLID, type Folder, type FolderColor } from '../../types'

interface FolderModalProps {
  folder?: Folder
  onClose: () => void
}

export default function FolderModal({ folder, onClose }: FolderModalProps) {
  const { addFolder, updateFolder } = useAppStore()
  const user = useAuthStore((s) => s.user)

  const [name, setName] = useState(folder?.name ?? '')
  const [color, setColor] = useState<FolderColor>(folder?.color ?? 'blue')
  const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>(folder?.coverImage)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleCoverFile = async (files: FileList | null) => {
    if (!files?.[0] || !user) return
    setUploading(true)
    const url = await uploadImage(files[0], user.id)
    if (url) setCoverImageUrl(url)
    setUploading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      if (folder) {
        await updateFolder(folder.id, name.trim(), color, coverImageUrl)
      } else {
        await addFolder(name.trim(), color, coverImageUrl)
      }
      onClose()
    } catch (err) {
      console.error('Failed to save folder:', err)
    } finally {
      setSaving(false)
    }
  }

  const solid = COLOR_SOLID[color]

  return (
    <Modal title={folder ? 'Edit folder' : 'New folder'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-4 space-y-4">

        {/* Cover image preview + upload */}
        <div>
          <label className="block text-[10px] font-bold text-black uppercase tracking-wider mb-1.5">
            Cover image
          </label>
          <div
            className="relative w-full h-24 overflow-hidden cursor-pointer group border-2 border-black"
            style={{ backgroundColor: solid.bg, boxShadow: '3px 3px 0px #000' }}
            onClick={() => !uploading && fileRef.current?.click()}
          >
            {coverImageUrl && (
              <img src={coverImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-[#FFE500] text-black text-[10px] font-bold px-3 py-1.5 border-2 border-black flex items-center gap-1.5">
                <ImagePlus size={11} />
                {uploading ? 'Uploading…' : coverImageUrl ? 'Change cover' : 'Add cover'}
              </span>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleCoverFile(e.target.files)}
          />
          {coverImageUrl && (
            <button
              type="button"
              onClick={() => setCoverImageUrl(undefined)}
              className="mt-1 text-[10px] font-bold text-black hover:text-red-600 flex items-center gap-1"
            >
              <X size={10} /> Remove cover
            </button>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-bold text-black uppercase tracking-wider mb-1.5">
            Folder name
          </label>
          <input
            type="text"
            className="brutal-input"
            placeholder="e.g. Weekend Crew"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-black uppercase tracking-wider mb-1.5">
            Color
          </label>
          <div className="flex flex-wrap gap-2">
            {FOLDER_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 border-2 border-black transition-none
                  ${color === c ? 'outline outline-2 outline-offset-2 outline-black' : 'hover:opacity-80'}`}
                style={{ backgroundColor: COLOR_SOLID[c].bg, boxShadow: color === c ? '2px 2px 0px #000' : undefined }}
                title={c}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <button type="button" onClick={onClose} disabled={saving} className="brutal-btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || uploading}
            className="brutal-btn-primary"
          >
            {saving ? 'Saving…' : folder ? 'Save changes' : 'Create folder'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
