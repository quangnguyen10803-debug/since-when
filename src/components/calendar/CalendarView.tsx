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

// Fixed cell size for the compact 365 view
const CELL_PX = 8
const GAP_PX = 2

export default function CalendarView() {
  const { folders, memories } = useAppStore()
  const [visible, setVisible] = useState(true)
  const [year, setYear] = useState(CURRENT_YEAR)
  const [mode, setMode] = useState<CalendarMode>('6x2')

  // Collect ALL folder colors per date (up to 4) to drive multi-memory dots
  const dateColors = useMemo(() => {
    const map: Record<string, FolderColor[]> = {}
    memories.forEach((m) => {
      const folder = folders.find((f) => f.id === m.folderId)
      if (!folder) return
      if (!map[m.date]) map[m.date] = []
      if (map[m.date].length < 4) map[m.date].push(folder.color)
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
      {/* Header */}
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
            <div className="flex items-center border-2 border-black">
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

// ─── 365 view — horizontal GitHub-style (7 rows × 53 cols) ──────────────────
// Total height: 7×8px + 6×2px gap = 68px — very compact

interface Year365Props {
  year: number
  dateColors: Record<string, FolderColor[]>
}

function Year365View({ year, dateColors }: Year365Props) {
  const allDays = eachDayOfInterval({
    start: startOfYear(new Date(year, 0, 1)),
    end: endOfYear(new Date(year, 11, 31)),
  })

  // Monday = 0, offset so Jan 1 lands on correct column
  const firstDayOffset = (getDay(allDays[0]) + 6) % 7

  return (
    <div className="flex items-start gap-1.5 overflow-x-auto">
      {/* Day-of-week labels (Mon, Wed, Fri only to save space) */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: `repeat(7, ${CELL_PX}px)`,
          gap: `${GAP_PX}px`,
          flexShrink: 0,
        }}
      >
        {['M', '', 'W', '', 'F', '', ''].map((label, i) => (
          <div
            key={i}
            style={{
              height: CELL_PX,
              fontSize: 6,
              fontWeight: 700,
              color: '#888',
              lineHeight: `${CELL_PX}px`,
              width: 8,
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Dot grid — 7 rows, auto columns (one per week) */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: `repeat(7, ${CELL_PX}px)`,
          gridAutoColumns: CELL_PX,
          gridAutoFlow: 'column',
          gap: GAP_PX,
        }}
      >
        {/* Empty offset cells to align Jan 1 */}
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`e-${i}`} />
        ))}
        {allDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const colors = dateColors[dateStr] ?? []
          const future = isFuture(day) && !isToday(day)
          const today = isToday(day)
          return (
            <CompactDayCell key={dateStr} colors={colors} future={future} today={today} />
          )
        })}
      </div>
    </div>
  )
}

// ─── Mini month (6×2 and 4×3) ────────────────────────────────────────────────

interface MiniMonthProps {
  monthDate: Date
  dateColors: Record<string, FolderColor[]>
}

function MiniMonth({ monthDate, dateColors }: MiniMonthProps) {
  const days = eachDayOfInterval({
    start: startOfMonth(monthDate),
    end: endOfMonth(monthDate),
  })

  const firstDow = (getDay(days[0]) + 6) % 7

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
          const colors = dateColors[dateStr] ?? []
          const future = isFuture(day) && !isToday(day)
          const today = isToday(day)
          return (
            <DayCell key={dateStr} colors={colors} future={future} today={today} />
          )
        })}
      </div>
    </div>
  )
}

// ─── DayCell — for mini-month views (aspect-square, scales with month width) ─
// Renders 1 / 2-side-by-side / 2×2 grid depending on memory count

function DayCell({
  colors,
  future,
  today,
}: {
  colors: FolderColor[]
  future: boolean
  today: boolean
}) {
  if (future) return <div className="aspect-square" />

  const count = colors.length

  if (count === 0) {
    if (today) {
      return (
        <div className="aspect-square flex items-center justify-center">
          <div
            style={{
              width: '70%',
              height: '70%',
              backgroundColor: '#FFE500',
              outline: '1.5px solid #000',
              outlineOffset: 0,
            }}
          />
        </div>
      )
    }
    return (
      <div className="aspect-square flex items-center justify-center">
        <div style={{ width: '45%', height: '45%', backgroundColor: '#d1d5db' }} />
      </div>
    )
  }

  if (count === 1) {
    return (
      <div className="aspect-square flex items-center justify-center">
        <div style={{ width: '70%', height: '70%', backgroundColor: COLOR_MAP[colors[0]].hex }} />
      </div>
    )
  }

  // 2–4 memories: 2×2 grid, unfilled slots are transparent
  const slots: (FolderColor | null)[] = [
    colors[0] ?? null,
    colors[1] ?? null,
    colors[2] ?? null,
    colors[3] ?? null,
  ]

  return (
    <div className="aspect-square flex items-center justify-center">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1px',
          width: '80%',
          height: '80%',
        }}
      >
        {slots.map((c, i) => (
          <div
            key={i}
            style={{ backgroundColor: c ? COLOR_MAP[c].hex : 'transparent' }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── CompactDayCell — for 365 view (fixed CELL_PX size, fills the cell) ──────

function CompactDayCell({
  colors,
  future,
  today,
}: {
  colors: FolderColor[]
  future: boolean
  today: boolean
}) {
  const size = CELL_PX

  if (future) return <div style={{ width: size, height: size }} />

  const count = colors.length

  if (count === 0) {
    return (
      <div
        style={{
          width: size,
          height: size,
          backgroundColor: today ? '#FFE500' : '#d1d5db',
          outline: today ? '1px solid #000' : undefined,
          outlineOffset: 0,
        }}
      />
    )
  }

  if (count === 1) {
    return (
      <div style={{ width: size, height: size, backgroundColor: COLOR_MAP[colors[0]].hex }} />
    )
  }

  // 2–4 memories: 2×2 sub-grid filling the full cell
  const slots: (FolderColor | null)[] = [
    colors[0] ?? null,
    colors[1] ?? null,
    colors[2] ?? null,
    colors[3] ?? null,
  ]

  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1px',
      }}
    >
      {slots.map((c, i) => (
        <div key={i} style={{ backgroundColor: c ? COLOR_MAP[c].hex : 'transparent' }} />
      ))}
    </div>
  )
}
