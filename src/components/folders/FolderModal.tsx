import { useState, useRef } from 'react'
import { ImagePlus, X } from 'lucide-react'
import Modal from '../ui/Modal'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { uploadImage } from '../../lib/storage'
import { FOLDER_COLORS, COLOR_GRADIENTS, type Folder, type FolderColor } from '../../types'

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
    if (folder) {
      await updateFolder(folder.id, name.trim(), color, coverImageUrl)
    } else {
      await addFolder(name.trim(), color, coverImageUrl)
    }
    setSaving(false)
    onClose()
  }

  return (
    <Modal title={folder ? 'Edit folder' : 'New folder'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-5 space-y-4">

        {/* Cover image preview + upload */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Cover image</label>
          <div
            className={`relative w-full h-28 rounded-xl overflow-hidden cursor-pointer group
              bg-gradient-to-br ${COLOR_GRADIENTS[color]}`}
            onClick={() => !uploading && fileRef.current?.click()}
          >
            {coverImageUrl && (
              <img src={coverImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <ImagePlus size={13} />
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
              className="mt-1 text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"
            >
              <X size={11} /> Remove cover
            </button>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Folder name</label>
          <input
            type="text"
            className="notion-input"
            placeholder="e.g. Weekend Crew"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Color</label>
          <div className="flex flex-wrap gap-2">
            {FOLDER_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full transition-all bg-gradient-to-br ${COLOR_GRADIENTS[c]}
                  ${color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                title={c}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <button type="button" onClick={onClose} disabled={saving} className="notion-btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || uploading}
            className="notion-btn-primary disabled:opacity-60"
          >
            {saving ? 'Saving…' : folder ? 'Save changes' : 'Create folder'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
