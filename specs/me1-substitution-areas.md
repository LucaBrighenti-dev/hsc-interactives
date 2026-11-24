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
Students see why the substitution u = g(x) works in a definite integral: the area under y = f(g(x))g′(x) from x = a to x = b equals the area under y = f(u) from u = g(a) to u = g(b), even though the two regions look different. Matching strips show that each thin piece keeps its area because du = g′(x)dx, and the change of limits follows from where the strips land. A decreasing g reverses the u-limits and gives a signed (negative) area.

## What the student sees
Default view at 1920×1080 (projector theme), f(u) = u³, g(x) = x² + 1, 0 ≤ x ≤ 1, 4 strips, strip 2 highlighted:

- **Left panel, the x-picture:** y = f(g(x))g′(x) (here 2x(x² + 1)³) as an orange curve over [a, b] with the region shaded in light orange, divided into equal strips by thin vertical lines. The highlighted strip is filled with a darker hatch. The integrand's formula is written above in KaTeX: ∫₀¹ 2x(x² + 1)³ dx.
- **Right panel, the u-picture:** y = f(u) (here u³) as a blue curve over [g(a), g(b)] = [1, 2], with the region shaded in light blue. Each x-strip maps to a u-strip of the same area between g(xᵢ) and g(xᵢ₊₁); the strips are unequal widths here, and the highlighted one matches the left. Thin connector lines join each x-strip boundary to its image u = g(x) on a small g-mapping bar between the panels.
- **Under the panels:** both areas as numbers, which agree ("Left area 3.75 = right area 3.75"), and the highlighted strip's areas on both sides. The working line: let u = x² + 1, du = 2x dx; x = 0 → u = 1, x = 1 → u = 2.
- When g is decreasing, the u-limits run backwards: the right panel shows an arrow from g(a) to g(b) pointing left, and both areas are negative.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| outer | f(u) = | | | | | `u^3` | string; fnplot parser, variable `u`; pattern `EXPRESSION_PATTERN`; max length 80 |
| inner | u = g(x) = | | | | | `x^2 + 1` | string; fnplot parser, variable `x` |
| lower | From x = a | | −10 | 10 | 0.05 | 0 | |
| upper | To x = b | | −10 | 10 | 0.05 | 1 | |
| strips | Number of strips | | 1 | 20 | 1 | 4 | integer |
| strip | Highlighted strip | | 1 | 20 | 1 | 2 | integer; no strip is highlighted (and the strip outputs are NaN) when it exceeds the number of strips |
| showStrips | Show strips | | | | | on | |

How the engine computes (static setup):
- g′(x) by a central difference with h = 10⁻⁵ × max(1, |x|) (accurate to about 1e-10 for smooth g).
- leftArea = ∫ from a to b of f(g(x)) g′(x) dx and rightArea = ∫ from g(a) to g(b) of f(u) du, each by adaptive Simpson's rule to a relative tolerance of 1e-10.
- Strip i (from 1) covers xᵢ₋₁ ≤ x ≤ xᵢ with xᵢ = a + i(b − a)/N; stripLeft and stripRight are the same two integrals over that strip and over u from g(xᵢ₋₁) to g(xᵢ).
- If either function is undefined inside the interval, the stage says where and the outputs are NaN. The page warns (but still computes) when g is not one-to-one on [a, b], since strips then fold back over each other.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | f(u) = u³, g(x) = x² + 1, 0 to 1, 4 strips, strip 2 | ∫₀¹ 2x(x² + 1)³ dx = ∫₁² u³ du = 15/4 |
| exponential | f(u) = eᵘ, g(x) = sin x, 0 to π/2, 4 strips | ∫ cos x · e^(sin x) dx = e − 1 |
| logarithm | f(u) = u, g(x) = ln x, 1 to e, 4 strips | ∫ (ln x)/x dx = 1/2 |
| decreasing | f(u) = √u, g(x) = 1 − x², 0 to 1, 4 strips | The u-limits run from 1 down to 0: the area is −2/3 |
| cosine-square | f(u) = cos u, g(x) = x², 0 to √(π/2), 6 strips | ∫ 2x cos(x²) dx = sin(π/2) − sin 0 = 1 |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| leftArea | ∫ f(g(x)) g′(x) dx | | 5 |
| rightArea | ∫ f(u) du | | 5 |
| uLower | u at x = a, g(a) | | 4 |
| uUpper | u at x = b, g(b) | | 4 |
| stripLeft | Highlighted strip: x-area | | 4 |
| stripRight | Highlighted strip: u-area | | 4 |

