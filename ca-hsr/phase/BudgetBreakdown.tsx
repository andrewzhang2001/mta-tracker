import { useState, type CSSProperties } from 'react'
import { formatShare, formatUsd } from '../format'
import type { BudgetNode } from './budgetTree'
import { PieChart, type PieSlice } from './PieChart'

// Categorical slots in fixed order, validated together for color-vision
// deficiency separation. Rows past the sixth share the "Other" gray.
const SLICE_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300']
const OTHER_COLOR = '#a3a3ad'
const OTHER_ID = 'other'

const isExpandable = (node: BudgetNode) => node.children.length >= 2

const colorOfRow = (index: number) => SLICE_COLORS[index] ?? OTHER_COLOR

const sumOf = (nodes: BudgetNode[]) => nodes.reduce((sum, node) => sum + node.amountUsd, 0)

const isReduction = (node: BudgetNode) => node.amountUsd < 0

/**
 * A node's children split by sign. Children are sorted largest first, so the
 * increases keep their order and the reductions follow.
 */
function partsOf(node: BudgetNode) {
  const increases = node.children.filter(child => !isReduction(child))
  const reductions = node.children.filter(isReduction)
  return { increases, reductions, increasesUsd: sumOf(increases) }
}

/** Slice that draws the increase at `index`: its own for the first six, else "Other". */
const sliceIdOf = (index: number, node: BudgetNode) => (index < SLICE_COLORS.length ? node.id : OTHER_ID)

/** Slice that draws `child` in `parent`'s pie; `null` for a reduction, which has none. */
function sliceIdOfChild(parent: BudgetNode, child: BudgetNode) {
  const index = partsOf(parent).increases.findIndex(candidate => candidate.id === child.id)
  return index === -1 ? null : sliceIdOf(index, child)
}

/** Slices for the first six increases, then one "Other" slice for the rest. */
function slicesOf(increases: BudgetNode[]): PieSlice[] {
  const named = increases.slice(0, SLICE_COLORS.length).map((child, index) => ({
    id: child.id,
    label: child.label,
    amountUsd: child.amountUsd,
    color: SLICE_COLORS[index],
  }))
  const rest = increases.slice(SLICE_COLORS.length)
  if (rest.length === 0) return named
  return [...named, { id: OTHER_ID, label: `Other (${rest.length} items)`, amountUsd: sumOf(rest), color: OTHER_COLOR }]
}

/** A slice under the pointer, in the pie for the level at `depth`. */
type Hover = { depth: number; sliceId: string } | null

type LevelProps = {
  /** Ancestors of the deepest open row; `openPath[d]` is the open row at depth `d`. */
  openPath: BudgetNode[]
  hovered: Hover
  onHover: (hover: Hover) => void
  onToggle: (depth: number, node: BudgetNode) => void
}

/**
 * Accordion from a total to its line items. Opening a row lists its parts
 * inline beneath it, indented, and closes any open sibling. The right column
 * holds one pie per open level: the open row's slice stays lit and the rest dim.
 *
 * Parts can be negative when the tree holds the difference between two
 * scenarios. Those rows sit below the increases, take no color or share, and
 * stay out of the pie; shares and slices are of the increases alone.
 */
export function BudgetBreakdown({ root }: { root: BudgetNode }) {
  const [openPath, setOpenPath] = useState<BudgetNode[]>([])
  const [hovered, setHovered] = useState<Hover>(null)

  const toggle = (depth: number, node: BudgetNode) => {
    if (!isExpandable(node)) return
    const isOpen = openPath[depth]?.id === node.id
    setOpenPath(isOpen ? openPath.slice(0, depth) : [...openPath.slice(0, depth), node])
    setHovered(null)
  }
  const levelProps: LevelProps = { openPath, hovered, onHover: setHovered, onToggle: toggle }
  const levelsWithPies = [root, ...openPath]

  return (
    <section style={layoutStyle}>
      <div>
        <div style={rootTotalStyle}>{formatUsd(root.amountUsd)}</div>
        <BreakdownLevel node={root} depth={0} {...levelProps} />
      </div>
      <div style={pieColumnStyle}>
        {levelsWithPies.map((node, depth) => (
          <LevelPie key={node.id} node={node} depth={depth} {...levelProps} />
        ))}
      </div>
    </section>
  )
}

/** The rows for `node`'s children, with the open one's parts nested beneath it. */
function BreakdownLevel({ node, depth, ...levelProps }: LevelProps & { node: BudgetNode; depth: number }) {
  const { openPath, hovered, onHover, onToggle } = levelProps
  const { increases, reductions, increasesUsd } = partsOf(node)
  const isHoveredSlice = (sliceId: string) => hovered?.depth === depth && hovered.sliceId === sliceId

  const rowOf = (child: BudgetNode, swatch: CSSProperties, share: string, sliceId: string | null) => {
    const isOpen = openPath[depth]?.id === child.id
    return (
      <li key={child.id}>
        <BreakdownRow
          node={child}
          swatchStyle={swatch}
          share={share}
          isOpen={isOpen}
          isHighlighted={sliceId !== null && isHoveredSlice(sliceId)}
          onHover={isHovered => onHover(isHovered && sliceId ? { depth, sliceId } : null)}
          onToggle={() => onToggle(depth, child)}
        />
        {isOpen && (
          <div style={nestedLevelStyle}>
            <BreakdownLevel node={child} depth={depth + 1} {...levelProps} />
          </div>
        )}
      </li>
    )
  }

  return (
    <>
      {reductions.length > 0 && (
        <p style={netNoteStyle}>
          {formatUsd(increasesUsd)} in increases, {formatUsd(sumOf(reductions))} in reductions
        </p>
      )}
      <ol style={listStyle}>
        {increases.map((child, index) =>
          rowOf(child, { ...swatchStyle, background: colorOfRow(index) }, formatShare(child.amountUsd, increasesUsd), sliceIdOf(index, child)),
        )}
        {reductions.map(child => rowOf(child, reductionSwatchStyle, '', null))}
      </ol>
    </>
  )
}

