import { useState } from 'react'
import type { CategoryExpense } from './source/budgetData'
import { totalsByFamily, type FamilyTotal } from './expenseFamilies'
import { partsOfWhole, sumAmounts, type Part } from './amounts'
import { formatDollarsExact, formatDollarsShort, formatShare } from './format'
import { Detail, focusableMark, Legend, LegendRow, NegativeList, SectionHeader } from './parts'
import { palette } from './theme'

const SIZE = 168
const CENTER = SIZE / 2
const OUTER_RADIUS = 80
const INNER_RADIUS = 52
const FULL_TURN = 2 * Math.PI

function pointAt(radius: number, angle: number) {
  return `${CENTER + radius * Math.sin(angle)} ${CENTER - radius * Math.cos(angle)}`
}

function ringSlicePath(start: number, end: number) {
  const sweep = Math.min(end - start, FULL_TURN - 1e-6)
  const stop = start + sweep
  const largeArc = sweep > Math.PI ? 1 : 0
  return [
    `M ${pointAt(OUTER_RADIUS, start)}`,
    `A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 ${largeArc} 1 ${pointAt(OUTER_RADIUS, stop)}`,
    `L ${pointAt(INNER_RADIUS, stop)}`,
    `A ${INNER_RADIUS} ${INNER_RADIUS} 0 ${largeArc} 0 ${pointAt(INNER_RADIUS, start)}`,
    'Z',
  ].join(' ')
}

function withSlicePaths(parts: Part<FamilyTotal>[]) {
  let angle = 0
  return parts.map(part => {
    const start = angle
    angle += part.share * FULL_TURN
    return { ...part, path: ringSlicePath(start, angle) }
  })
}

export default function ExpenseSection({ expenses }: { expenses: CategoryExpense[] }) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const shownFamilies = totalsByFamily(expenses).filter(t => !t.family.isCredit)
  const { parts, negative } = partsOfWhole(shownFamilies)
  const slices = withSlicePaths(parts)
  const total = sumAmounts(expenses)
  const active = slices.find(s => s.item.family.id === activeId)
  const activate = (id: string) => () => setActiveId(id)
  const deactivate = () => setActiveId(null)

  return (
    <section>
      <SectionHeader title="Expenses" note={`Total ${formatDollarsExact(total)}`} />

      <div style={s.body}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={s.donut}>
          {slices.map(({ item, share, path }) => (
            <path
              key={item.family.id}
              d={path}
              fill={item.family.color}
              stroke={palette.surface}
              strokeWidth={2}
              opacity={activeId !== null && activeId !== item.family.id ? 0.35 : 1}
              tabIndex={0}
              role="img"
              aria-label={`${item.family.label}: ${formatDollarsExact(item.amount)}, ${formatShare(share)}`}
              style={focusableMark}
              onMouseEnter={activate(item.family.id)}
              onMouseLeave={deactivate}
              onFocus={activate(item.family.id)}
              onBlur={deactivate}
            />
          ))}
          <text x={CENTER} y={CENTER - 4} textAnchor="middle" style={s.centerValue}>
            {formatDollarsShort(active ? active.item.amount : total)}
          </text>
          <text x={CENTER} y={CENTER + 14} textAnchor="middle" style={s.centerLabel}>
            {active ? formatShare(active.share) : 'total'}
          </text>
        </svg>

        <Legend>
          {slices.map(({ item, share }) => (
            <LegendRow
              key={item.family.id}
              color={item.family.color}
              label={item.family.label}
              amount={item.amount}
              share={share}
              isActive={activeId === item.family.id}
              onActivate={activate(item.family.id)}
              onDeactivate={deactivate}
            />
          ))}
        </Legend>
      </div>

      <Detail
        heading={active && `${active.item.family.label} · ${formatDollarsExact(active.item.amount)} · ${formatShare(active.share)}`}
        lines={active?.item.categories.map(c => ({ label: c.category, amount: c.amount }))}
        hint="Hover or focus a slice for its line items."
      />
      <NegativeList items={negative.map(t => ({ label: t.family.label, amount: t.amount }))} />

    </section>
  )
}

const s: Record<string, React.CSSProperties> = {
  body: {
    display: 'flex',
    alignItems: 'center',
    gap: 18,
    flexWrap: 'wrap',
  },
  donut: {
    flexShrink: 0,
  },
  centerValue: {
    fill: palette.text,
    fontSize: 17,
    fontWeight: 600,
  },
  centerLabel: {
    fill: palette.textSecondary,
    fontSize: 11,
  },
}
