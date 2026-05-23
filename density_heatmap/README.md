# density_heatmap 🗺️

**Idea:** Overlay MTA bus and subway route coverage on NYC population density
to surface gaps — neighbourhoods that are densely populated but underserved
by transit, which could inform where new lines or extensions make sense.

## Concept

```
NYC population data (census blocks)
        +
MTA bus route shapefiles  (GTFS shapes.txt)
        +
MTA subway route shapefiles (GTFS shapes.txt)
        ↓
heatmap: density of people per unit of nearby transit coverage
        ↓
highlight areas: high population density, low route density
```

## Potential data sources

| Data | Source | Format |
|---|---|---|
| NYC population (census block level) | [Census Bureau](https://data.census.gov/) / [NYC Open Data](https://opendata.cityofnewyork.us/) | CSV / shapefile |
| Subway route shapes | MTA GTFS static `shapes.txt` | CSV |
| Bus route shapes | MTA Bus GTFS `shapes.txt` | CSV |
| NYC borough / neighbourhood boundaries | [NYC Open Data](https://data.cityofnewyork.us/City-Government/Borough-Boundaries/7t3b-ywvw) | GeoJSON |

## Questions to answer

- Which neighbourhoods have the highest population-to-transit-coverage ratio?
- Where do bus routes concentrate relative to subway coverage?
- Are there dense areas with no subway stop within a 10-minute walk?

## Status

🟡 Planning — not started yet.