/** Pie of `node`'s increases, lighting the open child's slice. Hidden below two slices. */
function LevelPie({ node, depth, openPath, hovered, onHover, onToggle }: LevelProps & { node: BudgetNode; depth: number }) {
  const slices = slicesOf(partsOf(node).increases)
  if (slices.length < 2) return null

  const openChild = openPath[depth]
  const hoveredSliceId = hovered?.depth === depth ? hovered.sliceId : null
  const highlightedId = hoveredSliceId ?? (openChild ? sliceIdOfChild(node, openChild) : null)
  const selectSlice = (sliceId: string) => {
    const child = node.children.find(candidate => candidate.id === sliceId)
    if (child) onToggle(depth, child)
  }

  return (
    <div style={pieLevelStyle}>
      <div style={pieHeadingStyle}>
        {node.label} · {formatUsd(node.amountUsd)}
      </div>
      <PieChart
        slices={slices}
        size={PIE_SIZE}
        highlightedId={highlightedId}
        onHover={sliceId => onHover(sliceId ? { depth, sliceId } : null)}
        onSelect={selectSlice}
      />
    </div>
  )
}

type BreakdownRowProps = {
  node: BudgetNode
  swatchStyle: CSSProperties
  share: string
  isOpen: boolean
  isHighlighted: boolean
  onHover: (isHovered: boolean) => void
  onToggle: () => void
}

function BreakdownRow({ node, swatchStyle, share, isOpen, isHighlighted, onHover, onToggle }: BreakdownRowProps) {
  const expandable = isExpandable(node)
  const onlyChild = node.children.length === 1 ? node.children[0] : null
  const isLit = isHighlighted || isOpen
  return (
    <button
      type="button"
      disabled={!expandable}
      aria-expanded={expandable ? isOpen : undefined}
      style={{
        ...rowStyle,
        ...(isLit ? rowHighlightedStyle : {}),
        ...(isOpen ? rowOpenStyle : {}),
        cursor: expandable ? 'pointer' : 'default',
      }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onFocus={() => onHover(true)}
      onBlur={() => onHover(false)}
      onClick={onToggle}
    >
      <span style={swatchStyle} />
      <span style={rowLabelStyle}>
        {node.label}
        {onlyChild && <span style={rowNoteStyle}>{onlyChild.label}</span>}
      </span>
      <span style={rowAmountStyle}>{formatUsd(node.amountUsd)}</span>
      <span style={rowShareStyle}>{share}</span>
      <span style={{ ...chevronStyle, ...(isOpen ? chevronOpenStyle : {}) }}>{expandable ? '›' : ''}</span>
    </button>
  )
}

const PIE_SIZE = 140
const INDENT_PX = 14

const layoutStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: 32,
  alignItems: 'start',
  marginTop: 16,
}

// Scrolls on its own when the stacked pies outgrow the viewport.
const pieColumnStyle: CSSProperties = {
  position: 'sticky',
  top: 16,
  display: 'grid',
  gap: 20,
  maxHeight: 'calc(100vh - 32px)',
  overflowY: 'auto',
}

const pieLevelStyle: CSSProperties = { display: 'grid', gap: 8, justifyItems: 'center' }

const pieHeadingStyle: CSSProperties = {
  maxWidth: PIE_SIZE,
  color: '#1a1a2e',
  fontSize: 13,
  fontWeight: 600,
  textAlign: 'center',
}

const rootTotalStyle: CSSProperties = { fontSize: 24, fontWeight: 600, fontVariantNumeric: 'tabular-nums', margin: '6px 0 10px' }

const netNoteStyle: CSSProperties = { color: '#5a5a70', fontSize: 13, margin: '4px 0 6px' }

const listStyle: CSSProperties = { listStyle: 'none', display: 'grid', gap: 2, margin: 0, padding: 0 }

const nestedLevelStyle: CSSProperties = {
  marginLeft: INDENT_PX,
  paddingLeft: 10,
  borderLeft: '2px solid #e4e4ea',
  marginBottom: 6,
}

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

const rowOpenStyle: CSSProperties = { fontWeight: 600 }

const swatchStyle: CSSProperties = { width: 12, height: 12, borderRadius: 3 }

const reductionSwatchStyle: CSSProperties = { ...swatchStyle, boxSizing: 'border-box', border: `1.5px solid ${OTHER_COLOR}` }

const rowLabelStyle: CSSProperties = { display: 'grid', gap: 2 }

const rowNoteStyle: CSSProperties = { color: '#5a5a70', fontSize: 12, fontWeight: 400 }

const rowAmountStyle: CSSProperties = { fontVariantNumeric: 'tabular-nums', fontWeight: 600, textAlign: 'right' }

const rowShareStyle: CSSProperties = { fontVariantNumeric: 'tabular-nums', color: '#5a5a70', textAlign: 'right', fontWeight: 400 }

const chevronStyle: CSSProperties = { color: '#a3a3ad', fontSize: 18, transition: 'transform 120ms' }

const chevronOpenStyle: CSSProperties = { transform: 'rotate(90deg)' }
