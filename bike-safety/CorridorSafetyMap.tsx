import { useEffect, useRef, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import corridorsUrl from './data/bike-corridors.json?url'

interface YearStat {
  inj: number
  killed: number
  cycInj: number
  cycKilled: number
  pedInj: number
  pedKilled: number
  crashes: number
}
interface BeforeAfter {
  before: number
  after: number
  pct: number | null
}
interface CrashPoint {
  lng: number
  lat: number
  yr: number
  cyc: number
  ped: number
  killed: number
}
interface Corridor {
  id: string
  name: string
  neighborhood: string
  installYear: number
  bufferM: number
  blurb: string
  center: [number, number]
  lanes: [number, number][][]
  byYear: Record<string, YearStat>
  summary: {
    totalInjured: BeforeAfter
    cyclistInjured: BeforeAfter
    pedInjured: BeforeAfter
    killed: BeforeAfter
  }
  points: CrashPoint[]
}
interface Dataset {
  meta: {
    crashSource: string
    laneSource: string
    firstFullYear: number
    lastFullYear: number
    generated: string
  }
  citywide: Record<string, YearStat>
  corridors: Corridor[]
}

type Mode = 'all' | 'cyc' | 'ped'

const BEFORE_COLOR = '#f59e0b' // amber — before redesign
const AFTER_COLOR = '#0ea5e9' // sky — after redesign
const FATAL_COLOR = '#dc2626'
const LANE_COLOR = '#15803d' // green — the protected bike lane

function laneBBox(lanes: [number, number][][]): maplibregl.LngLatBoundsLike {
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity
  for (const line of lanes) for (const [lng, lat] of line) {
    if (lng < minLng) minLng = lng
    if (lat < minLat) minLat = lat
    if (lng > maxLng) maxLng = lng
    if (lat > maxLat) maxLat = lat
  }
  return [[minLng, minLat], [maxLng, maxLat]]
}

const MODES: { id: Mode; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'cyc', label: 'Cyclists' },
  { id: 'ped', label: 'Pedestrians' },
]

function avgYears(byYear: Record<string, YearStat>, lo: number, hi: number, key: keyof YearStat) {
  let sum = 0
  let n = 0
  for (let y = lo; y <= hi; y++) {
    const s = byYear[y]
    if (s) {
      sum += s[key]
      n++
    }
  }
  return n ? sum / n : 0
}

function pointMatchesMode(p: CrashPoint, mode: Mode) {
  if (mode === 'cyc') return p.cyc > 0
  if (mode === 'ped') return p.ped > 0
  return p.cyc > 0 || p.ped > 0
}

function pointsToGeoJSON(points: CrashPoint[], mode: Mode, installYear: number) {
  return {
    type: 'FeatureCollection' as const,
    features: points
      .filter((p) => pointMatchesMode(p, mode))
      .map((p) => {
        const severity =
          mode === 'cyc' ? p.cyc : mode === 'ped' ? p.ped : p.cyc + p.ped
        return {
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] },
          properties: {
            phase: p.yr < installYear ? 'before' : 'after',
            fatal: p.killed > 0 ? 1 : 0,
            severity,
          },
        }
      }),
  }
}

function pct(n: number | null) {
  if (n === null) return 'n/a'
  const v = Math.round(n * 100)
  return (v > 0 ? '+' : '') + v + '%'
}

