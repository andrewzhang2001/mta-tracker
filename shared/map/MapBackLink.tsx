import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'

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

/** The overlay link from a full-screen map back to its parent page. */
export function MapBackLink({ to, label }: { to: string; label: string }) {
  return <Link to={to} style={backLinkStyle}>{label}</Link>
}
