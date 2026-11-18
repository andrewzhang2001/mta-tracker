// Shared helpers for the MTA GTFS static feed.
//
// Two features derive data from the same ~50 MB ZIP: transit-gap (stop headways)
// and ridership (subway line geometry). The download lives here so the two
// pipelines don't drift apart; CSV parsing is in the repo-root shared/csv.js.

import AdmZip from 'adm-zip'

export const GTFS_URL = 'http://web.mta.info/developers/data/nyct/subway/google_transit.zip'


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
