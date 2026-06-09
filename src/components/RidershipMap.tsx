import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

interface Station {
  id: string
  name: string
  lat: number
  lng: number
  byHour: number[]
}

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const ampm = i < 12 ? 'AM' : 'PM'
  const h = i === 0 ? 12 : i > 12 ? i - 12 : i
  return `${h}:00 ${ampm}`
})

export default function RidershipMap() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [stations, setStations] = useState<Station[]>([])
  const [hour, setHour] = useState(8)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hovered, setHovered] = useState<{ name: string; riders: number } | null>(null)
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const maxByHour = useRef<number[]>([])

  // Advance one hour per tick
  const tick = useCallback(() => {
    setHour(h => (h + 1) % 24)
  }, [])

  useEffect(() => {
    if (playing) {
      playRef.current = setInterval(tick, 600)
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
      const data: Station[] = await res.json()

      // Precompute per-hour global max for consistent circle scaling
      const maxes = Array.from({ length: 24 }, (_, h) =>
        Math.max(...data.map(s => s.byHour[h]))
      )
      maxByHour.current = maxes

      const geojson = toGeoJSON(data, 8, maxes)
      map.current!.addSource('ridership', { type: 'geojson', data: geojson })
      map.current!.addLayer({
        id: 'ridership-circle',
        type: 'circle',
        source: 'ridership',
        paint: {
          'circle-radius': ['get', '_radius'],
          'circle-color': '#f59e0b',
          'circle-opacity': ['get', '_opacity'],
          'circle-stroke-color': '#92400e',
          'circle-stroke-width': 0.5,
          'circle-stroke-opacity': 0.4,
        },
      })

      map.current!.on('mousemove', 'ridership-circle', e => {
        if (!e.features?.length) return
        map.current!.getCanvas().style.cursor = 'pointer'
        const p = e.features[0].properties as { name: string; riders: number }
        setHovered({ name: p.name, riders: p.riders })
      })
      map.current!.on('mouseleave', 'ridership-circle', () => {
        map.current!.getCanvas().style.cursor = ''
        setHovered(null)
      })

      setStations(data)
      setLoading(false)
    })

    return () => { map.current?.remove(); map.current = null }
  }, [])

  // Update circles whenever hour changes
  useEffect(() => {
    if (!map.current || !stations.length) return
    const src = map.current.getSource('ridership') as maplibregl.GeoJSONSource | undefined
    if (src) src.setData(toGeoJSON(stations, hour, maxByHour.current))
  }, [hour, stations])

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      <Link to="/" style={s.backLink}>← All maps</Link>

      {/* Panel */}
      <div style={s.panel}>
        <h2 style={s.title}>24h Subway Ridership</h2>
        <p style={s.subtitle}>Weekday average · 2024</p>

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
      </div>

      {hovered && (
        <div style={s.tooltip}>
          <strong>{hovered.name}</strong>
          <div style={s.tooltipSub}>
            {hovered.riders.toLocaleString()} riders · {HOURS[hour]}
          </div>
        </div>
      )}

      {loading && <div style={s.loading}>Loading ridership data…</div>}
    </div>
  )
}

function toGeoJSON(stations: Station[], hour: number, maxes: number[]) {
  const max = maxes[hour] || 1
  return {
    type: 'FeatureCollection' as const,
    features: stations.map(s => {
      const riders = s.byHour[hour]
      const t = riders / max
      return {
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [s.lng, s.lat] },
        properties: {
          name:    s.name,
          riders,
          _radius:  2 + 22 * Math.sqrt(t),
          _opacity: 0.1 + 0.75 * t,
        },
      }
    }),
  }
}

const s: Record<string, React.CSSProperties> = {
  panel: {
    position: 'absolute',
    top: 16,
    left: 16,
    background: 'rgba(255,255,255,0.96)',
    borderRadius: 8,
    padding: '14px 16px 16px',
    width: 220,
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
    margin: '0 0 14px',
    fontSize: 11,
    color: '#888',
  },
  hourDisplay: {
    fontSize: 22,
    fontWeight: 700,
    color: '#92400e',
    marginBottom: 8,
    letterSpacing: '-0.5px',
  },
  slider: {
    width: '100%',
    accentColor: '#f59e0b',
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
    background: '#f59e0b',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
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
