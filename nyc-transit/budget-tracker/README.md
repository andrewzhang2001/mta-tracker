# MTA Budget Tracker

Route: [`/nyc-transit/budget-tracker`](../../src/App.tsx) · Component: [`BudgetTrackerPage.tsx`](BudgetTrackerPage.tsx)
· Specs: [`docs/specs/budget-tracker/`](../../docs/specs/budget-tracker/)

One card per MTA agency with up to three sections:

- **Expenses:** FY2025 actuals including debt service, as a donut by expense family.
- **Operating revenue:** FY2025 actuals, as a stacked bar of fares or tolls and other revenue.
- **Capital projects:** 2025–2029 capital plan allocations, as ranked bars by category.

Operating figures exclude work paid for by the capital budget. Capital figures
are five-year budget allocations and are never combined with operating figures.

## Layers

```
raw CSVs ──pipeline/──▶ data/*.json ──source/staticFileSource.ts──▶ source/budgetData.ts ──▶ UI
```

| File | Role |
|---|---|
| `pipeline/process-statement-of-operations.js` | Statement of Operations CSV → `data/operations.json` |
| `pipeline/process-capital-plan.js` | Capital plan CSV → `data/capital-plan.json` |
| `pipeline/csv.js` | CSV reading and validation shared by both scripts |
| `pipeline/agencies.js` | The one agency mapping: IDs, full names, capital-plan codes |
| `source/budgetData.ts` | The data interface: domain types, async queries, and the active source. The UI imports data from here only. |
| `source/staticFileSource.ts` | Interface implementation that reads the computed files |
| `expenseFamilies.ts`, `revenueLines.ts` | Group source lines into chart slices and segments, and assign their colors |
| `BudgetTrackerPage.tsx`, `AgencyCard.tsx`, `ExpenseSection.tsx`, `RevenueSection.tsx`, `CapitalSection.tsx`, `parts.tsx` | UI |
| `amounts.ts`, `format.ts`, `theme.ts` | Sums and shares, number formatting, colors |

To switch to an API, write another `BudgetDataSource` implementation in
`source/` and assign it to `budgetData`.

## Data

| File | Built by | Source |
|---|---|---|
| `data/operations.json` | `pipeline/process-statement-of-operations.js` | MTA Statement of Operations: Beginning 2019 (NYC Open Data), downloaded CSV |
| `data/capital-plan.json` | `pipeline/process-capital-plan.js` | MTA 2025–2029 Capital Plan: ACEP Projects (NYC Open Data), downloaded CSV |

The raw CSVs are not committed.

### Shared validation (`pipeline/csv.js`)

Both scripts stop before writing anything when a required column is missing, a
row's field count differs from the header's, or an amount is not a number with
optional thousands commas. A leading byte-order mark is stripped.

### Agencies (`pipeline/agencies.js`)

- **Operating codes** (`NYCT`, `LIRR`, …) are used directly as agency IDs.
- **Capital plan codes** map onto those same IDs, so both datasets meet on one card per agency:

  | Capital code | Agency ID |
  |---|---|
  | `T` | `NYCT` |
  | `L` | `LIRR` |
  | `M` | `MNR` |
  | `D` | `BT` |
  | `U` | `MTABC` |
  | `S` | `SIR` |
  | `N` | MTA Interagency |
  | `G` | Major Projects and Expansion |

  `N` and `G` have no operating counterpart.
- **`CRR`** appears only in debt service. It is named "Commuter Railroads (LIRR + Metro-North)" because LIRR and Metro-North have no debt service rows of their own. The dataset doesn't define `CRR`, so the name is inferred, and `AGENCY_NOTES` puts that on its card.
- **Full names** for operating agencies come from MTA financial plan headings, because no official glossary was found. `GCMCOC` also appears as `GCMOC` in some MTA documents.
- **Unmapped codes:** either script stops with an error when it meets one.

### Statement of Operations transformations

