---
id: me1-slope-fields
title: "Slope fields"
subject: me1
engine: field2d
setup: slope-field
priority: P0
status: approved            # stub → draft → approved (Gate B)
page: /interactives/maths-ext1/slope-fields.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Mathematics Extension 1","version":"2024","area":"Calculus","focusArea":"Further applications of calculus","year":12,"outcomes":[],"verified":false}
---
# Slope fields

> Backlog summary: Draw dy/dx = f(x, y), click to launch solution curves; logistic and cooling presets.

## Learning goal
Students read a first-order differential equation dy/dx = f(x, y) as a rule that gives a gradient at every point, see that each solution curve follows the slope field, and that an initial condition picks one curve out of the family. They connect the field's shape to the long-run behaviour of exponential growth and decay, Newton's law of cooling and the logistic model, including equilibrium (constant) solutions.

## What the student sees
Default view at 1920×1080 (projector theme), the "bell" field dy/dx = −xy on −4 ≤ x ≤ 4, −3 ≤ y ≤ 3:

- A square grid of short slope marks (about 21 per row), all the same length, drawn in the axis grey and centred on lattice points. Marks are steeper where |f| is larger; horizontal marks show where dy/dx = 0.
- Labelled axes with ticks; the equation above the plot in KaTeX, with the current constants substituted, e.g. dy/dx = −1·x·y.
- The solution through the start point (x₀, y₀) in orange (3 px) with a filled start dot labelled "(0, 1)". It is drawn in both directions from the start point to the edges of the window.
- The evaluation point: a dashed vertical line at x = target, a hollow ring where it meets the solution, and a label "y(1) = 0.607".
- Clicking or tapping anywhere on the stage launches another solution curve through that point (up to 8, alternating colours `--s2`, `--s3`, `--s4` and alternating solid/dashed lines, each with a small start dot). A "Clear curves" button removes them. These extra curves are view-only and do not change any readout.
- Optional zero-slope curve (toggle): a dotted line where f(x, y) = 0, which shows equilibrium solutions such as y = 0 and y = K in the logistic preset.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| dydx | dy/dx = | | | | | `-a*x*y` | string, fnplot parser with variables `x`, `y`, `a`, `b`; pattern `EXPRESSION_PATTERN`; max length 80 |
| a | Constant a | | −5 | 5 | 0.05 | 1 | named constant usable in the expression |
| b | Constant b | | −100 | 100 | 0.5 | 10 | named constant usable in the expression |
| x0 | Start x₀ | | −100 | 100 | 0.1 | 0 | |
| y0 | Start y₀ | | −100 | 100 | 0.1 | 1 | |
| xTarget | Evaluate at x | | −100 | 100 | 0.1 | 1 | may be less than x₀ (integrates backwards) |
| xMin | Window x from | | −100 | 100 | 0.5 | −4 | |
| xMax | Window x to | | −100 | 100 | 0.5 | 4 | |
| yMin | Window y from | | −100 | 100 | 0.5 | −3 | |
| yMax | Window y to | | −100 | 100 | 0.5 | 3 | |
| density | Slope marks per row | | 10 | 40 | 1 | 21 | integer |
| showSolution | Solution through (x₀, y₀) | | | | | on | |
| showZeroSlope | Zero-slope curve | | | | | off | |

Behaviour the numbers depend on:
- The setup is static (no time evolution): the solution is computed as soon as a parameter changes.
- `yAtTarget` integrates from (x₀, y₀) to x = xTarget with classical RK4 using at least 1000 equal steps, whether or not xTarget lies inside the window. If |y| exceeds 10⁶ or f is undefined along the way, the solution stops there and `yAtTarget` is NaN (shown as —) with a calm on-stage note "the solution leaves the plane before x = …".
- If an expression does not parse, the stage shows the parser's message and keeps the last valid field.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | dydx `-a*x*y`, a = 1, window x −4 to 4, y −3 to 3, start (0, 1), target 1 | Separable, solvable by hand (y = y₀e^(−ax²/2)); every solution is a scaled bell and y = 0 is an equilibrium |
| growth | dydx `a*y`, a = 1, window x −2 to 3, y −1 to 10, start (0, 1), target 1 | Exponential growth: y(1) = e |
| cooling | dydx `-a*(y - b)`, a = 0.2, b = 20, window x 0 to 30, y 0 to 100, start (0, 90), target 5 | Newton's law of cooling: tea at 90 °C in a 20 °C room, x in minutes |
| logistic | dydx `a*y*(1 - y/b)`, a = 1, b = 10, window x −2 to 10, y −2 to 14, start (0, 1), target 2, zero-slope curve on | Logistic growth with carrying capacity 10; equilibria y = 0 and y = 10 |
| not-separable | dydx `x - y`, window x −5 to 5, y −5 to 5, start (0, 1), target 2 | A field you can read even when you cannot yet solve the equation; solutions approach y = x − 1 |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| slopeAtStart | Slope at (x₀, y₀) | | 3 |
| yAtTarget | y at the target x | | 4 |
| slopeAtTarget | Slope at the target point | | 3 |

