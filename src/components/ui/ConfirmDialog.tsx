import Modal from './Modal'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onClose: () => void
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onClose}>
      <div className="p-5 space-y-4">
        <p className="text-sm text-gray-600">{message}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="notion-btn-secondary">
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose() }}
            className="notion-btn-danger"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
