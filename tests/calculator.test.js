/**
 * Unit tests for the charging cost calculator (the most critical logic in the app).
 * Run with: npm test   (uses Node's built-in test runner, no extra packages)
 */
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { calculateChargingCost, ERRORS, MAX_HOURS } = require('../js/calculator.js');

function expectFailure(input, expectedError) {
  let result;
  assert.doesNotThrow(() => { result = calculateChargingCost(input); }, 'must fail gracefully, not crash');
  assert.equal(result.ok, false);
  assert.equal(result.error, expectedError);
  assert.equal('costUsd' in result, false, 'no cost should be returned for bad input');
}

describe('calculateChargingCost with positive hours', () => {
  it('4 hours = 30 kWh = $4.50', () => {
    const result = calculateChargingCost(4);
    assert.equal(result.ok, true);
    assert.equal(result.energyKwh, 30);
    assert.equal(result.costUsd, 4.5);
  });

  it('1 hour = 7.5 kWh = $1.125, rounded to $1.13', () => {
    const result = calculateChargingCost(1);
    assert.equal(result.energyKwh, 7.5);
    assert.equal(result.costUsd, 1.13);
  });

  it('2.5 hours = 18.75 kWh = $2.81', () => {
    assert.equal(calculateChargingCost(2.5).costUsd, 2.81);
  });

  it('accepts text from the form, with spaces around it', () => {
    const result = calculateChargingCost(' 3 ');
    assert.equal(result.ok, true);
    assert.equal(result.costUsd, 3.38); // 22.5 kWh x $0.15 = $3.375
  });

  it('accepts a decimal written as ".5"', () => {
    assert.equal(calculateChargingCost('.5').costUsd, 0.56); // $0.5625
  });

  it('accepts the maximum of 24 hours', () => {
    const result = calculateChargingCost(MAX_HOURS);
    assert.equal(result.ok, true);
    assert.equal(result.costUsd, 27);
  });

  it('rounds half a cent up even when floating point gets in the way', () => {
    // 0.2 h x 7.5 x 0.15 is $0.225, but plain JavaScript gives 22.499999... cents
    assert.equal(calculateChargingCost(0.2).costUsd, 0.23);
    assert.equal(calculateChargingCost(0.44).costUsd, 0.5); // $0.495
  });

  it('matches the formula (within half a cent) from 0.25 h to 24 h', () => {
    for (let hours = 0.25; hours <= MAX_HOURS; hours += 0.25) {
      const exact = hours * 7.5 * 0.15;
      const result = calculateChargingCost(hours);
      assert.ok(Math.abs(result.costUsd - exact) <= 0.005 + 1e-9, `${hours} h gave ${result.costUsd}`);
    }
  });

  it('also gives the cost in AED (1 USD = 3.6725 AED)', () => {
    assert.equal(calculateChargingCost(4).costAed, 16.53); // 4.50 x 3.6725 = 16.52625
  });
});

describe('calculateChargingCost fails gracefully with negative hours', () => {
  for (const input of [-1, -0.01, -24, '-2.5']) {
    it(`rejects ${JSON.stringify(input)}`, () => expectFailure(input, ERRORS.NEGATIVE));
  }
});

describe('calculateChargingCost fails gracefully with non-numeric input', () => {
  const notNumbers = ['abc', '2 hours', '2..5', '5,5', '$4', '0x10', '1e2', 'Infinity',
    '<script>alert(1)</script>', NaN, Infinity, -Infinity, null, undefined, true, [], [3], {}];
  for (const input of notNumbers) {
    it(`rejects ${typeof input === 'string' ? JSON.stringify(input) : String(input)}`, () => {
      expectFailure(input, ERRORS.NOT_A_NUMBER);
    });
  }

  it('rejects an empty box instead of treating it as 0 hours (bug we prevented)', () => {
    expectFailure('', ERRORS.EMPTY);
    expectFailure('   ', ERRORS.EMPTY);
  });
});

describe('calculateChargingCost edge cases', () => {
  it('rejects 0 hours', () => {
    expectFailure(0, ERRORS.ZERO);
    expectFailure('0', ERRORS.ZERO);
  });

  it('rejects more than 24 hours', () => {
    expectFailure(24.01, ERRORS.TOO_LONG);
    expectFailure('100', ERRORS.TOO_LONG);
  });
});
