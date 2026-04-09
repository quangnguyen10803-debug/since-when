import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import { useAuthStore } from '../store/authStore'

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_TOKEN: "This invite link isn't valid.",
  EXPIRED: 'This invite link has expired. Ask the folder owner for a new one.',
  MAX_USES_REACHED: 'This invite link is no longer valid.',
  ALREADY_MEMBER: "You're already in this folder!",
}

export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { acceptInvite, loadData, selectFolder } = useAppStore()
  const user = useAuthStore((s) => s.user)

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [folderName, setFolderName] = useState('')
  const [folderId, setFolderId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!token || !user) return

    let cancelled = false
    ;(async () => {
      const result = await acceptInvite(token)
      if (cancelled) return

      if (result.success) {
        setFolderName(result.folderName ?? '')
        setFolderId(result.folderId ?? null)
        setStatus('success')
        // Reload data so the new folder appears
        await loadData(user.id)
        if (result.folderId) selectFolder(result.folderId)
      } else {
        setErrorMsg(ERROR_MESSAGES[result.error ?? ''] ?? 'Something went wrong. Please try again.')
        setFolderId(result.folderId ?? null)
        setStatus('error')
      }
    })()

    return () => { cancelled = true }
  }, [token, user?.id])

  const goHome = () => navigate('/', { replace: true })

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFFF0] px-4">
      <div className="w-full max-w-sm text-center">
        {status === 'loading' && (
          <div className="bg-black px-5 py-6 border-2 border-black" style={{ boxShadow: '6px 6px 0px #FFE500' }}>
            <div className="w-5 h-5 mx-auto rounded-full border-2 border-gray-600 border-t-[#FFE500] animate-spin" />
            <p className="mt-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Accepting invite...</p>
          </div>
        )}

        {status === 'success' && (
          <>
            <div className="mb-6 bg-black px-5 py-5 border-2 border-black" style={{ boxShadow: '6px 6px 0px #FFE500' }}>
              <p className="text-lg font-bold text-[#FFE500] uppercase tracking-tight">You're in!</p>
              <p className="mt-1 text-xs font-medium text-gray-300">
                You've joined <span className="font-bold text-[#FFE500]">{folderName}</span>
              </p>
            </div>
            <button onClick={goHome} className="brutal-btn-primary">
              Go to folder →
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-6 bg-black px-5 py-5 border-2 border-black" style={{ boxShadow: '6px 6px 0px #FFE500' }}>
              <p className="text-sm font-bold text-white">{errorMsg}</p>
            </div>
            <button onClick={goHome} className="brutal-btn-primary">
              {folderId ? 'Go to folder →' : 'Go home →'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
