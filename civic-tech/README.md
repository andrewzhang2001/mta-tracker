# Civic Tech Startups

Route: `/civic-tech`

A tracked list of companies building transit, urban planning, and civic
infrastructure tools, kept while researching where to apply.

The page renders the companies as a table, with a Careers column linking each
company's job board.

## Data

| File | What it holds | How it's maintained |
|---|---|---|
| `data/companies.ts` | One entry per company: name, website, careers, description, focus areas, stage, status, notes, source | Hand-edited |

Add a company by appending an object to the `companies` array. The `Status` type
constrains the tracking state; `focusAreas` strings become the filter chips on
the page automatically. `careers` is the direct job-board URL feeding the Careers
column, so point it at the listings page (`ridewithvia.com/careers/jobs`), not
the marketing page.
