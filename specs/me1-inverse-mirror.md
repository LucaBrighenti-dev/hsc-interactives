---
id: me1-inverse-mirror
title: "Inverse function mirror"
subject: me1
engine: fnplot
setup: inverse
priority: P1
status: draft            # stub → draft → approved (Gate B)
page: /interactives/maths-ext1/inverse-mirror.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Mathematics Extension 1","version":"2024","area":"Functions","focusArea":"Further work with functions","year":11,"outcomes":[],"verified":false}
---
# Inverse function mirror

> Backlog summary: Reflect in y = x and drag the domain restriction until the inverse is a function.

## Learning goal
Students see the graph of an inverse relation as the reflection of y = f(x) in the line y = x, and that the reflection is a function exactly when f is one-to-one on its domain (the horizontal line test). They restrict the domain to make an inverse function, and read off that the domain of f⁻¹ is the range of f and the range of f⁻¹ is the domain of f.

## What the student sees
Default view at 1920×1080 (projector theme), f(x) = (x − 2)² + 1, domain −1 ≤ x ≤ 5, equal scales on both axes, window −2 to 10 in x and y:

- The line y = x as a thin dark dash-dot "mirror" line, labelled "y = x".
- The whole of y = f(x) as a faint grey dashed curve; the restricted part (domain from `domainMin` to `domainMax`) as the thick orange curve (3 px), with filled endpoint dots and two draggable handles on the x-axis marking the restriction.
- The reflection of the restricted part (x = f(y)) as a thick blue curve (`--s2`, 3 px, long dashes), with its own endpoint dots. A few thin grey dotted chords join matching points (a, b) and (b, a) at right angles to the mirror.
- **Horizontal line test** (toggle): a horizontal line sweeps slowly across the orange curve; when it meets the curve twice, both crossing points pulse with ring markers and a banner says "Not one-to-one: the reflection fails the vertical line test". When f is one-to-one on the domain, the banner says "One-to-one: the reflection is the inverse function f⁻¹".
- A probe: a horizontal guide at y = probe meets the orange curve; its reflection meets the blue curve at (probe, f⁻¹(probe)). In the default view f is not one-to-one, so the label reads "f⁻¹ is not a function on this domain"; after dragging the left handle to 2 (the right-branch preset) it reads "f⁻¹(5) = 4".
- Readout chips under the plot. In the default view: "Domain of f: [−1, 5]" and "Range of f: [1, 10]"; once f is one-to-one, for example on the right branch: "Domain of f: [2, 5] → Range of f⁻¹: [2, 5]" and "Range of f: [1, 10] → Domain of f⁻¹: [1, 10]".

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| f | f(x) = | | | | | `(x - 2)^2 + 1` | string; fnplot parser, variable `x`; pattern `EXPRESSION_PATTERN`; max length 80 |
| domainMin | Domain from | | −20 | 20 | 0.1 | −1 | draggable handle on the x-axis |
| domainMax | Domain to | | −20 | 20 | 0.1 | 5 | draggable handle; if domainMin > domainMax the engine uses [domainMax, domainMin] |
| probe | Probe value (in the range of f) | | −20 | 20 | 0.1 | 5 | |
| showMirror | Mirror line y = x | | | | | on | |
| showReflection | Reflected graph | | | | | on | |
| showLineTest | Horizontal line test | | | | | on | |
| showChords | Matching-point chords | | | | | on | |
| xMin | Window x from | | −20 | 20 | 0.5 | −2 | the engine keeps equal scales and pads the shorter axis |
| xMax | Window x to | | −20 | 20 | 0.5 | 10 | |
| yMin | Window y from | | −20 | 20 | 0.5 | −2 | |
| yMax | Window y to | | −20 | 20 | 0.5 | 10 | |

