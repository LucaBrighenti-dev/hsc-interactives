---
id: me1-roots-coefficients
title: "Roots and coefficients"
subject: me1
engine: fnplot
setup: polynomial
priority: P1
status: approved            # stub → draft → approved (Gate B)
page: /interactives/maths-ext1/roots-coefficients.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Mathematics Extension 1","version":"2024","area":"Functions","focusArea":"Polynomials","year":11,"outcomes":[],"verified":false}
---
# Roots and coefficients

> Backlog summary: Drag roots; watch the sum, pairwise sum and product of roots update; multiplicity shapes.

## Learning goal
Students connect the roots of a polynomial with its coefficients: for P(x) = axⁿ + bxⁿ⁻¹ + cxⁿ⁻² + …, the sum of the roots is −b/a, the sum of the products of pairs is c/a, and so on with alternating signs, ending with the product of the roots (±(constant)/a). They also see how a root's multiplicity shapes the graph at the x-axis (crossing, touching, or crossing with a flat point of inflection), and how the sign of a and the degree fix the end behaviour.

## What the student sees
Default view at 1920×1080 (projector theme), degree 3, a = 2, roots −1, 0.5 and 3, window −6 ≤ x ≤ 6, −20 ≤ y ≤ 20:

- **Graph (left, about 65% of the stage):** y = P(x) as a thick orange curve. Each root is a large draggable handle on the x-axis (a ring with its Greek letter: α, β, γ, δ), snapping to multiples of 0.1. When two or three handles coincide, they merge into one handle labelled "double" or "triple", and the curve visibly touches (double) or flattens through the axis (triple). The y-intercept is marked and labelled.
- **Expanded form (top):** P(x) in KaTeX with the current coefficients, e.g. P(x) = 2x³ − 5x² − 4x + 3, and the factored form 2(x + 1)(x − 0.5)(x − 3) beneath it.
- **Relationships panel (right):** one row per relationship, each with two columns that always agree: the root side (e.g. α + β + γ = −1 + 0.5 + 3 = 2.5) and the coefficient side (−b/a = −(−5)/2 = 2.5). Rows: sum of roots, sum of products of pairs, sum of products of triples (quartic only), product of roots. When a root moves, both columns update together.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| degree | Degree | | 2 | 4 | 1 | 3 | integer; segmented 2 / 3 / 4 |
| lead | Leading coefficient size \|a\| | | 0.25 | 5 | 0.25 | 2 | |
| negativeLead | Negative leading coefficient | | | | | off | a = −lead when on |
| r1 | Root α | | −5 | 5 | 0.1 | −1 | draggable on the x-axis |
| r2 | Root β | | −5 | 5 | 0.1 | 0.5 | |
| r3 | Root γ | | −5 | 5 | 0.1 | 3 | used when degree ≥ 3 |
| r4 | Root δ | | −5 | 5 | 0.1 | 2 | used when degree = 4 |
| showFactored | Factored form | | | | | on | |
| showRelations | Relationships panel | | | | | on | |
| xMin | Window x from | | −20 | 20 | 0.5 | −6 | |
| xMax | Window x to | | −20 | 20 | 0.5 | 6 | |
| yMin | Window y from | | −200 | 200 | 1 | −20 | |
| yMax | Window y to | | −200 | 200 | 1 | 20 | |

