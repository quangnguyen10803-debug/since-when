import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Folder, Memory, FolderColor, FolderMember, FolderInvite } from '../types'

interface AppState {
  folders: Folder[]
  memories: Memory[]
  selectedFolderId: string | null

  loadData: (userId: string) => Promise<void>
  clear: () => void
  selectFolder: (id: string | null) => void

  addFolder: (name: string, color: FolderColor, coverImageUrl?: string) => Promise<void>
  updateFolder: (id: string, name: string, color: FolderColor, coverImageUrl?: string) => Promise<void>
  deleteFolder: (id: string) => Promise<void>

  addMemory: (folderId: string, title: string, date: string, notes: string, imageUrls: string[]) => Promise<void>
  updateMemory: (id: string, title: string, date: string, notes: string, imageUrls: string[]) => Promise<void>
  deleteMemory: (id: string) => Promise<void>

  // Sharing
  loadMembers: (folderId: string) => Promise<FolderMember[]>
  createInvite: (folderId: string) => Promise<FolderInvite | null>
  removeMember: (memberId: string, folderId: string) => Promise<void>
  leaveFolder: (folderId: string) => Promise<void>
  acceptInvite: (token: string) => Promise<{ success: boolean; folderId?: string; folderName?: string; error?: string }>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapFolder(row: any, role?: string): Folder {
  return {
    id: row.id,
    name: row.name,
    color: row.color as FolderColor,
    coverImage: row.cover_image_url ?? undefined,
    createdAt: row.created_at,
    isOwner: role === 'owner',
    isShared: role === 'collaborator',
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMemory(row: any): Memory {
  return {
    id: row.id,
    folderId: row.folder_id,
    title: row.title,
    date: row.date,
    notes: row.notes ?? '',
    images: row.image_urls ?? [],
    createdAt: row.created_at,
    createdByName: row.created_by_name ?? undefined,
    userId: row.user_id ?? undefined,
  }
}

export const useAppStore = create<AppState>((set) => ({
  folders: [],
  memories: [],
  selectedFolderId: null,

  clear: () => set({ folders: [], memories: [], selectedFolderId: null }),

  selectFolder: (id) => set({ selectedFolderId: id }),

  loadData: async (userId) => {
    try {
      // First get all folder memberships for this user
      const { data: memberRows } = await supabase
        .from('folder_members')
        .select('folder_id, role')
        .eq('user_id', userId)

      const folderIds = (memberRows ?? []).map((r) => r.folder_id)
      const roleMap: Record<string, string> = {}
      for (const r of memberRows ?? []) {
        roleMap[r.folder_id] = r.role
      }

      if (folderIds.length === 0) {
        set({ folders: [], memories: [], selectedFolderId: null })
        return
      }

      const [foldersRes, memoriesRes] = await Promise.all([
        supabase.from('folders').select('*').in('id', folderIds).order('created_at'),
        supabase.from('memories').select('*').in('folder_id', folderIds).order('created_at'),
      ])

      const folders = (foldersRes.data ?? []).map((row) => mapFolder(row, roleMap[row.id]))
      const memories = (memoriesRes.data ?? []).map(mapMemory)
      set((s) => ({
        folders,
        memories,
        selectedFolderId: s.selectedFolderId && folderIds.includes(s.selectedFolderId)
          ? s.selectedFolderId
          : folders[0]?.id ?? null,
      }))
    } catch (err) {
      console.error('Failed to load data:', err)
    }
  },

  addFolder: async (name, color, coverImageUrl) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) return

      const { data, error } = await supabase
        .from('folders')
        .insert({ user_id: user.id, name, color, cover_image_url: coverImageUrl ?? null })
        .select()
        .single()

      if (error) console.error('Failed to add folder:', error)
      if (data && !error) {
        // The trigger auto-creates the folder_members row with role='owner'
        const folder = mapFolder(data, 'owner')
        set((s) => ({ folders: [...s.folders, folder], selectedFolderId: folder.id }))
      }
    } catch (err) {
      console.error('Failed to add folder:', err)
    }
  },

  updateFolder: async (id, name, color, coverImageUrl) => {
    try {
      const { data, error } = await supabase
        .from('folders')
        .update({ name, color, cover_image_url: coverImageUrl ?? null })
        .eq('id', id)
        .select()
        .single()

      if (error) console.error('Failed to update folder:', error)
      if (data && !error) {
        set((s) => ({
          folders: s.folders.map((f) =>
            f.id === id ? { ...mapFolder(data, f.isOwner ? 'owner' : 'collaborator'), isOwner: f.isOwner, isShared: f.isShared } : f
          ),
        }))
      }
    } catch (err) {
      console.error('Failed to update folder:', err)
    }
  },

  deleteFolder: async (id) => {
    try {
      const { error } = await supabase.from('folders').delete().eq('id', id)
      if (error) console.error('Failed to delete folder:', error)
      if (!error) {
        set((s) => {
          const folders = s.folders.filter((f) => f.id !== id)
          const memories = s.memories.filter((m) => m.folderId !== id)
          const selectedFolderId =
            s.selectedFolderId === id ? (folders[0]?.id ?? null) : s.selectedFolderId
          return { folders, memories, selectedFolderId }
        })
      }
    } catch (err) {
      console.error('Failed to delete folder:', err)
    }
  },

  addMemory: async (folderId, title, date, notes, imageUrls) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) return

      // Get user name for created_by_name
      const userName = user.user_metadata?.name ?? user.email?.split('@')[0] ?? 'User'

      const { data, error } = await supabase
        .from('memories')
        .insert({ user_id: user.id, folder_id: folderId, title, date, notes, image_urls: imageUrls, created_by_name: userName })
        .select()
        .single()

      if (error) console.error('Failed to add memory:', error)
      if (data && !error) {
        set((s) => ({ memories: [...s.memories, mapMemory(data)] }))
      }
    } catch (err) {
      console.error('Failed to add memory:', err)
    }
  },

  updateMemory: async (id, title, date, notes, imageUrls) => {
    try {
      const { data, error } = await supabase
        .from('memories')
        .update({ title, date, notes, image_urls: imageUrls })
        .eq('id', id)
        .select()
        .single()

      if (error) console.error('Failed to update memory:', error)
      if (data && !error) {
        set((s) => ({
          memories: s.memories.map((m) => (m.id === id ? mapMemory(data) : m)),
        }))
      }
    } catch (err) {
      console.error('Failed to update memory:', err)
    }
  },

  deleteMemory: async (id) => {
    try {
      const { error } = await supabase.from('memories').delete().eq('id', id)
      if (error) console.error('Failed to delete memory:', error)
      if (!error) {
        set((s) => ({ memories: s.memories.filter((m) => m.id !== id) }))
      }
    } catch (err) {
      console.error('Failed to delete memory:', err)
    }
  },

  // ─── Sharing actions ──────────────────────────────────────────────────

  loadMembers: async (folderId) => {
    try {
      const { data, error } = await supabase.rpc('get_folder_members', { p_folder_id: folderId })

      if (error) {
        console.error('Failed to load members:', error)
        return []
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((r: any) => ({
        id: r.id,
        folderId: r.folder_id,
        userId: r.user_id,
        userName: r.user_name ?? 'Unknown',
        role: r.role as 'owner' | 'collaborator',
        createdAt: r.created_at,
      }))
    } catch (err) {
      console.error('Failed to load members:', err)
      return []
    }
  },

  createInvite: async (folderId) => {
    try {
      const { data, error } = await supabase.rpc('get_or_create_invite', { p_folder_id: folderId })

      if (error || data?.error) {
        console.error('Failed to create invite:', error ?? data?.error)
        return null
      }

      return {
        id: data.id,
        folderId: data.folder_id,
        token: data.token,
        expiresAt: data.expires_at,
        maxUses: data.max_uses,
        useCount: data.use_count,
        createdAt: data.created_at,
      }
    } catch (err) {
      console.error('Failed to create invite:', err)
      return null
    }
  },

  removeMember: async (memberId, folderId) => {
    try {
      const { error } = await supabase.from('folder_members').delete().eq('id', memberId)
      if (error) console.error('Failed to remove member:', error)
    } catch (err) {
      console.error('Failed to remove member:', err)
    }
  },

  leaveFolder: async (folderId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) return

      const { error } = await supabase
        .from('folder_members')
        .delete()
        .eq('folder_id', folderId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Failed to leave folder:', error)
        return
      }

      set((s) => {
        const folders = s.folders.filter((f) => f.id !== folderId)
        const memories = s.memories.filter((m) => m.folderId !== folderId)
        const selectedFolderId =
          s.selectedFolderId === folderId ? (folders[0]?.id ?? null) : s.selectedFolderId
        return { folders, memories, selectedFolderId }
      })
    } catch (err) {
      console.error('Failed to leave folder:', err)
    }
  },

  acceptInvite: async (token) => {
    try {
      const { data, error } = await supabase.rpc('accept_invite', { invite_token: token })

      if (error) {
        console.error('Failed to accept invite:', error)
        return { success: false, error: 'Something went wrong. Please try again.' }
      }

      if (data?.error) {
        return { success: false, error: data.error, folderId: data.folder_id }
      }

      return {
        success: true,
        folderId: data.folder_id,
        folderName: data.folder_name,
      }
    } catch (err) {
      console.error('Failed to accept invite:', err)
      return { success: false, error: 'Something went wrong. Please try again.' }
    }
  },
}))
