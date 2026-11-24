---
id: me2-conjugate-roots
title: "Conjugate root pairs"
subject: me2
engine: argand
setup: polynomial-roots
priority: P2
status: approved            # stub → draft → approved (Gate B)
page: /interactives/maths-ext2/conjugate-roots.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Mathematics Extension 2","version":"2024","area":"Complex numbers","focusArea":"Introduction to complex numbers","year":12,"outcomes":[],"verified":false}
---
# Conjugate root pairs

> Backlog summary: Drag real polynomial coefficients; complex roots stay mirrored across the real axis.

## Learning goal
Students see that when a polynomial has real coefficients its non-real roots come in conjugate pairs, mirror images in the real axis, so each pair α, ᾱ gives a real quadratic factor z² − 2Re(α)z + |α|². They see that a real cubic must have a real root, that the mirror symmetry breaks as soon as one coefficient is not real, and that the sum and product of the roots follow the coefficients whether or not they are real.

## What the student sees
The stage at 1920×1080 shows a square Argand diagram (equal scales, gridlines every 1 unit, tick labels at least 18 px, from −viewRange to +viewRange on both axes, default ±4).

- **The polynomial** is written in a strip above the plane with its current coefficients, for example "P(z) = z³ − 3z² + 4z − 2", with the list of roots, for example "Roots: 1, 1 + i, 1 − i".
- **Roots:** real roots are filled squares on the real axis and non-real roots are filled dots, each labelled with its value; a repeated root is labelled "×2". With real coefficients, each conjugate pair is joined by a dashed mirror line through the real axis with equal-length marks.
- **Breaking the symmetry:** when the constant term has an imaginary part, the mirror image of each root is no longer a root, and it is drawn as a hollow dashed ring so students see the gap.
- **Legend (top left):** the roots as a list (with "(real)" or "repeated ×2" where they apply), and a note: "Real coefficients, so non-real roots come in conjugate pairs: mirror images in the real axis", or "The constant is not real, so roots need not be mirror images".

This setup is static: there is no play button.

## Parameters
Keys are from the `argand` engine meta, merged to `main` in #13 (first written against commit 8caa8d0; all checks pass on both). The polynomial is P(z) = c_d z^d + … + c₁z + c₀ with d = degree; only c₀ can be given an imaginary part.

| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| degree | Degree | | 1 | 4 | 1 | 3 | integer |
| c4 | Coefficient of z⁴ | | −10 | 10 | 0.1 | 1 | visible when degree is 4 |
| c3 | Coefficient of z³ | | −10 | 10 | 0.1 | 1 | visible when degree is 3 or 4 |
| c2 | Coefficient of z² | | −10 | 10 | 0.1 | −3 | visible when degree is 2, 3 or 4 |
| c1 | Coefficient of z | | −10 | 10 | 0.1 | 4 | |
| c0 | Constant term | | −10 | 10 | 0.1 | −2 | |
| c0Im | Imaginary part of the constant | | −5 | 5 | 0.1 | 0 | anything but 0 makes a coefficient non-real, so the roots need not pair up |
| angleUnit | Show arguments in | | | | | rad | enum: `rad`, `deg` |
| viewRange | Axis range ± | | 1 | 10 | 0.5 | 4 | |

