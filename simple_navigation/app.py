"""
MTA Tracker — Flask web app.

Run:
  cp .env.example .env   # then add your MTA_API_KEY
  pip install -r requirements.txt
  python app.py
"""

import logging
import os

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/times")
def times():
    """Return real-time trip options as JSON."""
    from mta_client import get_route_options
    try:
        data = get_route_options()
        return jsonify({"ok": True, **data})
    except RuntimeError as e:
        # Config/auth errors (missing API key, etc.)
        return jsonify({"ok": False, "error": str(e)}), 400
    except Exception as e:
        logger.exception("Error fetching route options")
        return jsonify({"ok": False, "error": f"MTA API error: {e}"}), 502


@app.route("/api/debug")
def debug():
    """Show all stop IDs seen in the E and G feeds — useful for verifying route_config.py."""
    from mta_client import fetch_feed, debug_stops
    try:
        ace_feed = fetch_feed("ace")
        g_feed   = fetch_feed("g")
        return jsonify({
            "ok": True,
            "E_stop_ids": debug_stops(ace_feed, "E"),
            "G_stop_ids": debug_stops(g_feed, "G"),
        })
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 502


if __name__ == "__main__":
    # Default to 5001 — macOS AirPlay Receiver occupies port 5000
    port = int(os.environ.get("PORT", 5001))
    print(f"\n🚇 MTA Tracker running at http://localhost:{port}\n")
    app.run(debug=True, port=port)
