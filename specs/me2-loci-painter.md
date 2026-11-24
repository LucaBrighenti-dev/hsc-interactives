---
id: me2-loci-painter
title: "Loci painter"
subject: me2
engine: argand
setup: loci
priority: P1
status: approved            # stub → draft → approved (Gate B)
page: /interactives/maths-ext2/loci-painter.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Mathematics Extension 2","version":"2024","area":"Complex numbers","focusArea":"Introduction to complex numbers","year":12,"outcomes":[],"verified":false}
---
# Loci painter

> Backlog summary: Circles, rays and perpendicular bisectors shaded for modulus and argument conditions.

## Learning goal
Students read |z − a| as the distance from a and arg(z − a) as the direction from a, and so sketch the circles, discs, perpendicular bisectors, half-planes, rays and sectors given by modulus and argument conditions. They decide which boundaries are included (solid) and which are excluded (dashed; a ray never includes its vertex), shade the set where two conditions hold together, and test a point against each condition.

## What the student sees
A square Argand diagram fills the stage at 1920×1080: equal scales, gridlines every 1 unit, tick labels at least 18 px, from −viewRange to +viewRange on both axes (default ±4).

- **Shading:** the set where every condition holds is shaded with a flat tint and hatching (computed per pixel, with the analytic boundary curves drawn over it). An equation on its own (=) is drawn as a thick curve with no shading.
- **Boundaries:** included boundaries are solid; excluded boundaries (strict inequalities) are dashed. A ray's vertex, or any boundary point that is not included, is a hollow ring. Where the boundaries of two conditions meet, the meeting points are marked and labelled.
- **Construction:** the points a₁ and a₂ (and b₁, b₂ for bisectors) are labelled draggable handles. A bisector shows the segment from a to b. An argument condition shows a dashed reference line through its vertex and the angle θ as an arc. The radius and the angle of a ray can also be dragged.
- **Legend (top left):** each condition as written in z with the current numbers, for example "|z − (1 + i)| ≤ 2" and "arg z ≥ 0", plus its Cartesian form where it has one (for example "(x − 1)² + (y − 1)² ≤ 4"), and a key: region, boundary included, boundary not included, point not included.
- **Test point z:** a draggable crosshair. For each condition the legend shows the value and the verdict, for example "|z − (1 + i)| = 1 ≤ 2? yes" and "arg z = 1.11 ≥ 0? yes", then "Satisfies both conditions" or "Does not satisfy both conditions". At the vertex of an argument condition the verdict reads "undefined, so no".

This setup is static: there is no play button.

## Parameters
Keys are from the `argand` engine meta on `origin/w1/engine-argand` (commit 8caa8d0). Condition i (i = 1, 2) is "type, relation": `modulus` means |z − aᵢ| REL rᵢ (circle), `argument` means arg(z − aᵢ) REL θᵢ (ray), and `bisector` means |z − aᵢ| REL |z − bᵢ|, where REL is one of =, <, ≤, >, ≥. Condition 2 is joined to condition 1 by "and". A sector θ₁ ≤ arg(z − a) ≤ θ₂ is made from two argument conditions with the same vertex.

Angles and the cut along arg = π:
- θ is entered in degrees from −179° to 180°, so −π itself cannot be chosen: the ray from a in the negative real direction is θ = 180° (π). A point on that ray has principal argument exactly π (also when its imaginary part is −0), so it satisfies arg(z − a) = 180°.
- Argument inequalities use the principal argument, so each one has a second edge along the cut, the ray from a at angle π. arg(z − a) < θ or ≤ θ means −π < arg(z − a) < θ (or ≤ θ). The cut is **not** included, because arg never equals −π, so it is drawn dashed. arg(z − a) > θ or ≥ θ means θ < arg(z − a) ≤ π (or ≥), and the cut **is** included, so it is drawn solid. With θ = 180°, "≥" is just the ray, "<" is every point except the ray and the vertex, and there is no separate cut edge.
- A sector that crosses the negative real axis (for example 3π/4 ≤ arg z or arg z ≤ −3π/4) is a union of two pieces ("or"), so it cannot be made from two conditions joined by "and".
- If a and b coincide, a bisector condition compares |z − a| with itself: =, ≤ and ≥ hold for every z, and < and > for none. No boundary line is drawn; the legend should say "a and b must be different points" (an engine request below).

| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| locus1 | Condition 1 | | | | | modulus | enum, select: `modulus`, `argument`, `bisector` |
| rel1 | Relation 1 | | | | | le | enum, segmented: `eq`, `lt`, `le`, `gt`, `ge` |
| a1Re | Re a₁ | | −10 | 10 | 0.1 | 1 | also set by dragging |
| a1Im | Im a₁ | | −10 | 10 | 0.1 | 1 | |
| r1 | Radius r₁ | | 0.1 | 10 | 0.1 | 2 | visible for modulus |
| theta1 | Angle θ₁ | ° | −179 | 180 | 1 | 45 | visible for argument; shown as a multiple of π when angles are in radians |
| b1Re | Re b₁ | | −10 | 10 | 0.1 | −1 | visible for bisector |
| b1Im | Im b₁ | | −10 | 10 | 0.1 | 2 | visible for bisector |
| locus2 | Condition 2 (and) | | | | | none | enum, select: `none`, `modulus`, `argument`, `bisector` |
| rel2, a2Re, a2Im, r2, theta2, b2Re, b2Im | as for condition 1 | | | | | ge, 0, 0, 1, 0, 2, 0 | visible when condition 2 is not none |
| showProbe | Test point z | | | | | on | boolean |
| zRe | Re z | | −10 | 10 | 0.1 | 2.5 | visible when the test point is on; also set by dragging |
| zIm | Im z | | −10 | 10 | 0.1 | 2 | as above |
| angleUnit | Show arguments in | | | | | rad | enum: `rad` (multiples of π where exact), `deg` |
| viewRange | Axis range ± | | 1 | 10 | 0.5 | 4 | |

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | condition 1: modulus ≤, a₁ = 1 + i, r₁ = 2; condition 2: argument ≥, a₂ = 0, θ₂ = 0°; z = 1 + 2i; test point on; angles rad; view 4 | the part of a disc on or above the real axis (the origin is excluded because arg 0 is undefined) |
| strict-boundary | condition 1: modulus <, a₁ = 2 + i, r₁ = 1; condition 2: none; z = 3 + i | z sits on the dashed boundary and is not in the region |
| ray | condition 1: argument =, a₁ = 1, θ₁ = 45°; condition 2: none; z = 2 + i | a ray starts at its vertex, which it excludes; it is not a whole line |
| bisector | condition 1: bisector =, a₁ = 1, b₁ = 3 + 2i; condition 2: none; z = 2 + i | the perpendicular bisector x + y = 3 |
| half-plane | condition 1: bisector ≤, a₁ = 0, b₁ = 2i; condition 2: none; z = 3 + 0.5i | \|z\| ≤ \|z − 2i\| is the half-plane Im z ≤ 1 |
| sector | condition 1: argument ≥, a₁ = 0, θ₁ = −45°; condition 2: argument <, a₂ = 0, θ₂ = 60°; z = 1 + i | −π/4 ≤ arg z < π/3: one solid edge, one dashed edge |
| ray-meets-circle | condition 1: modulus =, a₁ = 2, r₁ = 2; condition 2: argument =, a₂ = 0, θ₂ = 45°; z = 2 + 2i | the ray arg z = π/4 meets the circle \|z − 2\| = 2 only at 2 + 2i, because the origin is excluded |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| probeDistA1 | \|z − a₁\| | | 3 |
| probeArgA1 | arg(z − a₁) | rad | 3 |
| probeDistB1 | \|z − b₁\| | | 3 |
| probeDistA2 | \|z − a₂\| | | 3 |
| probeArgA2 | arg(z − a₂) | rad | 3 |
| probeDistB2 | \|z − b₂\| | | 3 |
| probeInside | z in the set (1 yes, 0 no) | | 1 |

