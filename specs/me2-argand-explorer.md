---
id: me2-argand-explorer
title: "Argand explorer"
subject: me2
engine: argand
setup: operations
priority: P0
status: draft            # stub → draft → approved (Gate B)
page: /interactives/maths-ext2/argand-explorer.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Mathematics Extension 2","version":"2024","area":"Complex numbers","focusArea":"Introduction to complex numbers","year":12,"outcomes":[],"verified":false}
---
# Argand explorer

> Backlog summary: Multiplication as rotate-and-scale, de Moivre power spirals, nth roots of unity.

## Learning goal
Students see that multiplying by z₂ rotates a point through arg z₂ and scales it by |z₂|, so moduli multiply and arguments add (dividing undoes both). Applying this repeatedly gives de Moivre's theorem as a spiral of powers, and the n solutions of zⁿ = w sit equally spaced on a circle of radius |w|^(1/n), forming a regular n-gon (for w = 1, the nth roots of unity).

## What the student sees
A square Argand diagram fills the stage at 1920×1080: real axis horizontal, imaginary axis vertical, equal scales, gridlines every 1 unit, tick labels at least 18 px, and a dashed unit circle. The view runs from −viewRange to +viewRange (default ±4).

- **z₁** and **z₂** are arrows from the origin with draggable handles at their tips (snapping to the 0.1 grid, or to whole numbers nearby), each labelled in Cartesian form, for example "z₁ = 2 + i". Each point can be entered in Cartesian form (a + bi) or polar form (modulus and argument in degrees); the two forms stay in step.
- The **result** is a thicker arrow labelled with its value, for example "z₁z₂ = 1 + 3i".
- With **Angle arcs** on, each arrow has an arc from the positive real axis labelled θ₁ or θ₂ (as an exact multiple of π where there is one, or in degrees if chosen).
- A panel at the top left explains the current operation with the numbers substituted, for example "|z₁z₂| = |z₁||z₂|" and "arg(z₁z₂) = θ₁ + θ₂".

What each operation adds:
- **Multiply:** a dashed arc labelled "rotate θ₂" carries z₁ round to the direction of the product, so students see the rotation and then the stretch. With **Similar triangles** on, the triangle 0, 1, z₂ and the triangle 0, z₁, z₁z₂ are drawn with matching marks: multiplying by z₁ turns the first into the second.
- **Divide:** the same picture with "rotate −θ₂".
- **Add and subtract:** the parallelogram (or the joining vector) with dashed sides.
- **Conjugate:** z₁ and z̄₁ mirrored in the real axis, with arcs θ and −θ.
- **Powers (de Moivre):** the points 1, z, z², …, zⁿ joined by the spiral r^t cis(tθ), 0 ≤ t ≤ n, with each power labelled.
- **nth roots:** the n roots of zⁿ = 1 (or zⁿ = z₁) as numbered dots on a dashed circle, joined into the regular polygon, with the spacing 2π/n marked and named ("a regular heptagon"). The principal root (k = 0) is the result.

This setup is static: there is no play button. Division by z₂ = 0 shows "undefined" and the result readouts show "—".

## Parameters
Keys are from the `argand` engine meta on `origin/w1/engine-argand` (commit 8caa8d0).

| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| operation | Operation | | | | | mul | enum, select: `add`, `sub`, `mul`, `div`, `conj`, `power` (de Moivre), `roots` (nth roots) |
| z1Form | Enter z₁ as | | | | | cartesian | enum: `cartesian` (a + bi), `polar` (modulus, argument) |
| z1Re | Re z₁ | | −10 | 10 | 0.1 | 2 | visible in Cartesian form; also set by dragging |
| z1Im | Im z₁ | | −10 | 10 | 0.1 | 1 | as above |
| z1Mod | \|z₁\| | | 0 | 10 | 0.1 | √5 | visible in polar form; kept in step with Re and Im |
| z1Arg | arg z₁ | ° | −180 | 180 | 1 | 26.565… | visible in polar form; principal argument in degrees |
| z2Form, z2Re, z2Im, z2Mod, z2Arg | the same for z₂ | | | | | 1 + i | visible for add, sub, mul and div |
| powerN | Power n | | 1 | 16 | 1 | 8 | integer; visible for power |
| rootN | Number of roots n | | 2 | 12 | 1 | 6 | integer; visible for roots |
| rootsOf | Solve | | | | | unity | enum: `unity` (zⁿ = 1), `w` (zⁿ = z₁); visible for roots |
| similarTriangles | Similar triangles | | | | | off | boolean; visible for mul and div |
| showArcs | Angle arcs | | | | | on | boolean |
| angleUnit | Show arguments in | | | | | rad | enum: `rad` (exact multiples of π where possible), `deg`; labels only, readouts stay in radians |
| viewRange | Axis range ± | | 1 | 10 | 0.5 | 4 | |

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | operation mul, z₁ = 2 + i, z₂ = 1 + i (Cartesian), similar triangles on, arcs on, angles rad, view 4 | product 1 + 3i: moduli √5 × √2 = √10, arguments tan⁻¹(1/2) + π/4 |
| rotate-by-i | operation mul, z₁ = 2 + i, z₂ = i (z2Re 0, z2Im 1) | multiplying by i is a quarter turn: 2 + i becomes −1 + 2i, same modulus |
| divide | operation div, z₁ = 1 + 3i, z₂ = 1 + i | undoes the default product: (1 + 3i)/(1 + i) = 2 + i |
| conjugate | operation conj, z₁ = 2 + i | the mirror image in the real axis: argument −θ |
| power-spiral | operation power, z₁ = 0.95 + 0.55i, powerN 12 | \|z₁\| ≈ 1.10 and arg z₁ ≈ 30°, so twelve powers make one outward turn to \|z₁¹²\| ≈ 3.06 |
| de-moivre | operation power, z₁ = −1 + i, powerN 5, view 5 | (√2 cis 3π/4)⁵ = 4√2 cis(−π/4) = 4 − 4i; the argument wraps back into (−π, π] |
| roots-of-unity | operation roots, rootsOf unity, rootN 7 | the seven 7th roots of unity form a regular heptagon |
| roots-of-minus-four | operation roots, rootsOf w, z₁ = −4, rootN 4 | z⁴ = −4 has roots ±1 ± i: a square of side 2 |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| resRe | Re (result) | | 3 |
| resIm | Im (result) | | 3 |
| resMod | \|result\| | | 3 |
| resArg | arg (result) | rad | 3 |
| z1Mod | \|z₁\| | | 3 |
| z1Arg | arg z₁ | rad | 3 |
| z2Mod | \|z₂\| | | 3 |
| z2Arg | arg z₂ | rad | 3 |

Definitions (from the engine): the result is z₁ + z₂, z₁ − z₂, z₁z₂, z₁/z₂, z̄₁, z₁ⁿ (by repeated multiplication), or, for roots, the principal root |w|^(1/n) cis(arg w / n) of zⁿ = w with w = 1 or z₁. Every argument output is the principal argument in (−π, π], in radians: an argument of −π is reported as π, and components below 1e-12 of the larger one are cleaned to 0 first. The argument of 0 is NaN. The engine also outputs `z1Re`, `z1Im`, `z2Re` and `z2Im`.

## Assumptions shown on stage
- Arguments are principal values, −π < arg z ≤ π
- Angles measured anticlockwise from the positive real axis
- Equal scales on both axes; dragged points snap to 0.1

## Try this (3–5 predict, observe, explain prompts)
1. Predict: z₁ = 2 + i and z₂ = 1 + i. Before looking, estimate |z₁z₂| and arg(z₁z₂) from |z₁|, |z₂|, θ₁ and θ₂. Then check the readouts.
2. Observe: choose "Rotate by i" and drag z₁ anywhere. What does multiplying by i always do? Now set z₂ = 2i. What changes?
3. Predict: in "Power spiral", drag z₁ onto the unit circle. What will the spiral turn into, and why?
4. Observe: in "Roots of unity", step n from 3 to 12. Where is one root always found, and how does the polygon change?
5. Explain: z⁴ = −4 has four roots. Use the modulus and argument of −4 to explain why the roots are 1 + i, −1 + i, −1 − i and 1 − i, and why they form a square.

