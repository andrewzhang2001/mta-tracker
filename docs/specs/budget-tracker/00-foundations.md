# MTA Budget Tracker — Foundations

Claims here hold for every version of the page, regardless of which years,
scenarios, or measures it covers.

Source dataset: NYC Open Data, *MTA Statement of Operations: Beginning 2019*.

## SECTION 1. DATA SOURCE INDEPENDENCE

**SRC-1.** The UI must read budget data only through the budget data interface.
No UI module imports the raw CSV, the pipeline, or the computed data file
directly.

**SRC-2.** The data interface must be expressed in domain terms: agency,
fiscal year, scenario, expense category, amount. Raw column names and source
codes (`General Ledger`, `NREIMB`) do not appear in interface types.

**SRC-3.** Every data interface query must be asynchronous, so a network-backed
source can replace a file-backed one without changing call sites.

**SRC-4.** Replacing the computed file with an API must require changes only
inside the data interface's implementation. No UI component changes.

**SRC-5.** Interface queries must take their filters (fiscal year, scenario,
agency) as parameters, even when only one value of a filter is currently
supported.

## SECTION 2. DATA PIPELINE

**PIPE-1.** A script must convert each raw CSV into a computed data file holding
only the aggregates the UI needs. The computed file contains no raw rows.

**PIPE-2.** *(amended by 02)* Each source dataset must have its own script, run
from its own npm command that takes the CSV path as an argument. A new download
with the same schema requires no code change.

**PIPE-3.** All handling of source format quirks must live in the pipeline:
comma-grouped amounts, unquoted empty fields, CRLF line endings, column names.

**PIPE-4.** The script must stop with an error naming the problem when an
expected column is missing, a row has the wrong field count, or an amount does
not parse. It never writes partial output.

**PIPE-5.** The same input must produce byte-identical output.

**PIPE-6.** The computed file must record its provenance: source file name,
source row count, and the latest month of actuals in the source. It records no
generation timestamp, so PIPE-5 holds.

**PIPE-7.** The feature README must document every transformation the script
applies: filters, groupings, sums, sign handling, and agency name mapping.

## SECTION 3. PRESENTATION

**PRES-1.** Agencies must be shown by full name. Codes appear only as secondary
text. The code-to-name mapping lives in one place.

**PRES-2.** Dollar amounts must be shown abbreviated to three significant
figures with a unit (`$12.5B`, `$507M`). The exact value is available on hover
or focus.

**PRES-3.** The page must state which fiscal year, scenario, and data source
the figures shown come from.
