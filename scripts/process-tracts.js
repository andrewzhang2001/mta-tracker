// Downloads NYC census tract GeoJSON + ACS population, joins with stops.json,
// and outputs public/data/tracts.geojson with per-tract access scores.
//
// Access score = expected minutes to board a train from the tract centroid:
//   walking_min (centroid → nearest station at 5 km/h) + headway_min / 2
// Lower score = better transit access.
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR  = join(__dirname, '../public/data')

// NYC Open Data — 2020 census tract boundaries as GeoJSON
const TRACTS_URL = 'https://data.cityofnewyork.us/api/views/63ge-mke6/rows.geojson'

// Census ACS 5-year — total population (B01003_001E) for all NYC tracts
// County codes: 005=Bronx, 047=Brooklyn, 061=Manhattan, 081=Queens, 085=Staten Island
function censusUrl(key) {
  return (
    'https://api.census.gov/data/2023/acs/acs5' +
    '?get=B01003_001E' +
    '&for=tract:*' +
    '&in=state:36%20county:005,047,061,081,085' +
    `&key=${key}`
  )
}

const WALK_SPEED_KM_PER_MIN = 5 / 60  // 5 km/h

// Haversine distance in km between two lat/lng points
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

// Simple centroid: average of all polygon ring coordinates
function centroid(geometry) {
  const coords = []
  const collect = ring => ring.forEach(([lng, lat]) => coords.push({ lat, lng }))

  if (geometry.type === 'Polygon') {
    geometry.coordinates.forEach(collect)
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach(poly => poly.forEach(collect))
  }

  const lat = coords.reduce((s, c) => s + c.lat, 0) / coords.length
  const lng = coords.reduce((s, c) => s + c.lng, 0) / coords.length
  return { lat, lng }
}

// Find the nearest stop and return { stop, distanceKm }
function nearestStop(lat, lng, stops) {
  let best = null, bestDist = Infinity
  for (const stop of stops) {
    const d = haversine(lat, lng, stop.lat, stop.lng)
    if (d < bestDist) { bestDist = d; best = stop }
  }
  return { stop: best, distanceKm: bestDist }
}

async function main() {
  const censusKey = process.env.CENSUS_API_KEY
  if (!censusKey) throw new Error('CENSUS_API_KEY not set in environment')

  // Load pre-processed stops
  const stops = JSON.parse(readFileSync(join(DATA_DIR, 'stops.json'), 'utf8'))
  console.log(`Loaded ${stops.length} subway stations`)

  // Download tract GeoJSON and ACS population in parallel
  console.log('Downloading census tract boundaries + ACS population...')
  const [tractsRes, censusRes] = await Promise.all([
    fetch(TRACTS_URL),
    fetch(censusUrl(censusKey)),
  ])
  if (!tractsRes.ok) throw new Error(`Tracts HTTP ${tractsRes.status}`)
  if (!censusRes.ok) throw new Error(`Census HTTP ${censusRes.status}`)

  const tracts = await tractsRes.json()
  const censusRows = await censusRes.json()
  console.log(`  ${tracts.features.length} tracts, ${censusRows.length - 1} census records`)

  // Build population lookup: geoid → population
  // Census returns rows: [B01003_001E, state, county, tract]
  const popByGeoid = new Map()
  for (const [pop, state, county, tract] of censusRows.slice(1)) {
    popByGeoid.set(`${state}${county}${tract}`, parseInt(pop, 10) || 0)
  }

  // Annotate each tract feature
  let matched = 0, skipped = 0
  for (const feature of tracts.features) {
    const p = feature.properties
    const geoid = p.geoid ?? ''

    const { lat, lng } = centroid(feature.geometry)
    const { stop, distanceKm } = nearestStop(lat, lng, stops)

    if (!stop) { skipped++; continue }

    const walkMin   = distanceKm / WALK_SPEED_KM_PER_MIN
    const waitMin   = stop.headway_min / 2
    const accessMin = Math.round((walkMin + waitMin) * 10) / 10

    feature.properties = {
      geoid,
      population:      popByGeoid.get(geoid) ?? null,
      nearest_stop:    stop.name,
      nearest_stop_id: stop.id,
      distance_km:     Math.round(distanceKm * 1000) / 1000,
      headway_min:     stop.headway_min,
      access_min:      accessMin,
    }

    matched++
  }

  console.log(`  Scored ${matched} tracts (${skipped} skipped)`)

  const outPath = join(DATA_DIR, 'tracts.geojson')
  writeFileSync(outPath, JSON.stringify(tracts))
  console.log(`Wrote public/data/tracts.geojson`)

  // Quick summary
  const scores = tracts.features.map(f => f.properties.access_min).filter(Boolean)
  scores.sort((a, b) => a - b)
  console.log(`Access score range: ${scores[0]} – ${scores[scores.length - 1]} min`)
  console.log(`Median: ${scores[Math.floor(scores.length / 2)]} min`)
}

main().catch(err => { console.error(err); process.exit(1) })
