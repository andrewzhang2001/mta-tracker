"""
Utility: Download MTA GTFS static data and find the correct stop IDs
for stations in route_config.py.

Run once to verify stop IDs, then update route_config.py if needed.

Usage:
  python find_stops.py
"""

import csv
import io
import json
import os
import zipfile
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv()

GTFS_STATIC_URL = "http://web.mta.info/developers/data/nyct/subway/google_transit.zip"
CACHE_PATH = Path(".cache/gtfs_stops.json")

# Station names to search for (partial, case-insensitive)
SEARCH_TERMS = [
    "Lexington Av-53",
    "Court Sq",
    "23 St-Ely",
    "Nassau Av",
    "Greenpoint Av",
]


def download_stops() -> dict:
    print(f"Downloading GTFS static data from MTA…")
    resp = requests.get(GTFS_STATIC_URL, timeout=60)
    resp.raise_for_status()
    print(f"  Downloaded {len(resp.content) / 1024:.0f} KB")

    stops = {}
    with zipfile.ZipFile(io.BytesIO(resp.content)) as zf:
        with zf.open("stops.txt") as f:
            reader = csv.DictReader(io.TextIOWrapper(f, encoding="utf-8"))
            for row in reader:
                stops[row["stop_id"]] = {
                    "name":   row["stop_name"],
                    "lat":    row.get("stop_lat", ""),
                    "lon":    row.get("stop_lon", ""),
                    "parent": row.get("parent_station", ""),
                }

    CACHE_PATH.parent.mkdir(exist_ok=True)
    CACHE_PATH.write_text(json.dumps(stops, indent=2))
    print(f"  Cached {len(stops)} stops → {CACHE_PATH}\n")
    return stops


def load_stops() -> dict:
    if CACHE_PATH.exists():
        print(f"Using cached stops from {CACHE_PATH}\n")
        return json.loads(CACHE_PATH.read_text())
    return download_stops()


def main():
    stops = load_stops()

    print("=" * 60)
    print("Stop IDs matching your route stations:")
    print("=" * 60)

    for term in SEARCH_TERMS:
        print(f"\n🔍  '{term}':")
        matches = [
            (sid, info)
            for sid, info in stops.items()
            if term.lower() in info["name"].lower()
        ]
        if not matches:
            print("    (no matches)")
        else:
            for sid, info in sorted(matches, key=lambda x: x[0]):
                suffix = ""
                if sid.endswith("N"):
                    suffix = "  ← Queens/uptown-bound"
                elif sid.endswith("S"):
                    suffix = "  ← Brooklyn/downtown-bound"
                print(f"    {sid:12s}  {info['name']}{suffix}")

    print()
    print("=" * 60)
    print("How to use these results:")
    print("  1. Find the stop IDs for your board/exit stations.")
    print("  2. Open route_config.py and update the *_stop_ids lists.")
    print("  3. For from_stop_ids, use the Queens-bound (N) stop at your origin.")
    print("  4. For to_stop_ids at Court Sq, use the E/M stop (23 St-Ely Av).")
    print("  5. For G train, use the S (southbound/Church Av-bound) stops.")
    print("=" * 60)


if __name__ == "__main__":
    main()
