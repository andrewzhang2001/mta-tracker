# Carbon Footprint

Route: `/carbon-footprint`

Supply-side and demand-side CO₂ statistics, building toward an argument: that
shifting to public transit and solar is the change that moves the number. Grows
by case study — average American car consumption first, more over time.

The page is data-driven and meant to hold up to scrutiny, so the structure
enforces sourcing rather than trusting it.

## Subpages

| Folder | Route | What it is |
|---|---|---|
| [driving-by-metro/](driving-by-metro/) | `/carbon-footprint/driving-by-metro` | Per-capita driving in New York, Los Angeles, and San Diego vs the national urban average, and the CO₂ saved if every urbanized area drove at New York's rate |
| [electric-vehicles/](electric-vehicles/) | `/carbon-footprint/electric-vehicles` | Electric vs gasoline split into building the car and driving it, ending at the break-even mileage |

Sources cited by more than one page are defined once in `data/figures.ts` and
imported from there, so a URL and its access date have a single home. A source
used by exactly one subpage stays in that subpage's data file.

## The verification rule

A figure carries a number only after a human opened its source URL and read it
there. This is enforced by the type, not by convention — in `data/figures.ts`,
`Figure` is a union:

| Variant | Has `value` | Renders as |
|---|---|---|
| `VerifiedFigure` | yes, plus `unit`, `year`, and `check` | the number, with source and check date |
| `PendingFigure` | no — carries `expects` instead | "Not yet verified", plus which source to read and what to look for |

So adding a number without marking it verified is a type error. Pending entries
are published deliberately: they show what the page intends to claim and hand the
reader the link to check it.

`source.accessed` is the date someone last read the figure off the page. Refresh
it when re-checking — the figures here come from sources that revise annually,
and US federal pages have been moving.

## Verifying a pending figure

1. Open the `source.url` on the entry.
2. Read the quantity described in `expects`.
3. Change `status: 'pending'` to `status: 'verified'`, drop `expects`, and add
   `value`, `unit`, `year`, and `check`.
4. Set `source.accessed` to today.

`check` records how the number was read: `'by hand'` for a person opening the
page, `'fetched'` for a programmatic pull. Both are checks against the primary
source, and the page prints which one, so it stays visible that a fetched figure
had no human reading the context around it.
5. Keep the `caveats` — they describe what the number excludes, which does not
   stop being true once it's verified.

## Unit conventions

Global quantities display as **billion tonnes CO₂**. Per-person quantities stay
in **tonnes CO₂ per year** and **grams CO₂ per mile**.

The Global Carbon Budget publishes two units for the same quantity: its press
material uses GtCO₂, its journal paper uses gigatonnes of *carbon* (GtC).
**1 GtC = 3.664 GtCO₂.** Mixing them silently is a 3.7× error. Any figure
converted from GtC records the conversion in its `conversion` field.

## Sources

| Source | Covers | Notes |
|---|---|---|
| [Global Carbon Budget 2025](https://globalcarbonbudget.org/fossil-fuel-co2-emissions-hit-record-high-in-2025/) | Worldwide fossil and land-use CO₂, atmospheric concentration, remaining 1.5 °C budget | Published in GtCO₂. 2025 values are projections, settled in the next annual budget |
| [Friedlingstein et al. 2026, *ESSD* 18, 3211–3288](https://essd.copernicus.org/articles/18/3211/2026/) | The full budget including ocean and land sinks | Peer-reviewed. Published in GtC |
| [Global CCS Institute, *Global Status of CCS 2025*](https://www.globalccsinstitute.com/wp-content/uploads/2025/10/GSR-2025-Executive-Summary-21-October.pdf) | Operating capture facilities and their capacity | Industry-funded; capacity ≠ throughput; much of it feeds enhanced oil recovery |
| [IEA CCUS Projects Database](https://www.iea.org/data-and-statistics/data-product/ccus-projects-database) | Project-level capture data, >100 kt/yr (>1 kt/yr for direct air capture) | Neutral cross-check on the above. Blocks automated fetching — open it by hand |
| [EPA, Typical Passenger Vehicle (EPA-420-F-23-014)](https://www.epa.gov/greenvehicles/greenhouse-gas-emissions-typical-passenger-vehicle) | Per-vehicle annual CO₂, grams per mile, CO₂ per gallon | Tailpipe only — no fuel production, no vehicle manufacturing |
| [Our World in Data CO₂ dataset](https://github.com/owid/co2-data) | Per-country and per-capita time series, CSV/JSON | Not yet used; the route in if this page needs charts |

## Data

| File | What it holds | How it's maintained |
|---|---|---|
| `data/figures.ts` | Every figure on the page, with source, scope, caveats, and verification status | Hand-edited; no pipeline |

No build step. Nothing here is fetched at runtime.