The leading coefficient is a magnitude plus a sign toggle so that a can never be 0. Only real roots are draggable; complex roots are outside this page's scope.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | degree 3, a = 2, roots −1, 0.5, 3 | A cubic with a ≠ 1, so the ratios matter |
| monic-cubic | degree 3, a = 1, roots 1, 2, 3 | P(x) = x³ − 6x² + 11x − 6 |
| double-root | degree 3, a = 1, roots 2, 2, −1 | The graph touches at x = 2 |
| triple-root | degree 3, a = 1, roots 1, 1, 1, window y −10 to 10 | A stationary point of inflection on the axis |
| quartic | degree 4, a = −1, roots −2, −1, 1, 2, window y −10 to 10 | Negative leading coefficient: both ends point down; the sum of roots is 0 |
| quadratic | degree 2, a = 1, roots 3, −5 | α + β = −b/a and αβ = c/a for a quadratic |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| sumRoots | Sum of roots | | 4 |
| sumPairs | Sum of products of pairs | | 4 |
| sumTriples | Sum of products of triples | | 4 |
| productRoots | Product of roots | | 4 |
| coefB | Coefficient b | | 4 |
| coefC | Coefficient c | | 4 |
| coefD | Coefficient d | | 4 |
| coefE | Coefficient e | | 4 |
| yIntercept | y-intercept P(0) | | 4 |
| distinctRoots | Distinct roots | | integer (`integer: true`) |

- P(x) = a(x − α)(x − β)… expanded as axⁿ + bxⁿ⁻¹ + cxⁿ⁻² + dxⁿ⁻³ + exⁿ⁻⁴; coefficients beyond the degree are NaN (so coefD and coefE are NaN for a quadratic, coefE for a cubic).
- `sumTriples` is NaN unless the degree is 4. For a cubic the product of roots is the only triple product.
- `distinctRoots` counts roots that differ by more than 1e-9 (roots snap to multiples of 0.1, so equal handles are exactly equal).

## Assumptions shown on stage
- Real roots only, snapped to multiples of 0.1
- P(x) = a(x − α)(x − β)…, so a ≠ 0

## Try this (3–5 predict, observe, explain prompts)
1. Predict: if you drag α one unit to the right, how much does the sum of the roots change? Which coefficient changes in step with the sum, and by how much (it is −a per unit)?
2. Observe: drag β onto γ. What happens to the graph at that root, and what happens to the relationships panel?
3. Predict: for the monic cubic with roots 1, 2, 3, what is P(0)? Check the y-intercept.
4. Observe: in the quartic preset, switch the sign of a. Which relationships change and which stay the same?
5. Explain: why does the product of the roots of a cubic equal −d/a, but the product of the roots of a quartic equal +e/a?

## Teacher notes outline
- Misconceptions to target: the sum of roots is b/a (the sign alternates, starting with −b/a); the product of roots is always constant/a (the sign depends on the degree); multiplying P by a constant changes the roots; a double root means the graph crosses twice; forgetting to divide by a when a ≠ 1.
- 10-minute lesson flow: 0–2 min predict the effect of dragging one root; 2–4 min expand 2(x + 1)(x − 0.5)(x − 3) on the board and compare with the panel; 4–6 min the double and triple root presets; 6–8 min the quartic and the sign pattern; 8–10 min challenge: build a cubic with sum of roots 0 and product 6.
- Original HSC-style question idea: the roots of 2x³ + x² + kx + 6 = 0 are α, β and γ, and two of the roots are reciprocals of each other. (a) Find the value of the third root. (b) Find k. (c) Hence find all three roots. (Answers: γ = −3, k = −13, roots 2, 1/2 and −3.) Full question and worked solution go in the notes file.

## Accessibility notes
- Second cues beyond colour: roots are rings labelled with Greek letters; merged roots are labelled "double" or "triple" in text; each relationship row pairs a root expression with a coefficient expression and the two always show the same number.
- Keyboard: every root is a panel slider as well as a stage handle (arrow keys move a focused handle by 0.1); the sign of a is a toggle.
- Stage aria-label (from `describe()`), for example: "Cubic P of x equals 2x cubed minus 5x squared minus 4x plus 3, with roots −1, 0.5 and 3. Sum of roots 2.5, sum of pairs −2, product −1.5."

