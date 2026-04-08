import { useMemo, useState } from 'react'
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  format,
  isToday,
  isFuture,
} from 'date-fns'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { COLOR_MAP } from '../../types'
import type { FolderColor } from '../../types'

const CURRENT_YEAR = new Date().getFullYear()

export default function CalendarView() {
  const { folders, memories } = useAppStore()
  const [visible, setVisible] = useState(true)
  const [year, setYear] = useState(CURRENT_YEAR)

  const dateColors = useMemo(() => {
    const map: Record<string, FolderColor> = {}
    memories.forEach((m) => {
      if (map[m.date]) return
      const folder = folders.find((f) => f.id === m.folderId)
      if (folder) map[m.date] = folder.color
    })
    return map
  }, [memories, folders])

  // 12 months of the selected year
  const months = useMemo(
    () => Array.from({ length: 12 }, (_, i) => new Date(year, i, 1)),
    [year]
  )

  return (
    <div className="border-b border-gray-100">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 py-2">
        {/* Toggle */}
        <button
          onClick={() => setVisible((v) => !v)}
          className="flex items-center gap-1 text-[11px] font-semibold text-gray-400
                     uppercase tracking-wider hover:text-gray-600 transition-colors"
        >
          {visible ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          Calendar
        </button>

        {/* Year nav */}
        {visible && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setYear((y) => y - 1)}
              className="p-0.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-sm font-bold text-gray-800 w-10 text-center">{year}</span>
            <button
              onClick={() => setYear((y) => y + 1)}
              disabled={year >= CURRENT_YEAR}
              className="p-0.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100
                         transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Calendar grid */}
      {visible && (
        <div className="px-4 pb-3">
          <div className="grid grid-cols-6 gap-x-3 gap-y-3">
            {months.map((monthDate) => (
              <MiniMonth
                key={monthDate.toISOString()}
                monthDate={monthDate}
                dateColors={dateColors}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface MiniMonthProps {
  monthDate: Date
  dateColors: Record<string, FolderColor>
}

function MiniMonth({ monthDate, dateColors }: MiniMonthProps) {
  const days = eachDayOfInterval({
    start: startOfMonth(monthDate),
    end: endOfMonth(monthDate),
  })

  const firstDow = (getDay(days[0]) + 6) % 7 // Monday = 0

  return (
    <div className="min-w-0">
      <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-1 truncate">
        {format(monthDate, 'MMM')}
      </p>
      <div className="grid grid-cols-7 gap-[2px]">
        {Array.from({ length: firstDow }).map((_, i) => (
          <div key={`e-${i}`} className="aspect-square" />
        ))}
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const color = dateColors[dateStr] ?? null
          const future = isFuture(day) && !isToday(day)
          const today = isToday(day)
          return (
            <DayCell key={dateStr} color={color} future={future} today={today} />
          )
        })}
      </div>
    </div>
  )
}

function DayCell({
  color,
  future,
  today,
}: {
  color: FolderColor | null
  future: boolean
  today: boolean
}) {
  if (future) return <div className="aspect-square" />

  if (color) {
    // Colored square: centered, 1.4× dot size
    return (
      <div className="aspect-square flex items-center justify-center">
        <div className={`w-[8px] h-[8px] rounded-[2px] ${COLOR_MAP[color]?.dot ?? 'bg-gray-400'}`} />
      </div>
    )
  }

  if (today) {
    return (
      <div className="aspect-square flex items-center justify-center">
        <div className="w-[6px] h-[6px] rounded-full ring-[1.5px] ring-gray-400" />
      </div>
    )
  }

  // Past, no memory — dot
  return (
    <div className="aspect-square flex items-center justify-center">
      <div className="w-[4px] h-[4px] rounded-full bg-gray-200" />
    </div>
  )
}
