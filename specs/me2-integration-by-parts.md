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
Students see integration by parts, ∫ u dv = [uv] − ∫ v du, as a statement about areas: when the curve (v(x), u(x)) is drawn for a ≤ x ≤ b, the two regions it cuts off (one against each axis) have areas ∫ u dv and ∫ v du, and together they make the difference of two rectangles, u(b)v(b) − u(a)v(a). They then use integration by parts to derive a reduction formula and apply it step by step to evaluate a definite integral for a particular n.

## What the student sees
**Area picture mode (default).** The stage at 1920×1080 has two panels.

- **Left, the (v, u) plane (about 60% of the width):** the horizontal axis is v and the vertical axis is u, with equal scales where possible, tick labels at least 18 px and axis titles "v" and "u". The curve (v(x), u(x)) for a ≤ x ≤ b is a thick orange line with its endpoints marked "x = a" and "x = b". The region between the curve and the v-axis (area ∫ u dv) is shaded light orange with 45° hatching and labelled with its value. The region between the curve and the u-axis (area ∫ v du) is shaded light grey with −45° hatching and labelled. The big rectangle (0, 0) to (v(b), u(b)) has a solid outline labelled "u(b)v(b)", and the small rectangle (0, 0) to (v(a), u(a)) has a dashed outline labelled "u(a)v(a)".
- **Right, the ordinary graph:** y = u(x)v′(x) against x on [a, b], with the area under it shaded in the same light orange and hatching, labelled "∫ u dv = ∫ u v′ dx". This links the picture back to the integral as students first meet it.
- **Above both panels:** the choice of u and dv with v written in, then the identity with numbers, for example "∫₀¹ x eˣ dx = [x eˣ]₀¹ − ∫₀¹ eˣ dx = 2.718 − 1.718 = 1.000".

Areas are signed: a part of a region below the v-axis or to the left of the u-axis counts as negative and is drawn with a dashed outline. The picture is clearest when u and v both increase on [a, b], which is true for every default interval.

**Reduction formula mode.** The left panel graphs the integrand for the chosen n (thick orange) over the fixed interval, with the curves for n − 1 and n − 2 faint grey behind it and the area for n shaded. The right panel is the **stepper**: the reduction formula at the top, then the chain of values from I₀ (and I₁) up to I_n, one line per step, each with its exact form and decimal value, for example "I₄ = (3/4) I₂ = 3π/16 = 0.589". The **Lines revealed** slider shows the chain one line at a time, so a class can predict each step.

This setup is static: there is no play button.

## Parameters
`fnplot` serves many setups from one `meta.params` object, so this setup's keys carry an `ibp` or `reduction` prefix where a plain name (`mode`, `a`, `b`, `family`, `n`) could collide with another setup's param of a different meaning or range (the Ext 1 specs already use `a`, `b` and `family`).

| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ibpView | Show | | | | | area | enum: `area` (area picture), `reduction` (reduction formula) |
| ibpPair | Choice of u and dv | | | | | x-exp | enum, select widget, visible in area mode: `x-exp` (u = x, dv = eˣ dx, v = eˣ), `x2-exp` (u = x², dv = eˣ dx, v = eˣ), `x-cos` (u = x, dv = cos x dx, v = sin x), `ln` (u = ln x, dv = dx, v = x), `x-ln` (u = ln x, dv = x dx, v = x²/2), `arctan` (u = tan⁻¹ x, dv = dx, v = x) |
| ibpFrom | Lower limit a | | 0 | 4 | 0.05 | 0 | area mode |
| ibpTo | Upper limit b | | 0 | 4 | 0.05 | 1 | area mode; when b ≤ a, or a ≤ 0 for a pair with ln x, the stage says why and the outputs are NaN |
| showVduRegion | Show ∫ v du region | | | | | on | boolean, area mode |
| showIntegrand | Show the graph of u v′ | | | | | on | boolean, area mode |
| reductionFamily | Integral family | | | | | sin-power | enum, visible in reduction mode: `sin-power` (I_n = ∫₀^(π/2) sinⁿ x dx), `x-exp` (I_n = ∫₀¹ xⁿ eˣ dx) |
| reductionN | n | | 0 | 12 | 1 | 5 | integer, reduction mode |
| reductionReveal | Lines revealed | | 0 | 13 | 1 | 13 | integer, reduction mode; lines beyond the chain's length are ignored |

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | area mode, pair x-exp, a = 0, b = 1, both toggles on | ∫₀¹ x eˣ dx = e − (e − 1) = 1: the small rectangle has zero height |
| ln-x | area mode, pair ln, a = 1, b = 2 | ∫₁² ln x dx = 2 ln 2 − 1, with dv = dx as the "invisible" choice |
| x-cos | area mode, pair x-cos, a = 0, b = π/2 (1.5707963267948966) | ∫ x cos x dx = π/2 − 1: the rectangle is 1 by π/2 |
| arctan | area mode, pair arctan, a = 0, b = 1 | ∫₀¹ tan⁻¹ x dx = π/4 − (ln 2)/2 |
| sin-power | reduction mode, family sin-power, n = 6, reveal 13 | I_n = ((n − 1)/n) I_(n−2): I₆ = 5π/32 |
| x-exp-power | reduction mode, family x-exp, n = 3, reveal 0 | reveal I₀ to I₃ one line at a time: I₃ = 6 − 2e |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| intUdv | ∫ u dv | | 4 |
| intVdu | ∫ v du | | 4 |
| uvBoundary | [uv] from a to b | | 4 |
| bigRect | u(b)v(b) | | 4 |
| smallRect | u(a)v(a) | | 4 |
| reductionValue | I_n from the reduction formula | | 4 |
| directValue | I_n by direct numerical integration | | 4 |

Definitions: intUdv = ∫ₐᵇ u(x)v′(x) dx and intVdu = ∫ₐᵇ v(x)u′(x) dx, each by composite Simpson's rule with at least 2000 subintervals (or adaptive quadrature to 1e-10); uvBoundary = bigRect − smallRect = u(b)v(b) − u(a)v(a), evaluated exactly. reductionValue applies the recurrence from I₀ (and I₁) in floating point: sin-power I₀ = π/2, I₁ = 1, I_n = ((n − 1)/n) I_(n−2); x-exp I₀ = e − 1, I_n = e − n I_(n−1). directValue integrates the integrand numerically in the same way as intUdv. Area outputs are NaN in reduction mode and reduction outputs are NaN in area mode.

## Assumptions shown on stage
- Areas are signed (regions below or left of the axes count as negative)
- Area values by numerical integration, shown to 4 significant figures
- Reduction values: exact recurrence; check: numerical integration

## Try this (3–5 predict, observe, explain prompts)
1. Predict: in the default scenario, the big rectangle has area e and the grey region has area e − 1. What must the orange region be? Check the readout.
2. Observe: switch to "ln x" and move b. Why is the small rectangle always empty here, and which region is easy to find without integration by parts?
3. Predict: choose u = x² and dv = eˣ dx on [0, 1]. Is the grey integral ∫ v du = ∫ 2x eˣ dx easier than the original? Read its value, then explain why a second integration by parts finishes the job.
4. Observe: in "sin-power", step n from 0 to 12. Why do the odd and even values follow two separate chains?
5. Explain: in "x-exp-power", reveal the lines one at a time. Before each one, predict the next value from the formula I_n = e − n I_(n−1).

## Teacher notes outline
- Misconceptions to target: choosing u as the factor that gets harder to differentiate (for example u = eˣ in x eˣ); forgetting to evaluate [uv] at both limits; thinking ∫ v du is "the same integral again"; believing a reduction formula needs every earlier value rather than just the starting values; treating the two chains for even and odd n as one.
- 10-minute lesson flow: (1) default picture: predict the orange area from the rectangle and the grey area (3 min); (2) ln x and tan⁻¹ x with dv = dx: why the grey region is easy (2 min); (3) derive the sin-power reduction formula on the board, then confirm it with the stepper (3 min); (4) x-exp-power: reveal line by line, predicting each value (2 min).
- Original HSC-style question idea: (a) Use integration by parts to show that ∫₁^e ln x dx = 1, and explain the result using the rectangle with vertices (0, 0), (e, 0), (e, 1) and (0, 1) in the (v, u) plane. (b) Let I_n = ∫₀¹ xⁿ e^(−x) dx. Show that I_n = n I_(n−1) − e^(−1) for n ≥ 1. (c) Hence find I₃ exactly. (Answer: I₃ = 6 − 16/e.) Write the full question and worked solution in the notes file.

