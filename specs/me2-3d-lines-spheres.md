---
id: me2-3d-lines-spheres
title: "3D lines and spheres"
subject: me2
engine: space3d
setup: lines-spheres
priority: P1
status: draft            # stub → draft → approved (Gate B)
page: /interactives/maths-ext2/3d-lines-spheres.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Mathematics Extension 2","version":"2024","area":"Vectors","focusArea":"Further work with vectors","year":12,"outcomes":[],"verified":false}
---
# 3D lines and spheres

> Backlog summary: Vector equation of a line; intersecting, parallel and skew pairs; sphere-line intersections.

## Learning goal
Students describe a line in three dimensions by a vector equation r = a + λu and decide whether two lines intersect, are parallel or are skew, by comparing direction vectors and then trying to solve for λ and μ. They find where a line meets a sphere |r − c| = R by substituting the line into the sphere, and see that the discriminant of the resulting quadratic in λ counts the intersection points (two, one or none).

## What the student sees
A three.js scene fills the stage at 1920×1080, in the light projector theme by default. Right-handed x, y and z axes run from −8 to 8, each with a text label (x, y, z) and tick labels every 2 units. A faint grid lies in the xy-plane. The default camera looks from the first octant (isometric-style); dragging rotates it (OrbitControls), the wheel zooms, and the **View from** control snaps the camera to look down an axis.

**Two lines mode (default):**
- Line 1 is a solid orange line and line 2 a dashed graphite line, both clipped to the cube −10 ≤ x, y, z ≤ 10. Each has its point a (a small sphere with the label "A₁" or "A₂") and its direction vector drawn as an arrow from that point, labelled u or v.
- A moving point P = a₁ + λu (a hollow orange ring) slides along line 1 as the λ slider moves, with its position vector drawn from the origin and labelled with its coordinates.
- A verdict banner in the top-left corner reads **Intersecting at (2, 1, 5)**, **Parallel**, **Coincident** or **Skew**, with one line of reasoning underneath, for example "u is not a multiple of v, and the three equations for λ and μ are inconsistent".
- When the lines intersect, the intersection point is a filled diamond with its coordinates. With **Show closest approach** on and the lines skew (or parallel), the shortest segment between them is drawn dotted and labelled with its length.
- The equations of both lines are shown in the corner in column-vector form, using the current numbers.

**Line and sphere mode:**
- Line 1 as above, and a translucent sphere (flat matte fill at 25% opacity with a solid outline ring facing the camera, no shading highlights) with centre C marked and labelled.
- The quadratic from substituting the line into the sphere is shown with numbers, for example "2λ² − 10λ + 8 = 0, Δ = 36", with the intersection points (filled diamonds, labelled with λ and coordinates) marked on the line. A tangent point is a single diamond labelled "tangent".
- The moving point P = a₁ + λu shows its distance from C, and its ring turns from hollow to filled while it is inside the sphere.

