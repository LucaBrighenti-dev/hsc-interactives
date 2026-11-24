---
id: me2-loci-painter
title: "Loci painter"
subject: me2
engine: argand
setup: loci
priority: P1
status: draft            # stub → draft → approved (Gate B)
page: /interactives/maths-ext2/loci-painter.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Mathematics Extension 2","version":"2024","area":"Complex numbers","focusArea":"Introduction to complex numbers","year":12,"outcomes":[],"verified":false}
---
# Loci painter

> Backlog summary: Circles, rays and perpendicular bisectors shaded for modulus and argument conditions.

## Learning goal
Students read |z − a| as the distance from a and arg(z − a) as the direction from a, and so sketch the circles, discs, perpendicular bisectors, half-planes, rays and sectors given by modulus and argument conditions. They decide which boundaries are included (solid) or excluded (dashed, and a ray never includes its vertex), shade the intersection of two conditions, and find the greatest and least values of |z| and Arg z on a circle.

## What the student sees
A square Argand diagram fills the stage at 1920×1080: equal scales, gridlines every 1 unit, tick labels at least 18 px, from −viewSize to +viewSize on both axes (default ±4).

- **Locus 1** is shaded in light orange with hatching at 45°; **locus 2** in light grey with hatching at −45°. Where both hold, the region is a stronger orange with both hatchings. Curves (circle, bisector, ray) are drawn as thick lines.
- **Boundaries:** included boundaries are solid; excluded boundaries (strict inequalities) are dashed. A ray or sector vertex is a hollow ring with the note "vertex excluded" on hover or focus.
- The points a₁, a₂ (and b₁, b₂ for bisectors) are labelled square handles that can be dragged (snapping to 0.1). A bisector also shows the segment from a to b, its midpoint, and a right-angle mark.
- Each condition is written in the legend at the top left with the current numbers, for example "|z − (1 + i)| ≤ 2" and "0 ≤ arg z ≤ π/2", with arguments written as multiples of π.
- **Probe P** (a draggable crosshair) shows its distance from a₁ and its argument from a₁ as dimension lines and arcs, and a badge reads "P satisfies: locus 1 ✓, locus 2 ✗" (with the words "yes" and "no" beside the symbols).
- **Show extremes** (circle and disc conditions only): a dotted line from O through the centre a₁ marks the nearest and farthest points (least and greatest |z|), and the two tangents from O mark the least and greatest Arg z, each labelled with its value.

This setup is static: there is no play button.

## Parameters
Both loci use the same set of kinds. Locus 2 adds `none`.

| Kind value | Condition |
| --- | --- |
| `circle` | \|z − a\| = r |
| `disc` | \|z − a\| ≤ r |
| `disc-open` | \|z − a\| < r |
| `outside` | \|z − a\| ≥ r |
| `outside-open` | \|z − a\| > r |
| `bisector` | \|z − a\| = \|z − b\| |
| `closer` | \|z − a\| ≤ \|z − b\| |
| `closer-open` | \|z − a\| < \|z − b\| |
| `ray` | arg(z − a) = θ₁ |
| `sector` | θ₁ ≤ arg(z − a) ≤ θ₂ |
| `sector-open` | θ₁ < arg(z − a) < θ₂ |
| `none` | no second condition (locus 2 only) |

| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| kind1 | Locus 1 | | | | | disc | enum, select widget; values above except `none` |
| a1Re | Re a₁ | | −5 | 5 | 0.1 | 1 | also set by dragging |
| a1Im | Im a₁ | | −5 | 5 | 0.1 | 1 | |
| b1Re | Re b₁ | | −5 | 5 | 0.1 | 3 | visible when kind1 is bisector, closer or closer-open |
| b1Im | Im b₁ | | −5 | 5 | 0.1 | 2 | as above |
| r1 | r₁ | | 0.1 | 8 | 0.1 | 2 | visible for circle, disc, disc-open, outside, outside-open |
| angle1 | θ₁ for locus 1 | × π rad | −1 | 1 | 1/12 | 0 | visible for ray and sector kinds; 0.25 means π/4 |
| angleTo1 | θ₂ for locus 1 | × π rad | −1 | 1 | 1/12 | 0.5 | visible for sector kinds |
| kind2 | Locus 2 | | | | | sector | enum, select widget; all values above |
| a2Re | Re a₂ | | −5 | 5 | 0.1 | 0 | hidden when kind2 is none |
| a2Im | Im a₂ | | −5 | 5 | 0.1 | 0 | as above |
| b2Re | Re b₂ | | −5 | 5 | 0.1 | 2 | visible when kind2 is bisector, closer or closer-open |
| b2Im | Im b₂ | | −5 | 5 | 0.1 | 0 | as above |
| r2 | r₂ | | 0.1 | 8 | 0.1 | 1 | visible for the circle and disc kinds |
| angle2 | θ₁ for locus 2 | × π rad | −1 | 1 | 1/12 | 0 | visible for ray and sector kinds |
| angleTo2 | θ₂ for locus 2 | × π rad | −1 | 1 | 1/12 | 0.5 | visible for sector kinds |
| probeRe | Re P | | −5 | 5 | 0.1 | 1 | the probe point; also set by dragging |
| probeIm | Im P | | −5 | 5 | 0.1 | 2 | |
| showProbe | Probe point | | | | | on | boolean |
| showExtremes | Show extremes of \|z\| and arg z | | | | | off | boolean; visible when kind1 is a circle or disc kind |
| viewSize | View half-width | | 2 | 10 | 1 | 4 | |

Angles are entered as multiples of π so that the common values (π/6, π/4, π/3, π/2, 2π/3, 3π/4, …) are exact steps. A sector with θ₁ > θ₂ is empty and the legend says so. A ray at θ = −π is the same ray as θ = π.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | locus 1: disc, a₁ = 1 + i, r₁ = 2; locus 2: sector, a₂ = 0, θ₁ = 0, θ₂ = 0.5 (π/2); P = 1 + 2i; probe on; extremes off; view 4 | a typical two-condition region: the part of a disc in the first quadrant |
| circle-extremes | locus 1: circle, a₁ = 3 + 4i, r₁ = 2; locus 2: none; P = 3 + 2i; extremes on; view 8 | least and greatest \|z\| (3 and 7) and Arg z (tan⁻¹(4/3) ∓ sin⁻¹(2/5)) |
| strict-boundary | locus 1: disc-open, a₁ = 2 + i, r₁ = 1; locus 2: none; P = 3 + i | P sits on the dashed boundary and is not in the region |
| ray | locus 1: ray, a₁ = 1, θ₁ = 0.25 (π/4); locus 2: none; P = 2 + i | a ray starts at its vertex, which it excludes; it is not a whole line |
| bisector | locus 1: bisector, a₁ = 1, b₁ = 3 + 2i; locus 2: none; P = 2 + i | the perpendicular bisector x + y = 3, at distance 3/√2 from O |
| half-plane | locus 1: closer, a₁ = 0, b₁ = 2i; locus 2: none; P = 3 + 0.5i | \|z\| ≤ \|z − 2i\| is the half-plane Im z ≤ 1 |
| sector-and-disc | locus 1: disc, a₁ = 0, r₁ = 2; locus 2: sector-open, a₂ = 0, θ₁ = −0.25, θ₂ = 1/3; P = 1 + i | a "pizza slice" with dashed straight edges and a solid arc |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| dist1A | \|P − a₁\| | | 3 |
| dist1B | \|P − b₁\| | | 3 |
| arg1 | Arg(P − a₁) | rad | 3 |
| dist2A | \|P − a₂\| | | 3 |
| arg2 | Arg(P − a₂) | rad | 3 |
| minMod1 | Least \|z\| on locus 1 | | 3 |
| maxMod1 | Greatest \|z\| on locus 1 | | 3 |
| minArg1 | Least Arg z on locus 1 | rad | 3 |
| maxArg1 | Greatest Arg z on locus 1 | rad | 3 |

Not shown as readouts but used by the probe badge and the acceptance checks: `in1`, `in2` and `inBoth` (1 when P satisfies the condition, 0 when not; `in2` is NaN and `inBoth` equals `in1` when locus 2 is none), and `dist2B`.

