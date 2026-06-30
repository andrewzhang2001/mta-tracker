import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

type Klass = 'protected' | 'painted' | 'greenway'

interface YearMiles {
  year: number
  protected: number
  painted: number
  greenway: number
  total: number
}
interface Summary {
  minYear: number
  maxYear: number
  baseMiles: number
  totalMiles: number
  source: string
  note: string
  generated: string
  byYear: YearMiles[]
}

const CLASS_COLOR: Record<Klass, string> = {
  protected: '#15803d', // green — on-street protected
  painted: '#2563eb', // blue — painted / standard
  greenway: '#14b8a6', // teal — off-street greenway
}
const CLASS_LABEL: Record<Klass, string> = {
  protected: 'Protected',
  painted: 'Painted / standard',
  greenway: 'Greenway',
}
const CLASS_ORDER: Klass[] = ['protected', 'painted', 'greenway']

export default function BikeNetworkMap() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [summary, setSummary] = useState<Summary | null>(null)
  const [year, setYear] = useState(2025)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(true)

  const minYear = summary?.minYear ?? 1997
  const maxYear = summary?.maxYear ?? 2025

  const tick = useCallback(() => {
    setYear((y) => {
      if (y >= maxYear) {
        setPlaying(false)
        return y
      }
      return y + 1
    })
  }, [maxYear])

  useEffect(() => {
    if (playing) playRef.current = setInterval(tick, 600)
    else if (playRef.current) clearInterval(playRef.current)
    return () => { if (playRef.current) clearInterval(playRef.current) }
  }, [playing, tick])

  // Init map
  useEffect(() => {
    if (!mapContainer.current || map.current) return
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/positron',
      center: [-73.95, 40.7],
      zoom: 10.5,
    })
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')

    map.current.on('load', async () => {
      const geo = await (await fetch('/data/bike-network.geojson')).json()
      setSummary(geo.summary)
      setYear(geo.summary.maxYear)

      map.current!.addSource('bike-net', { type: 'geojson', data: geo })
      map.current!.addLayer({
        id: 'bike-net',
        type: 'line',
        source: 'bike-net',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': [
            'match',
            ['get', 'k'],
            'protected', CLASS_COLOR.protected,
            'painted', CLASS_COLOR.painted,
            'greenway', CLASS_COLOR.greenway,
            '#888888',
          ],
          'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.8, 13, 1.8, 16, 3.5],
          'line-opacity': 0.8,
        },
        filter: ['<=', ['get', 'y'], geo.summary.maxYear],
      })
      setLoading(false)
    })

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  // Filter the network to lanes installed on or before the current year
  useEffect(() => {
    if (!map.current?.getLayer('bike-net')) return
    map.current.setFilter('bike-net', ['<=', ['get', 'y'], year])
  }, [year])

  const cur = useMemo(
    () => summary?.byYear.find((r) => r.year === year) ?? null,
    [summary, year]
  )

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      <Link to="/" style={s.backLink}>← All maps</Link>

      <div style={s.panel}>
        <h2 style={s.title}>NYC Bike Network</h2>
        <p style={s.subtitle}>Lane miles built, {minYear}–{maxYear}</p>

        <div style={s.yearDisplay}>{year}</div>

        {cur && (
          <div style={s.totalRow}>
            <span style={s.totalValue}>{cur.total.toLocaleString()}</span>
            <span style={s.totalLabel}>lane miles</span>
          </div>
        )}

        <input
          type="range"
          min={minYear}
          max={maxYear}
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          style={s.slider}
        />
        <div style={s.sliderLabels}>
          <span>{minYear}</span><span>{maxYear}</span>
        </div>

        <button onClick={() => {
          if (year >= maxYear && !playing) setYear(minYear)
          setPlaying((p) => !p)
        }} style={s.playBtn}>
          {playing ? '⏸ Pause' : year >= maxYear ? '↻ Replay' : '▶ Play'}
        </button>

        {summary && cur && <GrowthChart summary={summary} year={year} />}

        {cur && (
          <div style={s.breakdown}>
            {CLASS_ORDER.map((k) => (
              <div key={k} style={s.bRow}>
                <span style={s.bLabel}>
                  <i style={{ ...s.swatch, background: CLASS_COLOR[k] }} /> {CLASS_LABEL[k]}
                </span>
                <span style={s.bVal}>{cur[k].toLocaleString()} mi</span>
              </div>
            ))}
          </div>
        )}

        {summary && (
          <p style={s.source}>
            {summary.source}. {summary.note}
          </p>
        )}
      </div>

      {loading && <div style={s.loading}>Loading bike network…</div>}
    </div>
  )
}

