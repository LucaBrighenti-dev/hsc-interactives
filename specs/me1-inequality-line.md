---
id: me1-inequality-line
title: "Inequality number line"
subject: me1
engine: fnplot
setup: inequality
priority: P2
status: draft            # stub → draft → approved (Gate B)
page: /interactives/maths-ext1/inequality-line.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Mathematics Extension 1","version":"2024","area":"Functions","focusArea":"Further work with functions","year":11,"outcomes":[],"verified":false}
---
# Inequality number line

> Backlog summary: Quadratic and rational inequalities with critical points and test regions.

## Learning goal
Students solve quadratic and rational inequalities by finding the critical points (where the two sides are equal and where either side is undefined), splitting the number line into regions, testing one value in each region, and deciding whether each endpoint is included. They see why a point where the expression is undefined is never included, and connect the number-line method with the graph of the difference of the two sides.

## What the student sees
Default view at 1920×1080 (projector theme), x² − x − 6 < 0, window −6 ≤ x ≤ 6:

- **Graph (top, about 55% of the stage, toggle):** y = (left side) − (right side) as an orange curve, with the x-axis drawn heavier. The parts of the curve where the inequality holds are thick and solid; the parts where it fails are thin and dashed. Vertical asymptotes are dashed grey lines.
- **Number line (bottom):** a long horizontal line with the critical points marked: a **filled** circle when the point belongs to the solution (an equality is allowed), a **hollow** circle when it does not (a strict inequality, or a point where the expression is undefined), each labelled with its value. The regions between them are labelled with the sign of (left − right) at a test point, "+" or "−", and the regions in the solution are covered by a thick orange bar with arrowheads at ±∞ when they are unbounded.
- **Solution line:** the solution set as text, e.g. "−2 < x < 3", or "x < 0 or x > 1/2".
- **Test point:** a draggable marker on the number line at x = testX, with a label showing both sides, e.g. "x = 0: 0² − 0 − 6 = −6 < 0 ✓".
- **Working panel (side):** the method in steps with the current numbers: (1) move everything to one side; (2) critical points from the numerator and denominator; (3) test each region; (4) include or exclude the endpoints. For rational inequalities a second route is offered: multiply both sides by the square of the denominator.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| lhs | Left side | | | | | `x^2 - x - 6` | string; fnplot parser, variable `x`; pattern `EXPRESSION_PATTERN`; max length 80 |
| relation | Relation | | | | | lt | enum: `lt` (<), `le` (≤), `gt` (>), `ge` (≥). Segmented |
| rhs | Right side | | | | | `0` | string; fnplot parser, variable `x` |
| testX | Test point x | | −20 | 20 | 0.05 | 0 | draggable on the number line |
| showGraph | Graph of left − right | | | | | on | |
| showSigns | Region signs | | | | | on | |
| xMin | Number line from | | −20 | 20 | 0.5 | −6 | shared fnplot window key |
| xMax | Number line to | | −20 | 20 | 0.5 | 6 | |

How the engine finds and classifies critical points (static setup): let h(x) = lhs(x) − rhs(x). Evaluate h at 4001 equally spaced points xᵢ = xMin + (xMax − xMin)·i/4000. A critical point is (a) a grid point where h is not finite (undefined), or (b) the limit of a bisection (to 1e-12) on any grid interval where h changes sign or has a zero at an end, or (c) a touching zero: where |h| has a local minimum on the grid without a sign change, refine it by golden-section search and keep it if |h| there is below 1e-9. Candidates closer together than 1e-7 × (xMax − xMin) are merged into one (a zero that falls exactly on a grid point is otherwise found twice). A critical point is a **zero** if |h| there is below 1e-9, otherwise a **break** (undefined, such as a vertical asymptote). It is **included** in the solution (filled circle) only if it is a zero and the relation is `le` or `ge`. Each region between critical points is tested at its midpoint (and the outer regions at one unit beyond the outermost points). Only critical points inside the window are found; the stage says "showing −6 ≤ x ≤ 6".

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | x² − x − 6 < 0 | A quadratic: the solution lies between the roots |
| quadratic-outside | x² ≥ 4x | Bring everything to one side first; the solution lies outside the roots and includes them |
| rational | (x + 1)/(x − 2) ≥ 3 | The classic rational inequality: one endpoint included, one excluded |
| reciprocal | 1/x < 2 | Two separate regions, and x = 0 is never included |
| touching | (x − 1)² > 0, window −4 to 4 | A double root: every x except 1 |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| criticalCount | Critical points in view | | integer (`integer: true`) |
| critical1 | First critical point | | 4 |
| critical2 | Second critical point | | 4 |
| critical3 | Third critical point | | 4 |
| closed1 | First point included (1 = yes) | | integer (`integer: true`) |
| closed2 | Second point included (1 = yes) | | integer (`integer: true`) |
| closed3 | Third point included (1 = yes) | | integer (`integer: true`) |
| testLhs | Left side at the test point | | 4 |
| testRhs | Right side at the test point | | 4 |
| testHolds | Inequality holds at the test point (1 = yes) | | integer (`integer: true`) |

