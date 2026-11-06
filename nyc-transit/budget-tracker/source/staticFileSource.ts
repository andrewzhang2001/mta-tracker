// Reads the computed files written by the scripts in pipeline/.
import type {
  Agency, AgencyCapitalPlan, AgencyOperations, BudgetDataSource, CapitalProject,
  ExpenseGroup, OperationsSourceInfo, CapitalSourceInfo, Scenario,
} from './budgetData'
import operationsUrl from '../data/operations.json?url'
import capitalPlanUrl from '../data/capital-plan.json?url'

interface PeriodRow {
  fiscalYear: number
  scenario: Scenario
  agency: string
  amount: number
}

interface OperationsFile {
  source: OperationsSourceInfo
  agencies: Record<string, string>
  agencyNotes: Record<string, string>
  expenses: (PeriodRow & { category: string; group: ExpenseGroup })[]
  revenue: (PeriodRow & { line: string })[]
}

interface CapitalFile {
  source: CapitalSourceInfo
  agencies: Record<string, string>
  categories: {
    period: string
    agency: string
    category: string
    amount: number
    projectCount: number
    unbudgetedProjectCount: number
    largestProjects: CapitalProject[]
  }[]
}

function cachedJson<T>(url: string): () => Promise<T> {
  let promise: Promise<T> | null = null
  return () => {
    promise ??= fetch(url).then(res => {
      if (!res.ok) throw new Error(`Budget data failed to load (HTTP ${res.status})`)
      return res.json()
    })
    return promise
  }
}

const loadOperations = cachedJson<OperationsFile>(operationsUrl)
const loadCapitalPlan = cachedJson<CapitalFile>(capitalPlanUrl)

const toAgency = (names: Record<string, string>, id: string, notes: Record<string, string> = {}): Agency => ({
  id,
  name: names[id] ?? id,
  ...(notes[id] ? { note: notes[id] } : {}),
})

// Collects one entry per agency, created by `create` the first time an agency is seen.
function agencyIndex<Entry>(create: (id: string) => Entry) {
  const entries = new Map<string, Entry>()
  const entryFor = (id: string) => {
    if (!entries.has(id)) entries.set(id, create(id))
    return entries.get(id)!
  }
  return { entryFor, entries: () => [...entries.values()] }
}

export const staticFileSource: BudgetDataSource = {
  async getAgencies() {
    const [operations, capital] = await Promise.all([loadOperations(), loadCapitalPlan()])
    const names = { ...capital.agencies, ...operations.agencies }
    return Object.keys(names).map(id => toAgency(names, id, operations.agencyNotes))
  },

  async getAgencyOperations({ fiscalYear, scenario, agencyId }) {
    const file = await loadOperations()
    const inPeriod = (row: PeriodRow) => row.fiscalYear === fiscalYear && row.scenario === scenario
    if (!file.expenses.some(inPeriod)) throw new Error(`No ${scenario} data for fiscal year ${fiscalYear}`)
    const matches = (row: PeriodRow) => inPeriod(row) && (!agencyId || row.agency === agencyId)

    const index = agencyIndex<AgencyOperations>(id => ({
      agency: toAgency(file.agencies, id, file.agencyNotes),
      expenses: [],
      revenue: [],
    }))
    for (const { agency, category, group, amount } of file.expenses.filter(matches)) {
      index.entryFor(agency).expenses.push({ category, group, amount })
    }
    for (const { agency, line, amount } of file.revenue.filter(matches)) {
      index.entryFor(agency).revenue.push({ line, amount })
    }
    return index.entries()
  },

  async getCapitalPlans({ planPeriod, agencyId }) {
    const file = await loadCapitalPlan()
    const inPeriod = file.categories.filter(c => c.period === planPeriod)
    if (inPeriod.length === 0) throw new Error(`No capital plan for ${planPeriod}`)

    const index = agencyIndex<AgencyCapitalPlan>(id => ({
      agency: toAgency(file.agencies, id),
      planPeriod,
      categories: [],
    }))
    for (const { agency, category, amount, projectCount, unbudgetedProjectCount, largestProjects } of inPeriod) {
      if (agencyId && agency !== agencyId) continue
      index.entryFor(agency).categories.push({ category, amount, projectCount, unbudgetedProjectCount, largestProjects })
    }
    return index.entries()
  },

  async getSourceInfo() {
    const [operations, capital] = await Promise.all([loadOperations(), loadCapitalPlan()])
    return {
      operations: {
        dataset: operations.source.dataset,
        publisher: operations.source.publisher,
        actualsThrough: operations.source.actualsThrough,
      },
      capital: { dataset: capital.source.dataset, publisher: capital.source.publisher },
    }
  },
}