Definitions (from the engine): distances and principal arguments are measured from the test point z. probeArgA is NaN when z = a (the argument of 0 is undefined), and an argument condition is then not satisfied. probeDistB is NaN unless that condition is a bisector; condition-2 outputs are NaN when condition 2 is none. probeInside is 1 when z satisfies every condition exactly as written: a boundary point (to within 1e-9, scaled by the sizes involved; for arguments, within 1e-9 rad of θ) satisfies =, ≤ and ≥ but not < or >. On the cut along arg = π the comparison uses arg = π, which gives exactly the included and excluded edges described under Parameters.

## Assumptions shown on stage
- arg is the principal argument, −π < arg z ≤ π
- Solid boundary: included. Dashed boundary or hollow ring: not included
- Shading is computed point by point on a fine grid; boundaries are exact curves

## Try this (3–5 predict, observe, explain prompts)
1. Predict: in "Strict boundary", is z = 3 + i in the region |z − (2 + i)| < 1? Check the verdict, then change the relation to ≤.
2. Observe: in "Ray", drag z around the vertex. Where does z satisfy arg(z − 1) = π/4, and what happens at z = 1 and at z = −i?
3. Predict: what shape is |z| ≤ |z − 2i|? Sketch it before choosing "Half-plane", then explain the boundary using distances.
4. Observe: in "Ray meets circle", where do the ray and the circle meet? Drag z to the origin: why does it fail the second condition even though it is on the circle?
5. Explain: in the default scenario, why is the origin outside the shaded region even though |0 − (1 + i)| ≤ 2?

## Teacher notes outline
- Misconceptions to target: |z − a| measured from −a instead of a (a sign slip in |z + 1 − i|); a ray drawn as a full line, or with its vertex included; strict and non-strict boundaries drawn the same; arg(z − a) measured at the origin instead of at a; the greatest arg z on a circle is at the "top" of the circle rather than at the tangent from O; the greatest |z| on a circle found by adding the real and imaginary parts.
- 10-minute lesson flow: (1) default region: read each condition aloud as distance and direction, then predict the shading (2 min); (2) strict-boundary and ray presets: solid, dashed and hollow (2 min); (3) bisector and half-plane: equal distances, and the algebra x + y = 3 from |z − 1| = |z − (3 + 2i)| (3 min); (4) ray meets circle and the sector: intersections of loci and excluded vertices (3 min).
- Original HSC-style question idea: the complex number z satisfies |z − 1 − √3 i| = 1. (a) Sketch the locus of z. (b) Find the greatest and least values of |z|. (Answer: 3 and 1.) (c) Show that π/6 ≤ arg z ≤ π/2. (d) On the same diagram, shade the region where |z − 1 − √3 i| ≤ 1 and |z| ≤ |z − 2|, and describe its boundary. Write the full question and worked solution in the notes file.

## Accessibility notes
- Second cues beyond colour: the region is hatched as well as tinted; included and excluded boundaries differ by solid and dashed lines; excluded points are hollow rings; each verdict is written in words ("yes", "no", "undefined, so no").
- Keyboard: every handle (a₁, b₁, a₂, b₂, z, and the radius and angle) has matching sliders, so the page works without a pointer. The condition types and relations are selects and segmented controls.
- Stage aria-label (from `describe()`), for example: "Argand diagram shading the points where |z − (1 + i)| ≤ 2 and arg z ≥ 0. The test point 1 + 2i satisfies both conditions."

