---
id: me1-inverse-trig
title: "Inverse trig builder"
subject: me1
engine: fnplot
setup: inverse-trig
priority: P2
status: draft            # stub → draft → approved (Gate B)
page: /interactives/maths-ext1/inverse-trig.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Mathematics Extension 1","version":"2024","area":"Trigonometric functions","focusArea":"Inverse trigonometric functions","year":12,"outcomes":[],"verified":false}
---
# Inverse trig builder

> Backlog summary: Restrict sin, cos and tan, invert them, and see their derivatives.

## Learning goal
Students build y = sin⁻¹(x/a), cos⁻¹(x/a) and tan⁻¹(x/a) from the graphs of y = a sin x, a cos x and a tan x: restrict to the standard one-to-one branch, reflect in y = x, and read off the domain and range. They then see the derivatives 1/√(a² − x²), −1/√(a² − x²) and a/(a² + x²) as the gradients of those curves, and check identities such as sin⁻¹x + cos⁻¹x = π/2 and sin⁻¹(−x) = −sin⁻¹x.

## What the student sees
Default view at 1920×1080 (projector theme), sin with a = 1, build stage 4 (all layers), equal scales, window −4 ≤ x ≤ 4, −4 ≤ y ≤ 4:

- **Build stages** (a stepper, each adding a layer):
  1. y = a sin x over the whole window as a thin grey curve.
  2. The standard branch highlighted in thick orange (−π/2 ≤ x ≤ π/2 for sin and tan, 0 ≤ x ≤ π for cos), with the rest dashed and a "one-to-one here" label.
  3. The mirror line y = x (dash-dot) and the reflected branch y = sin⁻¹(x/a) in thick blue (`--s2`), with endpoint dots and its domain and range written beside it, e.g. "domain −1 ≤ x ≤ 1, range −π/2 ≤ y ≤ π/2".
  4. The derivative y = 1/√(a² − x²) as a green dotted curve (`--s3`) on the same axes, and the tangent to the blue curve at the probe point.
- **Probe:** a draggable point on the blue curve at x = xProbe, with labels "sin⁻¹(0.5) = π/6 = 0.5236" and "gradient 1.155", and the tangent line through it.
- **Identity strip (toggle):** for sin and cos, the two angles sin⁻¹(x/a) and cos⁻¹(x/a) drawn as stacked bars that always add to π/2; for tan, tan⁻¹(x/a) + tan⁻¹(a/x), which is π/2 for x > 0 and −π/2 for x < 0.
- y-axis ticks in multiples of π/4 (labelled π/4, π/2, …).

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| fn | Function | | | | | sin | enum: `sin`, `cos`, `tan`. Segmented |
| divisor | a (in x/a) | | 0.5 | 5 | 0.5 | 1 | named `divisor` so it does not clash with the auxiliary setup's `a` |
| build | Build stage | | 1 | 4 | 1 | 4 | integer; 1 graph, 2 restrict, 3 invert, 4 derivative |
| xProbe | Probe x | | −10 | 10 | 0.05 | 0.5 | |
| showIdentity | Identity strip | | | | | off | |
| xMin | Window x from | | −20 | 20 | 0.5 | −4 | equal scales on both axes |
| xMax | Window x to | | −20 | 20 | 0.5 | 4 | |
| yMin | Window y from | | −20 | 20 | 0.5 | −4 | |
| yMax | Window y to | | −20 | 20 | 0.5 | 4 | |

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | sin, a = 1, build 4, probe 0.5 | sin⁻¹(1/2) = π/6, gradient 2/√3 |
| restrict-first | sin, a = 1, build 1, probe 0.5 | Start from the whole sine curve and step through the build |
| arccos | cos, a = 2, build 4, probe −1 | cos⁻¹ of a negative value lies between π/2 and π; the gradient is negative |
| arctan | tan, a = 2, build 4, probe 2, window x −8 to 8, y −3 to 3 | Horizontal asymptotes y = ±π/2 and gradient a/(a² + x²) |
| complementary | sin, a = 1, build 3, probe 0.6, identity strip on | sin⁻¹x + cos⁻¹x = π/2 |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| value | Inverse value at the probe | rad | 4 |
| valueDeg | Inverse value at the probe | ° | 4 |
| gradient | Gradient at the probe | | 4 |
| domainMin | Domain from | | 4 |
| domainMax | Domain to | | 4 |
| rangeMin | Range from | rad | 4 |
| rangeMax | Range to | rad | 4 |
| identitySum | Identity sum | rad | 4 |

