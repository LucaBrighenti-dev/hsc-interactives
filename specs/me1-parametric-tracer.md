---
id: me1-parametric-tracer
title: "Parametric tracer"
subject: me1
engine: fnplot
setup: parametric
priority: P1
status: approved            # stub → draft → approved (Gate B)
page: /interactives/maths-ext1/parametric-tracer.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Mathematics Extension 1","version":"2024","area":"Functions","focusArea":"Further work with functions","year":11,"outcomes":[],"verified":false}
---
# Parametric tracer

> Backlog summary: A t slider traces lines, parabolas and circles; eliminate t step by step.

## Learning goal
Students understand a parametric curve as a point (x(t), y(t)) that moves as the parameter t changes, and convert the parametric equations of lines, parabolas and circles to Cartesian form by eliminating t. They notice what the Cartesian equation loses: the direction of travel, the speed of tracing and any restriction on t.

## What the student sees
Default view at 1920×1080 (projector theme), the circle x = h + r cos t, y = k + r sin t with h = 0, k = 0, r = 3, t from 0 to 2π, current t = 1, equal scales, window −6 to 6 in x and y:

- **Plot (left, about 65% of the stage):** the path traced so far, from t = tMin to the current t, as a thick orange curve (3 px) with small arrowheads every quarter of the trace showing the direction of increasing t. The current point is a large filled dot with a label "t = 1.00: (1.62, 2.52)". Faint grey tick marks along the trace at every whole number of t (or every π/6 for the circle) show the uneven or even spacing of t.
- **Optional Cartesian overlay** (toggle): the full Cartesian graph (the result of eliminating t) as a thin dark dashed curve, so students see whether the trace covers all of it.
- **Elimination panel (right):** the parametric equations with current values in KaTeX, then up to three elimination steps revealed one at a time by the "Elimination steps" control, ending with the Cartesian equation, e.g. (x − 0)² + (y − 0)² = 3². For the custom family the panel says "Eliminate t by hand for your own equations".
- **Two small strip graphs** under the panel: x against t and y against t, with a vertical line at the current t, so students see each coordinate as a function of t.
- Dragging the t slider (or pressing an "Animate t" button that sweeps t from tMin to tMax at a steady rate) moves the point; the animation is a view convenience and never changes the outputs for a given t.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| family | Curve | | | | | circle | enum: `line`, `parabola`, `circle`, `custom`. Segmented or select |
| t | Parameter t | | −20 | 20 | 0.01 | 1 | the current point; the trace runs from tMin to t |
| tMin | t from | | −20 | 20 | 0.05 | 0 | |
| tMax | t to | | −20 | 20 | 0.05 | 6.283185307 | the slider for t spans tMin to tMax |
| h | h | | −10 | 10 | 0.5 | 0 | line: point at t = 0 is (h, k); parabola: vertex (h, k); circle: centre (h, k) |
| k | k | | −10 | 10 | 0.5 | 0 | see h |
| p | p (x-change per unit t) | | −5 | 5 | 0.5 | 2 | line only |
| q | q (y-change per unit t) | | −5 | 5 | 0.5 | −1 | line only |
| focal | a (focal length) | | −5 | 5 | 0.25 | 1 | parabola only; a = 0 gives a single point and the stage says so |
| radius | r (radius) | | 0.5 | 10 | 0.5 | 3 | circle only |
| xExpr | x(t) = | | | | | `t^2` | custom only; fnplot parser, variable `t` |
| yExpr | y(t) = | | | | | `t^3` | custom only; fnplot parser, variable `t` |
| elimStep | Elimination steps shown | | 0 | 3 | 1 | 0 | integer |
| showCartesian | Cartesian graph | | | | | off | not available for custom |
| xMin | Window x from | | −20 | 20 | 0.5 | −6 | equal scales on both axes |
| xMax | Window x to | | −20 | 20 | 0.5 | 6 | |
| yMin | Window y from | | −20 | 20 | 0.5 | −6 | |
| yMax | Window y to | | −20 | 20 | 0.5 | 6 | |

The families and their elimination steps (shown with the current numbers substituted):

| Family | Parametric equations | Step 1 | Step 2 | Step 3 (Cartesian) |
| --- | --- | --- | --- | --- |
| line | x = h + pt, y = k + qt | t = (x − h)/p | y = k + q(x − h)/p | q(x − h) − p(y − k) = 0 |
| parabola | x = h + 2at, y = k + at² | t = (x − h)/(2a) | y = k + a((x − h)/(2a))² | (x − h)² = 4a(y − k) |
| circle | x = h + r cos t, y = k + r sin t | cos t = (x − h)/r, sin t = (y − k)/r | cos²t + sin²t = 1 | (x − h)² + (y − k)² = r² |