## Assumptions shown on stage
- Areas are signed: area below the axis, or with limits reversed, counts as negative
- g′(x) and both integrals are computed numerically
- g should be one-to-one on [a, b] for the strip picture

## Try this (3–5 predict, observe, explain prompts)
1. Predict: the two shaded regions in the default look very different. Which do you think has the larger area? Read the numbers.
2. Observe: highlight each strip in turn. Do matching strips have the same width? The same area? Why?
3. Predict: in the exponential preset, what are the new limits for u? Check the working line.
4. Observe: in the decreasing preset, which way do the u-limits run, and what sign do the areas have? What would happen if you swapped them without changing the sign?
5. Explain: why must g′(x) appear in the left integrand for the two areas to match? Try deleting the 2x by choosing a different g.

## Teacher notes outline
- Misconceptions to target: keeping the x-limits after substituting; dropping g′(x) (writing du = dx); thinking the regions must look alike to have equal areas; reversing reversed limits and losing the sign; substituting with a g that is not one-to-one on the interval.
- 10-minute lesson flow: 0–2 min predict which region is larger; 2–4 min reveal equal areas and the working line; 4–6 min strips: same area, different widths (du = g′(x)dx); 6–8 min exponential and logarithm presets: students find the new limits first; 8–10 min the decreasing preset and signed area.
- Original HSC-style question idea: (a) Use the substitution u = 1 + √x to find ∫₁⁴ 1/(√x(1 + √x)²) dx. (b) Explain, with reference to the limits of integration, why the substitution u = cos x gives ∫₀^(π/3) sin x cos²x dx = ∫_(1/2)^1 u² du. Full question and worked solution go in the notes file. (Answers: (a) du = dx/(2√x), so the integral is ∫₂³ 2/u² du = 2(1/2 − 1/3) = 1/3; (b) the minus sign from du = −sin x dx swaps the limits 1 → 1/2, giving 7/24.)

## Accessibility notes
- Second cues beyond colour: the x-picture and u-picture are in separate labelled panels; the highlighted strip is hatched on both sides; connector lines join matching strip edges; areas are printed as numbers; a decreasing g shows a direction arrow on the u-axis.
- Keyboard: all parameters are panel controls; the highlighted strip can also be chosen with the arrow keys when the stage has focus.
- Stage aria-label (from `describe()`), for example: "Integration by substitution with u = x² + 1. The area under 2x(x² + 1)³ from x = 0 to 1 is 3.75, equal to the area under u³ from u = 1 to 2."

## Engine change requests
The fnplot engine's `meta` was not yet on `origin` when this spec was written (only `parser.js`), so these are **keys to reconcile with engine meta**:
- Params (setup `substitution`): `outer`, `inner`, `lower`, `upper`, `strips`, `strip`, `showStrips`. (`outer` and `inner` are used instead of `f` and `g` because `outer` takes the variable `u`.)
- Outputs: `leftArea`, `rightArea`, `uLower`, `uUpper`, `stripLeft`, `stripRight`.
- `substitution` listed in `meta.staticSetups`; two linked plot panels; `outer` compiles with `variables: ['u']`.

## Acceptance
Every number below comes from the formula and hand calculation shown here. Limits are exact evaluations (tolerance 1e-9); areas come from numerical integration (relative tolerance 1e-6).

