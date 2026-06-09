import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

type DayType = 'weekday' | 'friday' | 'saturday' | 'sunday'

interface Station {
  id: string
  name: string
  lat: number
  lng: number
  lineColors?: string[]
  byDayHour: Record<DayType, number[]>
}

const DAY_LABELS: Record<DayType, string> = {
  weekday:  'Mon–Thu',
  friday:   'Friday',
  saturday: 'Saturday',
  sunday:   'Sunday',
}

const DAY_ORDER: DayType[] = ['weekday', 'friday', 'saturday', 'sunday']

const LINE_COLORS: Record<string, string> = {
  '1': '#EE352E', '2': '#EE352E', '3': '#EE352E',
  '4': '#00933C', '5': '#00933C', '6': '#00933C',
  '7': '#B933AD',
  'A': '#0039A6', 'C': '#0039A6', 'E': '#0039A6',
  'B': '#FF6319', 'D': '#FF6319', 'F': '#FF6319', 'M': '#FF6319',
  'G': '#6CBE45',
  'J': '#996633', 'Z': '#996633',
  'L': '#A7A9AC',
  'N': '#FCCC0A', 'Q': '#FCCC0A', 'R': '#FCCC0A', 'W': '#FCCC0A',
  'S': '#808183', 'GS': '#808183', 'FS': '#808183', 'H': '#808183',
  'SIR': '#0039A6',
}

function getLineColors(station: Station): string[] {
  if (station.lineColors?.length) return station.lineColors
  const seen = new Set<string>()
  const colors: string[] = []
  const groups = station.name.match(/\(([^)]+)\)/g) ?? []
  for (const group of groups)
    for (const line of group.slice(1, -1).split(',').map(l => l.trim())) {
      const color = LINE_COLORS[line]
      if (color && !seen.has(color)) { seen.add(color); colors.push(color) }
    }
  return colors.length > 0 ? colors : ['#888888']
}

function conicGradient(colors: string[]): string {
  if (colors.length === 1) return colors[0]
  const step = 100 / colors.length
  return 'conic-gradient(' + colors.map((c, i) =>
    `${c} ${(i * step).toFixed(1)}% ${((i + 1) * step).toFixed(1)}%`
  ).join(', ') + ')'
}

function markerDiameter(riders: number, globalMax: number): number {
  if (globalMax === 0 || riders === 0) return 5
  return 5 + 47 * Math.sqrt(riders / globalMax)
}

function markerOpacity(riders: number, globalMax: number): number {
  if (globalMax === 0 || riders === 0) return 0.15
  return 0.2 + 0.65 * Math.sqrt(riders / globalMax)
}

// Normalize old-format Station[] (byHour) to new format (byDayHour)
function normalize(raw: unknown[]): Station[] {
  const empty = new Array(24).fill(0)
  return raw.map((r) => {
    const s = r as Record<string, unknown>
    if (s.byDayHour) return s as unknown as Station
    return {
      id: s.id as string,
      name: s.name as string,
      lat: s.lat as number,
      lng: s.lng as number,
      lineColors: s.lineColors as string[] | undefined,
      byDayHour: {
        weekday:  (s.byHour as number[]) ?? empty,
        friday:   empty,
        saturday: empty,
        sunday:   empty,
      },
    }
  })
}

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const ampm = i < 12 ? 'AM' : 'PM'
  const h = i === 0 ? 12 : i > 12 ? i - 12 : i
  return `${h}:00 ${ampm}`
})