For the line with p = 0, step 1 is replaced by "x = h for every t: a vertical line".

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | circle, h = 0, k = 0, r = 3, t from 0 to 2π, t = 1 | Uniform motion round a circle; one full turn |
| line | line, h = 1, k = 3, p = 2, q = −1, t from −3 to 3, t = 2, window −6 to 8 | A straight line traced at constant speed |
| parabola | parabola, h = 0, k = 0, a = 1, t from −3 to 3, t = 3, window −8 to 10 | x = 2t, y = t²: the classic parametric parabola x² = 4y |
| half-circle | circle, h = 0, k = 0, r = 3, t from 0 to π | The Cartesian equation hides the restriction: only the top half is traced |
| custom-cusp | custom, x(t) = t², y(t) = t³, t from −2 to 2, t = −2, window x −2 to 10, y −9 to 9 | Enrichment beyond lines, parabolas and circles: a curve with a cusp, y² = x³ (x runs from 0 to 4 and y from −8 to 8, so the whole trace is on stage) |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| x | x at the current t | | 4 |
| y | y at the current t | | 4 |
| residual | Cartesian equation check (left − right) | | 3 |

`residual` evaluates the step 3 equation at the current point as (left side) − (right side): line q(x − h) − p(y − k); parabola (x − h)² − 4a(y − k); circle (x − h)² + (y − k)² − r². It should read 0 (within rounding), which is the point of the elimination. It is NaN for the custom family.

## Assumptions shown on stage
- t is a real number; for the circle, t is an angle in radians
- Equal scales on both axes

## Try this (3–5 predict, observe, explain prompts)
1. Predict: for the default circle, where is the point when t = 0, and which way does it move as t increases?
2. Observe: in the parabola preset, drag t from −3 to 3. Are the tick marks at whole-number t evenly spaced along the curve? Where are they closest together?
3. Predict: in the half-circle preset, the Cartesian equation is x² + y² = 9. Turn on the Cartesian graph. Which part of it is never traced, and why?
4. Observe: in the line preset, change p and q to 4 and −2. What changes in the trace, and what stays the same in the Cartesian equation?
5. Explain: in the custom-cusp preset, show that the points satisfy y² = x³. Why does the trace have a sharp point at the origin?

