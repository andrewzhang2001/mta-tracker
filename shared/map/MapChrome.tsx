import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'

// Overlay chrome shared by every map: the link home and the loading card.

// `right: 52` clears the NavigationControl, which sits at top-right.
const backLinkStyle: CSSProperties = {
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
}

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
  return <Link to="/" style={backLinkStyle}>← All maps</Link>
}

export function LoadingOverlay({ message }: { message: string }) {
  return <div style={loadingStyle}>{message}</div>
}
