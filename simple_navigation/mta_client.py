"""
MTA GTFS-RT client.

Fetches real-time train data from the MTA's GTFS-RT feeds and computes
door-to-door trip options for the configured route.
"""

import os
import time
import logging
from datetime import datetime
from zoneinfo import ZoneInfo

import requests
from google.transit import gtfs_realtime_pb2
from route_config import ROUTE

logger = logging.getLogger(__name__)

NY_TZ = ZoneInfo("America/New_York")

# MTA GTFS-RT feed endpoints (require x-api-key header)
FEED_URLS = {
    "ace":    "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace",
    "bdfm":   "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm",
    "g":      "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g",
    "jz":     "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-jz",
    "l":      "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-l",
    "nqrw":   "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-nqrw",
    "123456s": "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs",
    "si":     "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-si",
}

# Simple in-process cache so rapid UI refreshes don't hammer the MTA API
_cache: dict = {}
CACHE_TTL_SECONDS = 20


def _api_key() -> str:
    key = os.environ.get("MTA_API_KEY", "").strip()
    if not key:
        raise RuntimeError(
            "MTA_API_KEY is not set. "
            "Get a free key at https://api.mta.info/ and add it to your .env file."
        )
    return key


def fetch_feed(feed_name: str) -> gtfs_realtime_pb2.FeedMessage:
    """Fetch and parse a GTFS-RT protobuf feed, with short-lived caching."""
    now = time.time()
    cached = _cache.get(feed_name)
    if cached and now - cached["ts"] < CACHE_TTL_SECONDS:
        return cached["feed"]

    url = FEED_URLS[feed_name]
    resp = requests.get(url, headers={"x-api-key": _api_key()}, timeout=10)
    resp.raise_for_status()

    feed = gtfs_realtime_pb2.FeedMessage()
    feed.ParseFromString(resp.content)
    _cache[feed_name] = {"ts": now, "feed": feed}
    logger.debug("Fetched %s feed (%d entities)", feed_name, len(feed.entity))
    return feed


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _ts(stu, prefer: str = "departure") -> int:
    """Extract the best timestamp from a StopTimeUpdate."""
    if prefer == "departure":
        return stu.departure.time or stu.arrival.time
    return stu.arrival.time or stu.departure.time


def fmt_time(ts: int | None) -> str:
    """Unix timestamp → '3:42 PM' in New York time."""
    if not ts:
        return "—"
    return datetime.fromtimestamp(ts, tz=NY_TZ).strftime("%-I:%M %p")


def fmt_mins(seconds: int) -> str:
    m = round(seconds / 60)
    return f"{m} min"


# ---------------------------------------------------------------------------
# Core data extraction
# ---------------------------------------------------------------------------

def get_departures(feed: gtfs_realtime_pb2.FeedMessage,
                   route_id: str,
                   stop_ids: list[str],
                   after_ts: int,
                   max_results: int = 8) -> list[dict]:
    """
    Return up to max_results upcoming departures for `route_id` at any of
    `stop_ids`, sorted by departure time.

    NOTE: We do NOT filter by trip.direction_id because MTA's GTFS-RT feed
    sets direction_id=0 on all trips regardless of travel direction.  The
    stop_id suffix (e.g. G22S vs G22N) already encodes direction, so
    passing directional stop IDs is sufficient.
    """
    results = []
    for entity in feed.entity:
        if not entity.HasField("trip_update"):
            continue
        tu = entity.trip_update
        if tu.trip.route_id != route_id:
            continue

        for stu in tu.stop_time_update:
            if stu.stop_id not in stop_ids:
                continue
            dep = _ts(stu, "departure")
            if dep and dep >= after_ts:
                results.append({
                    "trip_id":      tu.trip.trip_id,
                    "route_id":     route_id,
                    "stop_id":      stu.stop_id,
                    "departure_ts": dep,
                    "arrival_ts":   _ts(stu, "arrival"),
                })
            break  # one match per trip is enough

    results.sort(key=lambda x: x["departure_ts"])
    return results[:max_results]


def get_trip_arrival(feed: gtfs_realtime_pb2.FeedMessage,
                     trip_id: str,
                     stop_ids: list[str]) -> int | None:
    """
    Find when a specific trip arrives at any of the given stops.
    Returns Unix timestamp or None if not found in the feed.
    """
    for entity in feed.entity:
        if not entity.HasField("trip_update"):
            continue
        tu = entity.trip_update
        if tu.trip.trip_id != trip_id:
            continue
        for stu in tu.stop_time_update:
            if stu.stop_id in stop_ids:
                return _ts(stu, "arrival")
    return None


# ---------------------------------------------------------------------------
# Debug helpers (exposed via /api/debug)
# ---------------------------------------------------------------------------

def debug_stops(feed: gtfs_realtime_pb2.FeedMessage, route_id: str) -> list[str]:
    """Return all stop_ids seen for a given route in the feed (for diagnostics)."""
    seen: set[str] = set()
    for entity in feed.entity:
        if not entity.HasField("trip_update"):
            continue
        tu = entity.trip_update
        if tu.trip.route_id != route_id:
            continue
        for stu in tu.stop_time_update:
            seen.add(stu.stop_id)
    return sorted(seen)


# ---------------------------------------------------------------------------
# Main calculation
# ---------------------------------------------------------------------------

