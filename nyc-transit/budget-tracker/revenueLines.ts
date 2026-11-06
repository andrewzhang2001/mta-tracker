// Revenue kinds drawn as bar segments, in this order and color on every card.
// Unlisted lines fall into "Other revenue". A kind's label names the lines the
// agency actually has, e.g. "Fares" for a railroad and "Tolls" for a bridge.
import type { RevenueLine } from './source/budgetData'
import { sumAmounts } from './amounts'

export interface RevenueKind {
  id: string
  color: string
  labelByLine: Record<string, string>
  fallbackLabel: string
}

const OTHER_REVENUE: RevenueKind = { id: 'other', color: '#77778c', labelByLine: {}, fallbackLabel: 'Other revenue' }

export const REVENUE_KINDS: RevenueKind[] = [
  {
    id: 'charges',
    color: '#9085e9',
    labelByLine: { 'Farebox Revenue': 'Fares', 'Toll Revenue': 'Tolls' },
    fallbackLabel: 'Fares & tolls',
  },
  OTHER_REVENUE,
]

export interface RevenueKindTotal {
  kind: RevenueKind
  label: string
  amount: number
  lines: RevenueLine[]
}

const kindOf = (line: string) => REVENUE_KINDS.find(k => line in k.labelByLine) ?? OTHER_REVENUE

function labelFor(kind: RevenueKind, members: RevenueLine[]) {
  const labels = members.map(m => kind.labelByLine[m.line]).filter(Boolean)
  return labels.length > 0 ? labels.join(' & ') : kind.fallbackLabel
}

export function totalsByKind(revenue: RevenueLine[]): RevenueKindTotal[] {
  return REVENUE_KINDS.flatMap(kind => {
    const members = revenue.filter(r => kindOf(r.line) === kind).sort((a, b) => b.amount - a.amount)
    return members.length > 0 ? [{ kind, label: labelFor(kind, members), amount: sumAmounts(members), lines: members }] : []
  })
}