## Engine change requests
Keys and outputs above match the `argand` meta on `origin/w1/engine-argand` (8caa8d0). Requests (not used by the acceptance block below):
- **Extremes of |z| and arg z on a modulus condition** (outputs `minMod1`, `maxMod1`, `minArg1`, `maxArg1`, plus a "Show extremes" overlay with the line from O through a₁ and the two tangents from O). These are standard Ext 2 questions. Formulas for |z − a| = r with |a| > r: least and greatest |z| are |a| − r and |a| + r; least and greatest arg z are arg a ∓ sin⁻¹(r/|a|) (when both lie in (−π, π]). Test values for |z − (3 + 4i)| = 2: 3, 7, tan⁻¹(4/3) − sin⁻¹(2/5) = 0.927295218 − 0.411516846 = **0.515778372**, and 0.927295218 + 0.411516846 = **1.338812064**.
- **Per-condition verdicts** as outputs (`probeIn1`, `probeIn2`), so a page can show which condition fails; the legend already says so in words.
- **Coincident bisector points:** when a and b coincide (the engine already draws no line), say "a and b must be different points" in the legend. The extremes outputs above are undefined in that case (NaN).

## Acceptance
Every number below comes from the formula and hand calculation shown here. All checks are static. |x + iy| = √(x² + y²); arg is the principal argument; θ is entered in degrees (45° = π/4).

- **Check 1, a point inside a disc.** |z − (1 + i)| ≤ 2, z = 2 + 2i. z − a₁ = 1 + i, so |z − a₁| = **√2 = 1.41421356237** ≤ 2 and **probeInside = 1**. arg(1 + i) = **π/4 = 0.785398163397**.
- **Check 2, a strict boundary excludes the point.** |z − (2 + i)| < 1, z = 3 + i. z − a₁ = 1, so |z − a₁| = **1** = r₁ exactly: on the boundary, and `<` fails, so **probeInside = 0**.
- **Check 3, the same point with ≤.** |z − (2 + i)| ≤ 1, z = 3 + i: on the boundary, and `≤` holds, so **probeInside = 1**.
- **Check 4, a point on a ray.** arg(z − 1) = π/4, z = 2 + i. z − 1 = 1 + i, argument **π/4 = 0.785398163397**, so **probeInside = 1**.
- **Check 5, the opposite direction is not on the ray.** Same ray, z = −i. z − 1 = −1 − i, argument **−3π/4 = −2.35619449019**, so **probeInside = 0**.
- **Check 6, perpendicular bisector.** |z − 1| = |z − (3 + 2i)|, z = 2 + i (the midpoint of 1 and 3 + 2i). |z − 1| = |1 + i| = √2 and |z − (3 + 2i)| = |−1 − i| = √2, so **both distances are 1.41421356237** and **probeInside = 1**. (The bisector is x + y = 3: it passes through the midpoint (2, 1) and is perpendicular to the direction 2 + 2i.)
- **Check 7, default region: z in both.** |z − (1 + i)| ≤ 2 and arg z ≥ 0, z = 1 + 2i. z − a₁ = i, so |z − a₁| = **1** ≤ 2. arg(1 + 2i) = tan⁻¹ 2 = **1.10714871779** ≥ 0. **probeInside = 1**.
- **Check 8, default region: z in the disc but below the axis.** z = 2 − 0.5i. z − a₁ = 1 − 1.5i, so |z − a₁| = √(1 + 2.25) = **√3.25 = 1.80277563773** ≤ 2, but arg(2 − 0.5i) = −tan⁻¹(0.25) = **−0.244978663127** < 0, so **probeInside = 0**.
- **Check 9, where a ray meets a circle.** |z − 2| = 2 and arg z = π/4, z = 2 + 2i. |z − 2| = |2i| = **2**, and arg(2 + 2i) = **π/4 = 0.785398163397**, so **probeInside = 1**. Algebra check: on the ray z = t(1 + i) with t > 0, |t − 2 + ti|² = 4 gives (t − 2)² + t² = 4, so 2t² − 4t = 0 and t = 0 or 2; t = 0 is the excluded vertex.
- **Check 10, the vertex is excluded.** Same conditions, z = 0. |0 − 2| = **2**, so z is on the circle, but arg 0 is undefined, so **probeInside = 0**.
- **Check 11, the ray at θ = π.** arg z = 180°, z = −2. arg(−2 + 0i) = **π = 3.14159265359** and 180° = π, so **probeInside = 1**.
- **Check 12, the cut is excluded for "<".** arg z < −90°, z = −2. arg(−2) = π, which is not less than −π/2, so **probeInside = 0**: the negative real axis is the excluded (dashed) edge of this region.
- **Check 13, just below the cut.** Same condition, z = −2 − 0.1i. arg(−2 − 0.1i) = −(π − tan⁻¹(0.1/2)) = −(3.14159265359 − 0.0499583957) = **−3.09163425787**, which is less than −π/2 = −1.5708, so **probeInside = 1**.
- **Check 14, the cut is included for "≥".** arg z ≥ 90°, z = −2. arg(−2) = π ≥ π/2, so **probeInside = 1**: the negative real axis is a solid edge of the region π/2 ≤ arg z ≤ π.

