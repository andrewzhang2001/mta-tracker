import { parseCSV } from '../../shared/csv.js'
import lineItemsCsv from '../data/business-plan-2026/line-items.csv?raw'

export type BudgetNode = {
  id: string
  label: string
  amountUsd: number
  /** Largest first. Empty for a single line item. */
  children: BudgetNode[]
}

// Major-category names of the standard cost category (SCC) codes. The report
// prints only the minor codes; these headings are the FTA SCC worksheet's, whose
// minor codes and descriptions match the report's.
const SCC_CATEGORY_NAMES: Record<string, string> = {
  '10': 'Guideway & track',
  '20': 'Stations',
  '30': 'Support facilities (yards, shops, admin)',
  '40': 'Sitework & special conditions',
  '50': 'Systems (signals, power, communications)',
  '60': 'Right-of-way & land',
  '70': 'Vehicles',
  '80': 'Professional services',
  '90': 'Contingency',
}

const lineItems = parseCSV(lineItemsCsv)

const sumAmounts = (nodes: BudgetNode[]) => nodes.reduce((total, node) => total + node.amountUsd, 0)
const largestFirst = (a: BudgetNode, b: BudgetNode) => b.amountUsd - a.amountUsd

function branch(id: string, label: string, children: BudgetNode[]): BudgetNode {
  return { id, label, amountUsd: sumAmounts(children), children: children.sort(largestFirst) }
}

/** [key, items] pairs in first-seen order. */
function groupBy<T>(items: T[], keyOf: (item: T) => string): [string, T[]][] {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const key = keyOf(item)
    groups.set(key, [...(groups.get(key) ?? []), item])
  }
  return [...groups]
}

/**
 * Scenario → Appendix C segment → SCC major category → line item, built from
 * line-items.csv. Each node's amount is the sum of its line items.
 */
export function buildBudgetTree(scenario: string, scenarioName: string): BudgetNode {
  const scenarioItems = lineItems.filter(item => item.scenario === scenario)
  if (scenarioItems.length === 0) throw new Error(`line-items.csv has no rows for ${scenario}`)

  const segments = groupBy(scenarioItems, item => item.segment).map(([segment, segmentItems]) => {
    const categories = groupBy(segmentItems, item => item.scc.slice(0, 2)).map(([code, categoryItems]) => {
      const leaves = categoryItems.map(item => ({
        id: `${segment}/${item.scc}`,
        label: `${item.scc} ${item.description}`,
        amountUsd: Number(item.amount_usd),
        children: [],
      }))
      return branch(`${segment}/${code}`, `${code} ${SCC_CATEGORY_NAMES[code] ?? 'Other'}`, leaves)
    })
    return branch(segment, segment, categories)
  })
  return branch(scenario, scenarioName, segments)
}
