---
id: me1-normal-approx
title: "Normal approximation to the binomial"
subject: me1
engine: statsim
setup: normal-approx
priority: P1
status: draft            # stub → draft → approved (Gate B)
page: /interactives/maths-ext1/normal-approx.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Mathematics Extension 1","version":"2024","area":"Statistical analysis","focusArea":"The binomial distribution and the sampling distribution of the mean","year":12,"outcomes":[],"verified":false}
---
# Normal approximation to the binomial

> Backlog summary: Overlay the normal curve on a binomial; continuity correction toggle.

## Learning goal
Students see when and why a binomial distribution can be approximated by a normal distribution with the same mean np and standard deviation √(np(1 − p)), compare an exact binomial probability with its normal approximation, and judge the quality of the approximation from n and p (np and n(1 − p) both reasonably large). The continuity correction is shown as an optional refinement, so teachers can choose whether to use it with their class.

## What the student sees
Default view at 1920×1080 (projector theme), n = 30, p = 0.4, event P(X ≤ 15), continuity correction off:

- **Bars:** the binomial probabilities P(X = k) for each k as bars of width 1 centred on k. Bars inside the event are filled orange; bars outside it are hollow outlines.
- **Curve:** the normal density with mean np and SD √(np(1 − p)) as a blue line, on the same vertical scale as the bars (bar width 1). The area under the curve that approximates the event is hatched. Without the correction the boundary is at k; with it the boundary moves half a unit (to k + 0.5 for P(X ≤ k), k − 0.5 for P(X ≥ k), and k ± 0.5 for P(X = k)), so the hatched area visibly gains or loses half-bars.
- The boundary is a vertical line labelled with its z-score.
- A results panel: "X ~ B(30, 0.4)", "np = 12, √(np(1 − p)) = 2.683", the normal model, then the exact probability, the normal approximation and the error.
- For P(X = k) with the correction off, a note: "A single point has no area: P(Y = k) = 0".
- A legend: "P(X = k) in the event", "P(X = k) outside it", "Normal density", "Normal area".

## Parameters
Keys and ranges match `meta.params` of the statsim engine on `origin/w1/engine-statsim` (commit 3509389, not yet merged). The Default column is the engine default; the page's presets override it.

| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| trials | Number of trials n | | 1 | 200 | 1 | 20 | integer |
| prob | Success probability p | | 0.01 | 0.99 | 0.01 | 0.3 | |
| event | Probability | | | | | le | enum: `le` P(X ≤ k), `ge` P(X ≥ k), `eq` P(X = k) |
| k | Value k | | 0 | 200 | 1 | 6 | integer; the engine lowers k to n if k > n |
| continuity | Continuity correction | | | | | on | |

The setup is static (`meta.staticSetups` includes `normal-approx`). The exact probability sums the binomial pmf (computed in logs); Φ comes from Marsaglia's series, accurate to about 1e-15.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | n = 30, p = 0.4, event le, k = 15, continuity off | A fair approximation that the correction visibly improves |
| upper-tail | n = 30, p = 0.4, event ge, k = 10, continuity on | P(X ≥ 10): the correction moves the boundary down to 9.5 |
| large-n | n = 100, p = 0.5, event le, k = 55, continuity on | Excellent agreement: error below 0.0001 |
| skewed | n = 20, p = 0.1, event le, k = 2, continuity on | np = 2: a skewed binomial, so the approximation is poor |
| single-value | n = 50, p = 0.3, event eq, k = 15, continuity off | A single value has zero area under the curve until the correction is turned on |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| exact | Exact probability | | 4 |
| approx | Normal approximation | | 4 |
| error | Error (normal − exact) | | 3 |
| mean | Mean np | | 4 |
| sd | SD √(np(1 − p)) | | 4 |
| z | z-score of the boundary | | 3 |

Formulas, with μ = np, σ = √(np(1 − p)) and c = 0.5 with the correction (0 without):
- `le`: exact = Σ from j = 0 to k of C(n, j) pʲ (1 − p)ⁿ⁻ʲ; z = (k + c − μ)/σ; approx = Φ(z).
- `ge`: exact = Σ from j = k to n; z = (k − c − μ)/σ; approx = 1 − Φ(z).
- `eq`: exact = C(n, k) pᵏ (1 − p)ⁿ⁻ᵏ; approx = Φ((k + c − μ)/σ) − Φ((k − c − μ)/σ), which is 0 when c = 0; z is blank.
- error = approx − exact.

