import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMapLibre } from '../shared/map/useMapLibre'
import { MapBackLink } from '../shared/map/MapBackLink'
import { places } from './data/places'
import { phasePath } from './data/phases'
import { PhaseLegend } from './PhaseLegend'
import { addPhaseLines, addPlaceMarkers, midpointOf } from './phaseMap'

const MAP_CENTER = midpointOf(places.map(place => place.coordinates))
const MAP_ZOOM = 6.3

export default function CaHsrPage() {
  const navigate = useNavigate()
  const { containerRef } = useMapLibre({
    center: MAP_CENTER,
    zoom: MAP_ZOOM,
    onLoad: map => {
      addPhaseLines(map, { onPhaseClick: phase => navigate(phasePath(phase)) })
      addPlaceMarkers(map, places)
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