`slopeAtStart` = f(x₀, y₀). `slopeAtTarget` = f(xTarget, yAtTarget). All are dimensionless (in the cooling preset x is in minutes and y in °C; the stage axis titles say so, the readouts stay unitless).

## Assumptions shown on stage
- Solution curves computed numerically (RK4)
- Slope marks show direction only; all marks are the same length
- Cooling preset: room temperature constant at b °C

## Try this (3–5 predict, observe, explain prompts)
1. Predict: in the default field, where are the slope marks horizontal? Turn on the zero-slope curve to check.
2. Observe: click to launch three solution curves above the x-axis and one below. How are they related to the orange curve?
3. Predict: in the cooling preset, what temperature does the tea approach? Move y₀ to 10 (an iced drink) and describe the new curve.
4. Observe: in the logistic preset, start at y₀ = 12, then at y₀ = 0. What happens in each case, and why are y = 0 and y = 10 special?
5. Explain: in the not-separable preset, why do all the solution curves approach the line y = x − 1 as x increases?

## Teacher notes outline
- Misconceptions to target: a slope field is a graph of y = f(x) (it is a field of gradients, one at every point); solution curves can cross (for these well-behaved fields they never do, because each point has one gradient); every solution of the cooling law reaches the room temperature (it only approaches it); the constant in dy/dx = ky is the same as the starting value.
- 10-minute lesson flow: 0–2 min read the default field: where is it flat, where steep?; 2–4 min click curves and solve dy/dx = −xy by separation to confirm the bell; 4–7 min cooling preset with different starting temperatures; 7–9 min logistic preset and equilibria; 9–10 min sketch a field by hand for dy/dx = y − 2.
- Original HSC-style question idea: a population of native bees in a reserve is modelled by dP/dt = 0.4P(1 − P/500), where t is in years and P(0) = 50. (a) Sketch the slope field features: where is dP/dt = 0, and where is it greatest? (b) Show that P = 500/(1 + 9e^(−0.4t)) satisfies the equation and the initial condition. (c) Find when the population reaches 250. Full question and worked solution go in the notes file.

## Accessibility notes
- Second cues beyond colour: the main solution is thicker (3 px) than the slope marks and has a filled start dot and a text label; extra curves alternate solid and dashed; the zero-slope curve is dotted; the evaluation point is a hollow ring with a text label giving its value.
- Keyboard: all parameters are in the side panel; the start point can also be set by typing x₀ and y₀. Launching extra curves by click has a keyboard alternative: an "Add curve at (x₀, y₀ + 1)" button.
- Stage aria-label (from `describe()`), for example: "Slope field for dy/dx = −1 x y on x from −4 to 4 and y from −3 to 3. Solution through (0, 1); at x = 1, y is 0.607."

## Engine change requests
The field2d engine was not yet on `origin` when this spec was written, so these are **keys to reconcile with engine meta**:
- Params (setup `slope-field`): `dydx`, `a`, `b`, `x0`, `y0`, `xTarget`, `xMin`, `xMax`, `yMin`, `yMax`, `density`, `showSolution`, `showZeroSlope`.
- Outputs: `slopeAtStart`, `yAtTarget`, `slopeAtTarget`.
- `slope-field` listed in `meta.staticSetups`; `yAtTarget` from RK4 with at least 1000 steps between x₀ and the target (both directions).
- The expression compiles with `variables: ['x', 'y', 'a', 'b']` through the shared `fnplot/parser.js`.

## Acceptance
Every number below comes from the formula and hand calculation shown here. Slopes at the start are direct evaluations (tolerance 1e-9). Values from the numerical solution use a relative tolerance of 1e-5; RK4 with 1000 steps is accurate to about 1e-12 on these problems, so the tolerance only absorbs a different (still reasonable) step size.

