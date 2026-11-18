// CSV reading shared by this feature's pipelines. Every check stops the process
// before any output is written.
import { readFileSync } from 'fs'
import { parseCSVLine } from '../../../shared/csv.js'

const AMOUNT_PATTERN = /^-?[\d,]+(\.\d+)?$/

export function failWith(scriptName) {
  return message => {
    console.error(`${scriptName}: ${message}`)
    process.exit(1)
  }
}

// Returns { header, rowCount, rows } where each row maps the requested keys
// (from `columns`, key -> column name) to strings, plus its CSV line number.
export function readCsvTable(path, columns, fail) {
  const text = readFileSync(path, 'utf8').replace(/^﻿/, '')
  const lines = text.split(/\r?\n/).filter(line => line !== '')
  const header = parseCSVLine(lines[0])

  const missing = Object.values(columns).filter(name => !header.includes(name))
  if (missing.length) fail(`missing column(s): ${missing.join(', ')}`)
  const indexes = Object.entries(columns).map(([key, name]) => [key, header.indexOf(name)])

  const rows = lines.slice(1).map((line, i) => {
    const lineNumber = i + 2
    const fields = parseCSVLine(line)
    if (fields.length !== header.length) {
      fail(`line ${lineNumber}: expected ${header.length} fields, found ${fields.length}`)
    }
    return { lineNumber, ...Object.fromEntries(indexes.map(([key, index]) => [key, fields[index]])) }
  })
  return { rowCount: rows.length, rows }
}

export function parseAmount(text, lineNumber, fail) {
  if (!AMOUNT_PATTERN.test(text)) fail(`line ${lineNumber}: unparseable amount "${text}"`)
  return Number(text.replace(/,/g, ''))
}

export const roundToCents = n => Math.round(n * 100) / 100

export const compareStrings = (a, b) => (a < b ? -1 : a > b ? 1 : 0)
