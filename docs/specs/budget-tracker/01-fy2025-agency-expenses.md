# MTA Budget Tracker — 01: FY2025 Expenses by Agency

The first version of the page. It shows how each MTA agency's FY2025 operating
expenses divide across expense categories.

## SECTION 1. SCOPE

**SCOPE-1.** The page covers fiscal year 2025 only.

**SCOPE-2.** The page shows the `Actual` scenario only. Budget and plan
scenarios are out of scope.

**SCOPE-3.** *(amended by 03)* "Expenses" means rows of type *Total Expenses Before Non-Cash
Liability Adjs.*, i.e. labor, non-labor, and other expense adjustments. Debt
service, non-cash liabilities, and revenue are out of scope.

**SCOPE-4.** *(amended by 02)* Reimbursable and non-reimbursable amounts are summed into one
figure per category.

## SECTION 2. AGENCY BREAKDOWN

**AGY-1.** *(amended by 02)* The page shows one pie chart per agency with FY2025 expenses.

**AGY-2.** The page supports filtering by agency: the user can show all agencies
or a single agency.

**AGY-3.** *(amended by 02)* Charts are ordered by agency total expense, largest first.

**AGY-4.** Each chart shows the agency's total expense, net of negative
categories.

**AGY-5.** *(amended by 02)* Each slice is an expense family, a fixed group of General Ledger
lines (e.g. Benefits & pensions = Health and Welfare, Pension, OPEB Current
Payments, Other Fringe Benefits). There are at most 7 families, one of them
"Other", which holds every line not assigned to a named family.

**AGY-6.** *(amended by 02)* A family with a negative net amount is never drawn as a slice. It is
listed beneath the chart with its amount.

**AGY-7.** Hovering or focusing a slice shows its family name, amount, share of
the chart's positive total, and the General Ledger lines it contains with their
amounts.

**AGY-8.** A family has the same color and the same position in slice order in
every agency's chart.

## SECTION 3. PAGE

**PAGE-1.** The page lives at `/nyc-transit/budget-tracker` and appears as a
card on the NYC Transit Explorer page.

## Future direction (non-binding)

Later specs will likely widen the data interface to query all fiscal years,
scenarios, and months. Planned views include budget versus actual and revenue.
SRC-5 keeps those additions from changing existing call sites.
