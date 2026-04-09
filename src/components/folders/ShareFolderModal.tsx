import { useState, useEffect } from 'react'
import { Copy, Check, X, LogOut, Users, Link2 } from 'lucide-react'
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
  const [loadingInvite, setLoadingInvite] = useState(false)

  const isOwner = folder.isOwner !== false
  const inviteUrl = invite ? `${window.location.origin}/invite/${invite.token}` : ''

  // Load members on open
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

  // Owners: auto-fetch existing invite (get_or_create returns existing one if present)
  useEffect(() => {
    if (!isOwner) return
    let cancelled = false
    ;(async () => {
      setLoadingInvite(true)
      const inv = await createInvite(folder.id)
      if (!cancelled) {
        if (inv) setInvite(inv)
        setLoadingInvite(false)
      }
    })()
    return () => { cancelled = true }
  }, [folder.id, isOwner])

  const handleCopy = async () => {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
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

  return (
    <Modal title={`Share "${folder.name}"`} onClose={onClose}>
      <div className="p-4 space-y-4">

        {/* Members */}
        <div>
          <h3 className="text-[10px] font-bold text-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Users size={11} />
            Members
          </h3>
          {loadingMembers ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-900 animate-spin" />
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
                        <span className="text-gray-500 font-normal ml-1">(you)</span>
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

        {/* Invite link — owners only */}
        {isOwner && (
          <div>
            <h3 className="text-[10px] font-bold text-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Link2 size={11} />
              Invite Link
            </h3>

            {loadingInvite ? (
              <div className="flex items-center gap-2 py-1">
                <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-900 animate-spin" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Loading link…</span>
              </div>
            ) : invite ? (
              <div className="space-y-2">
                {/* Read-only URL box + copy button */}
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={inviteUrl}
                    className="brutal-input flex-1 text-[11px] bg-white"
                    onFocus={(e) => e.target.select()}
                  />
                  <button
                    onClick={handleCopy}
                    className="brutal-btn-primary px-3 flex items-center gap-1.5 flex-shrink-0"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 font-medium">
                  Anyone with this link can join. Expires in 7 days.
                </p>
              </div>
            ) : (
              // Fallback — shouldn't normally show, but in case RPC fails
              <p className="text-[10px] font-bold text-gray-500">Could not load invite link. Try closing and reopening.</p>
            )}
          </div>
        )}

        {/* Leave folder — collaborators only */}
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
