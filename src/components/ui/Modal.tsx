import { useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  title: string
  onClose: () => void
  children: React.ReactNode
  maxWidth?: string
}

export default function Modal({ title, onClose, children, maxWidth = 'max-w-md' }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className={`bg-[#FFFFF0] border-3 border-black w-full ${maxWidth} max-h-[90vh] flex flex-col`}
        style={{ border: '3px solid #000', boxShadow: '6px 6px 0px #000' }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b-2 border-black bg-black">
          <h2 className="text-sm font-bold text-[#FFE500] uppercase tracking-wider">{title}</h2>
          <button
            onClick={onClose}
            className="p-0.5 text-[#FFE500] hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}
