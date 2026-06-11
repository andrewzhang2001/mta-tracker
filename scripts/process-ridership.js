// Fetches MTA hourly ridership for Sep 2024, split by day type, and outputs
// public/data/ridership.json.
//
// Output format: [{id, name, lat, lng, lineColors, byDayHour: {weekday, friday, saturday, sunday}}]
// Values are average ridership per day (sum / number of matching days in Sep 2024),
// so all day types are directly comparable.
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '../public/data')

const LINE_COLORS = {
  '1': '#EE352E', '2': '#EE352E', '3': '#EE352E',
  '4': '#00933C', '5': '#00933C', '6': '#00933C',
  '7': '#B933AD',
  'A': '#0039A6', 'C': '#0039A6', 'E': '#0039A6',
  'B': '#FF6319', 'D': '#FF6319', 'F': '#FF6319', 'M': '#FF6319',
  'G': '#6CBE45',
  'J': '#996633', 'Z': '#996633',
  'L': '#A7A9AC',
  'N': '#FCCC0A', 'Q': '#FCCC0A', 'R': '#FCCC0A', 'W': '#FCCC0A',
  'S': '#808183', 'GS': '#808183', 'FS': '#808183', 'H': '#808183',
  'SIR': '#0039A6',
}

function parseLineColors(stationComplex) {
  const seen = new Set()
  const colors = []
  const groups = stationComplex.match(/\(([^)]+)\)/g) ?? []
  for (const group of groups)
    for (const line of group.slice(1, -1).split(',').map(l => l.trim())) {
      const color = LINE_COLORS[line]
      if (color && !seen.has(color)) { seen.add(color); colors.push(color) }
    }
  return colors.length > 0 ? colors : ['#888888']
}

// wujg-7c2s = MTA Subway Hourly Ridership 2020-2024
const BASE = 'https://data.ny.gov/resource/wujg-7c2s.json'

const RANGE_START = new Date('2024-09-01')
const RANGE_END   = new Date('2024-10-01')

// Count how many days in [start, end) match the given JS getDay() values (0=Sun … 6=Sat)
function countDays(start, end, jsDows) {
  const dowSet = new Set(jsDows)
  let count = 0
  const d = new Date(start)
  while (d < end) {
    if (dowSet.has(d.getDay())) count++
    d.setDate(d.getDate() + 1)
  }
  return count
}

// Socrata dow: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat  (same as JS getDay)
const DAY_FILTERS = {
  weekday:  { where: 'date_extract_dow(transit_timestamp) between 1 and 4', dows: [1,2,3,4] },
  friday:   { where: 'date_extract_dow(transit_timestamp) = 5',             dows: [5] },
  saturday: { where: 'date_extract_dow(transit_timestamp) = 6',             dows: [6] },
  sunday:   { where: 'date_extract_dow(transit_timestamp) = 0',             dows: [0] },
}

async function fetchDayType(key, dowWhere, dayCount) {
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
      dowWhere,
    ].join(' AND '),
    $group: 'station_complex_id, station_complex, hour',
    $order: 'station_complex_id, hour',
    $limit: '50000',
  })

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 120_000)
  const res = await fetch(`${BASE}?${params}`, { signal: controller.signal })
  clearTimeout(timeout)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
  const rows = await res.json()
  console.log(`  ${rows.length} rows`)

  const stationMap = new Map()
  for (const row of rows) {
    const id = row.station_complex_id
    if (!stationMap.has(id)) {
      stationMap.set(id, {
        id,
        name: row.station_complex,
        lat:  parseFloat(row.latitude),
        lng:  parseFloat(row.longitude),
        lineColors: parseLineColors(row.station_complex),
        byHour: new Array(24).fill(0),
      })
    }
    const hour = parseInt(row.hour, 10)
    // Divide by day count so values represent average ridership per day
    stationMap.get(id).byHour[hour] = Math.round(parseFloat(row.total) / dayCount)
  }
  return stationMap
}

async function main() {
  const results = {}
  for (const [key, { where, dows }] of Object.entries(DAY_FILTERS)) {
    const dayCount = countDays(RANGE_START, RANGE_END, dows)
    console.log(`Fetching ${key} (${dayCount} days)...`)
    results[key] = await fetchDayType(key, where, dayCount)
  }

  // Merge: use weekday station list as the base
  const base = [...results.weekday.values()].filter(s => !isNaN(s.lat) && !isNaN(s.lng))
  const empty = new Array(24).fill(0)
  const stations = base.map(s => ({
    id: s.id,
    name: s.name,
    lat: s.lat,
    lng: s.lng,
    lineColors: s.lineColors,
    byDayHour: {
      weekday:  s.byHour,
      friday:   results.friday.get(s.id)?.byHour   ?? empty,
      saturday: results.saturday.get(s.id)?.byHour ?? empty,
      sunday:   results.sunday.get(s.id)?.byHour   ?? empty,
    },
  }))
  console.log(`${stations.length} stations`)

  // Sanity check: Times Sq peak per day type
  const tSq = stations.find(s => s.name.includes('Times Sq'))
  if (tSq) {
    for (const [day, byHour] of Object.entries(tSq.byDayHour)) {
      const peak = byHour.indexOf(Math.max(...byHour))
      console.log(`  Times Sq ${day} peak: ${peak}:00 (${byHour[peak].toLocaleString()} riders)`)
    }
  }

  mkdirSync(OUT_DIR, { recursive: true })
  writeFileSync(join(OUT_DIR, 'ridership.json'), JSON.stringify(stations))
  console.log('Wrote public/data/ridership.json')
}

main().catch(err => { console.error(err); process.exit(1) })
