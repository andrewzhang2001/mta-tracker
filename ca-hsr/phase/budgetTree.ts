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

type LineItem = { segment: string; scc: string; description: string; amountUsd: number }

function lineItemsOf(scenario: string): LineItem[] {
  const items = lineItems
    .filter(row => row.scenario === scenario)
    .map(row => ({ segment: row.segment, scc: row.scc, description: row.description, amountUsd: Number(row.amount_usd) }))
  if (items.length === 0) throw new Error(`line-items.csv has no rows for ${scenario}`)
  return items
}

const lineItemKey = (item: LineItem) => `${item.segment}/${item.scc}`

/**
 * Each line item's amount in `scenario` minus its amount in `baseScenario`,
 * matched by segment and SCC code. A line only in `baseScenario` counts as
 * negative. Lines whose amount is unchanged are dropped.
 */
function lineItemChanges(scenario: string, baseScenario: string): LineItem[] {
  const baseItems = new Map(lineItemsOf(baseScenario).map(item => [lineItemKey(item), item]))
  const currentItems = lineItemsOf(scenario)
  const currentKeys = new Set(currentItems.map(lineItemKey))

  const changedItems = currentItems.map(item => ({
    ...item,
    amountUsd: item.amountUsd - (baseItems.get(lineItemKey(item))?.amountUsd ?? 0),
  }))
  const removedItems = [...baseItems.values()]
    .filter(item => !currentKeys.has(lineItemKey(item)))
    .map(item => ({ ...item, amountUsd: -item.amountUsd }))
  return [...changedItems, ...removedItems].filter(item => Math.round(item.amountUsd) !== 0)
}

type BudgetTreeOptions = {
  scenario: string
  /** Label of the root node. */
  label: string
  /** When given, every amount is `scenario` minus this scenario. */
  baseScenario?: string
}

/**
 * Root → Appendix C segment → SCC major category → line item, built from
 * line-items.csv. Each node's amount is the sum of its line items.
 */
export function buildBudgetTree({ scenario, label, baseScenario }: BudgetTreeOptions): BudgetNode {
  const items = baseScenario ? lineItemChanges(scenario, baseScenario) : lineItemsOf(scenario)

  const segments = groupBy(items, item => item.segment).map(([segment, segmentItems]) => {
    const categories = groupBy(segmentItems, item => item.scc.slice(0, 2)).map(([code, categoryItems]) => {
      const leaves = categoryItems.map(item => ({
        id: `${segment}/${item.scc}`,
        label: `${item.scc} ${item.description}`,
        amountUsd: item.amountUsd,
        children: [],
      }))
      return branch(`${segment}/${code}`, `${code} ${SCC_CATEGORY_NAMES[code] ?? 'Other'}`, leaves)
    })
    return branch(segment, segment, categories)
  })
  return branch(scenario, label, segments)
}
