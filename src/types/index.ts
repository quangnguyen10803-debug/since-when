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
  coverImage?: string
  createdAt: string
}

export interface Memory {
  id: string
  folderId: string
  title: string
  date: string // ISO date string YYYY-MM-DD
  notes: string
  images: string[]
  createdAt: string
}

export const FOLDER_COLORS: FolderColor[] = [
  'gray', 'brown', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'red',
]

// Solid hex colors for folder card backgrounds and color swatches
export const COLOR_SOLID: Record<FolderColor, { bg: string; text: string }> = {
  gray:   { bg: '#9B9A97', text: '#000' },
  brown:  { bg: '#64473A', text: '#fff' },
  orange: { bg: '#D9730D', text: '#fff' },
  yellow: { bg: '#CB912F', text: '#000' },
  green:  { bg: '#448361', text: '#fff' },
  blue:   { bg: '#337EA9', text: '#fff' },
  purple: { bg: '#9065B0', text: '#fff' },
  pink:   { bg: '#C14C8A', text: '#fff' },
  red:    { bg: '#D44C47', text: '#fff' },
}

// Dot color classes used in calendar — hex bg via Tailwind arbitrary value
export const COLOR_MAP: Record<FolderColor, { bg: string; text: string; dot: string; hex: string }> = {
  gray:   { bg: 'bg-gray-300',   text: 'text-black', dot: 'bg-[#9B9A97]', hex: '#9B9A97' },
  brown:  { bg: 'bg-amber-700',  text: 'text-white', dot: 'bg-[#64473A]', hex: '#64473A' },
  orange: { bg: 'bg-orange-400', text: 'text-black', dot: 'bg-[#D9730D]', hex: '#D9730D' },
  yellow: { bg: 'bg-yellow-300', text: 'text-black', dot: 'bg-[#CB912F]', hex: '#CB912F' },
  green:  { bg: 'bg-green-600',  text: 'text-white', dot: 'bg-[#448361]', hex: '#448361' },
  blue:   { bg: 'bg-blue-500',   text: 'text-white', dot: 'bg-[#337EA9]', hex: '#337EA9' },
  purple: { bg: 'bg-purple-500', text: 'text-white', dot: 'bg-[#9065B0]', hex: '#9065B0' },
  pink:   { bg: 'bg-pink-500',   text: 'text-white', dot: 'bg-[#C14C8A]', hex: '#C14C8A' },
  red:    { bg: 'bg-red-500',    text: 'text-white', dot: 'bg-[#D44C47]', hex: '#D44C47' },
}

// Kept for compatibility — solid colors replace gradients
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
