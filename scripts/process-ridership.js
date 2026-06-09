// Fetches MTA hourly ridership for 2024 weekdays, aggregates by station + hour,
// and outputs public/data/ridership.json.
//
// Output format: [{id, name, lat, lng, byHour: [24 values, index = hour 0-23]}]
// Values are total ridership summed across all 2024 weekdays — used for
// relative sizing only, so absolute scale doesn't matter.
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '../public/data')

// wujg-7c2s = MTA Subway Hourly Ridership 2020-2024
const BASE = 'https://data.ny.gov/resource/wujg-7c2s.json'

// September 2024: post-summer, no major holidays — representative weekday pattern
const params = new URLSearchParams({
  $select: [
    'station_complex_id',
    'station_complex',
    'max(latitude) as latitude',
    'max(longitude) as longitude',
    'date_extract_hh(transit_timestamp) as hour',
    'sum(ridership) as total',
  ].join(','),
  $where: [
    "transit_timestamp >= '2024-09-01T00:00:00.000'",
    "transit_timestamp <  '2024-10-01T00:00:00.000'",
    'date_extract_dow(transit_timestamp) between 1 and 5',
  ].join(' AND '),
  $group: 'station_complex_id, station_complex, hour',
  $order: 'station_complex_id, hour',
  $limit: '50000',
})

async function main() {
  console.log('Fetching hourly ridership from Socrata...')
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 90_000)
  const res = await fetch(`${BASE}?${params}`, { signal: controller.signal })
  clearTimeout(timeout)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
  const rows = await res.json()
  console.log(`  ${rows.length} rows`)

  // Group by station
  const stationMap = new Map()
  for (const row of rows) {
    const id = row.station_complex_id
    if (!stationMap.has(id)) {
      stationMap.set(id, {
        id,
        name: row.station_complex,
        lat:  parseFloat(row.latitude),
        lng:  parseFloat(row.longitude),
        byHour: new Array(24).fill(0),
      })
    }
    const hour = parseInt(row.hour, 10)
    stationMap.get(id).byHour[hour] = Math.round(parseFloat(row.total))
  }

  const stations = [...stationMap.values()].filter(s => !isNaN(s.lat) && !isNaN(s.lng))
  console.log(`  ${stations.length} stations`)

  // Sanity check: print peak hour for Times Sq
  const tSq = stations.find(s => s.name.includes('Times Sq'))
  if (tSq) {
    const peak = tSq.byHour.indexOf(Math.max(...tSq.byHour))
    console.log(`  Times Sq peak hour: ${peak}:00 (${tSq.byHour[peak].toLocaleString()} riders)`)
  }

  mkdirSync(OUT_DIR, { recursive: true })
  writeFileSync(join(OUT_DIR, 'ridership.json'), JSON.stringify(stations))
  console.log('Wrote public/data/ridership.json')
}

main().catch(err => { console.error(err); process.exit(1) })
