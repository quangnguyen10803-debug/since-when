import { useState } from 'react'
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { COLOR_MAP } from '../../types'
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
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
      {images.length > 1 && (
        <div className="absolute bottom-6 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setIdx(i) }}
              className={`w-2 h-2 rounded-full transition-colors ${i === idx ? 'bg-white' : 'bg-white/40'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function MemoryList() {
  const { folders, memories, selectedFolderId, deleteMemory } = useAppStore()

  // inline state: null = none open, 'create' = new form at top, string = editing that memory id
  const [inlineMode, setInlineMode] = useState<'create' | string | null>(null)
  const [deletingMemory, setDeletingMemory] = useState<Memory | null>(null)
  const [lightbox, setLightbox] = useState<{ images: string[]; idx: number } | null>(null)

  const folder = folders.find((f) => f.id === selectedFolderId)
  const folderMemories = memories
    .filter((m) => m.folderId === selectedFolderId)
    .sort((a, b) => (b.date > a.date ? 1 : -1))

  if (!folder) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <BookOpen size={28} className="text-gray-200 mb-2" />
        <p className="text-sm text-gray-400">Select a folder to view memories</p>
      </div>
    )
  }

  const colors = COLOR_MAP[folder.color]

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-sm ${colors.dot}`} />
          <h2 className="text-sm font-semibold text-gray-900">{folder.name}</h2>
          <span className="text-xs text-gray-400">{folderMemories.length}</span>
        </div>
        <button
          onClick={() => setInlineMode('create')}
          disabled={inlineMode !== null}
          className="flex items-center gap-1 text-xs bg-gray-900 text-white px-2.5 py-1.5
                     rounded-md hover:bg-gray-700 transition-colors disabled:opacity-40"
        >
          <Plus size={13} />
          Log date
        </button>
      </div>

      {/* List */}
      <div className="px-4 pb-8 space-y-3">
        {/* Inline create form */}
        {inlineMode === 'create' && (
          <InlineMemoryForm
            folderId={folder.id}
            onDone={() => setInlineMode(null)}
          />
        )}

        {folderMemories.length === 0 && inlineMode !== 'create' ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-sm text-gray-400">No memories yet</p>
            <button
              onClick={() => setInlineMode('create')}
              className="mt-2 text-xs text-gray-500 underline hover:text-gray-800"
            >
              Log your first date
            </button>
          </div>
        ) : (
          folderMemories.map((memory) =>
            inlineMode === memory.id ? (
              // Inline edit form replaces the card
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
                color={colors}
                isAnyInlineOpen={inlineMode !== null}
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

// ─── Memory card ────────────────────────────────────────────────────────────

interface MemoryCardProps {
  memory: Memory
  color: { dot: string; bg: string; text: string }
  isAnyInlineOpen: boolean
  onEdit: () => void
  onDelete: () => void
  onImageClick: (images: string[], idx: number) => void
}

function MemoryCard({ memory, color, isAnyInlineOpen, onEdit, onDelete, onImageClick }: MemoryCardProps) {
  return (
    <div className="group border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors bg-white">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{memory.title}</h3>
          <span className={`text-[11px] px-2 py-0.5 rounded-full ${color.bg} ${color.text} font-medium flex-shrink-0`}>
            {formatMemoryDate(memory.date)}
          </span>
        </div>
        <div className={`flex gap-0.5 flex-shrink-0 transition-opacity
          ${isAnyInlineOpen ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'}`}
        >
          <button
            onClick={onEdit}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {memory.images.length > 0 && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {memory.images.map((src, i) => (
            <button
              key={i}
              onClick={() => onImageClick(memory.images, i)}
              className="w-20 h-20 rounded-lg overflow-hidden hover:opacity-90 transition-opacity flex-shrink-0"
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {memory.notes && (
        <p className="mt-3 text-sm text-gray-600 leading-relaxed line-clamp-3">{memory.notes}</p>
      )}
    </div>
  )
}
