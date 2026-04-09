import { LogOut } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import FolderList from '../components/folders/FolderList'
import MemoryList from '../components/memories/MemoryList'
import CalendarView from '../components/calendar/CalendarView'

export default function HomePage() {
  const { user, logout } = useAuthStore()

  return (
    <div className="min-h-screen bg-[#FFFFF0] flex justify-center">
      <div className="w-full max-w-[900px] bg-[#FFFFF0] min-h-screen flex flex-col border-x-2 border-black"
        style={{ boxShadow: '0 0 0 0' }}>

        {/* Sticky top nav */}
        <header className="sticky top-0 z-10 bg-black flex items-center justify-between px-4 py-2.5 border-b-2 border-black">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-[#FFE500] tracking-tight uppercase">Since When</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{user?.name}</span>
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 text-[10px] font-bold text-black uppercase tracking-wider
                         border-2 border-[#FFE500] bg-[#FFE500] px-2.5 py-1.5 hover:bg-[#FFD000] transition-none"
              style={{ boxShadow: '2px 2px 0px #FFE500' }}
            >
              <LogOut size={11} />
              Sign out
            </button>
          </div>
        </header>

        {/* Folder cards */}
        <div className="border-b-2 border-black">
          <FolderList />
        </div>

        {/* Calendar strip */}
        <CalendarView />

        {/* Memory list */}
        <MemoryList />

      </div>
    </div>
  )
}