export default function CorridorSafetyMap() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [data, setData] = useState<Dataset | null>(null)
  const [selectedId, setSelectedId] = useState<string>('queens-blvd')
  const [mode, setMode] = useState<Mode>('all')
  const [equalWindow, setEqualWindow] = useState(true)
  const [loading, setLoading] = useState(true)

  const corridor = useMemo(
    () => data?.corridors.find((c) => c.id === selectedId) ?? null,
    [data, selectedId]
  )

  // Equal-length windows on each side of the install year, so the dot counts are
  // time-fair (the full data has a much longer "after" period than "before").
  const windowInfo = useMemo(() => {
    if (!corridor || !data) return null
    const w = corridor.installYear - data.meta.firstFullYear
    return {
      w,
      beforeLo: corridor.installYear - w,
      beforeHi: corridor.installYear - 1,
      afterLo: corridor.installYear + 1,
      afterHi: corridor.installYear + w,
    }
  }, [corridor, data])

  const visiblePoints = useMemo(() => {
    if (!corridor) return []
    if (!equalWindow || !windowInfo) return corridor.points
    return corridor.points.filter(
      (p) =>
        (p.yr >= windowInfo.beforeLo && p.yr <= windowInfo.beforeHi) ||
        (p.yr >= windowInfo.afterLo && p.yr <= windowInfo.afterHi)
    )
  }, [corridor, equalWindow, windowInfo])

  // Init map
  useEffect(() => {
    if (!mapContainer.current || map.current) return
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/positron',
      center: [-73.895, 40.7395],
      zoom: 13,
    })
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')

    map.current.on('load', async () => {
      const res = await fetch(corridorsUrl)
      const json: Dataset = await res.json()

      map.current!.addSource('lane', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      // Soft halo approximating the corridor band, then the crisp lane line.
      map.current!.addLayer({
        id: 'lane-halo',
        type: 'line',
        source: 'lane',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': LANE_COLOR,
          'line-opacity': 0.18,
          'line-width': ['interpolate', ['linear'], ['zoom'], 12, 6, 16, 22, 18, 40],
        },
      })
      map.current!.addLayer({
        id: 'lane-line',
        type: 'line',
        source: 'lane',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': LANE_COLOR, 'line-width': 3, 'line-opacity': 0.9 },
      })

      map.current!.addSource('crashes', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      map.current!.addLayer({
        id: 'crashes',
        type: 'circle',
        source: 'crashes',
        paint: {
          'circle-radius': ['+', 4, ['*', 1.6, ['sqrt', ['get', 'severity']]]],
          'circle-color': [
            'case',
            ['==', ['get', 'fatal'], 1],
            FATAL_COLOR,
            ['==', ['get', 'phase'], 'before'],
            BEFORE_COLOR,
            AFTER_COLOR,
          ],
          'circle-opacity': 0.75,
          'circle-stroke-width': ['case', ['==', ['get', 'fatal'], 1], 1.5, 0.5],
          'circle-stroke-color': ['case', ['==', ['get', 'fatal'], 1], '#7f1d1d', '#ffffff'],
        },
      })

      setData(json)
      setLoading(false)
    })

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  // Update lane geometry + crashes when corridor or mode changes
  useEffect(() => {
    if (!map.current || !corridor) return
    const laneSrc = map.current.getSource('lane') as maplibregl.GeoJSONSource | undefined
    const crashSrc = map.current.getSource('crashes') as maplibregl.GeoJSONSource | undefined
    if (!laneSrc || !crashSrc) return

    laneSrc.setData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'MultiLineString', coordinates: corridor.lanes },
          properties: {},
        },
      ],
    })
    crashSrc.setData(pointsToGeoJSON(visiblePoints, mode, corridor.installYear))
  }, [corridor, mode, visiblePoints])

  // Frame the corridor on corridor change (not mode)
  useEffect(() => {
    if (!map.current || !corridor) return
    map.current.fitBounds(laneBBox(corridor.lanes), { padding: 90, duration: 800, maxZoom: 16 })
  }, [corridor?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Citywide-adjusted comparison for the headline
  const compare = useMemo(() => {
    if (!data || !corridor) return null
    const { firstFullYear, lastFullYear } = data.meta
    const iy = corridor.installYear
    const cityBefore = avgYears(data.citywide, firstFullYear, iy - 1, 'inj')
    const cityAfter = avgYears(data.citywide, iy + 1, lastFullYear, 'inj')
    const cityPct = cityBefore > 0 ? (cityAfter - cityBefore) / cityBefore : null
    const corrPct = corridor.summary.totalInjured.pct
    // Expected = corridor before scaled by citywide change; net = how much corridor beat that
    const expected = cityBefore > 0 ? corridor.summary.totalInjured.before * (cityAfter / cityBefore) : null
    const net =
      expected && expected > 0 ? (corridor.summary.totalInjured.after - expected) / expected : null
    return { cityPct, corrPct, net }
  }, [data, corridor])

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      <Link to="/" style={s.backLink}>← All maps</Link>

      {corridor && data && (
        <div style={s.panel}>
          <h2 style={s.title}>Streetfight</h2>
          <p style={s.subtitle}>Did the redesign make the street safer?</p>

          {/* Corridor selector */}
          <div style={s.corridorList}>
            {data.corridors.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                style={{ ...s.corridorBtn, ...(c.id === selectedId ? s.corridorBtnActive : {}) }}
              >
                <span style={s.corridorName}>{c.name}</span>
                <span style={s.corridorYear}>protected lane · {c.installYear}</span>
              </button>
            ))}
          </div>

          <p style={s.blurb}>{corridor.blurb}</p>

          {/* Headline: total injuries before/after, citywide-adjusted */}
          <div style={s.headlineRow}>
            <div style={s.bigNum}>
              <span style={s.bigNumValue}>{corridor.summary.totalInjured.before.toFixed(0)}</span>
              <span style={s.bigNumLabel}>injured/yr before</span>
            </div>
            <span style={s.arrow}>→</span>
            <div style={s.bigNum}>
              <span style={s.bigNumValue}>{corridor.summary.totalInjured.after.toFixed(0)}</span>
              <span style={s.bigNumLabel}>after</span>
            </div>
          </div>

          {compare && (
            <div style={s.compareBox}>
              <div style={s.compareRow}>
                <span>This street</span>
                <strong style={{ color: (compare.corrPct ?? 0) < 0 ? '#16a34a' : '#dc2626' }}>
                  {pct(compare.corrPct)}
                </strong>
              </div>
              <div style={s.compareRow}>
                <span>Citywide, same years</span>
                <strong>{pct(compare.cityPct)}</strong>
              </div>
              <div style={{ ...s.compareRow, ...s.compareNet }}>
                <span>vs. the city</span>
                <strong style={{ color: (compare.net ?? 0) < 0 ? '#16a34a' : '#dc2626' }}>
                  {compare.net !== null
                    ? (compare.net < 0 ? `${Math.abs(Math.round(compare.net * 100))}% safer` : `${Math.round(compare.net * 100)}% worse`)
                    : 'n/a'}
                </strong>
              </div>
            </div>
          )}

          {/* Mode breakdown */}
          <div style={s.modeBreakdown}>
            <BreakdownRow label="Pedestrians injured" ba={corridor.summary.pedInjured} />
            <BreakdownRow
              label="Cyclists injured"
              ba={corridor.summary.cyclistInjured}
              note="more riders"
            />
          </div>

          {/* Yearly chart */}
          <YearChart corridor={corridor} citywide={data.citywide} meta={data.meta} />

          {/* Crash-dot mode toggle + legend */}
          <div style={s.modeRow}>
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                style={{ ...s.modeBtn, ...(m.id === mode ? s.modeBtnActive : {}) }}
              >
                {m.label}
              </button>
            ))}
          </div>
          <label style={s.toggleRow}>
            <input
              type="checkbox"
              checked={equalWindow}
              onChange={(e) => setEqualWindow(e.target.checked)}
              style={{ marginRight: 6, cursor: 'pointer' }}
            />
            <span style={s.toggleLabel}>
              Equal years before/after
              {equalWindow && windowInfo && (
                <span style={s.windowNote}>
                  {' '}({windowInfo.beforeLo}–{windowInfo.beforeHi} vs {windowInfo.afterLo}–{windowInfo.afterHi})
                </span>
              )}
            </span>
          </label>

          <div style={s.legend}>
            <span><i style={{ ...s.dot, background: BEFORE_COLOR }} /> before</span>
            <span><i style={{ ...s.dot, background: AFTER_COLOR }} /> after</span>
            <span><i style={{ ...s.dot, background: FATAL_COLOR }} /> fatal</span>
            <span><i style={{ ...s.laneSwatch, background: LANE_COLOR }} /> bike lane</span>
          </div>
          <p style={s.source}>
            Green line = the protected bike lane ({data.meta.laneSource}). Each dot = a crash within{' '}
            {corridor.bufferM} m of it that hurt a cyclist or pedestrian ({data.meta.crashSource}).
          </p>
        </div>
      )}

      {loading && <div style={s.loading}>Loading crash data…</div>}
    </div>
  )
}

