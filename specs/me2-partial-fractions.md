---
id: me2-partial-fractions
title: "Partial fractions decomposer"
subject: me2
engine: fnplot
setup: partial-fractions
priority: P2
status: draft            # stub → draft → approved (Gate B)
page: /interactives/maths-ext2/partial-fractions.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Mathematics Extension 2","version":"2024","area":"Calculus","focusArea":"Further integration","year":12,"outcomes":[],"verified":false}
---
# Partial fractions decomposer

> Backlog summary: Decompose a rational function and graph each piece.

## Learning goal
Students decompose a proper rational function whose denominator is a product of distinct linear factors, or of a linear factor and an irreducible quadratic x² + q, into partial fractions. They see that the pieces add back to the original graph, that each vertical asymptote belongs to exactly one piece, and that each piece integrates to a logarithm or an inverse tangent, which is why the decomposition is worth doing.

## What the student sees
The stage at 1920×1080 shows one large graph, x from −6 to 6 and y from −8 to 8, with tick labels at least 18 px.

- **The identity** sits above the graph with the current numbers, for example "(5x + 1)/((x − 1)(x + 2)) = 2/(x − 1) + 3/(x + 2)", and under it the working for each coefficient by substitution ("cover-up"), for example "x = 1: A = (5 × 1 + 1)/(1 + 2) = 2". For the linear–quadratic form, the working shows A by substitution and then B and C by equating coefficients.
- **The original function** is a thick orange curve. **Each piece** is a thinner graphite curve with its own dash pattern (dashed, dotted, dash-dot), labelled at its end with its formula. Vertical asymptotes are thin dashed lines labelled "x = 1" and so on, and each is drawn in the same dash pattern as the piece it belongs to.
- **Probe:** a vertical line at x = xProbe (draggable). Markers show f(xProbe) on the original curve and each piece's value, with a small stacked bar beside the line showing the pieces adding to f(xProbe).
- **Integral:** the region between the original curve and the x-axis from a to b is shaded light orange (with hatching where it is below the axis), and the antiderivative and the value are written beneath the identity, for example "∫₂⁴ f(x) dx = [2 ln|x − 1| + 3 ln|x + 2|]₂⁴ = 3.414". If [a, b] contains an asymptote, the shading is not drawn and the note says "The interval crosses an asymptote at x = 1, so this integral is improper".

Repeated linear factors (two equal roots) are outside this page: the stage says so and the coefficient outputs are NaN. This setup is static: there is no play button.

## Parameters
`fnplot` serves many setups from one `meta.params` object, so this setup's own keys carry a `pf` prefix where a plain name (`form`, `p1`, `r1`, `q`, `a`, `b`) could collide with another setup's param of a different meaning or range (the Ext 1 specs already use `a`, `b`, `form`, `q` and `r1` to `r4`). `xProbe` and the window keys are shared with the other fnplot setups on purpose: they mean the same thing everywhere.

| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| pfDenominator | Denominator | | | | | two-linear | enum: `two-linear` ((x − r₁)(x − r₂)), `three-linear` ((x − r₁)(x − r₂)(x − r₃)), `linear-quadratic` ((x − r₁)(x² + q)) |
| pfNum2 | Numerator coefficient of x² | | −10 | 10 | 0.1 | 0 | visible for three-linear and linear-quadratic; ignored for two-linear so the fraction stays proper |
| pfNum1 | Numerator coefficient of x | | −10 | 10 | 0.1 | 5 | |
| pfNum0 | Numerator constant | | −10 | 10 | 0.1 | 1 | |
| pfRoot1 | r₁ | | −5 | 5 | 0.1 | 1 | |
| pfRoot2 | r₂ | | −5 | 5 | 0.1 | −2 | visible for two-linear and three-linear |
| pfRoot3 | r₃ | | −5 | 5 | 0.1 | 0 | visible for three-linear |
| pfQ | q in x² + q | | 0.25 | 9 | 0.25 | 4 | visible for linear-quadratic; q > 0 keeps x² + q irreducible |
| pfFrom | Lower limit a | | −6 | 6 | 0.1 | 2 | |
| pfTo | Upper limit b | | −6 | 6 | 0.1 | 4 | |
| xProbe | Probe x | | −20 | 20 | 0.05 | 3 | shared fnplot key; also set by dragging the probe line |
| showPieces | Show the pieces | | | | | on | boolean |
| shadeIntegral | Shade the integral | | | | | on | boolean |
| xMin, xMax, yMin, yMax | Window | | −20 | 20 | 0.5 | −6, 6, −8, 8 | shared fnplot window keys (defaults set by the presets) |

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | two-linear, p₁ = 5, p₀ = 1, r₁ = 1, r₂ = −2, a = 2, b = 4, probe 3, both toggles on, window x −6 to 6, y −8 to 8 | (5x + 1)/((x − 1)(x + 2)) = 2/(x − 1) + 3/(x + 2) |
| three-linear | three-linear, p₂ = 2, p₁ = 0, p₀ = −1, r₁ = 0, r₂ = 1, r₃ = −1, a = 2, b = 3, probe 2 | (2x² − 1)/(x(x − 1)(x + 1)) = 1/x + (1/2)/(x − 1) + (1/2)/(x + 1) |
| linear-quadratic | linear-quadratic, p₂ = 3, p₁ = 2, p₀ = 5, r₁ = 1, q = 4, a = 2, b = 4, probe 3 | (3x² + 2x + 5)/((x − 1)(x² + 4)) = 2/(x − 1) + (x + 3)/(x² + 4): a log and an inverse tangent |
| zero-coefficient | two-linear, p₁ = 1, p₀ = −1, r₁ = 1, r₂ = −2, a = 2, b = 4 | the numerator cancels the factor x − 1, so A = 0 and only one piece remains |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| coefA | A | | 4 |
| coefB | B | | 4 |
| coefC | C | | 4 |
| pfIntegral | ∫ from a to b of f(x) dx | | 4 |
| fAtProbe | f at the probe | | 4 |
| piecesAtProbe | Sum of the pieces at the probe | | 4 |

Definitions (N(x) = p₂x² + p₁x + p₀, with p₂ = 0 for two-linear):
- two-linear: f = A/(x − r₁) + B/(x − r₂) with A = N(r₁)/(r₁ − r₂) and B = N(r₂)/(r₂ − r₁); coefC is NaN.
- three-linear: f = A/(x − r₁) + B/(x − r₂) + C/(x − r₃) with A = N(r₁)/((r₁ − r₂)(r₁ − r₃)), B = N(r₂)/((r₂ − r₁)(r₂ − r₃)), C = N(r₃)/((r₃ − r₁)(r₃ − r₂)).
- linear-quadratic: f = A/(x − r₁) + (Bx + C)/(x² + q) with A = N(r₁)/(r₁² + q), B = p₂ − A, C = p₁ + r₁B (from N = (A + B)x² + (C − r₁B)x + (Aq − r₁C)).
- pfIntegral is evaluated exactly from the antiderivative of the pieces: A ln|x − r| for each linear piece, and (B/2) ln(x² + q) + (C/√q) tan⁻¹(x/√q) for the quadratic piece. It is NaN when a pole lies in [a, b] or when b ≤ a.
- fAtProbe evaluates N(x)/D(x) directly at x = xProbe; piecesAtProbe adds the pieces there. Both are NaN at a pole. Any two equal roots make every output NaN.

## Assumptions shown on stage
- Proper fraction: numerator degree below the denominator's
- Distinct linear factors; x² + q with q > 0 has no real roots
- ln|x − r| is used, so the antiderivative is valid on intervals without poles

## Try this (3–5 predict, observe, explain prompts)
1. Predict: in the default scenario, which piece will be largest just to the right of x = 1, and which near x = −2? Check with the probe.
2. Observe: drag the probe across the graph. How do the piece markers add up to the orange curve, even close to an asymptote?
3. Predict: what numerator makes A = 0 when the denominator is (x − 1)(x + 2)? Try your idea, then load "Zero coefficient".
4. Observe: in "Linear–quadratic", turn the pieces on and off. Which piece makes the tan⁻¹ term in the integral, and why does it have no asymptote?
5. Explain: move a and b so that the interval contains x = 1. Why does the page refuse to give a value for the integral?

