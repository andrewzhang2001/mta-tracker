// Builds public/data/bike-corridors.json: before/after traffic-crash injury data
// for NYC streets that received protected bike lanes / road diets — the kind of
// redesigns argued for in Janette Sadik-Khan's "Streetfight".
//
// Method (so the corridor is the *actual* street, not a hand-drawn box):
//   1. Pull the real bike-lane geometry for each corridor from NYC DOT's bike
//      routes layer (mzxg-pwib) — true on-street LineStrings.
//   2. Pull every crash in the corridor's bounding box (NYPD h9gi-nx95).
//   3. Keep a crash only if it lies within `bufferM` meters of the lane
//      (point-to-segment distance), so cross-street arterials aren't swept in.
//   4. Aggregate by year and split before/after the install year.
//
// Citywide crashes collapsed in 2020 (COVID) and trend over time, so a raw
// before/after on one street conflates the redesign with citywide change. We also
// pull a citywide yearly baseline; the frontend indexes each corridor against it.
//
// Crash data coverage: 2012-07 → present.
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '../public/data')
const CRASHES = 'https://data.cityofnewyork.us/resource/h9gi-nx95.json'
const BIKELANES = 'https://data.cityofnewyork.us/resource/mzxg-pwib.json'

// Only full years are usable for rates (data starts mid-2012; current year partial).
const FIRST_FULL_YEAR = 2013
const LAST_FULL_YEAR = 2025

// laneFilter selects DOT bike-route segments (the real geometry). installYear is
// the redesign date used for the before/after split. bufferM is how far from the
// lane a crash still counts as "on the corridor".
const CORRIDORS = [
  {
    id: 'queens-blvd',
    name: 'Queens Boulevard',
    neighborhood: 'Woodside / Sunnyside, Queens',
    installYear: 2015,
    bufferM: 32,
    blurb:
      'The "Boulevard of Death" — a 12-lane arterial that killed ~185 people from ' +
      '1990–2014. Vision Zero added protected bike lanes and pedestrian space ' +
      'starting in 2015 (rebuilt with concrete in 2024).',
    laneFilter: "upper(street) like '%QUEENS BOULEVARD%'",
  },
  {
    id: 'chrystie-st',
    name: 'Chrystie Street',
    neighborhood: 'Lower East Side, Manhattan',
    installYear: 2016,
    bufferM: 18,
    blurb:
      'One of NYC\'s first two-way parking-protected bike lanes, built in late 2016 ' +
      'on the approach to the Manhattan Bridge.',
    laneFilter: "upper(street) like '%CHRYSTIE ST%' AND ft_facilit='Protected'",
  },
  {
    id: 'amsterdam-ave',
    name: 'Amsterdam Avenue',
    neighborhood: 'Upper West Side, Manhattan',
    installYear: 2016,
    bufferM: 20,
    blurb:
      'A parking-protected bike lane and pedestrian islands built in late 2016 along ' +
      'the one-way avenue from W 72nd to W 110th Street.',
    laneFilter:
      "upper(street) like '%AMSTERDAM%' AND ft_facilit='Protected' AND date_extract_y(instdate)=2016",
  },
  {
    id: 'jay-st',
    name: 'Jay Street',
    neighborhood: 'Downtown Brooklyn',
    installYear: 2016,
    bufferM: 18,
    blurb:
      'A high-volume cycling spine linking the Manhattan Bridge to Downtown Brooklyn, ' +
      'upgraded to a protected bike lane in 2016.',
    laneFilter:
      "upper(street) like '%JAY ST%' AND ft_facilit='Protected' AND date_extract_y(instdate)>=2016",
  },
]

