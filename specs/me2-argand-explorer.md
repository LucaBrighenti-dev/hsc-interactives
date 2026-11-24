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
Students see that multiplying by z₁ rotates a point through Arg z₁ and scales it by |z₁|, so moduli multiply and arguments add (dividing undoes both). Applying this repeatedly gives de Moivre's theorem as a spiral of powers, and the n solutions of zⁿ = z₁ sit equally spaced on a circle of radius |z₁|^(1/n), forming a regular n-gon whose vertices sum to zero.

## What the student sees
A square Argand diagram fills the stage at 1920×1080: real axis horizontal, imaginary axis vertical, equal scales, gridlines every 1 unit, tick labels at least 18 px, and a dashed unit circle. The view runs from −viewSize to +viewSize on both axes (default ±5).

- **z₁** is an orange arrow from the origin with a square draggable handle at its tip, labelled "z₁ = 2 + i". **z₂** is a graphite dashed arrow with a round handle, labelled "z₂ = 1 + i". Dragging a handle updates the sliders and snaps to the nearest 0.1.
- The **result w** is a thick orange arrow with a filled diamond tip, labelled with its Cartesian form and its modulus–argument form, for example "w = 1 + 3i = 3.16 cis 1.25".
- With **Show arguments** on, each arrow has a thin arc from the positive real axis to the arrow, labelled with its argument (as a multiple of π where it is one, otherwise as a decimal in radians, or in degrees if chosen).
- A formula strip above the plane shows the current operation with numbers substituted, for example "|w| = |z₁||z₂| = 2.24 × 1.41 = 3.16 · Arg w = Arg z₁ + Arg z₂ = 0.464 + 0.785 = 1.25".

What the operation adds:
- **z₁ × z₂:** the **similar triangles** (toggle): the triangle with vertices 0, 1, z₁ and the triangle with vertices 0, z₂, w are shaded in the same light orange with matching angle marks, showing that multiplying by z₂ turns the first triangle into the second. The **Build the product** slider moves a ghost point from z₂ (at 0) through z₂ rotated by Arg z₁ (at 0.5) to w (at 1), so students see "rotate, then scale" happen.
- **z₁ + z₂:** the parallelogram with dashed sides.
- **z₁ ÷ z₂:** the arrow for w, plus a note "Arg w = Arg z₁ − Arg z₂ (adjusted into (−π, π])".
- **z₁ⁿ:** with **Spiral of powers** on, the points z₁, z₁², …, z₁ⁿ are joined in order by a thin polyline, each labelled with its power. Powers outside the view are shown as a small arrow at the edge of the view.
- **Roots of zⁿ = z₁:** all n roots are drawn as numbered dots on a dashed circle of radius |z₁|^(1/n); with **Regular polygon** on, they are joined into a regular n-gon. The principal root (k = 0) is the result w. Equal angle marks of 2π/n sit between neighbouring roots.