## Teacher notes outline
- Misconceptions to target: using a constant numerator over the quadratic factor (B/(x² + q) instead of (Bx + C)/(x² + q)); decomposing an improper fraction without dividing first; using cover-up (substitution) alone to find B and C for the quadratic factor; ∫ 1/(x − r) dx = ln(x − r) without the absolute value; integrating across an asymptote as if nothing happens.
- 10-minute lesson flow: (1) default: predict A and B by substitution, then reveal and probe (3 min); (2) zero coefficient: why a numerator can cancel a factor (2 min); (3) linear–quadratic: equate coefficients for B and C, then integrate to ln and tan⁻¹ (3 min); (4) move the interval across a pole and discuss improper integrals (2 min).
- Original HSC-style question idea: (a) Find A, B and C such that (x² + 4x + 1)/((x + 1)(x² + 1)) = A/(x + 1) + (Bx + C)/(x² + 1). (b) Hence show that ∫₀¹ (x² + 4x + 1)/((x + 1)(x² + 1)) dx = π/2. (Answer: A = −1, B = 2, C = 2; the integral is −ln 2 + ln 2 + 2 × π/4.) Write the full question and worked solution in the notes file.

## Accessibility notes
- Second cues beyond colour: each piece has its own dash pattern, shared with its asymptote, and a text label; the original curve is thicker; the shaded integral has hatching below the axis.
- Keyboard: every value is a slider or select; the probe line also follows the **Probe x** slider.
- Stage aria-label (from `describe()`), for example: "Graph of (5x + 1) over (x − 1)(x + 2), which equals 2 over (x − 1) plus 3 over (x + 2). The integral from 2 to 4 is 3.414."

## Engine change requests
`origin/w1/engine-fnplot-parser` had only the parser (`parser.js`), not the fnplot `index.js` meta, when this spec was written (25 Nov). **Keys to reconcile with engine meta:**
- Params for setup `partial-fractions`: `pfDenominator`, `pfNum2`, `pfNum1`, `pfNum0`, `pfRoot1`, `pfRoot2`, `pfRoot3`, `pfQ`, `pfFrom`, `pfTo`, `showPieces`, `shadeIntegral`, plus the shared `xProbe`, `xMin`, `xMax`, `yMin`, `yMax`.
- Outputs: `coefA`, `coefB`, `coefC`, `pfIntegral`, `fAtProbe` (same meaning as in the Ext 1 transform setup), `piecesAtProbe`.
- Behaviour needed: dashed vertical asymptotes at the poles and curve breaks there (guide §9.1 already lists discontinuity breaks); several curves with distinct dash patterns; shading between a and b; `describe()`.

