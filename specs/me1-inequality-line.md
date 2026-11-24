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
Students solve quadratic and rational inequalities by finding the critical points (where the two sides are equal, and where either side is undefined), splitting the number line into regions, testing one value in each region, and deciding whether each endpoint is included. They see why a point where the expression is undefined is never included, even when the expression does not change sign there, and connect the number-line method with the graph of the difference of the two sides.

## What the student sees
Default view at 1920×1080 (projector theme), x² − x − 6 < 0:

- **Graph (top, about 55% of the stage):** y = (left side) − (right side) as an orange curve, with the x-axis drawn heavier. The parts of the curve where the inequality holds are thick and solid; the parts where it fails are thin and dashed. Vertical asymptotes are dashed grey lines.
- **Number line (bottom):** the critical points marked with a **filled** circle when the point belongs to the solution (an allowed equality), or a **hollow** circle when it does not (a strict inequality, or a point where the expression is undefined), each labelled with its value (as a fraction p/q with q ≤ 12 when it is one, for example "7/2"). Each region between them is labelled with the sign of (left − right) at its test point, "+" or "−". The regions in the solution are covered by a thick orange bar.
- **Solution line:** the solution set as text, for example "−2 < x < 3", or "x < 0 or x > 1/2".
- **Working panel (side):** the method in steps with the current numbers: (1) move everything to one side; (2) critical points: zeros, and points where a side is undefined; (3) test each region; (4) include or exclude each endpoint. For rational inequalities a second route is offered as text: multiply both sides by the square of the denominator.