Definitions:
- Arg is the principal argument in (−π, π]. arg1 is NaN when P = a₁ (the argument of 0 is undefined), and P = a₁ never satisfies a ray or sector condition.
- P is on a boundary when the two sides of the condition differ by at most 1e-9 (for arguments, when Arg(P − a) is within 1e-9 of θ). On a boundary, `=`, `≤` and `≥` count as satisfied; `<` and `>` do not.
- minMod1 and maxMod1 (inf and sup of |z| over locus 1): circle: ||a₁| − r₁| and |a₁| + r₁; disc kinds: max(0, |a₁| − r₁) and |a₁| + r₁; outside kinds: max(0, r₁ − |a₁|) and ∞; bisector: ||b₁|² − |a₁|²| / (2|b₁ − a₁|) and ∞. NaN for the other kinds. For strict inequalities these are bounds that are not attained, and the stage says so.
- minArg1 and maxArg1 (circle and disc kinds only): when |a₁| > r₁, Arg a₁ − sin⁻¹(r₁/|a₁|) and Arg a₁ + sin⁻¹(r₁/|a₁|), reported only when both lie in (−π, π]; otherwise NaN (O inside the disc, or the disc straddling the negative real axis).

## Assumptions shown on stage
- Arg is the principal argument, −π < Arg z ≤ π
- Solid boundary: included. Dashed boundary or hollow vertex: excluded
- θ values are multiples of π

## Try this (3–5 predict, observe, explain prompts)
1. Predict: in "Strict boundary", is P = 3 + i in the region |z − (2 + i)| < 1? Check the badge, then change the condition to ≤.
2. Observe: in "Ray", drag P around the vertex. Where does P satisfy arg(z − 1) = π/4, and what happens at z = 1 and at z = 0 − i?
3. Predict: what shape is |z| ≤ |z − 2i|? Sketch it before choosing "Half-plane", then explain the boundary using distances.
4. Observe: in "Circle extremes", turn on **Show extremes**. Which two points give the least and greatest |z|, and which give the least and greatest Arg z? Why are the second pair at the tangents from O?
5. Explain: in the default scenario, why is the origin outside the shaded region even though |0 − (1 + i)| ≤ 2?

## Teacher notes outline
- Misconceptions to target: |z − a| measured from −a instead of a (sign slip in |z + 1 − i|); a ray drawn as a full line, or with its vertex included; strict and non-strict boundaries drawn the same; arg(z − a) measured at the origin instead of at a; the greatest Arg z on a circle is at the "top" of the circle rather than at the tangent from O; the greatest |z| found by adding the real and imaginary parts.
- 10-minute lesson flow: (1) default region: read each condition aloud as distance and direction, then predict the shading (2 min); (2) strict-boundary and ray presets: solid, dashed and hollow vertices (2 min); (3) bisector and half-plane: equal distances, and the algebra x + y = 3 from |z − 1| = |z − (3 + 2i)| (3 min); (4) circle extremes: the line through the centre and the tangents from O, with the right-angle triangle that gives sin⁻¹(r/|a|) (3 min).
- Original HSC-style question idea: the complex number z satisfies |z − 1 − √3 i| = 1. (a) Sketch the locus of z. (b) Find the greatest and least values of |z|. (Answer: 3 and 1.) (c) Show that π/6 ≤ Arg z ≤ π/2. (d) On the same diagram, shade the region where |z − 1 − √3 i| ≤ 1 and |z| ≤ |z − 2|, and describe its boundary. Write the full question and worked solution in the notes file.

## Accessibility notes
- Second cues beyond colour: the two loci use different hatching directions as well as colour; included and excluded boundaries differ by solid and dashed lines; excluded vertices are hollow rings; the probe badge uses ✓ and ✗ with the words "yes" and "no".
- Keyboard: every handle (a₁, b₁, a₂, b₂, P) has matching sliders, so the page works without a pointer. The kind selectors are ordinary selects.
- Stage aria-label (from `describe()`), for example: "Argand diagram shading the points where the distance from 1 + i is at most 2 and the argument of z is between 0 and π/2. Probe P = 1 + 2i satisfies both conditions."