- **Check 1, growth.** dy/dx = y (a = 1), y(0) = 1. Separating: ∫dy/y = ∫dx, so ln y = x and **y = eˣ**. At x = 1: y = e = **2.718281828**. Slope at start f(0, 1) = 1 × 1 = **1**; slope at the target f(1, e) = **2.718281828**.
- **Check 2, backwards.** Same field and start, target x = −1: y = e⁻¹ = **0.3678794412**.
- **Check 3, logistic.** dy/dx = ry(1 − y/K) with r = a = 1, K = b = 10, y(0) = 1. The solution is y = K/(1 + (K/y₀ − 1)e^(−rx)) = 10/(1 + 9e^(−x)). At x = 2: e⁻² = 0.1353352832, so 9e⁻² = 1.2180175492 and y = 10/2.2180175492 = **4.508530604**. Slope at start = 1 × 1 × (1 − 1/10) = **0.9**. Slope at target = 4.508530604 × (1 − 0.4508530604) = 4.508530604 × 0.5491469396 = **2.475845783**.
- **Check 4, cooling.** dy/dx = −k(y − T) with k = a = 0.2, T = b = 20, y(0) = 90. Then y − 20 = 70e^(−0.2x). At x = 5: 70e⁻¹ = 70 × 0.3678794412 = 25.75156088, so y = **45.75156088**. Slope at start = −0.2 × (90 − 20) = **−14**. Slope at target = −0.2 × 25.75156088 = **−5.150312176**.
- **Check 5, the default bell.** dy/dx = −xy (a = 1), y(0) = 1. Separating: ∫dy/y = −∫x dx, so ln y = −x²/2 and y = e^(−x²/2). At x = 1: y = e^(−1/2) = **0.6065306597**. Slope at start = −1 × 0 × 1 = **0**. Slope at target = −1 × 0.6065306597 = **−0.6065306597**.
- **Check 6, not separable.** dy/dx = x − y, y(0) = 1. Substituting y = x − 1 + Ce^(−x): dy/dx = 1 − Ce^(−x) and x − y = 1 − Ce^(−x), so it satisfies the equation; y(0) = −1 + C = 1 gives C = 2. At x = 2: y = 1 + 2e⁻² = 1 + 0.2706705665 = **1.270670566**. Slope at start = 0 − 1 = **−1**; slope at target = 2 − 1.270670566 = **0.7293294335**.

```acceptance
[
  { "name": "growth dy/dx = y: y(1) = e",
    "params": { "dydx": "a*y", "a": 1, "b": 10, "x0": 0, "y0": 1, "xTarget": 1, "xMin": -2, "xMax": 3, "yMin": -1, "yMax": 10 },
    "run": "static",
    "expect": {
      "slopeAtStart": { "value": 1, "absTol": 1e-9 },
      "yAtTarget": { "value": 2.718281828, "relTol": 1e-5 },
      "slopeAtTarget": { "value": 2.718281828, "relTol": 1e-5 } } },
  { "name": "growth integrated backwards: y(-1) = 1/e",
    "params": { "dydx": "a*y", "a": 1, "b": 10, "x0": 0, "y0": 1, "xTarget": -1, "xMin": -2, "xMax": 3, "yMin": -1, "yMax": 10 },
    "run": "static",
    "expect": { "yAtTarget": { "value": 0.3678794412, "relTol": 1e-5 } } },
  { "name": "logistic r = 1, K = 10, y0 = 1: y(2)",
    "params": { "dydx": "a*y*(1 - y/b)", "a": 1, "b": 10, "x0": 0, "y0": 1, "xTarget": 2, "xMin": -2, "xMax": 10, "yMin": -2, "yMax": 14 },
    "run": "static",
    "expect": {
      "slopeAtStart": { "value": 0.9, "absTol": 1e-9 },
      "yAtTarget": { "value": 4.508530604, "relTol": 1e-5 },
      "slopeAtTarget": { "value": 2.475845783, "relTol": 1e-5 } } },
  { "name": "cooling k = 0.2 from 90 in a 20 degree room: y(5)",
    "preset": "cooling",
    "params": { "dydx": "-a*(y - b)", "a": 0.2, "b": 20, "x0": 0, "y0": 90, "xTarget": 5 },
    "run": "static",
    "expect": {
      "slopeAtStart": { "value": -14, "absTol": 1e-9 },
      "yAtTarget": { "value": 45.75156088, "relTol": 1e-5 },
      "slopeAtTarget": { "value": -5.150312176, "relTol": 1e-5 } } },
  { "name": "default bell dy/dx = -xy: y(1) = e^(-1/2)",
    "params": { "dydx": "-a*x*y", "a": 1, "b": 10, "x0": 0, "y0": 1, "xTarget": 1, "xMin": -4, "xMax": 4, "yMin": -3, "yMax": 3 },
    "run": "static",
    "expect": {
      "slopeAtStart": { "value": 0, "absTol": 1e-9 },
      "yAtTarget": { "value": 0.6065306597, "relTol": 1e-5 },
      "slopeAtTarget": { "value": -0.6065306597, "relTol": 1e-5 } } },
  { "name": "not separable dy/dx = x - y: y(2) = 1 + 2e^-2",
    "params": { "dydx": "x - y", "x0": 0, "y0": 1, "xTarget": 2, "xMin": -5, "xMax": 5, "yMin": -5, "yMax": 5 },
    "run": "static",
    "expect": {
      "slopeAtStart": { "value": -1, "absTol": 1e-9 },
      "yAtTarget": { "value": 1.270670566, "relTol": 1e-5 },
      "slopeAtTarget": { "value": 0.7293294335, "relTol": 1e-5 } } }
]
```
