/**
 * Static fleet data for the prototype (Feature A).
 *
 * There is no database in this prototype. These 8 vehicles are hardcoded demo
 * values. batteryKwh is an approximate usable battery size, used only to warn
 * when a charging session would go past 100%.
 *
 * Object.freeze stops other scripts on the page from changing the data by accident.
 */
(function (root) {
  'use strict';

  const STATUSES = Object.freeze(['Available', 'Charging', 'On Trip']);

  const FLEET = Object.freeze(
    [
      { id: 'EC-AUH-01', model: 'Tesla Model 3', location: 'Abu Dhabi', batteryPercent: 92, status: 'Available', batteryKwh: 57.5 },
      { id: 'EC-AUH-02', model: 'BYD Atto 3', location: 'Abu Dhabi', batteryPercent: 18, status: 'Charging', batteryKwh: 60.5 },
      { id: 'EC-AUH-03', model: 'Hyundai Ioniq 5', location: 'Abu Dhabi', batteryPercent: 64, status: 'On Trip', batteryKwh: 77.4 },
      { id: 'EC-AUH-04', model: 'Nissan Leaf', location: 'Abu Dhabi', batteryPercent: 35, status: 'Available', batteryKwh: 40 },
      { id: 'EC-DXB-01', model: 'Kia EV6', location: 'Dubai', batteryPercent: 77, status: 'Available', batteryKwh: 77.4 },
      { id: 'EC-DXB-02', model: 'MG4 Electric', location: 'Dubai', batteryPercent: 8, status: 'Charging', batteryKwh: 64 },
      { id: 'EC-DXB-03', model: 'Tesla Model Y', location: 'Dubai', batteryPercent: 51, status: 'On Trip', batteryKwh: 75 },
      { id: 'EC-DXB-04', model: 'BYD Seal', location: 'Dubai', batteryPercent: 100, status: 'Available', batteryKwh: 82.5 },
    ].map(Object.freeze)
  );

  root.EcoCharge = root.EcoCharge || {};
  root.EcoCharge.STATUSES = STATUSES;
  root.EcoCharge.FLEET = FLEET;
})(window);
