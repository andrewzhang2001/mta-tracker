import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { scaleSequential } from 'd3-scale'
import { interpolateRdYlGn } from 'd3-scale-chromatic'
import type { GeoJSONSource } from 'maplibre-gl'

interface TractProps {
  geoid: string
  population: number | null
  density: number | null
  nearest_stop: string
  distance_km: number
  headway_min: number
  access_min: number
}

interface Stop {
  id: string
  name: string
  lat: number
  lng: number
  headway_min: number
}

// Access score domain (minutes to board a train): green=fast, red=slow
const MIN_SCORE = 1
const MAX_SCORE = 60  // cap so outer Staten Island doesn't wash out everything else

const colorScale = scaleSequential(interpolateRdYlGn).domain([MAX_SCORE, MIN_SCORE])

function scoreToColor(score: number): string {
  return colorScale(Math.min(score, MAX_SCORE))
}

// Opacity scales with sqrt(population) so dense tracts stand out.
// Parks/airports (pop≈0) fade to near-invisible; busy tracts are fully visible.
function popToOpacity(pop: number | null, maxPop: number): number {
  if (!pop || maxPop === 0) return 0.08
  return 0.15 + 0.7 * Math.sqrt(pop / maxPop)
}

export default function TransitGapMap() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const popup = useRef<maplibregl.Popup | null>(null)
  const [loading, setLoading] = useState(true)
  const [hovered, setHovered] = useState<TractProps | null>(null)

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/positron',
      center: [-73.97, 40.73],
      zoom: 10,
    })

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')

    popup.current = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
    })

    map.current.on('load', async () => {
      const [tractsRes, stopsRes] = await Promise.all([
        fetch('/data/tracts.geojson'),
        fetch('/data/stops.json'),
      ])
      const tracts = await tractsRes.json()
      const stops: Stop[] = await stopsRes.json()

      // Pre-compute color + opacity and embed as properties for MapLibre
      const maxDensity = Math.max(...tracts.features.map(
        (f: { properties: TractProps }) => f.properties.density ?? 0
      ))
      for (const f of tracts.features) {
        const score: number = f.properties.access_min ?? MAX_SCORE
        f.properties._color   = scoreToColor(score)
        f.properties._opacity = popToOpacity(f.properties.density, maxDensity)
      }

      // Census tract fill layer
      map.current!.addSource('tracts', { type: 'geojson', data: tracts })
      map.current!.addLayer({
        id: 'tracts-fill',
        type: 'fill',
        source: 'tracts',
        paint: {
          'fill-color': ['get', '_color'],
          'fill-opacity': ['get', '_opacity'],
        },
      })
      map.current!.addLayer({
        id: 'tracts-outline',
        type: 'line',
        source: 'tracts',
        paint: {
          'line-color': '#ffffff',
          'line-width': 0.3,
          'line-opacity': 0.4,
        },
      })

      // Subway station dots sized by headway (smaller = more frequent)
      const stopsGeoJSON = {
        type: 'FeatureCollection' as const,
        features: stops.map(s => ({
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [s.lng, s.lat] },
          properties: s,
        })),
      }
      map.current!.addSource('stops', { type: 'geojson', data: stopsGeoJSON })
      map.current!.addLayer({
        id: 'stops-circle',
        type: 'circle',
        source: 'stops',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'],
            9, 2,
            13, 5,
          ],
          'circle-color': '#1a1a2e',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1,
          'circle-opacity': 0.85,
        },
      })

      // Hover interaction on tracts
      map.current!.on('mousemove', 'tracts-fill', (e) => {
        if (!e.features?.length) return
        map.current!.getCanvas().style.cursor = 'crosshair'
        const props = e.features[0].properties as TractProps
        setHovered(props)
      })
      map.current!.on('mouseleave', 'tracts-fill', () => {
        map.current!.getCanvas().style.cursor = ''
        setHovered(null)
      })

      setLoading(false)
    })

    return () => { map.current?.remove(); map.current = null }
  }, [])

  // Force GeoJSON source re-render when tracts layer updates (cleanup on unmount handled above)
  useEffect(() => {
    if (!map.current) return
    const src = map.current.getSource('tracts') as GeoJSONSource | undefined
    if (src) src.setData(src['_data' as keyof typeof src] as Parameters<typeof src.setData>[0])
  }, [])

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* Title + legend */}
      <div style={styles.panel}>
        <h2 style={styles.title}>NYC Transit Access Gap</h2>
        <p style={styles.subtitle}>
          Expected minutes to board a subway train · opacity = population
        </p>
        <div style={styles.legend}>
          <div style={styles.legendBar} />
          <div style={styles.legendLabels}>
            <span>1 min</span>
            <span>30 min</span>
            <span>60+ min</span>
          </div>
        </div>
      </div>

      {/* Hover tooltip */}
      {hovered && (
        <div style={styles.tooltip}>
          <strong>{hovered.nearest_stop}</strong>
          <div>{hovered.access_min} min to board</div>
          <div style={styles.tooltipSub}>
            {hovered.distance_km} km walk · {hovered.headway_min} min headway
            {hovered.population != null && ` · pop. ${hovered.population.toLocaleString()}`}
          </div>
        </div>
      )}

      {loading && (
        <div style={styles.loading}>Loading transit data…</div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    position: 'absolute',
    top: 16,
    left: 16,
    background: 'rgba(255,255,255,0.95)',
    borderRadius: 8,
    padding: '14px 16px',
    maxWidth: 240,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    fontFamily: 'system-ui, sans-serif',
  },
  title: {
    margin: '0 0 4px',
    fontSize: 15,
    fontWeight: 700,
    color: '#1a1a2e',
  },
  subtitle: {
    margin: '0 0 12px',
    fontSize: 11,
    color: '#555',
    lineHeight: 1.4,
  },
  legend: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  legendBar: {
    height: 10,
    borderRadius: 4,
    background: 'linear-gradient(to right, #006837, #ffffbf, #a50026)',
  },
  legendLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 10,
    color: '#555',
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