1. **Filter.** Keep rows where `Scenario` is `Actual` and `Fiscal Year` is in `FISCAL_YEARS` (currently `2025`).
2. **Expenses.** Rows with `Type` = `Total Expenses Before Non-Cash Liability Adjs.` or `Debt Service Expenses`:
   - `NREIMB` rows are summed per agency and `General Ledger` line. Each line also gets a `group` from its `Subtype`:

     | `Subtype` | `group` |
     |---|---|
     | `Labor Expenses` | `labor` |
     | `Non-Labor Expenses` | `non-labor` |
     | `Other Expense Adjustments` | `adjustments` |
     | `Debt Service Expenses without Extraordinary Events` | `debt-service` |

     An unknown `Subtype` stops the script.
   - `REIMB` rows are dropped: work paid for by the capital budget.
3. **Operating revenue.** Rows with `Type` = `Total Revenue`:
   - `NREIMB` rows are summed per agency and `General Ledger` line.
   - `REIMB` rows are dropped. These are mainly `Capital and Other Reimbursements`, which match the dropped `REIMB` expenses almost to the dollar.
4. **Dropped types.** Non-cash liabilities are dropped.
5. **Excluded agencies.** `EXCLUDED_AGENCIES` (currently `CD`, MTA Construction & Development) are dropped. CD delivers capital projects. In FY2025, $168.2M of its $168.25M in expenses was reimbursable, leaving −$0.45M of operating expenses.
6. **Unknown expense types.** An `Expense Type` other than `REIMB` or `NREIMB` stops the script.
7. **Signs.** Signs are kept. `Reimbursable Overhead` is negative in `NREIMB`: it credits overhead charged to capital work.
8. **Round.** Amounts round to cents.
9. **Provenance.** The file records the source file name, the source row count, and `actualsThrough`, the latest `Actual` month in the whole CSV.
10. **Sort.** Output is sorted, so the same input gives byte-identical output.

### Capital plan transformations

1. **Top-level projects only.** Rows with a `Parent ACEP` are sub-projects. Their `Total Budget` is blank, and their budget sits on the parent, so they are skipped.
2. **Units.** `Total Budget` is read as millions of dollars and converted to dollars. The CSV doesn't state its units. Millions fits the data: "Purchase 355 New B-Division Cars" is `1,775`, and top-level projects sum to $68.4B.
3. **Blank budgets.** A blank `Total Budget` on a top-level project counts toward project counts and adds nothing to amounts. One project has one: `M9040108`, Harmon to Poughkeepsie Signal System.
4. **Categories.** `Category Description` is title-cased; `MTA` and `TSMO` stay uppercase.
5. **Sum.** Projects are summed per agency and category. Each category keeps its project count, its count of projects with no budget listed, and its 3 largest projects.
6. **Sort.** Output is sorted, so the same input gives byte-identical output.

### Chart rules (UI)

- **Expense families.** Each expense slice is a family from `expenseFamilies.ts`, and each revenue segment is a kind from `revenueLines.ts`. Both keep a fixed order and color, and unlisted lines fall into Other.
- **Debt service.** Every line in group `debt-service` falls into the Debt service family, so new bond names need no code change.
- **Fares and tolls.** These share one revenue segment, labeled by the lines the agency has. No FY2025 agency has both.
- **Negatives.** A family or revenue kind that nets negative is listed under its chart instead of drawn. The section total is the net of all lines.
- **Overhead credit.** The `Reimbursable Overhead` credit (family `isCredit`) nets into the expense total but is neither drawn nor listed. The page header notes it once.
- **Shares.** Shares are computed against the sum of the drawn parts.
- **Capital bars.** Capital bars are scaled to the agency's largest category.

## Rebuild

```sh
npm run data:budget-tracker:operations -- path/to/MTA_Statement_of_Operations__Beginning_2019_YYYYMMDD.csv
npm run data:budget-tracker:capital -- path/to/MTA_2025-2029_Capital_Plan_ACEP_Projects_YYYYMMDD.csv
```
