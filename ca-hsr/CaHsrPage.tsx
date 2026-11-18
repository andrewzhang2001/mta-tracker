import type { CSSProperties } from 'react'
import maplibregl from 'maplibre-gl'
import { useNavigate } from 'react-router-dom'
import { useMapLibre } from '../shared/map/useMapLibre'
import { MapBackLink } from '../shared/map/MapBackLink'
import { places, type Place } from './data/places'
import { phasePath, phases } from './data/phases'
import { PhaseLegend } from './PhaseLegend'

/** Center of the bounding box around every point given. */
function midpointOf(points: [number, number][]): [number, number] {
  const lngs = points.map(([lng]) => lng)
  const lats = points.map(([, lat]) => lat)
  return [
    (Math.min(...lngs) + Math.max(...lngs)) / 2,
    (Math.min(...lats) + Math.max(...lats)) / 2,
  ]
}

const MAP_CENTER = midpointOf(places.map(place => place.coordinates))
const MAP_ZOOM = 6.3

// The basemap draws state lines only from zoom 8, dashed and faint. This layer
// draws them at every zoom from the same OpenMapTiles `boundary` source layer,
// where admin_level 4 is a US state.
const STATE_BORDER_LAYER: maplibregl.LineLayerSpecification = {
  id: 'state-borders',
  type: 'line',
  source: 'openmaptiles',
  'source-layer': 'boundary',
  filter: ['all', ['==', ['get', 'admin_level'], 4], ['!=', ['get', 'maritime'], 1]],
  paint: {
    'line-color': '#6a6a88',
    'line-width': 1.4,
  },
}

function coordinatesOf(placeName: string) {
  const place = places.find(p => p.name === placeName)
  if (!place) throw new Error(`no place named ${placeName}`)
  return place.coordinates
}

// Straight lines between consecutive stops: a schematic of the route, not the
// surveyed alignment.
const PHASE_LINES: GeoJSON.FeatureCollection<GeoJSON.LineString> = {
  type: 'FeatureCollection',
  features: phases.map(phase => ({
    type: 'Feature',
    properties: { scenario: phase.scenario, color: phase.color },
    geometry: { type: 'LineString', coordinates: phase.stops.map(coordinatesOf) },
  })),
}

const LINE_JOIN: maplibregl.LineLayerSpecification['layout'] = { 'line-join': 'round', 'line-cap': 'round' }

const LINE_WIDTH = 4
const HOVERED_LINE_WIDTH = 7
const CASING_EXTRA_WIDTH = 3
const DIMMED_OPACITY = 0.3

// A white casing under each line keeps it legible over basemap roads and
// separates two phases where they meet.
const PHASE_CASING_LAYER: maplibregl.LineLayerSpecification = {
  id: 'phase-casing',
  type: 'line',
  source: 'phases',
  layout: LINE_JOIN,
  paint: { 'line-color': '#fff', 'line-width': LINE_WIDTH + CASING_EXTRA_WIDTH },
}

const PHASE_LINE_LAYER: maplibregl.LineLayerSpecification = {
  id: 'phase-lines',
  type: 'line',
  source: 'phases',
  layout: LINE_JOIN,
  paint: { 'line-color': ['get', 'color'], 'line-width': LINE_WIDTH },
}

// Transparent and wide, so the pointer catches a phase from roughly near its line.
const PHASE_HIT_LAYER: maplibregl.LineLayerSpecification = {
  id: 'phase-hit',
  type: 'line',
  source: 'phases',
  layout: LINE_JOIN,
  paint: { 'line-color': '#000', 'line-opacity': 0, 'line-width': 24 },
}