def get_route_options() -> dict:
    """
    Calculate the next door-to-door trip options and return a JSON-serialisable dict.
    """
    now_ts = int(time.time())
    route = ROUTE
    leg1_cfg = route["legs"][0]  # E train
    leg2_cfg = route["legs"][1]  # G train

    walk_to_min   = route["walk_to_station_minutes"]
    transfer_min  = route["transfer_minutes"]
    walk_from_min = route["walk_from_station_minutes"]

    # Earliest we can board: we have to walk there first
    earliest_board = now_ts + walk_to_min * 60

    # --- Fetch feeds ---
    ace_feed = fetch_feed(leg1_cfg["feed"])
    g_feed   = fetch_feed(leg2_cfg["feed"])

    # --- E train departures from Lex Av-53 St ---
    # direction_id is not used: MTA sets it to 0 for all trips in the RT feed.
    # The "N" suffix in stop IDs (e.g. F11N) already selects the correct direction.
    e_trains = get_departures(
        ace_feed,
        route_id="E",
        stop_ids=leg1_cfg["from_stop_ids"],
        after_ts=earliest_board,
        max_results=6,
    )

    if not e_trains:
        return {
            "options": [],
            "origin": route["origin_name"],
            "destination": route["destination_name"],
            "updated_at": fmt_time(now_ts),
            "warning": "No E trains found at Lex Av-53 St in the next hour. "
                       "Check that MTA_API_KEY is set and stop IDs are correct "
                       "(run python find_stops.py to verify).",
        }

    options = []

    for e_train in e_trains:
        # When does this E train reach Court Sq?
        e_arrives_court_sq = get_trip_arrival(ace_feed, e_train["trip_id"], leg1_cfg["to_stop_ids"])
        if not e_arrives_court_sq:
            # Fall back to fixed estimate
            e_arrives_court_sq = e_train["departure_ts"] + leg1_cfg["fallback_travel_minutes"] * 60
            leg1_realtime = False
        else:
            leg1_realtime = True

        # Earliest we can board a G train after the transfer walk
        earliest_g = e_arrives_court_sq + transfer_min * 60

        # G train departures from Court Sq after our transfer
        g_trains = get_departures(
            g_feed,
            route_id="G",
            stop_ids=leg2_cfg["from_stop_ids"],
            after_ts=earliest_g,
            max_results=4,
        )

        if not g_trains:
            continue  # no connection found; try next E train

        g_train = g_trains[0]  # take the first available G

        # When does this G train reach Nassau Av?
        g_arrives_nassau = get_trip_arrival(g_feed, g_train["trip_id"], leg2_cfg["to_stop_ids"])
        if not g_arrives_nassau:
            g_arrives_nassau = g_train["departure_ts"] + leg2_cfg["fallback_travel_minutes"] * 60
            leg2_realtime = False
        else:
            leg2_realtime = True

        # Final arrival after the walk from Nassau Av
        arrives_destination_ts = g_arrives_nassau + walk_from_min * 60
        total_minutes = round((arrives_destination_ts - now_ts) / 60)

        # "Leave home" time = E departure minus walk time
        leave_home_ts = e_train["departure_ts"] - walk_to_min * 60
        leave_in_min  = max(0, round((leave_home_ts - now_ts) / 60))

        # E train in-vehicle time
        e_travel_min = round((e_arrives_court_sq - e_train["departure_ts"]) / 60)
        # G train in-vehicle time
        g_travel_min = round((g_arrives_nassau - g_train["departure_ts"]) / 60)
        # Wait for G at Court Sq
        wait_court_sq_min = round((g_train["departure_ts"] - e_arrives_court_sq) / 60)

        options.append({
            "leave_in_min":         leave_in_min,
            "leave_home_at":        fmt_time(leave_home_ts),
            "total_minutes":        total_minutes,
            "arrives_destination":  fmt_time(arrives_destination_ts),
            "urgent":               leave_in_min <= 2,

            "legs": [
                {
                    "type":     "walk",
                    "icon":     "🚶",
                    "desc":     f"Walk to Lexington Av-53 St",
                    "detail":   f"{walk_to_min} min",
                    "duration": walk_to_min,
                },
                {
                    "type":      "subway",
                    "icon":      "🚇",
                    "line":      "E",
                    "color":     "#0039A6",
                    "desc":      "E train → Court Sq-23 St",
                    "detail":    f"Departs {fmt_time(e_train['departure_ts'])} · {e_travel_min} min ride",
                    "from":      "Lexington Av-53 St",
                    "to":        "Court Sq-23 St",
                    "departs":   fmt_time(e_train["departure_ts"]),
                    "arrives":   fmt_time(e_arrives_court_sq),
                    "duration":  e_travel_min,
                    "realtime":  leg1_realtime,
                },
                {
                    "type":     "transfer",
                    "icon":     "🔄",
                    "desc":     "Transfer to G train",
                    "detail":   f"~{transfer_min} min walk + {wait_court_sq_min} min wait",
                    "duration": transfer_min + wait_court_sq_min,
                },
                {
                    "type":      "subway",
                    "icon":      "🚇",
                    "line":      "G",
                    "color":     "#6CBE45",
                    "desc":      "G train → Nassau Av",
                    "detail":    f"Departs {fmt_time(g_train['departure_ts'])} · {g_travel_min} min ride",
                    "from":      "Court Sq-23 St",
                    "to":        "Nassau Av",
                    "departs":   fmt_time(g_train["departure_ts"]),
                    "arrives":   fmt_time(g_arrives_nassau),
                    "duration":  g_travel_min,
                    "realtime":  leg2_realtime,
                },
                {
                    "type":     "walk",
                    "icon":     "🚶",
                    "desc":     f"Walk to 100 Dobbin St",
                    "detail":   f"{walk_from_min} min",
                    "duration": walk_from_min,
                },
            ],
        })

        if len(options) >= 4:
            break

    return {
        "options":     options,
        "origin":      route["origin_name"],
        "destination": route["destination_name"],
        "updated_at":  fmt_time(now_ts),
        "warning":     None if options else
                       "Could not find connecting trips. Service may be limited or stop IDs need updating.",
    }
