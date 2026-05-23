# mta-tracker

A collection of NYC MTA data projects built on GTFS and GTFS-RT feeds.

## Subprojects

| Folder | Description | Stack |
|---|---|---|
| [simple_navigation/](simple_navigation/) | Real-time door-to-door trip tracker (hardcoded route) | Python · Flask · GTFS-RT |
| [density_heatmap/](density_heatmap/) | Bus + subway route density overlaid on population data | TBD |

## Data sources

All projects pull from MTA's public GTFS feeds.
A free API key is required — register at <https://api.mta.info/>.

- **GTFS Static** — full schedule (stops, trips, timetables) as a ZIP of CSVs
- **GTFS-RT** — live protobuf feed updated every ~15–30 s, one per line group