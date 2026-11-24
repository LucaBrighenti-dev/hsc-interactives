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
Students build y = sin⁻¹x, cos⁻¹x and tan⁻¹x from the graphs of y = sin x, cos x and tan x: restrict each to its standard one-to-one branch, reflect it in y = x, and read off the domain and range. They then see the derivatives 1/√(1 − x²), −1/√(1 − x²) and 1/(1 + x²) as the gradients of those curves. At a point and its mirror image the two gradients are reciprocals. They also check identities such as sin⁻¹x + cos⁻¹x = π/2 and sin⁻¹(−x) = −sin⁻¹x.

## What the student sees
Default view at 1920×1080 (projector theme), sin, probe at x = 0.5, equal scales on both axes (the stage is 16:9, so the x-range is wider than the y-range):

- **The trig curve:** y = sin x as a thin grey curve over the whole view when "Show the unrestricted graph" is on, with the standard branch in thick orange: sin on −π/2 ≤ x ≤ π/2, cos on 0 ≤ x ≤ π, and tan on the open interval −π/2 < x < π/2 (tan is undefined at ±π/2, which are dashed asymptotes). A label says "one-to-one here".
- **The mirror and the inverse:** the line y = x (dash-dot) and the reflected branch y = sin⁻¹x in thick blue (`--s2`), with endpoint dots for sin⁻¹ and cos⁻¹, and the horizontal asymptotes y = ±π/2 (dashed) for tan⁻¹. Beside it, its domain and range in KaTeX: sin⁻¹: domain −1 ≤ x ≤ 1, range −π/2 ≤ y ≤ π/2; cos⁻¹: domain −1 ≤ x ≤ 1, range 0 ≤ y ≤ π; tan⁻¹: all real x, range −π/2 < y < π/2 (open: the asymptotes are never reached).
- **The derivative** (toggle "Show the derivative"): y = 1/√(1 − x²) (or −1/√(1 − x²), or 1/(1 + x²)) as a green dotted curve (`--s3`), with its formula in KaTeX.
- **Probe:** a draggable point on the blue curve at x = x₀, with the tangent there, and its mirror point on the orange branch with that tangent too. Labels give the value, as an exact multiple of π when value/π is within 1e-9 of p/q with q ≤ 12 (for example "sin⁻¹(1/2) = π/6"), and both gradients, for example "gradient 1.155 here, 0.866 at the mirror point".
- y-axis ticks in multiples of π/4.

