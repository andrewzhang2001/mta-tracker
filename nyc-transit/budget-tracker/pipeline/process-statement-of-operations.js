// Builds nyc-transit/budget-tracker/data/operations.json from a downloaded copy
// of NYC Open Data's "MTA Statement of Operations: Beginning 2019" CSV.
//
//   npm run data:budget-tracker:operations -- path/to/MTA_Statement_of_Operations.csv
//
// Keeps Actual, non-reimbursable operating expense, debt service, and revenue
// rows for FISCAL_YEARS and sums them per fiscal year, agency, and General Ledger
// line. Reimbursable rows are work paid for by the capital budget and are dropped.
import { writeFileSync } from 'fs'
import { basename, dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { compareStrings, failWith, parseAmount, readCsvTable, roundToCents } from './csv.js'
import { AGENCY_NAMES, agencyNamesFor, agencyNotesFor } from './agencies.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_FILE = join(__dirname, '../data/operations.json')
const fail = failWith('process-statement-of-operations')

const FISCAL_YEARS = ['2025']
const SCENARIO = 'Actual'
const EXPENSE_TYPES = ['Total Expenses Before Non-Cash Liability Adjs.', 'Debt Service Expenses']
const REVENUE_TYPE = 'Total Revenue'
// Agencies whose cost is almost entirely paid by the capital budget, leaving
// operating figures near zero.
const EXCLUDED_AGENCIES = ['CD']
const REIMBURSABLE = 'REIMB'
const NON_REIMBURSABLE = 'NREIMB'

const COLUMNS = {
  fiscalYear: 'Fiscal Year',
  month: 'Month',
  scenario: 'Scenario',
  funding: 'Expense Type',
  agency: 'Agency',
  type: 'Type',
  subtype: 'Subtype',
  ledger: 'General Ledger',
  amount: 'Amount',
}

const GROUP_BY_SUBTYPE = {
  'Labor Expenses': 'labor',
  'Non-Labor Expenses': 'non-labor',
  'Other Expense Adjustments': 'adjustments',
  'Debt Service Expenses without Extraordinary Events': 'debt-service',
}

const csvPath = process.argv[2]
if (!csvPath) fail('usage: npm run data:budget-tracker:operations -- <path to CSV>')

const { rowCount, rows } = readCsvTable(csvPath, COLUMNS, fail)

// Sums amounts into `totals` under `key`, creating the entry from `fields` on first use.
function addTo(totals, key, fields, amount) {
  const entry = totals.get(key) ?? { ...fields, amount: 0 }
  entry.amount += amount
  totals.set(key, entry)
}

const expenses = new Map()
const revenue = new Map()
let latestActualMonth = ''

for (const row of rows) {
  const amount = parseAmount(row.amount, row.lineNumber, fail)
  if (row.funding !== REIMBURSABLE && row.funding !== NON_REIMBURSABLE) {
    fail(`line ${row.lineNumber}: unknown expense type "${row.funding}"`)
  }

  if (row.scenario !== SCENARIO) continue
  if (row.month > latestActualMonth) latestActualMonth = row.month

  const isExpense = EXPENSE_TYPES.includes(row.type)
  const isRevenue = row.type === REVENUE_TYPE
  if (!FISCAL_YEARS.includes(row.fiscalYear) || !(isExpense || isRevenue)) continue
  if (row.funding === REIMBURSABLE) continue
  if (EXCLUDED_AGENCIES.includes(row.agency)) continue

  if (!AGENCY_NAMES[row.agency]) fail(`line ${row.lineNumber}: no name mapped for agency "${row.agency}"`)
  const period = { fiscalYear: Number(row.fiscalYear), scenario: 'actual', agency: row.agency }

  if (isExpense) {
    const group = GROUP_BY_SUBTYPE[row.subtype]
    if (!group) fail(`line ${row.lineNumber}: unknown subtype "${row.subtype}"`)
    addTo(expenses, [row.fiscalYear, row.agency, row.ledger].join('|'), { ...period, category: row.ledger, group }, amount)
  } else {
    addTo(revenue, [row.fiscalYear, row.agency, row.ledger].join('|'), { ...period, line: row.ledger }, amount)
  }
}

for (const year of FISCAL_YEARS) {
  const hasYear = [...expenses.values()].some(e => e.fiscalYear === Number(year))
  if (!hasYear) fail(`no ${SCENARIO} expense rows for fiscal year ${year}`)
}

const byPeriodAgencyThen = field => (a, b) =>
  a.fiscalYear - b.fiscalYear || compareStrings(a.agency, b.agency) || compareStrings(a[field], b[field])

const finish = (totals, field) =>
  [...totals.values()].map(e => ({ ...e, amount: roundToCents(e.amount) })).sort(byPeriodAgencyThen(field))

const output = {
  source: {
    dataset: 'MTA Statement of Operations: Beginning 2019',
    publisher: 'NYC Open Data',
    file: basename(csvPath),
    rows: rowCount,
    actualsThrough: latestActualMonth.slice(0, 7),
  },
  agencies: agencyNamesFor([...expenses.values(), ...revenue.values()].map(e => e.agency)),
  agencyNotes: agencyNotesFor([...expenses.values(), ...revenue.values()].map(e => e.agency)),
  expenses: finish(expenses, 'category'),
  revenue: finish(revenue, 'line'),
}

writeFileSync(OUT_FILE, JSON.stringify(output, null, 2) + '\n')
console.log(`Wrote ${output.expenses.length} expense lines and ${output.revenue.length} revenue lines to ${OUT_FILE}`)
