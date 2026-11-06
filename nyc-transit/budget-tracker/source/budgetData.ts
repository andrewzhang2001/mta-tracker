// The only module the budget tracker UI reads data through. Swap the source
// assigned to `budgetData` to change where data comes from.
import { staticFileSource } from './staticFileSource'

export type Scenario = 'actual' | 'adopted-budget' | 'july-plan' | 'november-plan'

export type ExpenseGroup = 'labor' | 'non-labor' | 'adjustments' | 'debt-service'

export interface Agency {
  id: string
  name: string
  note?: string
}

export interface CategoryExpense {
  category: string
  group: ExpenseGroup
  amount: number
}

export interface RevenueLine {
  line: string
  amount: number
}

export interface AgencyOperations {
  agency: Agency
  expenses: CategoryExpense[]
  revenue: RevenueLine[]
}

export interface CapitalProject {
  title: string
  amount: number
}

export interface CapitalCategory {
  category: string
  amount: number
  projectCount: number
  unbudgetedProjectCount: number
  largestProjects: CapitalProject[]
}

export interface AgencyCapitalPlan {
  agency: Agency
  planPeriod: string
  categories: CapitalCategory[]
}

export interface PeriodQuery {
  fiscalYear: number
  scenario: Scenario
}

export interface OperationsQuery extends PeriodQuery {
  agencyId?: string
}

export interface CapitalPlanQuery {
  planPeriod: string
  agencyId?: string
}

export interface OperationsSourceInfo {
  dataset: string
  publisher: string
  actualsThrough: string
}

export interface CapitalSourceInfo {
  dataset: string
  publisher: string
}

export interface SourceInfo {
  operations: OperationsSourceInfo
  capital: CapitalSourceInfo
}

export interface BudgetDataSource {
  getAgencies(): Promise<Agency[]>
  getAgencyOperations(query: OperationsQuery): Promise<AgencyOperations[]>
  getCapitalPlans(query: CapitalPlanQuery): Promise<AgencyCapitalPlan[]>
  getSourceInfo(): Promise<SourceInfo>
}

export const budgetData: BudgetDataSource = staticFileSource
