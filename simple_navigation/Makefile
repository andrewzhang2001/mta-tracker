PYTHON      := python3
VENV        := .venv
VENV_PYTHON := $(VENV)/bin/python
VENV_PIP    := $(VENV)/bin/pip

.DEFAULT_GOAL := help

# ─────────────────────────────────────────────────────────────────────────────
.PHONY: help
help:
	@echo ""
	@echo "  MTA Tracker"
	@echo ""
	@echo "  make setup               First-time setup (venv + install + .env check)"
	@echo "  make create-venv         Create the .venv virtual environment"
	@echo "  make install             Install dependencies into .venv"
	@echo "  make update-requirements Upgrade all packages to latest compatible versions"
	@echo "  make start-app           Start the Flask web app (http://localhost:5001)"
	@echo "  make find-stops          Verify GTFS stop IDs against MTA static data"
	@echo "  make clean               Remove .venv and cached GTFS data"
	@echo ""

# ─────────────────────────────────────────────────────────────────────────────
.PHONY: setup
setup: create-venv install _check-env
	@echo ""
	@echo "  ✅  Setup complete. Run:  make start-app"
	@echo ""

# ─────────────────────────────────────────────────────────────────────────────
.PHONY: create-venv
create-venv:
	@if [ -d "$(VENV)" ]; then \
		echo "  ✓  .venv already exists (delete it and rerun to recreate)"; \
	else \
		echo "  Creating virtual environment in $(VENV)/…"; \
		$(PYTHON) -m venv $(VENV); \
		echo "  ✓  Virtual environment created"; \
	fi

# ─────────────────────────────────────────────────────────────────────────────
.PHONY: install
install: create-venv
	@echo "  Installing dependencies…"
	@$(VENV_PIP) install --quiet --upgrade pip
	@$(VENV_PIP) install --quiet -r requirements.txt
	@echo "  ✓  Dependencies installed"

# ─────────────────────────────────────────────────────────────────────────────
.PHONY: update-requirements
update-requirements: create-venv
	@echo "  Upgrading all packages to latest compatible versions…"
	@$(VENV_PIP) install --quiet --upgrade pip
	@$(VENV_PIP) install --upgrade -r requirements.txt
	@echo ""
	@echo "  Pinning current versions to requirements.txt…"
	@$(VENV_PIP) freeze \
		| grep -E "^(flask|requests|gtfs-realtime-bindings|python-dotenv|protobuf)==" \
		> requirements.txt
	@echo "  ✓  requirements.txt updated:"
	@cat requirements.txt | sed 's/^/      /'
	@echo ""

# ─────────────────────────────────────────────────────────────────────────────
.PHONY: start-app
start-app: _check-env
	@echo "  Starting MTA Tracker at http://localhost:5001 …"
	@echo "  (Ctrl-C to stop)"
	@echo ""
	@$(VENV_PYTHON) app.py

# ─────────────────────────────────────────────────────────────────────────────
.PHONY: find-stops
find-stops:
	@$(VENV_PYTHON) find_stops.py

# ─────────────────────────────────────────────────────────────────────────────
.PHONY: clean
clean:
	@echo "  Removing .venv…"
	@rm -rf $(VENV)
	@echo "  Removing cached GTFS data…"
	@rm -rf .cache
	@find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	@echo "  ✓  Clean"

# ─────────────────────────────────────────────────────────────────────────────
# Internal: warn if .env is missing or still has the placeholder key
.PHONY: _check-env
_check-env:
	@if [ ! -f .env ]; then \
		echo ""; \
		echo "  ⚠️   .env not found. Creating from .env.example…"; \
		cp .env.example .env; \
		echo "  ✏️   Edit .env and set MTA_API_KEY, then rerun."; \
		echo ""; \
	elif grep -q "your_key_here" .env; then \
		echo ""; \
		echo "  ⚠️   MTA_API_KEY is still the placeholder in .env."; \
		echo "  ✏️   Get a free key at https://api.mta.info/ and paste it in."; \
		echo ""; \
	fi