How the engine decides (static setup):
- Samples f at 2001 equally spaced points on the domain. f is **one-to-one** when the successive differences are all positive or all negative (a difference within 1e-12 of zero counts as neither, so a flat piece fails the test).
- **Range** of f on the domain: the least and greatest sampled values, each refined by a golden-section search on the neighbouring sample interval to 1e-10 in x. The engine keeps the better of the sampled and the refined value, so an extreme at an endpoint of the domain is reported exactly (the refinement can only lose accuracy next to an endpoint).
- **f⁻¹(probe)**: when f is one-to-one and the probe lies in the range, bisection on the domain to 1e-12; otherwise NaN.
- If f is undefined anywhere on the domain (NaN or infinite), the stage says so and the outputs are NaN.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | f = `(x - 2)^2 + 1`, domain −1 to 5, probe 5 | Not one-to-one: drag the left handle to 2 to fix it |
| right-branch | f = `(x - 2)^2 + 1`, domain 2 to 5, probe 5 | f⁻¹(x) = 2 + √(x − 1) |
| left-branch | f = `(x - 2)^2 + 1`, domain −1 to 2, probe 5 | f⁻¹(x) = 2 − √(x − 1) |
| exponential | f = `exp(x)`, domain −2 to 2, probe 2, window −3 to 8 | e^x and ln x, reflections of each other |
| cubic | f = `x^3 - 3x`, domain −2 to 2, probe 0, window −3 to 3 | Fails the test until the domain is cut at a turning point (x = ±1) |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| oneToOne | One-to-one on this domain (1 = yes, 0 = no) | | integer (`integer: true`) |
| rangeMin | Range of f from (domain of f⁻¹ from) | | 4 |
| rangeMax | Range of f to (domain of f⁻¹ to) | | 4 |
| inverseAt | f⁻¹ at the probe | | 4 |

## Assumptions shown on stage
- One-to-one is tested numerically at 2001 points on the domain
- Equal scales on both axes, so the reflection in y = x is true to shape

## Try this (3–5 predict, observe, explain prompts)
1. Predict: the default graph is a parabola on −1 ≤ x ≤ 5. Will its reflection in y = x be a function? Turn on the horizontal line test to check.
2. Observe: drag the left domain handle to the right until the banner changes. Where exactly does it change, and why there?
3. Predict: with the domain 2 ≤ x ≤ 5, what is the domain of the inverse? Check the chips under the graph.
4. Observe: in the exponential preset, find f⁻¹(2). Which familiar function is the blue curve?
5. Explain: for the right branch, why do f and f⁻¹ meet only on the line y = x?

## Teacher notes outline
- Misconceptions to target: f⁻¹(x) means 1/f(x); every function has an inverse function; the inverse undoes the domain restriction (the restriction carries across as the range of f⁻¹); the graphs of f and f⁻¹ always meet on y = x (a decreasing function can meet its inverse off the line, e.g. f(x) = −x³); reflecting in the x-axis instead of in y = x.
- 10-minute lesson flow: 0–2 min predict the reflection of the default parabola; 2–4 min line test and the banner; 4–6 min drag the domain to the vertex and write f⁻¹(x) = 2 + √(x − 1); 6–8 min the left branch gives the other sign; 8–10 min swap domain and range on the board, then the exponential preset.
- Original HSC-style question idea: let f(x) = (x − 1)² − 3 for x ≥ 1. (a) State the range of f. (b) Find f⁻¹(x) and state its domain. (c) Sketch y = f(x) and y = f⁻¹(x) on the same axes. (d) Explain why the graphs can only meet on the line y = x, and find the exact coordinates of that point ((3 + √17)/2 for both coordinates). Full question and worked solution go in the notes file.

## Accessibility notes
- Second cues beyond colour: f is solid orange, the reflection long-dashed blue, the mirror line dash-dot; each has a text label at its end; one-to-one status is written in the banner, not shown by colour alone; failing crossing points have ring markers.
- Keyboard: domain handles and the probe are panel sliders as well as stage handles (arrow keys move a focused handle by one step).
- Stage aria-label (from `describe()`), for example: "Graph of f of x equals (x − 2) squared plus 1 on the domain −1 to 5 and its reflection in y = x. Not one-to-one on this domain. Range of f from 1 to 10."

## Engine change requests
The fnplot engine's `meta` was not yet on `origin` when this spec was written (only `parser.js`), so these are **keys to reconcile with engine meta**:
- Params (setup `inverse`): `f`, `domainMin`, `domainMax`, `probe`, `showMirror`, `showReflection`, `showLineTest`, `showChords`, `xMin`, `xMax`, `yMin`, `yMax`.
- Outputs: `oneToOne`, `rangeMin`, `rangeMax`, `inverseAt`.
- `inverse` listed in `meta.staticSetups`; the "inverse with domain restriction" transform helper from the guide.

## Acceptance
Every number below comes from the formula and hand calculation shown here. Values at domain endpoints and from bisection use tolerance 1e-9; range values found inside the domain (refined by golden-section search) use 1e-6.

