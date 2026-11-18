import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { phasePath, phases } from './data/phases'
import { formatBillions } from './format'

/** One row per phase: its color, the track it adds, and what that adds to the total. */
export function PhaseLegend() {
  return (
    <div style={legendStyle}>
      <div style={headingStyle}>2026 Business Plan scenarios (P65, YOE $)</div>
      {phases.map((phase, index) => {
        const isFirst = index === 0
        return (
          <Link key={phase.scenario} to={phasePath(phase)} style={rowStyle}>
            <span style={{ ...swatchStyle, background: phase.color }} />
            <span style={labelStyle}>{isFirst ? phase.label : `+ ${phase.label}`}</span>
            <span style={amountStyle}>
              {isFirst ? '' : '+'}{formatBillions(phase.addedMusd)}
            </span>
            <span style={totalStyle}>{formatBillions(phase.totalMusd)} total</span>
          </Link>
        )
      })}
    </div>
  )
}

const legendStyle: CSSProperties = {
  position: 'absolute',
  bottom: 32,
  left: 16,
  display: 'grid',
  gap: 6,
  background: 'rgba(255,255,255,0.95)',
  color: '#1a1a2e',
  fontFamily: 'system-ui, sans-serif',
  fontSize: 13,
  padding: '10px 14px',
  borderRadius: 6,
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  zIndex: 10,
}

const headingStyle: CSSProperties = { fontWeight: 600, marginBottom: 2 }

const rowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '22px 1fr auto auto',
  alignItems: 'center',
  columnGap: 10,
  color: 'inherit',
  textDecoration: 'none',
}

const swatchStyle: CSSProperties = { height: 4, borderRadius: 2 }

const labelStyle: CSSProperties = { whiteSpace: 'nowrap' }

const amountStyle: CSSProperties = { fontVariantNumeric: 'tabular-nums', fontWeight: 600, textAlign: 'right' }

const totalStyle: CSSProperties = { fontVariantNumeric: 'tabular-nums', color: '#5a5a70', textAlign: 'right' }
