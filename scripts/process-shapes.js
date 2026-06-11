// Extracts subway line geometry from MTA GTFS shapes.txt and outputs
// public/data/subway-lines.geojson — one LineString feature per unique shape,
// colored by the official MTA route color from routes.txt.
import AdmZip from 'adm-zip'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '../public/data')
const GTFS_URL = 'http://web.mta.info/developers/data/nyct/subway/google_transit.zip'

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

function r5(n) { return Math.round(n * 1e5) / 1e5 }

async function main() {
  console.log('Downloading GTFS ZIP...')
  const res = await fetch(GTFS_URL)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  console.log(`  ${(buf.length / 1024 / 1024).toFixed(1)} MB`)

  const zip = new AdmZip(buf)
  const getText = name => zip.getEntry(name)?.getData().toString('utf8') ?? ''

  // routes.txt → route_id to hex color
  console.log('Parsing routes.txt...')
  const routeRows = parseCSV(getText('routes.txt'))
  const routeColor = new Map()
  for (const r of routeRows) {
    const color = r.route_color?.trim()
    routeColor.set(r.route_id, color ? '#' + color : '#888888')
  }
  console.log(`  ${routeColor.size} routes`)

  // trips.txt → shape_id to route_id (first trip wins)
  console.log('Parsing trips.txt...')
  const tripRows = parseCSV(getText('trips.txt'))
  const shapeRoute = new Map()
  for (const t of tripRows) {
    if (t.shape_id && !shapeRoute.has(t.shape_id)) {
      shapeRoute.set(t.shape_id, t.route_id)
    }
  }
  console.log(`  ${shapeRoute.size} unique shapes`)

  // shapes.txt → ordered point sequences per shape_id
  console.log('Parsing shapes.txt...')
  const shapePoints = new Map()
  const shapesText = getText('shapes.txt')
  const shapeLines = shapesText.replace(/\r/g, '').split('\n')
  const shapeHeaders = parseCSVLine(shapeLines[0])
  const idIdx  = shapeHeaders.indexOf('shape_id')
  const latIdx = shapeHeaders.indexOf('shape_pt_lat')
  const lonIdx = shapeHeaders.indexOf('shape_pt_lon')
  const seqIdx = shapeHeaders.indexOf('shape_pt_sequence')

  for (let i = 1; i < shapeLines.length; i++) {
    const line = shapeLines[i]
    if (!line.trim()) continue
    const vals = line.split(',')
    const shapeId = vals[idIdx]?.trim()
    if (!shapeId) continue
    if (!shapePoints.has(shapeId)) shapePoints.set(shapeId, [])
    shapePoints.get(shapeId).push([
      parseInt(vals[seqIdx], 10),
      r5(parseFloat(vals[lonIdx])),
      r5(parseFloat(vals[latIdx])),
    ])
  }
  console.log(`  ${shapePoints.size} shapes with points`)

  // Build GeoJSON features
  const features = []
  for (const [shapeId, pts] of shapePoints) {
    const routeId = shapeRoute.get(shapeId)
    if (!routeId) continue
    pts.sort((a, b) => a[0] - b[0])
    features.push({
      type: 'Feature',
      properties: {
        route_id: routeId,
        color: routeColor.get(routeId) ?? '#888888',
      },
      geometry: {
        type: 'LineString',
        coordinates: pts.map(p => [p[1], p[2]]),
      },
    })
  }

  console.log(`${features.length} line features`)
  const geojson = { type: 'FeatureCollection', features }

  mkdirSync(OUT_DIR, { recursive: true })
  const outPath = join(OUT_DIR, 'subway-lines.geojson')
  writeFileSync(outPath, JSON.stringify(geojson))
  const kb = (JSON.stringify(geojson).length / 1024).toFixed(0)
  console.log(`Wrote public/data/subway-lines.geojson (${kb} KB)`)
}

main().catch(err => { console.error(err); process.exit(1) })
