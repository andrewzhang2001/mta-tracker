// Groups General Ledger categories into the slices drawn on every agency chart.
// Families keep this order and color everywhere; unlisted categories fall into "Other".
// A family matches by category name, or by expense group when it names one.
// A credit family nets into the agency total but is neither drawn nor listed.
import type { CategoryExpense, ExpenseGroup } from './source/budgetData'
import { sumAmounts } from './amounts'

export interface ExpenseFamily {
  id: string
  label: string
  color: string
  categories: string[]
  group?: ExpenseGroup
  isCredit?: boolean
}

export const OTHER_FAMILY: ExpenseFamily = {
  id: 'other',
  label: 'Other',
  color: '#77778c',
  categories: [],
}

export const EXPENSE_FAMILIES: ExpenseFamily[] = [
  { id: 'payroll', label: 'Payroll', color: '#3987e5', categories: ['Payroll'] },
  {
    id: 'benefits',
    label: 'Benefits & pensions',
    color: '#d95926',
    categories: ['Health and Welfare', 'Pension', 'OPEB Current Payments', 'Other Fringe Benefits'],
  },
  { id: 'overtime', label: 'Overtime', color: '#199e70', categories: ['Overtime'] },
  {
    id: 'contracts',
    label: 'Contracts',
    color: '#c98500',
    categories: ['Maintenance and Other Operating Contracts', 'Professional Services Contracts', 'Paratransit Service Contracts'],
  },
  { id: 'claims', label: 'Claims & insurance', color: '#d55181', categories: ['Claims', 'Insurance'] },
  {
    id: 'materials',
    label: 'Materials & energy',
    color: '#008300',
    categories: ['Materials and Supplies', 'Electric Power', 'Fuel'],
  },
  { id: 'debt', label: 'Debt service', color: '#e66767', categories: [], group: 'debt-service' },
  {
    id: 'overhead',
    label: 'Overhead billed to capital',
    color: '#5c5c70',
    categories: ['Reimbursable Overhead'],
    isCredit: true,
  },
  OTHER_FAMILY,
]

export interface FamilyTotal {
  family: ExpenseFamily
  amount: number
  categories: CategoryExpense[]
}

const familyOf = (expense: CategoryExpense) =>
  EXPENSE_FAMILIES.find(f => f.categories.includes(expense.category) || f.group === expense.group) ?? OTHER_FAMILY

export function totalsByFamily(categories: CategoryExpense[]): FamilyTotal[] {
  return EXPENSE_FAMILIES
    .map(family => {
      const members = categories
        .filter(c => familyOf(c) === family)
        .sort((a, b) => b.amount - a.amount)
      return { family, amount: sumAmounts(members), categories: members }
    })
    .filter(t => t.categories.length > 0)
}
