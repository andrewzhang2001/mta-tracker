# Archive

Route: [`/archive`](../src/App.tsx) · Component: [`ArchivePage.tsx`](ArchivePage.tsx)

Retired projects, kept working. Archived here means **feature-frozen, not
switched off** — each one still runs at its own route, reached from the Archive
button on the home page. What it loses is a home-page card and further
development.

| Folder | Route | What it was |
|---|---|---|
| [simple-navigation/](simple-navigation/) | `/archive/simple-navigation` | Real-time door-to-door subway tracker for one hardcoded commute |

Archived routes are lazy-loaded in `src/App.tsx`, so their code never lands in
the main bundle. That matters here: `simple-navigation` pulls in protobufjs
(~206 kB) to decode GTFS-RT, and none of the four visualizations need it.

## Archiving something

1. `git mv <folder> archive/<kebab-case-name>` — keeps blame through the move.
2. Make sure it still runs. If it needed a server, check whether it still does —
   `simple-navigation` didn't, once the MTA feeds dropped their API-key
   requirement and added permissive CORS. If it can't run without a backend,
   say so on its card rather than shipping a dead link.
3. Change its route to `/archive/<name>` and make it `lazy()` in `src/App.tsx`.
4. Add an entry to the `projects` array in `ArchivePage.tsx` and a row above.
5. Remove its home-page card from `src/pages/Home.tsx`, its row from the root
   README's feature table, and any `data:*` script from `package.json`.
