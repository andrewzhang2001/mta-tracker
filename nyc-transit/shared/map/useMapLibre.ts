import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { BASEMAP_STYLE, NAV_CONTROL_POSITION } from './basemap'

type UseMapLibreOptions = {
  /** Initial center, [lng, lat]. Read once on mount; later changes are ignored. */
  center: [number, number]
  /** Initial zoom. Read once on mount; later changes are ignored. */
  zoom: number
  /** Runs on the map's `load` event. Add sources, layers and handlers here. */
  onLoad?: (map: maplibregl.Map) => void | Promise<void>
  /** Runs on unmount, before the map itself is torn down. */
  onCleanup?: () => void
}

/**
 * Creates the MapLibre instance every visualization starts from: shared basemap,
 * a NavigationControl, and teardown on unmount.
 *
 * Returns the map as a ref; feature effects drive it imperatively after load.
 */
export function useMapLibre({ center, zoom, onLoad, onCleanup }: UseMapLibreOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)

  // Latest-value refs so re-renders never re-run init. MapLibre reads
  // center/zoom only at construction, so they are snapshotted.
  const initRef = useRef({ center, zoom })
  const onLoadRef = useRef(onLoad)
  const onCleanupRef = useRef(onCleanup)
  onLoadRef.current = onLoad
  onCleanupRef.current = onCleanup

  useEffect(() => {
    if (!containerRef.current || map.current) return

    map.current = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP_STYLE,
      center: initRef.current.center,
      zoom: initRef.current.zoom,
    })

    map.current.addControl(new maplibregl.NavigationControl(), NAV_CONTROL_POSITION)

    map.current.on('load', () => {
      void onLoadRef.current?.(map.current!)
    })

    return () => {
      onCleanupRef.current?.()
      map.current?.remove()
      map.current = null
    }
  }, [])

  return { containerRef, map }
}
