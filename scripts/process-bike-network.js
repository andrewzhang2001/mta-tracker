// Builds public/data/bike-network.geojson: every NYC bike-route segment, tagged
// with its install year and facility class, so the frontend can animate the
// network growing over time and tally lane miles.
//
// Source: NYC DOT Bicycle Routes (NYC Open Data mzxg-pwib). Each row carries a
// LineString/MultiLineString geometry, an install date, and a facility type.
//
// The FeatureCollection also gets a non-standard `summary` property holding
// cumulative lane miles by year and class (MapLibre ignores it; the chart uses it).
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '../public/data')
const BIKELANES = 'https://data.cityofnewyork.us/resource/mzxg-pwib.json'

// Network dates before this are mostly DOT placeholders (segments stamped 1900,
// 1979, etc.), so we fold everything older into the starting base rather than
// animating it as bogus yearly growth.
const FLOOR_YEAR = 1997

// Collapse DOT's ~15 facility types into three honest classes. The dataset's
// "Protected" means physically separated, which includes off-street greenways —
// so we split on/off-street first to keep "protected" meaning on-street lanes.
function classify(ft, onoff) {
  const f = (ft || '').toLowerCase()
  if ((onoff || '').toUpperCase() === 'OFF') return 'greenway'
  if (f.includes('boardwalk') || f.includes('sidewalk') || f.includes('unpaved') || f.includes('ped plaza'))
    return 'greenway'
  if (f.includes('protected')) return 'protected'
  return 'painted' // conventional, buffered, shared, signed, curbside, wide parking, link
}

// Haversine length of a [lng,lat] polyline, in miles.
function lineMiles(coords) {
  const R = 3958.8
  let mi = 0
  for (let i = 1; i < coords.length; i++) {
    const [lng1, lat1] = coords[i - 1]
    const [lng2, lat2] = coords[i]
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
    mi += 2 * R * Math.asin(Math.sqrt(a))
  }
  return mi
}

const r5 = (n) => Math.round(n * 1e5) / 1e5

async function main() {
  console.log('Fetching all bike-route segments...')
  const params = new URLSearchParams({
    $select: 'the_geom, instdate, ft_facilit, onoffst',
    $where: 'the_geom IS NOT NULL',
    $limit: '50000',
  })
  const res = await fetch(`${BIKELANES}?${params}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
  const rows = await res.json()
  console.log(`  ${rows.length} segments`)

  const features = []
  // cumulative miles per class, keyed by display year (older than FLOOR_YEAR
  // is clamped to FLOOR_YEAR so the base network shows up at the slider start)
  const milesByYearClass = {} // { [year]: { protected, painted, greenway } }
  let maxYear = FLOOR_YEAR
  let totalMiles = 0

  for (const row of rows) {
    const g = row.the_geom
    if (!g) continue
    const parts = g.type === 'MultiLineString' ? g.coordinates : [g.coordinates]
    const klass = classify(row.ft_facilit, row.onoffst)

    let rawYear = row.instdate ? new Date(row.instdate).getUTCFullYear() : NaN
    if (!Number.isFinite(rawYear)) rawYear = FLOOR_YEAR
    const year = Math.max(rawYear, FLOOR_YEAR) // clamp legacy/placeholder dates to the base
    if (year > maxYear) maxYear = year

    for (const line of parts) {
      if (!line || line.length < 2) continue
      const coords = line.map(([lng, lat]) => [r5(lng), r5(lat)])
      const mi = lineMiles(coords)
      totalMiles += mi
      const bucket = (milesByYearClass[year] ??= { protected: 0, painted: 0, greenway: 0 })
      bucket[klass] += mi
      features.push({
        type: 'Feature',
        properties: { y: year, k: klass },
        geometry: { type: 'LineString', coordinates: coords },
      })
    }
  }

  // Build cumulative miles-by-year summary (for the counter + chart).
  const years = []
  for (let y = FLOOR_YEAR; y <= maxYear; y++) years.push(y)
  const cum = { protected: 0, painted: 0, greenway: 0 }
  const base = milesByYearClass[FLOOR_YEAR] ?? { protected: 0, painted: 0, greenway: 0 }
  const summary = years.map((y) => {
    const add = milesByYearClass[y] ?? { protected: 0, painted: 0, greenway: 0 }
    cum.protected += add.protected
    cum.painted += add.painted
    cum.greenway += add.greenway
    return {
      year: y,
      protected: Math.round(cum.protected),
      painted: Math.round(cum.painted),
      greenway: Math.round(cum.greenway),
      total: Math.round(cum.protected + cum.painted + cum.greenway),
    }
  })

  const fc = {
    type: 'FeatureCollection',
    summary: {
      minYear: FLOOR_YEAR,
      maxYear,
      baseMiles: Math.round(base.protected + base.painted + base.greenway),
      totalMiles: Math.round(totalMiles),
      source: 'NYC DOT Bicycle Routes (NYC Open Data mzxg-pwib)',
      note: 'Install dates are DOT-reported; legacy segments dated before ' + FLOOR_YEAR + ' are shown as the base network.',
      generated: new Date().toISOString().slice(0, 10),
      byYear: summary,
    },
    features,
  }

  mkdirSync(OUT_DIR, { recursive: true })
  const path = join(OUT_DIR, 'bike-network.geojson')
  const json = JSON.stringify(fc)
  writeFileSync(path, json)
  console.log(`\n${features.length} features · ${Math.round(totalMiles)} total lane miles`)
  console.log(`Animated range ${FLOOR_YEAR}–${maxYear} · base (≤${FLOOR_YEAR}): ${fc.summary.baseMiles} mi`)
  const last = summary[summary.length - 1]
  console.log(`Cumulative by ${last.year}: protected ${last.protected}, painted ${last.painted}, greenway ${last.greenway} (total ${last.total} mi)`)
  console.log(`Wrote public/data/bike-network.geojson (${(json.length / 1024 / 1024).toFixed(1)} MB)`)
}

main().catch((err) => { console.error(err); process.exit(1) })
