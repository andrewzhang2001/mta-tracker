# Bike Network Growth

Route: [`/bike-network`](../src/App.tsx) · Component: [`BikeNetworkMap.tsx`](BikeNetworkMap.tsx)

NYC's bike lanes growing from 1997 to today — 178 to 1,276 lane miles — and the
rise of protected lanes after 2007. Scrub the year to watch the network fill in.

## Data

| File | Built by | Source |
|---|---|---|
| `data/bike-network.geojson` | `pipeline/process-bike-network.js` | NYC Open Data bike routes |

Every bike-route segment tagged with an install year and a class
(`protected` / `painted` / `greenway`), plus a `summary` block carrying
cumulative lane miles per year that drives the chart and the year scrubber.

At 5.3 MB this is the largest dataset in the repo.

## Rebuild

```sh
npm run data:bike-network
```