## Engine change requests
No `argand` engine meta had been pushed when this spec was written (origin had no `w1/engine-argand` branch on 25 Nov). **Keys to reconcile with engine meta:**
- Params for setup `loci`: `kind1`, `a1Re`, `a1Im`, `b1Re`, `b1Im`, `r1`, `angle1`, `angleTo1`, `kind2`, `a2Re`, `a2Im`, `b2Re`, `b2Im`, `r2`, `angle2`, `angleTo2`, `probeRe`, `probeIm`, `showProbe`, `showExtremes`, `viewSize`.
- Outputs: `dist1A`, `dist1B`, `arg1`, `in1`, `dist2A`, `dist2B`, `arg2`, `in2`, `inBoth`, `minMod1`, `maxMod1`, `minArg1`, `maxArg1`.
- Behaviour needed: the 1e-9 boundary rule above so exact boundary cases classify correctly; the shading test uses the same predicate as `in1` and `in2`; analytic boundary curves (circle, line, ray) drawn over the per-pixel shading; `describe()` for the aria-label.

## Acceptance
Every number below comes from the formula and hand calculation shown here. All checks are static. |x + iy| = √(x² + y²); Arg is the principal argument.

- **Check 1, probe inside a disc.** |z − (1 + i)| ≤ 2, locus 2 none, P = 2 + 2i. P − a₁ = 1 + i, so |P − a₁| = **√2 = 1.41421356237** ≤ 2: **in1 = 1**, and **inBoth = 1**. Arg(1 + i) = **π/4 = 0.785398163397**.
- **Check 2, a strict boundary excludes the point.** |z − (2 + i)| < 1, P = 3 + i. P − a₁ = 1, so |P − a₁| = **1** = r₁ exactly: on the boundary, and `<` fails, so **in1 = 0**.
- **Check 3, the same point with ≤.** |z − (2 + i)| ≤ 1, P = 3 + i: on the boundary, and `≤` holds, so **in1 = 1**.
- **Check 4, a point on a ray.** arg(z − 1) = π/4 (θ₁ = 0.25), P = 2 + i. P − 1 = 1 + i, Arg = **π/4 = 0.785398163397**, so **in1 = 1**.
- **Check 5, the opposite direction is not on the ray.** Same ray, P = 0 − i. P − 1 = −1 − i, Arg = **−3π/4 = −2.35619449019**, so **in1 = 0**.
- **Check 6, extremes on a circle.** |z − (3 + 4i)| = 2. |a₁| = 5 > 2. Least |z| = 5 − 2 = **3**, greatest |z| = 5 + 2 = **7**. Arg a₁ = tan⁻¹(4/3) = 0.927295218002 and sin⁻¹(2/5) = 0.411516846067 (in the right-angled triangle O, a₁, tangent point, the hypotenuse is 5 and the side opposite the angle at O is r = 2). Least Arg z = 0.927295218002 − 0.411516846067 = **0.515778371934**; greatest Arg z = 0.927295218002 + 0.411516846067 = **1.33881206407**.
- **Check 7, perpendicular bisector.** |z − 1| = |z − (3 + 2i)|, P = 2 + i (the midpoint of 1 and 3 + 2i). |P − 1| = |1 + i| = √2 and |P − (3 + 2i)| = |−1 − i| = √2, so **dist1A = dist1B = 1.41421356237** and **in1 = 1**. The bisector is x + y = 3 (through the midpoint (2, 1), perpendicular to the direction 2 + 2i), at distance 3/√2 from O. From the formula, ||b₁|² − |a₁|²| / (2|b₁ − a₁|) = |13 − 1| / (2 × 2√2) = 12/(4√2) = 3/√2 = **2.12132034356** = least |z|.
- **Check 8, default region: P outside the sector.** |z − (1 + i)| ≤ 2 and 0 ≤ arg z ≤ π/2, P = −0.5 + i. P − a₁ = −1.5, so |P − a₁| = **1.5** ≤ 2 and **in1 = 1**. Arg(−0.5 + i) = π − tan⁻¹ 2 = **2.03444393580**, which is more than π/2, so **in2 = 0** and **inBoth = 0**.
- **Check 9, default region: P in both.** Same region, P = 1 + 2i. P − a₁ = i, so |P − a₁| = **1** and **in1 = 1**. Arg(1 + 2i) = tan⁻¹ 2 = **1.10714871779**, between 0 and π/2, so **in2 = 1** and **inBoth = 1**.

