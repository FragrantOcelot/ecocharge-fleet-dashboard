/**
 * Feature A: Static Fleet Overview.
 *
 * Builds the fleet table and the summary chips from EcoCharge.FLEET.
 * Security note: every value is written with textContent, never innerHTML,
 * so even if this data later comes from an API, text cannot run as code (XSS).
 * ESLint enforces this rule (see eslint.config.js).
 */
(function () {
  'use strict';

  const READY_MIN_BATTERY = 40; // "Ready" = Available and at least 40% battery
  const STATUS_CLASS = Object.freeze({
    Available: 'status-available',
    Charging: 'status-charging',
    'On Trip': 'status-trip',
  });

  function clampPercent(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.min(100, Math.max(0, Math.round(n)));
  }

  function batteryLevel(percent) {
    if (percent < 20) return 'low';
    if (percent < 60) return 'mid';
    return 'high';
  }

  function isReady(vehicle) {
    return vehicle.status === 'Available' && clampPercent(vehicle.batteryPercent) >= READY_MIN_BATTERY;
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = String(text);
    return node;
  }

  function buildBatteryCell(percentValue) {
    const percent = clampPercent(percentValue);
    const cell = el('td', 'battery-cell');
    const wrap = el('div', 'battery battery-' + batteryLevel(percent));
    const track = el('div', 'battery-track');
    track.setAttribute('aria-hidden', 'true');
    const fill = el('div', 'battery-fill');
    fill.style.width = percent + '%'; // CSSOM, allowed by our Content Security Policy
    track.appendChild(fill);
    wrap.appendChild(track);
    wrap.appendChild(el('span', 'battery-text', percent + '%'));
    cell.appendChild(wrap);
    return cell;
  }

  function buildStatusCell(vehicle) {
    const cell = el('td');
    const statusClass = STATUS_CLASS[vehicle.status] || 'status-unknown';
    cell.appendChild(el('span', 'badge ' + statusClass, STATUS_CLASS[vehicle.status] ? vehicle.status : 'Unknown'));
    if (isReady(vehicle)) {
      cell.appendChild(el('span', 'badge badge-ready', 'Ready'));
    }
    return cell;
  }

  function buildRow(vehicle) {
    const row = el('tr');
    const idCell = el('th', 'vehicle-id', vehicle.id);
    idCell.scope = 'row';
    row.appendChild(idCell);
    row.appendChild(el('td', null, vehicle.model));
    row.appendChild(el('td', 'muted', vehicle.location));
    row.appendChild(buildBatteryCell(vehicle.batteryPercent));
    row.appendChild(buildStatusCell(vehicle));
    return row;
  }

  function buildSummary(fleet) {
    const count = function (status) {
      return fleet.filter(function (v) { return v.status === status; }).length;
    };
    const total = fleet.reduce(function (sum, v) { return sum + clampPercent(v.batteryPercent); }, 0);
    const average = fleet.length ? Math.round(total / fleet.length) : 0;

    return [
      { label: 'Vehicles', value: fleet.length },
      { label: 'Ready to use', value: fleet.filter(isReady).length },
      { label: 'Charging', value: count('Charging') },
      { label: 'On trip', value: count('On Trip') },
      { label: 'Average battery', value: average + '%' },
    ];
  }

  function renderSummary(container, fleet) {
    buildSummary(fleet).forEach(function (item) {
      const li = el('li', 'summary-item');
      li.appendChild(el('span', 'summary-value', item.value));
      li.appendChild(el('span', 'summary-label', item.label));
      container.appendChild(li);
    });
  }

  function init() {
    const body = document.getElementById('fleet-body');
    const summary = document.getElementById('fleet-summary');
    const errorBox = document.getElementById('fleet-error');
    const fleet = window.EcoCharge && window.EcoCharge.FLEET;

    if (!body || !summary) return;
    if (!Array.isArray(fleet) || fleet.length === 0) {
      if (errorBox) errorBox.hidden = false;
      return;
    }

    const rows = document.createDocumentFragment();
    fleet.forEach(function (vehicle) { rows.appendChild(buildRow(vehicle)); });
    body.appendChild(rows);
    renderSummary(summary, fleet);
  }

  init();
})();