## Acceptance
Every number below comes from the formula and hand calculation shown here. All checks are static and every output is a closed form, so the tolerance is 1e-9. (Composite Simpson's rule on the original functions agreed with each integral to better than 1e-12.)

- **Check 1, two linear factors (default).** f = (5x + 1)/((x − 1)(x + 2)). x = 1: A = (5 + 1)/(1 + 2) = **2**. x = −2: B = (−10 + 1)/(−2 − 1) = **3**. ∫₂⁴ f dx = 2[ln|x − 1|]₂⁴ + 3[ln|x + 2|]₂⁴ = 2 ln 3 + 3 ln(6/4) = 2.197224577 + 1.216395324 = **3.413619902**. At x = 3: f = 16/(2 × 5) = **1.6**, and 2/2 + 3/5 = **1.6**.
- **Check 2, three linear factors.** f = (2x² − 1)/(x(x − 1)(x + 1)), so r₁ = 0, r₂ = 1, r₃ = −1. A = N(0)/((0 − 1)(0 + 1)) = −1/−1 = **1**; B = N(1)/((1 − 0)(1 + 1)) = 1/2 = **0.5**; C = N(−1)/((−1 − 0)(−1 − 1)) = 1/2 = **0.5**. ∫₂³ f dx = ln(3/2) + (1/2) ln(2/1) + (1/2) ln(4/3) = 0.405465108 + 0.346573590 + 0.143841036 = **0.895879735**. At x = 2: f = 7/(2 × 1 × 3) = **7/6 = 1.166666667**, and 1/2 + 1/2 + 1/6 = 7/6.
- **Check 3, linear and quadratic factors.** f = (3x² + 2x + 5)/((x − 1)(x² + 4)). A = N(1)/(1 + 4) = 10/5 = **2**; B = p₂ − A = 3 − 2 = **1**; C = p₁ + r₁B = 2 + 1 = **3** (check the constant: Aq − r₁C = 8 − 3 = 5 = p₀). ∫₂⁴ f dx = 2 ln(3/1) + (1/2) ln((16 + 4)/(4 + 4)) + (3/2)(tan⁻¹ 2 − tan⁻¹ 1) = 2.197224577 + 0.458145366 + 1.5 × 0.321750554 = 2.197224577 + 0.458145366 + 0.482625832 = **3.137995775**. At x = 3: f = 38/(2 × 13) = **1.461538462**, and 2/2 + 6/13 = 1.461538462.
- **Check 4, a zero coefficient (preset).** f = (x − 1)/((x − 1)(x + 2)). A = N(1)/3 = 0/3 = **0**, B = N(−2)/(−3) = −3/−3 = **1**, so f = 1/(x + 2) (for x ≠ 1). ∫₂⁴ = ln(6/4) = **0.405465108**. At x = 3: f = 2/(2 × 5) = **0.2**.

```acceptance
[
  { "name": "two linear factors: A = 2, B = 3", "params": { "pfDenominator": "two-linear", "pfNum1": 5, "pfNum0": 1, "pfRoot1": 1, "pfRoot2": -2, "pfFrom": 2, "pfTo": 4, "xProbe": 3 }, "run": "static",
    "expect": { "coefA": { "value": 2, "absTol": 1e-9 }, "coefB": { "value": 3, "absTol": 1e-9 }, "pfIntegral": { "value": 3.413619901661, "absTol": 1e-9 },
                "fAtProbe": { "value": 1.6, "absTol": 1e-9 }, "piecesAtProbe": { "value": 1.6, "absTol": 1e-9 } } },
  { "name": "three linear factors: 1, 1/2, 1/2", "params": { "pfDenominator": "three-linear", "pfNum2": 2, "pfNum1": 0, "pfNum0": -1, "pfRoot1": 0, "pfRoot2": 1, "pfRoot3": -1, "pfFrom": 2, "pfTo": 3, "xProbe": 2 }, "run": "static",
    "expect": { "coefA": { "value": 1, "absTol": 1e-9 }, "coefB": { "value": 0.5, "absTol": 1e-9 }, "coefC": { "value": 0.5, "absTol": 1e-9 },
                "pfIntegral": { "value": 0.895879734614, "absTol": 1e-9 }, "fAtProbe": { "value": 1.166666666667, "absTol": 1e-9 }, "piecesAtProbe": { "value": 1.166666666667, "absTol": 1e-9 } } },
  { "name": "linear and quadratic: 2/(x - 1) + (x + 3)/(x^2 + 4)", "params": { "pfDenominator": "linear-quadratic", "pfNum2": 3, "pfNum1": 2, "pfNum0": 5, "pfRoot1": 1, "pfQ": 4, "pfFrom": 2, "pfTo": 4, "xProbe": 3 }, "run": "static",
    "expect": { "coefA": { "value": 2, "absTol": 1e-9 }, "coefB": { "value": 1, "absTol": 1e-9 }, "coefC": { "value": 3, "absTol": 1e-9 },
                "pfIntegral": { "value": 3.137995774868, "absTol": 1e-9 }, "fAtProbe": { "value": 1.461538461538, "absTol": 1e-9 }, "piecesAtProbe": { "value": 1.461538461538, "absTol": 1e-9 } } },
  { "name": "zero coefficient (preset)", "preset": "zero-coefficient", "params": { "xProbe": 3 }, "run": "static",
    "expect": { "coefA": { "value": 0, "absTol": 1e-9 }, "coefB": { "value": 1, "absTol": 1e-9 }, "pfIntegral": { "value": 0.405465108108, "absTol": 1e-9 }, "fAtProbe": { "value": 0.2, "absTol": 1e-9 } } }
]
```