- **Check 1, default.** u = x² + 1: x = 0 → u = **1**, x = 1 → u = **2**. Right: ∫₁² u³ du = [u⁴/4]₁² = (16 − 1)/4 = **3.75**. Left: ∫₀¹ 2x(x² + 1)³ dx = [(x² + 1)⁴/4]₀¹ = **3.75**.
- **Check 2, strip 2 of 4.** x from 0.25 to 0.5 maps to u from 1 + 0.0625 = 1.0625 to 1 + 0.25 = 1.25. Both strip areas: (1.25⁴ − 1.0625⁴)/4 = (2.44140625 − 1.274429321)/4 = **0.2917442322**.
- **Check 3, exponential.** u = sin x: x = 0 → u = **0**, x = π/2 → u = **1**. ∫₀¹ eᵘ du = e − 1 = **1.718281828** on both sides.
- **Check 4, logarithm.** u = ln x: x = 1 → **0**, x = e → **1**. ∫₀¹ u du = **0.5** on both sides.
- **Check 5, decreasing.** u = 1 − x²: x = 0 → u = **1**, x = 1 → u = **0**. ∫₁⁰ √u du = −[⅔u^(3/2)]₀¹ = **−2/3 = −0.6666666667**. Left: ∫₀¹ √(1 − x²)(−2x) dx, the same value.
- **Check 6, cosine of a square.** u = x²: x = 0 → 0, x = √(π/2) → **π/2 = 1.570796327**. ∫₀^(π/2) cos u du = sin(π/2) − sin 0 = **1**.

```acceptance
[
  { "name": "default: u = x^2 + 1, both areas 15/4",
    "params": { "outer": "u^3", "inner": "x^2 + 1", "lower": 0, "upper": 1, "strips": 4, "strip": 2 },
    "run": "static",
    "expect": {
      "uLower": { "value": 1, "absTol": 1e-9 },
      "uUpper": { "value": 2, "absTol": 1e-9 },
      "leftArea": { "value": 3.75, "relTol": 1e-6 },
      "rightArea": { "value": 3.75, "relTol": 1e-6 },
      "stripLeft": { "value": 0.2917442322, "relTol": 1e-6 },
      "stripRight": { "value": 0.2917442322, "relTol": 1e-6 } } },
  { "name": "exponential: u = sin x on [0, pi/2]",
    "params": { "outer": "exp(u)", "inner": "sin(x)", "lower": 0, "upper": 1.5707963267948966, "strips": 4, "strip": 1 },
    "run": "static",
    "expect": {
      "uLower": { "value": 0, "absTol": 1e-9 },
      "uUpper": { "value": 1, "absTol": 1e-9 },
      "leftArea": { "value": 1.718281828, "relTol": 1e-6 },
      "rightArea": { "value": 1.718281828, "relTol": 1e-6 } } },
  { "name": "logarithm: u = ln x on [1, e]",
    "params": { "outer": "u", "inner": "ln(x)", "lower": 1, "upper": 2.718281828459045, "strips": 4, "strip": 1 },
    "run": "static",
    "expect": {
      "uLower": { "value": 0, "absTol": 1e-9 },
      "uUpper": { "value": 1, "absTol": 1e-9 },
      "leftArea": { "value": 0.5, "relTol": 1e-6 },
      "rightArea": { "value": 0.5, "relTol": 1e-6 } } },
  { "name": "decreasing g reverses the limits: -2/3",
    "params": { "outer": "sqrt(u)", "inner": "1 - x^2", "lower": 0, "upper": 1, "strips": 4, "strip": 1 },
    "run": "static",
    "expect": {
      "uLower": { "value": 1, "absTol": 1e-9 },
      "uUpper": { "value": 0, "absTol": 1e-9 },
      "leftArea": { "value": -0.6666666667, "relTol": 1e-6 },
      "rightArea": { "value": -0.6666666667, "relTol": 1e-6 } } },
  { "name": "2x cos(x^2) on [0, sqrt(pi/2)] = 1",
    "params": { "outer": "cos(u)", "inner": "x^2", "lower": 0, "upper": 1.2533141373155001, "strips": 6, "strip": 1 },
    "run": "static",
    "expect": {
      "uUpper": { "value": 1.570796327, "absTol": 1e-9 },
      "leftArea": { "value": 1, "relTol": 1e-6 },
      "rightArea": { "value": 1, "relTol": 1e-6 } } }
]
```
