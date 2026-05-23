# simple_navigation 🚇

Real-time subway tracker: **320 E 52nd St → 100 Dobbin St, Brooklyn**

Shows the next door-to-door trips using MTA's live GTFS-RT feeds.

**Route:** Walk → `E` (Lexington Av/53 St → Court Sq-23 St) → transfer → `G` (Court Sq → Nassau Av) → Walk

Route is hardcoded in `route_config.py` — see the root README for why.

---

## Setup

```bash
cd simple_navigation

cp .env.example .env
# Edit .env — paste your MTA_API_KEY (free at https://api.mta.info/)

make setup      # creates .venv and installs dependencies
make start-app  # http://localhost:5001
```

## Makefile targets

| Target | What it does |
|---|---|
| `make setup` | First-time: venv + deps + .env check |
| `make create-venv` | Create `.venv/` |
| `make install` | Install deps from `requirements.txt` |
| `make update-requirements` | Upgrade deps and re-pin `requirements.txt` |
| `make start-app` | Run the Flask app |
| `make find-stops` | Verify GTFS stop IDs against MTA static data |
| `make clean` | Remove `.venv` and cached GTFS data |

## Troubleshooting

**Warning: "Could not find connecting trips"**
Run `make find-stops` to download MTA static GTFS and verify stop IDs,
then cross-check against the live feed at <http://localhost:5001/api/debug>.

**API errors / no data**
Make sure `MTA_API_KEY` is set correctly in `.env`.

## Files

| File | Purpose |
|---|---|
| `route_config.py` | Route definition: stops, walk times, transfer time |
| `mta_client.py` | Fetches + parses GTFS-RT feeds, computes trip options |
| `app.py` | Flask server (`/`, `/api/times`, `/api/debug`) |
| `find_stops.py` | One-time utility: downloads GTFS static, prints stop IDs |
| `templates/index.html` | Dashboard UI |
| `static/style.css` | Dark-mode styles |
| `static/app.js` | Auto-refresh, card expand/collapse |
