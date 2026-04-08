import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Folder, Memory, FolderColor } from '../types'

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
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapFolder(row: any): Folder {
  return {
    id: row.id,
    name: row.name,
    color: row.color as FolderColor,
    coverImage: row.cover_image_url ?? undefined,
    createdAt: row.created_at,
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
  }
}

export const useAppStore = create<AppState>((set) => ({
  folders: [],
  memories: [],
  selectedFolderId: null,

  clear: () => set({ folders: [], memories: [], selectedFolderId: null }),

  selectFolder: (id) => set({ selectedFolderId: id }),

  loadData: async (userId) => {
    const [foldersRes, memoriesRes] = await Promise.all([
      supabase.from('folders').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('memories').select('*').eq('user_id', userId).order('created_at'),
    ])

    const folders = (foldersRes.data ?? []).map(mapFolder)
    const memories = (memoriesRes.data ?? []).map(mapMemory)
    set({
      folders,
      memories,
      selectedFolderId: folders[0]?.id ?? null,
    })
  },

  addFolder: async (name, color, coverImageUrl) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('folders')
      .insert({ user_id: user.id, name, color, cover_image_url: coverImageUrl ?? null })
      .select()
      .single()

    if (data && !error) {
      const folder = mapFolder(data)
      set((s) => ({ folders: [...s.folders, folder], selectedFolderId: folder.id }))
    }
  },

  updateFolder: async (id, name, color, coverImageUrl) => {
    const { data, error } = await supabase
      .from('folders')
      .update({ name, color, cover_image_url: coverImageUrl ?? null })
      .eq('id', id)
      .select()
      .single()

    if (data && !error) {
      set((s) => ({
        folders: s.folders.map((f) => (f.id === id ? mapFolder(data) : f)),
      }))
    }
  },

  deleteFolder: async (id) => {
    const { error } = await supabase.from('folders').delete().eq('id', id)
    if (!error) {
      set((s) => {
        const folders = s.folders.filter((f) => f.id !== id)
        const memories = s.memories.filter((m) => m.folderId !== id)
        const selectedFolderId =
          s.selectedFolderId === id ? (folders[0]?.id ?? null) : s.selectedFolderId
        return { folders, memories, selectedFolderId }
      })
    }
  },

  addMemory: async (folderId, title, date, notes, imageUrls) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('memories')
      .insert({ user_id: user.id, folder_id: folderId, title, date, notes, image_urls: imageUrls })
      .select()
      .single()

    if (data && !error) {
      set((s) => ({ memories: [...s.memories, mapMemory(data)] }))
    }
  },

  updateMemory: async (id, title, date, notes, imageUrls) => {
    const { data, error } = await supabase
      .from('memories')
      .update({ title, date, notes, image_urls: imageUrls })
      .eq('id', id)
      .select()
      .single()

    if (data && !error) {
      set((s) => ({
        memories: s.memories.map((m) => (m.id === id ? mapMemory(data) : m)),
      }))
    }
  },

  deleteMemory: async (id) => {
    const { error } = await supabase.from('memories').delete().eq('id', id)
    if (!error) {
      set((s) => ({ memories: s.memories.filter((m) => m.id !== id) }))
    }
  },
}))
