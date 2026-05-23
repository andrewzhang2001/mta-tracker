"""
Route configuration: 320 E 52nd St → 100 Dobbin St, Brooklyn

Route:
  Walk  →  Lex Av-53 St (E/M)  →  [E train, Queens-bound]
        →  Court Sq-23 St       →  [transfer to G]
        →  [G train, Church Av-bound]
        →  Nassau Av             →  Walk  →  100 Dobbin St

Stop IDs come from MTA's GTFS static data.
Run `python find_stops.py` to verify or update them.
"""

ROUTE = {
    "origin_name": "320 E 52nd St, New York, NY",
    "destination_name": "100 Dobbin St, Brooklyn, NY",

    # Minutes to walk from front door to the subway entrance
    "walk_to_station_minutes": 4,

    # Minutes to walk from Nassau Av station to 100 Dobbin St
    "walk_from_station_minutes": 10,

    # Minutes needed to walk between E/M platform and G platform at Court Sq
    "transfer_minutes": 3,

    "legs": [
        {
            "line": "E",
            "feed": "ace",
            "from_station": "Lexington Av/53 St",
            # Stop IDs verified from MTA GTFS static data (find_stops.py)
            "from_stop_ids": ["F11N", "F11"],   # Queens-bound (toward Jamaica)
            "direction": "N",
            "direction_id": 0,  # GTFS direction_id: 0 = uptown/Queens-bound
            "to_station": "Court Sq-23 St",
            # E/M platform at Court Sq is stop F09 (not G22, which is the G train platform)
            "to_stop_ids": ["F09N", "F09"],
            # Fallback travel time (minutes) if real-time data is missing for this leg
            "fallback_travel_minutes": 8,
        },
        {
            "line": "G",
            "feed": "g",
            "from_station": "Court Sq (G train)",
            # G22 is the G train platform at Court Sq (separate from F09 which is E/M)
            "from_stop_ids": ["G22S", "G22"],
            "direction": "S",   # toward Church Av (passes Greenpoint Av, then Nassau Av)
            "direction_id": 1,
            "to_station": "Nassau Av",
            # Nassau Av confirmed as G28 in MTA GTFS static data
            "to_stop_ids": ["G28S", "G28"],
            "fallback_travel_minutes": 6,
        },
    ],
}