## Teacher notes outline
- Misconceptions to target: multiplying complex numbers multiplies the real and imaginary parts separately; the argument of a product may be left outside (−π, π]; arg(−1) = −π; the nth roots of a complex number are "n copies" of one answer rather than n equally spaced points; the roots of zⁿ = w lie on the unit circle even when |w| ≠ 1; multiplication by i is a reflection rather than a rotation.
- 10-minute lesson flow: (1) default scenario: predict the product's modulus and argument, then reveal (2 min); (2) the "rotate θ₂" arc and similar triangles: connect to r₁r₂ cis(θ₁ + θ₂) (2 min); (3) power spiral: drag z₁ onto, inside and outside the unit circle; write de Moivre's theorem (3 min); (4) roots of unity and roots of −4: the polygon, the spacing 2π/n and why the roots sum to zero (3 min).
- Original HSC-style question idea: let ω = cis(2π/5). (a) Show that 1 + ω + ω² + ω³ + ω⁴ = 0. (b) Hence show that cos(2π/5) + cos(4π/5) = −1/2. (c) The points representing 1, ω, ω², ω³ and ω⁴ form a regular pentagon. Find its exact area. (Answer: (5/2) sin(2π/5).) Write the full question and worked solution in the notes file.

## Accessibility notes
- Second cues beyond colour: z₁, z₂ and the result are labelled arrows of different weights (the result thickest); helper sides and rotation arcs are dashed; roots are numbered and the polygon is named in words ("a regular heptagon").
- Keyboard: every draggable point has matching sliders (in Cartesian or polar form), so the whole page works without a pointer. The setup is static, so play and step are hidden.
- Stage aria-label (from `describe()`), for example: "Argand diagram. z₁ = 2 + i and z₂ = 1 + i. Their product is 1 + 3i, with modulus √10 and argument 1.25 radians." In roots mode: "The 7 solutions of z to the 7 equals 1 lie on a circle of radius 1 and form a regular heptagon."

## Engine change requests
Keys and outputs above match the `argand` meta on `origin/w1/engine-argand` (8caa8d0). Requests (not used by the acceptance block below):
- **Root sum outputs** `rootSumRe` and `rootSumIm` for `operations` in roots mode, so the zero sum of the nth roots is a readout. Expected: 0 for zⁿ = 1 and zⁿ = w with n ≥ 2 (for example z⁴ = −4: (1 − 1 − 1 + 1) + (1 + 1 − 1 − 1)i = 0).
- **Build slider** `build` (0 to 1, default 1, multiply only, drawing only): a ghost point moves from z₁ (0) through z₁ rotated by θ₂ (0.5) to z₁z₂ (1), so "rotate, then scale" can be stepped through slowly in class.

## Acceptance
Every number below comes from the formula and hand calculation shown here. All checks are static. Multiplication is (a + bi)(c + di) = (ac − bd) + (ad + bc)i; division multiplies top and bottom by the conjugate; |w| = √(Re² + Im²); arg is the principal argument.

- **Check 1, default product (moduli multiply, arguments add).** z₁ = 2 + i, z₂ = 1 + i. z₁z₂ = (2·1 − 1·1) + (2·1 + 1·1)i = **1 + 3i**. |z₁z₂| = √(1 + 9) = **√10 = 3.16227766017**, and |z₁||z₂| = √5 × √2 = 2.2360679775 × 1.41421356237 = √10 as well. arg(z₁z₂) = tan⁻¹(3/1) = **1.24904577240**; θ₁ = tan⁻¹(1/2) = **0.463647609001**, θ₂ = π/4 = **0.785398163397**, and their sum is 1.24904577240.
- **Check 2, division undoes the product.** z₁ = 1 + 3i, z₂ = 1 + i. (1 + 3i)(1 − i)/((1 + i)(1 − i)) = (1 − i + 3i + 3)/2 = (4 + 2i)/2 = **2 + i**, with modulus **√5 = 2.2360679775** = √10/√2.
- **Check 3, de Moivre with an argument that wraps.** z₁ = −1 + i = √2 cis(3π/4), n = 5. z₁⁵ = (√2)⁵ cis(15π/4) = 4√2 cis(15π/4 − 4π) = 4√2 cis(−π/4) = 4√2(√2/2 − i√2/2) = **4 − 4i**. Modulus 4√2 = **5.65685424949**, argument **−π/4 = −0.785398163397**.
- **Check 4, roots of z⁴ = −4.** −4 = 4 cis π, so the roots are 4^(1/4) cis((π + 2kπ)/4) = √2 cis(π/4 + kπ/2), k = 0, 1, 2, 3: 1 + i, −1 + i, −1 − i, 1 − i. The principal root is √2 cis(π/4) = **1 + i**, modulus **√2 = 1.41421356237**, argument **π/4 = 0.785398163397**. arg z₁ = arg(−4) = **π = 3.14159265359**.
- **Check 5, i² = −1 has argument π, not −π.** z₁ = i, n = 2: (0 + i)(0 + i) = (0·0 − 1·1) + (0·1 + 1·0)i = **−1 + 0i**, argument **π = 3.14159265359**.
- **Check 6, seventh roots of unity (preset).** zⁿ = 1 with n = 7: the principal root is cis 0 = **1 + 0i**, modulus **1**, argument **0**.
- **Check 7, multiplying by i is a quarter turn (preset).** z₁ = 2 + i, z₂ = i: (2 + i)i = 2i + i² = **−1 + 2i**. Modulus **√5 = 2.2360679775** (unchanged), and arg = π − tan⁻¹ 2 = **2.03444393580** = tan⁻¹(1/2) + π/2 = 0.463647609 + 1.570796327.