This setup is static: there is no play button.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| mode | Show | | | | | lines | enum: `lines` (two lines), `sphere` (line and sphere) |
| point1 | Line 1 point a₁ (x, y, z) | | −10 | 10 | | 1, 2, 3 | list, exactly 3 items (minItems 3, maxItems 3) |
| dir1 | Line 1 direction u (x, y, z) | | −10 | 10 | | 1, −1, 2 | list, 3 items; the zero vector shows "A direction vector can't be zero" |
| point2 | Line 2 point a₂ (x, y, z) | | −10 | 10 | | 2, 0, 1 | list, 3 items; visible when mode is lines |
| dir2 | Line 2 direction v (x, y, z) | | −10 | 10 | | 1, 1, 1 | list, 3 items; visible when mode is lines |
| centre | Sphere centre c (x, y, z) | | −10 | 10 | | 1, 1, 1 | list, 3 items; visible when mode is sphere |
| radius | Sphere radius R | | 0.5 | 10 | 0.5 | 3 | visible when mode is sphere |
| lambda | λ for the moving point P | | −10 | 10 | 0.1 | 0 | P = a₁ + λu on line 1 |
| showClosest | Show closest approach | | | | | off | boolean; visible when mode is lines |
| viewFrom | View from | | | | | iso | enum: `iso` (3D), `top` (down the z-axis), `front` (along the y-axis), `side` (along the x-axis); snaps the camera, after which dragging rotates freely |

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | mode lines, a₁ = (1, 2, 3), u = (1, −1, 2), a₂ = (2, 0, 1), v = (1, 1, 1), λ = 0, closest approach off, view iso | skew lines: not parallel, but the equations for λ and μ have no common solution |
| intersecting | as default but a₂ = (0, −1, 3) | the lines meet at (2, 1, 5) when λ = 1 and μ = 2 |
| parallel | as default but a₂ = (0, 0, 0), v = (−2, 2, −4) | v = −2u, so parallel; distance √(59/6) ≈ 3.14 |
| coincident | as default but a₂ = (3, 0, 7), v = (−1, 1, −2) | the same line written two ways (a₂ is a₁ + 2u) |
| skew-from-above | default lines, closest approach on, view top | from above the skew lines appear to cross; rotate to see the gap |
| sphere-two-points | mode sphere, a₁ = (1, 0, 5), u = (0, 1, −1), c = (1, 1, 1), R = 3 | the line cuts the sphere at λ = 1 and λ = 4 |
| sphere-tangent | mode sphere, a₁ = (−2, 1, 4), u = (1, 0, 0), c = (1, 1, 1), R = 3 | discriminant 0: the line touches the sphere at (1, 1, 4) |
| sphere-miss | as sphere-two-points but R = 2 | discriminant −4: the line passes 2.12 from the centre, outside a sphere of radius 2 |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| angle | Angle between the lines | ° | 4 |
| distance | Shortest distance between the lines | | 3 |
| ix | Intersection x | | 3 |
| iy | Intersection y | | 3 |
| iz | Intersection z | | 3 |
| px | P x | | 3 |
| py | P y | | 3 |
| pz | P z | | 3 |
| discriminant | Discriminant Δ | | 3 |
| hits | Points of intersection with the sphere | | whole number (`integer: true`, guide §5.10) |
| lambda1 | First λ on the sphere | | 3 |
| lambda2 | Second λ on the sphere | | 3 |
| chord | Chord length | | 3 |
| centreDistance | Distance from c to the line | | 3 |

Not shown as readouts but used by the acceptance checks and the verdict banner: `relation` (0 intersecting, 1 parallel and distinct, 2 coincident, 3 skew; NaN in sphere mode), `lambdaI` and `muI` (the parameters at the intersection), and `pCentreDistance` (|P − c|).

Definitions:
- angle = cos⁻¹(|u·v| / (|u||v|)), the acute angle between the lines, in degrees.
- Parallel when |u × v| ≤ 1e-9 |u||v|. Then distance = |(a₂ − a₁) × u| / |u|; coincident when that distance is ≤ 1e-9.
- Otherwise distance = |(a₂ − a₁)·(u × v)| / |u × v|; intersecting when that is ≤ 1e-9 (then ix, iy, iz, lambdaI, muI are set), skew otherwise. Intersection outputs are NaN unless the lines intersect.
- Sphere: substituting r = a₁ + λu into |r − c|² = R² gives Aλ² + Bλ + C = 0 with A = |u|², B = 2u·(a₁ − c), C = |a₁ − c|² − R², and Δ = B² − 4AC. hits = 2, 1 or 0 as Δ > 0, Δ = 0 or Δ < 0, where |Δ| ≤ 1e-9 (B² + |4AC|) counts as 0. lambda1 ≤ lambda2 are the roots (equal when tangent, NaN for a miss); chord = |u|(lambda2 − lambda1) (0 when tangent, NaN for a miss); centreDistance = |(a₁ − c) × u| / |u|. Sphere outputs are NaN in lines mode, and line-pair outputs are NaN in sphere mode.

## Assumptions shown on stage
- Lines extend without end; drawn clipped to −10 ≤ x, y, z ≤ 10
- Right-handed axes, equal scales
- Angle between lines is the acute angle between their directions

