# mta-tracker

NYC transit and street-safety visualizations, plus a couple of standalone MTA
experiments.

## Layout

The site is organized **by visualization, not by file type**. Each top-level
folder is one thing you can look at on the site, and it holds everything that
thing needs — the component, its data, and the pipeline that built the data:

```
bike-network/
├── BikeNetworkMap.tsx          UI
├── data/bike-network.geojson   what it renders
├── pipeline/                   how that data gets built
└── README.md                   what it is, where the data came from
```

So the repo navigates the way the site does. To change what `/bike-network`
shows, everything you need is in `bike-network/`.

| Folder | Route | What it shows |
|---|---|---|
| [transit-gap/](transit-gap/) | `/transit-gap` | Time to reach a subway from anywhere in NYC, weighted by density |
| [ridership/](ridership/) | `/ridership` | Subway ridership over a 24h day, by day type |
| [bike-safety/](bike-safety/) | `/bike-safety` | Crash injuries before vs. after four protected-lane redesigns |
| [bike-network/](bike-network/) | `/bike-network` | Bike lane growth, 1997–today |

Everything else:

| Folder | What it is |
|---|---|
| `src/` | App shell only — router, landing page, global CSS |
| `shared/` | Code used by more than one feature (currently GTFS download + CSV parsing) |
| [simple_navigation/](simple_navigation/) | Standalone: real-time door-to-door trip tracker (Python · Flask · GTFS-RT) |
| [density_heatmap/](density_heatmap/) | Standalone: bus + subway route density over population (not started) |

## Running

```sh
npm install
npm run dev      # dev server
npm run build    # typecheck + production build
```

Data files are committed, so a fresh clone runs without rebuilding anything.

## Rebuilding data

Each feature owns its pipeline and rebuilds independently:

```sh
npm run data:transit-gap     # needs CENSUS_API_KEY in .env
npm run data:ridership
npm run data:bike-safety
npm run data:bike-network
npm run data:all             # all four
```

Data is imported by the components with Vite's `?url` suffix
(`import tractsUrl from './data/tracts.geojson?url'`), which is what lets it live
next to the feature instead of in `public/`. Vite emits each file as a hashed
asset at build time, so the datasets are cache-busted rather than served from a
fixed path.

## Data sources

- **MTA GTFS static** — full schedule as a ZIP of CSVs. Stop headways and subway
  line geometry both come from here; shared loader in `shared/gtfs.js`.
- **MTA GTFS-RT** — live protobuf feed, ~15–30 s refresh. Used by
  `simple_navigation/` only. Free key at <https://api.mta.info/>.
- **US Census** — TIGER tract boundaries + ACS 5-year population.
- **NYC Open Data** — motor-vehicle collisions, bike routes, hourly ridership.
