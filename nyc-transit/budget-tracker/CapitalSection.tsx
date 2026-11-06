import { useState } from 'react'
import type { CapitalCategory } from './source/budgetData'
import { sumAmounts } from './amounts'
import { formatDollarsExact, formatDollarsShort } from './format'
import { Detail, focusableMark, SectionHeader } from './parts'
import { palette } from './theme'

const BAR_COLOR = '#3987e5'

const byAmountDescending = (a: CapitalCategory, b: CapitalCategory) => b.amount - a.amount

function projectCountLabel({ projectCount, unbudgetedProjectCount }: CapitalCategory) {
  const projects = `${projectCount} project${projectCount === 1 ? '' : 's'}`
  return unbudgetedProjectCount > 0 ? `${projects}, ${unbudgetedProjectCount} with no budget listed` : projects
}

export default function CapitalSection({ categories, planPeriod }: { categories: CapitalCategory[]; planPeriod: string }) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const ranked = [...categories].sort(byAmountDescending)
  const largest = ranked[0]?.amount ?? 0
  const total = sumAmounts(categories)
  const active = ranked.find(c => c.category === activeCategory)
  const activate = (category: string) => () => setActiveCategory(category)
  const deactivate = () => setActiveCategory(null)

  return (
    <section>
      <SectionHeader title="Capital projects" note={`${planPeriod} plan allocation · ${formatDollarsExact(total)}`} />

      <ul style={s.list}>
        {ranked.map(category => {
          const isActive = activeCategory === category.category
          return (
            <li
              key={category.category}
              tabIndex={0}
              aria-label={`${category.category}: ${formatDollarsExact(category.amount)}, ${projectCountLabel(category)}`}
              style={{ ...focusableMark, ...s.row, ...(isActive ? s.rowActive : {}) }}
              onMouseEnter={activate(category.category)}
              onMouseLeave={deactivate}
              onFocus={activate(category.category)}
              onBlur={deactivate}
            >
              <span style={s.label}>{category.category}</span>
              <span style={s.track}>
                <span style={{ ...s.fill, width: `${largest > 0 ? (category.amount / largest) * 100 : 0}%` }} />
              </span>
              <span style={s.amount}>{formatDollarsShort(category.amount)}</span>
            </li>
          )
        })}
      </ul>

      <Detail
        heading={active && `${active.category} · ${formatDollarsExact(active.amount)} · ${projectCountLabel(active)}`}
        lines={active?.largestProjects.map(p => ({ label: p.title, amount: p.amount }))}
        hint="Hover or focus a category for its largest projects. Amounts are budgeted across the five-year plan, not spent."
      />
    </section>
  )
}

const s: Record<string, React.CSSProperties> = {
  list: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: 'minmax(110px, 40%) 1fr 56px',
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
  label: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  track: {
    height: 8,
  },
  fill: {
    display: 'block',
    height: '100%',
    minWidth: 2,
    background: BAR_COLOR,
    borderRadius: '0 4px 4px 0',
  },
  amount: {
    fontVariantNumeric: 'tabular-nums',
    color: palette.text,
    textAlign: 'right',
  },
}
