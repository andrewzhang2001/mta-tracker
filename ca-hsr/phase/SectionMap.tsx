import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMapLibre } from '../../shared/map/useMapLibre'
import { phasePath, type Phase } from '../data/phases'
import { addPhaseLines, addPlaceMarkers, boundsOf, midpointOf, placeNamed } from '../phaseMap'

const FIT_PADDING_PX = 48
// Placeholder until `fitBounds` runs on load.
const INITIAL_ZOOM = 7

/** A map zoomed to one phase's track, with that phase highlighted and the rest dimmed. */
export function SectionMap({ phase }: { phase: Phase }) {
  const navigate = useNavigate()
  const stops = phase.stops.map(placeNamed)
  const stopCoordinates = stops.map(stop => stop.coordinates)

  const { containerRef } = useMapLibre({
    center: midpointOf(stopCoordinates),
    zoom: INITIAL_ZOOM,
    onLoad: map => {
      map.fitBounds(boundsOf(stopCoordinates), { padding: FIT_PADDING_PX, animate: false })
      addPhaseLines(map, {
        restingScenario: phase.scenario,
        onPhaseClick: clicked => navigate(phasePath(clicked)),
      })
      addPlaceMarkers(map, stops)
    },
  })

  return <div ref={containerRef} style={mapStyle} />
}

const mapStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  borderRadius: 8,
  overflow: 'hidden',
  boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
}
