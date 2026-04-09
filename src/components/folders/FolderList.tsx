import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { COLOR_SOLID } from '../../types'
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
  const solid = COLOR_SOLID[folder.color]

  return (
    <div
      onClick={onSelect}
      className="relative flex-shrink-0 w-40 cursor-pointer select-none border-2 border-black group/card"
      style={{
        boxShadow: isSelected ? '6px 6px 0px #000' : '4px 4px 0px #000',
        transform: isSelected ? 'translate(-2px, -2px)' : undefined,
      }}
    >
      {/* Cover area */}
      <div
        className="relative h-24 overflow-hidden border-b-2 border-black"
        style={{ backgroundColor: solid.bg }}
      >
        {folder.coverImage && (
          <img
            src={folder.coverImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Days counter overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-2 pb-2 pt-5
          bg-gradient-to-t from-black/70 to-transparent">
          {days !== null ? (
            <>
              <p className="text-white font-bold text-2xl leading-none">{days}</p>
              <p className="text-white/80 text-[9px] mt-0.5 font-medium">days since</p>
            </>
          ) : (
            <p className="text-white/80 text-[9px] font-medium">No entries yet</p>
          )}
        </div>

        {/* Hover actions */}
        <div
          className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onEdit}
            className="w-6 h-6 border-2 border-black bg-[#FFE500] text-black flex items-center justify-center"
            style={{ boxShadow: '2px 2px 0px #000' }}
          >
            <Pencil size={10} />
          </button>
          <button
            onClick={onDelete}
            className="w-6 h-6 border-2 border-black bg-black text-white flex items-center justify-center"
            style={{ boxShadow: '2px 2px 0px #000' }}
          >
            <Trash2 size={10} />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#FFFFE0] px-2 py-2">
        <p className="text-xs font-bold text-black truncate">{folder.name}</p>
        {user && (
          <div className="mt-1.5 w-5 h-5 bg-black text-[#FFE500] text-[9px] font-bold
            flex items-center justify-center flex-shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  )
}

export default function FolderList() {
  const { folders, memories, selectedFolderId, selectFolder, deleteFolder } = useAppStore()
  const [showCreate, setShowCreate] = useState(false)
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null)
  const [deletingFolder, setDeletingFolder] = useState<Folder | null>(null)

  return (
    <div className="px-3 pt-3 pb-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[9px] font-bold text-black uppercase tracking-widest">Folders</h2>
      </div>

      {/* Horizontal card scroll */}
      <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-thin">
        {folders.map((f) => (
          <FolderCard
            key={f.id}
            folder={f}
            isSelected={selectedFolderId === f.id}
            memories={memories}
            onSelect={() => selectFolder(f.id)}
            onEdit={() => setEditingFolder(f)}
            onDelete={() => setDeletingFolder(f)}
          />
        ))}

        {/* Add folder card */}
        <button
          onClick={() => setShowCreate(true)}
          className="flex-shrink-0 w-40 h-[7.75rem] border-2 border-dashed border-black
            hover:bg-[#FFFFE0] transition-none flex flex-col items-center
            justify-center gap-2 text-black"
          style={{ boxShadow: '4px 4px 0px #000' }}
        >
          <div className="w-7 h-7 border-2 border-black flex items-center justify-center">
            <Plus size={14} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">New folder</span>
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