- **Check 1, default is not one-to-one.** f(x) = (x − 2)² + 1 on [−1, 5]: f(1) = 2 = f(3), so a horizontal line meets the graph twice: **oneToOne = 0**. The minimum is at the vertex, f(2) = **1**; the endpoints give f(−1) = 9 + 1 = 10 and f(5) = 9 + 1 = 10, so the maximum is **10**.
- **Check 2, right branch.** On [2, 5], f is increasing: **oneToOne = 1**, range [f(2), f(5)] = [**1**, **10**]. Solving 5 = (x − 2)² + 1 with x ≥ 2: (x − 2)² = 4, x = 2 + 2 = **4**, so f⁻¹(5) = 4.
- **Check 3, left branch.** On [−1, 2], f is decreasing: **oneToOne = 1**, range [**1**, **10**]. With x ≤ 2: x = 2 − 2 = **0**, so f⁻¹(5) = 0.
- **Check 4, exponential.** f(x) = eˣ on [−2, 2] is increasing: **oneToOne = 1**, range [e⁻², e²] = [**0.1353352832**, **7.389056099**]. f⁻¹(2) = ln 2 = **0.6931471806**.
- **Check 5, cubic, whole domain.** f(x) = x³ − 3x on [−2, 2]: f(−1) = −1 + 3 = 2 and f(2) = 8 − 6 = 2, so **oneToOne = 0**. Least value: f(−2) = −8 + 6 = **−2** = f(1); greatest **2**.
- **Check 6, cubic, cut at the turning point.** On [1, 2], f′(x) = 3x² − 3 > 0 for x > 1, so **oneToOne = 1**, range [f(1), f(2)] = [**−2**, **2**]. f⁻¹(0): x³ − 3x = x(x² − 3) = 0 with 1 ≤ x ≤ 2 gives x = √3 = **1.732050808**.

```acceptance
[
  { "name": "default parabola on [-1, 5] is not one-to-one",
    "params": { "f": "(x - 2)^2 + 1", "domainMin": -1, "domainMax": 5, "probe": 5 },
    "run": "static",
    "expect": {
      "oneToOne": { "value": 0, "absTol": 1e-9 },
      "rangeMin": { "value": 1, "absTol": 1e-6 },
      "rangeMax": { "value": 10, "absTol": 1e-9 } } },
  { "name": "right branch: f inverse of 5 is 4",
    "params": { "f": "(x - 2)^2 + 1", "domainMin": 2, "domainMax": 5, "probe": 5 },
    "run": "static",
    "expect": {
      "oneToOne": { "value": 1, "absTol": 1e-9 },
      "rangeMin": { "value": 1, "absTol": 1e-9 },
      "rangeMax": { "value": 10, "absTol": 1e-9 },
      "inverseAt": { "value": 4, "absTol": 1e-9 } } },
  { "name": "left branch: f inverse of 5 is 0",
    "params": { "f": "(x - 2)^2 + 1", "domainMin": -1, "domainMax": 2, "probe": 5 },
    "run": "static",
    "expect": {
      "oneToOne": { "value": 1, "absTol": 1e-9 },
      "rangeMin": { "value": 1, "absTol": 1e-9 },
      "rangeMax": { "value": 10, "absTol": 1e-9 },
      "inverseAt": { "value": 0, "absTol": 1e-9 } } },
  { "name": "exponential and ln 2",
    "params": { "f": "exp(x)", "domainMin": -2, "domainMax": 2, "probe": 2 },
    "run": "static",
    "expect": {
      "oneToOne": { "value": 1, "absTol": 1e-9 },
      "rangeMin": { "value": 0.1353352832, "relTol": 1e-9 },
      "rangeMax": { "value": 7.389056099, "relTol": 1e-9 },
      "inverseAt": { "value": 0.6931471806, "relTol": 1e-9 } } },
  { "name": "cubic on [-2, 2] fails the line test",
    "params": { "f": "x^3 - 3x", "domainMin": -2, "domainMax": 2, "probe": 0 },
    "run": "static",
    "expect": {
      "oneToOne": { "value": 0, "absTol": 1e-9 },
      "rangeMin": { "value": -2, "absTol": 1e-6 },
      "rangeMax": { "value": 2, "absTol": 1e-6 } } },
  { "name": "cubic on [1, 2]: f inverse of 0 is root 3",
    "params": { "f": "x^3 - 3x", "domainMin": 1, "domainMax": 2, "probe": 0 },
    "run": "static",
    "expect": {
      "oneToOne": { "value": 1, "absTol": 1e-9 },
      "rangeMin": { "value": -2, "absTol": 1e-9 },
      "rangeMax": { "value": 2, "absTol": 1e-9 },
      "inverseAt": { "value": 1.732050808, "relTol": 1e-9 } } }
]
```
