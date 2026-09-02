# Streetfight — Corridor Safety

Route: [`/nyc-transit/bike-safety`](../../src/App.tsx) · Component: [`CorridorSafetyMap.tsx`](CorridorSafetyMap.tsx)

Did protected bike lanes make NYC streets safer? Crash injuries before vs. after
the redesign of four corridors, measured against the citywide trend so a drop
isn't credited to the lane when the whole city was getting safer anyway.

## Data

| File | Built by | Source |
|---|---|---|
| `data/bike-corridors.json` | `pipeline/process-bike-safety.js` | NYC Open Data motor-vehicle collisions |

Holds per-corridor lane geometry plus before/after injury and fatality counts by
year, alongside the citywide baseline used for comparison.

## Rebuild

```sh
npm run data:bike-safety
```
