export type FolderColor =
  | 'gray'
  | 'brown'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'red'

export interface User {
  id: string
  email: string
  name: string
}

export interface Folder {
  id: string
  name: string
  color: FolderColor
  coverImage?: string // base64
  createdAt: string
}

export interface Memory {
  id: string
  folderId: string
  title: string
  date: string // ISO date string YYYY-MM-DD
  notes: string
  images: string[] // base64
  createdAt: string
}

export const FOLDER_COLORS: FolderColor[] = [
  'gray', 'brown', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'red',
]

export const COLOR_MAP: Record<FolderColor, { bg: string; text: string; dot: string }> = {
  gray:   { bg: 'bg-gray-100',   text: 'text-gray-600',   dot: 'bg-[#9B9A97]' },
  brown:  { bg: 'bg-amber-100',  text: 'text-amber-900',  dot: 'bg-[#64473A]' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-[#D9730D]' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-[#CB912F]' },
  green:  { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-[#448361]' },
  blue:   { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-[#337EA9]' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-[#9065B0]' },
  pink:   { bg: 'bg-pink-100',   text: 'text-pink-700',   dot: 'bg-[#C14C8A]' },
  red:    { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-[#D44C47]' },
}

// Tailwind gradient classes for folder card backgrounds (no cover image)
export const COLOR_GRADIENTS: Record<FolderColor, string> = {
  gray:   'from-gray-300 to-gray-500',
  brown:  'from-amber-600 to-amber-900',
  orange: 'from-orange-300 to-orange-500',
  yellow: 'from-yellow-200 to-yellow-400',
  green:  'from-green-400 to-green-700',
  blue:   'from-blue-300 to-blue-600',
  purple: 'from-purple-300 to-purple-600',
  pink:   'from-pink-300 to-pink-500',
  red:    'from-red-300 to-red-500',
}
