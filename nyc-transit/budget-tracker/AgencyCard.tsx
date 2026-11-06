import type { Agency, AgencyCapitalPlan, AgencyOperations } from './source/budgetData'
import { sumAmounts } from './amounts'
import { formatDollarsExact, formatDollarsShort, formatShare } from './format'
import ExpenseSection from './ExpenseSection'
import RevenueSection from './RevenueSection'
import CapitalSection from './CapitalSection'
import { palette } from './theme'

export interface AgencyView {
  agency: Agency
  operations?: AgencyOperations
  capital?: AgencyCapitalPlan
}

export const expenseTotal = (view: AgencyView) =>
  view.operations && view.operations.expenses.length > 0 ? sumAmounts(view.operations.expenses) : undefined

export const operatingRevenueTotal = (view: AgencyView) =>
  view.operations && view.operations.revenue.length > 0 ? sumAmounts(view.operations.revenue) : undefined

export const capitalTotal = (view: AgencyView) =>
  view.capital ? sumAmounts(view.capital.categories) : undefined

function Stat({ label, amount }: { label: string; amount?: number }) {
  return (
    <div style={s.stat}>
      <div style={s.statLabel}>{label}</div>
      <div style={s.statValue} title={amount === undefined ? undefined : formatDollarsExact(amount)}>
        {amount === undefined ? '—' : formatDollarsShort(amount)}
      </div>
    </div>
  )
}

export default function AgencyCard({ view, fiscalYear }: { view: AgencyView; fiscalYear: number }) {
  const { agency, operations, capital } = view
  const expenses = expenseTotal(view)
  const revenue = operatingRevenueTotal(view)
  const capitalPlan = capitalTotal(view)
  const hasCoverage = expenses !== undefined && revenue !== undefined && expenses > 0

  return (
    <article style={s.card}>
      <header style={s.header}>
        <div style={s.titleRow}>
          <h2 style={s.name}>{agency.name}</h2>
          {agency.name !== agency.id && <span style={s.code}>{agency.id}</span>}
        </div>
        {agency.note && <p style={s.note}>{agency.note}</p>}
        <div style={s.stats}>
          <Stat label={`FY${fiscalYear} expenses`} amount={expenses} />
          <Stat label={`FY${fiscalYear} operating revenue`} amount={revenue} />
          <Stat label={`Capital plan ${capital?.planPeriod ?? ''}`.trim()} amount={capitalPlan} />
        </div>
        {hasCoverage && (
          <p style={s.coverage}>
            Operating revenue covers {formatShare(revenue / expenses)} of expenses.
          </p>
        )}
      </header>

      <div style={s.sections}>
        {operations && operations.expenses.length > 0 && (
          <ExpenseSection expenses={operations.expenses} />
        )}
        {operations && operations.revenue.length > 0 && <RevenueSection revenue={operations.revenue} />}
        {capital && <CapitalSection categories={capital.categories} planPeriod={capital.planPeriod} />}
      </div>
    </article>
  )
}

const s: Record<string, React.CSSProperties> = {
  card: {
    background: palette.surface,
    border: `1px solid ${palette.border}`,
    borderRadius: 12,
    padding: '20px 22px 22px',
  },
  header: {
    marginBottom: 18,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: 600,
    margin: 0,
  },
  code: {
    fontSize: 12,
    color: palette.textMuted,
  },
  note: {
    fontSize: 12,
    color: palette.textMuted,
    lineHeight: 1.5,
    margin: '-6px 0 12px',
  },
  stats: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px 32px',
  },
  stat: {
    minWidth: 140,
  },
  statLabel: {
    fontSize: 11,
    color: palette.textMuted,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 600,
    color: palette.text,
  },
  coverage: {
    fontSize: 12,
    color: palette.textSecondary,
    margin: '10px 0 0',
  },
  sections: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))',
    gap: 28,
    borderTop: `1px solid ${palette.border}`,
    paddingTop: 18,
  },
}
