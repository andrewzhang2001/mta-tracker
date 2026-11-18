import { useState, type CSSProperties } from 'react'
import { formatShare, formatUsd } from '../format'
import type { BudgetNode } from './budgetTree'
import { PieChart, type PieSlice } from './PieChart'

// Categorical slots in fixed order, validated together for color-vision
// deficiency separation. Rows past the sixth share the "Other" gray.
const SLICE_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300']
const OTHER_COLOR = '#a3a3ad'
const OTHER_ID = 'other'

const isDrillable = (node: BudgetNode) => node.children.length >= 2

const colorOfRow = (index: number) => SLICE_COLORS[index] ?? OTHER_COLOR

/** Slices for the first six children, then one "Other" slice for the rest. */
function slicesOf(children: BudgetNode[]): PieSlice[] {
  const named = children.slice(0, SLICE_COLORS.length).map((child, index) => ({
    id: child.id,
    label: child.label,
    amountUsd: child.amountUsd,
    color: SLICE_COLORS[index],
  }))
  const rest = children.slice(SLICE_COLORS.length)
  if (rest.length === 0) return named
  const otherUsd = rest.reduce((sum, child) => sum + child.amountUsd, 0)
  return [...named, { id: OTHER_ID, label: `Other (${rest.length} items)`, amountUsd: otherUsd, color: OTHER_COLOR }]
}

/**
 * Drill-down from a scenario total to its line items: a list of the current
 * level's parts on the left, the same parts as a pie on the right.
 */
export function BudgetBreakdown({ root }: { root: BudgetNode }) {
  const [path, setPath] = useState<BudgetNode[]>([root])
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const current = path[path.length - 1]
  const slices = slicesOf(current.children)

  const drillInto = (node: BudgetNode) => {
    if (!isDrillable(node)) return
    setPath([...path, node])
    setHoveredId(null)
  }
  const goBackTo = (depth: number) => {
    setPath(path.slice(0, depth + 1))
    setHoveredId(null)
  }
  const selectSlice = (id: string) => {
    const child = current.children.find(node => node.id === id)
    if (child) drillInto(child)
  }
  // Hovering a row folded into "Other" highlights the Other slice.
  const sliceIdOfRow = (index: number, node: BudgetNode) => (index < SLICE_COLORS.length ? node.id : OTHER_ID)

  return (
    <section style={layoutStyle}>
      <div>
        <Breadcrumbs path={path} onSelect={goBackTo} />
        <div style={currentTotalStyle}>{formatUsd(current.amountUsd)}</div>
        <ol style={listStyle}>
          {current.children.map((node, index) => (
            <BreakdownRow
              key={node.id}
              node={node}
              color={colorOfRow(index)}
              shareOfParent={formatShare(node.amountUsd, current.amountUsd)}
              isHighlighted={hoveredId === sliceIdOfRow(index, node)}
              onHover={isHovered => setHoveredId(isHovered ? sliceIdOfRow(index, node) : null)}
              onSelect={() => drillInto(node)}
            />
          ))}
        </ol>
      </div>
      {slices.length >= 2 && (
        <div style={pieColumnStyle}>
          <PieChart slices={slices} highlightedId={hoveredId} onHover={setHoveredId} onSelect={selectSlice} />
        </div>
      )}
    </section>
  )
}

function Breadcrumbs({ path, onSelect }: { path: BudgetNode[]; onSelect: (depth: number) => void }) {
  return (
    <nav style={breadcrumbsStyle}>
      {path.map((node, depth) => {
        const isLast = depth === path.length - 1
        return (
          <span key={node.id}>
            {isLast ? (
              <span style={breadcrumbCurrentStyle}>{node.label}</span>
            ) : (
              <button type="button" style={breadcrumbLinkStyle} onClick={() => onSelect(depth)}>{node.label}</button>
            )}
            {!isLast && <span style={breadcrumbSeparatorStyle}> › </span>}
          </span>
        )
      })}
    </nav>
  )
}

type BreakdownRowProps = {
  node: BudgetNode
  color: string
  shareOfParent: string
  isHighlighted: boolean
  onHover: (isHovered: boolean) => void
  onSelect: () => void
}

function BreakdownRow({ node, color, shareOfParent, isHighlighted, onHover, onSelect }: BreakdownRowProps) {
  const drillable = isDrillable(node)
  const onlyChild = node.children.length === 1 ? node.children[0] : null
  return (
    <li>
      <button
        type="button"
        disabled={!drillable}
        style={{ ...rowStyle, ...(isHighlighted ? rowHighlightedStyle : {}), cursor: drillable ? 'pointer' : 'default' }}
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
        onFocus={() => onHover(true)}
        onBlur={() => onHover(false)}
        onClick={onSelect}
      >
        <span style={{ ...swatchStyle, background: color }} />
        <span style={rowLabelStyle}>
          {node.label}
          {onlyChild && <span style={rowNoteStyle}>{onlyChild.label}</span>}
        </span>
        <span style={rowAmountStyle}>{formatUsd(node.amountUsd)}</span>
        <span style={rowShareStyle}>{shareOfParent}</span>
        <span style={chevronStyle}>{drillable ? '›' : ''}</span>
      </button>
    </li>
  )
}

const layoutStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: 32,
  alignItems: 'start',
  marginTop: 16,
}

const pieColumnStyle: CSSProperties = { position: 'sticky', top: 16 }

const breadcrumbsStyle: CSSProperties = { fontSize: 13, color: '#5a5a70' }

const breadcrumbLinkStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  color: '#2a5fb0',
  font: 'inherit',
  cursor: 'pointer',
}

const breadcrumbCurrentStyle: CSSProperties = { color: '#1a1a2e', fontWeight: 600 }

const breadcrumbSeparatorStyle: CSSProperties = { color: '#a3a3ad' }

const currentTotalStyle: CSSProperties = { fontSize: 24, fontWeight: 600, fontVariantNumeric: 'tabular-nums', margin: '6px 0 10px' }

const listStyle: CSSProperties = { listStyle: 'none', display: 'grid', gap: 2 }

const rowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '12px minmax(0, 1fr) auto 52px 12px',
  alignItems: 'center',
  columnGap: 10,
  width: '100%',
  padding: '8px 8px',
  background: 'none',
  border: 'none',
  borderBottom: '1px solid #e4e4ea',
  borderRadius: 4,
  color: '#1a1a2e',
  font: 'inherit',
  fontSize: 14,
  textAlign: 'left',
}

const rowHighlightedStyle: CSSProperties = { background: '#f1f1f5' }

const swatchStyle: CSSProperties = { width: 12, height: 12, borderRadius: 3 }

const rowLabelStyle: CSSProperties = { display: 'grid', gap: 2 }

const rowNoteStyle: CSSProperties = { color: '#5a5a70', fontSize: 12 }

const rowAmountStyle: CSSProperties = { fontVariantNumeric: 'tabular-nums', fontWeight: 600, textAlign: 'right' }

const rowShareStyle: CSSProperties = { fontVariantNumeric: 'tabular-nums', color: '#5a5a70', textAlign: 'right' }

const chevronStyle: CSSProperties = { color: '#a3a3ad', fontSize: 18 }
