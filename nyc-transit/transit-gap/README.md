# Transit Access Gap

Route: [`/nyc-transit/transit-gap`](../../src/App.tsx) · Component: [`TransitGapMap.tsx`](TransitGapMap.tsx)

How long does it take to board a subway from anywhere in NYC? Color shows access
time, opacity shows population density — so the eye lands on the places where
many people live far from a train.

## Data

| File | Built by | Source |
|---|---|---|
| `data/stops.json` | `pipeline/process-gtfs.js` | MTA GTFS static ZIP |
| `data/tracts.geojson` | `pipeline/process-tracts.js` | Census TIGER tracts + ACS 5-year |

`stops.json` is one entry per parent station with a median AM-peak (7–9 AM)
headway in minutes. `tracts.geojson` carries a per-tract `access_min` score and
population `density`.

## Rebuild

```sh
npm run data:transit-gap
```

Order matters: `process-tracts.js` reads `data/stops.json`, so the GTFS step runs
first. It also needs a free Census API key — put `CENSUS_API_KEY=...` in `.env`
at the repo root (the script is run with `node --env-file=.env`). Register at
<https://api.census.gov/data/key_signup.html>.
