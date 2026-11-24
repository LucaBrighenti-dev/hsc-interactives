---
id: me1-auxiliary-angle
title: "Auxiliary angle"
subject: me1
engine: fnplot
setup: auxiliary
priority: P1
status: draft            # stub → draft → approved (Gate B)
page: /interactives/maths-ext1/auxiliary-angle.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Mathematics Extension 1","version":"2024","area":"Trigonometric functions","focusArea":"Further trigonometry","year":11,"outcomes":[],"verified":false}
---
# Auxiliary angle

> Backlog summary: a sin x + b cos x collapses into R sin(x + alpha), with the triangle shown.

## Learning goal
Students see that the sum a sin x + b cos x is a single sinusoid of the same period, and can write it as R sin(x ± α) or R cos(x ± α) with R = √(a² + b²) and α read from a right-angled triangle with legs a and b. They use the single-wave form to find the maximum and minimum values and to solve equations of the form a sin x + b cos x = c.

## What the student sees
Default view at 1920×1080 (projector theme), a = 3, b = 4, target form R sin(x + α):

- **Main graph (left, about 70% of the stage):** x from 0° to 360° with ticks every 30° (or every π/6 when radians are chosen), y from −(R + 1) to R + 1. The component waves y = a sin x (`--s2`, dashed, 2.5 px) and y = b cos x (`--s3`, dotted, 2.5 px) are drawn thinly; their sum y = a sin x + b cos x is the thick orange curve (3 px). The single-wave form R sin(x + α) is drawn as a thin dark dashed curve exactly on top of the orange curve, so students see the two coincide. The maximum and minimum points are marked with labels, e.g. "max 5 at x = 36.87°". Above the graph, the identity in KaTeX with the current values: 3 sin x + 4 cos x = 5 sin(x + 53.13°).
- **Triangle panel (right):** a right-angled triangle with horizontal leg a, vertical leg b, hypotenuse R and the angle α marked at the origin, all labelled with values. For the cos forms, the legs swap roles as the expansion requires, and the panel shows the matching pair of equations (R cos α = …, R sin α = …).
- **Optional level line (toggle):** a horizontal line y = c with the solutions of a sin x + b cos x = c in [0°, 360°) marked as hollow rings and listed.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| a | a (coefficient of sin x) | | −10 | 10 | 0.5 | 3 | |
| b | b (coefficient of cos x) | | −10 | 10 | 0.5 | 4 | |
| form | Target form | | | | | sin-plus | enum: `sin-plus` R sin(x + α), `sin-minus` R sin(x − α), `cos-plus` R cos(x + α), `cos-minus` R cos(x − α). Select |
| level | Level c | | −15 | 15 | 0.1 | 2.5 | used when the level line is on |
| showLevel | Solve a sin x + b cos x = c | | | | | off | |
| showComponents | Show a sin x and b cos x | | | | | on | |
| showTriangle | Show the triangle | | | | | on | |
| angleUnit | Angles in | | | | | deg | enum: `deg`, `rad`. Changes axis ticks and labels only; outputs stay in degrees (plus `alphaRad`) |

How α is chosen (R > 0 always, α in (−180°, 180°]):
- `sin-plus`: R sin(x + α) = R cos α sin x + R sin α cos x, so R cos α = a, R sin α = b, α = atan2(b, a).
- `sin-minus`: R sin(x − α) = R cos α sin x − R sin α cos x, so R cos α = a, R sin α = −b, α = atan2(−b, a).
- `cos-plus`: R cos(x + α) = R cos α cos x − R sin α sin x, so R cos α = b, R sin α = −a, α = atan2(−a, b).
- `cos-minus`: R cos(x − α) = R cos α cos x + R sin α sin x, so R cos α = b, R sin α = a, α = atan2(a, b).
When a, b > 0, `sin-plus` and `cos-minus` give an acute α; the other two give a negative α, and the stage says "α is negative: try the other sign".

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | a = 3, b = 4, form sin-plus, level off | The 3-4-5 triangle: R = 5 |
| equal-parts | a = 1, b = 1, form cos-minus | R = √2 and α = 45° |
| difference | a = 2, b = −2, form sin-minus | 2 sin x − 2 cos x = 2√2 sin(x − 45°) |
| solve | a = 3, b = 4, form sin-plus, level on, c = 2.5 | Two solutions in [0°, 360°) |
| radians | a = 1, b = 1, form sin-plus, angleUnit rad | The same idea with π-multiple ticks |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| R | Amplitude R | | 4 |
| alpha | α | ° | 4 |
| alphaRad | α | rad | 4 |
| maxAt | First maximum at x = | ° | 4 |
| minAt | First minimum at x = | ° | 4 |
| solutionCount | Solutions in [0°, 360°) | | integer (`integer: true`) |
| solution1 | First solution | ° | 4 |
| solution2 | Second solution | ° | 4 |

