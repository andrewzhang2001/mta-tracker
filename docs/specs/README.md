# Specs

Each spec is a list of numbered behavior claims. A claim states what the system
does, in terms a reviewer can check against the running page or the code.

## Conventions

- Specs live in `docs/specs/<feature>/`, numbered in the order they were written.
- A claim ID is `<SECTION>-<n>`, unique within its feature. Cite it from another
  feature as `<feature> § <ID>`, e.g. `budget-tracker § SRC-1`.
- IDs are permanent. A changed claim keeps its ID and gets new text. A dropped
  claim stays in place, marked **Repealed** with the spec that repealed it.
  An ID is never reused.
- A later spec may amend an earlier one. It names each claim it amends.
- "Must" marks a requirement. Text outside numbered claims is context and
  binds nothing.
