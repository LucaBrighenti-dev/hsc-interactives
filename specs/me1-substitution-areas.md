---
id: me1-substitution-areas
title: "Integration by substitution areas"
subject: me1
engine: fnplot
setup: substitution
priority: P2
status: draft            # stub → draft → approved (Gate B)
page: /interactives/maths-ext1/substitution-areas.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Mathematics Extension 1","version":"2024","area":"Calculus","focusArea":"Further calculus skills","year":12,"outcomes":[],"verified":false}
---
# Integration by substitution areas

> Backlog summary: Equal areas under f(g(x))g'(x) and under f(u).

## Learning goal
Students see why the substitution u = g(x) works in a definite integral: the area under y = f(g(x))g′(x) from x = a to x = b equals the area under y = f(u) from u = g(a) to u = g(b), even though the two regions look different. Each thin piece keeps its area because du = g′(x)dx, and the change of limits follows from where the ends of the interval land. A decreasing g reverses the u-limits and gives a signed (negative) area.

## What the student sees
Default view at 1920×1080 (projector theme), f(u) = u³, g(x) = x² + 1, 0 ≤ x ≤ 1:

- **Left panel, the x-picture:** y = f(g(x))g′(x) as an orange curve over [a, b] with the region shaded in light orange. Above it, the integrand in KaTeX. The engine finds g′(x) by **symbolic differentiation** of the parsed expression (the fnplot engine's `differentiate`: sums, differences, products, quotients, the chain rule, constant powers and each named function) and prints it with light simplification. For the default it shows g′(x) = 2x and f(g(x))g′(x) = 2x(x² + 1)³; for g(x) = sin x it shows cos x · exp(sin x). Unusual inputs may print in an unsimplified but correct form.
- **Right panel, the u-picture:** y = f(u) as a blue curve over [g(a), g(b)] = [1, 2], with the region shaded in light blue. A small mapping bar between the panels joins x = a to u = g(a) and x = b to u = g(b).
- **Under the panels:** both areas as numbers, which agree ("3.75 = 3.75"), and the working line: let u = x² + 1, du = 2x dx; x = 0 → u = 1, x = 1 → u = 2.
- When g is decreasing, the u-limits run backwards: the right panel shows an arrow from g(a) to g(b) pointing left, and both areas are negative.
- **Matching strips** (requested, see Engine change requests): the x-interval cut into equal strips, each mapped to its u-strip (unequal widths, equal areas), with one strip highlighted on both sides.

## Parameters
Keys match `meta.params` of the fnplot engine on `origin/w1/engine-fnplot` (commit 90a18ca, PR #28, not yet merged).

| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| subF | f(u) | | | | | `u^3` | string; fnplot parser, variable `u`; max length 80 |
| subG | u = g(x) | | | | | `x^2 + 1` | string; fnplot parser, variable `x` |
| subA | Lower limit a | | −5 | 5 | 0.05 | 0 | |
| subB | Upper limit b | | −5 | 5 | 0.05 | 1 | |
| piTicks | Label x in multiples of π | | | | | off | |

Bounds such as π/2, e and √(π/2) are set to their exact values (1.5707963267948966, 2.718281828459045, 1.2533141373155001). They are not multiples of the slider step: the number field shows the exact value and the slider handle sits at the nearest step. The engine never snaps a value to the step.

How the engine computes (static setup): g′ by symbolic differentiation (above); areaX = ∫ from a to b of f(g(x))g′(x) dx and areaU = ∫ from g(a) to g(b) of f(u) du, by Simpson's rule with 4000 intervals on the branch (adaptive integration is requested below). Requested additions: strips, a "Forget g′(x)" toggle, and detection of integrals that do not exist (see Engine change requests).

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | f(u) = u³, g(x) = x² + 1, 0 to 1 | ∫₀¹ 2x(x² + 1)³ dx = ∫₁² u³ du = 15/4 |
| exponential | f(u) = eᵘ, g(x) = sin x, 0 to π/2 | ∫ cos x · e^(sin x) dx = e − 1 |
| logarithm | f(u) = u, g(x) = ln x, 1 to e | ∫ (ln x)/x dx = 1/2 |
| decreasing | f(u) = √u, g(x) = 1 − x², 0 to 1 | The u-limits run from 1 down to 0: the area is −2/3 |
| cosine-square | f(u) = cos u, g(x) = x², 0 to √(π/2) | ∫ 2x cos(x²) dx = sin(π/2) − sin 0 = 1 |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| areaX | ∫ f(g(x)) g′(x) dx | | 4 |
| areaU | ∫ f(u) du | | 4 |
| uLower | u at x = a | | 4 |
| uUpper | u at x = b | | 4 |

## Assumptions shown on stage
- Areas are signed: area below the axis, or with limits reversed, counts as negative
- Both integrals are computed numerically; g′(x) is found exactly
- g should be one-to-one on [a, b] for the strip picture

## Try this (3–5 predict, observe, explain prompts)
1. Predict: the two shaded regions in the default look very different. Which do you think has the larger area? Read the numbers.
2. Observe: change b from 1 to 0.5. What happens to the upper u-limit, and do the areas still agree?
3. Predict: in the exponential preset, what are the new limits for u? Check the mapping bar.
4. Observe: in the decreasing preset, which way do the u-limits run, and what sign do the areas have? What would happen if you swapped them without changing the sign?
5. Explain: the right-hand picture never shows g′(x). Where did the 2x in the left integrand go? (Hint: du = 2x dx; compare how wide a small piece of the x-axis and its image on the u-axis are.)

## Teacher notes outline
- Misconceptions to target: keeping the x-limits after substituting; dropping g′(x) (writing du = dx); thinking the regions must look alike to have equal areas; reversing reversed limits and losing the sign; substituting with a g that is not one-to-one on the interval.
- 10-minute lesson flow: 0–2 min predict which region is larger; 2–4 min reveal equal areas and the working line; 4–6 min why du = g′(x)dx keeps each piece's area (strips, once available); 6–8 min exponential and logarithm presets: students find the new limits first; 8–10 min the decreasing preset and signed area.
- Original HSC-style question idea: (a) Use the substitution u = 1 + √x to find ∫₁⁴ 1/(√x(1 + √x)²) dx. (b) Explain, with reference to the limits of integration, why the substitution u = cos x gives ∫₀^(π/3) sin x cos²x dx = ∫_(1/2)^1 u² du. Full question and worked solution go in the notes file. (Answers: (a) du = dx/(2√x), so the integral is ∫₂³ 2/u² du = 2(1/2 − 1/3) = 1/3; (b) the minus sign from du = −sin x dx swaps the limits 1 → 1/2, giving 7/24.)

## Accessibility notes
- Second cues beyond colour: the x-picture and u-picture are in separate labelled panels; the mapping bar joins matching limits with labelled ticks; areas are printed as numbers; a decreasing g shows a direction arrow on the u-axis.
- Keyboard: expressions are typed in text fields; the limits are sliders with number entry (and draggable on the stage).
- Stage aria-label (from `describe()`), for example: "Two equal areas: under f(g(x)) g′(x) from 0 to 1, and under f(u) from 1 to 2. Both are 3.75."

## Engine change requests
Keys above match the fnplot engine on `origin/w1/engine-fnplot` (90a18ca); the acceptance block uses only its existing keys. Requested changes, with the checks to add once they land (the fenced `pending-acceptance` block below):
1. **Integrals that do not exist.** Detect a pole or other non-finite value inside [a, b] (for f(g(x))g′(x)) or between g(a) and g(b) (for f), by scanning both integrands on the integration grid for non-finite values and using the engine's asymptote detection (`sampleFunction`). When one is found, report areaX and areaU as NaN and show "this integral does not exist on [a, b]" calmly on stage. On that branch, f(u) = 1/u with g(x) = x on [−1, 2] returns −2.33, but the integral diverges. Add a `model.js` unit test for that case (acceptance checks cannot expect NaN). Integrable endpoint behaviour, such as √u at u = 0, must still give a number.
2. **Adaptive integration (optional).** Fixed Simpson with 4000 intervals is accurate to about 1.4e-6 relative on the decreasing preset (the square root has an infinite slope at u = 0). Adaptive Simpson to 1e-10 relative, with a depth cap, would allow a tighter check.
3. **Strips:** params `subStrips` (1 to 20, integer, default 4) and `subStrip` (1 to 20, the highlighted strip; no strip, and NaN outputs, when it exceeds `subStrips`); outputs `stripX` and `stripU`, the integrals over xᵢ₋₁ ≤ x ≤ xᵢ, with xᵢ = a + i(b − a)/N, and over u from g(xᵢ₋₁) to g(xᵢ).
4. **"Forget g′(x)" toggle:** boolean `dropDerivative` (default off). When it is on, the left panel plots f(g(x)) alone and areaX = ∫ f(g(x)) dx, so the areas stop matching. Once this lands, replace prompt 5 with: "Turn on Forget g′(x). Do the areas still match? Why must g′(x) be there?"

## Acceptance
Every number below comes from the formula and hand calculation shown here. Limits are exact evaluations (tolerance 1e-9); areas come from numerical integration (relative tolerance 1e-6, or 1e-5 for the decreasing preset, whose square root slows Simpson's rule near u = 0). The same cases were run through the fnplot model on `origin/w1/engine-fnplot` (90a18ca): the largest relative error was 1.4e-6, for the decreasing preset.

- **Check 1, default.** u = x² + 1: x = 0 → u = **1**, x = 1 → u = **2**. Right: ∫₁² u³ du = [u⁴/4]₁² = (16 − 1)/4 = **3.75**. Left: ∫₀¹ 2x(x² + 1)³ dx = [(x² + 1)⁴/4]₀¹ = **3.75**.
- **Check 2, exponential.** u = sin x: x = 0 → u = **0**, x = π/2 → u = **1**. ∫₀¹ eᵘ du = e − 1 = **1.718281828** on both sides.
- **Check 3, logarithm.** u = ln x: x = 1 → **0**, x = e → **1**. ∫₀¹ u du = **0.5** on both sides.
- **Check 4, decreasing.** u = 1 − x²: x = 0 → u = **1**, x = 1 → u = **0**. ∫₁⁰ √u du = −[⅔u^(3/2)]₀¹ = **−2/3 = −0.6666666667**; the left integral ∫₀¹ √(1 − x²)(−2x) dx is the same.
- **Check 5, cosine of a square.** u = x²: x = 0 → 0, x = √(π/2) → **π/2 = 1.570796327**. ∫₀^(π/2) cos u du = sin(π/2) − sin 0 = **1**.

```acceptance
[
  { "name": "default: u = x^2 + 1, both areas 15/4",
    "params": { "subF": "u^3", "subG": "x^2 + 1", "subA": 0, "subB": 1 },
    "run": "static",
    "expect": {
      "uLower": { "value": 1, "absTol": 1e-9 },
      "uUpper": { "value": 2, "absTol": 1e-9 },
      "areaX": { "value": 3.75, "relTol": 1e-6 },
      "areaU": { "value": 3.75, "relTol": 1e-6 } } },
  { "name": "exponential: u = sin x on [0, pi/2]",
    "params": { "subF": "exp(u)", "subG": "sin(x)", "subA": 0, "subB": 1.5707963267948966 },
    "run": "static",
    "expect": {
      "uLower": { "value": 0, "absTol": 1e-9 },
      "uUpper": { "value": 1, "absTol": 1e-9 },
      "areaX": { "value": 1.718281828, "relTol": 1e-6 },
      "areaU": { "value": 1.718281828, "relTol": 1e-6 } } },
  { "name": "logarithm: u = ln x on [1, e]",
    "params": { "subF": "u", "subG": "ln(x)", "subA": 1, "subB": 2.718281828459045 },
    "run": "static",
    "expect": {
      "uLower": { "value": 0, "absTol": 1e-9 },
      "uUpper": { "value": 1, "absTol": 1e-9 },
      "areaX": { "value": 0.5, "relTol": 1e-6 },
      "areaU": { "value": 0.5, "relTol": 1e-6 } } },
  { "name": "decreasing g reverses the limits: -2/3",
    "params": { "subF": "sqrt(u)", "subG": "1 - x^2", "subA": 0, "subB": 1 },
    "run": "static",
    "expect": {
      "uLower": { "value": 1, "absTol": 1e-9 },
      "uUpper": { "value": 0, "absTol": 1e-9 },
      "areaX": { "value": -0.6666666667, "relTol": 1e-5 },
      "areaU": { "value": -0.6666666667, "relTol": 1e-5 } } },
  { "name": "2x cos(x^2) on [0, sqrt(pi/2)] = 1",
    "params": { "subF": "cos(u)", "subG": "x^2", "subA": 0, "subB": 1.2533141373155001 },
    "run": "static",
    "expect": {
      "uUpper": { "value": 1.570796327, "absTol": 1e-9 },
      "areaX": { "value": 1, "relTol": 1e-6 },
      "areaU": { "value": 1, "relTol": 1e-6 } } }
]
```

Checks to add once engine change requests 3 and 4 land. Working: strip 2 of 4 in the default runs from x = 0.25 to 0.5, so u runs from 1.0625 to 1.25, and both strip areas are (1.25⁴ − 1.0625⁴)/4 = (2.44140625 − 1.274429321)/4 = 0.2917442322. Forgetting g′ in the default: ∫₀¹ (x² + 1)³ dx = ∫₀¹ (x⁶ + 3x⁴ + 3x² + 1) dx = 1/7 + 3/5 + 1 + 1 = 96/35 = 2.742857143, while the u-area stays 3.75.

```pending-acceptance
[
  { "name": "strip 2 of 4 has the same area on both sides", "params": { "subF": "u^3", "subG": "x^2 + 1", "subA": 0, "subB": 1, "subStrips": 4, "subStrip": 2 }, "run": "static",
    "expect": { "stripX": { "value": 0.2917442322, "relTol": 1e-6 }, "stripU": { "value": 0.2917442322, "relTol": 1e-6 } } },
  { "name": "forgetting g'(x) breaks the match", "params": { "subF": "u^3", "subG": "x^2 + 1", "subA": 0, "subB": 1, "dropDerivative": true }, "run": "static",
    "expect": { "areaX": { "value": 2.742857143, "relTol": 1e-6 }, "areaU": { "value": 3.75, "relTol": 1e-6 } } }
]
```
