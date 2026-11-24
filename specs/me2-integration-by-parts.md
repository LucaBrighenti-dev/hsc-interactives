---
id: me2-integration-by-parts
title: "Integration by parts"
subject: me2
engine: fnplot
setup: by-parts
priority: P2
status: draft            # stub → draft → approved (Gate B)
page: /interactives/maths-ext2/integration-by-parts.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Mathematics Extension 2","version":"2024","area":"Calculus","focusArea":"Further integration","year":12,"outcomes":[],"verified":false}
---
# Integration by parts

> Backlog summary: Integration by parts as an area picture; reduction formula stepper.

## Learning goal
Students see integration by parts, ∫ u dv = [uv] − ∫ v du, as a statement about areas: when the curve (u(x), v(x)) is drawn for a ≤ x ≤ b, the two regions it cuts off (one against each axis) have signed areas ∫ u dv and ∫ v du, and together they make the difference of two rectangles, u(b)v(b) − u(a)v(a). They then use integration by parts to derive a reduction formula and apply it step by step to evaluate a definite integral for a particular n.

## What the student sees
**Area picture (default).** The stage at 1920×1080 has the plot on the left (about 64% of the width) and a working column on the right.

- **The (u, v) plane:** u is horizontal and v is vertical, with equal scales, tick labels at least 18 px and axis titles "u" and "v". The window fits the curve and the origin. The curve (u(x), v(x)) for a ≤ x ≤ b is a thick graphite line, with its endpoints marked and labelled "x = a" and "x = b".
- **The two regions:** the region between the curve and the v-axis is tinted orange and labelled "∫ u dv" inside it. The region between the curve and the u-axis is tinted in the second series colour and labelled "∫ v du".
- **The rectangles:** the big rectangle from (0, 0) to (u(b), v(b)) has a dashed outline, and the small rectangle from (0, 0) to (u(a), v(a)) has a dotted outline (only when it has non-zero area).
- **Working column:** u and v as typed, then du and dv (differentiated symbolically), then the three values ∫ₐᵇ u dv, ∫ₐᵇ v du and [uv]ₐᵇ, then the identity ∫ u dv = [uv] − ∫ v du.

**Signed areas.** Each region's value is a signed area, measured as x goes from a to b (the engine integrates from a to b in whatever order the two limits are set). ∫ u dv = ∫ₐᵇ u v′ dx counts positive where u > 0 while v increases as x goes from a to b, or u < 0 while v decreases, and negative otherwise; ∫ v du works the same way with v and u swapped. So swapping a and b changes the sign of all three values: u = x, v = x with a = 1, b = 0 gives ∫ u dv = ∫ v du = −0.5 and [uv] = −1. The picture shows two plain regions that fill the L-shape between the rectangles only when a < b and u and v are both increasing and non-negative on [a, b]. That is true for every preset except "Past π/2". There v = sin x turns back after x = π/2, so ∫ u dv is negative even though the whole curve lies in the first quadrant, and the identity still holds. The stage should say so (engine request below).

**Reduction formula.** The plot shows the integrand for the chosen n over its fixed interval (0 to π/2 for sinⁿ x, 0 to 1 for xⁿeˣ) with the area under it shaded. The working column is the **stepper**: the integral, the reduction formula, then the chain of values from the base case up to I_n, one line per step (the last seven steps when the chain is longer), for example "I₄ = (3/4) I₂ = 0.589", and finally the direct numerical value for comparison.

This setup is static: there is no play button.

## Parameters
Keys are from the `fnplot` engine meta in PR #28 (the fnplot engine).

| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| partsView | View | | | | | area | enum: `area` (area picture), `reduction` (reduction formula) |
| partsU | u(x) | | | | | `x` | expression in x (fnplot parser); area view |
| partsV | v(x) | | | | | `e^x` | expression in x; dv = v′(x) dx is found by symbolic differentiation; area view |
| partsA | From x = | | −5 | 5 | 0.05 | 0 | area view |
| partsB | To x = | | −5 | 5 | 0.05 | 1 | area view |
| reduction | Integral | | | | | sin | enum, select: `sin` (I_n = ∫₀^(π/2) sinⁿ x dx, I_n = ((n − 1)/n) I_(n−2)), `xex` (I_n = ∫₀¹ xⁿ eˣ dx, I_n = e − n I_(n−1)); reduction view |
| reductionN | n | | 0 | 12 | 1 | 4 | integer; reduction view |
| piTicks | Label x in multiples of π | | | | | off | boolean |