This setup is static: there is no play button. Division by z₂ = 0 shows "Division by zero is undefined" on the stage and the w readouts show "—".

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| operation | Operation | | | | | multiply | enum, select widget: `add` (z₁ + z₂), `multiply` (z₁ × z₂), `divide` (z₁ ÷ z₂), `power` (z₁ⁿ), `roots` (solve zⁿ = z₁) |
| z1Re | Re z₁ | | −5 | 5 | 0.1 | 2 | also set by dragging z₁ |
| z1Im | Im z₁ | | −5 | 5 | 0.1 | 1 | |
| z2Re | Re z₂ | | −5 | 5 | 0.1 | 1 | visible when operation is add, multiply or divide |
| z2Im | Im z₂ | | −5 | 5 | 0.1 | 1 | visible when operation is add, multiply or divide |
| n | n | | 1 | 12 | 1 | 5 | integer; visible when operation is power or roots |
| build | Build the product (rotate, then scale) | | 0 | 1 | 0.01 | 1 | visible when operation is multiply; drawing only, outputs ignore it |
| showTriangles | Similar triangles | | | | | on | boolean; visible when operation is multiply |
| showSpiral | Spiral of powers | | | | | on | boolean; visible when operation is power |
| showPolygon | Regular polygon | | | | | on | boolean; visible when operation is roots |
| showArgs | Show arguments | | | | | on | boolean; argument arcs and labels |
| angleUnit | Angles in | | | | | rad | enum `rad` (multiples of π where exact), `deg`; stage labels only, readouts stay in radians |
| viewSize | View half-width | | 2 | 20 | 1 | 5 | the plane shows −viewSize to +viewSize on both axes |

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | operation multiply, z₁ = 2 + i, z₂ = 1 + i, n = 5, build 1, all toggles on, angles rad, view 5 | product 1 + 3i: moduli √5 × √2 = √10, arguments 0.464 + π/4 |
| rotate-by-i | operation multiply, z₁ = i (z1Re 0, z1Im 1), z₂ = 2 + i | multiplying by i is a quarter turn: w = −1 + 2i, same modulus |
| divide | operation divide, z₁ = 1 + 3i, z₂ = 1 + i | undoes the default product: w = 2 + i |
| power-spiral | operation power, z₁ = 0.95 + 0.55i, n = 12, spiral on | |z₁| ≈ 1.10 and Arg z₁ ≈ 30°, so twelve powers make one outward turn to |z₁¹²| ≈ 3.06 |
| de-moivre | operation power, z₁ = −1 + i, n = 5 | (√2 cis 3π/4)⁵ = 4√2 cis(−π/4) = 4 − 4i; the argument wraps back into (−π, π] |
| roots-of-unity | operation roots, z₁ = 1, n = 7, polygon on | the seven 7th roots of unity form a regular heptagon; their sum is 0 |
| roots-of-minus-four | operation roots, z₁ = −4, n = 4, polygon on | z⁴ = −4 has roots ±1 ± i: a square of side 2 |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| wRe | Re w | | 3 |
| wIm | Im w | | 3 |
| wMod | \|w\| | | 3 |
| wArg | Arg w | rad | 3 |
| z1Mod | \|z₁\| | | 3 |
| z1Arg | Arg z₁ | rad | 3 |
| z2Mod | \|z₂\| | | 3 |
| z2Arg | Arg z₂ | rad | 3 |
| rootSumMod | \|sum of the n roots\| | | 3 |

Definitions: w is z₁ + z₂, z₁z₂, z₁/z₂ or z₁ⁿ for the first four operations, and the principal root |z₁|^(1/n) cis(Arg z₁ / n) (root k = 0) for `roots`. Every argument is the principal argument in (−π, π]: an argument of −π is reported as π. `rootSumMod` is the modulus of the sum of all n roots in `roots` mode and NaN (shown "—") otherwise. Outputs for z₂ are NaN when the operation does not use z₂. Arguments of 0 + 0i are NaN.

## Assumptions shown on stage
- Arguments are principal values, −π < Arg z ≤ π
- Angles measured anticlockwise from the positive real axis
- Equal scales on both axes; dragged points snap to 0.1

## Try this (3–5 predict, observe, explain prompts)
1. Predict: z₁ = 2 + i and z₂ = 1 + i. Before looking, estimate |z₁z₂| and Arg(z₁z₂) from |z₁|, |z₂|, Arg z₁ and Arg z₂. Then check the readouts.
2. Observe: choose the "Rotate by i" scenario and drag z₂ anywhere. What does multiplying by i always do to z₂? Now set z₁ = 2i. What changes?
3. Predict: in the "Spiral of powers" scenario, drag z₁ onto the unit circle. What will the spiral turn into, and why?
4. Observe: in "Roots of unity", step n from 3 to 12. Where is one root always found, and what happens to the sum of the roots?
5. Explain: z⁴ = −4 has four roots. Use the modulus and argument of −4 to explain why the roots are 1 + i, −1 + i, −1 − i and 1 − i, and why they form a square.

