import { useState } from 'react'
import type { RevenueLine } from './source/budgetData'
import { totalsByKind } from './revenueLines'
import { partsOfWhole, sumAmounts } from './amounts'
import { formatDollarsExact, formatShare } from './format'
import { Detail, focusableMark, Legend, LegendRow, NegativeList, SectionHeader } from './parts'
import { palette } from './theme'

const BAR_HEIGHT = 16
const SEGMENT_GAP = 2

export default function RevenueSection({ revenue }: { revenue: RevenueLine[] }) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const { parts, negative } = partsOfWhole(totalsByKind(revenue))
  const total = sumAmounts(revenue)
  const active = parts.find(p => p.item.kind.id === activeId)
  const activate = (id: string) => () => setActiveId(id)
  const deactivate = () => setActiveId(null)

  return (
    <section>
      <SectionHeader title="Operating revenue" note={`Total ${formatDollarsExact(total)}`} />

      <div style={s.bar}>
        {parts.map(({ item, share }) => (
          <div
            key={item.kind.id}
            tabIndex={0}
            role="img"
            aria-label={`${item.label}: ${formatDollarsExact(item.amount)}, ${formatShare(share)}`}
            style={{
              ...focusableMark,
              ...s.segment,
              flexGrow: share,
              background: item.kind.color,
              opacity: activeId !== null && activeId !== item.kind.id ? 0.35 : 1,
            }}
            onMouseEnter={activate(item.kind.id)}
            onMouseLeave={deactivate}
            onFocus={activate(item.kind.id)}
            onBlur={deactivate}
          />
        ))}
      </div>

      <Legend>
        {parts.map(({ item, share }) => (
          <LegendRow
            key={item.kind.id}
            color={item.kind.color}
            label={item.label}
            amount={item.amount}
            share={share}
            isActive={activeId === item.kind.id}
            onActivate={activate(item.kind.id)}
            onDeactivate={deactivate}
          />
        ))}
      </Legend>

      <Detail
        heading={active && `${active.item.label} · ${formatDollarsExact(active.item.amount)} · ${formatShare(active.share)}`}
        lines={active?.item.lines.map(l => ({ label: l.line, amount: l.amount }))}
        hint="Hover or focus a segment for its line items."
      />
      <NegativeList items={negative.map(t => ({ label: t.label, amount: t.amount }))} />
    </section>
  )
}

const s: Record<string, React.CSSProperties> = {
  bar: {
    display: 'flex',
    gap: SEGMENT_GAP,
    height: BAR_HEIGHT,
    marginBottom: 12,
    borderRadius: 4,
    overflow: 'hidden',
    background: palette.surface,
  },
  segment: {
    flexBasis: 0,
    minWidth: 2,
  },
}
