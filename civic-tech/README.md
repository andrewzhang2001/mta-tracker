# Civic Tech Startups

Route: `/civic-tech`

A tracked list of companies building transit, urban planning, and govtech
tools, kept while researching where to apply. Scope is govtech broadly, not
transit only.

The page renders the companies as a table, with a Careers column linking each
company's job board.

## Screening criteria

Out of scope regardless of stage or fit:

- Police and law enforcement software.
- Products whose core function is mass data collection or surveillance.

Data collection is acceptable when it is anonymized or de-identified and serves
a clear public benefit, but it counts as neutral, never as a point in favor. Note
in `notes` when a company sits near this line.

## Data

| File | What it holds | How it's maintained |
|---|---|---|
| `data/companies.ts` | One entry per company: name, website, careers, description, focus areas, founders, size, stage, status, notes, source | Hand-edited |

Add a company by appending an object to the `companies` array. The `Status` type
constrains the tracking state; `focusAreas` strings become the filter chips on
the page automatically. `careers` is the direct job-board URL feeding the Careers
column, so point it at the listings page (`ridewithvia.com/careers/jobs`), not
the marketing page.

`founders` and `size` feed the Team column. `founders` is a list of
`{ name, role }`; an empty list renders as "Founders unknown". `size` is a
headcount string carrying its own as-of year (`'~50 (2026)'`), since public
headcount numbers go stale and disagree between sources — when sources conflict,
record the discrepancy in `notes`.