## Assumptions shown on stage
- X ~ B(n, p): n independent trials with the same p
- Normal curve with the same mean and SD as the binomial
- Rule of thumb: np and n(1 − p) both at least 5 (some texts use 10)

## Try this (3–5 predict, observe, explain prompts)
1. Predict: with n = 30 and p = 0.4, will the normal approximation to P(X ≤ 15) be too big or too small? Read the error.
2. Observe: turn the continuity correction on. Where does the boundary move, and which part of the bar at 15 does the hatched area now include?
3. Predict: in the skewed preset (n = 20, p = 0.1), will the curve fit the bars well? Work out np first.
4. Observe: in the single-value preset, what is the normal approximation to P(X = 15) with the correction off? Why?
5. Explain: keep p = 0.1 and increase n until np reaches 10. Why does a larger n make a skewed binomial look normal?

## Teacher notes outline
- Misconceptions to target: the normal approximation is exact for large n (it is still an approximation); a normal curve gives a non-zero probability for a single value without a correction (it gives 0); the approximation is fine whenever n is large, whatever p is (np and n(1 − p) both matter); using σ = np(1 − p) instead of its square root; for P(X ≥ k) the corrected boundary is k + 0.5 (it is k − 0.5).
- 10-minute lesson flow: 0–2 min predict over or under for the default; 2–4 min turn on the correction and discuss half-bars; 4–6 min the upper-tail and large-n presets; 6–8 min the skewed preset and the rule of thumb; 8–10 min the single-value preset, then connect with the sample proportion (divide X, μ and σ by n: the z-scores do not change).
- Original HSC-style question idea: in a large city, 18% of households own an electric vehicle. A random sample of 200 households is surveyed. (a) Find the mean and standard deviation of the sample proportion p̂. (b) Use a normal approximation to estimate P(p̂ > 0.22). (c) Explain why the approximation is reasonable here. Full question and worked solution go in the notes file.

## Accessibility notes
- Second cues beyond colour: bars inside the event are filled and those outside are hollow; the normal area is hatched; the boundary line is labelled with its z-score; the single-value case has a text note; the legend names every mark.
- Keyboard: all parameters are panel controls; there is nothing to drag on the stage.
- Stage aria-label (from `describe()`), for example: "Binomial distribution with n = 30 and p = 0.4, with the normal curve of mean 12 and standard deviation 2.68 overlaid. The probability of at most 15 successes is 0.9029 exactly and 0.8682 by the normal approximation."