- `maxAt` is the x in [0°, 360°) where a sin x + b cos x = R; it does not depend on the target form: maxAt = (90° − atan2(b, a)) mod 360°. `minAt` = (maxAt + 180°) mod 360°.
- Solutions of a sin x + b cos x = c: with φ = atan2(b, a), solve sin(x + φ) = c/R. If |c| > R there are none. Otherwise let s = sin⁻¹(c/R); the candidates are x = s − φ and x = 180° − s − φ, each reduced mod 360° into [0°, 360°), with a repeat (when c = ±R) counted once. `solution1` < `solution2`; a missing solution is NaN. While the level line is off, `solutionCount`, `solution1` and `solution2` are NaN.
- When a = b = 0, R = 0 and α, maxAt, minAt are NaN.

## Assumptions shown on stage
- x in degrees from 0° to 360° (or radians from 0 to 2π)
- R is taken positive; α lies between −180° and 180°

## Try this (3–5 predict, observe, explain prompts)
1. Predict: before turning anything on, what is the largest value 3 sin x + 4 cos x can take? Is it 7?
2. Observe: switch the target form between R sin(x + α) and R cos(x − α). Which numbers change, and which stay the same?
3. Predict: set a = 2 and b = −2. What happens to the triangle, and which target form gives a positive acute α?
4. Observe: turn on the level line with c = 2.5. Drag c slowly up towards 5. What happens to the two solutions just before and at c = 5?
5. Explain: why must R be the hypotenuse of a triangle with legs a and b?

## Teacher notes outline
- Misconceptions to target: R = a + b (the components peak at different x, so the maximum is less than a + b); α = tan⁻¹(a/b) for every form (the ratio depends on the expansion); α must be in degrees (it may be in radians); "the sum of two waves has double the period"; dropping a solution when x + α moves past 360°.
- 10-minute lesson flow: 0–2 min predict the maximum of 3 sin x + 4 cos x; 2–4 min reveal the orange sum and the single wave on top of it; 4–6 min expand R sin(x + α) on the board and match coefficients with the triangle; 6–8 min switch forms and signs; 8–10 min the solve preset, and the general solution with the range for x + α.
- Original HSC-style question idea: (a) Express √3 cos θ − sin θ in the form R cos(θ + α), where R > 0 and 0 < α < π/2. (b) Hence solve √3 cos θ − sin θ = 1 for 0 ≤ θ ≤ 2π. (c) Find the greatest value of 1/(4 + √3 cos θ − sin θ). Full question and worked solution go in the notes file.

## Accessibility notes
- Second cues beyond colour: a sin x is dashed, b cos x is dotted, the sum is solid and thicker, and the single-wave form is a thin dashed curve on top; every curve has an end label in the plot; maximum, minimum and solution points carry text labels.
- Keyboard: all parameters are panel controls; there is nothing to drag on the stage.
- Stage aria-label (from `describe()`), for example: "Graph of 3 sin x plus 4 cos x for x from 0 to 360 degrees, equal to 5 sin of x plus 53.13 degrees. Maximum 5 at x = 36.87 degrees."

## Engine change requests
The fnplot engine's `meta` was not yet on `origin` when this spec was written (only `parser.js`), so these are **keys to reconcile with engine meta**:
- Params (setup `auxiliary`): `a`, `b`, `form`, `level`, `showLevel`, `showComponents`, `showTriangle`, `angleUnit`.
- Outputs: `R`, `alpha`, `alphaRad`, `maxAt`, `minAt`, `solutionCount`, `solution1`, `solution2`.
- `auxiliary` listed in `meta.staticSetups`.

## Acceptance
Every number below comes from the formula and hand calculation shown here. All are closed forms (tolerance 1e-9 absolute for exact values, 1e-9 relative otherwise).

