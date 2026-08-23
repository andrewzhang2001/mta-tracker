// Shared helpers for the MTA GTFS static feed.
//
// Two features derive data from the same ~50 MB ZIP: transit-gap (stop headways)
// and ridership (subway line geometry). Download + CSV parsing lives here so the
// two pipelines don't drift apart.

import AdmZip from 'adm-zip'

export const GTFS_URL = 'http://web.mta.info/developers/data/nyct/subway/google_transit.zip'

export function parseCSVLine(line) {
  const out = []
  let cur = '', inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++ }
      else inQ = !inQ
    } else if (ch === ',' && !inQ) {
      out.push(cur); cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out
}

export function parseCSV(text) {
  const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim())
  const headers = parseCSVLine(lines[0])
  return lines.slice(1).map(line => {
    const vals = parseCSVLine(line)
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']))
  })
}

// Downloads and unzips the GTFS feed. Returns getText(name) for reading a member
// file as a string ('' if the entry is absent).
export async function fetchGtfs() {
  console.log('Downloading GTFS ZIP...')
  const res = await fetch(GTFS_URL)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  console.log(`  ${(buf.length / 1024 / 1024).toFixed(1)} MB downloaded`)

  const zip = new AdmZip(buf)
  return name => zip.getEntry(name)?.getData().toString('utf8') ?? ''
}
