// Builds the generated CSVs in ca-hsr/data/business-plan-2026/ from the CA HSR
// 2026 Business Plan Capital Cost Basis of Estimate PDF, then checks the
// hand-transcribed CSVs in the same folder against their own printed totals.
//
//   npm run data:ca-hsr:business-plan -- path/to/Basis-of-Estimate.pdf
//
// Needs `pdftotext` (poppler-utils) on PATH. Every check stops the process
// before any output is written.
import { execFileSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { parseCSV } from '../../shared/csv.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '../data/business-plan-2026')

const fail = message => {
  console.error(`extract-business-plan: ${message}`)
  process.exit(1)
}

// ---------------------------------------------------------------------------
// PDF → text

// The PDF's fonts map the fi and fl ligatures to private-use code points.
const LIGATURES = {
  '': 'fi', '': 'fi', '': 'fi',
  '': 'fl', '': 'fl',
}
const BULLET = ''
const PRIVATE_USE = /[-]/

function readPdfText(pdfPath) {
  let text
  try {
    text = execFileSync('pdftotext', ['-layout', pdfPath, '-'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  } catch (error) {
    fail(error.code === 'ENOENT' ? 'pdftotext not found; install poppler-utils' : `pdftotext failed: ${error.message}`)
  }
  for (const [glyph, letters] of Object.entries(LIGATURES)) text = text.replaceAll(glyph, letters)
  text = text.replaceAll(BULLET, '')
  const unknown = text.match(PRIVATE_USE)
  if (unknown) fail(`unmapped private-use glyph U+${unknown[0].codePointAt(0).toString(16).toUpperCase()}`)

  const PAGE_FOOTER = /^\s*2026 BUSINESS PLAN: BASIS OF ESTIMATE/
  return text.replaceAll('\f', '').split('\n').filter(line => !PAGE_FOOTER.test(line))
}

// ---------------------------------------------------------------------------
// Appendix C: SCC level 2 estimates

const SCENARIO_BY_APPENDIX = {
  1: 'merced-bakersfield',
  2: 'sf-bakersfield',
  3: 'phase-1',
  4: 'sf-palmdale',
}

const SEGMENT_BY_TITLE_PREFIX = [
  ['San Francisco – San Jose', 'San Francisco – San Jose'],
  ['Gilroy – Wye', 'Gilroy – Wye'],
  ['Merced Extension', 'Merced Extension'],
  ['Central Valley', 'Central Valley 119-mile'],
  ['Bakersfield Extension', 'Bakersfield Extension'],
  ['Bakersfield – Palmdale', 'Bakersfield – Palmdale'],
  ['Palmdale – Burbank', 'Palmdale – Burbank'],
  ['Burbank – Los Angeles', 'Burbank – Los Angeles'],
  ['Los Angeles – Anaheim', 'Los Angeles – Anaheim'],
  ['Program Wide Support', 'Program-wide support, project development & trainsets'],
  ['Bookend', 'Bookends'],
]

const SECTION_HEADING = /^\s*APPENDIX C\.(\d)\.(\d+)\s*[:–]\s*(.+?)\s*$/
const TABLE_HEADER_LINE = /^\s*(SCC|2026 BP)\b/
const SCC_CODE = /^\s*(\d{2}(?:\.\d{2})?)(?=\s|$)/m
const DOLLARS = /\$([\d,]+)/g

const parseDollars = text => Number(text.replace(/,/g, ''))
const squashSpaces = text => text.replace(/\s+/g, ' ').trim()

// Section headings that wrap put their last word ("Trainsets", "Facilities",
// "Scenario") alone on the next line.
function readSectionTitle(lines, headingIndex, firstPart) {
  const next = lines[headingIndex + 1]?.trim() ?? ''
  const continues = next !== '' && !TABLE_HEADER_LINE.test(next)
  return continues ? `${firstPart} ${next}` : firstPart
}

function findSections(lines) {
  const sections = []
  lines.forEach((line, index) => {
    const match = line.match(SECTION_HEADING)
    if (!match || line.includes('....')) return  // table of contents entry
    const [, scenarioNumber, partNumber, firstPart] = match
    sections.push({
      appendix: `C.${scenarioNumber}.${partNumber}`,
      scenario: SCENARIO_BY_APPENDIX[scenarioNumber] ?? fail(`unknown scenario appendix C.${scenarioNumber}`),
      title: readSectionTitle(lines, index, firstPart),
      startIndex: index,
    })
  })
  return sections
}

// pdftotext separates table rows with blank lines. A wrapped row keeps its code,
// description fragments, and amount in one block, in any line order.
function splitIntoBlocks(lines) {
  const blocks = []
  let current = []
  for (const line of lines) {
    if (line.trim() === '') {
      if (current.length) blocks.push(current.join('\n'))
      current = []
    } else current.push(line)
  }
  if (current.length) blocks.push(current.join('\n'))
  return blocks
}

function parseSectionRows(section, lines) {
  const totalIndex = lines.findIndex((line, i) => i > section.startIndex && /\bTOTAL\b/.test(line))
  if (totalIndex === -1) fail(`${section.appendix}: no TOTAL line`)
  const statedTotal = parseDollars(lines[totalIndex].match(/\$([\d,]+)/)[1])

  const rows = []
  for (const block of splitIntoBlocks(lines.slice(section.startIndex + 2, totalIndex))) {
    const amounts = [...block.matchAll(DOLLARS)]
    if (amounts.length === 0) continue  // column headers, section caption
    const code = block.match(SCC_CODE)
    if (amounts.length !== 1 || !code) fail(`${section.appendix}: unparseable row:\n${block}`)
    const description = squashSpaces(block.replace(SCC_CODE, '').replace(DOLLARS, ''))
    rows.push({ scc: code[1], description, amount_usd: parseDollars(amounts[0][1]) })
  }

  const parsedTotal = sum(rows.map(row => row.amount_usd))
  // Line items are printed rounded to the dollar, so the stated total can be a
  // few dollars off their sum.
  if (Math.abs(parsedTotal - statedTotal) > rows.length) {
    fail(`${section.appendix}: rows sum to $${parsedTotal}, stated total is $${statedTotal}`)
  }
  return { rows, statedTotal }
}

function segmentFor(section) {
  const entry = SEGMENT_BY_TITLE_PREFIX.find(([prefix]) => section.title.startsWith(prefix))
  if (!entry) fail(`${section.appendix}: no segment mapped for "${section.title}"`)
  return entry[1]
}

const sum = values => values.reduce((total, value) => total + value, 0)

// The last section of each scenario rolls up all the scenario's segments.
function extractAppendixC(lines) {
  const sections = findSections(lines)
  const byScenario = Map.groupBy(sections, section => section.scenario)

  const lineItems = [], segmentTotals = [], scenarioByScc = []
  for (const [scenario, scenarioSections] of byScenario) {
    const rollup = scenarioSections.at(-1)
    const segments = scenarioSections.slice(0, -1)
    const rollupParsed = parseSectionRows(rollup, lines)

    let segmentSum = 0
    for (const section of segments) {
      const { rows, statedTotal } = parseSectionRows(section, lines)
      const segment = segmentFor(section)
      segmentSum += statedTotal
      segmentTotals.push({ scenario, appendix: section.appendix, segment, amount_usd: statedTotal })
      for (const row of rows) lineItems.push({ scenario, appendix: section.appendix, segment, ...row })
    }
    if (Math.abs(segmentSum - rollupParsed.statedTotal) > segments.length) {
      fail(`${scenario}: segment totals sum to $${segmentSum}, ${rollup.appendix} states $${rollupParsed.statedTotal}`)
    }
    for (const row of rollupParsed.rows) scenarioByScc.push({ scenario, appendix: rollup.appendix, ...row })
    scenarioByScc.push({ scenario, appendix: rollup.appendix, scc: '', description: 'TOTAL', amount_usd: rollupParsed.statedTotal })
  }
  return { lineItems, segmentTotals, scenarioByScc }
}

// ---------------------------------------------------------------------------
// Appendix B: contingency rates at P30

const CONTINGENCY_COLUMNS = ['F2J', 'G-Wye', 'CVS Rail & Facilities', 'M-M', 'LGA', 'B-P', 'P-K', 'K-L', 'LA-A']
const RATE = /^(N\/A|\d+%)$/

function extractAppendixB(lines) {
  const start = lines.findIndex(line => /APPENDIX B – CONTINGENCY OUTCOMES/.test(line) && !line.includes('....'))
  const end = lines.findIndex((line, i) => i > start && /APPENDIX C: SCC LEVEL 2 ESTIMATES/.test(line))
  if (start === -1 || end === -1) fail('Appendix B not found')

  const rows = []
  for (const block of splitIntoBlocks(lines.slice(start + 1, end))) {
    const codeLine = block.split('\n').find(line => SCC_CODE.test(line))
    if (!codeLine) continue
    const tokens = codeLine.trim().split(/\s+/)
    const rates = tokens.filter(token => RATE.test(token))
    if (rates.length === 0) continue  // column header
    if (rates.length !== CONTINGENCY_COLUMNS.length) fail(`Appendix B: expected ${CONTINGENCY_COLUMNS.length} rates in:\n${block}`)

    const description = squashSpaces(
      block.replace(SCC_CODE, '').split(/\s+/).filter(word => !RATE.test(word)).join(' '),
    )
    const row = { scc: tokens[0], description }
    CONTINGENCY_COLUMNS.forEach((column, i) => { row[column] = rates[i] === 'N/A' ? '' : rates[i].replace('%', '') })
    rows.push(row)
  }
  return rows
}

// ---------------------------------------------------------------------------
// Checks on the hand-transcribed CSVs

// Totals the report itself prints that don't equal the sum of their rows.
const KNOWN_SOURCE_MISMATCHES = new Set([
  '20|prior_estimate_musd',  // 2,745 + 1,478 = 4,223, printed 4,298
  '20|estimate_2026_musd',   // 3,486 + 1,427 = 4,913, printed 5,075
  '3|spent_musd',            // Bookend spent printed 854; Table 32 prints 847, which sums
])

const readDataCsv = name => parseCSV(readFileSync(join(DATA_DIR, name), 'utf8'))
const toNumber = text => (text === '' ? 0 : Number(text))
// Each printed figure is rounded to the nearest $1M, so a sum of n of them can
// drift by up to n/2 from the printed total.
const roundingAllowance = count => (count + 1) / 2

function checkEstimateTables() {
  const columns = ['prior_estimate_musd', 'estimate_2026_musd', 'spent_musd']
  const problems = []
  for (const [table, rows] of Map.groupBy(readDataCsv('estimate-tables.csv'), row => row.table)) {
    for (const column of columns) {
      // A subtotal covers the items before it; the total covers subtotals plus
      // the items after the last subtotal.
      let running = [], afterSubtotal = []
      for (const row of rows) {
        const value = toNumber(row[column])
        if (row.row_type === 'item') { running.push(value); afterSubtotal.push(value) }
        const covered = row.row_type === 'subtotal' ? running : afterSubtotal
        if (row.row_type === 'subtotal' || row.row_type === 'total') {
          const difference = Math.abs(sum(covered) - value)
          const mismatch = difference > roundingAllowance(covered.length)
          if (mismatch && !KNOWN_SOURCE_MISMATCHES.has(`${table}|${column}`)) {
            problems.push(`table ${table} ${row.scope_element} ${column}: rows sum to ${sum(covered)}, printed ${value}`)
          }
          if (row.row_type === 'subtotal') { running = []; afterSubtotal = [value] }
        }
      }
    }
  }
  return problems
}

function checkKeyQuantities() {
  return readDataCsv('key-quantities.csv')
    .filter(row => toNumber(row.estimate_2026) - toNumber(row.prior_estimate) !== toNumber(row.variance))
    .map(row => `key-quantities table ${row.table} ${row.description}: variance ${row.variance} ≠ 2026 − prior`)
}

const SHARED_BENEFIT_PRINTED_TOTAL_MUSD = 11125

function checkSharedBenefits() {
  const rows = readDataCsv('shared-benefit-costs.csv')
  const total = sum(rows.map(row => toNumber(row.amount_musd)))
  return Math.abs(total - SHARED_BENEFIT_PRINTED_TOTAL_MUSD) > roundingAllowance(rows.length)
    ? [`shared-benefit-costs: rows sum to ${total}, printed ${SHARED_BENEFIT_PRINTED_TOTAL_MUSD}`]
    : []
}

function checkScenarioTotals(segmentTotals) {
  const appendixMusd = new Map(
    [...Map.groupBy(segmentTotals, row => row.scenario)]
      .map(([scenario, rows]) => [scenario, Math.round(sum(rows.map(row => row.amount_usd)) / 1e6)]),
  )
  return readDataCsv('scenarios.csv')
    .filter(row => appendixMusd.get(row.scenario) !== toNumber(row.total_p65_musd))
    .map(row => `scenarios ${row.scenario}: total ${row.total_p65_musd} ≠ appendix C ${appendixMusd.get(row.scenario)}`)
}

// ---------------------------------------------------------------------------
// CSV output

const csvField = value => {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function toCsv(rows, columns) {
  return [columns, ...rows.map(row => columns.map(column => row[column]))]
    .map(fields => fields.map(csvField).join(','))
    .join('\n') + '\n'
}

// ---------------------------------------------------------------------------

const pdfPath = process.argv[2]
if (!pdfPath) fail('usage: npm run data:ca-hsr:business-plan -- <path to PDF>')

const lines = readPdfText(pdfPath)
const { lineItems, segmentTotals, scenarioByScc } = extractAppendixC(lines)
const contingencyRates = extractAppendixB(lines)

const problems = [
  ...checkEstimateTables(),
  ...checkKeyQuantities(),
  ...checkSharedBenefits(),
  ...checkScenarioTotals(segmentTotals),
]
if (problems.length) fail(`transcribed tables disagree with the report:\n  ${problems.join('\n  ')}`)

const outputs = [
  ['line-items.csv', lineItems, ['scenario', 'appendix', 'segment', 'scc', 'description', 'amount_usd']],
  ['segment-totals.csv', segmentTotals, ['scenario', 'appendix', 'segment', 'amount_usd']],
  ['scenario-by-scc.csv', scenarioByScc, ['scenario', 'appendix', 'scc', 'description', 'amount_usd']],
  ['contingency-rates.csv', contingencyRates, ['scc', 'description', ...CONTINGENCY_COLUMNS]],
]
for (const [name, rows, columns] of outputs) {
  writeFileSync(join(DATA_DIR, name), toCsv(rows, columns))
  console.log(`Wrote ca-hsr/data/business-plan-2026/${name} (${rows.length} rows)`)
}
