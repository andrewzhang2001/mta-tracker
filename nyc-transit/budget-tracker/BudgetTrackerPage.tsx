import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { budgetData, type Agency, type PeriodQuery, type SourceInfo } from './source/budgetData'
import AgencyCard, { capitalTotal, expenseTotal, type AgencyView } from './AgencyCard'
import { palette } from './theme'

const PERIOD: PeriodQuery = { fiscalYear: 2025, scenario: 'actual' }
const CAPITAL_PLAN_PERIOD = '2025-2029'
const ALL_AGENCIES = 'all'

function formatMonth(yearMonth: string) {
  const [year, month] = yearMonth.split('-').map(Number)
  return new Date(year, month - 1).toLocaleString('en-US', { month: 'short', year: 'numeric' })
}

// Expense total, largest first; agencies without expenses follow, ordered by
// capital plan total.
function byCardOrder(a: AgencyView, b: AgencyView) {
  const expenseA = expenseTotal(a)
  const expenseB = expenseTotal(b)
  if (expenseA !== undefined && expenseB !== undefined) return expenseB - expenseA
  if (expenseA !== undefined) return -1
  if (expenseB !== undefined) return 1
  return (capitalTotal(b) ?? 0) - (capitalTotal(a) ?? 0)
}

async function loadAgencyViews(agencies: Agency[], agencyId: string | undefined): Promise<AgencyView[]> {
  const [operations, capital] = await Promise.all([
    budgetData.getAgencyOperations({ ...PERIOD, agencyId }),
    budgetData.getCapitalPlans({ planPeriod: CAPITAL_PLAN_PERIOD, agencyId }),
  ])
  return agencies
    .filter(agency => !agencyId || agency.id === agencyId)
    .map(agency => ({
      agency,
      operations: operations.find(o => o.agency.id === agency.id),
      capital: capital.find(c => c.agency.id === agency.id),
    }))
    .filter(view => view.operations || view.capital)
    .sort(byCardOrder)
}

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : String(e))

export default function BudgetTrackerPage() {
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [sourceInfo, setSourceInfo] = useState<SourceInfo | null>(null)
  const [selectedAgency, setSelectedAgency] = useState(ALL_AGENCIES)
  const [views, setViews] = useState<AgencyView[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([budgetData.getAgencies(), budgetData.getSourceInfo()])
      .then(([agencyList, info]) => {
        setAgencies([...agencyList].sort((a, b) => a.name.localeCompare(b.name)))
        setSourceInfo(info)
      })
      .catch(e => setError(errorMessage(e)))
  }, [])

  useEffect(() => {
    if (agencies.length === 0) return
    let isCurrent = true
    const agencyId = selectedAgency === ALL_AGENCIES ? undefined : selectedAgency
    loadAgencyViews(agencies, agencyId)
      .then(result => { if (isCurrent) setViews(result) })
      .catch(e => { if (isCurrent) setError(errorMessage(e)) })
    return () => { isCurrent = false }
  }, [agencies, selectedAgency])

  return (
    <div style={s.page}>
      <div style={s.inner}>
        <header style={s.header}>
          <Link to="/nyc-transit" style={s.back}>← NYC Transit Explorer</Link>
          <h1 style={s.title}>MTA Budget Tracker</h1>
          <p style={s.subtitle}>
            What each MTA agency spent and took in to run service in fiscal year {PERIOD.fiscalYear},
            and what the {CAPITAL_PLAN_PERIOD} capital plan budgets for it.
          </p>
          {sourceInfo && (
            <div style={s.provenance}>
              <p style={s.provenanceLine}>
                Operating figures: FY{PERIOD.fiscalYear} actuals from {sourceInfo.operations.dataset} ({sourceInfo.operations.publisher}),
                actuals through {formatMonth(sourceInfo.operations.actualsThrough)}.
                Expenses include debt service. Excludes non-cash items and work paid for by the
                capital budget; expenses are net of overhead billed to capital projects.
              </p>
              <p style={s.provenanceLine}>
                Capital figures: five-year allocations from {sourceInfo.capital.dataset} ({sourceInfo.capital.publisher}).
                Not comparable to one year of operating figures.
              </p>
            </div>
          )}
        </header>

        <div style={s.filters}>
          <label style={s.filterLabel} htmlFor="agency-filter">Agency</label>
          <select
            id="agency-filter"
            value={selectedAgency}
            onChange={e => setSelectedAgency(e.target.value)}
            style={s.select}
          >
            <option value={ALL_AGENCIES}>All agencies</option>
            {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        {error && <p style={s.status}>Couldn't load budget data: {error}</p>}
        {!error && !views && <p style={s.status}>Loading…</p>}

        <div style={s.cards}>
          {views?.map(view => <AgencyCard key={view.agency.id} view={view} fiscalYear={PERIOD.fiscalYear} />)}
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    height: '100%',
    overflowY: 'auto',
    background: palette.page,
    color: palette.text,
    fontFamily: 'system-ui, sans-serif',
  },
  inner: {
    maxWidth: 1080,
    margin: '0 auto',
    padding: '64px 24px 48px',
  },
  header: {
    marginBottom: 28,
  },
  back: {
    display: 'inline-block',
    fontSize: 13,
    color: palette.link,
    textDecoration: 'none',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    margin: '0 0 10px',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: 15,
    color: palette.textSecondary,
    lineHeight: 1.6,
    margin: '0 0 10px',
  },
  provenance: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  provenanceLine: {
    fontSize: 12,
    color: palette.textMuted,
    lineHeight: 1.6,
    margin: 0,
  },
  filters: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 13,
    color: palette.textSecondary,
  },
  select: {
    background: palette.surface,
    color: palette.text,
    border: `1px solid ${palette.border}`,
    borderRadius: 8,
    padding: '6px 10px',
    fontSize: 13,
  },
  status: {
    fontSize: 14,
    color: palette.textSecondary,
  },
  cards: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
}
