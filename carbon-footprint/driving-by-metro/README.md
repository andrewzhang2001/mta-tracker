# Driving by Metro

Route: `/carbon-footprint/driving-by-metro`

Per-capita driving in three metros against the national urban average, and a
scenario pricing what the US would save if every urbanized area drove at New
York's rate.

## What's stored vs. what's computed

`data/metros.ts` stores only columns copied off a published table — population
and daily vehicle-miles per area, plus four constants. Every per-capita figure,
CO₂ figure, percentage, and scenario total is derived at render time from those
inputs. Correcting an input corrects the page; no figure is typed in twice.

| Stored | Derived |
|---|---|
| `population`, `dailyVmtThousands` per area | miles per person per day and per year, tonnes CO₂ per person, ratio to New York |
| `GRAMS_CO2_PER_MILE`, `US_TOTAL_GHG_MMT`, `WORLD_FOSSIL_CO2_BILLION_TONNES` | the whole `benchmarkScenario()` result |

## The scenario

`benchmarkScenario()` holds every urbanized area's population fixed, drops
per-capita driving to New York's rate, and converts the difference to CO₂:

```
actual urban VMT       = 5,526,899 thousand mi/day × 365
at New York's rate     = 237,251,201 people × 14.51 mi/day × 365
CO₂ avoided            = (difference) × 400 g/mile
```

It is arithmetic on a gap, not a forecast. It does not model cost, timeline, or
the emissions of the transit that would absorb the trips. It also does not raise
areas already below New York's rate — one national rate is applied, so the result
is the distance between how America drives and how New York drives.

## Two independent CO₂-per-mile factors

The page shows both on purpose:

| Factor | Where it comes from |
|---|---|
| 400 g/mile | EPA's own figure, from an assumed 22.2 mpg and 8,887 g CO₂/gallon |
| 379 g/mile | Derived from FHWA VM-1: the 2024 light-duty fleet drove 2,924,107 million miles on 124,798,269 thousand gallons → 23.4 mpg → 8,887 ÷ 23.4 |

Two unrelated datasets landing 5% apart is the reason to trust either. The tables
use EPA's 400 g, the more conservative choice for an argument about driving less.

## What the numbers are not

- **HM-71 counts all traffic, not personal driving.** Every vehicle-mile on area
  roads — freight, delivery, interstate through-traffic — over resident
  population. Fair for ranking places; wrong as "what one person drives."
- **Urbanized area is not city.** New York's figure includes Jersey City, Newark,
  and the Long Island and Westchester suburbs, which drags it up. The gap
  understates what the city proper achieves.
- **Tailpipe only.** No fuel refining, no vehicle manufacturing.
- **Urban only.** The 455 urbanized areas hold 237 of ~340 million Americans.

## Data

| File | What it holds | How it's maintained |
|---|---|---|
| `data/metros.ts` | Population and daily VMT per area, emissions factors, scenario math | Hand-edited from FHWA tables |

To add a metro: find its row in [Table HM-71](https://www.fhwa.dot.gov/policyinformation/statistics/2024/hm71.cfm),
copy the `CENSUS POPULATION` column and the last column (`DAILY VEHICLE-MILES OF
TRAVEL (THOUSANDS)` → `TOTAL`), and append an `Area`. Everything else follows.

Watch out when re-parsing that table: it is split across 8 sheets and sheet 8
ends with a `TOTAL` row. Summing all rows double-counts the country — the
`allUrbanizedAreas` entry here *is* that TOTAL row.

## Sources

| Source | Gives |
|---|---|
| [FHWA Highway Statistics 2024, Table HM-71](https://www.fhwa.dot.gov/policyinformation/statistics/2024/hm71.cfm) | Population and daily VMT for all 455 Federal-Aid urbanized areas |
| [FHWA Highway Statistics 2024, Table VM-1](https://www.fhwa.dot.gov/policyinformation/statistics/2024/vm1.cfm) | National VMT, fuel consumed, and fleet fuel economy by vehicle class |
| [EPA, Typical Passenger Vehicle](https://www.epa.gov/greenvehicles/greenhouse-gas-emissions-typical-passenger-vehicle) | 400 g CO₂/mile, 8,887 g/gallon |
| [EPA GHG Inventory](https://www.epa.gov/ghgemissions/inventory-us-greenhouse-gas-emissions-and-sinks) | US total emissions, the denominator for the national share |

No pipeline, no build step.