## Engine change requests
The fnplot engine's `meta` was not yet on `origin` when this spec was written (only `parser.js`), so these are **keys to reconcile with engine meta**:
- Params (setup `polynomial`): `degree`, `lead`, `negativeLead`, `r1`, `r2`, `r3`, `r4`, `showFactored`, `showRelations`, `xMin`, `xMax`, `yMin`, `yMax` (the polynomial setup needs a wider y range than other setups; if the window keys are shared, their range should cover −200 to 200).
- Outputs: `sumRoots`, `sumPairs`, `sumTriples`, `productRoots`, `coefB`, `coefC`, `coefD`, `coefE`, `yIntercept`, `distinctRoots`.
- `polynomial` listed in `meta.staticSetups`; draggable root handles on the x-axis that snap to 0.1.

## Acceptance
Every number below comes from the formula and hand calculation shown here. All are exact (tolerance 1e-9).

- **Check 1, default.** P(x) = 2(x + 1)(x − 0.5)(x − 3). (x + 1)(x − 0.5) = x² + 0.5x − 0.5; times (x − 3): x³ + 0.5x² − 0.5x − 3x² − 1.5x + 1.5 = x³ − 2.5x² − 2x + 1.5; times 2: **2x³ − 5x² − 4x + 3**, so b = **−5**, c = **−4**, d = **3**, P(0) = **3**. Roots: sum −1 + 0.5 + 3 = **2.5** (= −b/a = 5/2); pairs (−1)(0.5) + (−1)(3) + (0.5)(3) = −0.5 − 3 + 1.5 = **−2** (= c/a = −4/2); product (−1)(0.5)(3) = **−1.5** (= −d/a = −3/2). **3** distinct roots.
- **Check 2, monic cubic.** (x − 1)(x − 2)(x − 3) = **x³ − 6x² + 11x − 6**: b = −6, c = 11, d = −6; sum 6, pairs 2 + 3 + 6 = 11, product 6.
- **Check 3, double root.** (x − 2)²(x + 1) = (x² − 4x + 4)(x + 1) = x³ + x² − 4x² − 4x + 4x + 4 = **x³ − 3x² + 0x + 4**: b = −3, c = **0**, d = 4. Sum 2 + 2 − 1 = **3**; pairs 4 − 2 − 2 = **0**; product **−4**; **2** distinct roots.
- **Check 4, quartic with a = −1.** −(x + 2)(x + 1)(x − 1)(x − 2) = −(x² − 1)(x² − 4) = −(x⁴ − 5x² + 4) = **−x⁴ + 5x² − 4**: b = **0**, c = **5**, d = **0**, e = **−4**, P(0) = −4. Sum of roots **0** (= −b/a); pairs (−2)(−1) + (−2)(1) + (−2)(2) + (−1)(1) + (−1)(2) + (1)(2) = 2 − 2 − 4 − 1 − 2 + 2 = **−5** (= c/a = 5/(−1)); triples **0** (= −d/a); product (−2)(−1)(1)(2) = **4** (= e/a = −4/(−1)).
- **Check 5, quadratic.** (x − 3)(x + 5) = **x² + 2x − 15**: b = 2, c = −15; sum −2 (= −b/a), product −15 (= c/a). coefD is NaN (not checked).
- **Check 6, quartic with a = 0.5.** 0.5(x + 3)(x + 1)(x − 2)(x − 4). (x + 3)(x + 1) = x² + 4x + 3 and (x − 2)(x − 4) = x² − 6x + 8; their product is x⁴ − 2x³ − 13x² + 14x + 24; halved: **0.5x⁴ − x³ − 6.5x² + 7x + 12**. Sum of roots **2** = −(−1)/0.5; pairs **−13** = −6.5/0.5; triples **−14** = −7/0.5; product (−3)(−1)(2)(4) = **24** = 12/0.5.

