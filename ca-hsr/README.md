# California High-Speed Rail

Routes: `/ca-hsr` (map) and `/ca-hsr/:scenario` (one phase's budget); see the table below.

A full-screen MapLibre map of California with state borders and a labeled
marker for each place in `data/places.ts`: the Phase 1 stops from San Francisco
to Anaheim, as named in the 2026 Business Plan Basis of Estimate. Straight
lines between stops show the four budget scenarios, one color per section of
track each scenario adds. [`PhaseLegend.tsx`](PhaseLegend.tsx) lists each
section's added cost and the running total.

Hovering near a line highlights that phase; clicking it, or its legend row,
opens the phase's budget page.

Both maps draw their lines and markers from [`phaseMap.ts`](phaseMap.ts).

| Route | Component | What it shows |
|---|---|---|
| `/ca-hsr` | [`CaHsrPage.tsx`](CaHsrPage.tsx) | The map |
| `/ca-hsr/:scenario` | [`phase/PhasePage.tsx`](phase/PhasePage.tsx) | On the left, a map zoomed to the phase's section ([`phase/SectionMap.tsx`](phase/SectionMap.tsx)). On the right, the phase's added cost by segment, then a drill-down of the full scenario (segment → cost category → line item, from `line-items.csv`) with a pie of the current level |

`:scenario` is a slug from `scenarios.csv`, e.g. `/ca-hsr/sf-palmdale`.

## Data

| File | What it holds | How it's maintained |
|---|---|---|
| `data/places.ts` | Name and `[lng, lat]` for each marker | Hand-edited; coordinates from OpenStreetMap via Nominatim |
| `data/phases.ts` | The four Business Plan scenarios as colored lines: stops, color, P65 total | Hand-edited stops; totals read from `business-plan-2026/scenarios.csv` |

Add a place by appending to the `places` array. No pipeline.

## data/business-plan-2026/

Tables from the CA HSR 2026 Business Plan Capital Cost Basis of Estimate (PDF).
CSV, one table per file. Money columns ending `_usd` are dollars; `_musd` are
millions of dollars, as printed. Scenario slugs: `merced-bakersfield`,
`sf-bakersfield`, `sf-palmdale`, `phase-1`.

| File | What it holds | Source in the PDF | How it's built |
|---|---|---|---|
| `line-items.csv` | Every SCC level 2 line, per scenario and segment | Appendix C.1–C.4 | Pipeline |
| `segment-totals.csv` | Total per segment, per scenario | Appendix C section totals | Pipeline |
| `scenario-by-scc.csv` | Scenario rollup by SCC, with a TOTAL row | C.1.6, C.2.8, C.3.12, C.4.9 | Pipeline |
| `contingency-rates.csv` | P30 contingency % by SCC and segment; blank = N/A | Appendix B | Pipeline |
| `estimate-tables.csv` | Prior vs 2026 estimate and spent-to-date, by scope element | Tables 2–6, 19–24, 31–32 | Hand-transcribed |
| `scenarios.csv` | Totals, completion, service, trainsets, stations, passing track, P30 costs | Tables 3–6, 8, 10–12, 16, and narrative text | Hand-transcribed |
| `shared-benefit-costs.csv` | Costs outside every scenario total | Table 30 | Hand-transcribed |
| `key-quantities.csv` | Guideway miles, track feet, stations, facilities | Tables 18, 26, 28, 29 | Hand-transcribed |
| `bookends.csv` | Northern and Southern bookend estimate and spend | Table 13 | Hand-transcribed |
| `inflation.csv` | Escalation rate per year | Table 14 | Hand-transcribed |

Rebuild from the repo root:

```sh
npm run data:ca-hsr:business-plan -- <path to PDF>
```

Needs `pdftotext` (`poppler-utils`). The script writes the pipeline CSVs and
checks the hand-transcribed ones. It exits without writing if:

- an Appendix C section's rows don't sum to its printed TOTAL
- a scenario's segment totals don't sum to its rollup
- a transcribed table's rows don't sum to its printed subtotal or total, beyond rounding
- a transcribed scenario total differs from its Appendix C total

The PDF itself prints three totals that don't match their rows: Table 20's
prior and 2026 totals, and Table 3's Bookend spent ($854M; Table 32 prints
$847M). These are listed in `KNOWN_SOURCE_MISMATCHES` in the pipeline and kept
as printed.

Merced, Madera, Fresno, Bakersfield, Los Angeles, and San Francisco are city
centers, not station sites. The Wye is the SR 152 / Road 11 intersection, a
junction with no station. Every other point is an OSM station node. The Authority publishes exact station coordinates on ArcGIS, but
its license forbids redistribution without approval, so none of its data is
copied here.
