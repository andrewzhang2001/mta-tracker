# NYC Transit Explorer

Route: [`/nyc-transit`](../src/App.tsx) · Component: [`TransitExplorer.tsx`](TransitExplorer.tsx)

The landing page for the transit visualizations. It renders a card per map and
nothing else — each map owns its own subfolder here.

| Folder | Route | What it shows |
|---|---|---|
| [transit-gap/](transit-gap/) | `/nyc-transit/transit-gap` | Time to reach a subway from anywhere in NYC, weighted by density |
| [ridership/](ridership/) | `/nyc-transit/ridership` | Subway ridership over a 24h day, by day type |
| [bike-safety/](bike-safety/) | `/nyc-transit/bike-safety` | Crash injuries before vs. after four protected-lane redesigns |
| [bike-network/](bike-network/) | `/nyc-transit/bike-network` | Bike lane growth, 1997–today |

## shared/

Code used by more than one map in this section:

| File | Used by | What it is |
|---|---|---|
| `shared/map/useMapLibre.ts` | all four maps | MapLibre instance setup, nav control, teardown |
| `shared/map/MapChrome.tsx` | all four maps | Back link and loading overlay |
| `shared/map/basemap.ts` | `useMapLibre` | Basemap style URL and control position |
| `shared/gtfs.js` | `transit-gap`, `ridership` pipelines | MTA GTFS static download + CSV parsing |

These stay scoped to `nyc-transit/` because nothing outside the section uses
them. Anything a second section needs moves up to a repo-root `shared/`.

## Rebuilding data

Each map owns its pipeline and rebuilds independently, from the repo root:

```sh
npm run data:transit-gap     # needs CENSUS_API_KEY in .env
npm run data:ridership
npm run data:bike-safety
npm run data:bike-network
npm run data:all             # all four
```