## Parameters
Keys match `meta.params` of the fnplot engine on `origin/w1/engine-fnplot` (commit 90a18ca, PR #28, not yet merged).

| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| trigFn | Function | | | | | sin | enum: `sin`, `cos`, `tan` |
| trigProbe | Point x₀ | | −3 | 3 | 0.01 | 0.5 | for sin⁻¹ and cos⁻¹ the engine holds the probe just inside the domain, at most 0.999999 in size, where the gradient is about ±707 |
| showDerivative | Show the derivative | | | | | on | |
| showFull | Show the unrestricted graph | | | | | on | turn it off and on to "build" the inverse: whole curve, then the branch only |

Requested additions (see Engine change requests): `trigScale` (a in sin⁻¹(x/a), cos⁻¹(x/a), tan⁻¹(x/a); 0.5 to 5, step 0.5, default 1) and `showIdentity` (the identity strip).

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | sin, x₀ = 0.5, derivative on, unrestricted graph on | sin⁻¹(1/2) = π/6, gradient 2/√3 |
| branch-only | sin, x₀ = 0.5, derivative off, unrestricted graph off | Just the restricted branch and its reflection |
| arccos | cos, x₀ = −0.5 | cos⁻¹ of a negative value lies between π/2 and π; the gradient is negative |
| arctan | tan, x₀ = 1 | Horizontal asymptotes y = ±π/2 and gradient 1/(1 + x²) |
| reciprocal-gradients | tan, x₀ = 2 | Gradients 1/5 and 5 at a point and its mirror image |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| inverseValue | Inverse at x₀ | rad | 4 |
| inverseSlope | Slope of the inverse at x₀ | | 4 |
| fSlope | Slope at the mirror point | | 4 |

- inverseValue = sin⁻¹x₀, cos⁻¹x₀ or tan⁻¹x₀.
- inverseSlope = 1/√(1 − x₀²) (sin), −1/√(1 − x₀²) (cos) or 1/(1 + x₀²) (tan).
- fSlope is the gradient of the original function at the mirror point (y₀, x₀), where y₀ = inverseValue: cos y₀ (sin), −sin y₀ (cos) or sec²y₀ (tan). It always equals 1/inverseSlope.

## Assumptions shown on stage
- Angles in radians (needed for the derivatives)
- Standard branches: sin on [−π/2, π/2], cos on [0, π], tan on (−π/2, π/2)
- Equal scales on both axes, so the reflection in y = x is true to shape

## Try this (3–5 predict, observe, explain prompts)
1. Predict: why can't we invert y = sin x on its whole domain? Turn the unrestricted graph off and on to see the branch that is used.
2. Observe: compare the domain and range of sin x on its branch with the domain and range of sin⁻¹x. What has happened?
3. Predict: in the arccos preset, is cos⁻¹(−1/2) negative? Check the value, then explain using the graph.
4. Observe: drag the probe towards x = 1 on the sin⁻¹ curve. What happens to the gradient, and to the gradient at the mirror point?
5. Explain: in the reciprocal-gradients preset the two gradients are 1/5 and 5. Why must the gradients at a point and its mirror image in y = x be reciprocals?

## Teacher notes outline
- Misconceptions to target: sin⁻¹x means 1/sin x; the range of cos⁻¹ is [−π/2, π/2] (it is [0, π]); cos⁻¹(−x) = −cos⁻¹x (it is π − cos⁻¹x); tan⁻¹ has vertical asymptotes (they are horizontal: y = ±π/2, never reached); forgetting the a in d/dx tan⁻¹(x/a) = a/(a² + x²); working in degrees before differentiating.
- 10-minute lesson flow: 0–3 min build sin⁻¹ (unrestricted graph on, then off, then the reflection); 3–5 min domain and range swap; 5–7 min the arccos preset and cos⁻¹(−x) = π − cos⁻¹x; 7–9 min the derivative and reciprocal gradients; 9–10 min the identity sin⁻¹x + cos⁻¹x = π/2 from a right-angled triangle.
- Original HSC-style question idea: (a) Sketch y = 2cos⁻¹(x/3), stating its domain and range. (b) Find the gradient of the curve where x = 3/2. (c) Find the equation of the tangent to the curve where it crosses the y-axis. Full question and worked solution go in the notes file. (Domain −3 ≤ x ≤ 3, range 0 ≤ y ≤ 2π; dy/dx = −2/√(9 − x²), so the gradient at x = 3/2 is −2/√(27/4) = −4/(3√3); at x = 0, y = π and the tangent is y = π − 2x/3.)

## Accessibility notes
- Second cues beyond colour: the trig curve is thin grey (thick on the branch), the inverse thick blue with endpoint dots, the derivative dotted green; each curve has an end label; the mirror line is dash-dot; asymptotes are dashed and labelled y = ±π/2.
- Keyboard: the probe is a panel slider as well as a draggable point (arrow keys move it by 0.01); the function is a select and the layers are toggles.
- Stage aria-label (from `describe()`), for example: "Inverse sin built by restricting sin x and reflecting it in y = x. At x = 0.5 the inverse is 0.5236 and its slope is 1.155."

## Engine change requests
Keys above match the fnplot engine on `origin/w1/engine-fnplot` (90a18ca); the acceptance block uses only its existing keys. Requested additions, with the checks to add once they land (the fenced `pending-acceptance` block below):
1. **`trigScale`** (a, 0.5 to 5, step 0.5, default 1): plot y = sin⁻¹(x/a), cos⁻¹(x/a) or tan⁻¹(x/a), as the inverse of y = a sin x and so on, with inverseSlope = 1/√(a² − x²), −1/√(a² − x²) or a/(a² + x²). The trigProbe range would then need to reach ±5.
2. **`showIdentity`** and output **`identitySum`**: sin⁻¹(x/a) + cos⁻¹(x/a) for sin and cos (always π/2); tan⁻¹(x/a) + tan⁻¹(a/x) for tan (π/2 for x > 0, −π/2 for x < 0, NaN at 0). The strip draws the two angles as signed bars from 0, so a negative sin⁻¹ bar extends below the axis and the cos⁻¹ bar reaches past π/2.
3. Optional: output **`inverseValueDeg`** (the same value in degrees, unit °).

## Acceptance
Every number below comes from the formula and hand calculation shown here. All are closed forms (tolerance 1e-9). The same cases were run through the fnplot model on `origin/w1/engine-fnplot` (90a18ca) and agree.

- **Check 1, default.** sin⁻¹(0.5) = **π/6 = 0.5235987756**. Gradient 1/√(1 − 0.25) = 2/√3 = **1.154700538**. At the mirror point (π/6, 0.5) the gradient of sin x is cos(π/6) = √3/2 = **0.8660254038** = 1/1.154700538.
- **Check 2, arccos.** cos⁻¹(−1/2) = π − π/3 = **2π/3 = 2.094395102**. Gradient −1/√(1 − 0.25) = **−1.154700538**; the gradient of cos x at 2π/3 is −sin(2π/3) = **−0.8660254038**.
- **Check 3, arctan.** tan⁻¹1 = **π/4 = 0.7853981634**; gradient 1/(1 + 1) = **0.5**; the gradient of tan x at π/4 is sec²(π/4) = **2**.
- **Check 4, reciprocal gradients.** tan⁻¹2 = **1.107148718**; gradient 1/(1 + 4) = **0.2**; at the mirror point, sec²y = 1 + tan²y = 1 + 4 = **5**.
- **Check 5, a 3-4-5 triangle.** sin⁻¹(0.6) = **0.6435011088**; gradient 1/√(1 − 0.36) = 1/0.8 = **1.25**; mirror gradient cos(sin⁻¹0.6) = **0.8**. And cos⁻¹(0.6) = **0.927295218** with gradient **−1.25**: the two angles add to 0.6435011088 + 0.927295218 = 1.570796327 = π/2.

```acceptance
[
  { "name": "default: inverse sine of 0.5",
    "params": { "trigFn": "sin", "trigProbe": 0.5 },
    "run": "static",
    "expect": {
      "inverseValue": { "value": 0.5235987756, "absTol": 1e-9 },
      "inverseSlope": { "value": 1.154700538, "absTol": 1e-9 },
      "fSlope": { "value": 0.8660254038, "absTol": 1e-9 } } },
  { "name": "inverse cosine of -0.5",
    "params": { "trigFn": "cos", "trigProbe": -0.5 },
    "run": "static",
    "expect": {
      "inverseValue": { "value": 2.094395102, "absTol": 1e-9 },
      "inverseSlope": { "value": -1.154700538, "absTol": 1e-9 },
      "fSlope": { "value": -0.8660254038, "absTol": 1e-9 } } },
  { "name": "inverse tangent of 1",
    "params": { "trigFn": "tan", "trigProbe": 1 },
    "run": "static",
    "expect": {
      "inverseValue": { "value": 0.7853981634, "absTol": 1e-9 },
      "inverseSlope": { "value": 0.5, "absTol": 1e-9 },
      "fSlope": { "value": 2, "absTol": 1e-9 } } },
  { "name": "reciprocal gradients at x = 2",
    "params": { "trigFn": "tan", "trigProbe": 2 },
    "run": "static",
    "expect": {
      "inverseValue": { "value": 1.107148718, "absTol": 1e-9 },
      "inverseSlope": { "value": 0.2, "absTol": 1e-9 },
      "fSlope": { "value": 5, "absTol": 1e-9 } } },
  { "name": "inverse sine of 0.6",
    "params": { "trigFn": "sin", "trigProbe": 0.6 },
    "run": "static",
    "expect": {
      "inverseValue": { "value": 0.6435011088, "absTol": 1e-9 },
      "inverseSlope": { "value": 1.25, "absTol": 1e-9 },
      "fSlope": { "value": 0.8, "absTol": 1e-9 } } },
  { "name": "inverse cosine of 0.6",
    "params": { "trigFn": "cos", "trigProbe": 0.6 },
    "run": "static",
    "expect": {
      "inverseValue": { "value": 0.927295218, "absTol": 1e-9 },
      "inverseSlope": { "value": -1.25, "absTol": 1e-9 } } }
]
```

Checks to add once engine change requests 1 and 2 land. Working: cos with a = 2 at x = −1: cos⁻¹(−1/2) = 2π/3, gradient −1/√(4 − 1) = −1/√3 = −0.5773502692. tan with a = 2 at x = 2: tan⁻¹1 = π/4, gradient 2/(4 + 4) = 0.25. sin with a = 4 at x = 2: π/6, gradient 1/√12 = 0.2886751346. Identity at x = 0.6 (sin, a = 1): π/2. tan at x = −2 (a = 1): tan⁻¹(−2) + tan⁻¹(−1/2) = −1.107148718 − 0.463647609 = −π/2.

```pending-acceptance
[
  { "name": "cos with a = 2 at x = -1", "params": { "trigFn": "cos", "trigScale": 2, "trigProbe": -1 }, "run": "static",
    "expect": { "inverseValue": { "value": 2.094395102, "absTol": 1e-9 }, "inverseSlope": { "value": -0.5773502692, "absTol": 1e-9 } } },
  { "name": "tan with a = 2 at x = 2", "params": { "trigFn": "tan", "trigScale": 2, "trigProbe": 2 }, "run": "static",
    "expect": { "inverseValue": { "value": 0.7853981634, "absTol": 1e-9 }, "inverseSlope": { "value": 0.25, "absTol": 1e-9 } } },
  { "name": "sin with a = 4 at x = 2", "params": { "trigFn": "sin", "trigScale": 4, "trigProbe": 2 }, "run": "static",
    "expect": { "inverseValue": { "value": 0.5235987756, "absTol": 1e-9 }, "inverseSlope": { "value": 0.2886751346, "absTol": 1e-9 } } },
  { "name": "sin^-1 x + cos^-1 x = pi/2", "params": { "trigFn": "sin", "trigScale": 1, "trigProbe": 0.6, "showIdentity": true }, "run": "static",
    "expect": { "identitySum": { "value": 1.570796327, "absTol": 1e-9 } } },
  { "name": "tan^-1 x + tan^-1(1/x) = -pi/2 for x < 0", "params": { "trigFn": "tan", "trigScale": 1, "trigProbe": -2, "showIdentity": true }, "run": "static",
    "expect": { "identitySum": { "value": -1.570796327, "absTol": 1e-9 } } }
]
```
