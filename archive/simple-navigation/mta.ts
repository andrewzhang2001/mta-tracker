/**
 * MTA GTFS-RT client — browser port of the original `mta_client.py` from the
 * Flask version of this app (in git history at `simple_navigation/`).
 *
 * The Python version ran server-side because the feeds used to require an
 * `x-api-key` header. They no longer do, and they now send
 * `Access-Control-Allow-Origin: *`, so the browser can fetch and parse them
 * directly and the Flask layer isn't needed.
 */

import GtfsRealtimeBindings from 'gtfs-realtime-bindings'
import { ROUTE, type FeedName } from './route'

type FeedMessage = ReturnType<typeof GtfsRealtimeBindings.transit_realtime.FeedMessage.decode>

const FEED_BASE = 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/'

const FEED_URLS: Record<FeedName, string> = {
  ace: `${FEED_BASE}nyct%2Fgtfs-ace`,
  bdfm: `${FEED_BASE}nyct%2Fgtfs-bdfm`,
  g: `${FEED_BASE}nyct%2Fgtfs-g`,
  jz: `${FEED_BASE}nyct%2Fgtfs-jz`,
  l: `${FEED_BASE}nyct%2Fgtfs-l`,
  nqrw: `${FEED_BASE}nyct%2Fgtfs-nqrw`,
  '123456s': `${FEED_BASE}nyct%2Fgtfs`,
  si: `${FEED_BASE}nyct%2Fgtfs-si`,
}

const ALERTS_URL = `${FEED_BASE}camsys%2Fsubway-alerts`

const CACHE_TTL_MS = 20_000
const cache = new Map<string, { ts: number; feed: FeedMessage }>()

async function fetchFeed(url: string, key: string): Promise<FeedMessage> {
  const now = Date.now()
  const hit = cache.get(key)
  if (hit && now - hit.ts < CACHE_TTL_MS) return hit.feed

  const res = await fetch(url)
  if (!res.ok) throw new Error(`MTA feed ${key} returned ${res.status}`)

  const buf = new Uint8Array(await res.arrayBuffer())
  const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(buf)
  cache.set(key, { ts: now, feed })
  return feed
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** protobuf int64 fields arrive as Long objects, so normalize to a number. */
function toSeconds(value: unknown): number {
  if (value == null) return 0
  return Number(value)
}

function stopTime(
  stu: { arrival?: { time?: unknown } | null; departure?: { time?: unknown } | null },
  prefer: 'departure' | 'arrival',
): number {
  const dep = toSeconds(stu.departure?.time)
  const arr = toSeconds(stu.arrival?.time)
  return prefer === 'departure' ? dep || arr : arr || dep
}

const timeFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  hour: 'numeric',
  minute: '2-digit',
})

/** Unix seconds → "3:42 PM" in New York time. */
export function fmtTime(ts: number | null): string {
  if (!ts) return '—'
  return timeFmt.format(new Date(ts * 1000))
}

// ---------------------------------------------------------------------------
// Feed extraction
// ---------------------------------------------------------------------------

interface Departure {
  tripId: string
  stopId: string
  departureTs: number
}

/**
 * Upcoming departures for `routeId` at any of `stopIds`, sorted by time.
 *
 * We deliberately do NOT filter on trip.direction_id: MTA sets it to 0 on every
 * trip in the RT feed regardless of travel direction. The stop_id suffix
 * (G22S vs G22N) already encodes direction, so directional stop IDs suffice.
 */
function getDepartures(
  feed: FeedMessage,
  routeId: string,
  stopIds: string[],
  afterTs: number,
  maxResults = 8,
): Departure[] {
  const out: Departure[] = []

  for (const entity of feed.entity) {
    const tu = entity.tripUpdate
    if (!tu || tu.trip.routeId !== routeId) continue

    for (const stu of tu.stopTimeUpdate ?? []) {
      if (!stu.stopId || !stopIds.includes(stu.stopId)) continue
      const dep = stopTime(stu, 'departure')
      if (dep && dep >= afterTs) {
        out.push({ tripId: tu.trip.tripId ?? '', stopId: stu.stopId, departureTs: dep })
      }
      break // one match per trip is enough
    }
  }

  out.sort((a, b) => a.departureTs - b.departureTs)
  return out.slice(0, maxResults)
}

/** When a specific trip reaches any of `stopIds`, or null if the feed omits it. */
function getTripArrival(feed: FeedMessage, tripId: string, stopIds: string[]): number | null {
  for (const entity of feed.entity) {
    const tu = entity.tripUpdate
    if (!tu || tu.trip.tripId !== tripId) continue
    for (const stu of tu.stopTimeUpdate ?? []) {
      if (stu.stopId && stopIds.includes(stu.stopId)) return stopTime(stu, 'arrival')
    }
  }
  return null
}

/**
 * Active alerts mentioning any of `routeIds`. Used to explain an empty result:
 * "no trips found" is far less useful than the actual suspension notice.
 */
async function getAlerts(routeIds: string[]): Promise<string[]> {
  let feed: FeedMessage
  try {
    feed = await fetchFeed(ALERTS_URL, 'alerts')
  } catch {
    return [] // alerts are a nicety; never fail the page over them
  }

  const seen = new Set<string>()
  for (const entity of feed.entity) {
    const alert = entity.alert
    if (!alert) continue
    const hits = (alert.informedEntity ?? []).some(
      e => e.routeId && routeIds.includes(e.routeId),
    )
    if (!hits) continue
    const text = alert.headerText?.translation?.[0]?.text?.replace(/\s+/g, ' ').trim()
    if (text) seen.add(text)
  }
  return [...seen].slice(0, 3)
}

