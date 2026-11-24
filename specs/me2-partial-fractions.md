---
id: me2-partial-fractions
title: "Partial fractions decomposer"
subject: me2
engine: fnplot
setup: partial-fractions
priority: P2
status: approved            # stub → draft → approved (Gate B)
page: /interactives/maths-ext2/partial-fractions.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Mathematics Extension 2","version":"2024","area":"Calculus","focusArea":"Further integration","year":12,"outcomes":[],"verified":false}
---
# Partial fractions decomposer

> Backlog summary: Decompose a rational function and graph each piece.

## Learning goal
Students decompose a rational function whose denominator is a product of distinct linear factors into partial fractions, dividing first when the fraction is improper. They see that the pieces add back to the original graph, that each vertical asymptote belongs to exactly one piece, and that a zero coefficient means the factor cancels (a hole, not an asymptote). They link each piece A/(x − r) to its integral A ln|x − r|, which is why the decomposition is worth doing. Repeated linear factors are available as an extension.

## What the student sees
The stage at 1920×1080 shows one large graph, x from −6 to 6 and y from −6 to 6 (zoomable), with tick labels at least 18 px.

- **The identity** sits above the graph with the current numbers, for example "(5x + 1)/((x + 2)(x − 1)) = 3/(x + 2) + 2/(x − 1)". When the fraction is improper, the quotient from long division comes first, for example "(x³ + 2)/((x + 1)(x − 1)) = x − (1/2)/(x + 1) + (3/2)/(x − 1)".
- **The original function** is a thick orange curve.
- **Each piece** (with **Graph each partial fraction** on) is a thinner curve in its own colour and dash pattern (dashed, dotted, dash-dot, short dash). The quotient, if there is one, is drawn too. A legend at the top right lists each piece with its coefficient, A₁, A₂, … in order of the roots from smallest to largest.
- **The roots of the denominator** are square handles on the x-axis. Dragging one moves that factor (snapping to 0.5) and the decomposition updates.

This setup is static: there is no play button.

## Parameters
Keys are from the `fnplot` engine meta in PR #28 (the fnplot engine).

| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| pfNumerator | Numerator coefficients, highest power first | | −50 | 50 | | 3, 1 (engine default; this page's default preset sets 5, 1) | list of 1 to 5 numbers: "5, 1" means 5x + 1. An improper fraction is divided first |
| pfRoots | Denominator roots | | −6 | 6 | | 1, −2 | list of 1 to 4 numbers: "1, −2" means (x − 1)(x + 2); the denominator is monic. Repeating a root gives a repeated factor (extension) |
| showTerms | Graph each partial fraction | | | | | on | boolean |
| piTicks | Label x in multiples of π | | | | | off | boolean (not needed here; shared fnplot key) |

Definitions (from the engine):
- The denominator is D(x) = Π(x − rᵢ). The numerator N(x) is divided by D(x) first, giving a quotient and a remainder. The remainder over D(x) is written as Σ A/(x − r)ᵏ.
- The coefficients are found by solving the linear system from equating coefficients, so the substitution ("cover-up") values are reproduced exactly: for distinct roots, Aᵢ = N(rᵢ)/Π_(j≠i)(rᵢ − rⱼ).
- Terms are ordered by root, smallest first, and for a repeated root by power: 1/(x − r), then 1/(x − r)², and so on.
- `pfA`, `pfB`, `pfC`, `pfD` are the coefficients of the first to fourth terms, null beyond the number of terms.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | numerator 5, 1; roots 1, −2; pieces on | (5x + 1)/((x − 1)(x + 2)) = 3/(x + 2) + 2/(x − 1) |
| three-linear | numerator 3, 1, −1; roots 0, 1, −1 | (3x² + x − 1)/(x(x − 1)(x + 1)) = (1/2)/(x + 1) + 1/x + (3/2)/(x − 1) |
| zero-coefficient | numerator 1, −1; roots 1, −2 | (x − 1)/((x − 1)(x + 2)): the factor x − 1 cancels, so its coefficient is 0 and x = 1 is a hole, not an asymptote |
| improper | numerator 1, 0, 0, 2; roots 1, −1 | (x³ + 2)/(x² − 1): divide first to get the quotient x, then decompose the remainder (x + 2)/(x² − 1) |
| repeated | numerator 1, 3; roots 1, 1 | extension: (x + 3)/(x − 1)² = 1/(x − 1) + 4/(x − 1)² |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| pfA | A₁ | | 4 |
| pfB | A₂ | | 4 |
| pfC | A₃ | | 4 |
| pfD | A₄ | | 4 |

## Assumptions shown on stage
- Denominator is a product of linear factors (x − r), leading coefficient 1
- Improper fractions are divided first
- ln|x − r| is used for each piece, so an integral must not cross an asymptote

## Try this (3–5 predict, observe, explain prompts)
1. Predict: in the default scenario, which piece will be largest just to the right of x = 1, and which near x = −2? Check against the dashed and dotted curves.
2. Observe: drag the root at x = 1 towards x = −2. What happens to the two coefficients as the roots get close, and why?
3. Predict: what numerator makes the coefficient for (x − 1) equal 0 when the denominator is (x − 1)(x + 2)? Try your idea, then load "Zero coefficient". What happens to the asymptote at x = 1?
4. Observe: in "Improper", turn the pieces on and off. Which curve does the graph approach as x grows large, and why?
5. Explain: integrate the default decomposition from x = 2 to x = 4 by hand. Why could you not integrate it from x = 0 to x = 2?

## Teacher notes outline
- Misconceptions to target:
  - decomposing an improper fraction without dividing first;
  - mixing up which coefficient belongs to which factor (the page orders them by root);
  - a numerator that cancels a factor still leaves an asymptote;
  - ∫ 1/(x − r) dx = ln(x − r) without the absolute value;
  - integrating across an asymptote as if nothing happens;
  - using a constant numerator over an irreducible quadratic factor (B/(x² + q) instead of (Bx + C)/(x² + q)); worth raising even though this page has linear factors only.
- 10-minute lesson flow:
  - (1) default: predict the coefficients by substitution, then reveal and compare with the curves (3 min);
  - (2) three-linear: substitution for three factors (2 min);
  - (3) zero coefficient and improper: cancelling factors, and dividing first (3 min);
  - (4) integrate the default from 2 to 4 on the board, 3 ln(6/4) + 2 ln 3 ≈ 3.414, and discuss why an interval containing x = 1 or x = −2 is not allowed (2 min).
- Original HSC-style question idea: (a) Find A, B and C such that (x² + x + 2)/(x(x + 1)(x + 2)) = A/x + B/(x + 1) + C/(x + 2). (b) Hence show that ∫₁² (x² + x + 2)/(x(x + 1)(x + 2)) dx = ln(128/81). (Answer: A = 1, B = −2, C = 2; the integral is ln 2 − 2 ln(3/2) + 2 ln(4/3) = 7 ln 2 − 4 ln 3.) Write the full question and worked solution in the notes file.

## Accessibility notes
- Second cues beyond colour: each piece has its own dash pattern and a legend entry with its formula and coefficient; the original curve is thicker; roots are square handles.
- Keyboard: the numerator and the roots are text fields (comma lists), so nothing needs a pointer.
- Stage aria-label (from the engine's `describe()`), giving the decomposition in words, for example: "(5x + 1) over (x − 1)(x + 2) equals 3 over (x + 2) plus 2 over (x − 1)."

## Engine change requests
Keys and outputs above match the `fnplot` meta in PR #28. Requests (not used by the acceptance block below):
- **Removable points:** when a coefficient is zero to within 1e-9 × max(1, |N|) (exact cancellation can leave about 1e-17, for example numerator 3, −0.3 with roots 0.1, −2), drop that piece from the graph and legend. Draw a hollow ring on the curve at the cancelled root and no asymptote there.
- **Integral readout** `pfIntegral` over a chosen interval [a, b], evaluated from the antiderivative of the pieces (A ln|x − r| and −A/((k − 1)(x − r)^(k−1)) for repeated factors). It is NaN when a pole with a non-zero coefficient lies in [a, b], and stays finite across a removable point. Test value: the default on [2, 4] gives 3 ln(6/4) + 2 ln 3 = 3.413619902.
- **Probe readouts** `fAtProbe` and `piecesAtProbe` at a draggable x, showing the pieces adding up to f.
- **Irreducible quadratic factors** (x² + q) with a (Bx + C)/(x² + q) piece and its tan⁻¹ integral, which the Ext 2 course includes. Test values: (3x² + 2x + 5)/((x − 1)(x² + 4)) = 2/(x − 1) + (x + 3)/(x² + 4), and its integral from 2 to 4 is 3.137995775.

## Acceptance
Every number below comes from the formula and hand calculation shown here. All checks are static. The coefficients come from a linear solve, so the tolerance is 1e-9. Coefficient i belongs to the i-th term in the engine's order: roots from smallest to largest. All five checks were also run through the fnplot engine's own model.

- **Check 1, two linear factors (default).** N = 5x + 1, roots 1 and −2. In order of root: x = −2 gives N(−2)/(−2 − 1) = (−10 + 1)/(−3) = **3** (A₁, for x + 2); x = 1 gives N(1)/(1 − (−2)) = 6/3 = **2** (A₂, for x − 1). Check: 3(x − 1) + 2(x + 2) = 5x + 1.
- **Check 2, three linear factors, all different.** N = 3x² + x − 1, roots 0, 1, −1, in order −1, 0, 1. x = −1: N(−1)/((−1 − 0)(−1 − 1)) = (3 − 1 − 1)/2 = **0.5**; x = 0: N(0)/((0 + 1)(0 − 1)) = −1/−1 = **1**; x = 1: N(1)/((1 + 1)(1 − 0)) = 3/2 = **1.5**. Check at x = 2: N(2)/(2 × 1 × 3) = 13/6, and 0.5/3 + 1/2 + 1.5/1 = 13/6. The three coefficients differ, so a swapped order would fail.
- **Check 3, a cancelled factor.** N = x − 1, roots 1 and −2. x = −2: N(−2)/(−2 − 1) = −3/−3 = **1** (A₁); x = 1: N(1)/3 = 0/3 = **0** (A₂). So f = 1/(x + 2) for x ≠ 1.
- **Check 4, improper: divide first.** N = x³ + 2, D = x² − 1. Long division: x³ + 2 = x(x² − 1) + (x + 2), so the quotient is x and the remainder is x + 2. Then (x + 2)/((x + 1)(x − 1)): x = −1 gives (−1 + 2)/(−1 − 1) = **−0.5** (A₁); x = 1 gives (1 + 2)/(1 + 1) = **1.5** (A₂).
- **Check 5, a repeated factor (extension).** N = x + 3, roots 1, 1. x + 3 = A(x − 1) + B, so A = **1** (A₁, for 1/(x − 1)) and, at x = 1, B = **4** (A₂, for 1/(x − 1)²).

```acceptance
[
  { "name": "two linear factors: 3/(x + 2) + 2/(x - 1)", "params": { "pfNumerator": [5, 1], "pfRoots": [1, -2] }, "run": "static",
    "expect": { "pfA": { "value": 3, "absTol": 1e-9 }, "pfB": { "value": 2, "absTol": 1e-9 } } },
  { "name": "three linear factors: 1/2, 1, 3/2 in root order", "params": { "pfNumerator": [3, 1, -1], "pfRoots": [0, 1, -1] }, "run": "static",
    "expect": { "pfA": { "value": 0.5, "absTol": 1e-9 }, "pfB": { "value": 1, "absTol": 1e-9 }, "pfC": { "value": 1.5, "absTol": 1e-9 } } },
  { "name": "a cancelled factor has coefficient 0 (preset)", "preset": "zero-coefficient", "params": {}, "run": "static",
    "expect": { "pfA": { "value": 1, "absTol": 1e-9 }, "pfB": { "value": 0, "absTol": 1e-9 } } },
  { "name": "improper fraction: divide first", "params": { "pfNumerator": [1, 0, 0, 2], "pfRoots": [1, -1] }, "run": "static",
    "expect": { "pfA": { "value": -0.5, "absTol": 1e-9 }, "pfB": { "value": 1.5, "absTol": 1e-9 } } },
  { "name": "repeated factor (extension): 1/(x - 1) + 4/(x - 1)^2", "params": { "pfNumerator": [1, 3], "pfRoots": [1, 1] }, "run": "static",
    "expect": { "pfA": { "value": 1, "absTol": 1e-9 }, "pfB": { "value": 4, "absTol": 1e-9 } } }
]
```