```acceptance
[
  { "name": "point inside the disc |z - (1 + i)| <= 2", "params": { "locus1": "modulus", "rel1": "le", "a1Re": 1, "a1Im": 1, "r1": 2, "locus2": "none", "zRe": 2, "zIm": 2 }, "run": "static",
    "expect": { "probeDistA1": { "value": 1.41421356237, "absTol": 1e-9 }, "probeArgA1": { "value": 0.785398163397, "absTol": 1e-9 }, "probeInside": { "value": 1, "absTol": 1e-9 } } },
  { "name": "strict boundary excludes z", "params": { "locus1": "modulus", "rel1": "lt", "a1Re": 2, "a1Im": 1, "r1": 1, "locus2": "none", "zRe": 3, "zIm": 1 }, "run": "static",
    "expect": { "probeDistA1": { "value": 1, "absTol": 1e-9 }, "probeInside": { "value": 0, "absTol": 1e-9 } } },
  { "name": "non-strict boundary includes z", "params": { "locus1": "modulus", "rel1": "le", "a1Re": 2, "a1Im": 1, "r1": 1, "locus2": "none", "zRe": 3, "zIm": 1 }, "run": "static",
    "expect": { "probeDistA1": { "value": 1, "absTol": 1e-9 }, "probeInside": { "value": 1, "absTol": 1e-9 } } },
  { "name": "point on the ray arg(z - 1) = pi/4", "params": { "locus1": "argument", "rel1": "eq", "a1Re": 1, "a1Im": 0, "theta1": 45, "locus2": "none", "zRe": 2, "zIm": 1 }, "run": "static",
    "expect": { "probeArgA1": { "value": 0.785398163397, "absTol": 1e-9 }, "probeInside": { "value": 1, "absTol": 1e-9 } } },
  { "name": "opposite direction is not on the ray", "params": { "locus1": "argument", "rel1": "eq", "a1Re": 1, "a1Im": 0, "theta1": 45, "locus2": "none", "zRe": 0, "zIm": -1 }, "run": "static",
    "expect": { "probeArgA1": { "value": -2.35619449019, "absTol": 1e-9 }, "probeInside": { "value": 0, "absTol": 1e-9 } } },
  { "name": "midpoint lies on the perpendicular bisector", "params": { "locus1": "bisector", "rel1": "eq", "a1Re": 1, "a1Im": 0, "b1Re": 3, "b1Im": 2, "locus2": "none", "zRe": 2, "zIm": 1 }, "run": "static",
    "expect": { "probeDistA1": { "value": 1.41421356237, "absTol": 1e-9 }, "probeDistB1": { "value": 1.41421356237, "absTol": 1e-9 }, "probeInside": { "value": 1, "absTol": 1e-9 } } },
  { "name": "default region: z in both", "params": { "locus1": "modulus", "rel1": "le", "a1Re": 1, "a1Im": 1, "r1": 2, "locus2": "argument", "rel2": "ge", "a2Re": 0, "a2Im": 0, "theta2": 0, "zRe": 1, "zIm": 2 }, "run": "static",
    "expect": { "probeDistA1": { "value": 1, "absTol": 1e-9 }, "probeArgA2": { "value": 1.10714871779, "absTol": 1e-9 }, "probeInside": { "value": 1, "absTol": 1e-9 } } },
  { "name": "default region: z in the disc but below the axis", "params": { "locus1": "modulus", "rel1": "le", "a1Re": 1, "a1Im": 1, "r1": 2, "locus2": "argument", "rel2": "ge", "a2Re": 0, "a2Im": 0, "theta2": 0, "zRe": 2, "zIm": -0.5 }, "run": "static",
    "expect": { "probeDistA1": { "value": 1.80277563773, "absTol": 1e-9 }, "probeArgA2": { "value": -0.244978663127, "absTol": 1e-9 }, "probeInside": { "value": 0, "absTol": 1e-9 } } },
  { "name": "the ray arg z = pi/4 meets |z - 2| = 2 at 2 + 2i", "params": { "locus1": "modulus", "rel1": "eq", "a1Re": 2, "a1Im": 0, "r1": 2, "locus2": "argument", "rel2": "eq", "a2Re": 0, "a2Im": 0, "theta2": 45, "zRe": 2, "zIm": 2 }, "run": "static",
    "expect": { "probeDistA1": { "value": 2, "absTol": 1e-9 }, "probeArgA2": { "value": 0.785398163397, "absTol": 1e-9 }, "probeInside": { "value": 1, "absTol": 1e-9 } } },
  { "name": "the vertex of the ray is excluded", "params": { "locus1": "modulus", "rel1": "eq", "a1Re": 2, "a1Im": 0, "r1": 2, "locus2": "argument", "rel2": "eq", "a2Re": 0, "a2Im": 0, "theta2": 45, "zRe": 0, "zIm": 0 }, "run": "static",
    "expect": { "probeDistA1": { "value": 2, "absTol": 1e-9 }, "probeInside": { "value": 0, "absTol": 1e-9 } } },
  { "name": "a point on the ray at theta = 180 degrees", "params": { "locus1": "argument", "rel1": "eq", "a1Re": 0, "a1Im": 0, "theta1": 180, "locus2": "none", "zRe": -2, "zIm": 0 }, "run": "static",
    "expect": { "probeArgA1": { "value": 3.14159265359, "absTol": 1e-9 }, "probeInside": { "value": 1, "absTol": 1e-9 } } },
  { "name": "the cut along arg = pi is excluded for arg z < -90 degrees", "params": { "locus1": "argument", "rel1": "lt", "a1Re": 0, "a1Im": 0, "theta1": -90, "locus2": "none", "zRe": -2, "zIm": 0 }, "run": "static",
    "expect": { "probeArgA1": { "value": 3.14159265359, "absTol": 1e-9 }, "probeInside": { "value": 0, "absTol": 1e-9 } } },
  { "name": "just below the cut satisfies arg z < -90 degrees", "params": { "locus1": "argument", "rel1": "lt", "a1Re": 0, "a1Im": 0, "theta1": -90, "locus2": "none", "zRe": -2, "zIm": -0.1 }, "run": "static",
    "expect": { "probeArgA1": { "value": -3.09163425787, "absTol": 1e-9 }, "probeInside": { "value": 1, "absTol": 1e-9 } } },
  { "name": "the cut along arg = pi is included for arg z >= 90 degrees", "params": { "locus1": "argument", "rel1": "ge", "a1Re": 0, "a1Im": 0, "theta1": 90, "locus2": "none", "zRe": -2, "zIm": 0 }, "run": "static",
    "expect": { "probeArgA1": { "value": 3.14159265359, "absTol": 1e-9 }, "probeInside": { "value": 1, "absTol": 1e-9 } } }
]
```