- value = sin⁻¹(xProbe/a), cos⁻¹(xProbe/a) or tan⁻¹(xProbe/a); NaN when |xProbe| > a for sin and cos (outside the domain).
- gradient = 1/√(a² − x²) (sin), −1/√(a² − x²) (cos) or a/(a² + x²) (tan), at x = xProbe; NaN outside the domain and ±∞ at x = ±a for sin and cos.
- Domain: [−a, a] for sin and cos; all real x for tan (domainMin = −∞, domainMax = +∞). Range: [−π/2, π/2] for sin, [0, π] for cos, and (−π/2, π/2) for tan (the endpoints are asymptotes and are not attained).
- identitySum = sin⁻¹(x/a) + cos⁻¹(x/a) for sin and cos; tan⁻¹(x/a) + tan⁻¹(a/x) for tan (NaN at x = 0).

## Assumptions shown on stage
- Angles in radians (needed for the derivatives)
- Standard branches: sin and tan on [−π/2, π/2], cos on [0, π]
- Equal scales on both axes, so the reflection in y = x is true to shape

## Try this (3–5 predict, observe, explain prompts)
1. Predict: why can't we invert y = sin x on its whole domain? Step from build stage 1 to 2 to see the branch that is used.
2. Observe: at build stage 3, compare the domain and range of sin x on its branch with the domain and range of sin⁻¹x. What has happened?
3. Predict: in the arccos preset, is cos⁻¹(−1/2) negative? Check the value, then explain using the graph.
4. Observe: drag the probe towards x = a on the sin⁻¹ curve. What happens to the gradient, and what does the tangent look like?
5. Explain: in the complementary preset, why do the two bars always add to π/2? Use a right-angled triangle with hypotenuse 1.

## Teacher notes outline
- Misconceptions to target: sin⁻¹x means 1/sin x; the range of cos⁻¹ is [−π/2, π/2] (it is [0, π]); cos⁻¹(−x) = −cos⁻¹x (it is π − cos⁻¹x); tan⁻¹ has vertical asymptotes (they are horizontal: y = ±π/2); forgetting the a in d/dx tan⁻¹(x/a) = a/(a² + x²); working in degrees before differentiating.
- 10-minute lesson flow: 0–3 min build sin⁻¹ in four stages; 3–5 min domain and range swap; 5–7 min the arccos preset and cos⁻¹(−x) = π − cos⁻¹x; 7–9 min derivative layer and the probe near the endpoints; 9–10 min the complementary identity.
- Original HSC-style question idea: (a) Sketch y = 2cos⁻¹(x/3), stating its domain and range. (b) Find the gradient of the curve where x = 3/2. (c) Find the equation of the tangent to the curve where it crosses the y-axis. Full question and worked solution go in the notes file. (Domain −3 ≤ x ≤ 3, range 0 ≤ y ≤ 2π; dy/dx = −2/√(9 − x²), so the gradient at x = 3/2 is −2/√(27/4) = −4/(3√3); at x = 0, y = π and the tangent is y = π − 2x/3.)

## Accessibility notes
- Second cues beyond colour: the trig curve is thin grey (solid on the branch, dashed elsewhere), the inverse thick blue with endpoint dots, the derivative dotted green; each curve has an end label; the mirror line is dash-dot; asymptotes are dashed and labelled y = ±π/2.
- Keyboard: build stage is a stepper; the probe is a panel slider as well as a draggable point (arrow keys move it by 0.05).
- Stage aria-label (from `describe()`), for example: "Graph of y = inverse sine of x for x from −1 to 1, range −π/2 to π/2, built by reflecting the restricted sine curve in y = x. At x = 0.5 the value is π/6, 0.524, and the gradient is 1.155."

## Engine change requests
The fnplot engine's `meta` was not yet on `origin` when this spec was written (only `parser.js`), so these are **keys to reconcile with engine meta**:
- Params (setup `inverse-trig`): `fn`, `divisor`, `build`, `xProbe`, `showIdentity`, `xMin`, `xMax`, `yMin`, `yMax`.
- Outputs: `value`, `valueDeg`, `gradient`, `domainMin`, `domainMax`, `rangeMin`, `rangeMax`, `identitySum`.
- `inverse-trig` listed in `meta.staticSetups`; π-multiple ticks on the y-axis.

## Acceptance
Every number below comes from the formula and hand calculation shown here. All are closed forms (tolerance 1e-9).

