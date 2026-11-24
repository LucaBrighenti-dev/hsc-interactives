---
id: me1-pascal-binomial
title: "Pascal's triangle and the binomial theorem"
subject: me1
engine: custom
setup: none
priority: P2
status: draft            # stub → draft → approved (Gate B)
page: /interactives/maths-ext1/pascal-binomial.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Mathematics Extension 1","version":"2024","area":"Combinatorics","focusArea":"The binomial theorem","year":11,"outcomes":[],"verified":false}
---
# Pascal's triangle and the binomial theorem

> Backlog summary: Pascal's triangle linked to expansion coefficients; general-term finder.

## Learning goal
Students connect row n of Pascal's triangle with the coefficients ⁿCₖ in the expansion of (a + b)ⁿ, explain Pascal's identity ⁿCₖ = ⁿ⁻¹Cₖ₋₁ + ⁿ⁻¹Cₖ from the triangle's addition rule, and use the general term Tₖ₊₁ = ⁿCₖ aⁿ⁻ᵏ bᵏ to find a particular term, such as the coefficient of x³ or the term independent of x, in expansions like (2x² − 1/x)⁶. They also see that the row sum is 2ⁿ and that substituting x = 1 gives the sum of the coefficients.

## What the student sees
Default view at 1920×1080 (projector theme), (x + 1)⁶, term k = 2 highlighted:

- **Pascal's triangle (left half):** rows 0 to n as hexagonal cells with their values, centred. Row n is outlined in orange. The highlighted entry ⁿCₖ is filled orange; with the identity toggle on, the two cells above it (ⁿ⁻¹Cₖ₋₁ and ⁿ⁻¹Cₖ) are filled with a hatch pattern and joined to it by arrows, with "5 + 10 = 15" written beside them. The row sum is printed at the end of each row ("= 64").
- **Expansion (right half, top):** the expression (p xᵅ + q xᵝ)ⁿ in KaTeX, then the full expansion term by term, each term in its own box: ⁿCₖ (p xᵅ)ⁿ⁻ᵏ (q xᵝ)ᵏ and its simplified form. The highlighted term's box matches the highlighted triangle cell.
- **General term (right half, middle):** Tₖ₊₁ = ⁿCₖ (p xᵅ)ⁿ⁻ᵏ (q xᵝ)ᵏ = ⁿCₖ pⁿ⁻ᵏ qᵏ x^(α(n − k) + βk), with the current numbers substituted.
- **Term finder (right half, bottom):** "Find the term in x^r": the equation α(n − k) + βk = r solved for k, with the answer, or the message "no whole-number k: there is no x^r term".

## Parameters
This is a custom page (`site/assets/engines/custom/me1-pascal-binomial/`); the spec defines the engine. Suggested single setup name: `binomial`, listed in `meta.staticSetups`.

| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| n | Power n | | 0 | 16 | 1 | 6 | integer; also the last row of the triangle shown |
| p | First term: coefficient p | | −5 | 5 | 1 | 1 | integer |
| alpha | First term: power of x, α | | −3 | 3 | 1 | 1 | integer |
| q | Second term: coefficient q | | −5 | 5 | 1 | 1 | integer |
| beta | Second term: power of x, β | | −3 | 3 | 1 | 0 | integer |
| k | Highlighted term k (Tₖ₊₁) | | 0 | 16 | 1 | 2 | integer; the engine uses min(k, n) |
| targetPower | Find the term in x^r, r = | | −48 | 48 | 1 | 0 | integer |
| showIdentity | Pascal's identity | | | | | on | |
| showExpansion | Full expansion | | | | | on | hidden automatically for n > 10 (too long to read) |