Critical points are in increasing order; missing ones are NaN. `testLhs`, `testRhs` and `testHolds` are NaN where either side is undefined at testX.

## Assumptions shown on stage
- Critical points found numerically in the window shown
- x is real

## Try this (3–5 predict, observe, explain prompts)
1. Predict: for x² − x − 6 < 0, will the solution be between the roots or outside them? Drag the test point to check one region at a time.
2. Observe: change < to ≤. What changes on the number line, and what stays the same?
3. Predict: in the rational preset, someone multiplies both sides by (x − 2) and gets x + 1 ≥ 3x − 6, so x ≤ 3.5. Is that the full answer? Test x = 0.
4. Observe: in the reciprocal preset, why is x = 0 a critical point even though 1/x is never 2?
5. Explain: in the touching preset, the expression never changes sign at x = 1. Why is x = 1 still a critical point, and why is it not in the solution?

## Teacher notes outline
- Misconceptions to target: multiplying both sides by an expression that might be negative (the rational preset's trap); including a point where the expression is undefined; solving x² ≥ 4x by dividing by x (losing x = 0 and the negative region); assuming the solution of a quadratic inequality is always between the roots; forgetting that a double root does not change the sign.
- 10-minute lesson flow: 0–2 min predict for the default; 2–4 min test points in each region; 4–6 min quadratic-outside; 6–9 min rational: first the wrong method, then critical points and testing, then multiplying by (x − 2)²; 9–10 min reciprocal and touching as quick checks.
- Original HSC-style question idea: (a) Solve 3/(x + 1) ≤ x − 1. (b) Hence, or otherwise, find the values of x for which the graph of y = 3/(x + 1) lies on or below the line y = x − 1. Full question and worked solution go in the notes file. (Critical points −2, −1, 2; solution −2 ≤ x < −1 or x ≥ 2.)

## Accessibility notes
- Second cues beyond colour: included endpoints are filled circles and excluded ones hollow; solution regions carry a thick bar and the solution text; graph parts that satisfy the inequality are solid and thick, others thin and dashed; signs are printed as "+" and "−".
- Keyboard: the test point is a panel slider as well as a draggable marker (arrow keys move it by 0.05); expressions are typed in text fields.
- Stage aria-label (from `describe()`), for example: "Inequality x squared minus x minus 6 is less than 0. Critical points −2 and 3, both excluded. Solution −2 < x < 3. Test point x = 0: −6 < 0, true."

## Engine change requests
The fnplot engine's `meta` was not yet on `origin` when this spec was written (only `parser.js`), so these are **keys to reconcile with engine meta**:
- Params (setup `inequality`): `lhs`, `relation`, `rhs`, `testX`, `showGraph`, `showSigns`, `xMin`, `xMax`.
- Outputs: `criticalCount`, `critical1`, `critical2`, `critical3`, `closed1`, `closed2`, `closed3`, `testLhs`, `testRhs`, `testHolds`.
- `inequality` listed in `meta.staticSetups`.

## Acceptance
Every number below comes from the formula and hand calculation shown here. Critical points come from bisection, so they use an absolute tolerance of 1e-6; direct evaluations use 1e-9.

- **Check 1, default at x = 0.** x² − x − 6 = (x − 3)(x + 2): critical points **−2** and **3** (**2** of them), both excluded because the inequality is strict (closed1 = closed2 = **0**). At x = 0: left side 0 − 0 − 6 = **−6**, right side **0**, −6 < 0 so **holds = 1**.
- **Check 2, default at x = 4.** 16 − 4 − 6 = **6**, and 6 < 0 is false: **holds = 0** (x = 4 lies outside −2 < x < 3).
- **Check 3, quadratic outside the roots.** x² ≥ 4x ⇔ x² − 4x ≥ 0 ⇔ x(x − 4) ≥ 0: critical points **0** and **4**, both included (≥): closed1 = closed2 = **1**. At x = 2: left 4, right 8, 4 ≥ 8 is false: **holds = 0**. Solution x ≤ 0 or x ≥ 4.
- **Check 4, rational at x = 3.** (x + 1)/(x − 2) ≥ 3 ⇔ (x + 1)/(x − 2) − 3 ≥ 0 ⇔ (x + 1 − 3x + 6)/(x − 2) ≥ 0 ⇔ (7 − 2x)/(x − 2) ≥ 0. Critical points: **2** (the denominator is zero: undefined, so excluded, closed1 = **0**) and **3.5** (a zero, and ≥ allows equality, so included, closed2 = **1**). At x = 3: left side 4/1 = **4**, right side **3**, 4 ≥ 3: **holds = 1**. Solution 2 < x ≤ 3.5.
- **Check 5, rational at the included endpoint.** At x = 3.5: left side 4.5/1.5 = **3**, and 3 ≥ 3: **holds = 1**. With > instead, 3 > 3 is false: **holds = 0**, and the endpoint is excluded (closed2 = **0**).
- **Check 6, reciprocal.** 1/x < 2 ⇔ 1/x − 2 < 0 ⇔ (1 − 2x)/x < 0: critical points **0** (undefined) and **0.5** (a zero, excluded by <). At x = 0.25: 1/0.25 = **4**, 4 < 2 false, **holds = 0**. At x = −1: **−1** < 2, **holds = 1**. Solution x < 0 or x > 0.5.

```acceptance
[
  { "name": "x^2 - x - 6 < 0 tested at x = 0",
    "params": { "lhs": "x^2 - x - 6", "relation": "lt", "rhs": "0", "testX": 0, "xMin": -6, "xMax": 6 },
    "run": "static",
    "expect": {
      "criticalCount": { "value": 2, "absTol": 1e-9 },
      "critical1": { "value": -2, "absTol": 1e-6 },
      "critical2": { "value": 3, "absTol": 1e-6 },
      "closed1": { "value": 0, "absTol": 1e-9 },
      "closed2": { "value": 0, "absTol": 1e-9 },
      "testLhs": { "value": -6, "absTol": 1e-9 },
      "testRhs": { "value": 0, "absTol": 1e-9 },
      "testHolds": { "value": 1, "absTol": 1e-9 } } },
  { "name": "x^2 - x - 6 < 0 fails at x = 4",
    "params": { "lhs": "x^2 - x - 6", "relation": "lt", "rhs": "0", "testX": 4, "xMin": -6, "xMax": 6 },
    "run": "static",
    "expect": { "testLhs": { "value": 6, "absTol": 1e-9 }, "testHolds": { "value": 0, "absTol": 1e-9 } } },
  { "name": "x^2 >= 4x: roots included, x = 2 fails",
    "params": { "lhs": "x^2", "relation": "ge", "rhs": "4x", "testX": 2, "xMin": -6, "xMax": 6 },
    "run": "static",
    "expect": {
      "criticalCount": { "value": 2, "absTol": 1e-9 },
      "critical1": { "value": 0, "absTol": 1e-6 },
      "critical2": { "value": 4, "absTol": 1e-6 },
      "closed1": { "value": 1, "absTol": 1e-9 },
      "closed2": { "value": 1, "absTol": 1e-9 },
      "testLhs": { "value": 4, "absTol": 1e-9 },
      "testRhs": { "value": 8, "absTol": 1e-9 },
      "testHolds": { "value": 0, "absTol": 1e-9 } } },
  { "name": "(x + 1)/(x - 2) >= 3 at x = 3",
    "params": { "lhs": "(x + 1)/(x - 2)", "relation": "ge", "rhs": "3", "testX": 3, "xMin": -6, "xMax": 6 },
    "run": "static",
    "expect": {
      "criticalCount": { "value": 2, "absTol": 1e-9 },
      "critical1": { "value": 2, "absTol": 1e-6 },
      "critical2": { "value": 3.5, "absTol": 1e-6 },
      "closed1": { "value": 0, "absTol": 1e-9 },
      "closed2": { "value": 1, "absTol": 1e-9 },
      "testLhs": { "value": 4, "absTol": 1e-9 },
      "testRhs": { "value": 3, "absTol": 1e-9 },
      "testHolds": { "value": 1, "absTol": 1e-9 } } },
  { "name": "(x + 1)/(x - 2) >= 3 holds at x = 3.5",
    "params": { "lhs": "(x + 1)/(x - 2)", "relation": "ge", "rhs": "3", "testX": 3.5, "xMin": -6, "xMax": 6 },
    "run": "static",
    "expect": { "testLhs": { "value": 3, "absTol": 1e-9 }, "testHolds": { "value": 1, "absTol": 1e-9 } } },
  { "name": "(x + 1)/(x - 2) > 3 excludes x = 3.5",
    "params": { "lhs": "(x + 1)/(x - 2)", "relation": "gt", "rhs": "3", "testX": 3.5, "xMin": -6, "xMax": 6 },
    "run": "static",
    "expect": { "testHolds": { "value": 0, "absTol": 1e-9 }, "closed2": { "value": 0, "absTol": 1e-9 } } },
  { "name": "1/x < 2 fails at x = 0.25",
    "params": { "lhs": "1/x", "relation": "lt", "rhs": "2", "testX": 0.25, "xMin": -6, "xMax": 6 },
    "run": "static",
    "expect": {
      "criticalCount": { "value": 2, "absTol": 1e-9 },
      "critical1": { "value": 0, "absTol": 1e-6 },
      "critical2": { "value": 0.5, "absTol": 1e-6 },
      "closed1": { "value": 0, "absTol": 1e-9 },
      "closed2": { "value": 0, "absTol": 1e-9 },
      "testLhs": { "value": 4, "absTol": 1e-9 },
      "testHolds": { "value": 0, "absTol": 1e-9 } } },
  { "name": "1/x < 2 holds at x = -1",
    "params": { "lhs": "1/x", "relation": "lt", "rhs": "2", "testX": -1, "xMin": -6, "xMax": 6 },
    "run": "static",
    "expect": { "testLhs": { "value": -1, "absTol": 1e-9 }, "testHolds": { "value": 1, "absTol": 1e-9 } } }
]
```