Presets that need π/2 set `partsB` to 1.5707963267948966 exactly. The slider's 0.05 grid cannot show that value, so the thumb sits between 1.55 and 1.60, and the working column prints the limit as 1.57 (the values are computed with π/2 exactly). An engine request below asks for limits that are simple multiples of π to be printed as π/2 and so on.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | area, u = `x`, v = `e^x`, a = 0, b = 1 | ∫₀¹ x eˣ dx = e − (e − 1) = 1: the small rectangle has zero area |
| ln-x | area, u = `ln(x)`, v = `x`, a = 1, b = 2 | ∫₁² ln x dx = 2 ln 2 − 1, with dv = dx as the "invisible" choice |
| x-cos | area, u = `x`, v = `sin(x)`, a = 0, b = π/2 (1.5707963267948966), π ticks on | ∫ x cos x dx = π/2 − 1: the big rectangle is π/2 by 1 |
| past-half-pi | area, u = `x`, v = `sin(x)`, a = 0, b = 3 | v turns back after π/2, so ∫ u dv = 3 sin 3 − (1 − cos 3) ≈ −1.567 is negative though the curve is in the first quadrant |
| arctan | area, u = `atan(x)`, v = `x`, a = 0, b = 1 | ∫₀¹ tan⁻¹ x dx = π/4 − (ln 2)/2 |
| x-squared-exp | area, u = `x^2`, v = `e^x`, a = 0, b = 1 | ∫ v du = ∫ 2x eˣ dx = 2 needs a second integration by parts; ∫ u dv = e − 2 |
| sin-power | reduction, sin, n = 6 | I₆ = (5/6)(3/4)(1/2)(π/2) = 5π/32 |
| x-exp-power | reduction, xex, n = 3 | I₃ = 6 − 2e |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| intUdv | ∫ u dv | | 4 |
| intVdu | ∫ v du | | 4 |
| boundaryTerm | [uv] from a to b | | 4 |
| reductionValue | Iₙ by the reduction formula | | 4 |
| reductionNumeric | Iₙ by direct integration | | 4 |

Definitions (from the engine):
- intUdv = ∫ₐᵇ u(x)v′(x) dx and intVdu = ∫ₐᵇ v(x)u′(x) dx, both by composite Simpson's rule with 4000 subintervals, using derivatives found symbolically. boundaryTerm = u(b)v(b) − u(a)v(a), evaluated exactly. These three are null in the reduction view.
- reductionValue applies the recurrence forwards from its base case in floating point: I₀ = π/2 and I₁ = 1 for sin, I₀ = e − 1 for xex. reductionNumeric is Simpson's rule with 4000 subintervals. These two are null in the area view.
- The forward recurrence I_n = e − n I_(n−1) multiplies any rounding error by about n!. At n = 12 it gives 0.1950999057 against 0.1950999312 by direct integration (agreeing to 6 significant figures, so the readouts match to the 4 shown). The acceptance checks stay at n ≤ 6, where the difference is below 1e-13. This is a good talking point: the two readouts are computed differently.
- When u or v is undefined somewhere on [a, b] (for example ln x with a ≤ 0) the stage should say why and the area outputs should be NaN (engine request below).

## Assumptions shown on stage
- Areas are signed: ∫ u dv counts negative where u and dv have opposite signs
- Area values by numerical integration, shown to 4 significant figures
- Reduction values: forward recurrence; check: direct numerical integration

## Try this (3–5 predict, observe, explain prompts)
1. Predict: in the default scenario, the big rectangle has area e and the ∫ v du region has area e − 1. What must the ∫ u dv region be? Check the working column.
2. Observe: in "ln x", move b. Why is the small rectangle always empty here, and which region is easy to find without integration by parts?
3. Predict: in "x² eˣ", is ∫ v du = ∫ 2x eˣ dx easier than the original? Read its value, then explain why a second integration by parts finishes the job.
4. Explain: in "Past π/2", the whole curve lies in the first quadrant, yet ∫ u dv is negative. Use the direction the curve travels in v after x = π/2 to explain why.
5. Observe: in "x-exp-power", step n up from 0 and predict each new line from I_n = e − n I_(n−1) before it appears.

## Teacher notes outline
- Misconceptions to target:
  - choosing u as the factor that gets harder to differentiate (for example u = eˣ in x eˣ);
  - forgetting to evaluate [uv] at both limits;
  - thinking ∫ v du is "the same integral again";
  - believing every signed area in the picture is positive when the curve is in the first quadrant;
  - believing a reduction formula needs every earlier value rather than just the starting values;
  - treating the two chains for even and odd n as one.
