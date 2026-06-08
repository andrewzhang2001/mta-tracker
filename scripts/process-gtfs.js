// Downloads MTA subway GTFS static ZIP and outputs public/data/stops.json
// Each entry: { id, name, lat, lng, headway_min } for weekday AM peak (7–9 AM)
import AdmZip from 'adm-zip'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '../public/data')
const GTFS_URL = 'http://web.mta.info/developers/data/nyct/subway/google_transit.zip'

const PEAK_START = 7 * 60  // minutes since midnight
const PEAK_END   = 9 * 60

function parseCSVLine(line) {
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

function parseCSV(text) {
  const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim())
  const headers = parseCSVLine(lines[0])
  return lines.slice(1).map(line => {
    const vals = parseCSVLine(line)
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']))
  })
}

function toMinutes(time) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function median(arr) {
  const s = [...arr].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 === 0 ? (s[m - 1] + s[m]) / 2 : s[m]
}

async function main() {
  console.log('Downloading GTFS ZIP...')
  const res = await fetch(GTFS_URL)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  console.log(`  ${(buf.length / 1024 / 1024).toFixed(1)} MB downloaded`)

  const zip = new AdmZip(buf)
  const getText = name => zip.getEntry(name)?.getData().toString('utf8') ?? ''

  // Weekday service IDs
  console.log('Parsing calendar...')
  const calendar = parseCSV(getText('calendar.txt'))
  const weekdayServiceIds = new Set(
    calendar.filter(r => r.monday === '1').map(r => r.service_id)
  )

  // Weekday trip IDs
  console.log('Parsing trips...')
  const trips = parseCSV(getText('trips.txt'))
  const weekdayTripIds = new Set(
    trips.filter(r => weekdayServiceIds.has(r.service_id)).map(r => r.trip_id)
  )
  console.log(`  ${weekdayTripIds.size} weekday trips`)

  // Build parent station map
  // MTA GTFS: location_type=1 → parent station, location_type=0 → platform (child)
  console.log('Parsing stops...')
  const stopsRaw = parseCSV(getText('stops.txt'))

  const parentStations = new Map()  // parent_id → {name, lat, lng}
  const childToParent  = new Map()  // child_id  → parent_id

  for (const s of stopsRaw) {
    if (s.location_type === '1') {
      parentStations.set(s.stop_id, {
        name: s.stop_name,
        lat: parseFloat(s.stop_lat),
        lng: parseFloat(s.stop_lon),
      })
    }
  }
  for (const s of stopsRaw) {
    if (s.parent_station) {
      childToParent.set(s.stop_id, s.parent_station)
    } else if (s.location_type !== '1') {
      // standalone stop with no parent
      childToParent.set(s.stop_id, s.stop_id)
      if (!parentStations.has(s.stop_id)) {
        parentStations.set(s.stop_id, {
          name: s.stop_name,
          lat: parseFloat(s.stop_lat),
          lng: parseFloat(s.stop_lon),
        })
      }
    }
  }

  // Collect AM peak departures per parent station, across all platforms/lines
  console.log('Parsing stop_times (may take a moment)...')
  const stopTimes = parseCSV(getText('stop_times.txt'))
  console.log(`  ${stopTimes.length.toLocaleString()} records`)

  const parentDeps = new Map()  // parent_id → [minute, ...]
  for (const st of stopTimes) {
    if (!weekdayTripIds.has(st.trip_id)) continue
    const mins = toMinutes(st.departure_time)
    if (mins < PEAK_START || mins > PEAK_END) continue
    const pid = childToParent.get(st.stop_id) ?? st.stop_id
    if (!parentDeps.has(pid)) parentDeps.set(pid, [])
    parentDeps.get(pid).push(mins)
  }

  // Compute median gap between consecutive departures (all platforms combined)
  const stops = []
  for (const [pid, deps] of parentDeps) {
    const station = parentStations.get(pid)
    if (!station || isNaN(station.lat) || isNaN(station.lng)) continue

    deps.sort((a, b) => a - b)
    const gaps = deps.slice(1).map((t, i) => t - deps[i]).filter(g => g > 0)
    if (gaps.length === 0) continue

    stops.push({
      id:          pid,
      name:        station.name,
      lat:         station.lat,
      lng:         station.lng,
      headway_min: Math.round(median(gaps) * 10) / 10,
    })
  }

  console.log(`Computed headways for ${stops.length} parent stations`)

  mkdirSync(OUT_DIR, { recursive: true })
  writeFileSync(join(OUT_DIR, 'stops.json'), JSON.stringify(stops, null, 2))
  console.log('Wrote public/data/stops.json')
}

main().catch(err => { console.error(err); process.exit(1) })