The expansion is (p xᵅ + q xᵝ)ⁿ. Examples: (x + 1)ⁿ is p = 1, α = 1, q = 1, β = 0; (2x + 3)⁵ is p = 2, α = 1, q = 3, β = 0; (x + 1/x)⁸ is p = 1, α = 1, q = 1, β = −1. Exact integer arithmetic: the engine works in BigInt and converts outputs to Number. Every term coefficient in these ranges is below 2⁵³ in size (at most ¹⁶C₈ × 5¹⁶ ≈ 1.96 × 10¹⁵), so they convert exactly; only the largest sums of coefficients (up to 10¹⁶) may be rounded in the last digit on display.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | (x + 1)⁶, k = 2 | Row 6 of Pascal's triangle: 1, 6, 15, 20, 15, 6, 1 |
| linear | (2x + 3)⁵, k = 2, target r = 3 | Coefficients are not just the triangle's numbers |
| independent | (x + 1/x)⁸, target r = 0 | The term independent of x: 8 − 2k = 0 |
| harder | (2x² − 1/x)⁶, target r = 3 | Powers from both terms: 12 − 3k = 3 |
| negative | (x − 2)⁷, k = 3 | Alternating signs |
| big-row | (x + 1)¹⁶, k = 8 | The middle of row 16 and the row sum 2¹⁶ |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| binom | ⁿCₖ | | exact integer (`integer: true`) |
| termCoeff | Coefficient of Tₖ₊₁ | | exact integer (`integer: true`) |
| termPower | Power of x in Tₖ₊₁ | | exact integer |
| rowSum | Row sum 2ⁿ | | exact integer (`integer: true`) |
| coeffSum | Sum of all coefficients (p + q)ⁿ | | exact integer (`integer: true`) |
| pascalLeft | ⁿ⁻¹Cₖ₋₁ (above left) | | exact integer |
| pascalRight | ⁿ⁻¹Cₖ (above right) | | exact integer |
| targetK | k for the x^r term | | exact integer |
| targetCoeff | Coefficient of x^r | | exact integer (`integer: true`) |

- binom = ⁿCₖ; termCoeff = ⁿCₖ pⁿ⁻ᵏ qᵏ; termPower = α(n − k) + βk; rowSum = 2ⁿ; coeffSum = (p + q)ⁿ.
- pascalLeft = ⁿ⁻¹Cₖ₋₁ and pascalRight = ⁿ⁻¹Cₖ, with ᵐCⱼ = 0 when j < 0 or j > m (so pascalLeft + pascalRight = binom for n ≥ 1).
- targetK: the whole number k with 0 ≤ k ≤ n and α(n − k) + βk = r; NaN (shown as "none") if there is none. targetCoeff = ⁿC_targetK p^(n − targetK) q^targetK, or 0 when there is no such term. If α = β every term has power αn: targetCoeff = (p + q)ⁿ when r = αn (else 0) and targetK is NaN.

## Assumptions shown on stage
- n is a whole number from 0 to 16
- The two terms are p xᵅ and q xᵝ with whole-number p, q, α, β
- Terms are numbered from T₁ (k = 0)

## Try this (3–5 predict, observe, explain prompts)
1. Predict: what is the sum of the numbers in row 6 of Pascal's triangle? Check the row sum, then explain it by putting x = 1 in (x + 1)⁶.
2. Observe: turn on Pascal's identity and move k along row 6. Which two numbers always add to the highlighted one?
3. Predict: in the linear preset, (2x + 3)⁵, is the coefficient of x³ equal to ⁵C₂ = 10? Find it and explain the difference.
4. Observe: in the independent preset, try r = 3. Why is there no x³ term in (x + 1/x)⁸?
5. Explain: in the harder preset, why does k = 3 give the x³ term? Write the power of x in the general term first.