## Teacher notes outline
- Misconceptions to target: multiplying complex numbers multiplies the real and imaginary parts separately; the argument of a product can be any angle outside (−π, π] (forgetting to adjust); Arg(−1) = −π; the nth roots of a complex number are "n copies" of one answer rather than n equally spaced points; the roots of zⁿ = w lie on the unit circle even when |w| ≠ 1; multiplication by i is a reflection rather than a rotation.
- 10-minute lesson flow: (1) default scenario, predict the product's modulus and argument, then reveal (2 min); (2) build slider: rotate first, then scale; connect to cis form, r₁r₂ cis(θ₁ + θ₂) (2 min); (3) spiral of powers: drag z₁ onto, inside and outside the unit circle; write de Moivre's theorem (3 min); (4) roots of unity and roots of −4: the polygon, the angle 2π/n and the zero sum (3 min).
- Original HSC-style question idea: let ω = cis(2π/5). (a) Show that 1 + ω + ω² + ω³ + ω⁴ = 0. (b) Hence show that cos(2π/5) + cos(4π/5) = −1/2. (c) The points representing 1, ω, ω², ω³ and ω⁴ form a regular pentagon. Find its exact area. (Answer: (5/2) sin(2π/5).) Write the full question and worked solution in the notes file.

## Accessibility notes
- Second cues beyond colour: z₁ is a solid arrow with a square handle, z₂ a dashed arrow with a round handle, and w a thicker arrow with a diamond tip. Every arrow carries a text label, and roots are numbered (k = 0, 1, …).
- Keyboard: every draggable point has matching sliders, so the whole page works without a pointer. Arrow keys on a focused slider move by 0.1. The shell shortcuts apply (no play or step: the setup is static).
- Stage aria-label (from `describe()`), for example: "Argand diagram. z₁ = 2 + i and z₂ = 1 + i. Their product w = 1 + 3i has modulus 3.16 and argument 1.25 radians." In roots mode: "The 7 solutions of z to the 7 equals 1 lie on a circle of radius 1 and form a regular heptagon."

## Engine change requests
No `argand` engine meta had been pushed when this spec was written (origin had no `w1/engine-argand` branch on 25 Nov). **Keys to reconcile with engine meta:**
- Params for setup `operations`: `operation`, `z1Re`, `z1Im`, `z2Re`, `z2Im`, `n`, `build`, `showTriangles`, `showSpiral`, `showPolygon`, `showArgs`, `angleUnit`, `viewSize`.
- Outputs: `wRe`, `wIm`, `wMod`, `wArg`, `z1Mod`, `z1Arg`, `z2Mod`, `z2Arg`, `rootSumMod`.
- Behaviour needed: the principal argument must return π (not −π) for negative reals, including results with an imaginary part of −0; `describe()` for the aria-label; dragging snaps to 0.1 and writes back to the z params.

## Acceptance
Every number below comes from the formula and hand calculation shown here. All checks are static. Multiplication is (a + bi)(c + di) = (ac − bd) + (ad + bc)i; division multiplies top and bottom by the conjugate; |w| = √(Re² + Im²); Arg is the principal argument.

- **Check 1, default product (moduli multiply, arguments add).** z₁ = 2 + i, z₂ = 1 + i. w = (2·1 − 1·1) + (2·1 + 1·1)i = **1 + 3i**. |w| = √(1 + 9) = **√10 = 3.16227766017**, and |z₁||z₂| = √5 × √2 = 2.2360679775 × 1.41421356237 = √10 as well. Arg w = tan⁻¹(3/1) = **1.24904577240**; Arg z₁ = tan⁻¹(1/2) = **0.463647609001**, Arg z₂ = π/4 = **0.785398163397**, and their sum is 1.24904577240.
- **Check 2, division undoes the product.** z₁ = 1 + 3i, z₂ = 1 + i. w = (1 + 3i)(1 − i)/((1 + i)(1 − i)) = (1 − i + 3i + 3)/2 = (4 + 2i)/2 = **2 + i**, |w| = **√5 = 2.2360679775** = √10/√2.
- **Check 3, de Moivre with an argument that wraps.** z₁ = −1 + i = √2 cis(3π/4), n = 5. z₁⁵ = (√2)⁵ cis(15π/4) = 4√2 cis(15π/4 − 4π) = 4√2 cis(−π/4) = 4√2(√2/2 − i√2/2) = **4 − 4i**. |w| = 4√2 = **5.65685424949**, Arg w = **−π/4 = −0.785398163397**.
- **Check 4, roots of z⁴ = −4.** −4 = 4 cis π, so the roots are 4^(1/4) cis((π + 2kπ)/4) = √2 cis(π/4 + kπ/2), k = 0, 1, 2, 3, that is 1 + i, −1 + i, −1 − i, 1 − i. The principal root w = √2 cis(π/4) = **1 + i**, |w| = **√2 = 1.41421356237**, Arg w = **π/4 = 0.785398163397**. The roots sum to (1 − 1 − 1 + 1) + (1 + 1 − 1 − 1)i = **0**. Arg z₁ = Arg(−4) = **π = 3.14159265359**.
- **Check 5, i² = −1 has argument π, not −π.** z₁ = i, n = 2: w = (0·0 − 1·1) + (0·1 + 1·0)i = **−1 + 0i**, Arg w = **π = 3.14159265359**.
- **Check 6, seventh roots of unity (preset).** z₁ = 1, n = 7: the principal root is cis 0 = **1 + 0i**, and the sum of the roots is (1 − cis(2π))/(1 − cis(2π/7)) = **0** (a geometric series), so `rootSumMod` = 0. Floating-point sums are about 1e-16, hence the 1e-12 tolerance.