## Accessibility notes
- Second cues beyond colour: the two regions differ in hatching direction as well as colour and are labelled with their integrals; the big rectangle is solid and the small one dashed; negative parts have dashed outlines. In reduction mode the current curve is thick and the earlier ones thin.
- Keyboard: all controls are selects, sliders and toggles; arrow keys on the **Lines revealed** slider step through the chain.
- Stage aria-label (from `describe()`), for example: "Integration by parts picture for u = x and dv = e to the x dx from 0 to 1. The area against the v-axis is 1.000, the area against the u-axis is 1.718, and together they make the rectangle of area 2.718." In reduction mode: "Reduction formula for the integral of sin to the n from 0 to π/2. I₆ = 5π/32 = 0.4909."

## Engine change requests
`origin/w1/engine-fnplot-parser` had only the parser (`parser.js`), not the fnplot `index.js` meta, when this spec was written (25 Nov). **Keys to reconcile with engine meta:**
- Params for setup `by-parts`: `ibpView`, `ibpPair`, `ibpFrom`, `ibpTo`, `showVduRegion`, `showIntegrand`, `reductionFamily`, `reductionN`, `reductionReveal` (prefixed so they cannot collide with other fnplot setups' `mode`, `a`, `b`, `family` or `n`).
- Outputs: `intUdv`, `intVdu`, `uvBoundary`, `bigRect`, `smallRect`, `reductionValue`, `directValue`.
- Behaviour needed: parametric plotting of (v(x), u(x)) with shading against each axis (guide §9.1 lists parametric curves and shaded regions); numerical integration to about 1e-10; exact forms in the stepper (fractions of π for sin powers, integers plus integer multiples of e for x-exp); `describe()`.

## Acceptance
Every number below comes from the formula and hand calculation shown here. All checks are static. The area outputs come from numerical integration (tolerance 1e-6 absolute); the boundary terms and the recurrence are exact (1e-9). Composite Simpson's rule with 2000 subintervals agreed with every integral below to better than 1e-14.

- **Check 1, x eˣ on [0, 1] (default).** u = x, v = eˣ. [uv]₀¹ = 1 × e − 0 × 1 = **e = 2.718281828459** (bigRect e, smallRect **0**). ∫ v du = ∫₀¹ eˣ dx = **e − 1 = 1.718281828459**. So ∫ u dv = e − (e − 1) = **1**.
- **Check 2, ln x on [1, 2].** u = ln x, v = x. [uv]₁² = 2 ln 2 − 1 × 0 = **2 ln 2 = 1.386294361120**. ∫ v du = ∫₁² x × (1/x) dx = **1**. ∫ u dv = 2 ln 2 − 1 = **0.386294361120**.
- **Check 3, x cos x on [0, π/2].** u = x, v = sin x. [uv] = (π/2)(1) − 0 = **π/2 = 1.570796326795** (bigRect π/2, smallRect 0). ∫ v du = ∫₀^(π/2) sin x dx = **1**. ∫ u dv = **π/2 − 1 = 0.570796326795**.
- **Check 4, tan⁻¹ x on [0, 1].** u = tan⁻¹ x, v = x. [uv] = 1 × π/4 − 0 = **π/4 = 0.785398163397**. ∫ v du = ∫₀¹ x/(1 + x²) dx = (1/2) ln 2 = **0.346573590280**. ∫ u dv = π/4 − (ln 2)/2 = **0.438824573117**.
- **Check 5, sin⁵.** I_n = ∫₀^(π/2) sinⁿ x dx. Writing sinⁿ x = sinⁿ⁻¹ x × sin x and integrating by parts gives I_n = (n − 1)∫ sinⁿ⁻² x cos² x dx = (n − 1)(I_(n−2) − I_n), so I_n = ((n − 1)/n) I_(n−2). With I₁ = 1: I₃ = 2/3, I₅ = (4/5)(2/3) = **8/15 = 0.533333333333**.
- **Check 6, sin⁶.** With I₀ = π/2: I₂ = π/4, I₄ = (3/4)(π/4) = 3π/16, I₆ = (5/6)(3π/16) = **5π/32 = 0.490873852123**.
- **Check 7, x³eˣ.** I_n = ∫₀¹ xⁿ eˣ dx = [xⁿ eˣ]₀¹ − n∫₀¹ xⁿ⁻¹ eˣ dx = e − n I_(n−1). I₀ = e − 1, I₁ = e − (e − 1) = 1, I₂ = e − 2, I₃ = e − 3(e − 2) = **6 − 2e = 0.563436343082**.

```acceptance
[
  { "name": "x e^x on [0, 1]: rectangle e minus (e - 1) leaves 1", "params": { "ibpView": "area", "ibpPair": "x-exp", "ibpFrom": 0, "ibpTo": 1 }, "run": "static",
    "expect": { "intUdv": { "value": 1, "absTol": 1e-6 }, "intVdu": { "value": 1.718281828459, "absTol": 1e-6 }, "uvBoundary": { "value": 2.718281828459, "absTol": 1e-9 },
                "bigRect": { "value": 2.718281828459, "absTol": 1e-9 }, "smallRect": { "value": 0, "absTol": 1e-9 } } },
  { "name": "ln x on [1, 2]", "params": { "ibpView": "area", "ibpPair": "ln", "ibpFrom": 1, "ibpTo": 2 }, "run": "static",
    "expect": { "intUdv": { "value": 0.38629436112, "absTol": 1e-6 }, "intVdu": { "value": 1, "absTol": 1e-6 }, "uvBoundary": { "value": 1.38629436112, "absTol": 1e-9 } } },
  { "name": "x cos x on [0, pi/2]", "params": { "ibpView": "area", "ibpPair": "x-cos", "ibpFrom": 0, "ibpTo": 1.5707963267948966 }, "run": "static",
    "expect": { "intUdv": { "value": 0.570796326795, "absTol": 1e-6 }, "intVdu": { "value": 1, "absTol": 1e-6 }, "uvBoundary": { "value": 1.570796326795, "absTol": 1e-9 },
                "bigRect": { "value": 1.570796326795, "absTol": 1e-9 }, "smallRect": { "value": 0, "absTol": 1e-9 } } },
  { "name": "arctan x on [0, 1]", "params": { "ibpView": "area", "ibpPair": "arctan", "ibpFrom": 0, "ibpTo": 1 }, "run": "static",
    "expect": { "intUdv": { "value": 0.438824573117, "absTol": 1e-6 }, "intVdu": { "value": 0.34657359028, "absTol": 1e-6 }, "uvBoundary": { "value": 0.785398163397, "absTol": 1e-9 } } },
  { "name": "sin^5 by reduction: 8/15", "params": { "ibpView": "reduction", "reductionFamily": "sin-power", "reductionN": 5 }, "run": "static",
    "expect": { "reductionValue": { "value": 0.533333333333, "absTol": 1e-9 }, "directValue": { "value": 0.533333333333, "absTol": 1e-6 } } },
  { "name": "sin^6 by reduction: 5 pi / 32", "params": { "ibpView": "reduction", "reductionFamily": "sin-power", "reductionN": 6 }, "run": "static",
    "expect": { "reductionValue": { "value": 0.490873852123, "absTol": 1e-9 }, "directValue": { "value": 0.490873852123, "absTol": 1e-6 } } },
  { "name": "x^3 e^x by reduction: 6 - 2e", "params": { "ibpView": "reduction", "reductionFamily": "x-exp", "reductionN": 3 }, "run": "static",
    "expect": { "reductionValue": { "value": 0.563436343082, "absTol": 1e-9 }, "directValue": { "value": 0.563436343082, "absTol": 1e-6 } } }
]
```
