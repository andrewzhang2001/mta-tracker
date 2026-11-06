# MTA Budget Tracker — 02: Operating Revenue and Capital Projects

Adds operating revenue and the 2025–2029 capital plan to each agency.

Amends `00-foundations` § PIPE-2 and `01-fy2025-agency-expenses` § SCOPE-4,
AGY-1, AGY-3, AGY-5, AGY-6.

## SECTION 1. SCOPE

**SCOPE-4** *(amended)*. Reimbursable amounts, work paid for by the capital
budget, are excluded from operating expenses and operating revenue. The page
states this once; agency cards do not show reimbursable amounts.

**SCOPE-5.** Operating revenue means `Actual` rows of type *Total Revenue* for
fiscal year 2025.

**SCOPE-6.** Capital projects come from the *MTA 2025–2029 Capital Plan: ACEP
Projects* dataset. Capital figures are five-year budget allocations. They are
never added to, subtracted from, or divided by operating figures.

## SECTION 2. AGENCY CARD

**CARD-1.** Each agency has one card with up to three sections: operating
expenses, operating revenue, and capital projects. A section the agency has no
data for is omitted.

**CARD-2.** *(amended by 03)* The card header shows the agency's operating expense total,
operating revenue total, and 2025–2029 capital plan total.

**CARD-3.** When an agency has both operating expenses and operating revenue,
the card states the share of operating expenses that operating revenue covers.

**CARD-4.** Agencies are matched across datasets by one agency mapping. An
agency present in only one dataset still gets a card.

**AGY-1** *(amended)*. The operating expenses section shows a donut chart of the
agency's FY2025 operating expenses.

**AGY-5** *(amended; amended again by 03)*. Each slice is an expense family, a fixed group of
General Ledger lines (e.g. Benefits & pensions = Health and Welfare, Pension,
OPEB Current Payments, Other Fringe Benefits). There are at most 7 drawn
families: six named spending families and "Other", which holds every line not
assigned to another family. Reimbursable Overhead, a credit for overhead the
capital budget pays, nets into the agency total and is neither drawn nor listed;
the page states this once.

**AGY-6** *(amended)*. A family with a negative net amount is never drawn as a
slice. It is listed beneath the chart with its amount, except the Reimbursable
Overhead credit (AGY-5).

**AGY-3** *(amended)*. Cards are ordered by operating expense total, largest
first. Agencies without operating expenses follow, ordered by capital plan
total.

## SECTION 3. OPERATING REVENUE

**REV-1.** *(amended by 03)* The revenue section shows one stacked horizontal bar with one segment
per revenue line: fares, tolls, other revenue. Segments keep a fixed order and
color on every card.

**REV-2.** A revenue line with a negative net amount is never drawn as a
segment. It is listed beneath the bar with its amount.

**REV-3.** Hovering or focusing a segment shows its name, exact amount, and share
of the bar.

**REV-4.** Revenue segment colors are distinct from expense family colors.

## SECTION 4. CAPITAL PROJECTS

**CAP-1.** The capital section shows the agency's 2025–2029 plan total and one
bar per capital category, ranked largest first.

**CAP-2.** Only top-level projects count. Sub-projects carry no budget of their
own and are never counted.

**CAP-3.** Hovering or focusing a category shows its project count and its
largest projects with their budgets.

**CAP-4.** The section labels its figures as five-year plan allocations.

**CAP-5.** A project with no budget listed counts toward project counts and
adds nothing to amounts.

## SECTION 5. PIPELINE

**PIPE-2** *(amended)*. Each source dataset has its own script, run from its
own npm command that takes the CSV path as an argument. A new download with the
same schema requires no code change.
