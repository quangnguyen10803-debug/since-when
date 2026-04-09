import { useState } from 'react'
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { COLOR_MAP, COLOR_SOLID } from '../../types'
import type { FolderColor } from '../../types'
import InlineMemoryForm from './InlineMemoryForm'
import ConfirmDialog from '../ui/ConfirmDialog'
import type { Memory } from '../../types'
import { format, isToday, isYesterday, parseISO } from 'date-fns'

function formatMemoryDate(dateStr: string) {
  const d = parseISO(dateStr)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'dd MMM yyyy')
}

// Inline image lightbox
function ImageLightbox({
  images,
  startIndex,
  onClose,
}: {
  images: string[]
  startIndex: number
  onClose: () => void
}) {
  const [idx, setIdx] = useState(startIndex)
  return (
    <div
      className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <img
        src={images[idx]}
        alt=""
        className="max-w-[90vw] max-h-[90vh] object-contain"
        style={{ border: '3px solid #FFE500', boxShadow: '6px 6px 0px #FFE500' }}
        onClick={(e) => e.stopPropagation()}
      />
      {images.length > 1 && (
        <div className="absolute bottom-6 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setIdx(i) }}
              className={`w-3 h-3 border-2 border-white transition-none ${i === idx ? 'bg-[#FFE500]' : 'bg-white/40'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function MemoryList() {
  const { folders, memories, selectedFolderId, deleteMemory } = useAppStore()
  const currentUser = useAuthStore((s) => s.user)

  const [inlineMode, setInlineMode] = useState<'create' | string | null>(null)
  const [deletingMemory, setDeletingMemory] = useState<Memory | null>(null)
  const [lightbox, setLightbox] = useState<{ images: string[]; idx: number } | null>(null)

  const folder = folders.find((f) => f.id === selectedFolderId)
  const folderMemories = memories
    .filter((m) => m.folderId === selectedFolderId)
    .sort((a, b) => (b.date > a.date ? 1 : -1))

  if (!folder) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center px-6">
        <BookOpen size={28} className="text-gray-300 mb-2" />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select a folder to view memories</p>
      </div>
    )
  }

  const dotClass = COLOR_MAP[folder.color].dot
  const solid = COLOR_SOLID[folder.color]

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b-2 border-black bg-[#FFFFE0]">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 border-2 border-black ${dotClass}`} />
          <h2 className="text-xs font-bold text-black uppercase tracking-wider">{folder.name}</h2>
          <span className="text-[10px] font-bold text-gray-500 border-2 border-black px-1">{folderMemories.length}</span>
        </div>
        <button
          onClick={() => setInlineMode('create')}
          disabled={inlineMode !== null}
          className="brutal-btn-primary flex items-center gap-1 px-2.5 py-1.5 text-xs"
        >
          <Plus size={12} />
          Log date
        </button>
      </div>

      {/* List */}
      <div className="px-3 pb-8 pt-3 space-y-2">
        {/* Inline create form */}
        {inlineMode === 'create' && (
          <InlineMemoryForm
            folderId={folder.id}
            onDone={() => setInlineMode(null)}
          />
        )}

        {folderMemories.length === 0 && inlineMode !== 'create' ? (
          <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-black">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">No memories yet</p>
            <button
              onClick={() => setInlineMode('create')}
              className="mt-2 text-xs font-bold text-black underline hover:text-gray-600"
            >
              Log your first date
            </button>
          </div>
        ) : (
          folderMemories.map((memory) =>
            inlineMode === memory.id ? (
              <InlineMemoryForm
                key={memory.id}
                folderId={folder.id}
                memory={memory}
                onDone={() => setInlineMode(null)}
              />
            ) : (
              <MemoryCard
                key={memory.id}
                memory={memory}
                folderColor={folder.color}
                folderSolid={solid}
                isAnyInlineOpen={inlineMode !== null}
                isOwnMemory={!memory.userId || memory.userId === currentUser?.id}
                isSharedFolder={folder.isShared || false}
                onEdit={() => setInlineMode(memory.id)}
                onDelete={() => setDeletingMemory(memory)}
                onImageClick={(images, idx) => setLightbox({ images, idx })}
              />
            )
          )
        )}
      </div>

      {deletingMemory && (
        <ConfirmDialog
          title="Delete memory"
          message={`Delete "${deletingMemory.title}"? This cannot be undone.`}
          onConfirm={() => deleteMemory(deletingMemory.id)}
          onClose={() => setDeletingMemory(null)}
        />
      )}
      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          startIndex={lightbox.idx}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}

// ─── Memory card ─────────────────────────────────────────────────────────────

interface MemoryCardProps {
  memory: Memory
  folderColor: FolderColor
  folderSolid: { bg: string; text: string }
  isAnyInlineOpen: boolean
  isOwnMemory: boolean
  isSharedFolder: boolean
  onEdit: () => void
  onDelete: () => void
  onImageClick: (images: string[], idx: number) => void
}

function MemoryCard({ memory, folderColor, folderSolid, isAnyInlineOpen, isOwnMemory, isSharedFolder, onEdit, onDelete, onImageClick }: MemoryCardProps) {
  return (
    <div
      className="group border-2 border-black p-3 bg-[#FFFFE0]"
      style={{ boxShadow: '3px 3px 0px #000' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
          <h3 className="text-sm font-bold text-black truncate">{memory.title}</h3>
          <span
            className="text-[10px] px-2 py-0.5 border-2 border-black font-bold flex-shrink-0"
            style={{ backgroundColor: folderSolid.bg, color: folderSolid.text }}
          >
            {formatMemoryDate(memory.date)}
          </span>
          {/* Creator badge for shared folders */}
          {isSharedFolder && memory.createdByName && (
            <span className="text-[9px] px-1.5 py-0.5 border-2 border-black bg-white font-bold text-gray-600 flex-shrink-0 flex items-center gap-1">
              <span className="w-3.5 h-3.5 bg-black text-[#FFE500] text-[7px] font-bold flex items-center justify-center flex-shrink-0">
                {memory.createdByName.charAt(0).toUpperCase()}
              </span>
              {memory.createdByName}
            </span>
          )}
        </div>
        {/* Only show edit/delete for own memories */}
        {isOwnMemory && (
          <div className={`flex gap-0.5 flex-shrink-0 transition-opacity
            ${isAnyInlineOpen ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'}`}
          >
            <button
              onClick={onEdit}
              className="p-1.5 border-2 border-black text-black hover:bg-[#FFE500] transition-none"
            >
              <Pencil size={11} />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 border-2 border-black text-black hover:bg-black hover:text-white transition-none"
            >
              <Trash2 size={11} />
            </button>
          </div>
        )}
      </div>

      {memory.images.length > 0 && (
        <div className="flex gap-2 mt-2 flex-wrap">
          {memory.images.map((src, i) => (
            <button
              key={i}
              onClick={() => onImageClick(memory.images, i)}
              className="w-20 h-20 overflow-hidden hover:opacity-90 transition-opacity flex-shrink-0 border-2 border-black"
              style={{ boxShadow: '2px 2px 0px #000' }}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {memory.notes && (
        <p className="mt-2 text-xs text-gray-700 leading-relaxed border-l-2 border-black pl-2 whitespace-pre-wrap">
          {memory.notes}
        </p>
      )}
    </div>
  )
}