/** Thickens the hovered phase and dims the rest; `null` restores every line. */
function highlightPhase(map: maplibregl.Map, scenario: string | null) {
  const isHovered: maplibregl.ExpressionSpecification = ['==', ['get', 'scenario'], scenario ?? '']
  const lineWidth: maplibregl.DataDrivenPropertyValueSpecification<number> =
    scenario ? ['case', isHovered, HOVERED_LINE_WIDTH, LINE_WIDTH] : LINE_WIDTH
  const casingWidth: maplibregl.DataDrivenPropertyValueSpecification<number> =
    scenario ? ['case', isHovered, HOVERED_LINE_WIDTH + CASING_EXTRA_WIDTH, LINE_WIDTH + CASING_EXTRA_WIDTH] : LINE_WIDTH + CASING_EXTRA_WIDTH
  const opacity: maplibregl.DataDrivenPropertyValueSpecification<number> =
    scenario ? ['case', isHovered, 1, DIMMED_OPACITY] : 1

  map.setPaintProperty(PHASE_LINE_LAYER.id, 'line-width', lineWidth)
  map.setPaintProperty(PHASE_LINE_LAYER.id, 'line-opacity', opacity)
  map.setPaintProperty(PHASE_CASING_LAYER.id, 'line-width', casingWidth)
  map.setPaintProperty(PHASE_CASING_LAYER.id, 'line-opacity', opacity)
}

const scenarioUnder = (event: maplibregl.MapLayerMouseEvent): string | undefined =>
  event.features?.[0]?.properties?.scenario

function placeMarkerElement(place: Place) {
  const el = document.createElement('div')
  Object.assign(el.style, placeMarkerStyle)
  const dot = document.createElement('span')
  Object.assign(dot.style, placeDotStyle)
  el.append(dot, place.name)
  return el
}

function phasePathOf(scenario: string) {
  const phase = phases.find(p => p.scenario === scenario)
  if (!phase) throw new Error(`no phase for scenario ${scenario}`)
  return phasePath(phase)
}

export default function CaHsrPage() {
  const navigate = useNavigate()
  const { containerRef } = useMapLibre({
    center: MAP_CENTER,
    zoom: MAP_ZOOM,
    onLoad: map => {
      map.addLayer(STATE_BORDER_LAYER)
      map.addSource('phases', { type: 'geojson', data: PHASE_LINES })
      map.addLayer(PHASE_CASING_LAYER)
      map.addLayer(PHASE_LINE_LAYER)
      map.addLayer(PHASE_HIT_LAYER)

      let hoveredScenario: string | null = null
      map.on('mousemove', PHASE_HIT_LAYER.id, event => {
        const scenario = scenarioUnder(event) ?? null
        if (scenario === hoveredScenario) return
        hoveredScenario = scenario
        highlightPhase(map, scenario)
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', PHASE_HIT_LAYER.id, () => {
        hoveredScenario = null
        highlightPhase(map, null)
        map.getCanvas().style.cursor = ''
      })
      map.on('click', PHASE_HIT_LAYER.id, event => {
        const scenario = scenarioUnder(event)
        if (scenario) navigate(phasePathOf(scenario))
      })
      for (const place of places) {
        new maplibregl.Marker({ element: placeMarkerElement(place), anchor: 'left' })
          .setLngLat(place.coordinates)
          .addTo(map)
      }
    },
  })

  return (
    <div style={pageStyle}>
      <div ref={containerRef} style={mapStyle} />
      <MapBackLink to="/" label="← All projects" />
      <h1 style={titleStyle}>California High-Speed Rail</h1>
      <PhaseLegend />
    </div>
  )
}

const pageStyle: CSSProperties = { position: 'relative', height: '100%' }

const mapStyle: CSSProperties = { position: 'absolute', inset: 0 }

const titleStyle: CSSProperties = {
  position: 'absolute',
  top: 16,
  left: 16,
  margin: 0,
  background: 'rgba(255,255,255,0.95)',
  color: '#1a1a2e',
  fontFamily: 'system-ui, sans-serif',
  fontSize: 16,
  fontWeight: 600,
  padding: '8px 14px',
  borderRadius: 6,
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  zIndex: 10,
}

// `anchor: 'left'` pins the marker's left edge to the place; the negative margin
// shifts it by half the dot's 14px outer width so the dot's center sits there.
const placeMarkerStyle: Partial<CSSStyleDeclaration> = {
  marginLeft: '-7px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontFamily: 'system-ui, sans-serif',
  fontSize: '13px',
  fontWeight: '600',
  color: '#1a1a2e',
  textShadow: '0 0 3px #fff, 0 0 3px #fff',
}

const placeDotStyle: Partial<CSSStyleDeclaration> = {
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  background: '#1a1a2e',
  border: '2px solid #fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
}
