# Simple Navigation 🚇

Route: [`/archive/simple-navigation`](../../src/App.tsx) · Component: [`SimpleNavigation.tsx`](SimpleNavigation.tsx)

Real-time door-to-door subway tracker: **320 E 52nd St → 100 Dobbin St, Brooklyn**

**Trip:** Walk → `E` (Lexington Av-53 St → Court Sq-23 St) → transfer → `G` (Court Sq → Nassau Av) → Walk

Archived — feature-frozen, but live. It runs in the browser off MTA's GTFS-RT
feeds, with no server and no API key.

## Why it has no backend anymore

It was a Flask app because the MTA GTFS-RT feeds used to require an `x-api-key`
header, which can't be shipped to a browser. Two things changed:

- the feeds dropped the key requirement, and
- they now respond with `Access-Control-Allow-Origin: *`.

So the trip logic moved to the client and the server went away. The page is
static, deploys with the rest of the site, and needs no configuration.

## Layout

| Path | What it is |
|---|---|
| `SimpleNavigation.tsx` | The `/archive/simple-navigation` route — UI, 30 s auto-refresh, expandable trip cards |
| `route.ts` | Route definition: stops, walk times, transfer time (port of `route_config.py`) |
| `mta.ts` | Fetches + parses the GTFS-RT protobuf, computes trip options (port of `mta_client.py`) |

That's the whole thing — four files and no build step of its own.

The route is hardcoded — it was built for one specific commute, not as a general
trip planner.

## Data

| Feed | URL |
|---|---|
| A/C/E trip updates | `api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace` |
| G trip updates | `api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g` |
| Service alerts | `api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fsubway-alerts` |

Feeds are cached in-process for 20 s so the 30 s UI refresh doesn't hammer the API.

Alerts are fetched only when no trip is found — "no connecting G at Court Sq" on
its own reads like a bug, so the page shows the MTA notice that explains it
(e.g. *"No [G] between Bedford-Nostrand Avs and Court Sq"*).

## Notes on the feed

- **Don't filter on `direction_id`.** MTA sets it to `0` on every trip in the RT
  feed regardless of travel direction. The stop ID suffix (`G22S` vs `G22N`)
  already encodes direction, so directional stop IDs are what select it.
- **Arrival times can be missing** for a trip at the destination stop. Each leg
  carries a `fallbackTravelMinutes` estimate, and the UI marks those legs
  *estimated* rather than showing them as real-time.
- **Stop IDs come from GTFS static**, not from the real-time feed. If a
  station's IDs ever change, pull `stops.txt` with `fetchGtfs()` from
  [`nyc-transit/shared/gtfs.js`](../../nyc-transit/shared/gtfs.js) and match on `stop_name`. Suffixes
  matter: `N` is Queens/uptown-bound, `S` is Brooklyn/downtown-bound.

## The Flask version

This started as a Python + Flask app, because a server was the only place the
API key could live. That version was deleted when the logic moved to the
browser; it's in git history at `simple_navigation/` through commit `f536d0c`
if you want to read it:

```sh
git show f536d0c:simple_navigation/mta_client.py
```
