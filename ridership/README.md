# 24h Ridership

Route: [`/ridership`](../src/App.tsx) · Component: [`RidershipMap.tsx`](RidershipMap.tsx)

Subway ridership pulsing through the city over a day — the morning wave, the
evening reversal, the late-night collapse. Ridership is normalized to average
riders per day so the four day types (weekday / Friday / Saturday / Sunday) are
directly comparable, and the usage stat is scaled against the global peak across
all day types.

## Data

| File | Built by | Source |
|---|---|---|
| `data/ridership.json` | `pipeline/process-ridership.js` | MTA hourly ridership (NY Open Data) |
| `data/subway-lines.geojson` | `pipeline/process-shapes.js` | MTA GTFS static `shapes.txt` |

`subway-lines.geojson` is one LineString per unique shape, colored by the
official MTA route color from `routes.txt`.

## Rebuild

```sh
npm run data:ridership
```
