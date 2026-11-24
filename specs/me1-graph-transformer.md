---
id: me1-graph-transformer
title: "Graph transformer"
subject: me1
engine: fnplot
setup: transform
priority: P1
status: approved            # stub → draft → approved (Gate B)
page: /interactives/maths-ext1/graph-transformer.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Mathematics Extension 1","version":"2024","area":"Functions","focusArea":"Further work with functions","year":11,"outcomes":[],"verified":false}
---
# Graph transformer

> Backlog summary: y = 1/f(x), absolute-value graphs and f of absolute x, drawn beside f(x).

## Learning goal
Students sketch y = 1/f(x), y = |f(x)| and y = f(|x|) directly from the graph of y = f(x) by reasoning about key features: zeros of f become vertical asymptotes of 1/f, points where f = ±1 are invariant, large |f| gives a small reciprocal; |f(x)| reflects the parts below the x-axis; f(|x|) keeps the right half and reflects it in the y-axis.

## What the student sees
Default view at 1920×1080 (projector theme), f(x) = x² − 2x − 3, transformation y = 1/f(x), overlay layout, window −6 ≤ x ≤ 6, −6 ≤ y ≤ 6:

- The original y = f(x) as a light grey dashed curve (2.5 px) with its zeros and turning point marked; the transformed graph as the thick orange curve (3 px).
- **Reciprocal:** dashed vertical asymptotes at the zeros of f (x = −1 and x = 3) labelled "x = −1", the horizontal asymptote y = 0, and hollow rings at the invariant points where f(x) = ±1 (labelled "f = 1" or "f = −1"). The turning point (1, −4) of f is matched with (1, −0.25) on 1/f by a thin vertical guide.
- **Absolute value |f(x)|:** the part of f below the x-axis is reflected; the reflected section is drawn solid and the original section it came from stays dashed grey, with small arrows showing the reflection.
- **f(|x|):** the part of f for x ≥ 0 is kept; the left half is replaced by its mirror image in the y-axis (the discarded left half of f stays dashed grey).
- A vertical probe line at x = xProbe with two dots, one on each graph, and labels "f(1) = −4" and "1/f(1) = −0.25".
- A side-by-side layout option draws f on the left and the transformed graph on the right with matching axes.
- The equations of both graphs in KaTeX above the plot.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| f | f(x) = | | | | | `x^2 - 2x - 3` | string; fnplot parser, variable `x`; pattern `EXPRESSION_PATTERN`; max length 80 |
| transform | Transformation | | | | | reciprocal | enum: `reciprocal` (y = 1/f(x)), `abs` (y = \|f(x)\|), `absx` (y = f(\|x\|)). Segmented |
| xProbe | Probe x | | −20 | 20 | 0.05 | 1 | draggable on the stage |
| showOriginal | Show y = f(x) | | | | | on | |
| showFeatures | Asymptotes and key points | | | | | on | |
| showProbe | Probe | | | | | on | |
| layout | Layout | | | | | overlay | enum: `overlay`, `side-by-side` |
| xMin | Window x from | | −20 | 20 | 0.5 | −6 | shared fnplot window key |
| xMax | Window x to | | −20 | 20 | 0.5 | 6 | |
| yMin | Window y from | | −20 | 20 | 0.5 | −6 | |
| yMax | Window y to | | −20 | 20 | 0.5 | 6 | |

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | f = `x^2 - 2x - 3`, reciprocal, xProbe 1 | Two zeros, one turning point: the classic reciprocal sketch |
| abs-quadratic | f = `x^2 - 2x - 3`, abs, xProbe 1 | The dip between the zeros flips up |
| abs-x-cubic | f = `x^3 - 4x`, absx, xProbe −1, window y −8 to 8 | An odd function becomes even |
| reciprocal-rational | f = `(x - 1)/(x + 2)`, reciprocal, xProbe 4 | The reciprocal of a rational function swaps zeros and asymptotes |
| reciprocal-trig | f = `sin(x)`, reciprocal, window x −7 to 7, y −4 to 4 | y = cosec x appears from y = sin x |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| fAtProbe | f at the probe | | 4 |
| gAtProbe | Transformed value at the probe | | 4 |

`gAtProbe` = 1/f(xProbe), |f(xProbe)| or f(|xProbe|) for the chosen transformation. Where it is undefined (for example 1/f at a zero of f) it is NaN, shown as —, and the probe label says "undefined: f = 0".

## Assumptions shown on stage
- Asymptotes and key points found numerically in the window shown
- x is in radians for trigonometric functions

## Try this (3–5 predict, observe, explain prompts)
1. Predict: f(x) = x² − 2x − 3 is zero at x = −1 and x = 3. What will y = 1/f(x) do near those x-values? Turn on the reciprocal to check.
2. Observe: drag the probe to the turning point x = 1. What is the connection between f(1) and the turning point of 1/f?
3. Predict: where will y = 1/f(x) cross y = f(x)? Find the invariant points and explain why they are at f = ±1.
4. Observe: switch to f(|x|) with the cubic preset. Which half of the original graph survives, and what kind of symmetry does the new graph have?
5. Explain: why does y = |f(x)| never go below the x-axis, but y = f(|x|) can?