export default function RidershipMap() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const markerEls = useRef<Map<string, HTMLDivElement>>(new Map())
  const markersArr = useRef<maplibregl.Marker[]>([])
  const globalMaxByDay = useRef<Record<DayType, number>>({ weekday: 1, friday: 1, saturday: 1, sunday: 1 })
  const hourlyTotalsByDay = useRef<Record<DayType, number[]>>({
    weekday: [], friday: [], saturday: [], sunday: [],
  })

  const [stations, setStations] = useState<Station[]>([])
  const [hour, setHour] = useState(8)
  const [dayType, setDayType] = useState<DayType>('weekday')
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const tick = useCallback(() => setHour(h => (h + 1) % 24), [])

  useEffect(() => {
    if (playing) {
      playRef.current = setInterval(tick, 1200)
    } else {
      if (playRef.current) clearInterval(playRef.current)
    }
    return () => { if (playRef.current) clearInterval(playRef.current) }
  }, [playing, tick])

  // Init map
  useEffect(() => {
    if (!mapContainer.current || map.current) return
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/positron',
      center: [-73.97, 40.73],
      zoom: 10,
    })
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')

    map.current.on('load', async () => {
      const res = await fetch('/data/ridership.json')
      const raw = await res.json()
      const data = normalize(raw)

      // Compute global max and hourly totals per day type
      for (const day of DAY_ORDER) {
        let gMax = 0
        const totals = new Array(24).fill(0)
        for (const s of data) {
          const byHour = s.byDayHour[day]
          for (let h = 0; h < 24; h++) {
            const v = byHour[h] ?? 0
            if (v > gMax) gMax = v
            totals[h] += v
          }
        }
        globalMaxByDay.current[day] = gMax
        hourlyTotalsByDay.current[day] = totals
      }

      // Create one HTML marker per station
      const initDay: DayType = 'weekday'
      const gMax = globalMaxByDay.current[initDay]
      for (const station of data) {
        const colors = getLineColors(station)
        const el = document.createElement('div')
        el.style.borderRadius = '50%'
        el.style.background = conicGradient(colors)
        el.style.boxShadow = '0 0 0 1.5px rgba(255,255,255,0.75), 0 1px 4px rgba(0,0,0,0.3)'
        el.style.cursor = 'pointer'
        el.style.transition = 'width 0.3s, height 0.3s, opacity 0.3s'
        const riders = station.byDayHour[initDay][8] ?? 0
        const d = markerDiameter(riders, gMax)
        el.style.width = d + 'px'
        el.style.height = d + 'px'
        el.style.opacity = String(markerOpacity(riders, gMax))

        el.addEventListener('mouseenter', () => setHoveredId(station.id))
        el.addEventListener('mouseleave', () => setHoveredId(null))

        markerEls.current.set(station.id, el)
        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([station.lng, station.lat])
          .addTo(map.current!)
        markersArr.current.push(marker)
      }

      setStations(data)
      setLoading(false)
    })

    return () => {
      markersArr.current.forEach(m => m.remove())
      markersArr.current = []
      markerEls.current.clear()
      map.current?.remove()
      map.current = null
    }
  }, [])

  // Update marker sizes on hour or day type change
  useEffect(() => {
    if (!stations.length) return
    const gMax = globalMaxByDay.current[dayType]
    for (const station of stations) {
      const el = markerEls.current.get(station.id)
      if (!el) continue
      const riders = station.byDayHour[dayType]?.[hour] ?? 0
      const d = markerDiameter(riders, gMax)
      el.style.width = d + 'px'
      el.style.height = d + 'px'
      el.style.opacity = String(markerOpacity(riders, gMax))
    }
  }, [hour, dayType, stations])

  // Usage: current hour system ridership as % of this day type's peak hour
  const usage = useMemo(() => {
    const totals = hourlyTotalsByDay.current[dayType]
    if (!totals.length) return null
    const peak = Math.max(...totals)
    if (!peak) return null
    return Math.round((totals[hour] ?? 0) / peak * 100)
  }, [hour, dayType, stations])

  const hoveredStation = hoveredId ? stations.find(s => s.id === hoveredId) : null

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      <Link to="/" style={s.backLink}>← All maps</Link>

      <div style={s.panel}>
        <h2 style={s.title}>24h Subway Ridership</h2>
        <p style={s.subtitle}>Sep 2024 · tap a day type</p>

        {/* Day type selector */}
        <div style={s.dayRow}>
          {DAY_ORDER.map(d => (
            <button
              key={d}
              onClick={() => setDayType(d)}
              style={{ ...s.dayBtn, ...(d === dayType ? s.dayBtnActive : {}) }}
            >
              {DAY_LABELS[d]}
            </button>
          ))}
        </div>

        <div style={s.hourDisplay}>{HOURS[hour]}</div>

        <input
          type="range"
          min={0} max={23} value={hour}
          onChange={e => setHour(Number(e.target.value))}
          style={s.slider}
        />

        <div style={s.sliderLabels}>
          <span>12 AM</span><span>12 PM</span><span>11 PM</span>
        </div>

        <button onClick={() => setPlaying(p => !p)} style={s.playBtn}>
          {playing ? '⏸ Pause' : '▶ Play'}
        </button>

        {usage !== null && (
          <div style={s.usageRow}>
            <span style={s.usageLabel}>System Usage</span>
            <span style={s.usageValue}>{usage}%</span>
          </div>
        )}
      </div>

      {hoveredStation && (
        <div style={s.tooltip}>
          <strong>{hoveredStation.name}</strong>
          <div style={s.tooltipSub}>
            {(hoveredStation.byDayHour[dayType]?.[hour] ?? 0).toLocaleString()} riders · {HOURS[hour]}
          </div>
        </div>
      )}

      {loading && <div style={s.loading}>Loading ridership data…</div>}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  panel: {
    position: 'absolute',
    top: 16,
    left: 16,
    background: 'rgba(255,255,255,0.96)',
    borderRadius: 8,
    padding: '14px 16px 16px',
    width: 228,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    fontFamily: 'system-ui, sans-serif',
  },
  title: {
    margin: '0 0 2px',
    fontSize: 15,
    fontWeight: 700,
    color: '#1a1a2e',
  },
  subtitle: {
    margin: '0 0 10px',
    fontSize: 11,
    color: '#888',
  },
  dayRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 4,
    marginBottom: 12,
  },
  dayBtn: {
    padding: '5px 0',
    fontSize: 11,
    fontWeight: 500,
    border: '1px solid #ddd',
    borderRadius: 5,
    background: '#f5f5f5',
    color: '#555',
    cursor: 'pointer',
  },
  dayBtnActive: {
    background: '#1a1a2e',
    color: '#fff',
    border: '1px solid #1a1a2e',
  },
  hourDisplay: {
    fontSize: 22,
    fontWeight: 700,
    color: '#1a1a2e',
    marginBottom: 8,
    letterSpacing: '-0.5px',
  },
  slider: {
    width: '100%',
    accentColor: '#1a1a2e',
    cursor: 'pointer',
  },
  sliderLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 9,
    color: '#aaa',
    margin: '3px 0 12px',
  },
  playBtn: {
    width: '100%',
    padding: '7px 0',
    background: '#1a1a2e',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  usageRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTop: '1px solid #eee',
  },
  usageLabel: {
    fontSize: 11,
    color: '#888',
  },
  usageValue: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1a1a2e',
  },
  backLink: {
    position: 'absolute',
    top: 16,
    right: 52,
    background: 'rgba(255,255,255,0.95)',
    color: '#1a1a2e',
    textDecoration: 'none',
    fontSize: 12,
    fontWeight: 500,
    padding: '6px 12px',
    borderRadius: 6,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    zIndex: 10,
  },
  tooltip: {
    position: 'absolute',
    bottom: 24,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(26,26,46,0.92)',
    color: '#fff',
    borderRadius: 6,
    padding: '10px 14px',
    fontSize: 13,
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
  tooltipSub: {
    fontSize: 11,
    color: '#ccc',
    marginTop: 2,
  },
  loading: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%,-50%)',
    background: 'rgba(255,255,255,0.9)',
    padding: '12px 20px',
    borderRadius: 6,
    fontSize: 14,
    color: '#333',
  },
}