function GrowthChart({ summary, year }: { summary: Summary; year: number }) {
  const W = 228
  const H = 84
  const pad = { t: 6, r: 2, b: 12, l: 2 }
  const rows = summary.byYear
  const maxTotal = Math.max(...rows.map((r) => r.total), 1)
  const plotW = W - pad.l - pad.r
  const plotH = H - pad.t - pad.b
  const x = (yr: number) => pad.l + (plotW * (yr - summary.minYear)) / (summary.maxYear - summary.minYear)
  const y = (v: number) => pad.t + plotH * (1 - v / maxTotal)

  // Stacked areas (greenway + painted + protected = total), drawn as cumulative bands.
  const band = (top: (r: YearMiles) => number, bottom: (r: YearMiles) => number) => {
    const up = rows.map((r) => `${x(r.year)},${y(top(r))}`)
    const down = [...rows].reverse().map((r) => `${x(r.year)},${y(bottom(r))}`)
    return up.concat(down).join(' ')
  }
  const cx = x(year)

  return (
    <div style={s.chartWrap}>
      <svg width={W} height={H} style={{ display: 'block' }}>
        {/* greenway band (bottom) */}
        <polygon points={band((r) => r.greenway, () => 0)} fill={CLASS_COLOR.greenway} opacity={0.85} />
        {/* painted band */}
        <polygon points={band((r) => r.greenway + r.painted, (r) => r.greenway)} fill={CLASS_COLOR.painted} opacity={0.85} />
        {/* protected band (top) */}
        <polygon points={band((r) => r.total, (r) => r.greenway + r.painted)} fill={CLASS_COLOR.protected} opacity={0.9} />
        {/* current-year marker */}
        <line x1={cx} y1={pad.t} x2={cx} y2={pad.t + plotH} stroke="#1a1a2e" strokeWidth={1} />
        <text x={pad.l} y={H - 2} fontSize={8} fill="#aaa">{summary.minYear}</text>
        <text x={W - pad.r} y={H - 2} fontSize={8} fill="#aaa" textAnchor="end">{summary.maxYear}</text>
      </svg>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  panel: {
    position: 'absolute',
    top: 16,
    left: 16,
    background: 'rgba(255,255,255,0.97)',
    borderRadius: 8,
    padding: '14px 16px 14px',
    width: 244,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    fontFamily: 'system-ui, sans-serif',
  },
  title: { margin: '0 0 2px', fontSize: 16, fontWeight: 700, color: '#1a1a2e' },
  subtitle: { margin: '0 0 10px', fontSize: 11, color: '#888' },
  yearDisplay: { fontSize: 30, fontWeight: 700, color: '#1a1a2e', lineHeight: 1, letterSpacing: '-1px' },
  totalRow: { display: 'flex', alignItems: 'baseline', gap: 6, margin: '4px 0 10px' },
  totalValue: { fontSize: 22, fontWeight: 700, color: '#15803d' },
  totalLabel: { fontSize: 12, color: '#888' },
  slider: { width: '100%', accentColor: '#15803d', cursor: 'pointer' },
  sliderLabels: { display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#aaa', margin: '3px 0 10px' },
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
  chartWrap: { margin: '12px 0 4px' },
  breakdown: { marginTop: 4, marginBottom: 10 },
  bRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5, padding: '2px 0' },
  bLabel: { color: '#555', display: 'flex', alignItems: 'center' },
  bVal: { color: '#222', fontWeight: 600, fontVariantNumeric: 'tabular-nums' },
  swatch: { display: 'inline-block', width: 10, height: 3, borderRadius: 2, marginRight: 6 },
  source: { fontSize: 9, color: '#aaa', lineHeight: 1.4, margin: 0 },
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
