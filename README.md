# mta-tracker

NYC transit and street-safety visualizations, a civic tech company tracker, plus
a couple of standalone MTA experiments.

## Layout

The repo is organized **by surface, not by file type**, and it nests the way the
site nests. Every folder is a thing you can navigate to, holding everything that
thing needs — the component, its data, and the pipeline that built the data:

```
nyc-transit/                    →  /nyc-transit
├── TransitExplorer.tsx             the section's landing page
├── bike-network/               →  /nyc-transit/bike-network
│   ├── BikeNetworkMap.tsx          UI
│   ├── data/bike-network.geojson   what it renders
│   ├── pipeline/                   how that data gets built
│   └── README.md                   what it is, where the data came from
├── ridership/                  →  /nyc-transit/ridership
├── transit-gap/                →  /nyc-transit/transit-gap
├── bike-safety/                →  /nyc-transit/bike-safety
└── shared/                         used by 2+ maps, by nothing outside

civic-tech/                     →  /civic-tech
archive/                        →  /archive
```

So the folder path and the URL path are the same string. To change what
`/nyc-transit/bike-network` shows, everything you need is in
`nyc-transit/bike-network/`.

| Folder | Route | What it is |
|---|---|---|
| [nyc-transit/](nyc-transit/) | `/nyc-transit` | Four maps on transit access, ridership, and bike infrastructure |
| [civic-tech/](civic-tech/) | `/civic-tech` | Hand-maintained list of civic tech companies, for a job search — no pipeline |
| [archive/](archive/) | `/archive` | Retired projects — still runnable, no longer developed |

Everything else:

| Folder | What it is |
|---|---|
| `src/` | App shell only — router, the `/` hub page, global CSS |
| [density_heatmap/](density_heatmap/) | Standalone: bus + subway route density over population (not started) |

Shared code lives at the narrowest scope that covers its consumers.
`nyc-transit/shared/` holds what the maps share; nothing sits in a repo-root
`shared/` until a second section needs it.

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
  line geometry both come from here; shared loader in `nyc-transit/shared/gtfs.js`.
- **MTA GTFS-RT** — live protobuf feed, ~15–30 s refresh. Used by
  `archive/simple-navigation/` only. No API key needed — the feeds are public
  and CORS-enabled, so the browser reads them directly.
- **US Census** — TIGER tract boundaries + ACS 5-year population.
- **NYC Open Data** — motor-vehicle collisions, bike routes, hourly ridership.
