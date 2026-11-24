---
id: me2-proof-pictures
title: "Proof pictures"
subject: me2
engine: custom
setup: none
priority: P2
status: draft            # stub → draft → approved (Gate B)
page: /interactives/maths-ext2/proof-pictures.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Mathematics Extension 2","version":"2024","area":"Proof","focusArea":"The nature of proof","year":12,"outcomes":[],"verified":false}
---
# Proof pictures

> Backlog summary: AM-GM and inequality proofs as geometric pictures; contrapositive and contradiction toggler.

## Learning goal
Students see why (a + b)/2 ≥ √(ab) for a, b ≥ 0, with equality exactly when a = b, from two geometric pictures that match the algebraic proof (a + b)² − 4ab = (a − b)² ≥ 0. They also practise the language of proof: they form the converse, contrapositive, inverse and negation of an implication, see that only the contrapositive always has the same truth value as the original, use a counterexample to show a statement is false, and follow the structure of a proof by contradiction.

## What the student sees
The stage at 1920×1080 shows one of four pictures, chosen by **Picture**.

**Semicircle (default).** A horizontal diameter AB of length a + b, split at P into AP = a (orange) and PB = b (graphite), both labelled. A semicircle on AB has centre O and radius r = (a + b)/2, drawn as a thick line with the radius OQ labelled "AM = (a + b)/2". The perpendicular to AB at P meets the semicircle at Q; PQ is a thick orange segment labelled "GM = √(ab)". Since PQ is a half-chord and OQ a radius, PQ ≤ OQ, and the two are equal only when P is at O. With **Show HM and QM** on, the foot F of the perpendicular from P to OQ gives QF = 2ab/(a + b) (labelled "HM"), and the segment from P to the top T of the semicircle has length √((a² + b²)/2) (labelled "QM"). A ladder of four bars at the right shows HM ≤ GM ≤ AM ≤ QM with their values. Dragging P along AB changes a and b with a + b fixed.

**Square.** A square of side a + b holds four a × b rectangles arranged around a central square of side |a − b| (a "pinwheel"). Labels show (a + b)² = 4ab + (a − b)², and the central square is hatched. When a = b the central square shrinks to nothing, and the stage notes "equality when a = b".

**Logic.** A card shows a statement about integers or reals in words, with its hypothesis P highlighted in orange and its conclusion Q in graphite, for example "For every real x: **if x > 2**, then **x² > 4**." Under it, the chosen form is written in words and in symbols (P ⇒ Q, Q ⇒ P, ¬Q ⇒ ¬P, ¬P ⇒ ¬Q, or P ∧ ¬Q for the negation) with a verdict, **True** or **False**. When the verdict is False, a counterexample is shown (for example "x = −3: x² = 9 > 4 but x ≤ 2"). A small table lists all five forms with ✓ or ✗, and the forms that always share the original's truth value are bracketed.

**Contradiction.** A proof by contradiction is revealed line by line, each line tagged with its role: assumption, deduction, contradiction or conclusion. The assumption line has a dashed outline (it is supposed, not known), and the contradiction line has a strong orange outline.

This page is static: there is no play button.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| picture | Picture | | | | | semicircle | enum, select widget: `semicircle`, `square`, `logic`, `contradiction` |
| a | a | | 0 | 10 | 0.1 | 4 | visible for semicircle and square; also set by dragging P |
| b | b | | 0 | 10 | 0.1 | 1 | as above |
| showMeans | Show HM and QM | | | | | on | boolean, semicircle only |
| statement | Statement | | | | | x-gt-2 | enum, logic only (statement bank below) |
| form | Form | | | | | original | enum, logic only: `original` (P ⇒ Q), `converse` (Q ⇒ P), `contrapositive` (¬Q ⇒ ¬P), `inverse` (¬P ⇒ ¬Q), `negation` (P ∧ ¬Q for some case) |
| proof | Proof | | | | | sqrt2 | enum, contradiction only: `sqrt2` (√2 is irrational), `log2-3` (log₂ 3 is irrational) |
| reveal | Lines revealed | | 0 | 7 | 1 | 1 | integer, contradiction only (each proof has 7 lines) |

**Statement bank** (all written for this page). Truth values are for original, converse, contrapositive, inverse, negation.

| Value | Statement | Truth values | Counterexample shown when false |
| --- | --- | --- | --- |
| `even-square` | For every integer n: if n² is even, then n is even. | T, T, T, T, F | negation: none exists (every case of n² even has n even) |
| `x-gt-2` | For every real x: if x > 2, then x² > 4. | T, F, T, F, F | converse and inverse: x = −3 |
| `sum-irrational` | For all real a and b: if a + b is irrational, then a is irrational or b is irrational. | T, F, T, F, F | converse and inverse: a = √2, b = −√2 |
| `six-three` | For every integer n: if 6 divides n, then 3 divides n. | T, F, T, F, F | converse and inverse: n = 3 |
| `prime-odd` | For every integer n > 1: if n is prime, then n is odd. | F, F, F, F, T | original and contrapositive: n = 2; converse and inverse: n = 9 |