## Teacher notes outline
- Misconceptions to target: the coefficient of a term is just ⁿCₖ (forgetting pⁿ⁻ᵏ qᵏ); Tₖ is ⁿCₖ … (it is Tₖ₊₁); losing the sign of a negative second term; thinking (x + 1/x)ⁿ always has an x^r term; counting rows from 1 instead of 0.
- 10-minute lesson flow: 0–2 min build rows by the addition rule; 2–4 min link row 6 with (x + 1)⁶ and the row sum; 4–6 min the linear preset and the general term; 6–8 min the independent and harder presets: solve for k first; 8–10 min the negative preset and signs, then a quick challenge.
- Original HSC-style question idea: (a) Write down the general term in the expansion of (3x − 2/x²)⁹. (b) Find the term independent of x. (c) Show that there is no term in x⁴. Full question and worked solution go in the notes file. (Power 9 − 3k; independent term k = 3: ⁹C₃ · 3⁶ · (−2)³ = −489 888; 9 − 3k = 4 has no whole-number solution.)

## Accessibility notes
- Second cues beyond colour: the highlighted cell is filled and outlined, the identity cells are hatched with arrows, and the row is outlined; every number is printed; the term finder answers in words when there is no term.
- Keyboard: all parameters are panel controls; arrow keys move the highlighted cell along the row when the triangle has focus.
- Stage aria-label (from `describe()`), for example: "Pascal's triangle to row 6 and the expansion of (x + 1) to the power 6. Term 3 is 6 choose 2 times x to the 4, coefficient 15. Row sum 64."

## Engine change requests
Custom engine, built in Wave 2 from this spec: params and outputs as above; static (one setup, listed in `meta.staticSetups`); a `model.js` with ⁿCₖ, the general term, the term finder and Pascal's identity, unit-tested against the acceptance numbers below.

## Acceptance
Every number below comes from the formula and hand calculation shown here. All are exact integers (tolerance 1e-9).

- **Check 1, default (x + 1)⁶, k = 2.** ⁶C₂ = 6 × 5/2 = **15**; coefficient 15 × 1⁴ × 1² = **15**; power 1 × 4 + 0 × 2 = **4**. Row sum 2⁶ = **64**; sum of coefficients (1 + 1)⁶ = **64**. Pascal: ⁵C₁ = **5**, ⁵C₂ = **10**, and 5 + 10 = 15.
- **Check 2, linear (2x + 3)⁵.** k = 2: ⁵C₂ = **10**; coefficient 10 × 2³ × 3² = 10 × 8 × 9 = **720**; power 1 × 3 + 0 = **3**. Sum of coefficients (2 + 3)⁵ = **3125**. Target r = 3: 5 − k = 3 gives **k = 2**, coefficient **720**.
- **Check 3, independent (x + 1/x)⁸.** Power 1(8 − k) + (−1)k = 8 − 2k = 0 gives **k = 4**: ⁸C₄ = **70**.
- **Check 4, no x³ term.** 8 − 2k = 3 gives k = 2.5, not a whole number: coefficient **0** (targetK NaN, not checked).
- **Check 5, harder (2x² − 1/x)⁶.** Power 2(6 − k) + (−1)k = 12 − 3k. For x³: 12 − 3k = 3, **k = 3**: ⁶C₃ × 2³ × (−1)³ = 20 × 8 × (−1) = **−160**. For the constant term: 12 − 3k = 0, **k = 4**: ⁶C₄ × 2² × (−1)⁴ = 15 × 4 = **60**. Sum of coefficients (2 − 1)⁶ = **1**.
- **Check 6, negative (x − 2)⁷, k = 3.** ⁷C₃ = **35**; coefficient 35 × 1⁴ × (−2)³ = **−280**; power **4**. Sum of coefficients (1 − 2)⁷ = **−1**.
- **Check 7, big row (x + 1)¹⁶, k = 8.** ¹⁶C₈ = 16!/(8! 8!) = **12 870**; row sum 2¹⁶ = **65 536**; Pascal ¹⁵C₇ = **6435** = ¹⁵C₈, and 6435 + 6435 = 12 870.

