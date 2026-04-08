import { CalendarDays, LogOut } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import FolderList from '../components/folders/FolderList'
import MemoryList from '../components/memories/MemoryList'
import CalendarView from '../components/calendar/CalendarView'

export default function HomePage() {
  const { user, logout } = useAuthStore()

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-[900px] bg-white min-h-screen shadow-sm flex flex-col">

        {/* Sticky top nav */}
        <header className="sticky top-0 z-10 bg-white flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <CalendarDays size={17} className="text-gray-700" />
            <span className="text-sm font-bold text-gray-900 tracking-tight">Since When</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">{user?.name}</span>
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800
                         px-2.5 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
            >
              <LogOut size={13} />
              Sign out
            </button>
          </div>
        </header>

        {/* Folder cards */}
        <div className="border-b border-gray-100">
          <FolderList />
        </div>

        {/* Calendar strip */}
        <CalendarView />

        {/* Memory list — natural height, no overflow trap */}
        <MemoryList />

      </div>
    </div>
  )
}