## Try this (3–5 predict, observe, explain prompts)
1. Predict: in the default scenario, choose **View from: top**. The lines seem to cross. Do they really meet? Rotate the scene, then turn on **Show closest approach**.
2. Observe: change only a₂ until the verdict says **Intersecting**. Which equation for λ and μ was failing before, and what made it work?
3. Predict: v = (−2, 2, −4). Are the lines parallel, coincident or neither? Check by setting a₂ = (3, 0, 7), then a₂ = (0, 0, 0).
4. Observe: in **Line and sphere**, slide λ from −10 to 10 and watch |P − c|. At which λ values does P cross the sphere, and how do they match the quadratic's roots?
5. Explain: decrease R from 3 to 2 in "Line and sphere". Why does the discriminant change sign at the same moment that R passes the distance from c to the line?

## Teacher notes outline
- Misconceptions to target: two lines that are not parallel must intersect (true in the plane, false in space); the direction vector depends on which point is chosen; lines with directions u and −2u are different lines; "no solution for λ" means the line misses the sphere even when the algebra was set up with the wrong point; a 2D picture (top view) of skew lines shows a real intersection.
- 10-minute lesson flow: (1) default skew pair from the top view: "do they meet?" (2 min); (2) rotate and set up the three equations for λ and μ; solve two, test the third (3 min); (3) parallel and coincident presets: the role of u × v or of u = kv (2 min); (4) line and sphere: substitute, form the quadratic, read Δ; slide λ to see the roots as crossing points (3 min).
- Original HSC-style question idea: the line ℓ passes through A(3, −1, 2) in the direction 2i + j + 2k, and m is the line r = i + μ(i + j − k). (a) Show that ℓ and m are skew. (b) Show that ℓ meets the sphere |r − (i + 2j + k)| = √14 at A and at exactly one other point, and find that point. (Answer: substituting gives 9λ² + 6λ = 0, so λ = 0 or −2/3; the other point is (5/3, −5/3, 2/3).) Write the full question and worked solution in the notes file.

## Accessibility notes
- Second cues beyond colour: line 1 is solid and line 2 dashed; points are labelled A₁, A₂ and C; the intersection is a diamond and P a ring (hollow outside the sphere, filled inside). The verdict banner states the relationship in words.
- Keyboard: every value is a text field or slider, so the page works without a pointer. The **View from** control replaces mouse rotation for keyboard users. OrbitControls keyboard panning stays off so the arrow keys keep working in the controls panel.
- Stage aria-label (from `describe()`), for example: "Two lines in 3D. Line 1 through (1, 2, 3) with direction (1, −1, 2); line 2 through (2, 0, 1) with direction (1, 1, 1). The lines are skew, 2.41 units apart at their closest." In sphere mode: "Line through (1, 0, 5) with direction (0, 1, −1) and a sphere of radius 3 centred at (1, 1, 1). The line meets the sphere at 2 points, λ = 1 and λ = 4."

## Engine change requests
No `space3d` engine meta had been pushed when this spec was written (origin had no `w1/engine-space3d` branch on 25 Nov). **Keys to reconcile with engine meta:**
- Params for setup `lines-spheres`: `mode`, `point1`, `dir1`, `point2`, `dir2`, `centre`, `radius`, `lambda`, `showClosest`, `viewFrom`. The points and directions are `list` params of exactly three numbers; if the engine prefers scalar params (for example `a1x`, `a1y`, `a1z`), the page builder reconciles them and the acceptance block is updated to match.
- Outputs: `relation`, `angle`, `distance`, `ix`, `iy`, `iz`, `lambdaI`, `muI`, `px`, `py`, `pz`, `discriminant`, `hits`, `lambda1`, `lambda2`, `chord`, `centreDistance`, `pCentreDistance`.
- Behaviour needed: the relative tolerances above for "parallel", "intersecting" and "tangent", so exact cases from integer inputs classify correctly; clamp the cosine to [−1, 1] before cos⁻¹ (√6 × √24 rounds so that |u·v|/(|u||v|) can come out as 1.0000000000000002); `describe()` for the aria-label.

## Acceptance
Every number below comes from the formula and hand calculation shown here. All checks are static.