A leading coefficient of 0 lowers the degree. Coefficients above the degree are ignored.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | degree 3, c₃ = 1, c₂ = −3, c₁ = 4, c₀ = −2, imaginary part 0, view 4 | (z − 1)(z² − 2z + 2): one real root and the pair 1 ± i |
| quadratic | degree 2, c₂ = 1, c₁ = 2, c₀ = 5 | z² + 2z + 5 has roots −1 ± 2i; drag c₀ down through 1 to watch them meet on the real axis and split along it |
| cubic-real-root | degree 3, c₃ = 1, c₂ = 0, c₁ = 0, c₀ = 1 | z³ + 1: try to remove the real root by changing the real coefficients (you can't) |
| quartic-pairs | degree 4, c₄ = 1, c₃ = c₂ = c₁ = 0, c₀ = 4 | z⁴ + 4 has four non-real roots ±1 ± i: two conjugate pairs |
| leading-coefficient | degree 2, c₂ = 2, c₁ = −4, c₀ = 4 | sum −c₁/c₂ = 2 and product c₀/c₂ = 2, not −c₁ and c₀ |
| break-symmetry | degree 2, c₂ = 1, c₁ = 0, c₀ = 0, imaginary part −2 | z² = 2i has roots ±(1 + i): not a conjugate pair |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| root1Re | Re root 1 | | 3 |
| root1Im | Im root 1 | | 3 |
| root2Re | Re root 2 | | 3 |
| root2Im | Im root 2 | | 3 |
| root3Re | Re root 3 | | 3 |
| root3Im | Im root 3 | | 3 |
| root4Re | Re root 4 | | 3 |
| root4Im | Im root 4 | | 3 |
| rootSumRe | Sum of roots (Re) | | 3 |
| rootSumIm | Sum of roots (Im) | | 3 |
| rootProductRe | Product of roots (Re) | | 3 |
| rootProductIm | Product of roots (Im) | | 3 |
| realRootCount | Real roots (with multiplicity) | | 1 |

Definitions (from the engine): the roots are found numerically and counted with multiplicity. With real coefficients, roots within 1e-9 (relative) of the real axis are made exactly real and the non-real roots are made exact conjugate pairs. Order: real roots ascending, then non-real roots by real part, each pair with Im > 0 first. Root outputs beyond the degree are NaN. Sums and products are computed from the roots (not from the coefficients), so students see the relationships hold; components below 1e-12 are cleaned to 0.

## Assumptions shown on stage
- Only the constant term may have an imaginary part
- Roots found numerically, shown to 3 significant figures
- Repeated roots are counted with multiplicity

## Try this (3–5 predict, observe, explain prompts)
1. Predict: in the default scenario, drag c₁ slowly. Can you make one root of the complex pair move without the other moving too?
2. Observe: in "Quadratic", drag c₀ from 5 down to −3. Where do the two roots meet, and what happens next? Relate it to the discriminant 4 − 4c₀.
3. Predict: in "Cubic with a real root", is there any choice of real coefficients that leaves the cubic with no real root? Try, then explain using conjugate pairs.
4. Observe: give the constant term a small imaginary part. What happens to the mirror images, and to the sum of the roots?
5. Explain: 1 + i is a root of z³ − 3z² + 4z − 2. Without solving the cubic, explain why 1 − i is also a root and how this gives the third root.

## Teacher notes outline
- Misconceptions to target: complex roots always come in conjugate pairs (only when the coefficients are real); a cubic can have three non-real roots; if 2 + i is a root then −2 − i is too (mixing up the negative and the conjugate); a conjugate pair gives "two linear factors" with no real quadratic behind them; the sum of the roots is −c_{d−1} even when the leading coefficient is not 1.
- 10-minute lesson flow: (1) default: identify the pair and the real root; read off the quadratic factor z² − 2z + 2 (2 min); (2) quadratic: drag c₀ through the double root; link to the discriminant (3 min); (3) cubic with a real root: try to remove it; argue by pairing (2 min); (4) break the symmetry with an imaginary constant term; check that the sum and product still follow the coefficients (3 min).
- Original HSC-style question idea: the polynomial P(z) = z⁴ − 4z³ + 7z² − 8z + 10 has real coefficients, and z = 2 + i is a root. (a) Explain why 2 − i is also a root. (b) Hence express P(z) as a product of two real quadratic factors. (c) Find all the roots of P(z) = 0. (Answer: P(z) = (z² − 4z + 5)(z² + 2), roots 2 ± i and ±i√2.) Write the full question and worked solution in the notes file.

## Accessibility notes
- Second cues beyond colour: real roots are squares and non-real roots are dots, each with a text label; conjugate pairs are joined by dashed mirror lines with equal-length marks; missing mirror images are hollow dashed rings; the legend says in words whether the coefficients are real.
- Keyboard: every coefficient is a slider; the page has no drag-only interaction.
- Stage aria-label (from `describe()`), for example: "Roots of z cubed minus 3 z squared plus 4 z minus 2: a real root at 1 and the conjugate pair 1 ± i, mirror images in the real axis."

## Engine change requests
Keys and outputs above match the `argand` meta now on `main` (#13). Requests (not used by the acceptance block below):
- **Mirror gap** output `mirrorGap`: the largest distance from the conjugate of a root to the nearest root (0 for real coefficients). It turns "the symmetry breaks" into a number. Test values: z² − 2i gives 2 (the conjugate of 1 + i is 1 − i, which is 2 from both roots 1 + i and −1 − i); z² + 2z + 5 + i gives 2p = √(2√17 − 8) = 0.496196787.
- **Real factor labels** (toggle `showFactors`): each conjugate pair labelled with its real quadratic factor z² − 2Re(α)z + |α|², for example "z² − 2z + 2".
- **Graph of P(x)** inset (toggle `showGraph`) for real coefficients, so the x-intercepts line up with the real roots.

## Acceptance
Every number below comes from the formula and hand calculation shown here. All checks are static. For P(z) = c_d z^d + … + c₀, the sum of the roots is −c_{d−1}/c_d and the product is (−1)^d c₀/c_d. The roots are found numerically, so root-based values use an absolute tolerance of 1e-6 (an independent Durand–Kerner run agreed with every value below to better than 1e-12); counts use 1e-9. Root numbers follow the engine's order: real roots ascending, then non-real roots by real part, each pair with Im > 0 first.

- **Check 1, default cubic.** z³ − 3z² + 4z − 2 = (z − 1)(z² − 2z + 2): expanding, z³ − 2z² + 2z − z² + 2z − 2. The quadratic factor has roots (2 ± √(4 − 8))/2 = 1 ± i. Roots in order: **1, 1 + i, 1 − i**; **1 real root**. Sum −(−3)/1 = **3** (check: 1 + 1 + 1 = 3); product (−1)³(−2)/1 = **2** (check: 1 × (1 + i)(1 − i) = 2).
- **Check 2, quadratic.** z² + 2z + 5: z = (−2 ± √(4 − 20))/2 = −1 ± 2i. Roots **−1 + 2i, −1 − 2i**; **0 real roots**; sum **−2**; product **5**.
- **Check 3, a non-real coefficient breaks the symmetry.** z² − 2i (c₀ = 0 − 2i): z² = 2i = 2 cis(π/2), so z = ±√2 cis(π/4) = ±(1 + i). Ordered by real part: **−1 − i, then 1 + i** (not a conjugate pair); **0 real roots**; sum **0**; product (1 + i)(−1 − i) = −(1 + i)² = **−2i** = c₀.
- **Check 4, two conjugate pairs.** z⁴ + 4 = 0: z⁴ = −4 = 4 cis π, so z = √2 cis(π/4 + kπ/2) = ±1 ± i. Order: **−1 + i, −1 − i, 1 + i, 1 − i**; **0 real roots**; product (−1)⁴ × 4 = **4**.
- **Check 5, two real roots and a pair.** z⁴ − 1 = (z − 1)(z + 1)(z² + 1). Order: **−1, 1, i, −i**; **2 real roots**; sum **0**; product (−1)⁴(−1) = **−1**.
- **Check 6, a leading coefficient that is not 1.** 2z² − 4z + 4 = 2(z² − 2z + 2): roots **1 + i, 1 − i**; sum −(−4)/2 = **2**; product 4/2 = **2**.
- **Check 7, a real cubic has a real root.** z³ + 1 = (z + 1)(z² − z + 1): roots −1 and (1 ± i√3)/2. Order: **−1, 0.5 + 0.866025404i, 0.5 − 0.866025404i**; **1 real root**; product (−1)³ × 1 = **−1**.
- **Check 8, a small imaginary part.** z² + 2z + 5 + i: z = −1 ± s where s² = 1 − (5 + i) = −4 − i. Writing s = p + qi, p² − q² = −4 and 2pq = −1, with p² + q² = |−4 − i| = √17, so p² = (√17 − 4)/2, p = 0.248098393 and q = −1/(2p) = −2.015329455. The roots are −1 − p − qi = **−1.248098393 + 2.015329455i** and −1 + p + qi = **−0.751901607 − 2.015329455i** (ordered by real part). They are not mirror images. Sum **−2** and product **5 + i** still follow the coefficients.

```acceptance
[
  { "name": "default cubic: 1 and the pair 1 ± i", "params": { "degree": 3, "c3": 1, "c2": -3, "c1": 4, "c0": -2, "c0Im": 0 }, "run": "static",
    "expect": { "root1Re": { "value": 1, "absTol": 1e-6 }, "root1Im": { "value": 0, "absTol": 1e-6 }, "root2Re": { "value": 1, "absTol": 1e-6 }, "root2Im": { "value": 1, "absTol": 1e-6 },
                "root3Re": { "value": 1, "absTol": 1e-6 }, "root3Im": { "value": -1, "absTol": 1e-6 }, "realRootCount": { "value": 1, "absTol": 1e-9 },
                "rootSumRe": { "value": 3, "absTol": 1e-6 }, "rootProductRe": { "value": 2, "absTol": 1e-6 }, "rootProductIm": { "value": 0, "absTol": 1e-6 } } },
  { "name": "quadratic z^2 + 2z + 5", "params": { "degree": 2, "c2": 1, "c1": 2, "c0": 5, "c0Im": 0 }, "run": "static",
    "expect": { "root1Re": { "value": -1, "absTol": 1e-6 }, "root1Im": { "value": 2, "absTol": 1e-6 }, "root2Re": { "value": -1, "absTol": 1e-6 }, "root2Im": { "value": -2, "absTol": 1e-6 },
                "realRootCount": { "value": 0, "absTol": 1e-9 }, "rootSumRe": { "value": -2, "absTol": 1e-6 }, "rootProductRe": { "value": 5, "absTol": 1e-6 } } },
  { "name": "z^2 = 2i: roots are not a conjugate pair", "params": { "degree": 2, "c2": 1, "c1": 0, "c0": 0, "c0Im": -2 }, "run": "static",
    "expect": { "root1Re": { "value": -1, "absTol": 1e-6 }, "root1Im": { "value": -1, "absTol": 1e-6 }, "root2Re": { "value": 1, "absTol": 1e-6 }, "root2Im": { "value": 1, "absTol": 1e-6 },
                "realRootCount": { "value": 0, "absTol": 1e-9 }, "rootSumRe": { "value": 0, "absTol": 1e-6 }, "rootSumIm": { "value": 0, "absTol": 1e-6 },
                "rootProductRe": { "value": 0, "absTol": 1e-6 }, "rootProductIm": { "value": -2, "absTol": 1e-6 } } },
  { "name": "z^4 + 4: two conjugate pairs", "params": { "degree": 4, "c4": 1, "c3": 0, "c2": 0, "c1": 0, "c0": 4, "c0Im": 0 }, "run": "static",
    "expect": { "root1Re": { "value": -1, "absTol": 1e-6 }, "root1Im": { "value": 1, "absTol": 1e-6 }, "root2Re": { "value": -1, "absTol": 1e-6 }, "root2Im": { "value": -1, "absTol": 1e-6 },
                "root3Re": { "value": 1, "absTol": 1e-6 }, "root3Im": { "value": 1, "absTol": 1e-6 }, "root4Re": { "value": 1, "absTol": 1e-6 }, "root4Im": { "value": -1, "absTol": 1e-6 },
                "realRootCount": { "value": 0, "absTol": 1e-9 }, "rootProductRe": { "value": 4, "absTol": 1e-6 } } },
  { "name": "z^4 - 1: two real roots and the pair ± i", "params": { "degree": 4, "c4": 1, "c3": 0, "c2": 0, "c1": 0, "c0": -1, "c0Im": 0 }, "run": "static",
    "expect": { "root1Re": { "value": -1, "absTol": 1e-6 }, "root2Re": { "value": 1, "absTol": 1e-6 }, "root3Re": { "value": 0, "absTol": 1e-6 }, "root3Im": { "value": 1, "absTol": 1e-6 },
                "root4Im": { "value": -1, "absTol": 1e-6 }, "realRootCount": { "value": 2, "absTol": 1e-9 }, "rootSumRe": { "value": 0, "absTol": 1e-6 }, "rootProductRe": { "value": -1, "absTol": 1e-6 } } },
  { "name": "leading coefficient 2: sum -c1/c2, product c0/c2", "params": { "degree": 2, "c2": 2, "c1": -4, "c0": 4, "c0Im": 0 }, "run": "static",
    "expect": { "root1Re": { "value": 1, "absTol": 1e-6 }, "root1Im": { "value": 1, "absTol": 1e-6 }, "root2Im": { "value": -1, "absTol": 1e-6 },
                "rootSumRe": { "value": 2, "absTol": 1e-6 }, "rootProductRe": { "value": 2, "absTol": 1e-6 } } },
  { "name": "z^3 + 1: a real cubic has a real root", "params": { "degree": 3, "c3": 1, "c2": 0, "c1": 0, "c0": 1, "c0Im": 0 }, "run": "static",
    "expect": { "root1Re": { "value": -1, "absTol": 1e-6 }, "root1Im": { "value": 0, "absTol": 1e-6 }, "root2Re": { "value": 0.5, "absTol": 1e-6 }, "root2Im": { "value": 0.866025404, "absTol": 1e-6 },
                "root3Im": { "value": -0.866025404, "absTol": 1e-6 }, "realRootCount": { "value": 1, "absTol": 1e-9 }, "rootProductRe": { "value": -1, "absTol": 1e-6 } } },
  { "name": "small imaginary part: no longer mirror images", "params": { "degree": 2, "c2": 1, "c1": 2, "c0": 5, "c0Im": 1 }, "run": "static",
    "expect": { "root1Re": { "value": -1.248098393, "absTol": 1e-6 }, "root1Im": { "value": 2.015329455, "absTol": 1e-6 }, "root2Re": { "value": -0.751901607, "absTol": 1e-6 },
                "root2Im": { "value": -2.015329455, "absTol": 1e-6 }, "rootSumRe": { "value": -2, "absTol": 1e-6 }, "rootProductRe": { "value": 5, "absTol": 1e-6 }, "rootProductIm": { "value": 1, "absTol": 1e-6 } } }
]
```