```acceptance
[
  { "name": "default cubic 2(x + 1)(x - 0.5)(x - 3)",
    "params": { "degree": 3, "lead": 2, "negativeLead": false, "r1": -1, "r2": 0.5, "r3": 3 },
    "run": "static",
    "expect": {
      "coefB": { "value": -5, "absTol": 1e-9 },
      "coefC": { "value": -4, "absTol": 1e-9 },
      "coefD": { "value": 3, "absTol": 1e-9 },
      "sumRoots": { "value": 2.5, "absTol": 1e-9 },
      "sumPairs": { "value": -2, "absTol": 1e-9 },
      "productRoots": { "value": -1.5, "absTol": 1e-9 },
      "yIntercept": { "value": 3, "absTol": 1e-9 },
      "distinctRoots": { "value": 3, "absTol": 1e-9 } } },
  { "name": "monic cubic with roots 1, 2, 3",
    "params": { "degree": 3, "lead": 1, "negativeLead": false, "r1": 1, "r2": 2, "r3": 3 },
    "run": "static",
    "expect": {
      "coefB": { "value": -6, "absTol": 1e-9 },
      "coefC": { "value": 11, "absTol": 1e-9 },
      "coefD": { "value": -6, "absTol": 1e-9 },
      "sumRoots": { "value": 6, "absTol": 1e-9 },
      "sumPairs": { "value": 11, "absTol": 1e-9 },
      "productRoots": { "value": 6, "absTol": 1e-9 } } },
  { "name": "double root at 2",
    "params": { "degree": 3, "lead": 1, "negativeLead": false, "r1": 2, "r2": 2, "r3": -1 },
    "run": "static",
    "expect": {
      "coefB": { "value": -3, "absTol": 1e-9 },
      "coefC": { "value": 0, "absTol": 1e-9 },
      "coefD": { "value": 4, "absTol": 1e-9 },
      "sumRoots": { "value": 3, "absTol": 1e-9 },
      "sumPairs": { "value": 0, "absTol": 1e-9 },
      "productRoots": { "value": -4, "absTol": 1e-9 },
      "distinctRoots": { "value": 2, "absTol": 1e-9 } } },
  { "name": "quartic with a = -1 and roots -2, -1, 1, 2",
    "params": { "degree": 4, "lead": 1, "negativeLead": true, "r1": -2, "r2": -1, "r3": 1, "r4": 2 },
    "run": "static",
    "expect": {
      "coefB": { "value": 0, "absTol": 1e-9 },
      "coefC": { "value": 5, "absTol": 1e-9 },
      "coefD": { "value": 0, "absTol": 1e-9 },
      "coefE": { "value": -4, "absTol": 1e-9 },
      "sumRoots": { "value": 0, "absTol": 1e-9 },
      "sumPairs": { "value": -5, "absTol": 1e-9 },
      "sumTriples": { "value": 0, "absTol": 1e-9 },
      "productRoots": { "value": 4, "absTol": 1e-9 },
      "yIntercept": { "value": -4, "absTol": 1e-9 } } },
  { "name": "quadratic with roots 3 and -5",
    "params": { "degree": 2, "lead": 1, "negativeLead": false, "r1": 3, "r2": -5 },
    "run": "static",
    "expect": {
      "coefB": { "value": 2, "absTol": 1e-9 },
      "coefC": { "value": -15, "absTol": 1e-9 },
      "sumRoots": { "value": -2, "absTol": 1e-9 },
      "productRoots": { "value": -15, "absTol": 1e-9 } } },
  { "name": "quartic with a = 0.5 and roots -3, -1, 2, 4",
    "params": { "degree": 4, "lead": 0.5, "negativeLead": false, "r1": -3, "r2": -1, "r3": 2, "r4": 4 },
    "run": "static",
    "expect": {
      "coefB": { "value": -1, "absTol": 1e-9 },
      "coefC": { "value": -6.5, "absTol": 1e-9 },
      "coefD": { "value": 7, "absTol": 1e-9 },
      "coefE": { "value": 12, "absTol": 1e-9 },
      "sumRoots": { "value": 2, "absTol": 1e-9 },
      "sumPairs": { "value": -13, "absTol": 1e-9 },
      "sumTriples": { "value": -14, "absTol": 1e-9 },
      "productRoots": { "value": 24, "absTol": 1e-9 } } }
]
```