```acceptance
[
  { "name": "default product: moduli multiply, arguments add", "params": { "operation": "multiply", "z1Re": 2, "z1Im": 1, "z2Re": 1, "z2Im": 1 }, "run": "static",
    "expect": { "wRe": { "value": 1, "absTol": 1e-9 }, "wIm": { "value": 3, "absTol": 1e-9 }, "wMod": { "value": 3.16227766017, "absTol": 1e-9 },
                "wArg": { "value": 1.24904577240, "absTol": 1e-9 }, "z1Mod": { "value": 2.2360679775, "absTol": 1e-9 }, "z2Mod": { "value": 1.41421356237, "absTol": 1e-9 },
                "z1Arg": { "value": 0.463647609001, "absTol": 1e-9 }, "z2Arg": { "value": 0.785398163397, "absTol": 1e-9 } } },
  { "name": "division undoes the product", "params": { "operation": "divide", "z1Re": 1, "z1Im": 3, "z2Re": 1, "z2Im": 1 }, "run": "static",
    "expect": { "wRe": { "value": 2, "absTol": 1e-9 }, "wIm": { "value": 1, "absTol": 1e-9 }, "wMod": { "value": 2.2360679775, "absTol": 1e-9 } } },
  { "name": "de Moivre: (-1 + i)^5 = 4 - 4i", "params": { "operation": "power", "z1Re": -1, "z1Im": 1, "n": 5 }, "run": "static",
    "expect": { "wRe": { "value": 4, "absTol": 1e-9 }, "wIm": { "value": -4, "absTol": 1e-9 }, "wMod": { "value": 5.65685424949, "absTol": 1e-9 },
                "wArg": { "value": -0.785398163397, "absTol": 1e-9 } } },
  { "name": "roots of z^4 = -4: principal root 1 + i, roots sum to 0", "params": { "operation": "roots", "z1Re": -4, "z1Im": 0, "n": 4 }, "run": "static",
    "expect": { "wRe": { "value": 1, "absTol": 1e-9 }, "wIm": { "value": 1, "absTol": 1e-9 }, "wMod": { "value": 1.41421356237, "absTol": 1e-9 },
                "wArg": { "value": 0.785398163397, "absTol": 1e-9 }, "z1Arg": { "value": 3.14159265359, "absTol": 1e-9 }, "rootSumMod": { "value": 0, "absTol": 1e-12 } } },
  { "name": "i squared is -1 with argument pi, not -pi", "params": { "operation": "power", "z1Re": 0, "z1Im": 1, "n": 2 }, "run": "static",
    "expect": { "wRe": { "value": -1, "absTol": 1e-9 }, "wIm": { "value": 0, "absTol": 1e-9 }, "wArg": { "value": 3.14159265359, "absTol": 1e-9 } } },
  { "name": "seventh roots of unity sum to zero (preset)", "preset": "roots-of-unity", "params": {}, "run": "static",
    "expect": { "wRe": { "value": 1, "absTol": 1e-9 }, "wIm": { "value": 0, "absTol": 1e-9 }, "rootSumMod": { "value": 0, "absTol": 1e-12 } } }
]
```
