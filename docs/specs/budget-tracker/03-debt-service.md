# MTA Budget Tracker — 03: Debt Service

Counts debt service as an expense, matching how the MTA presents its operating
budget.

Amends `01-fy2025-agency-expenses` § SCOPE-3, `02-revenue-and-capital` § CARD-2,
REV-1, AGY-5.

## SECTION 1. SCOPE

**SCOPE-3** *(amended)*. "Expenses" means non-reimbursable rows of type *Total
Expenses Before Non-Cash Liability Adjs.* and of type *Debt Service Expenses*.
Non-cash liabilities and revenue are out of scope for expenses.

**SCOPE-7.** Debt service is shown under the agency the dataset assigns it to.
It is never redistributed between agencies.

## SECTION 2. AGENCY CARD

**CARD-2** *(amended)*. The card header shows the agency's expense total
(including debt service), operating revenue total, and 2025–2029 capital plan
total.

**CARD-5.** An agency whose name or identity is inferred, not stated by the
dataset, shows a note on its card saying so.

**AGY-5** *(amended)*. Each slice is an expense family, a fixed group of
General Ledger lines (e.g. Benefits & pensions = Health and Welfare, Pension,
OPEB Current Payments, Other Fringe Benefits). There are at most 8 drawn
families: six named spending families, "Debt service", which holds every debt
service line, and "Other", which holds every line not assigned to another
family. Reimbursable Overhead, a credit for overhead the capital budget pays,
nets into the agency total and is neither drawn nor listed; the page states this
once.

## SECTION 3. OPERATING REVENUE

**REV-1** *(amended)*. The revenue section shows one stacked horizontal bar with
two segments: fares and tolls together, and other revenue. The fares-and-tolls
segment is labeled by the lines the agency has ("Fares", "Tolls", or both).
Segments keep a fixed order and color on every card.