**Proof texts** (written for this page; each line's role in brackets).
- `sqrt2`: (1, assumption) Suppose that √2 is rational. (2, deduction) Then √2 = p/q for integers p and q > 0 with no common factor other than 1. (3, deduction) Squaring, p² = 2q², so p² is even. (4, deduction) If p were odd, p² would be odd, so p is even: write p = 2k. (5, deduction) Then 4k² = 2q², so q² = 2k² is even, and q is even. (6, contradiction) So 2 divides both p and q, which contradicts p/q having no common factor. (7, conclusion) The assumption is false, so √2 is irrational.
- `log2-3`: (1, assumption) Suppose that log₂ 3 is rational. (2, deduction) As log₂ 3 > 0, write log₂ 3 = p/q with p and q positive integers. (3, deduction) Then 2^(p/q) = 3, so 2^p = 3^q. (4, deduction) The left side is even, because p ≥ 1. (5, deduction) The right side is a product of odd numbers, so it is odd. (6, contradiction) An even number cannot equal an odd number. (7, conclusion) The assumption is false, so log₂ 3 is irrational.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | semicircle, a = 4, b = 1, means on | AM 2.5, GM 2, HM 1.6, QM 2.92: all four means in one picture |
| equal | semicircle, a = 3, b = 3 | equality: P sits at O and all four means are 3 |
| square | square, a = 3, b = 1 | 16 = 12 + 4: the central square is the "gap" (a − b)² |
| converse | logic, statement x-gt-2, form converse | false, with the counterexample x = −3 |
| contrapositive | logic, statement x-gt-2, form contrapositive | true: it says the same thing as the original |
| false-statement | logic, statement prime-odd, form original | a false statement has a false contrapositive and a true negation |
| contradiction | contradiction, proof sqrt2, reveal 1 | reveal the proof one line at a time |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| am | AM (a + b)/2 | | 4 |
| gm | GM √(ab) | | 4 |
| hm | HM 2ab/(a + b) | | 4 |
| qm | QM √((a² + b²)/2) | | 4 |
| gap | AM − GM | | 4 |
| bigSquare | (a + b)² | | 4 |
| fourRects | 4ab | | 4 |
| innerSquare | (a − b)² | | 4 |
| truth | Truth value (1 true, 0 false) | | whole number (`integer: true`) |

Definitions: am = (a + b)/2; gm = √(ab); hm = 2ab/(a + b), NaN when a + b = 0; qm = √((a² + b²)/2); gap = am − gm, which equals (√a − √b)²/2; bigSquare = (a + b)²; fourRects = 4ab; innerSquare = (a − b)². These are NaN outside the semicircle and square pictures. truth is the truth value of the chosen form of the chosen statement, from the bank above (NaN outside the logic picture).

## Assumptions shown on stage
- a and b are non-negative real numbers
- Statements are about all integers or all reals, as written on the card
- A single counterexample shows that a "for every" statement is false

## Try this (3–5 predict, observe, explain prompts)
1. Predict: drag P along the diameter. Where must P be for √(ab) to equal (a + b)/2? Check that the gap reads 0 there.
2. Observe: in "Square", move a and b. Which part of the picture is (a + b)² − 4ab, and why can it never be negative?
3. Predict: for "if x > 2 then x² > 4", which of the converse, contrapositive and inverse are true? Step through the forms to check.
4. Observe: load "False statement". The original is false. What happens to its contrapositive, and to its negation?
5. Explain: in "Contradiction", reveal the √2 proof one line at a time. Which line is the contradiction, and exactly which earlier line does it contradict?

## Teacher notes outline
- Misconceptions to target: the converse of a true statement is true; the inverse is the same as the contrapositive; the negation of "if P then Q" is "if P then not Q" (it is "P and not Q, for some case"); examples prove a "for every" statement; in a proof by contradiction, the contradiction must be with the original statement (it can be with any known fact or with the assumption); AM ≥ GM holds for negative numbers too.
- 10-minute lesson flow: (1) semicircle: drag P, predict when GM = AM, then read off the means (3 min); (2) square: link the picture to (a − b)² ≥ 0 and write the two-line algebraic proof (2 min); (3) logic: one statement through all five forms; the truth-table pattern (3 min); (4) contradiction: reveal the √2 proof line by line, naming each role (2 min).
- Original HSC-style question idea: (a) Show that for positive real numbers x and y, x + y ≥ 2√(xy). (b) Hence prove that (p + q)(q + r)(r + p) ≥ 8pqr for positive reals p, q and r. (c) Write down the contrapositive of the statement "For every integer n, if n² − 1 is not divisible by 8, then n is even", and prove the statement by proving its contrapositive. (Answer for (c): if n is odd, then n² − 1 = 4k(k + 1) with n = 2k + 1, and k(k + 1) is even, so 8 divides n² − 1.) Write the full question and worked solution in the notes file.

## Accessibility notes
- Second cues beyond colour: segments are labelled (a, b, AM, GM, HM, QM) and the means ladder uses text values; verdicts are words (True or False) with ✓ or ✗; the hypothesis is bold and the conclusion is in a second typeface weight as well as colour; proof roles are written as words, and the assumption and contradiction lines differ in outline style (dashed and thick).
- Keyboard: every control is a select, slider or toggle; the **Lines revealed** slider steps through the proof with the arrow keys.
- Stage aria-label (from `describe()`), for example: "Semicircle with diameter split into a = 4 and b = 1. The arithmetic mean 2.5 is the radius and the geometric mean 2 is the half-chord, so the geometric mean is smaller." Logic picture: "Statement: for every real x, if x > 2 then x² > 4. Converse: if x² > 4 then x > 2. False: x = −3 is a counterexample."

## Engine change requests
None. This is a custom page: its engine `site/assets/engines/custom/me2-proof-pictures/` (built in Wave 2) implements exactly the params and outputs above, with a single setup (for example `pictures`) that is also listed in `meta.staticSetups`, because nothing evolves in time.

## Acceptance
Every number below comes from the formula and hand calculation shown here. All checks are static and every output is a closed form or a table value, so the tolerance is 1e-9.

- **Check 1, default means.** a = 4, b = 1: AM = 5/2 = **2.5**; GM = √4 = **2**; HM = 2 × 4 × 1/5 = 8/5 = **1.6**; QM = √((16 + 1)/2) = √8.5 = **2.91547594742**; gap = 2.5 − 2 = **0.5**, and (√4 − √1)²/2 = 1/2 agrees. So HM ≤ GM ≤ AM ≤ QM: 1.6 ≤ 2 ≤ 2.5 ≤ 2.915.
- **Check 2, equality.** a = b = 3: AM = **3**, GM = √9 = **3**, HM = 18/6 = **3**, QM = √9 = **3**, gap **0**.
- **Check 3, one value zero.** a = 9, b = 0: AM = **4.5**, GM = **0**, HM = 0/9 = **0**, gap **4.5**.
- **Check 4, square picture.** a = 3, b = 1: (a + b)² = **16**, 4ab = **12**, (a − b)² = **4**, and 16 = 12 + 4.
- **Check 5, a false converse.** x-gt-2, converse: "if x² > 4 then x > 2" fails at x = −3 (9 > 4 but −3 < 2), so **truth = 0**.
- **Check 6, a true contrapositive.** x-gt-2, contrapositive: "if x² ≤ 4 then x ≤ 2". If x² ≤ 4 then −2 ≤ x ≤ 2, so x ≤ 2: **truth = 1**.
- **Check 7, the negation of a false statement.** prime-odd, negation: "there is an integer n > 1 that is prime and even". n = 2 is one, so **truth = 1**.

```acceptance
[
  { "name": "default means: HM 1.6, GM 2, AM 2.5, QM sqrt(8.5)", "params": { "picture": "semicircle", "a": 4, "b": 1 }, "run": "static",
    "expect": { "am": { "value": 2.5, "absTol": 1e-9 }, "gm": { "value": 2, "absTol": 1e-9 }, "hm": { "value": 1.6, "absTol": 1e-9 },
                "qm": { "value": 2.91547594742, "absTol": 1e-9 }, "gap": { "value": 0.5, "absTol": 1e-9 } } },
  { "name": "equality when a = b", "params": { "picture": "semicircle", "a": 3, "b": 3 }, "run": "static",
    "expect": { "am": { "value": 3, "absTol": 1e-9 }, "gm": { "value": 3, "absTol": 1e-9 }, "hm": { "value": 3, "absTol": 1e-9 }, "qm": { "value": 3, "absTol": 1e-9 }, "gap": { "value": 0, "absTol": 1e-9 } } },
  { "name": "one value zero", "params": { "picture": "semicircle", "a": 9, "b": 0 }, "run": "static",
    "expect": { "am": { "value": 4.5, "absTol": 1e-9 }, "gm": { "value": 0, "absTol": 1e-9 }, "hm": { "value": 0, "absTol": 1e-9 }, "gap": { "value": 4.5, "absTol": 1e-9 } } },
  { "name": "square picture: 16 = 12 + 4", "params": { "picture": "square", "a": 3, "b": 1 }, "run": "static",
    "expect": { "bigSquare": { "value": 16, "absTol": 1e-9 }, "fourRects": { "value": 12, "absTol": 1e-9 }, "innerSquare": { "value": 4, "absTol": 1e-9 } } },
  { "name": "converse of 'x > 2 implies x^2 > 4' is false", "params": { "picture": "logic", "statement": "x-gt-2", "form": "converse" }, "run": "static",
    "expect": { "truth": { "value": 0, "absTol": 1e-9 } } },
  { "name": "contrapositive of 'x > 2 implies x^2 > 4' is true", "params": { "picture": "logic", "statement": "x-gt-2", "form": "contrapositive" }, "run": "static",
    "expect": { "truth": { "value": 1, "absTol": 1e-9 } } },
  { "name": "negation of a false statement is true", "params": { "picture": "logic", "statement": "prime-odd", "form": "negation" }, "run": "static",
    "expect": { "truth": { "value": 1, "absTol": 1e-9 } } }
]
```
