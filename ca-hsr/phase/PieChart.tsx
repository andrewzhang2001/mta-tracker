import type { CSSProperties } from 'react'
import { formatShare, formatUsd } from '../format'

export type PieSlice = { id: string; label: string; amountUsd: number; color: string }

type PieChartProps = {
  slices: PieSlice[]
  /** Slice to draw emphasized; the rest fade. */
  highlightedId: string | null
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
}

const SIZE = 260
const RADIUS = SIZE / 2 - 4
const CENTER = SIZE / 2
const FADED_OPACITY = 0.35

function pointOnCircle(fraction: number) {
  // Fraction 0 is 12 o'clock; slices run clockwise.
  const angle = fraction * 2 * Math.PI - Math.PI / 2
  return [CENTER + RADIUS * Math.cos(angle), CENTER + RADIUS * Math.sin(angle)]
}

function slicePath(startFraction: number, endFraction: number) {
  const [x0, y0] = pointOnCircle(startFraction)
  const [x1, y1] = pointOnCircle(endFraction)
  const largeArc = endFraction - startFraction > 0.5 ? 1 : 0
  return `M ${CENTER} ${CENTER} L ${x0} ${y0} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x1} ${y1} Z`
}

/** Pie of one budget level. A white 2px stroke separates the slices. */
export function PieChart({ slices, highlightedId, onHover, onSelect }: PieChartProps) {
  const total = slices.reduce((sum, slice) => sum + slice.amountUsd, 0)
  const highlighted = slices.find(slice => slice.id === highlightedId)

  let startFraction = 0
  const arcs = slices.map(slice => {
    const endFraction = startFraction + slice.amountUsd / total
    const arc = { slice, path: slicePath(startFraction, endFraction) }
    startFraction = endFraction
    return arc
  })

  return (
    <figure style={figureStyle}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} onMouseLeave={() => onHover(null)}>
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
      <figcaption style={captionStyle}>
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
  maxWidth: SIZE,
  textAlign: 'center',
  color: '#5a5a70',
  fontSize: 13,
}

const captionValueStyle: CSSProperties = { color: '#1a1a2e', fontSize: 20, fontVariantNumeric: 'tabular-nums' }