```acceptance
[
  { "name": "default product: moduli multiply, arguments add", "params": { "operation": "mul", "z1Form": "cartesian", "z1Re": 2, "z1Im": 1, "z2Form": "cartesian", "z2Re": 1, "z2Im": 1 }, "run": "static",
    "expect": { "resRe": { "value": 1, "absTol": 1e-9 }, "resIm": { "value": 3, "absTol": 1e-9 }, "resMod": { "value": 3.16227766017, "absTol": 1e-9 },
                "resArg": { "value": 1.2490457724, "absTol": 1e-9 }, "z1Mod": { "value": 2.2360679775, "absTol": 1e-9 }, "z2Mod": { "value": 1.41421356237, "absTol": 1e-9 },
                "z1Arg": { "value": 0.463647609001, "absTol": 1e-9 }, "z2Arg": { "value": 0.785398163397, "absTol": 1e-9 } } },
  { "name": "division undoes the product", "params": { "operation": "div", "z1Form": "cartesian", "z1Re": 1, "z1Im": 3, "z2Form": "cartesian", "z2Re": 1, "z2Im": 1 }, "run": "static",
    "expect": { "resRe": { "value": 2, "absTol": 1e-9 }, "resIm": { "value": 1, "absTol": 1e-9 }, "resMod": { "value": 2.2360679775, "absTol": 1e-9 } } },
  { "name": "de Moivre: (-1 + i)^5 = 4 - 4i", "params": { "operation": "power", "z1Form": "cartesian", "z1Re": -1, "z1Im": 1, "powerN": 5 }, "run": "static",
    "expect": { "resRe": { "value": 4, "absTol": 1e-9 }, "resIm": { "value": -4, "absTol": 1e-9 }, "resMod": { "value": 5.65685424949, "absTol": 1e-9 },
                "resArg": { "value": -0.785398163397, "absTol": 1e-9 } } },
  { "name": "roots of z^4 = -4: principal root 1 + i", "params": { "operation": "roots", "rootsOf": "w", "z1Form": "cartesian", "z1Re": -4, "z1Im": 0, "rootN": 4 }, "run": "static",
    "expect": { "resRe": { "value": 1, "absTol": 1e-9 }, "resIm": { "value": 1, "absTol": 1e-9 }, "resMod": { "value": 1.41421356237, "absTol": 1e-9 },
                "resArg": { "value": 0.785398163397, "absTol": 1e-9 }, "z1Arg": { "value": 3.14159265359, "absTol": 1e-9 } } },
  { "name": "i squared is -1 with argument pi, not -pi", "params": { "operation": "power", "z1Form": "cartesian", "z1Re": 0, "z1Im": 1, "powerN": 2 }, "run": "static",
    "expect": { "resRe": { "value": -1, "absTol": 1e-9 }, "resIm": { "value": 0, "absTol": 1e-9 }, "resArg": { "value": 3.14159265359, "absTol": 1e-9 } } },
  { "name": "seventh roots of unity: principal root 1 (preset)", "preset": "roots-of-unity", "params": {}, "run": "static",
    "expect": { "resRe": { "value": 1, "absTol": 1e-9 }, "resIm": { "value": 0, "absTol": 1e-9 }, "resMod": { "value": 1, "absTol": 1e-9 }, "resArg": { "value": 0, "absTol": 1e-9 } } },
  { "name": "multiplying by i is a quarter turn (preset)", "preset": "rotate-by-i", "params": {}, "run": "static",
    "expect": { "resRe": { "value": -1, "absTol": 1e-9 }, "resIm": { "value": 2, "absTol": 1e-9 }, "resMod": { "value": 2.2360679775, "absTol": 1e-9 }, "resArg": { "value": 2.0344439358, "absTol": 1e-9 } } }
]
```