Line 1 is r = (1, 2, 3) + λ(1, −1, 2) in every lines-mode check, so u = (1, −1, 2) and |u| = √6.

- **Check 1, skew (default).** v = (1, 1, 1), a₂ − a₁ = (1, −2, −2). u is not a multiple of v. Equating components: 1 + λ = 2 + μ, 2 − λ = μ, 3 + 2λ = 1 + μ. The first two give 1 + λ = 4 − λ, so λ = 3/2 and μ = 1/2; the third then reads 6 = 3/2, which is false, so the lines are **skew (relation 3)**. u × v = ((−1)(1) − (2)(1), (2)(1) − (1)(1), (1)(1) − (−1)(1)) = (−3, 1, 2), |u × v| = √14. (a₂ − a₁)·(u × v) = −3 − 2 − 4 = −9, so distance = 9/√14 = **2.40535117721**. u·v = 1 − 1 + 2 = 2 and |v| = √3, so cos θ = 2/√18, θ = **61.8744942979°**.
- **Check 2, intersecting.** a₂ = (0, −1, 3): 1 + λ = μ, 2 − λ = −1 + μ, 3 + 2λ = 3 + μ. The first and third give 2λ = 1 + λ, so **λ = 1, μ = 2**, and the second checks: 2 − 1 = 1 = −1 + 2. The point is (1 + 1, 2 − 1, 3 + 2) = **(2, 1, 5)**, distance **0**, **relation 0**.
- **Check 3, parallel and distinct.** a₂ = (0, 0, 0), v = (−2, 2, −4) = −2u, so u × v = 0 and θ = **0°**. a₂ − a₁ = (−1, −2, −3); (a₂ − a₁) × u = ((−2)(2) − (−3)(−1), (−3)(1) − (−1)(2), (−1)(−1) − (−2)(1)) = (−7, −1, 3), with length √59. Distance = √59/√6 = √(59/6) = **3.13581462037**, **relation 1**.
- **Check 4, coincident.** a₂ = (3, 0, 7), v = (−1, 1, −2) = −u. a₂ − a₁ = (2, −2, 4) = 2u, so a₂ lies on line 1: distance **0**, **relation 2**.
- **Check 5, line cuts the sphere twice.** a₁ = (1, 0, 5), u = (0, 1, −1), c = (1, 1, 1), R = 3. a₁ − c = (0, −1, 4). A = |u|² = 2, B = 2u·(a₁ − c) = 2(0 − 1 − 4) = −10, C = 0 + 1 + 16 − 9 = 8. 2λ² − 10λ + 8 = 0 gives λ² − 5λ + 4 = 0, so **λ = 1 and λ = 4** (the points (1, 1, 4) and (1, 4, 1)). Δ = 100 − 64 = **36**, **hits 2**. Chord = √2 × (4 − 1) = **√18 = 4.24264068712**. (a₁ − c) × u = ((−1)(−1) − (4)(1), (4)(0) − (0)(−1), (0)(1) − (−1)(0)) = (−3, 0, 0), so the distance from c to the line is 3/√2 = **√4.5 = 2.12132034356** (and √(R² − (chord/2)²) = √(9 − 4.5) agrees).
- **Check 6, tangent.** a₁ = (−2, 1, 4), u = (1, 0, 0), c = (1, 1, 1), R = 3. a₁ − c = (−3, 0, 3). A = 1, B = 2(−3) = −6, C = 9 + 0 + 9 − 9 = 9. λ² − 6λ + 9 = (λ − 3)² = 0, so Δ = 36 − 36 = **0**, **hits 1**, **λ = 3** (the point (1, 1, 4)), chord **0**. (a₁ − c) × u = (0·0 − 3·0, 3·1 − (−3)·0, (−3)·0 − 0·1) = (0, 3, 0), so the distance from c is **3** = R.
- **Check 7, line misses the sphere.** As check 5 with R = 2: C = 17 − 4 = 13, Δ = 100 − 104 = **−4**, **hits 0**, and the distance from c to the line is still **2.12132034356**, which is greater than 2.
- **Check 8, the moving point.** λ = 2 on line 1: P = (1 + 2, 2 − 2, 3 + 4) = **(3, 0, 7)**.