```acceptance
[
  { "name": "probe inside the disc |z - (1 + i)| <= 2", "params": { "kind1": "disc", "a1Re": 1, "a1Im": 1, "r1": 2, "kind2": "none", "probeRe": 2, "probeIm": 2 }, "run": "static",
    "expect": { "dist1A": { "value": 1.41421356237, "absTol": 1e-9 }, "arg1": { "value": 0.785398163397, "absTol": 1e-9 }, "in1": { "value": 1, "absTol": 1e-9 }, "inBoth": { "value": 1, "absTol": 1e-9 } } },
  { "name": "strict boundary excludes P", "params": { "kind1": "disc-open", "a1Re": 2, "a1Im": 1, "r1": 1, "kind2": "none", "probeRe": 3, "probeIm": 1 }, "run": "static",
    "expect": { "dist1A": { "value": 1, "absTol": 1e-9 }, "in1": { "value": 0, "absTol": 1e-9 } } },
  { "name": "non-strict boundary includes P", "params": { "kind1": "disc", "a1Re": 2, "a1Im": 1, "r1": 1, "kind2": "none", "probeRe": 3, "probeIm": 1 }, "run": "static",
    "expect": { "dist1A": { "value": 1, "absTol": 1e-9 }, "in1": { "value": 1, "absTol": 1e-9 } } },
  { "name": "point on the ray arg(z - 1) = pi/4", "params": { "kind1": "ray", "a1Re": 1, "a1Im": 0, "angle1": 0.25, "kind2": "none", "probeRe": 2, "probeIm": 1 }, "run": "static",
    "expect": { "arg1": { "value": 0.785398163397, "absTol": 1e-9 }, "in1": { "value": 1, "absTol": 1e-9 } } },
  { "name": "opposite direction is not on the ray", "params": { "kind1": "ray", "a1Re": 1, "a1Im": 0, "angle1": 0.25, "kind2": "none", "probeRe": 0, "probeIm": -1 }, "run": "static",
    "expect": { "arg1": { "value": -2.35619449019, "absTol": 1e-9 }, "in1": { "value": 0, "absTol": 1e-9 } } },
  { "name": "extremes of |z| and Arg z on |z - (3 + 4i)| = 2", "params": { "kind1": "circle", "a1Re": 3, "a1Im": 4, "r1": 2, "kind2": "none" }, "run": "static",
    "expect": { "minMod1": { "value": 3, "absTol": 1e-9 }, "maxMod1": { "value": 7, "absTol": 1e-9 },
                "minArg1": { "value": 0.515778371934, "absTol": 1e-9 }, "maxArg1": { "value": 1.33881206407, "absTol": 1e-9 } } },
  { "name": "midpoint lies on the perpendicular bisector", "params": { "kind1": "bisector", "a1Re": 1, "a1Im": 0, "b1Re": 3, "b1Im": 2, "kind2": "none", "probeRe": 2, "probeIm": 1 }, "run": "static",
    "expect": { "dist1A": { "value": 1.41421356237, "absTol": 1e-9 }, "dist1B": { "value": 1.41421356237, "absTol": 1e-9 }, "in1": { "value": 1, "absTol": 1e-9 },
                "minMod1": { "value": 2.12132034356, "absTol": 1e-9 } } },
  { "name": "default region: P in the disc but outside the sector", "params": { "kind1": "disc", "a1Re": 1, "a1Im": 1, "r1": 2, "kind2": "sector", "a2Re": 0, "a2Im": 0, "angle2": 0, "angleTo2": 0.5, "probeRe": -0.5, "probeIm": 1 }, "run": "static",
    "expect": { "dist1A": { "value": 1.5, "absTol": 1e-9 }, "in1": { "value": 1, "absTol": 1e-9 }, "arg2": { "value": 2.0344439358, "absTol": 1e-9 },
                "in2": { "value": 0, "absTol": 1e-9 }, "inBoth": { "value": 0, "absTol": 1e-9 } } },
  { "name": "default region: P in both", "params": { "kind1": "disc", "a1Re": 1, "a1Im": 1, "r1": 2, "kind2": "sector", "a2Re": 0, "a2Im": 0, "angle2": 0, "angleTo2": 0.5, "probeRe": 1, "probeIm": 2 }, "run": "static",
    "expect": { "dist1A": { "value": 1, "absTol": 1e-9 }, "in1": { "value": 1, "absTol": 1e-9 }, "arg2": { "value": 1.10714871779, "absTol": 1e-9 },
                "in2": { "value": 1, "absTol": 1e-9 }, "inBoth": { "value": 1, "absTol": 1e-9 } } }
]
```