- **Check 1, default (sin-plus).** a = 3, b = 4: R = √(9 + 16) = **5**. R cos α = 3, R sin α = 4, so α = tan⁻¹(4/3) = **53.13010235°** = **0.9272952180 rad**. Maximum when x + α = 90°: x = 90° − 53.13010235° = **36.86989765°**; minimum when x + α = 270°: x = **216.8698976°**.
- **Check 2, the same expression as R cos(x + α) and R cos(x − α).** R cos(x + α): R cos α = b = 4, R sin α = −a = −3, so α = −tan⁻¹(3/4) = **−36.86989765°**. R cos(x − α): R cos α = 4, R sin α = 3, so α = **+36.86989765°**. (Indeed 5 cos(x − 36.87°) peaks at x = 36.87°, matching check 1.)
- **Check 3, equal-parts (cos-minus).** a = b = 1: R = √2 = **1.414213562**; R cos α = 1, R sin α = 1, so α = **45°**; the maximum √2 is at x = 90° − 45° = **45°**.
- **Check 4, difference (sin-minus).** a = 2, b = −2: R = √8 = 2√2 = **2.828427125**. R cos α = 2 and R sin α = −b = 2, so α = **45°**: 2 sin x − 2 cos x = 2√2 sin(x − 45°). Maximum when x − 45° = 90°: x = **135°**.
- **Check 5, solving 3 sin x + 4 cos x = 2.5.** 5 sin(x + 53.13010235°) = 2.5, so sin(x + α) = 0.5 with 53.13° ≤ x + α < 413.13°. x + α = 150° or 390°, so x = 150° − 53.13010235° = **96.86989765°** and x = 390° − 53.13010235° = **336.8698976°**; **2** solutions. (The value 30° is below 53.13°, so it is not in range.)
- **Check 6, no solutions.** c = 6 > R = 5, so **0** solutions.

```acceptance
[
  { "name": "3 sin x + 4 cos x = 5 sin(x + 53.13 deg)",
    "params": { "a": 3, "b": 4, "form": "sin-plus" },
    "run": "static",
    "expect": {
      "R": { "value": 5, "absTol": 1e-9 },
      "alpha": { "value": 53.13010235, "relTol": 1e-9 },
      "alphaRad": { "value": 0.927295218, "relTol": 1e-9 },
      "maxAt": { "value": 36.86989765, "relTol": 1e-9 },
      "minAt": { "value": 216.8698976, "relTol": 1e-9 } } },
  { "name": "cos-plus gives a negative alpha",
    "params": { "a": 3, "b": 4, "form": "cos-plus" },
    "run": "static",
    "expect": { "alpha": { "value": -36.86989765, "relTol": 1e-9 }, "R": { "value": 5, "absTol": 1e-9 } } },
  { "name": "cos-minus gives the positive alpha",
    "params": { "a": 3, "b": 4, "form": "cos-minus" },
    "run": "static",
    "expect": { "alpha": { "value": 36.86989765, "relTol": 1e-9 }, "maxAt": { "value": 36.86989765, "relTol": 1e-9 } } },
  { "name": "sin x + cos x = sqrt 2 cos(x - 45 deg)",
    "params": { "a": 1, "b": 1, "form": "cos-minus" },
    "run": "static",
    "expect": {
      "R": { "value": 1.414213562, "relTol": 1e-9 },
      "alpha": { "value": 45, "absTol": 1e-9 },
      "maxAt": { "value": 45, "absTol": 1e-9 } } },
  { "name": "2 sin x - 2 cos x = 2 sqrt 2 sin(x - 45 deg)",
    "params": { "a": 2, "b": -2, "form": "sin-minus" },
    "run": "static",
    "expect": {
      "R": { "value": 2.828427125, "relTol": 1e-9 },
      "alpha": { "value": 45, "absTol": 1e-9 },
      "maxAt": { "value": 135, "absTol": 1e-9 } } },
  { "name": "solve 3 sin x + 4 cos x = 2.5 on [0, 360)",
    "params": { "a": 3, "b": 4, "form": "sin-plus", "showLevel": true, "level": 2.5 },
    "run": "static",
    "expect": {
      "solutionCount": { "value": 2, "absTol": 1e-9 },
      "solution1": { "value": 96.86989765, "relTol": 1e-9 },
      "solution2": { "value": 336.8698976, "relTol": 1e-9 } } },
  { "name": "no solutions when c > R",
    "params": { "a": 3, "b": 4, "form": "sin-plus", "showLevel": true, "level": 6 },
    "run": "static",
    "expect": { "solutionCount": { "value": 0, "absTol": 1e-9 } } }
]
```
