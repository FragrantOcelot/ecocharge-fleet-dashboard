/**
 * Feature B: Basic Charging Cost Calculator (page wiring).
 *
 * Reads the form, asks calculator.js for the cost, and shows the answer with
 * the working ("4 h x 7.5 kW = 30 kWh ..."), so a manager can check the math.
 * All output uses textContent (no innerHTML), same as the fleet table.
 */
(function () {
  'use strict';

  const app = window.EcoCharge || {};
  const calculator = app.calculator;
  const fleet = app.FLEET || [];

  const form = document.getElementById('calc-form');
  const select = document.getElementById('vehicle-select');
  const hoursInput = document.getElementById('hours-input');
  const errorBox = document.getElementById('calc-error');
  const resultBox = document.getElementById('calc-result');

  if (!form || !select || !hoursInput || !errorBox || !resultBox) return;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = String(text);
    return node;
  }

  function formatNumber(n) {
    return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(4)));
  }

  function usd(n) {
    return '$' + n.toFixed(2);
  }

  function populateVehicles() {
    const placeholder = el('option', null, 'Choose a vehicle');
    placeholder.value = '';
    select.appendChild(placeholder);
    fleet.forEach(function (v) {
      const option = el('option', null, v.id + ' - ' + v.model + ' (' + v.batteryPercent + '%)');
      option.value = v.id;
      select.appendChild(option);
    });
  }

  function showError(message, field) {
    resultBox.hidden = true;
    resultBox.replaceChildren();
    errorBox.textContent = message;
    field.setAttribute('aria-invalid', 'true');
    field.focus();
  }

  function clearMessages() {
    errorBox.textContent = '';
    hoursInput.removeAttribute('aria-invalid');
    select.removeAttribute('aria-invalid');
  }

  /** Simple estimate: ignores charging losses and the slower charging near 100%. */
  function batteryNote(vehicle, result) {
    const start = vehicle.batteryPercent;
    if (start >= 100) {
      return 'Note: ' + vehicle.id + ' is already at 100%. In real life the charger would not add any energy.';
    }
    const kwhToFull = ((100 - start) / 100) * vehicle.batteryKwh;
    if (result.energyKwh <= kwhToFull) {
      const end = Math.round(start + (result.energyKwh / vehicle.batteryKwh) * 100);
      return 'Estimated battery after charging: about ' + end + '% (from ' + start + '%).';
    }
    const hoursToFull = kwhToFull / calculator.CHARGER_POWER_KW;
    return 'Note: ' + vehicle.id + ' would be full after about ' + hoursToFull.toFixed(1) +
      ' h. The cost above follows the fixed formula for the full ' + formatNumber(result.hours) +
      ' h, but a real charger would stop at 100%.';
  }

  function showResult(vehicle, result) {
    resultBox.replaceChildren();
    resultBox.appendChild(el('p', 'result-vehicle', vehicle.id + ' - ' + vehicle.model));

    const cost = el('p', 'result-cost');
    cost.appendChild(el('span', 'result-usd', usd(result.costUsd)));
    cost.appendChild(el('span', 'result-aed', 'about AED ' + result.costAed.toFixed(2)));
    resultBox.appendChild(cost);

    const steps = el('ol', 'result-steps');
    steps.appendChild(el('li', null,
      formatNumber(result.hours) + ' h x ' + calculator.CHARGER_POWER_KW + ' kW = ' + formatNumber(result.energyKwh) + ' kWh'));
    steps.appendChild(el('li', null,
      formatNumber(result.energyKwh) + ' kWh x $' + calculator.PRICE_PER_KWH_USD.toFixed(2) + ' per kWh = ' + usd(result.costUsd)));
    resultBox.appendChild(steps);

    resultBox.appendChild(el('p', 'result-note', batteryNote(vehicle, result)));
    resultBox.hidden = false;
  }

  function onSubmit(event) {
    event.preventDefault();
    clearMessages();

    const vehicle = fleet.find(function (v) { return v.id === select.value; });
    if (!vehicle) {
      showError('Please choose a vehicle.', select);
      return;
    }

    const result = calculator.calculateChargingCost(hoursInput.value);
    if (!result.ok) {
      showError(result.error, hoursInput);
      return;
    }
    showResult(vehicle, result);
  }

  if (!calculator) {
    errorBox.textContent = 'The calculator could not be loaded.';
    return;
  }
  populateVehicles();
  form.addEventListener('submit', onSubmit);
})();