async function soql(base, params) {
  const url = `${base}?${new URLSearchParams(params)}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 120_000)
  const res = await fetch(url, { signal: controller.signal })
  clearTimeout(timeout)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
  return res.json()
}

// --- geometry helpers (equirectangular meters, fine at city scale) ---
const M_PER_LAT = 110540
function mPerLng(lat) { return 111320 * Math.cos((lat * Math.PI) / 180) }

// Distance (m) from point P to segment AB, all [lng,lat].
function distToSegment(p, a, b, mLng) {
  const px = p[0] * mLng, py = p[1] * M_PER_LAT
  const ax = a[0] * mLng, ay = a[1] * M_PER_LAT
  const bx = b[0] * mLng, by = b[1] * M_PER_LAT
  const dx = bx - ax, dy = by - ay
  const len2 = dx * dx + dy * dy
  let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0
  t = Math.max(0, Math.min(1, t))
  const cx = ax + t * dx, cy = ay + t * dy
  return Math.hypot(px - cx, py - cy)
}

// Min distance (m) from a point to any segment of any lane LineString.
function distToLanes(p, lanes, mLng) {
  let min = Infinity
  for (const line of lanes) {
    for (let i = 1; i < line.length; i++) {
      const d = distToSegment(p, line[i - 1], line[i], mLng)
      if (d < min) min = d
    }
  }
  return min
}

function emptyYear() {
  return { inj: 0, killed: 0, cycInj: 0, cycKilled: 0, pedInj: 0, pedKilled: 0, crashes: 0 }
}

function beforeAfter(byYear, installYear, key) {
  const avg = (lo, hi) => {
    let sum = 0, n = 0
    for (let y = lo; y <= hi; y++) if (byYear[y]) { sum += byYear[y][key]; n++ }
    return n ? sum / n : 0
  }
  const before = avg(FIRST_FULL_YEAR, installYear - 1)
  const after = avg(installYear + 1, LAST_FULL_YEAR)
  return { before, after, pct: before > 0 ? (after - before) / before : null }
}

async function fetchLanes(c) {
  const rows = await soql(BIKELANES, {
    $select: 'the_geom',
    $where: c.laneFilter,
    $limit: '500',
  })
  const lanes = []
  for (const r of rows) {
    const g = r.the_geom
    if (!g) continue
    const parts = g.type === 'MultiLineString' ? g.coordinates : [g.coordinates]
    for (const line of parts) lanes.push(line.map(([lng, lat]) => [lng, lat]))
  }
  return lanes
}

function bbox(lanes, padM) {
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity
  for (const line of lanes) for (const [lng, lat] of line) {
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
    if (lng < minLng) minLng = lng
    if (lng > maxLng) maxLng = lng
  }
  const dLat = padM / M_PER_LAT
  const dLng = padM / mPerLng((minLat + maxLat) / 2)
  return { north: maxLat + dLat, south: minLat - dLat, west: minLng - dLng, east: maxLng + dLng }
}

async function fetchCorridor(c) {
  console.log(`\n${c.name}...`)
  const lanes = await fetchLanes(c)
  const laneLen = lanes.reduce((s, l) => s + l.length, 0)
  console.log(`  ${lanes.length} lane segments (${laneLen} pts)`)
  if (!lanes.length) throw new Error(`No lane geometry for ${c.id}`)

  const box = bbox(lanes, c.bufferM + 30)
  const rows = await soql(CRASHES, {
    $select:
      'crash_date, latitude, longitude, number_of_persons_injured, number_of_persons_killed, ' +
      'number_of_cyclist_injured, number_of_cyclist_killed, ' +
      'number_of_pedestrians_injured, number_of_pedestrians_killed',
    $where:
      `within_box(location, ${box.north}, ${box.west}, ${box.south}, ${box.east}) ` +
      'AND latitude IS NOT NULL',
    $limit: '50000',
  })
  console.log(`  ${rows.length} crashes in bbox`)

  const byYear = {}
  for (let y = FIRST_FULL_YEAR - 1; y <= LAST_FULL_YEAR + 1; y++) byYear[y] = emptyYear()
  const points = []
  const midLat = (box.north + box.south) / 2
  const mLng = mPerLng(midLat)
  let kept = 0

  for (const r of rows) {
    const lat = +r.latitude, lng = +r.longitude
    if (!lat || !lng) continue
    if (distToLanes([lng, lat], lanes, mLng) > c.bufferM) continue
    kept++
    const yr = new Date(r.crash_date).getUTCFullYear()
    if (!byYear[yr]) byYear[yr] = emptyYear()
    const cycInj = +r.number_of_cyclist_injured || 0
    const cycKilled = +r.number_of_cyclist_killed || 0
    const pedInj = +r.number_of_pedestrians_injured || 0
    const pedKilled = +r.number_of_pedestrians_killed || 0
    const y = byYear[yr]
    y.inj += +r.number_of_persons_injured || 0
    y.killed += +r.number_of_persons_killed || 0
    y.cycInj += cycInj
    y.cycKilled += cycKilled
    y.pedInj += pedInj
    y.pedKilled += pedKilled
    y.crashes += 1
    // Keep individual cyclist/pedestrian casualties for the map dots.
    if (cycInj + cycKilled + pedInj + pedKilled > 0) {
      points.push({
        lng: Math.round(lng * 1e5) / 1e5,
        lat: Math.round(lat * 1e5) / 1e5,
        yr,
        cyc: cycInj + cycKilled,
        ped: pedInj + pedKilled,
        killed: cycKilled + pedKilled,
      })
    }
  }
  console.log(`  ${kept} crashes within ${c.bufferM} m of the lane · ${points.length} cyclist/ped casualties`)

  const summary = {
    totalInjured: beforeAfter(byYear, c.installYear, 'inj'),
    cyclistInjured: beforeAfter(byYear, c.installYear, 'cycInj'),
    pedInjured: beforeAfter(byYear, c.installYear, 'pedInj'),
    killed: beforeAfter(byYear, c.installYear, 'killed'),
  }
  const t = summary.totalInjured
  console.log(
    `  injured/yr ${t.before.toFixed(1)} → ${t.after.toFixed(1)} ` +
    `(${t.pct === null ? 'n/a' : (t.pct * 100).toFixed(0) + '%'})`
  )

  // Round lane coords for a smaller payload.
  const laneGeo = lanes.map((l) => l.map(([lng, lat]) => [Math.round(lng * 1e5) / 1e5, Math.round(lat * 1e5) / 1e5]))
  const cLat = (box.north + box.south) / 2
  const cLng = (box.east + box.west) / 2

  return {
    id: c.id,
    name: c.name,
    neighborhood: c.neighborhood,
    installYear: c.installYear,
    bufferM: c.bufferM,
    blurb: c.blurb,
    center: [Math.round(cLng * 1e5) / 1e5, Math.round(cLat * 1e5) / 1e5],
    lanes: laneGeo,
    byYear,
    summary,
    points,
  }
}

async function fetchCitywide() {
  console.log('Citywide baseline...')
  const rows = await soql(CRASHES, {
    $select:
      'date_extract_y(crash_date) as yr, sum(number_of_persons_injured) as inj, ' +
      'sum(number_of_persons_killed) as killed, count(*) as crashes',
    $group: 'yr',
    $order: 'yr',
    $limit: '100',
  })
  const byYear = {}
  for (let y = FIRST_FULL_YEAR - 1; y <= LAST_FULL_YEAR + 1; y++) byYear[y] = emptyYear()
  for (const r of rows) {
    const y = parseInt(r.yr, 10)
    if (!byYear[y]) byYear[y] = emptyYear()
    byYear[y].inj = +r.inj || 0
    byYear[y].killed = +r.killed || 0
    byYear[y].crashes = +r.crashes || 0
  }
  return byYear
}

async function main() {
  const citywide = await fetchCitywide()
  const corridors = []
  for (const c of CORRIDORS) corridors.push(await fetchCorridor(c))

  const out = {
    meta: {
      crashSource: 'NYPD Motor Vehicle Collisions (NYC Open Data h9gi-nx95)',
      laneSource: 'NYC DOT Bicycle Routes (NYC Open Data mzxg-pwib)',
      firstFullYear: FIRST_FULL_YEAR,
      lastFullYear: LAST_FULL_YEAR,
      generated: new Date().toISOString().slice(0, 10),
    },
    citywide,
    corridors,
  }

  mkdirSync(OUT_DIR, { recursive: true })
  const path = join(OUT_DIR, 'bike-corridors.json')
  writeFileSync(path, JSON.stringify(out))
  console.log(`\nWrote public/data/bike-corridors.json (${(JSON.stringify(out).length / 1024).toFixed(0)} KB)`)
}

main().catch((err) => { console.error(err); process.exit(1) })
