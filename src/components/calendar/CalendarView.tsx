import { useMemo, useState } from 'react'
import {
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
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

type CalendarMode = '6x2' | '4x3' | '365'

const CURRENT_YEAR = new Date().getFullYear()

export default function CalendarView() {
  const { folders, memories } = useAppStore()
  const [visible, setVisible] = useState(true)
  const [year, setYear] = useState(CURRENT_YEAR)
  const [mode, setMode] = useState<CalendarMode>('6x2')

  const dateColors = useMemo(() => {
    const map: Record<string, FolderColor> = {}
    memories.forEach((m) => {
      if (map[m.date]) return
      const folder = folders.find((f) => f.id === m.folderId)
      if (folder) map[m.date] = folder.color
    })
    return map
  }, [memories, folders])

  const months = useMemo(
    () => Array.from({ length: 12 }, (_, i) => new Date(year, i, 1)),
    [year]
  )

  const gridCols = mode === '4x3' ? 'grid-cols-4' : 'grid-cols-6'

  return (
    <div className="border-b-2 border-black">
      {/* Header row */}
      <div className="flex items-center justify-between px-3 py-2 border-b-2 border-black bg-[#FFFFE0]">
        <button
          onClick={() => setVisible((v) => !v)}
          className="flex items-center gap-1 text-[10px] font-bold text-black uppercase tracking-widest hover:text-[#555] transition-colors"
        >
          {visible ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          Calendar
        </button>

        {visible && (
          <div className="flex items-center gap-2">
            {/* Mode toggle */}
            <div className="flex border-2 border-black">
              {(['6x2', '4x3', '365'] as CalendarMode[]).map((m, i) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider transition-none
                    ${i < 2 ? 'border-r-2 border-black' : ''}
                    ${mode === m ? 'bg-black text-[#FFE500]' : 'bg-transparent text-black hover:bg-[#FFE500]'}`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Year nav */}
            <div className="flex items-center gap-0 border-2 border-black">
              <button
                onClick={() => setYear((y) => y - 1)}
                className="px-1.5 py-0.5 text-black hover:bg-[#FFE500] border-r-2 border-black transition-none"
              >
                <ChevronLeft size={12} />
              </button>
              <span className="text-[11px] font-bold text-black px-2">{year}</span>
              <button
                onClick={() => setYear((y) => y + 1)}
                disabled={year >= CURRENT_YEAR}
                className="px-1.5 py-0.5 text-black hover:bg-[#FFE500] border-l-2 border-black
                           transition-none disabled:opacity-25 disabled:cursor-not-allowed"
              >
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Calendar content */}
      {visible && (
        <div className="px-3 py-2">
          {mode === '365' ? (
            <Year365View year={year} dateColors={dateColors} />
          ) : (
            <div className={`grid ${gridCols} gap-x-2 gap-y-2`}>
              {months.map((monthDate) => (
                <MiniMonth
                  key={monthDate.toISOString()}
                  monthDate={monthDate}
                  dateColors={dateColors}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── 365 dot-field view ─────────────────────────────────────────────────────

interface Year365Props {
  year: number
  dateColors: Record<string, FolderColor>
}

function Year365View({ year, dateColors }: Year365Props) {
  const allDays = eachDayOfInterval({
    start: startOfYear(new Date(year, 0, 1)),
    end: endOfYear(new Date(year, 11, 31)),
  })

  const firstDayOffset = (getDay(allDays[0]) + 6) % 7 // Monday = 0

  return (
    <div>
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-[2px] mb-1">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} className="text-[8px] font-bold text-center text-gray-500">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-[2px]">
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`e-${i}`} className="aspect-square" />
        ))}
        {allDays.map((day) => {
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

// ─── Mini month (6×2 and 4×3 modes) ─────────────────────────────────────────

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
      <p className="text-[8px] font-bold text-black uppercase tracking-widest mb-1 truncate">
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

// ─── Day cell ────────────────────────────────────────────────────────────────

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
    return (
      <div className="aspect-square flex items-center justify-center">
        <div className={`w-[7px] h-[7px] ${COLOR_MAP[color]?.dot ?? 'bg-gray-400'}`} />
      </div>
    )
  }

  if (today) {
    return (
      <div className="aspect-square flex items-center justify-center">
        <div className="w-[7px] h-[7px] border-2 border-black bg-[#FFE500]" />
      </div>
    )
  }

  // Past, no memory
  return (
    <div className="aspect-square flex items-center justify-center">
      <div className="w-[5px] h-[5px] bg-gray-300" />
    </div>
  )
}