function BreakdownRow({ label, ba, note }: { label: string; ba: BeforeAfter; note?: string }) {
  const down = (ba.pct ?? 0) < 0
  return (
    <div style={s.breakdownRow}>
      <span style={s.breakdownLabel}>{label}</span>
      <span style={s.breakdownVals}>
        {ba.before.toFixed(0)} → {ba.after.toFixed(0)}
        <strong style={{ color: down ? '#16a34a' : '#b45309', marginLeft: 6 }}>{pct(ba.pct)}</strong>
        {note && !down && <span style={s.breakdownNote}> {note}</span>}
      </span>
    </div>
  )
}

function YearChart({
  corridor,
  citywide,
  meta,
}: {
  corridor: Corridor
  citywide: Record<string, YearStat>
  meta: Dataset['meta']
}) {
  const W = 226
  const H = 78
  const pad = { t: 6, r: 2, b: 14, l: 2 }
  const years: number[] = []
  for (let y = meta.firstFullYear; y <= meta.lastFullYear; y++) years.push(y)

  const corrBefore = corridor.summary.totalInjured.before
  const cityBefore = avgYears(citywide, meta.firstFullYear, corridor.installYear - 1, 'inj')

  const bars = years.map((y) => corridor.byYear[y]?.inj ?? 0)
  // Citywide expectation, scaled so it equals the corridor's pre-install average.
  const expected = years.map((y) =>
    cityBefore > 0 ? corrBefore * ((citywide[y]?.inj ?? 0) / cityBefore) : 0
  )
  const maxV = Math.max(...bars, ...expected, 1)

  const plotW = W - pad.l - pad.r
  const plotH = H - pad.t - pad.b
  const bw = plotW / years.length
  const x = (i: number) => pad.l + i * bw
  const yScale = (v: number) => pad.t + plotH * (1 - v / maxV)
  const installIdx = years.indexOf(corridor.installYear)
  const installX = installIdx >= 0 ? x(installIdx) + bw / 2 : null

  return (
    <div style={s.chartWrap}>
      <div style={s.chartTitle}>Total injuries per year</div>
      <svg width={W} height={H} style={{ display: 'block' }}>
        {/* bars */}
        {bars.map((v, i) => {
          const before = years[i] < corridor.installYear
          return (
            <rect
              key={i}
              x={x(i) + 1}
              y={yScale(v)}
              width={Math.max(bw - 2, 1)}
              height={pad.t + plotH - yScale(v)}
              fill={before ? BEFORE_COLOR : AFTER_COLOR}
              opacity={0.85}
            />
          )
        })}
        {/* citywide-expected line */}
        <polyline
          points={expected.map((v, i) => `${x(i) + bw / 2},${yScale(v)}`).join(' ')}
          fill="none"
          stroke="#444"
          strokeWidth={1.2}
          strokeDasharray="3 2"
        />
        {/* install marker */}
        {installX !== null && (
          <>
            <line x1={installX} y1={pad.t} x2={installX} y2={pad.t + plotH} stroke="#1a1a2e" strokeWidth={1} />
            <text x={installX} y={H - 3} fontSize={8} fill="#1a1a2e" textAnchor="middle" fontWeight={600}>
              lane in {corridor.installYear}
            </text>
          </>
        )}
        <text x={pad.l} y={H - 3} fontSize={8} fill="#aaa">{meta.firstFullYear}</text>
        <text x={W - pad.r} y={H - 3} fontSize={8} fill="#aaa" textAnchor="end">{meta.lastFullYear}</text>
      </svg>
      <div style={s.chartLegend}>
        <span><i style={{ ...s.dashLine }} /> if it tracked the city</span>
      </div>
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
    width: 258,
    maxHeight: 'calc(100vh - 32px)',
    overflowY: 'auto',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    fontFamily: 'system-ui, sans-serif',
  },
  title: { margin: '0 0 2px', fontSize: 16, fontWeight: 700, color: '#1a1a2e' },
  subtitle: { margin: '0 0 12px', fontSize: 12, color: '#888' },
  corridorList: { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 },
  corridorBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '6px 9px',
    border: '1px solid #ddd',
    borderRadius: 6,
    background: '#f7f7f7',
    color: '#444',
    cursor: 'pointer',
    textAlign: 'left',
  },
  corridorBtnActive: { background: '#1a1a2e', color: '#fff', border: '1px solid #1a1a2e' },
  corridorName: { fontSize: 12.5, fontWeight: 600 },
  corridorYear: { fontSize: 10, opacity: 0.7 },
  blurb: { fontSize: 11, color: '#666', lineHeight: 1.5, margin: '0 0 12px' },
  headlineRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 },
  bigNum: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  bigNumValue: { fontSize: 26, fontWeight: 700, color: '#1a1a2e', lineHeight: 1 },
  bigNumLabel: { fontSize: 9.5, color: '#999', marginTop: 2, textAlign: 'center' },
  arrow: { fontSize: 18, color: '#bbb' },
  compareBox: { background: '#f5f5f8', borderRadius: 6, padding: '8px 10px', marginBottom: 12 },
  compareRow: { display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#555', padding: '2px 0' },
  compareNet: { borderTop: '1px solid #e2e2ea', marginTop: 3, paddingTop: 5, fontWeight: 600, color: '#1a1a2e' },
  modeBreakdown: { marginBottom: 12 },
  breakdownRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 11, padding: '3px 0' },
  breakdownLabel: { color: '#666' },
  breakdownVals: { color: '#333', fontVariantNumeric: 'tabular-nums' },
  breakdownNote: { color: '#b45309', fontSize: 9.5, fontStyle: 'italic' },
  chartWrap: { marginBottom: 12 },
  chartTitle: { fontSize: 10.5, color: '#888', marginBottom: 3 },
  chartLegend: { fontSize: 9, color: '#999', marginTop: 2, display: 'flex', gap: 8 },
  dashLine: { display: 'inline-block', width: 14, height: 0, borderTop: '1.2px dashed #444', verticalAlign: 'middle', marginRight: 3 },
  modeRow: { display: 'flex', gap: 4, marginBottom: 8 },
  modeBtn: {
    flex: 1,
    padding: '5px 0',
    fontSize: 11,
    border: '1px solid #ddd',
    borderRadius: 5,
    background: '#f5f5f5',
    color: '#555',
    cursor: 'pointer',
  },
  modeBtnActive: { background: '#1a1a2e', color: '#fff', border: '1px solid #1a1a2e' },
  legend: { display: 'flex', gap: 12, fontSize: 10, color: '#777', marginBottom: 8 },
  dot: { display: 'inline-block', width: 9, height: 9, borderRadius: '50%', marginRight: 3, verticalAlign: 'middle' },
  laneSwatch: { display: 'inline-block', width: 14, height: 3, borderRadius: 2, marginRight: 3, verticalAlign: 'middle' },
  toggleRow: { display: 'flex', alignItems: 'center', marginBottom: 8, cursor: 'pointer' },
  toggleLabel: { fontSize: 11, color: '#555' },
  windowNote: { color: '#999', fontSize: 10 },
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