## Engine change requests
None required: every key used above and in the acceptance block exists in the statsim `meta` on `origin/w1/engine-statsim` (commit 3509389). Optional improvements for a later engine task (not used by this spec's acceptance checks):
- An interval event P(a ≤ X ≤ b) (for example `event: 'between'` with a second bound), common in exam questions.
- A horizontal-axis option to label the bars as sample proportions k/n, linking this page with the sampling simulator.
- A rule-of-thumb badge on stage showing np and n(1 − p) against 5.

## Acceptance
Every number below comes from the formula and hand calculation shown here; the binomial sums and Φ values were checked with a short Node script (Φ from a series for erf accurate to 1e-15). Tolerances: 1e-9 for exact sums, means, SDs and z-scores; 1e-6 absolute for normal probabilities.

- **Check 1, default.** n = 30, p = 0.4: μ = 30 × 0.4 = **12**, σ = √(30 × 0.4 × 0.6) = √7.2 = **2.683281573**. Exact P(X ≤ 15) = P(X ≤ 9) + Σ C(30, k)(0.4)ᵏ(0.6)³⁰⁻ᵏ for k = 10 … 15 = 0.1762864847 + (0.1152 + 0.1396 + 0.1474 + 0.1360 + 0.1101 + 0.0783, which is 0.7266566714 unrounded) = **0.9029431562**. Without the correction z = (15 − 12)/2.683281573 = **1.118033989** and Φ(1.118033989) = **0.8682237614**; error = 0.8682237614 − 0.9029431562 = **−0.0347193948**.
- **Check 2, default with the correction.** z = (15.5 − 12)/2.683281573 = **1.304372987**; Φ(z) = **0.9039467796**; error = **0.0010036234**.
- **Check 3, upper tail.** P(X ≥ 10) = 1 − P(X ≤ 9) = 1 − 0.1762864847 = **0.8237135153**. With the correction z = (9.5 − 12)/2.683281573 = **−0.9316949906** and the approximation is 1 − Φ(−0.9316949906) = 1 − 0.1757470880 = **0.8242529120**.
- **Check 4, large n.** n = 100, p = 0.5: μ = **50**, σ = √25 = **5**. z = (55.5 − 50)/5 = **1.1**, Φ(1.1) = **0.8643339391**. Exact P(X ≤ 55) = **0.8643734880**; the error is only −0.0000395.
- **Check 5, skewed.** n = 20, p = 0.1: μ = **2**, σ = √1.8 = **1.341640786**. Exact P(X ≤ 2) = 0.9²⁰ + 20(0.1)(0.9)¹⁹ + 190(0.01)(0.9)¹⁸ = 0.1215767 + 0.2701703 + 0.2851798 = **0.6769268052**. z = (2.5 − 2)/1.341640786 = **0.3726779962**, Φ(z) = **0.6453059425**, an error of −0.0316.
- **Check 6, a single value.** n = 50, p = 0.3: μ = 15, σ = √10.5 = 3.240370349. Exact P(X = 15) = C(50, 15)(0.3)¹⁵(0.7)³⁵ = **0.1223468618**. Without the correction the approximation is **0** (both limits at 15). With it, z = ±0.5/3.240370349 = ±0.1543033500 and the approximation is 2Φ(0.15430335) − 1 = **0.1226294439**.

```acceptance
[
  { "name": "default P(X <= 15), n = 30, p = 0.4, no correction",
    "params": { "trials": 30, "prob": 0.4, "event": "le", "k": 15, "continuity": false },
    "run": "static",
    "expect": {
      "mean": { "value": 12, "absTol": 1e-9 },
      "sd": { "value": 2.683281573, "relTol": 1e-9 },
      "exact": { "value": 0.9029431562, "absTol": 1e-9 },
      "z": { "value": 1.118033989, "absTol": 1e-9 },
      "approx": { "value": 0.8682237614, "absTol": 1e-6 },
      "error": { "value": -0.0347193948, "absTol": 1e-6 } } },
  { "name": "default with continuity correction",
    "params": { "trials": 30, "prob": 0.4, "event": "le", "k": 15, "continuity": true },
    "run": "static",
    "expect": {
      "z": { "value": 1.304372987, "absTol": 1e-9 },
      "approx": { "value": 0.9039467796, "absTol": 1e-6 },
      "error": { "value": 0.0010036234, "absTol": 1e-6 } } },
  { "name": "upper tail P(X >= 10) with correction",
    "params": { "trials": 30, "prob": 0.4, "event": "ge", "k": 10, "continuity": true },
    "run": "static",
    "expect": {
      "exact": { "value": 0.8237135153, "absTol": 1e-9 },
      "z": { "value": -0.9316949906, "absTol": 1e-9 },
      "approx": { "value": 0.824252912, "absTol": 1e-6 } } },
  { "name": "large n = 100, p = 0.5, P(X <= 55) corrected",
    "params": { "trials": 100, "prob": 0.5, "event": "le", "k": 55, "continuity": true },
    "run": "static",
    "expect": {
      "mean": { "value": 50, "absTol": 1e-9 },
      "sd": { "value": 5, "absTol": 1e-9 },
      "z": { "value": 1.1, "absTol": 1e-9 },
      "exact": { "value": 0.864373488, "absTol": 1e-9 },
      "approx": { "value": 0.8643339391, "absTol": 1e-6 } } },
  { "name": "skewed n = 20, p = 0.1, P(X <= 2) corrected",
    "params": { "trials": 20, "prob": 0.1, "event": "le", "k": 2, "continuity": true },
    "run": "static",
    "expect": {
      "mean": { "value": 2, "absTol": 1e-9 },
      "sd": { "value": 1.341640786, "relTol": 1e-9 },
      "exact": { "value": 0.6769268052, "absTol": 1e-9 },
      "z": { "value": 0.3726779962, "absTol": 1e-9 },
      "approx": { "value": 0.6453059425, "absTol": 1e-6 } } },
  { "name": "single value without correction has zero normal area",
    "params": { "trials": 50, "prob": 0.3, "event": "eq", "k": 15, "continuity": false },
    "run": "static",
    "expect": {
      "exact": { "value": 0.1223468618, "absTol": 1e-9 },
      "approx": { "value": 0, "absTol": 1e-12 } } },
  { "name": "single value with correction",
    "params": { "trials": 50, "prob": 0.3, "event": "eq", "k": 15, "continuity": true },
    "run": "static",
    "expect": { "approx": { "value": 0.1226294439, "absTol": 1e-6 } } }
]
```
