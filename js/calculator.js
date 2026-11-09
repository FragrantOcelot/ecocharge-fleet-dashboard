/**
 * EcoCharge charging cost calculator (Feature B).
 *
 * Pure logic only: no DOM access. This keeps the most important rule in the
 * app in one small place that can be unit tested in Node and reused in the
 * browser.
 *
 * Formula (fixed by the project brief):
 *   Cost = Charging Duration (h) x 7.5 kW x $0.15 per kWh
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api; // Node (unit tests)
  } else {
    root.EcoCharge = root.EcoCharge || {};
    root.EcoCharge.calculator = api; // Browser
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const CHARGER_POWER_KW = 7.5;
  const PRICE_PER_KWH_USD = 0.15;
  const USD_TO_AED = 3.6725; // UAE dirham is pegged to the US dollar
  const MAX_HOURS = 24; // one session; 24 h x 7.5 kW = 180 kWh, more than any car in the fleet holds

  // Plain decimal numbers only, e.g. "3", "2.5", ".5", "-1".
  // Rejects things JavaScript's Number() would quietly accept: "", "  ", "0x10", "1e2", "Infinity".
  // Simple pattern (no nested repeats) so it cannot be abused to freeze the page (ReDoS).
  const DECIMAL_PATTERN = /^-?\d*\.?\d+$/;
  const MAX_INPUT_LENGTH = 20;

  const ERRORS = Object.freeze({
    EMPTY: 'Please enter a charging duration in hours.',
    NOT_A_NUMBER: 'Charging duration must be a number, for example 2.5.',
    NEGATIVE: 'Charging duration cannot be negative.',
    ZERO: 'Charging duration must be more than 0 hours.',
    TOO_LONG: 'Charging duration cannot be more than ' + MAX_HOURS + ' hours.',
  });

  function fail(message) {
    return { ok: false, error: message };
  }

  /**
   * Turns user input into a valid number of hours, or explains what is wrong.
   * Never throws, so the UI can always show a friendly message.
   */
  function parseHours(input) {
    let value;

    if (typeof input === 'number') {
      if (!Number.isFinite(input)) return fail(ERRORS.NOT_A_NUMBER);
      value = input;
    } else if (typeof input === 'string') {
      const text = input.trim();
      if (text === '') return fail(ERRORS.EMPTY);
      if (text.length > MAX_INPUT_LENGTH || !DECIMAL_PATTERN.test(text)) return fail(ERRORS.NOT_A_NUMBER);
      value = Number(text);
    } else {
      // null, undefined, booleans, arrays, objects: Number() would turn some of these into 0 or 1.
      return fail(ERRORS.NOT_A_NUMBER);
    }

    if (value < 0) return fail(ERRORS.NEGATIVE);
    if (value === 0) return fail(ERRORS.ZERO);
    if (value > MAX_HOURS) return fail(ERRORS.TOO_LONG);
    return { ok: true, value: value };
  }

  /**
   * Rounds a dollar amount to whole cents, half up.
   * toPrecision(12) first removes tiny binary floating point noise, so that
   * 0.2 h (true cost $0.225) becomes $0.23 and not $0.22.
   */
  function toCents(usd) {
    return Math.round(Number((usd * 100).toPrecision(12)));
  }

  /**
   * Calculates the estimated charging cost.
   *
   * @param {number|string} hoursInput - hours as a number or as text from a form
   * @returns {{ok: true, hours: number, energyKwh: number, costUsd: number, costAed: number}
   *          | {ok: false, error: string}}
   */
  function calculateChargingCost(hoursInput) {
    const parsed = parseHours(hoursInput);
    if (!parsed.ok) return parsed;

    const hours = parsed.value;
    const energyKwh = hours * CHARGER_POWER_KW;
    const costCents = toCents(energyKwh * PRICE_PER_KWH_USD);
    const costAedFils = Math.round(Number((costCents * USD_TO_AED).toPrecision(12)));

    return {
      ok: true,
      hours: hours,
      energyKwh: Number(energyKwh.toPrecision(12)),
      costUsd: costCents / 100,
      costAed: costAedFils / 100,
    };
  }

  return Object.freeze({
    CHARGER_POWER_KW: CHARGER_POWER_KW,
    PRICE_PER_KWH_USD: PRICE_PER_KWH_USD,
    USD_TO_AED: USD_TO_AED,
    MAX_HOURS: MAX_HOURS,
    ERRORS: ERRORS,
    calculateChargingCost: calculateChargingCost,
  });
});