```acceptance
[
  { "name": "row 6: (x + 1)^6, k = 2",
    "params": { "n": 6, "p": 1, "alpha": 1, "q": 1, "beta": 0, "k": 2, "targetPower": 0 },
    "run": "static",
    "expect": {
      "binom": { "value": 15, "absTol": 1e-9 },
      "termCoeff": { "value": 15, "absTol": 1e-9 },
      "termPower": { "value": 4, "absTol": 1e-9 },
      "rowSum": { "value": 64, "absTol": 1e-9 },
      "coeffSum": { "value": 64, "absTol": 1e-9 },
      "pascalLeft": { "value": 5, "absTol": 1e-9 },
      "pascalRight": { "value": 10, "absTol": 1e-9 } } },
  { "name": "(2x + 3)^5: the x^3 term",
    "params": { "n": 5, "p": 2, "alpha": 1, "q": 3, "beta": 0, "k": 2, "targetPower": 3 },
    "run": "static",
    "expect": {
      "binom": { "value": 10, "absTol": 1e-9 },
      "termCoeff": { "value": 720, "absTol": 1e-9 },
      "termPower": { "value": 3, "absTol": 1e-9 },
      "coeffSum": { "value": 3125, "absTol": 1e-9 },
      "targetK": { "value": 2, "absTol": 1e-9 },
      "targetCoeff": { "value": 720, "absTol": 1e-9 } } },
  { "name": "(x + 1/x)^8: term independent of x",
    "params": { "n": 8, "p": 1, "alpha": 1, "q": 1, "beta": -1, "k": 4, "targetPower": 0 },
    "run": "static",
    "expect": { "targetK": { "value": 4, "absTol": 1e-9 }, "targetCoeff": { "value": 70, "absTol": 1e-9 } } },
  { "name": "(x + 1/x)^8 has no x^3 term",
    "params": { "n": 8, "p": 1, "alpha": 1, "q": 1, "beta": -1, "k": 4, "targetPower": 3 },
    "run": "static",
    "expect": { "targetCoeff": { "value": 0, "absTol": 1e-9 } } },
  { "name": "(2x^2 - 1/x)^6: the x^3 term",
    "params": { "n": 6, "p": 2, "alpha": 2, "q": -1, "beta": -1, "k": 3, "targetPower": 3 },
    "run": "static",
    "expect": {
      "targetK": { "value": 3, "absTol": 1e-9 },
      "targetCoeff": { "value": -160, "absTol": 1e-9 },
      "termCoeff": { "value": -160, "absTol": 1e-9 },
      "coeffSum": { "value": 1, "absTol": 1e-9 } } },
  { "name": "(2x^2 - 1/x)^6: the constant term",
    "params": { "n": 6, "p": 2, "alpha": 2, "q": -1, "beta": -1, "k": 4, "targetPower": 0 },
    "run": "static",
    "expect": { "targetK": { "value": 4, "absTol": 1e-9 }, "targetCoeff": { "value": 60, "absTol": 1e-9 } } },
  { "name": "(x - 2)^7, k = 3",
    "params": { "n": 7, "p": 1, "alpha": 1, "q": -2, "beta": 0, "k": 3, "targetPower": 0 },
    "run": "static",
    "expect": {
      "binom": { "value": 35, "absTol": 1e-9 },
      "termCoeff": { "value": -280, "absTol": 1e-9 },
      "termPower": { "value": 4, "absTol": 1e-9 },
      "coeffSum": { "value": -1, "absTol": 1e-9 } } },
  { "name": "row 16, middle entry",
    "params": { "n": 16, "p": 1, "alpha": 1, "q": 1, "beta": 0, "k": 8, "targetPower": 0 },
    "run": "static",
    "expect": {
      "binom": { "value": 12870, "absTol": 1e-9 },
      "rowSum": { "value": 65536, "absTol": 1e-9 },
      "pascalLeft": { "value": 6435, "absTol": 1e-9 },
      "pascalRight": { "value": 6435, "absTol": 1e-9 } } }
]
```