```acceptance
[
  { "name": "default lines are skew, 9/sqrt(14) apart", "params": { "mode": "lines", "point1": [1, 2, 3], "dir1": [1, -1, 2], "point2": [2, 0, 1], "dir2": [1, 1, 1] }, "run": "static",
    "expect": { "relation": { "value": 3, "absTol": 1e-9 }, "distance": { "value": 2.40535117721, "absTol": 1e-9 }, "angle": { "value": 61.8744942979, "absTol": 1e-8 } } },
  { "name": "intersecting at (2, 1, 5)", "params": { "mode": "lines", "point1": [1, 2, 3], "dir1": [1, -1, 2], "point2": [0, -1, 3], "dir2": [1, 1, 1] }, "run": "static",
    "expect": { "relation": { "value": 0, "absTol": 1e-9 }, "ix": { "value": 2, "absTol": 1e-9 }, "iy": { "value": 1, "absTol": 1e-9 }, "iz": { "value": 5, "absTol": 1e-9 },
                "lambdaI": { "value": 1, "absTol": 1e-9 }, "muI": { "value": 2, "absTol": 1e-9 }, "distance": { "value": 0, "absTol": 1e-9 } } },
  { "name": "parallel and distinct", "params": { "mode": "lines", "point1": [1, 2, 3], "dir1": [1, -1, 2], "point2": [0, 0, 0], "dir2": [-2, 2, -4] }, "run": "static",
    "expect": { "relation": { "value": 1, "absTol": 1e-9 }, "distance": { "value": 3.13581462037, "absTol": 1e-9 }, "angle": { "value": 0, "absTol": 1e-5 } } },
  { "name": "coincident", "params": { "mode": "lines", "point1": [1, 2, 3], "dir1": [1, -1, 2], "point2": [3, 0, 7], "dir2": [-1, 1, -2] }, "run": "static",
    "expect": { "relation": { "value": 2, "absTol": 1e-9 }, "distance": { "value": 0, "absTol": 1e-9 } } },
  { "name": "line cuts the sphere at lambda = 1 and 4", "params": { "mode": "sphere", "point1": [1, 0, 5], "dir1": [0, 1, -1], "centre": [1, 1, 1], "radius": 3 }, "run": "static",
    "expect": { "hits": { "value": 2, "absTol": 1e-9 }, "discriminant": { "value": 36, "absTol": 1e-9 }, "lambda1": { "value": 1, "absTol": 1e-9 }, "lambda2": { "value": 4, "absTol": 1e-9 },
                "chord": { "value": 4.24264068712, "absTol": 1e-9 }, "centreDistance": { "value": 2.12132034356, "absTol": 1e-9 } } },
  { "name": "tangent line touches at lambda = 3", "params": { "mode": "sphere", "point1": [-2, 1, 4], "dir1": [1, 0, 0], "centre": [1, 1, 1], "radius": 3 }, "run": "static",
    "expect": { "hits": { "value": 1, "absTol": 1e-9 }, "discriminant": { "value": 0, "absTol": 1e-9 }, "lambda1": { "value": 3, "absTol": 1e-6 }, "chord": { "value": 0, "absTol": 1e-6 },
                "centreDistance": { "value": 3, "absTol": 1e-9 } } },
  { "name": "line misses a sphere of radius 2", "params": { "mode": "sphere", "point1": [1, 0, 5], "dir1": [0, 1, -1], "centre": [1, 1, 1], "radius": 2 }, "run": "static",
    "expect": { "hits": { "value": 0, "absTol": 1e-9 }, "discriminant": { "value": -4, "absTol": 1e-9 }, "centreDistance": { "value": 2.12132034356, "absTol": 1e-9 } } },
  { "name": "moving point at lambda = 2", "params": { "mode": "lines", "point1": [1, 2, 3], "dir1": [1, -1, 2], "lambda": 2 }, "run": "static",
    "expect": { "px": { "value": 3, "absTol": 1e-9 }, "py": { "value": 0, "absTol": 1e-9 }, "pz": { "value": 7, "absTol": 1e-9 } } }
]
```
