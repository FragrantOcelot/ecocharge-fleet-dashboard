# EcoCharge Fleet Dashboard

A prototype web dashboard that lets fleet managers at **EcoCharge Innovations** monitor a small fleet of electric vehicles in Abu Dhabi and Dubai.

ICS 432 Software Engineering, Team 3: Amaury Vekemans, Ahmad Al Taher, Hassan Almulla, Abdulrahman Al Ali.

## Features

| Feature | What it does |
|---|---|
| **A. Static fleet overview** | Shows 8 vehicles with ID, model, location, battery level (bar + %), and status (Available / Charging / On Trip). A summary row counts vehicles, how many are **Ready** (Available with at least 40% battery), charging, on a trip, and the average battery. |
| **B. Charging cost calculator** | Pick a vehicle, type the charging time in hours, and get the cost using the fixed formula `Cost = hours x 7.5 kW x $0.15 per kWh`. It shows the working step by step, the cost in AED (1 USD = 3.6725 AED), and a note if the battery would be full before the time ends. |

## How to run it

You only need a web browser. Node.js is needed for the tests and the local server.

**Option 1 (quickest):** download or clone the repo and double-click `index.html`.

**Option 2 (recommended, uses the same security headers as a real server):**

```bash
git clone <your-repo-url>
cd ecocharge-fleet-dashboard
npm start
```

Then open <http://localhost:3000>. Stop the server with `Ctrl + C`.

## How to run the tests and checks

Needs Node.js 20 or newer.

```bash
npm install      # installs ESLint (dev tool only, the app itself has no dependencies)
npm test         # unit tests for the cost calculator (Node's built-in test runner)
npm run lint     # static analysis: ESLint + security rules, zero warnings allowed
```

The same checks run automatically on every pull request through GitHub Actions (`.github/workflows/ci.yml`). GitHub CodeQL also scans the code for security problems (`.github/workflows/codeql.yml`).

## Project structure

```
index.html              page layout (both features)
css/style.css           styles
js/fleet-data.js        static data for the 8 vehicles (hardcoded, no database)
js/fleet.js             Feature A: builds the fleet table and summary
js/calculator.js        Feature B: cost calculation + input validation (pure logic, unit tested)
js/calculator-ui.js     Feature B: connects the form to calculator.js
tests/calculator.test.js unit tests for the cost calculation function
server.js               small local web server with security headers
eslint.config.js        static analysis rules (includes our "no innerHTML" XSS rule)
.github/workflows/      CI pipeline (lint + tests) and CodeQL security scan
```

## Git workflow

* `main` is always working. Nobody pushes features straight to `main`.
* Each feature gets its own branch: `feature/fleet-overview`, `feature/cost-calculator`, `docs/readme`.
* Work is merged with a pull request that another team member reviews, and only after the CI check is green.
* Commit messages follow the Conventional Commits style: `feat:`, `fix:`, `test:`, `docs:`, `ci:`, `chore:`, `style:`.

## Code review note: a bug we found and prevented

**The bug:** an empty box was turned into a cost of $0.00 instead of an error.

The obvious way to write the calculator is one line:

```js
const cost = Number(hoursInput.value) * 7.5 * 0.15;
```

While reviewing the calculator, we noticed that JavaScript's `Number()` quietly turns bad input into a number:

| Input | `Number(input)` | What the naive code would show |
|---|---|---|
| `""` (empty box) | `0` | **$0.00**, looks like a real answer |
| `"   "` (spaces) | `0` | **$0.00** |
| `"0x10"` | `16` | $18.00 (read as hexadecimal) |
| `"1e2"` | `100` | $112.50 |
| `"abc"` | `NaN` | **$NaN** |

This gets worse with `<input type="number">`. When a user types something invalid, the browser gives the code an empty string, so "abc" would also show **$0.00**. A manager could trust a wrong cost without noticing.

**How we prevented it:**

1. `calculator.js` checks the input before doing any math. An empty box gets its own message. Only plain decimal numbers are accepted (`/^-?\d*\.?\d+$/`). Negative numbers, 0, and anything over 24 hours are rejected with a clear message. The function never throws, so the page never crashes.
2. The input box is `type="text"` with `inputmode="decimal"`. Phones still show a number keypad, but our code sees exactly what the user typed.
3. Unit tests lock this in: `rejects an empty box instead of treating it as 0 hours (bug we prevented)`, plus tests for `"0x10"`, `"1e2"`, `NaN`, `null`, `true`, `[]` and more. If anyone brings back the one-liner, CI turns red.

**A second bug the tests caught:** floating point rounding. `0.2 x 7.5 x 0.15` should be $0.225, which rounds to $0.23. In JavaScript the multiplication gives 22.4999... cents, so a plain `Math.round` returns $0.22. We clean up the number with `toPrecision(12)` before rounding. We checked this against exact integer math for 240,000 different inputs, and the test `rounds half a cent up even when floating point gets in the way` keeps it fixed.

## Security notes

* **No `innerHTML`.** All text is added with `textContent`, so data can never run as code (XSS). ESLint fails the build if someone uses `innerHTML`, `outerHTML`, `insertAdjacentHTML` or `document.write`.
* **Content Security Policy.** Only scripts and styles from this site may run (`index.html` meta tag and `server.js` header).
* **Server allowlist.** `server.js` serves only `index.html`, `css/` and `js/`. Requests like `/../package.json` or `/server.js` get a 404 (path traversal protection).
* **Frozen data.** Fleet data is `Object.freeze`d, so other scripts cannot change it by accident.
* **Input length cap and a simple regex.** This blocks very long inputs and regex denial of service (ReDoS).
* **The cost shown is an estimate only.** If this ever becomes real billing, the server must recalculate the cost and never trust a number sent by the browser (see our security memo).

## Limitations (prototype)

* Fleet data is hardcoded. There is no database, no login, and no live vehicle data.
* The battery estimate ignores charging losses and the slower charging near 100%.
* Battery sizes are approximate values for the demo.