- **Check 1, default.** sin⁻¹(0.5) = **π/6 = 0.5235987756** = **30°**. Gradient 1/√(1 − 0.25) = 1/√0.75 = 2/√3 = **1.154700538**. Domain [**−1**, **1**]; range [**−π/2**, **π/2**] = [−1.570796327, 1.570796327].
- **Check 2, arccos with a = 2.** cos⁻¹(−1/2) = π − cos⁻¹(1/2) = π − π/3 = **2π/3 = 2.094395102** = **120°**. Gradient −1/√(4 − 1) = −1/√3 = **−0.5773502692**. Domain [**−2**, **2**]; range [**0**, **π = 3.141592654**].
- **Check 3, arctan with a = 2.** tan⁻¹(2/2) = tan⁻¹1 = **π/4 = 0.7853981634** = **45°**. Gradient a/(a² + x²) = 2/(4 + 4) = **0.25**. Range (−π/2, π/2): rangeMax = **1.570796327**.
- **Check 4, the end of the sin⁻¹ domain with a = 3.** sin⁻¹(−3/3) = sin⁻¹(−1) = **−π/2 = −1.570796327** = **−90°**; domain [**−3**, **3**]. (The gradient here is infinite, so it is not checked.)
- **Check 5, complementary angles.** sin⁻¹(0.6) + cos⁻¹(0.6) = **π/2 = 1.570796327** (sin⁻¹0.6 = 0.6435011088, cos⁻¹0.6 = 0.9272952180).
- **Check 6, the arctan identity for negative x.** a = 1, x = −2: tan⁻¹(−2) + tan⁻¹(−1/2) = −1.107148718 − 0.463647609 = **−π/2 = −1.570796327**.
- **Check 7, gradient with a ≠ 1.** sin, a = 4, x = 2: sin⁻¹(1/2) = **0.5235987756**; gradient 1/√(16 − 4) = 1/√12 = **0.2886751346**.

```acceptance
[
  { "name": "default: inverse sine of 0.5",
    "params": { "fn": "sin", "divisor": 1, "xProbe": 0.5 },
    "run": "static",
    "expect": {
      "value": { "value": 0.5235987756, "absTol": 1e-9 },
      "valueDeg": { "value": 30, "absTol": 1e-9 },
      "gradient": { "value": 1.154700538, "absTol": 1e-9 },
      "domainMin": { "value": -1, "absTol": 1e-9 },
      "domainMax": { "value": 1, "absTol": 1e-9 },
      "rangeMin": { "value": -1.570796327, "absTol": 1e-9 },
      "rangeMax": { "value": 1.570796327, "absTol": 1e-9 } } },
  { "name": "inverse cosine of -1/2 with a = 2",
    "params": { "fn": "cos", "divisor": 2, "xProbe": -1 },
    "run": "static",
    "expect": {
      "value": { "value": 2.094395102, "absTol": 1e-9 },
      "valueDeg": { "value": 120, "absTol": 1e-9 },
      "gradient": { "value": -0.5773502692, "absTol": 1e-9 },
      "domainMin": { "value": -2, "absTol": 1e-9 },
      "domainMax": { "value": 2, "absTol": 1e-9 },
      "rangeMin": { "value": 0, "absTol": 1e-9 },
      "rangeMax": { "value": 3.141592654, "absTol": 1e-9 } } },
  { "name": "inverse tangent of 2/2 with a = 2",
    "params": { "fn": "tan", "divisor": 2, "xProbe": 2 },
    "run": "static",
    "expect": {
      "value": { "value": 0.7853981634, "absTol": 1e-9 },
      "valueDeg": { "value": 45, "absTol": 1e-9 },
      "gradient": { "value": 0.25, "absTol": 1e-9 },
      "rangeMax": { "value": 1.570796327, "absTol": 1e-9 } } },
  { "name": "end of the domain: inverse sine of -1",
    "params": { "fn": "sin", "divisor": 3, "xProbe": -3 },
    "run": "static",
    "expect": {
      "value": { "value": -1.570796327, "absTol": 1e-9 },
      "valueDeg": { "value": -90, "absTol": 1e-9 },
      "domainMin": { "value": -3, "absTol": 1e-9 },
      "domainMax": { "value": 3, "absTol": 1e-9 } } },
  { "name": "sin^-1 x + cos^-1 x = pi/2",
    "params": { "fn": "sin", "divisor": 1, "xProbe": 0.6, "showIdentity": true },
    "run": "static",
    "expect": { "identitySum": { "value": 1.570796327, "absTol": 1e-9 }, "value": { "value": 0.6435011088, "absTol": 1e-9 } } },
  { "name": "tan^-1 x + tan^-1(1/x) = -pi/2 for x < 0",
    "params": { "fn": "tan", "divisor": 1, "xProbe": -2, "showIdentity": true },
    "run": "static",
    "expect": { "identitySum": { "value": -1.570796327, "absTol": 1e-9 }, "value": { "value": -1.107148718, "absTol": 1e-9 } } },
  { "name": "gradient of inverse sine of x/4 at x = 2",
    "params": { "fn": "sin", "divisor": 4, "xProbe": 2 },
    "run": "static",
    "expect": { "value": { "value": 0.5235987756, "absTol": 1e-9 }, "gradient": { "value": 0.2886751346, "absTol": 1e-9 } } }
]
```