## Parameters
Keys match `meta.params` of the fnplot engine on `origin/w1/engine-fnplot` (commit 90a18ca, PR #28, not yet merged). The Default column is the engine default; the page's presets override it.

| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ineqLeft | Left side | | | | | `(x-3)(x+2)` | string; fnplot parser, variable `x`; max length 80 |
| relation | Relation | | | | | ge | enum: `lt` (<), `le` (≤), `gt` (>), `ge` (≥). Segmented |
| ineqRight | Right side | | | | | `0` | string; fnplot parser, variable `x` |
| piTicks | Label x in multiples of π | | | | | off | |

Requested additions (see Engine change requests): a test point `ineqTest` (number, −10 to 10, step 0.05, default 0) shown as a draggable marker on the number line with the label "x = 0: 0² − 0 − 6 = −6 < 0 ✓".

How critical points and regions are found (static setup). Let h(x) = left(x) − right(x).
1. **Search range.** Critical points are searched on −50 ≤ x ≤ 50, whatever part of the line is in view; the stage says "critical points searched between −50 and 50". Zeros or breaks outside that range are not found.
2. **Zeros.** Sign changes of h on a fine grid (at least 4000 intervals), each refined by bisection to 1e-12, plus touching zeros (a local minimum of |h| without a sign change, refined by golden-section search to 1e-12 in x and kept if |h| there is below 1e-9).
3. **Points where a side is undefined.** Found by adaptive sampling of h: a grid value that is not finite, or a pair of neighbouring values whose size grows without bound as the interval is halved (a vertical asymptote, whether or not h changes sign there, so even-order poles such as 1/(x − 2)² are found). Each is refined by bisection. A run of neighbouring undefined values (for example √x for x < 0) is one excluded interval: its finite end is found by bisection between a finite and a non-finite value.
4. **Merge.** Candidates closer together than 1e-6 × max(1, |x|) are one point; if one of them is undefined, the point is undefined.
5. **Classify each critical point.** *Undefined* (a pole or a point outside the domain): never included. *Zero*: included only for ≤ or ≥. *Domain edge where h is finite* (for example x = 0 for √x): included exactly when h there satisfies the inequality, tested directly.
6. **Test regions.** Each region between neighbouring critical points is tested at its midpoint. The two outer regions are tested one unit beyond the outermost critical point (inside the search range). With no critical points, the single region is tested at x = 0. A test value that is not finite never satisfies the inequality.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | x² − x − 6 < 0 | A quadratic: the solution lies between the roots |
| quadratic-outside | x² ≥ 4x | Bring everything to one side first; the solution lies outside the roots and includes them |
| rational | (x + 1)/(x − 2) ≥ 3 | The classic rational inequality: one endpoint included, one excluded |
| reciprocal | 1/x < 2 | Two separate regions, and x = 0 is never included |
| double-pole | 1/(x − 2)² > 1 | The sign does not change at x = 2, but x = 2 is still excluded |
| touching | (x − 1)² > 0 | A double root: every x except 1 |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| zeroCount | Zeros | | integer (`integer: true`) |
| poleCount | Points where undefined | | integer (`integer: true`) |

Requested outputs (see Engine change requests): `critical1`, `critical2`, `critical3` (critical points in increasing order, NaN if fewer), `closed1`, `closed2`, `closed3` (1 if that point is in the solution), and at the test point `testLeft`, `testRight`, `testHolds` (1 or 0; NaN where a side is undefined).

## Assumptions shown on stage
- Critical points are found numerically between x = −50 and x = 50
- x is real

## Try this (3–5 predict, observe, explain prompts)
1. Predict: for x² − x − 6 < 0, will the solution be between the roots or outside them? Check the sign of each region.
2. Observe: change < to ≤. What changes on the number line, and what stays the same?
3. Predict: in the rational preset, someone multiplies both sides by (x − 2) and gets x + 1 ≥ 3x − 6, so x ≤ 3.5. Is that the full answer? Check x = 0 in the original inequality.
4. Observe: in the reciprocal preset, x = 0 is a critical point even though the two sides are not equal there. Why? (What is 1/0?)
5. Explain: in the double-pole preset, the expression is positive on both sides of x = 2. Why is x = 2 a critical point, and why is it not in the solution?

## Teacher notes outline
- Misconceptions to target: multiplying both sides by an expression that might be negative (the rational preset's trap); including a point where the expression is undefined; solving x² ≥ 4x by dividing by x (losing x = 0 and the negative region); assuming the solution of a quadratic inequality always lies between the roots; forgetting that a double root or a squared denominator does not change the sign.
- 10-minute lesson flow: 0–2 min predict for the default; 2–4 min signs of each region; 4–6 min quadratic-outside; 6–9 min rational: first the wrong method, then critical points and testing, then multiplying by (x − 2)²; 9–10 min reciprocal and double-pole as quick checks.
- Original HSC-style question idea: (a) Solve 3/(x + 1) ≤ x − 1. (b) Hence, or otherwise, find the values of x for which the graph of y = 3/(x + 1) lies on or below the line y = x − 1. Full question and worked solution go in the notes file. (3/(x + 1) − (x − 1) = (4 − x²)/(x + 1); critical points −2 (zero), −1 (undefined), 2 (zero); solution −2 ≤ x < −1 or x ≥ 2.)

## Accessibility notes
- Second cues beyond colour: included endpoints are filled circles and excluded ones hollow; solution regions carry a thick bar and the solution text; graph parts that satisfy the inequality are solid and thick, others thin and dashed; signs are printed as "+" and "−"; asymptotes are dashed and labelled.
- Keyboard: expressions are typed in text fields and the relation is a segmented control; the requested test point is a slider as well as a draggable marker (arrow keys move it by 0.05).
- Stage aria-label (from `describe()`), for example: "Graph and number line for the inequality x² − x − 6 less than 0. Critical points −2 and 3, both excluded. Solution −2 < x < 3."

## Engine change requests
Keys above match the fnplot engine on `origin/w1/engine-fnplot` (90a18ca); the acceptance block uses only its existing keys. Requested changes, with the checks to add once they land (the fenced `pending-acceptance` block below):
1. **Domain edges where h is finite.** That branch classifies x = 0 for √x as a point where the expression is undefined, so √x < 2 gives "0 < x < 4"; the answer is 0 ≤ x < 4. Test such an edge directly (step 5 above). Add a `model.js` unit test for √x < 2.
2. **Outputs** `critical1`, `critical2`, `critical3`, `closed1`, `closed2`, `closed3` (as defined under Readouts), so the page can show and test each endpoint.
3. **Test point:** param `ineqTest` (number, −10 to 10, step 0.05, default 0) and outputs `testLeft`, `testRight`, `testHolds`.

## Acceptance
Every number below comes from the formula and hand calculation shown here. The counts are exact (tolerance 1e-9). The same cases were run through the fnplot model on `origin/w1/engine-fnplot` (90a18ca), which gives these counts.

- **Check 1, default.** x² − x − 6 = (x − 3)(x + 2): zeros **−2 and 3** (**2**), no undefined points (**0**). Solution −2 < x < 3.
- **Check 2, quadratic outside the roots.** x² ≥ 4x ⇔ x(x − 4) ≥ 0: zeros **0 and 4** (**2**), poles **0**. Solution x ≤ 0 or x ≥ 4.
- **Check 3, rational.** (x + 1)/(x − 2) − 3 = (7 − 2x)/(x − 2): one zero (x = **3.5**) and one undefined point (x = **2**). Solution 2 < x ≤ 3.5.
- **Check 4, reciprocal.** 1/x − 2 = (1 − 2x)/x: one zero (**0.5**) and one undefined point (**0**). Solution x < 0 or x > 0.5.
- **Check 5, double pole.** 1/(x − 2)² − 1 = (1 − (x − 2)²)/(x − 2)² = (x − 1)(3 − x)/(x − 2)²: zeros **1 and 3**, and x = **2** is undefined although the sign does not change there: **2** zeros, **1** pole. Solution 1 < x < 2 or 2 < x < 3.
- **Check 6, the HSC idea.** 3/(x + 1) − (x − 1) = (3 − (x² − 1))/(x + 1) = (4 − x²)/(x + 1): zeros **±2**, undefined at **−1**: **2** zeros, **1** pole. Solution −2 ≤ x < −1 or x ≥ 2.
- **Check 7, touching zero.** (x − 1)² > 0: one zero (x = 1, a touching zero with no sign change), no poles. Solution x < 1 or x > 1.

```acceptance
[
  { "name": "x^2 - x - 6 < 0: two zeros",
    "params": { "ineqLeft": "x^2 - x - 6", "relation": "lt", "ineqRight": "0" },
    "run": "static",
    "expect": { "zeroCount": { "value": 2, "absTol": 1e-9 }, "poleCount": { "value": 0, "absTol": 1e-9 } } },
  { "name": "x^2 >= 4x: two zeros",
    "params": { "ineqLeft": "x^2", "relation": "ge", "ineqRight": "4x" },
    "run": "static",
    "expect": { "zeroCount": { "value": 2, "absTol": 1e-9 }, "poleCount": { "value": 0, "absTol": 1e-9 } } },
  { "name": "(x + 1)/(x - 2) >= 3: one zero, one pole",
    "params": { "ineqLeft": "(x + 1)/(x - 2)", "relation": "ge", "ineqRight": "3" },
    "run": "static",
    "expect": { "zeroCount": { "value": 1, "absTol": 1e-9 }, "poleCount": { "value": 1, "absTol": 1e-9 } } },
  { "name": "1/x < 2: one zero, one pole",
    "params": { "ineqLeft": "1/x", "relation": "lt", "ineqRight": "2" },
    "run": "static",
    "expect": { "zeroCount": { "value": 1, "absTol": 1e-9 }, "poleCount": { "value": 1, "absTol": 1e-9 } } },
  { "name": "1/(x - 2)^2 > 1: the even-order pole is found",
    "params": { "ineqLeft": "1/(x - 2)^2", "relation": "gt", "ineqRight": "1" },
    "run": "static",
    "expect": { "zeroCount": { "value": 2, "absTol": 1e-9 }, "poleCount": { "value": 1, "absTol": 1e-9 } } },
  { "name": "3/(x + 1) <= x - 1: two zeros, one pole",
    "params": { "ineqLeft": "3/(x + 1)", "relation": "le", "ineqRight": "x - 1" },
    "run": "static",
    "expect": { "zeroCount": { "value": 2, "absTol": 1e-9 }, "poleCount": { "value": 1, "absTol": 1e-9 } } },
  { "name": "(x - 1)^2 > 0: a touching zero",
    "params": { "ineqLeft": "(x - 1)^2", "relation": "gt", "ineqRight": "0" },
    "run": "static",
    "expect": { "zeroCount": { "value": 1, "absTol": 1e-9 }, "poleCount": { "value": 0, "absTol": 1e-9 } } }
]
```

Checks to add to the block above once engine change requests 2 and 3 land (critical points to 1e-6, since they come from bisection; direct evaluations to 1e-9). Working: default: critical −2, 3, both open; at x = 0, (−6) < 0 holds; at x = 4, 6 < 0 fails. x² ≥ 4x: 0 and 4 closed; at x = 2, 4 ≥ 8 fails. Rational: 2 open (undefined), 3.5 closed; at x = 3, 4/1 = 4 ≥ 3 holds; at x = 3.5, 4.5/1.5 = 3 ≥ 3 holds, but 3 > 3 fails. 1/x < 2: 0 open, 0.5 open; at x = 0.25, 4 < 2 fails. Double pole: 1, 2, 3 all open; at x = 2.5, 1/0.25 = 4 > 1 holds. HSC idea: −2 closed, −1 open, 2 closed. √x < 2 (change request 1): 0 closed (√0 = 0 < 2), 4 open.

```pending-acceptance
[
  { "name": "x^2 - x - 6 < 0 at x = 0", "params": { "ineqLeft": "x^2 - x - 6", "relation": "lt", "ineqRight": "0", "ineqTest": 0 }, "run": "static",
    "expect": { "critical1": { "value": -2, "absTol": 1e-6 }, "critical2": { "value": 3, "absTol": 1e-6 }, "closed1": { "value": 0, "absTol": 1e-9 }, "closed2": { "value": 0, "absTol": 1e-9 }, "testLeft": { "value": -6, "absTol": 1e-9 }, "testHolds": { "value": 1, "absTol": 1e-9 } } },
  { "name": "x^2 - x - 6 < 0 fails at x = 4", "params": { "ineqLeft": "x^2 - x - 6", "relation": "lt", "ineqRight": "0", "ineqTest": 4 }, "run": "static",
    "expect": { "testLeft": { "value": 6, "absTol": 1e-9 }, "testHolds": { "value": 0, "absTol": 1e-9 } } },
  { "name": "x^2 >= 4x: roots included", "params": { "ineqLeft": "x^2", "relation": "ge", "ineqRight": "4x", "ineqTest": 2 }, "run": "static",
    "expect": { "critical1": { "value": 0, "absTol": 1e-6 }, "critical2": { "value": 4, "absTol": 1e-6 }, "closed1": { "value": 1, "absTol": 1e-9 }, "closed2": { "value": 1, "absTol": 1e-9 }, "testLeft": { "value": 4, "absTol": 1e-9 }, "testRight": { "value": 8, "absTol": 1e-9 }, "testHolds": { "value": 0, "absTol": 1e-9 } } },
  { "name": "(x + 1)/(x - 2) >= 3 at x = 3", "params": { "ineqLeft": "(x + 1)/(x - 2)", "relation": "ge", "ineqRight": "3", "ineqTest": 3 }, "run": "static",
    "expect": { "critical1": { "value": 2, "absTol": 1e-6 }, "critical2": { "value": 3.5, "absTol": 1e-6 }, "closed1": { "value": 0, "absTol": 1e-9 }, "closed2": { "value": 1, "absTol": 1e-9 }, "testLeft": { "value": 4, "absTol": 1e-9 }, "testHolds": { "value": 1, "absTol": 1e-9 } } },
  { "name": "(x + 1)/(x - 2) > 3 excludes 3.5", "params": { "ineqLeft": "(x + 1)/(x - 2)", "relation": "gt", "ineqRight": "3", "ineqTest": 3.5 }, "run": "static",
    "expect": { "testLeft": { "value": 3, "absTol": 1e-9 }, "testHolds": { "value": 0, "absTol": 1e-9 }, "closed2": { "value": 0, "absTol": 1e-9 } } },
  { "name": "1/(x - 2)^2 > 1: x = 2 excluded", "params": { "ineqLeft": "1/(x - 2)^2", "relation": "gt", "ineqRight": "1", "ineqTest": 2.5 }, "run": "static",
    "expect": { "critical1": { "value": 1, "absTol": 1e-6 }, "critical2": { "value": 2, "absTol": 1e-6 }, "critical3": { "value": 3, "absTol": 1e-6 }, "closed2": { "value": 0, "absTol": 1e-9 }, "testLeft": { "value": 4, "absTol": 1e-9 }, "testHolds": { "value": 1, "absTol": 1e-9 } } },
  { "name": "3/(x + 1) <= x - 1: endpoints", "params": { "ineqLeft": "3/(x + 1)", "relation": "le", "ineqRight": "x - 1", "ineqTest": 0 }, "run": "static",
    "expect": { "critical1": { "value": -2, "absTol": 1e-6 }, "critical2": { "value": -1, "absTol": 1e-6 }, "critical3": { "value": 2, "absTol": 1e-6 }, "closed1": { "value": 1, "absTol": 1e-9 }, "closed2": { "value": 0, "absTol": 1e-9 }, "closed3": { "value": 1, "absTol": 1e-9 } } },
  { "name": "sqrt(x) < 2 includes 0", "params": { "ineqLeft": "sqrt(x)", "relation": "lt", "ineqRight": "2", "ineqTest": 1 }, "run": "static",
    "expect": { "critical1": { "value": 0, "absTol": 1e-6 }, "critical2": { "value": 4, "absTol": 1e-6 }, "closed1": { "value": 1, "absTol": 1e-9 }, "closed2": { "value": 0, "absTol": 1e-9 }, "testHolds": { "value": 1, "absTol": 1e-9 } } }
]
```
