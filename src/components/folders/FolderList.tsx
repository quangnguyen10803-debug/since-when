import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { COLOR_GRADIENTS } from '../../types'
import type { Memory, Folder } from '../../types'
import FolderModal from './FolderModal'
import ConfirmDialog from '../ui/ConfirmDialog'
import { differenceInDays, parseISO } from 'date-fns'

function useDaysSince(folderId: string, memories: Memory[]) {
  return useMemo(() => {
    const folderMems = memories.filter((m) => m.folderId === folderId)
    if (folderMems.length === 0) return null
    const latest = folderMems.reduce((best: string, m: Memory) => (m.date > best ? m.date : best), folderMems[0].date)
    return differenceInDays(new Date(), parseISO(latest))
  }, [folderId, memories])
}

function FolderCard({
  folder,
  isSelected,
  memories,
  onSelect,
  onEdit,
  onDelete,
}: {
  folder: Folder
  isSelected: boolean
  memories: Memory[]
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const days = useDaysSince(folder.id, memories)
  const user = useAuthStore((s) => s.user)

  return (
    <div
      onClick={onSelect}
      className={`relative flex-shrink-0 w-44 rounded-2xl overflow-hidden cursor-pointer
        border-2 transition-all select-none
        ${isSelected ? 'border-gray-900 shadow-md' : 'border-transparent hover:border-gray-200 hover:shadow-sm'}`}
    >
      {/* Cover / gradient */}
      <div className={`relative h-28 bg-gradient-to-br ${COLOR_GRADIENTS[folder.color]}`}>
        {folder.coverImage && (
          <img
            src={folder.coverImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Days counter overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5 pt-6
          bg-gradient-to-t from-black/60 to-transparent">
          {days !== null ? (
            <>
              <p className="text-white font-bold text-2xl leading-none">{days}</p>
              <p className="text-white/75 text-[10px] mt-0.5 leading-tight">days since last meetup</p>
            </>
          ) : (
            <p className="text-white/75 text-[10px]">No meetups yet</p>
          )}
        </div>

        {/* Hover actions */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 hover:opacity-100
          group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <ActionBtn icon={<Pencil size={11} />} onClick={onEdit} />
          <ActionBtn icon={<Trash2 size={11} />} onClick={onDelete} danger />
        </div>

        {/* Always visible action buttons on hover of card */}
        <HoverActions onEdit={onEdit} onDelete={onDelete} />
      </div>

      {/* Footer */}
      <div className="bg-white px-3 py-2.5">
        <p className="text-sm font-semibold text-gray-900 truncate">{folder.name}</p>
        <div className="flex items-center gap-1 mt-1.5">
          {/* Current user avatar */}
          {user && (
            <div className="w-6 h-6 rounded-full bg-gray-800 text-white text-[10px] font-semibold
              flex items-center justify-center ring-2 ring-white">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function HoverActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div
      className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onEdit}
        className="w-6 h-6 rounded-md bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
      >
        <Pencil size={11} />
      </button>
      <button
        onClick={onDelete}
        className="w-6 h-6 rounded-md bg-black/40 hover:bg-red-500/80 text-white flex items-center justify-center transition-colors"
      >
        <Trash2 size={11} />
      </button>
    </div>
  )
}

function ActionBtn({ icon, onClick, danger }: { icon: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-6 h-6 rounded-md flex items-center justify-center text-white transition-colors
        ${danger ? 'bg-black/40 hover:bg-red-500/80' : 'bg-black/40 hover:bg-black/60'}`}
    >
      {icon}
    </button>
  )
}

export default function FolderList() {
  const { folders, memories, selectedFolderId, selectFolder, deleteFolder } = useAppStore()
  const [showCreate, setShowCreate] = useState(false)
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null)
  const [deletingFolder, setDeletingFolder] = useState<Folder | null>(null)

  return (
    <div className="px-4 pt-4 pb-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Folders</h2>
      </div>

      {/* Horizontal card scroll */}
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
        {folders.map((f) => (
          <div key={f.id} className="group/card">
            <FolderCard
              folder={f}
              isSelected={selectedFolderId === f.id}
              memories={memories}
              onSelect={() => selectFolder(f.id)}
              onEdit={() => setEditingFolder(f)}
              onDelete={() => setDeletingFolder(f)}
            />
          </div>
        ))}

        {/* Add folder card */}
        <button
          onClick={() => setShowCreate(true)}
          className="flex-shrink-0 w-44 h-[11.5rem] rounded-2xl border-2 border-dashed border-gray-200
            hover:border-gray-300 hover:bg-gray-50 transition-colors flex flex-col items-center
            justify-center gap-2 text-gray-400 hover:text-gray-600"
        >
          <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center">
            <Plus size={16} />
          </div>
          <span className="text-xs font-medium">New folder</span>
        </button>
      </div>

      {showCreate && <FolderModal onClose={() => setShowCreate(false)} />}
      {editingFolder && (
        <FolderModal folder={editingFolder} onClose={() => setEditingFolder(null)} />
      )}
      {deletingFolder && (
        <ConfirmDialog
          title="Delete folder"
          message={`Delete "${deletingFolder.name}"? All memories inside will be permanently deleted.`}
          onConfirm={() => deleteFolder(deletingFolder.id)}
          onClose={() => setDeletingFolder(null)}
        />
      )}
    </div>
  )
}