// ---------------------------------------------------------------------------
// Trip planning
// ---------------------------------------------------------------------------

export interface TripLeg {
  type: 'walk' | 'subway' | 'transfer'
  desc: string
  detail: string
  line?: string
  color?: string
  /** False when the feed had no arrival time and a fixed estimate was used. */
  realtime?: boolean
}

export interface TripOption {
  leaveInMin: number
  leaveHomeAt: string
  totalMinutes: number
  arrivesDestination: string
  urgent: boolean
  legs: TripLeg[]
}

export interface RouteOptions {
  options: TripOption[]
  origin: string
  destination: string
  updatedAt: string
  warning: string | null
  alerts: string[]
}

/** Next door-to-door trip options for the configured route. */
export async function getRouteOptions(): Promise<RouteOptions> {
  const nowTs = Math.floor(Date.now() / 1000)
  const [leg1Cfg, leg2Cfg] = ROUTE.legs

  const walkTo = ROUTE.walkToStationMinutes
  const transfer = ROUTE.transferMinutes
  const walkFrom = ROUTE.walkFromStationMinutes

  // Earliest boarding time — we have to walk there first.
  const earliestBoard = nowTs + walkTo * 60

  const [feed1, feed2] = await Promise.all([
    fetchFeed(FEED_URLS[leg1Cfg.feed], leg1Cfg.feed),
    fetchFeed(FEED_URLS[leg2Cfg.feed], leg2Cfg.feed),
  ])

  const base = {
    origin: ROUTE.originName,
    destination: ROUTE.destinationName,
    updatedAt: fmtTime(nowTs),
  }

  const firstTrains = getDepartures(feed1, leg1Cfg.line, leg1Cfg.fromStopIds, earliestBoard, 6)

  if (firstTrains.length === 0) {
    return {
      ...base,
      options: [],
      warning: `No ${leg1Cfg.line} trains at ${leg1Cfg.fromStation} in the next hour.`,
      alerts: await getAlerts([leg1Cfg.line, leg2Cfg.line]),
    }
  }

  const options: TripOption[] = []

  for (const train1 of firstTrains) {
    // When does this train reach the transfer point?
    const arrivalRealtime = getTripArrival(feed1, train1.tripId, leg1Cfg.toStopIds)
    const leg1Realtime = arrivalRealtime !== null
    const arrivesTransfer =
      arrivalRealtime ?? train1.departureTs + leg1Cfg.fallbackTravelMinutes * 60

    // Earliest we can board the second leg, after walking between platforms.
    const earliestSecond = arrivesTransfer + transfer * 60

    const secondTrains = getDepartures(
      feed2,
      leg2Cfg.line,
      leg2Cfg.fromStopIds,
      earliestSecond,
      4,
    )
    if (secondTrains.length === 0) continue // no connection; try the next train

    const train2 = secondTrains[0]

    const arrival2Realtime = getTripArrival(feed2, train2.tripId, leg2Cfg.toStopIds)
    const leg2Realtime = arrival2Realtime !== null
    const arrivesFinalStation =
      arrival2Realtime ?? train2.departureTs + leg2Cfg.fallbackTravelMinutes * 60

    const arrivesDestinationTs = arrivesFinalStation + walkFrom * 60
    const totalMinutes = Math.round((arrivesDestinationTs - nowTs) / 60)

    const leaveHomeTs = train1.departureTs - walkTo * 60
    const leaveInMin = Math.max(0, Math.round((leaveHomeTs - nowTs) / 60))

    const ride1Min = Math.round((arrivesTransfer - train1.departureTs) / 60)
    const ride2Min = Math.round((arrivesFinalStation - train2.departureTs) / 60)
    const waitMin = Math.round((train2.departureTs - arrivesTransfer) / 60)

    options.push({
      leaveInMin,
      leaveHomeAt: fmtTime(leaveHomeTs),
      totalMinutes,
      arrivesDestination: fmtTime(arrivesDestinationTs),
      urgent: leaveInMin <= 2,
      legs: [
        {
          type: 'walk',
          desc: `Walk to ${leg1Cfg.fromStation}`,
          detail: `${walkTo} min`,
        },
        {
          type: 'subway',
          line: leg1Cfg.line,
          color: leg1Cfg.color,
          desc: `${leg1Cfg.line} train → ${leg1Cfg.toStation}`,
          detail: `Departs ${fmtTime(train1.departureTs)} · ${ride1Min} min ride`,
          realtime: leg1Realtime,
        },
        {
          type: 'transfer',
          desc: `Transfer to ${leg2Cfg.line} train`,
          detail: `~${transfer} min walk + ${waitMin} min wait`,
        },
        {
          type: 'subway',
          line: leg2Cfg.line,
          color: leg2Cfg.color,
          desc: `${leg2Cfg.line} train → ${leg2Cfg.toStation}`,
          detail: `Departs ${fmtTime(train2.departureTs)} · ${ride2Min} min ride`,
          realtime: leg2Realtime,
        },
        {
          type: 'walk',
          desc: `Walk to ${ROUTE.destinationName.split(',')[0]}`,
          detail: `${walkFrom} min`,
        },
      ],
    })

    if (options.length >= 4) break
  }

  if (options.length > 0) {
    return { ...base, options, warning: null, alerts: [] }
  }

  return {
    ...base,
    options: [],
    warning: `Found ${leg1Cfg.line} trains, but no connecting ${leg2Cfg.line} at ${leg2Cfg.fromStation}.`,
    alerts: await getAlerts([leg2Cfg.line]),
  }
}
