import type { CSSProperties } from 'react'
import { MapBackLink } from '../../../shared/map/MapBackLink'

// Overlay chrome shared by every NYC map: the link home and the loading card.

const loadingStyle: CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%,-50%)',
  background: 'rgba(255,255,255,0.9)',
  padding: '12px 20px',
  borderRadius: 6,
  fontSize: 14,
  color: '#333',
}

export function BackLink() {
  return <MapBackLink to="/nyc-transit" label="← All maps" />
}

export function LoadingOverlay({ message }: { message: string }) {
  return <div style={loadingStyle}>{message}</div>
}
