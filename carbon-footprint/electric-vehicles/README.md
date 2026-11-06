# Electric Vehicles

Route: `/carbon-footprint/electric-vehicles`

Electric vs gasoline CO₂, split into the two categories that usually get
conflated in the argument: emissions from **building** the car and emissions from
**driving** it. Ends at the break-even mileage where the second repays the first.

## The two categories

| Category | Source | Unit |
|---|---|---|
| Building it | ICCT 2021 global LCA, Tables 2.3 / 2.4 / A.1 | tonnes CO₂e, one-time |
| Driving it | EPA/DOE Beyond Tailpipe Emissions calculator | grams CO₂ per mile |

Building it breaks into body-and-drivetrain and the battery:

| | Gasoline | Electric |
|---|---|---|
| Body, chassis, drivetrain | 7.2 t | 6.5 t |
| Battery (70 kWh @ 60 kg CO₂e/kWh) | none | 4.2 t |
| **Total** | **7.2 t** | **10.7 t** |

The counterintuitive row is the first one: a BEV's non-battery manufacturing is
*lower* than a gasoline car's, because an electric drivetrain has fewer parts
than an engine and transmission. ICCT puts the difference at 10%. So the battery's
4.2 tonnes is partly offset before the car moves, leaving a 3.5-tonne penalty.

## Driving it depends on the grid

Same vehicle (2026 Tesla Model 3 Standard RWD), queried by ZIP code:

| Location | g CO₂/mi |
|---|---|
| San Diego, CA (92101) | 67 |
| Seattle, WA (98101) | 77 |
| US average grid | 104 |
| New York, NY (10001) | 104 |
| Chicago, IL (60601) | 126 |
| Charleston, WV (25301) | 126 |
| *Average new gasoline vehicle* | *400* |

Tailpipe is 0 for all electric rows; every gram is electricity generation. The
spread across grids (67–126) is smaller than the gap to gasoline, so where you
charge changes the size of the win rather than whether there is one.

## Break-even, and why it's trustworthy

`breakEvenMiles()` divides the 3.5-tonne manufacturing penalty by the per-mile
saving. On the average grid that is 3,500,000 g ÷ 296 g/mi ≈ **11,800 miles**.

ICCT ran the same question inside its own single model and published **11,100
miles** for model year 2024 sedans. Two unrelated routes — ICCT manufacturing ×
EPA per-mile here, versus ICCT end-to-end there — landing within a few hundred
miles is the strongest validation on the page. Keep both visible.

Likewise the lifetime reduction: this page computes ~64% on the average grid;
ICCT publishes 60%–68% for the US. This page is the conservative version because
it holds the grid at today's mix, while ICCT models a grid that keeps
decarbonizing across the car's life.

## What's stored vs. computed

`data/vehicles.ts` stores published values only. Break-even, lifetime totals, and
reduction percentages are derived, so correcting an input corrects the page.

## Limits worth keeping attached to these numbers

- **The manufacturing figures mix regions.** Battery values are ICCT's US column;
  the 7.2 / 6.5 t body-and-drivetrain values are the same report's EU/UK
  lower-medium table. US vehicles are heavier, so both would rise — which moves
  the gasoline column too and leaves the 3.5 t gap roughly intact. Right
  magnitude, not right to one decimal.
- **Manufacturing data is from 2021.** Battery carbon intensity has fallen since,
  and LFP chemistry (37–42 kg CO₂e/kWh in ICCT's US column, vs the 60 used here)
  has taken large market share. The build number is probably too high for a car
  made today.
- **Two models, added together.** Manufacturing is ICCT/GREET; per-mile is EPA.
  Different grid assumptions, different baselines. Fine for magnitude, not a
  substitute for a single-model LCA.
- **EPA per-mile is CO₂ only** (EPA states that's 95%–99% of the greenhouse
  effect for a passenger vehicle); manufacturing is CO₂e across all gases.
- **Battery recycling and second-life use are excluded** by ICCT, which would
  lower the electric column further.

## Sources

| Source | Gives |
|---|---|
| [ICCT global LCA, July 2021](https://theicct.org/sites/default/files/publications/Global-LCA-passenger-cars-jul2021_0.pdf) | Battery kg CO₂e/kWh by chemistry and region (Table 2.3), battery capacity and tonnes by region (2.4), body/drivetrain tonnes by powertrain (A.1) |
| [ICCT US sedans & SUVs, July 2024](https://theicct.org/publication/life-cycle-ghg-emissions-of-us-sedans-and-suvs-with-different-powertrains-and-fuel-sources-jul24/) | 11,100-mile break-even, 66% lifetime reduction, 195,000-mile sedan lifetime, 231 g CO₂e/kWh lifetime grid |
| [EPA/DOE Beyond Tailpipe Emissions](https://www.fueleconomy.gov/feg/Find.do?action=bt2) | Per-mile CO₂ for a specific EV by ZIP code, and the 400 g/mi gasoline baseline |
| [EPA Typical Passenger Vehicle](https://www.epa.gov/greenvehicles/greenhouse-gas-emissions-typical-passenger-vehicle) | The 400 g/mi gasoline figure in its own right |

Both ICCT URLs and the fueleconomy.gov calculator reject automated fetching
without a browser user-agent. Open them by hand when re-checking.

No pipeline, no build step.