- 10-minute lesson flow:
  - (1) default picture: predict the ∫ u dv area from the rectangle and the other area (3 min);
  - (2) ln x and tan⁻¹ x with dv = dx: why the ∫ v du region is easy (2 min);
  - (3) "Past π/2": signed areas and why the identity still holds (2 min);
  - (4) derive the sin-power reduction formula on the board, then confirm it with the stepper (3 min).
- Original HSC-style question idea: (a) Use integration by parts to show that ∫₁^e ln x dx = 1, and explain the result using the rectangle with vertices (0, 0), (1, 0), (1, e) and (0, e) in the (u, v) plane. (b) Let I_n = ∫₀¹ xⁿ e^(−x) dx. Show that I_n = n I_(n−1) − e^(−1) for n ≥ 1. (c) Hence find I₃ exactly. (Answer: I₃ = 6 − 16/e.) Write the full question and worked solution in the notes file.

## Accessibility notes
- Second cues beyond colour: each region carries its integral as a text label; the big rectangle is dashed and the small one dotted; the curve is a thick solid line with labelled endpoints. In the reduction view the current value is the highlighted last line of the chain, and the direct value is labelled in words.
- Keyboard: u and v are text fields; the limits and n are sliders; the views are selects. Nothing needs a pointer.
- Stage aria-label (from the engine's `describe()`), for example: "Integration by parts as areas: integral of u dv 1 plus integral of v du 1.718 equals uv from a to b, 2.718." In the reduction view: "Reduction formula for I sub 6: 0.4909."

## Engine change requests
Keys and outputs above match the `fnplot` meta in PR #28. Requests (not used by the acceptance block below):
- **Signed-area note:** when a > b, or u or v is not increasing as x goes from a to b, or either is negative there, say on stage that the regions are signed areas and may overlap (the "Past π/2" preset needs it).
- **π limits:** print a limit that is a simple multiple of π (within 1e-12) as π/2, π/4 and so on in the working column, instead of 1.57.
- **Undefined pieces:** when u, v or their derivatives are undefined somewhere on [a, b] (for example ln x with a ≤ 0), say why and output NaN. At present ln with a = 0 gives intUdv = −∞.
- **Stepper reveal:** a "Lines revealed" control, so the chain can be shown one line at a time in class.
- **Hatching** on the two regions in different directions, as a cue beyond colour that survives projection.

## Acceptance
Every number below comes from the formula and hand calculation shown here. All checks are static. The area and direct values come from numerical integration (tolerance 1e-6 absolute); the boundary term and the recurrence are exact (1e-9). All eight checks were also run through the fnplot engine's own model: the integrals agree to better than 1e-14.

- **Check 1, x eˣ on [0, 1] (default).** u = x, v = eˣ. [uv]₀¹ = 1 × e − 0 × 1 = **e = 2.718281828459**. ∫ v du = ∫₀¹ eˣ dx = **e − 1 = 1.718281828459**. So ∫ u dv = e − (e − 1) = **1**.
- **Check 2, ln x on [1, 2].** u = ln x, v = x. [uv]₁² = 2 ln 2 − 1 × 0 = **2 ln 2 = 1.386294361120**. ∫ v du = ∫₁² x × (1/x) dx = **1**. ∫ u dv = 2 ln 2 − 1 = **0.386294361120**.
- **Check 3, x cos x on [0, π/2].** u = x, v = sin x. [uv] = (π/2)(1) − 0 = **π/2 = 1.570796326795**. ∫ v du = ∫₀^(π/2) sin x dx = **1**. ∫ u dv = **π/2 − 1 = 0.570796326795**.
- **Check 4, the same pair past π/2 (signed areas).** u = x, v = sin x on [0, 3]. [uv] = 3 sin 3 = 3 × 0.141120008 = **0.423360024180**. ∫ v du = ∫₀³ sin x dx = 1 − cos 3 = 1 + 0.989992497 = **1.989992496600**. ∫ u dv = 0.423360024 − 1.989992497 = **−1.566632472421**, negative because v = sin x decreases on (π/2, 3] while u = x > 0.
- **Check 5, tan⁻¹ x on [0, 1].** u = tan⁻¹ x, v = x. [uv] = 1 × π/4 − 0 = **π/4 = 0.785398163397**. ∫ v du = ∫₀¹ x/(1 + x²) dx = (1/2) ln 2 = **0.346573590280**. ∫ u dv = π/4 − (ln 2)/2 = **0.438824573117**.
- **Check 6, sin⁵.** Writing sinⁿ x = sinⁿ⁻¹ x × sin x and integrating by parts gives I_n = (n − 1)∫ sinⁿ⁻² x cos² x dx = (n − 1)(I_(n−2) − I_n), so I_n = ((n − 1)/n) I_(n−2). With I₁ = 1: I₃ = 2/3, I₅ = (4/5)(2/3) = **8/15 = 0.533333333333**.
- **Check 7, sin⁶.** With I₀ = π/2: I₂ = π/4, I₄ = (3/4)(π/4) = 3π/16, I₆ = (5/6)(3π/16) = **5π/32 = 0.490873852123**.
- **Check 8, x³eˣ.** I_n = ∫₀¹ xⁿ eˣ dx = [xⁿ eˣ]₀¹ − n∫₀¹ xⁿ⁻¹ eˣ dx = e − n I_(n−1). I₀ = e − 1, I₁ = e − (e − 1) = 1, I₂ = e − 2, I₃ = e − 3(e − 2) = **6 − 2e = 0.563436343082**.

```acceptance
[
  { "name": "x e^x on [0, 1]: rectangle e minus (e - 1) leaves 1", "params": { "partsView": "area", "partsU": "x", "partsV": "e^x", "partsA": 0, "partsB": 1 }, "run": "static",
    "expect": { "intUdv": { "value": 1, "absTol": 1e-6 }, "intVdu": { "value": 1.718281828459, "absTol": 1e-6 }, "boundaryTerm": { "value": 2.718281828459, "absTol": 1e-9 } } },
  { "name": "ln x on [1, 2]", "params": { "partsView": "area", "partsU": "ln(x)", "partsV": "x", "partsA": 1, "partsB": 2 }, "run": "static",
    "expect": { "intUdv": { "value": 0.38629436112, "absTol": 1e-6 }, "intVdu": { "value": 1, "absTol": 1e-6 }, "boundaryTerm": { "value": 1.38629436112, "absTol": 1e-9 } } },
  { "name": "x cos x on [0, pi/2]", "params": { "partsView": "area", "partsU": "x", "partsV": "sin(x)", "partsA": 0, "partsB": 1.5707963267948966 }, "run": "static",
    "expect": { "intUdv": { "value": 0.570796326795, "absTol": 1e-6 }, "intVdu": { "value": 1, "absTol": 1e-6 }, "boundaryTerm": { "value": 1.570796326795, "absTol": 1e-9 } } },
  { "name": "past pi/2 the area is signed: x cos x on [0, 3]", "params": { "partsView": "area", "partsU": "x", "partsV": "sin(x)", "partsA": 0, "partsB": 3 }, "run": "static",
    "expect": { "intUdv": { "value": -1.566632472421, "absTol": 1e-6 }, "intVdu": { "value": 1.9899924966, "absTol": 1e-6 }, "boundaryTerm": { "value": 0.42336002418, "absTol": 1e-9 } } },
  { "name": "arctan x on [0, 1]", "params": { "partsView": "area", "partsU": "atan(x)", "partsV": "x", "partsA": 0, "partsB": 1 }, "run": "static",
    "expect": { "intUdv": { "value": 0.438824573117, "absTol": 1e-6 }, "intVdu": { "value": 0.34657359028, "absTol": 1e-6 }, "boundaryTerm": { "value": 0.785398163397, "absTol": 1e-9 } } },
  { "name": "sin^5 by reduction: 8/15", "params": { "partsView": "reduction", "reduction": "sin", "reductionN": 5 }, "run": "static",
    "expect": { "reductionValue": { "value": 0.533333333333, "absTol": 1e-9 }, "reductionNumeric": { "value": 0.533333333333, "absTol": 1e-6 } } },
  { "name": "sin^6 by reduction: 5 pi / 32", "params": { "partsView": "reduction", "reduction": "sin", "reductionN": 6 }, "run": "static",
    "expect": { "reductionValue": { "value": 0.490873852123, "absTol": 1e-9 }, "reductionNumeric": { "value": 0.490873852123, "absTol": 1e-6 } } },
  { "name": "x^3 e^x by reduction: 6 - 2e", "params": { "partsView": "reduction", "reduction": "xex", "reductionN": 3 }, "run": "static",
    "expect": { "reductionValue": { "value": 0.563436343082, "absTol": 1e-9 }, "reductionNumeric": { "value": 0.563436343082, "absTol": 1e-6 } } }
]
```
