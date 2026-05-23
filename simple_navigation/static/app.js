'use strict';

const REFRESH_INTERVAL = 30; // seconds

let countdown = REFRESH_INTERVAL;
let countdownTimer = null;
let refreshTimer   = null;
let firstLoad      = true;

// ─── Clock ───────────────────────────────────────────────────────────────────

function updateClock() {
  const el = document.getElementById('clock');
  if (!el) return;
  const now = new Date();
  const h = now.getHours() % 12 || 12;
  const m = String(now.getMinutes()).padStart(2, '0');
  const a = now.getHours() < 12 ? 'AM' : 'PM';
  el.textContent = `${h}:${m} ${a}`;
}

setInterval(updateClock, 1000);
updateClock();

// ─── Countdown ───────────────────────────────────────────────────────────────

function startCountdown() {
  clearInterval(countdownTimer);
  countdown = REFRESH_INTERVAL;
  const el = document.getElementById('countdown');

  countdownTimer = setInterval(() => {
    countdown--;
    if (el) el.textContent = countdown;
    if (countdown <= 0) {
      clearInterval(countdownTimer);
      fetchTimes();
    }
  }, 1000);
}

// ─── Refresh button ──────────────────────────────────────────────────────────

document.getElementById('refresh-btn').addEventListener('click', () => {
  clearInterval(countdownTimer);
  clearTimeout(refreshTimer);
  fetchTimes();
});

// ─── Rendering helpers ───────────────────────────────────────────────────────

function lineBadge(line) {
  return `<div class="line-badge line-badge-${line}">${line}</div>`;
}

function leaveBadgeClass(leaveInMin) {
  if (leaveInMin <= 1) return 'now';
  if (leaveInMin <= 5) return 'soon';
  return 'later';
}

function leaveBadgeText(leaveInMin) {
  if (leaveInMin <= 0) return 'Leave NOW';
  if (leaveInMin === 1) return 'Leave in 1 min';
  return `Leave in ${leaveInMin} min`;
}

function renderLeg(leg) {
  let iconHtml;

  if (leg.type === 'subway') {
    iconHtml = `<div class="leg-icon-wrap subway-leg">${lineBadge(leg.line)}</div>`;
  } else {
    iconHtml = `<div class="leg-icon-wrap">${leg.icon}</div>`;
  }

  let detailHtml = leg.detail;
  if (leg.type === 'subway' && leg.realtime) {
    detailHtml = `<span class="realtime-dot"></span>${leg.detail}`;
  }

  return `
    <div class="leg">
      ${iconHtml}
      <div class="leg-body">
        <div class="leg-desc">${leg.desc}</div>
        <div class="leg-detail">${detailHtml}</div>
      </div>
    </div>
  `;
}

function renderOption(opt, index) {
  const badgeClass = leaveBadgeClass(opt.leave_in_min);
  const badgeText  = leaveBadgeText(opt.leave_in_min);
  const urgentClass = opt.urgent ? ' urgent' : '';
  // Start first card expanded
  const expandedClass = index === 0 ? ' expanded' : '';

  const legsHtml = opt.legs.map(renderLeg).join('');

  return `
    <div class="trip-card${urgentClass}${expandedClass}" data-index="${index}">
      <div class="trip-summary" onclick="toggleCard(${index})">
        <div class="trip-left">
          <span class="leave-badge ${badgeClass}">${badgeText}</span>
          <div class="trip-line-badges">
            ${lineBadge('E')}
            <span class="line-badge-arrow">›</span>
            ${lineBadge('G')}
          </div>
        </div>
        <div class="trip-right">
          <div class="trip-total-time">${opt.total_minutes} min</div>
          <div class="trip-arrives">Arrive ${opt.arrives_destination}</div>
        </div>
        <span class="trip-chevron">▾</span>
      </div>
      <div class="trip-detail">
        <div class="legs-list">${legsHtml}</div>
      </div>
    </div>
  `;
}

// ─── Card expand/collapse ─────────────────────────────────────────────────────

function toggleCard(index) {
  const card = document.querySelector(`.trip-card[data-index="${index}"]`);
  if (card) card.classList.toggle('expanded');
}

// ─── Main render ─────────────────────────────────────────────────────────────

function renderData(data) {
  const main = document.getElementById('main');
  const headerRoute = document.getElementById('header-route');
  const updatedAt   = document.getElementById('updated-at');

  if (headerRoute) {
    headerRoute.textContent = `${data.origin} → ${data.destination}`;
  }
  if (updatedAt) {
    updatedAt.textContent = data.updated_at || '—';
  }

  let html = '';

  if (data.warning) {
    html += `<div class="warning-banner">⚠️ ${escapeHtml(data.warning)}</div>`;
  }

  if (!data.options || data.options.length === 0) {
    html += `
      <div class="no-options">
        <div style="font-size:32px;margin-bottom:8px">🚫</div>
        <div>No trips found right now.</div>
        <div style="font-size:13px;color:var(--text-dim);margin-top:6px">
          Service may be suspended, or stop IDs need updating.<br>
          Visit <a href="/api/debug" target="_blank">debug stops</a> to diagnose.
        </div>
      </div>`;
  } else {
    html += `<div class="section-header">Next departures</div>`;
    html += `<div class="options-list">`;
    html += data.options.map((opt, i) => renderOption(opt, i)).join('');
    html += `</div>`;
  }

  main.innerHTML = html;
}

function renderError(message) {
  const main = document.getElementById('main');
  main.innerHTML = `
    <div class="error-state">
      <div class="error-icon">⚠️</div>
      <div class="error-message">${escapeHtml(message)}</div>
      <div class="error-hint">
        Make sure <code>MTA_API_KEY</code> is set in your <code>.env</code> file.<br>
        Get a free key at <a href="https://api.mta.info/" target="_blank">api.mta.info</a>.
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ─── Fetch ───────────────────────────────────────────────────────────────────

async function fetchTimes() {
  const btn = document.getElementById('refresh-btn');
  btn.classList.add('spinning');

  if (firstLoad) {
    document.getElementById('main').innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Fetching real-time train data…</p>
      </div>`;
  }

  try {
    const res  = await fetch('/api/times');
    const data = await res.json();

    if (!data.ok) {
      renderError(data.error || 'Unknown error');
    } else {
      renderData(data);
      firstLoad = false;
    }
  } catch (err) {
    renderError(`Could not reach the server: ${err.message}`);
  } finally {
    btn.classList.remove('spinning');
    startCountdown();
  }
}

// ─── Boot ────────────────────────────────────────────────────────────────────

fetchTimes();