## Teacher notes outline
- Misconceptions to target: 1/f(x) is the inverse function f⁻¹(x); |f(x)| and f(|x|) are the same graph; the reciprocal of a turning point is not a turning point; the reciprocal graph crosses the x-axis where f has an asymptote (it approaches it but never reaches it); forgetting the invariant points at f = ±1.
- 10-minute lesson flow: 0–2 min predict the reciprocal of the default parabola; 2–5 min reveal and discuss asymptotes, turning point and invariant points with the probe; 5–7 min |f(x)| versus f(|x|) on the same f; 7–9 min the cubic and the rational presets; 9–10 min students sketch 1/f for a new f, then type it in to check.
- Original HSC-style question idea: the graph of y = f(x), where f(x) = (x − 2)(x + 1)², is given. (a) Sketch y = |f(x)|. (b) Sketch y = f(|x|). (c) Sketch y = 1/f(x), showing all asymptotes and the coordinates of any turning points. (d) Hence state the number of solutions of 1/f(x) = f(|x|) for x > 0. Full question and worked solution go in the notes file.

## Accessibility notes
- Second cues beyond colour: the original graph is dashed and thinner, the transformed graph solid and thicker; asymptotes are dashed with text labels; invariant points are hollow rings with labels; the reflected section of |f| has small arrows.
- Keyboard: the probe is a panel slider as well as a draggable point (arrow keys move it by one step when it has focus); all other parameters are panel controls.
- Stage aria-label (from `describe()`), for example: "Graph of f of x equals x squared minus 2x minus 3, dashed, and y equals 1 over f of x, solid. Vertical asymptotes at x = −1 and x = 3. At the probe x = 1, f is −4 and 1 over f is −0.25."

## Engine change requests
The fnplot engine's `meta` was not yet on `origin` when this spec was written (only `parser.js`), so these are **keys to reconcile with engine meta**:
- Params (setup `transform`): `f`, `transform`, `xProbe`, `showOriginal`, `showFeatures`, `showProbe`, `layout`, `xMin`, `xMax`, `yMin`, `yMax`.
- Outputs: `fAtProbe`, `gAtProbe`.
- `transform` listed in `meta.staticSetups`. Uses the guide's transform helpers (1/f, |f|, f(|x|)).

## Acceptance
Every number below comes from the formula and hand calculation shown here. All are exact evaluations (tolerance 1e-9).

- **Check 1, reciprocal at the turning point.** f(x) = x² − 2x − 3, so f(1) = 1 − 2 − 3 = **−4** and 1/f(1) = **−0.25**.
- **Check 2, absolute value.** |f(1)| = |−4| = **4**.
- **Check 3, f(|x|) to the left of the y-axis.** f(−2) = 4 + 4 − 3 = **5**, but f(|−2|) = f(2) = 4 − 4 − 3 = **−3**: the left half of y = f(|x|) copies the right half of f.
- **Check 4, reciprocal of a rational function.** f(x) = (x − 1)/(x + 2): f(4) = 3/6 = **0.5**, so 1/f(4) = **2**.
- **Check 5, cubic with f(|x|).** f(x) = x³ − 4x: f(−1) = −1 + 4 = **3**, and f(|−1|) = f(1) = 1 − 4 = **−3**.
- **Check 6, reciprocal of sin.** f(x) = sin x at x = π/6 = 0.5235987756: f = **0.5**, 1/f = **2** (cosec π/6).

```acceptance
[
  { "name": "1/f at the turning point of x^2 - 2x - 3",
    "params": { "f": "x^2 - 2x - 3", "transform": "reciprocal", "xProbe": 1 },
    "run": "static",
    "expect": { "fAtProbe": { "value": -4, "absTol": 1e-9 }, "gAtProbe": { "value": -0.25, "absTol": 1e-9 } } },
  { "name": "|f| flips the dip",
    "params": { "f": "x^2 - 2x - 3", "transform": "abs", "xProbe": 1 },
    "run": "static",
    "expect": { "fAtProbe": { "value": -4, "absTol": 1e-9 }, "gAtProbe": { "value": 4, "absTol": 1e-9 } } },
  { "name": "f(|x|) copies the right half to the left",
    "params": { "f": "x^2 - 2x - 3", "transform": "absx", "xProbe": -2 },
    "run": "static",
    "expect": { "fAtProbe": { "value": 5, "absTol": 1e-9 }, "gAtProbe": { "value": -3, "absTol": 1e-9 } } },
  { "name": "reciprocal of (x - 1)/(x + 2) at x = 4",
    "params": { "f": "(x - 1)/(x + 2)", "transform": "reciprocal", "xProbe": 4 },
    "run": "static",
    "expect": { "fAtProbe": { "value": 0.5, "absTol": 1e-9 }, "gAtProbe": { "value": 2, "absTol": 1e-9 } } },
  { "name": "odd cubic becomes even under f(|x|)",
    "params": { "f": "x^3 - 4x", "transform": "absx", "xProbe": -1 },
    "run": "static",
    "expect": { "fAtProbe": { "value": 3, "absTol": 1e-9 }, "gAtProbe": { "value": -3, "absTol": 1e-9 } } },
  { "name": "cosec from sin at pi/6",
    "params": { "f": "sin(x)", "transform": "reciprocal", "xProbe": 0.5235987755982988 },
    "run": "static",
    "expect": { "fAtProbe": { "value": 0.5, "absTol": 1e-9 }, "gAtProbe": { "value": 2, "absTol": 1e-9 } } }
]
```
