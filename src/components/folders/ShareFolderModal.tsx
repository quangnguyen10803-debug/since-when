import { useState, useEffect } from 'react'
import { Link2, Copy, Check, X, LogOut, Users } from 'lucide-react'
import Modal from '../ui/Modal'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import type { Folder, FolderMember, FolderInvite } from '../../types'

interface ShareFolderModalProps {
  folder: Folder
  onClose: () => void
}

export default function ShareFolderModal({ folder, onClose }: ShareFolderModalProps) {
  const { loadMembers, createInvite, removeMember, leaveFolder } = useAppStore()
  const user = useAuthStore((s) => s.user)

  const [members, setMembers] = useState<FolderMember[]>([])
  const [invite, setInvite] = useState<FolderInvite | null>(null)
  const [copied, setCopied] = useState(false)
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [generatingLink, setGeneratingLink] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const m = await loadMembers(folder.id)
      if (!cancelled) {
        setMembers(m)
        setLoadingMembers(false)
      }
    })()
    return () => { cancelled = true }
  }, [folder.id])

  const handleGenerateLink = async () => {
    setGeneratingLink(true)
    const inv = await createInvite(folder.id)
    if (inv) setInvite(inv)
    setGeneratingLink(false)
  }

  const handleCopy = async () => {
    if (!invite) return
    const url = `${window.location.origin}/invite/${invite.token}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRemove = async (member: FolderMember) => {
    await removeMember(member.id, folder.id)
    setMembers((prev) => prev.filter((m) => m.id !== member.id))
  }

  const handleLeave = async () => {
    await leaveFolder(folder.id)
    onClose()
  }

  const isOwner = folder.isOwner !== false

  return (
    <Modal title={`Share "${folder.name}"`} onClose={onClose}>
      <div className="p-4 space-y-4">
        {/* Members section */}
        <div>
          <h3 className="text-[10px] font-bold text-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Users size={11} />
            Members
          </h3>
          {loadingMembers ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-gray-900 animate-spin" />
            </div>
          ) : (
            <div className="space-y-1.5">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between px-2.5 py-2 border-2 border-black bg-[#FFFFE0]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 bg-black text-[#FFE500] text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {member.userName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-black truncate">
                      {member.userName}
                      {member.userId === user?.id && (
                        <span className="text-gray-500 ml-1">(you)</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border-2 border-black
                      ${member.role === 'owner' ? 'bg-[#FFE500] text-black' : 'bg-white text-black'}`}>
                      {member.role}
                    </span>
                    {isOwner && member.role !== 'owner' && (
                      <button
                        onClick={() => handleRemove(member)}
                        className="p-0.5 text-black hover:text-red-600 transition-colors"
                        title="Remove member"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invite link section — owner only */}
        {isOwner && (
          <div>
            <h3 className="text-[10px] font-bold text-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Link2 size={11} />
              Invite Link
            </h3>

            {invite ? (
              <div className="space-y-2">
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/invite/${invite.token}`}
                    className="brutal-input flex-1 text-[11px] bg-white"
                  />
                  <button
                    onClick={handleCopy}
                    className="brutal-btn-primary px-3 flex items-center gap-1"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 font-medium">
                  Expires in 7 days. Anyone with this link can join.
                </p>
              </div>
            ) : (
              <button
                onClick={handleGenerateLink}
                disabled={generatingLink}
                className="brutal-btn-primary flex items-center gap-1.5 text-xs"
              >
                <Link2 size={12} />
                {generatingLink ? 'Generating...' : 'Generate invite link'}
              </button>
            )}
          </div>
        )}

        {/* Leave folder — collaborator only */}
        {!isOwner && (
          <button
            onClick={handleLeave}
            className="flex items-center gap-1.5 text-xs font-bold text-black border-2 border-black px-3 py-2
              hover:bg-black hover:text-white transition-none"
          >
            <LogOut size={12} />
            Leave folder
          </button>
        )}
      </div>
    </Modal>
  )
}
