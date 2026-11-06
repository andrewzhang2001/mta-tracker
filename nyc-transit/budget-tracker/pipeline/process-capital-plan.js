// Builds nyc-transit/budget-tracker/data/capital-plan.json from a downloaded copy
// of NYC Open Data's "MTA 2025-2029 Capital Plan: ACEP Projects" CSV.
//
//   npm run data:budget-tracker:capital -- path/to/MTA_2025-2029_Capital_Plan_ACEP_Projects.csv
//
// Sums top-level projects per agency and category. Rows with a Parent ACEP are
// sub-projects whose budgets sit on the parent, so they are skipped. Total Budget
// is in millions of dollars and is converted to dollars.
import { writeFileSync } from 'fs'
import { basename, dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { compareStrings, failWith, parseAmount, readCsvTable, roundToCents } from './csv.js'
import { AGENCY_ID_BY_CAPITAL_CODE, agencyNamesFor } from './agencies.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_FILE = join(__dirname, '../data/capital-plan.json')
const fail = failWith('process-capital-plan')

const PLAN_PERIOD = '2025-2029'
const DOLLARS_PER_UNIT = 1e6
const LARGEST_PROJECTS_PER_CATEGORY = 3
const UPPERCASE_WORDS = new Set(['MTA', 'TSMO'])

const COLUMNS = {
  agencyCode: 'Agency Code',
  category: 'Category Description',
  acep: 'ACEP',
  title: 'Project Title',
  budget: 'Total Budget',
  parent: 'Parent ACEP',
}

const toTitleCase = text =>
  text.split(' ').map(word => {
    if (UPPERCASE_WORDS.has(word)) return word
    const lower = word.toLowerCase()
    return lower === 'and' ? lower : lower.charAt(0).toUpperCase() + lower.slice(1)
  }).join(' ')

const csvPath = process.argv[2]
if (!csvPath) fail('usage: npm run data:budget-tracker:capital -- <path to CSV>')

const { rowCount, rows } = readCsvTable(csvPath, COLUMNS, fail)
const topLevelProjects = rows.filter(row => row.parent === '')

const categories = new Map()
for (const row of topLevelProjects) {
  const agency = AGENCY_ID_BY_CAPITAL_CODE[row.agencyCode]
  if (!agency) fail(`line ${row.lineNumber}: no agency mapped for capital code "${row.agencyCode}"`)
  const amount = row.budget === '' ? null : parseAmount(row.budget, row.lineNumber, fail) * DOLLARS_PER_UNIT
  const category = toTitleCase(row.category)

  const key = [agency, category].join('|')
  const entry = categories.get(key) ?? { agency, category, amount: 0, projects: [] }
  entry.amount += amount ?? 0
  entry.projects.push({ title: row.title, amount })
  categories.set(key, entry)
}

const byBudgetThenTitle = (a, b) => (b.amount ?? -1) - (a.amount ?? -1) || compareStrings(a.title, b.title)

const plans = [...categories.values()]
  .map(({ agency, category, amount, projects }) => ({
    period: PLAN_PERIOD,
    agency,
    category,
    amount: roundToCents(amount),
    projectCount: projects.length,
    unbudgetedProjectCount: projects.filter(p => p.amount === null).length,
    largestProjects: projects
      .filter(p => p.amount !== null)
      .sort(byBudgetThenTitle)
      .slice(0, LARGEST_PROJECTS_PER_CATEGORY)
      .map(p => ({ title: p.title, amount: roundToCents(p.amount) })),
  }))
  .sort((a, b) => compareStrings(a.agency, b.agency) || compareStrings(a.category, b.category))

const output = {
  source: {
    dataset: 'MTA 2025-2029 Capital Plan: ACEP Projects',
    publisher: 'NYC Open Data',
    file: basename(csvPath),
    rows: rowCount,
    topLevelProjects: topLevelProjects.length,
  },
  agencies: agencyNamesFor(plans.map(p => p.agency)),
  categories: plans,
}

writeFileSync(OUT_FILE, JSON.stringify(output, null, 2) + '\n')
console.log(`Wrote ${plans.length} capital categories from ${topLevelProjects.length} top-level projects to ${OUT_FILE}`)
