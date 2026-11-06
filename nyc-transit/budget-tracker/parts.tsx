// Pieces shared by the agency card's sections.
import type { CSSProperties, ReactNode } from 'react'
import { palette } from './theme'
import { formatDollarsExact, formatDollarsShort, formatShare } from './format'

interface LegendRowProps {
  color: string
  label: string
  amount: number
  share: number
  isActive: boolean
  onActivate: () => void
  onDeactivate: () => void
}

export function LegendRow({ color, label, amount, share, isActive, onActivate, onDeactivate }: LegendRowProps) {
  return (
    <li
      style={{ ...s.row, ...(isActive ? s.rowActive : {}) }}
      onMouseEnter={onActivate}
      onMouseLeave={onDeactivate}
    >
      <span style={{ ...s.swatch, background: color }} />
      <span style={s.rowLabel}>{label}</span>
      <span style={s.rowAmount}>{formatDollarsShort(amount)}</span>
      <span style={s.rowShare}>{formatShare(share)}</span>
    </li>
  )
}

export function Legend({ children }: { children: ReactNode }) {
  return <ul style={s.legend}>{children}</ul>
}

export function SectionHeader({ title, note }: { title: string; note?: string }) {
  return (
    <div style={s.sectionHeader}>
      <h3 style={s.sectionTitle}>{title}</h3>
      {note && <span style={s.sectionNote}>{note}</span>}
    </div>
  )
}

export function Detail({ heading, lines, hint }: { heading?: string; lines?: { label: string; amount: number }[]; hint: string }) {
  return (
    <div style={s.detail} aria-live="polite">
      {heading ? (
        <>
          <div style={s.detailHead}>{heading}</div>
          {lines?.map(line => <AmountLine key={line.label} label={line.label} amount={line.amount} exact />)}
        </>
      ) : (
        <div style={s.detailHint}>{hint}</div>
      )}
    </div>
  )
}

export function NegativeList({ items }: { items: { label: string; amount: number }[] }) {
  if (items.length === 0) return null
  return (
    <div style={s.negative}>
      <div style={s.negativeHead}>Not drawn: net negative, included in the total</div>
      {items.map(item => <AmountLine key={item.label} label={item.label} amount={item.amount} />)}
    </div>
  )
}

function AmountLine({ label, amount, exact = false }: { label: string; amount: number; exact?: boolean }) {
  return (
    <div style={s.amountLine}>
      <span>{label}</span>
      <span style={s.tabular} title={formatDollarsExact(amount)}>
        {exact ? formatDollarsExact(amount) : formatDollarsShort(amount)}
      </span>
    </div>
  )
}

export const focusableMark: CSSProperties = {
  cursor: 'pointer',
  outline: 'none',
  transition: 'opacity 120ms',
}

const s: Record<string, CSSProperties> = {
  sectionHeader: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: palette.textSecondary,
    margin: 0,
  },
  sectionNote: {
    fontSize: 11,
    color: palette.textMuted,
  },
  legend: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    flex: 1,
    minWidth: 200,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '10px 1fr auto 48px',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    padding: '3px 6px',
    borderRadius: 6,
    color: palette.textBody,
  },
  rowActive: {
    background: palette.rowActive,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  rowLabel: {
    whiteSpace: 'nowrap',
  },
  rowAmount: {
    fontVariantNumeric: 'tabular-nums',
    color: palette.text,
  },
  rowShare: {
    fontVariantNumeric: 'tabular-nums',
    color: palette.textSecondary,
    textAlign: 'right',
  },
  detail: {
    borderTop: `1px solid ${palette.border}`,
    marginTop: 12,
    paddingTop: 10,
    fontSize: 12,
    color: palette.textSecondary,
    minHeight: 34,
  },
  detailHead: {
    color: palette.text,
    fontWeight: 500,
    marginBottom: 6,
  },
  detailHint: {
    color: palette.textMuted,
  },
  amountLine: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    padding: '2px 0',
    fontSize: 12,
    color: '#a8a8bc',
  },
  tabular: {
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  },
  negative: {
    borderTop: `1px solid ${palette.border}`,
    marginTop: 10,
    paddingTop: 10,
  },
  negativeHead: {
    fontSize: 11,
    color: palette.textMuted,
    marginBottom: 4,
  },
}
