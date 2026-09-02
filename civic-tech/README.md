# Civic Tech Startups

Route: `/civic-tech`

A tracked list of companies building transit, urban planning, and civic
infrastructure tools, kept while researching where to apply.

## Data

| File | What it holds | How it's maintained |
|---|---|---|
| `data/companies.ts` | One entry per company: name, website, description, focus areas, stage, status, notes, source | Hand-edited |

Add a company by appending an object to the `companies` array. The `Status` type
constrains the tracking state; `focusAreas` strings become the filter chips on
the page automatically.
