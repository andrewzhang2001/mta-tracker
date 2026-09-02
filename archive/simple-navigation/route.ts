/**
 * Route configuration: 320 E 52nd St → 100 Dobbin St, Brooklyn
 *
 *   Walk → Lex Av-53 St (E/M) → [E train, Queens-bound]
 *        → Court Sq-23 St     → [transfer to G]
 *        → [G train, Church Av-bound] → Nassau Av → Walk
 *
 * Port of `route_config.py` from the Flask version of this app (in git history
 * at `simple_navigation/`). Stop IDs come from MTA GTFS static data — see
 * `nyc-transit/shared/gtfs.js` for the downloader.
 */

export type FeedName = 'ace' | 'bdfm' | 'g' | 'jz' | 'l' | 'nqrw' | '123456s' | 'si'

export interface Leg {
  line: string
  color: string
  feed: FeedName
  fromStation: string
  fromStopIds: string[]
  toStation: string
  toStopIds: string[]
  /** Used when the feed has no arrival time for this trip at the destination. */
  fallbackTravelMinutes: number
}

export interface RouteConfig {
  originName: string
  destinationName: string
  walkToStationMinutes: number
  walkFromStationMinutes: number
  transferMinutes: number
  legs: [Leg, Leg]
}

export const ROUTE: RouteConfig = {
  originName: '320 E 52nd St, New York, NY',
  destinationName: '100 Dobbin St, Brooklyn, NY',

  walkToStationMinutes: 4,
  walkFromStationMinutes: 10,
  transferMinutes: 3,

  legs: [
    {
      line: 'E',
      color: '#0039A6',
      feed: 'ace',
      fromStation: 'Lexington Av-53 St',
      // Queens-bound (toward Jamaica)
      fromStopIds: ['F11N', 'F11'],
      toStation: 'Court Sq-23 St',
      // E/M platform at Court Sq is F09 — G22 is the G platform
      toStopIds: ['F09N', 'F09'],
      fallbackTravelMinutes: 8,
    },
    {
      line: 'G',
      color: '#6CBE45',
      feed: 'g',
      fromStation: 'Court Sq-23 St',
      // Church Av-bound: passes Greenpoint Av, then Nassau Av
      fromStopIds: ['G22S', 'G22'],
      toStation: 'Nassau Av',
      toStopIds: ['G28S', 'G28'],
      fallbackTravelMinutes: 6,
    },
  ],
}