## Teacher notes outline
- Misconceptions to target: t is a coordinate on the graph (it is not shown on either axis); the Cartesian equation tells you everything about the parametric curve (it loses direction, speed and restrictions on t); squaring to eliminate t never adds points (it can, as in the half-circle); the parameter for the circle must be in degrees.
- 10-minute lesson flow: 0–2 min predict the starting point and direction of the default circle; 2–4 min reveal the elimination steps one at a time; 4–6 min the line and parabola presets, eliminating t on the board first; 6–8 min the half-circle and the restriction; 8–10 min the cusp (label it enrichment: the course's curves are lines, parabolas and circles), then students write their own pair of equations in custom mode.
- Original HSC-style question idea: a particle moves so that x = 1 + 2 cos t and y = −2 + 2 sin t for 0 ≤ t ≤ 3π/2. (a) Find the Cartesian equation of its path. (b) Sketch the path, showing the start and end points and the direction of motion. (c) Find the values of t for which the particle is on the line y = x − 3. Full question and worked solution go in the notes file.

## Accessibility notes
- Second cues beyond colour: the trace is solid and thick, the Cartesian overlay thin and dashed; direction arrowheads show increasing t; the current point has a text label with t and its coordinates.
- Keyboard: t is a panel slider (arrow keys move it by 0.01, Page Up and Page Down by 0.5); "Animate t" is a button that toggles with Enter or Space; elimination steps use a stepper control.
- Stage aria-label (from `describe()`), for example: "Circle traced parametrically: x = 3 cos t, y = 3 sin t, t from 0 to 6.28. At t = 1 the point is (1.62, 2.52). Cartesian equation x squared plus y squared equals 9."

## Engine change requests
The fnplot engine's `meta` was not yet on `origin` when this spec was written (only `parser.js`), so these are **keys to reconcile with engine meta**:
- Params (setup `parametric`): `family`, `t`, `tMin`, `tMax`, `h`, `k`, `p`, `q`, `focal`, `radius`, `xExpr`, `yExpr`, `elimStep`, `showCartesian`, `xMin`, `xMax`, `yMin`, `yMax`. The keys `focal` and `radius` are named to avoid clashing with the auxiliary setup's `a` and `b`, which have different ranges.
- Outputs: `x`, `y`, `residual`.
- `parametric` listed in `meta.staticSetups`; `xExpr` and `yExpr` compile with `variables: ['t']`.

## Acceptance
Every number below comes from the formula and hand calculation shown here. All are direct evaluations (tolerance 1e-9).

- **Check 1, default circle at t = π/3.** x = 3 cos(π/3) = 3 × 0.5 = **1.5**; y = 3 sin(π/3) = 3 × (√3/2) = **2.598076211**. Residual 1.5² + 2.598076211² − 9 = 2.25 + 6.75 − 9 = **0**.
- **Check 2, shifted circle at t = π.** h = 1, k = −1, r = 2: x = 1 + 2 cos π = 1 − 2 = **−1**; y = −1 + 2 sin π = **−1**. Residual (−1 − 1)² + (−1 + 1)² − 4 = 4 + 0 − 4 = **0**.
- **Check 3, parabola at t = 3.** a = 1, h = k = 0: x = 2(1)(3) = **6**, y = 1(3²) = **9**. Residual 6² − 4(1)(9) = 36 − 36 = **0**.
- **Check 4, shifted parabola at t = −2.** a = 0.5, h = 1, k = 2: x = 1 + 2(0.5)(−2) = **−1**, y = 2 + 0.5(4) = **4**. Residual (−1 − 1)² − 4(0.5)(4 − 2) = 4 − 4 = **0**.
- **Check 5, line at t = 2.** h = 1, k = 3, p = 2, q = −1: x = 1 + 2(2) = **5**, y = 3 − 2 = **1**. Residual (−1)(5 − 1) − 2(1 − 3) = −4 + 4 = **0**. (Cartesian form: y = 3 − (x − 1)/2, and at x = 5, y = 1.)
- **Check 6, custom cusp at t = −2.** x = (−2)² = **4**, y = (−2)³ = **−8**; indeed y² = 64 = 4³ = x³.

```acceptance
[
  { "name": "circle r = 3 at t = pi/3",
    "params": { "family": "circle", "h": 0, "k": 0, "radius": 3, "tMin": 0, "tMax": 6.283185307, "t": 1.0471975511965976 },
    "run": "static",
    "expect": {
      "x": { "value": 1.5, "absTol": 1e-9 },
      "y": { "value": 2.598076211, "absTol": 1e-9 },
      "residual": { "value": 0, "absTol": 1e-9 } } },
  { "name": "circle centre (1, -1), r = 2 at t = pi",
    "params": { "family": "circle", "h": 1, "k": -1, "radius": 2, "tMin": 0, "tMax": 6.283185307, "t": 3.141592653589793 },
    "run": "static",
    "expect": {
      "x": { "value": -1, "absTol": 1e-9 },
      "y": { "value": -1, "absTol": 1e-9 },
      "residual": { "value": 0, "absTol": 1e-9 } } },
  { "name": "parabola x = 2t, y = t^2 at t = 3",
    "params": { "family": "parabola", "h": 0, "k": 0, "focal": 1, "tMin": -3, "tMax": 3, "t": 3 },
    "run": "static",
    "expect": {
      "x": { "value": 6, "absTol": 1e-9 },
      "y": { "value": 9, "absTol": 1e-9 },
      "residual": { "value": 0, "absTol": 1e-9 } } },
  { "name": "shifted parabola a = 0.5, vertex (1, 2) at t = -2",
    "params": { "family": "parabola", "h": 1, "k": 2, "focal": 0.5, "tMin": -3, "tMax": 3, "t": -2 },
    "run": "static",
    "expect": {
      "x": { "value": -1, "absTol": 1e-9 },
      "y": { "value": 4, "absTol": 1e-9 },
      "residual": { "value": 0, "absTol": 1e-9 } } },
  { "name": "line through (1, 3) with direction (2, -1) at t = 2",
    "params": { "family": "line", "h": 1, "k": 3, "p": 2, "q": -1, "tMin": -3, "tMax": 3, "t": 2 },
    "run": "static",
    "expect": {
      "x": { "value": 5, "absTol": 1e-9 },
      "y": { "value": 1, "absTol": 1e-9 },
      "residual": { "value": 0, "absTol": 1e-9 } } },
  { "name": "custom cusp x = t^2, y = t^3 at t = -2",
    "params": { "family": "custom", "xExpr": "t^2", "yExpr": "t^3", "tMin": -2, "tMax": 2, "t": -2 },
    "run": "static",
    "expect": { "x": { "value": 4, "absTol": 1e-9 }, "y": { "value": -8, "absTol": 1e-9 } } }
]
```
