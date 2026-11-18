import type { CSSProperties } from 'react'
import { formatShare, formatUsd } from '../format'

export type PieSlice = { id: string; label: string; amountUsd: number; color: string }

type PieChartProps = {
  slices: PieSlice[]
  /** Width and height in px. */
  size?: number
  /** Slice to draw emphasized; the rest fade. */
  highlightedId: string | null
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
}

const DEFAULT_SIZE = 260
const EDGE_INSET_PX = 4
const FADED_OPACITY = 0.35

function pointOnCircle(size: number, fraction: number) {
  const center = size / 2
  const radius = center - EDGE_INSET_PX
  // Fraction 0 is 12 o'clock; slices run clockwise.
  const angle = fraction * 2 * Math.PI - Math.PI / 2
  return [center + radius * Math.cos(angle), center + radius * Math.sin(angle)]
}

function slicePath(size: number, startFraction: number, endFraction: number) {
  const center = size / 2
  const radius = center - EDGE_INSET_PX
  const [x0, y0] = pointOnCircle(size, startFraction)
  const [x1, y1] = pointOnCircle(size, endFraction)
  const largeArc = endFraction - startFraction > 0.5 ? 1 : 0
  return `M ${center} ${center} L ${x0} ${y0} A ${radius} ${radius} 0 ${largeArc} 1 ${x1} ${y1} Z`
}

/** Pie of one budget level. A white 2px stroke separates the slices. */
export function PieChart({ slices, size = DEFAULT_SIZE, highlightedId, onHover, onSelect }: PieChartProps) {
  const total = slices.reduce((sum, slice) => sum + slice.amountUsd, 0)
  const highlighted = slices.find(slice => slice.id === highlightedId)

  let startFraction = 0
  const arcs = slices.map(slice => {
    const endFraction = startFraction + slice.amountUsd / total
    const arc = { slice, path: slicePath(size, startFraction, endFraction) }
    startFraction = endFraction
    return arc
  })

  return (
    <figure style={figureStyle}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} onMouseLeave={() => onHover(null)}>
        {arcs.map(({ slice, path }) => (
          <path
            key={slice.id}
            d={path}
            fill={slice.color}
            stroke="#fff"
            strokeWidth={2}
            strokeLinejoin="round"
            opacity={highlightedId && highlightedId !== slice.id ? FADED_OPACITY : 1}
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => onHover(slice.id)}
            onClick={() => onSelect(slice.id)}
          >
            <title>{`${slice.label}: ${formatUsd(slice.amountUsd)}`}</title>
          </path>
        ))}
      </svg>
      <figcaption style={{ ...captionStyle, maxWidth: size }}>
        {highlighted ? (
          <>
            <strong style={captionValueStyle}>{formatUsd(highlighted.amountUsd)}</strong>
            <span>{formatShare(highlighted.amountUsd, total)} · {highlighted.label}</span>
          </>
        ) : (
          <span>Hover a slice or row</span>
        )}
      </figcaption>
    </figure>
  )
}

const figureStyle: CSSProperties = { display: 'grid', justifyItems: 'center', gap: 12, margin: 0 }

const captionStyle: CSSProperties = {
  display: 'grid',
  justifyItems: 'center',
  gap: 2,
  minHeight: 44,
  textAlign: 'center',
  color: '#5a5a70',
  fontSize: 13,
}

const captionValueStyle: CSSProperties = { color: '#1a1a2e', fontSize: 20, fontVariantNumeric: 'tabular-nums' }
