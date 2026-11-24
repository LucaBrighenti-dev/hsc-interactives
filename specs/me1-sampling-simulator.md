---
id: me1-sampling-simulator
title: "Sampling simulator"
subject: me1
engine: statsim
setup: sampling
priority: P0
status: draft            # stub → draft → approved (Gate B)
page: /interactives/maths-ext1/sampling-simulator.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Mathematics Extension 1","version":"2024","area":"Statistical analysis","focusArea":"The binomial distribution and the sampling distribution of the mean","year":12,"outcomes":[],"verified":false}
---
# Sampling simulator

> Backlog summary: Bernoulli trials build a binomial histogram; sample means converge to normal as n grows.

## Learning goal
Students see that counting successes in n independent Bernoulli trials produces a binomial distribution with mean np and variance np(1 − p), and that a sample mean (including a sample proportion p̂, the mean of n Bernoulli values) is a random variable in its own right: centred on the population mean μ, with standard deviation σ/√n, and closer to a normal shape as n grows, whatever shape the population has.

## What the student sees
Default view at 1920×1080 (projector theme), Bernoulli trials, n = 20, p = 0.3:

- **Top band, the population and the latest sample.** In Bernoulli-trial mode, the n trials of the latest sample as a row of squares: filled for a success, hollow for a failure, with "X = 7 successes" at the right. In sample-means mode, the population's shape (bars for a discrete population such as the die, a density curve for a continuous one) with μ and a σ bracket marked, and the n values of the latest sample as dots beneath it, with their mean x̄ marked.
- **Main histogram.** The statistic of every sample drawn so far (X, or x̄), in fixed bins, as orange bars. A drop line links the latest sample's statistic to the bar it landed in. Axis titles name the statistic; bar heights show frequency or relative frequency (a control).
- **Theory overlay** (toggle): in Bernoulli-trial mode, blue rings at the binomial probabilities B(n, p); in sample-means mode, a blue normal curve N(μ, σ²/n). A vertical line marks the theoretical mean (labelled np or μ).
- A header line naming the model, e.g. "X ~ B(20, 0.3)", and a legend (Simulated, Binomial B(20, 0.3) or Normal N(μ, σ²/n)).
- Before play: "Press play to draw samples". Drawing starts at one sample a second, so the first samples can be watched, and speeds up to the chosen top speed. Step draws exactly one sample.

## Parameters
Keys and ranges match `meta.params` of the statsim engine on `origin/w1/engine-statsim` (commit 3509389, not yet merged). The Default column is the engine default; the page's presets override it.

| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| mode | Draw | | | | | means | enum: `binomial` (Bernoulli trials, X = number of successes), `means` (sample means x̄) |
| population | Population | | | | | exponential | enum: `bernoulli`, `die`, `uniform` (on [0, 1]), `normal` (N(0, 1)), `exponential` (rate λ), `skewed` (0–5), `ushaped` (arcsine on [0, 1]); means mode only. In binomial mode the engine uses `bernoulli` |
| p | Success probability p | | 0.01 | 0.99 | 0.01 | 0.3 | Bernoulli population (so also binomial mode) |
| rate | Rate λ | | 0.2 | 5 | 0.1 | 1 | exponential population |
| n | Sample size n | | 1 | 100 | 1 | 10 | integer; trials per sample in binomial mode |
| samples | Number of samples | | 10 | 20000 | 10 | 1000 | integer; the run completes when this many samples are drawn |
| drawRate | Top speed | samples/s | 1 | 500 | 1 | 200 | integer; drawing starts at 1 sample/s and speeds up (1 + samples so far per second) to this rate |
| meansAxis | x̄ axis | | | | | shared | enum: `shared` (population scale), `zoom` (μ ± 4.5σ/√n); means mode |
| yScale | Bar heights | | | | | count | enum: `count` (frequency), `relative` (relative frequency) |
| showCurve | Theoretical curve | | | | | on | |
| seed | Random seed | | 1 | 99999 | 1 | 2026 | integer; the same seed gives exactly the same draws |
| timeScale | Playback speed | × | 0.25 | 2 | 0.25 | 1 | |

Behaviour the numbers depend on: one fixed step (the shell's Step button, and `step(1)`) draws exactly one sample; the run stops at `samples`. Changing `mode`, `population`, `p`, `rate`, `n`, `meansAxis` or `seed` starts a new run.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | mode binomial, n = 20, p = 0.3, samples 2000, drawRate 200, seed 2027, yScale relative | A skewed-but-not-too-skewed binomial; peak at 6 |
| coin-flips | mode binomial, n = 10, p = 0.5, samples 200, drawRate 5, seed 2027 | Slow enough to watch the trials build each count |
| sample-proportion | mode means, population bernoulli, p = 0.4, n = 50, samples 5000, drawRate 500, seed 2027, meansAxis zoom | The mean of n Bernoulli values is p̂: centred at p with SD √(p(1 − p)/n) |
| dice-means | mode means, population die, n = 5, samples 5000, drawRate 500, seed 2027 | A flat population gives bell-shaped means quickly |
| skewed-means | mode means, population exponential, rate 1, n = 30, samples 5000, drawRate 500, seed 2027 | A strongly skewed population still gives near-normal means at n = 30 |
| population-shape | mode means, population skewed, n = 1, samples 2000, drawRate 500, seed 2027 | With n = 1 the histogram is the population itself; then raise n |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| count | Samples drawn | | 5 (whole numbers show exactly) |
| latest | Latest value | | 4 |
| simMean | Simulated mean | | 4 |
| simSD | Simulated SD | | 4 |
| theoryMean | Theoretical mean | | 4 |
| theorySD | Theoretical SD | | 4 |
| popMean | Population mean μ | | 4 |
| popSD | Population SD σ | | 4 |

Definitions (all dimensionless):
- Population μ and σ: Bernoulli μ = p, σ = √(p(1 − p)); die μ = 3.5, σ = √(35/12); uniform on [0, 1] μ = 1/2, σ = 1/√12; normal μ = 0, σ = 1; exponential μ = σ = 1/λ; skewed (values 0–5 with probabilities 0.4, 0.25, 0.15, 0.1, 0.06, 0.04) μ = 1.29, σ = √2.0459; U-shaped μ = 1/2, σ = √(1/8).
- Theory for the statistic: binomial mode X has mean nμ = np and SD √n σ = √(np(1 − p)); means mode x̄ has mean μ and SD σ/√n.
- `simMean` and `simSD` are the mean and SD of the statistics drawn so far; `simSD` uses the n − 1 divisor and is blank until two samples exist.

## Assumptions shown on stage
- Trials are independent, each with the same probability p
- Each sample is n independent values from the population
- Pseudo-random numbers from a fixed seed: the same seed repeats the same samples
- The normal curve N(μ, σ²/n) is an approximation; it is exact only for a normal population

## Try this (3–5 predict, observe, explain prompts)
1. Predict: with n = 20 and p = 0.3, which number of successes will be most common, and will the histogram be symmetric? Press play and check.
2. Observe: in the sample-proportion preset, note the theoretical SD, then change n from 50 to 200. What happened to the spread when n became four times as large?
3. Predict: in the population-shape preset (n = 1), what shape will the histogram be? Now predict the shape for n = 25, then run it.
4. Observe: run the default twice with seeds 2027 and 2028. Which readouts changed and which stayed exactly the same? Why?
5. Explain: the SD of a single die roll is about 1.71. Why is the SD of the mean of 10 rolls about 0.54 rather than 0.171?

## Teacher notes outline
- Misconceptions to target: "a big sample makes the population normal" (only the distribution of the sample mean approaches normal); confusing the SD of one sample's data with the SD of the sample means (σ/√n); "doubling n halves the spread" (it takes four times the sample size); "a binomial is always symmetric" (only when p = 0.5; compare p = 0.1 with n = 10); "the same seed is cheating" (it makes a class demonstration repeatable).
- 10-minute lesson flow: 0–2 min predict the peak and shape for the default; 2–4 min run it and compare the simulated mean and SD with np and √(np(1 − p)); 4–6 min sample-proportion preset and quadruple n; 6–9 min dice-means, then population-shape with n = 1, 5, 25; 9–10 min summarise σ/√n and the normal shape on the board.
- Original HSC-style question idea: a spinner shows red with probability 0.35. A student records the proportion of red results in 80 spins. (a) State the mean and standard deviation of the sample proportion. (b) Use a normal approximation to estimate the probability that the sample proportion exceeds 0.45. (c) How many spins would halve the standard deviation found in (a)? Full question and worked solution go in the notes file.

## Accessibility notes
- Second cues beyond colour: successes are filled squares and failures hollow squares; the binomial overlay is drawn as rings and the normal overlay as a line, each named in the legend; the theoretical mean line carries a text label (np or μ); the latest value is also printed as text ("X = 7 successes", "x̄ = 3.4").
- Keyboard: every control is in the side panel; Space plays and pauses, `.` draws one sample, `R` resets.
- Stage aria-label (from `describe()`), for example: "Bernoulli trials with success probability 0.3: each sample is 20 trials, and its number of successes is added to a histogram with the binomial distribution overlaid. 1240 of 2000 samples drawn."
- With `prefers-reduced-motion`, nothing plays until the teacher presses play.

## Engine change requests
None. Every param and output key above exists in the statsim `meta` on `origin/w1/engine-statsim` (commit 3509389). If that branch changes before it merges, the page builder reconciles.

## Acceptance
Every number below comes from the formula and hand calculation shown here. Theory outputs are exact closed forms (tolerance 1e-9 or relative 1e-8). Simulated statistics come from seeded random draws, so they are checked against the theory with a tolerance of at least 4.9 standard errors: a seed-independent check that any correct sampler passes. With N = 10 000 samples, the standard error of a mean is SD/√N = SD/100 and the standard error of an SD is about SD/√(2N) = SD/141.

- **Check 1, binomial count, n = 20, p = 0.3, 10 000 samples.** Mean np = 20 × 0.3 = **6**. Variance np(1 − p) = 20 × 0.3 × 0.7 = 4.2, so SD = √4.2 = **2.049390153**. Population (one trial): μ = p = **0.3**, σ = √(0.3 × 0.7) = √0.21 = **0.4582575695**. The run completes with **count = 10 000**. SE of the simulated mean = 2.0494/100 = 0.0205, so the tolerance 0.1 is 4.9 SE; SE of the simulated SD ≈ 2.0494/141 = 0.0145, so 0.08 is 5.5 SE.
- **Check 2, sample proportion as the mean of Bernoulli values, n = 50, p = 0.4.** Population μ = p = **0.4**, σ = √(0.4 × 0.6) = √0.24 = **0.4898979486**. Mean of p̂ = **0.4**; SD = σ/√n = √(0.24/50) = √0.0048 = **0.069282032**. SE of the simulated mean = 0.06928/100 = 0.00069 (tolerance 0.004 is 5.8 SE); SE of the simulated SD ≈ 0.06928/141 = 0.00049 (tolerance 0.003 is 6.1 SE).
- **Check 3, exponential population, λ = 1, n = 30.** μ = σ = 1/λ = **1**. SD of x̄ = σ/√n = 1/√30 = **0.182574186**. SE of the simulated mean = 0.18257/100 = 0.0018 (tolerance 0.01 is 5.5 SE); SE of the simulated SD ≈ 0.18257/141 × √1.1 = 0.0014 (the factor allows for the slight skew of x̄; tolerance 0.008 is 5.9 SE).
- **Check 4, uniform population on [0, 1], n = 12.** μ = **0.5**, σ = 1/√12 = **0.288675135**. SD of x̄ = σ/√12 = 1/12 = **0.083333333**. SE of the simulated mean = 0.0833/100 = 0.00083 (tolerance 0.005 is 6.0 SE); SE of the simulated SD ≈ 0.0833/141 = 0.00059 (tolerance 0.004 is 6.8 SE).
- **Check 5, die, n = 10, after exactly 100 steps.** One step draws one sample, so after 100 steps **count = 100** (below samples = 2000, so the run is still going). μ = (1 + 2 + … + 6)/6 = **3.5**. σ² = (1² + … + 6²)/6 − 3.5² = 91/6 − 12.25 = 35/12, so σ = √(35/12) = **1.707825128**. SD of x̄ = σ/√10 = **0.540061725**.
- **Check 6, the skewed population, n = 25 (theory only).** μ = 0(0.4) + 1(0.25) + 2(0.15) + 3(0.1) + 4(0.06) + 5(0.04) = 0.25 + 0.3 + 0.3 + 0.24 + 0.2 = **1.29**. E(X²) = 0.25 + 4(0.15) + 9(0.1) + 16(0.06) + 25(0.04) = 0.25 + 0.6 + 0.9 + 0.96 + 1 = 3.71, so σ² = 3.71 − 1.29² = 3.71 − 1.6641 = 2.0459 and σ = **1.430349608**. SD of x̄ = σ/√25 = σ/5 = **0.2860699215**. (100 samples are drawn so the run completes quickly.)

The tolerances were also checked by simulation (mulberry32, seeds 1–300 for each of checks 1–4, samplers implemented as described): every seed passed, and the largest deviation seen was 63% of its tolerance (the binomial simulated mean).

```acceptance
[
  { "name": "binomial count n = 20, p = 0.3: theory and 10 000 samples",
    "params": { "mode": "binomial", "n": 20, "p": 0.3, "samples": 10000, "seed": 2027 },
    "run": "complete",
    "expect": {
      "count": { "value": 10000, "absTol": 0.5 },
      "theoryMean": { "value": 6, "absTol": 1e-9 },
      "theorySD": { "value": 2.049390153, "relTol": 1e-9 },
      "popMean": { "value": 0.3, "absTol": 1e-9 },
      "popSD": { "value": 0.4582575695, "relTol": 1e-9 },
      "simMean": { "value": 6, "absTol": 0.1 },
      "simSD": { "value": 2.049390153, "absTol": 0.08 } } },
  { "name": "sample proportion: means of 50 Bernoulli values with p = 0.4",
    "params": { "mode": "means", "population": "bernoulli", "p": 0.4, "n": 50, "samples": 10000, "seed": 2027 },
    "run": "complete",
    "expect": {
      "popMean": { "value": 0.4, "absTol": 1e-9 },
      "popSD": { "value": 0.4898979486, "relTol": 1e-9 },
      "theoryMean": { "value": 0.4, "absTol": 1e-9 },
      "theorySD": { "value": 0.069282032, "relTol": 1e-8 },
      "simMean": { "value": 0.4, "absTol": 0.004 },
      "simSD": { "value": 0.069282032, "absTol": 0.003 } } },
  { "name": "means of 30 exponential values, rate 1",
    "params": { "mode": "means", "population": "exponential", "rate": 1, "n": 30, "samples": 10000, "seed": 2027 },
    "run": "complete",
    "expect": {
      "popMean": { "value": 1, "absTol": 1e-9 },
      "popSD": { "value": 1, "absTol": 1e-9 },
      "theoryMean": { "value": 1, "absTol": 1e-9 },
      "theorySD": { "value": 0.182574186, "relTol": 1e-8 },
      "simMean": { "value": 1, "absTol": 0.01 },
      "simSD": { "value": 0.182574186, "absTol": 0.008 } } },
  { "name": "means of 12 uniform values: SD 1/12",
    "params": { "mode": "means", "population": "uniform", "n": 12, "samples": 10000, "seed": 2027 },
    "run": "complete",
    "expect": {
      "popMean": { "value": 0.5, "absTol": 1e-9 },
      "popSD": { "value": 0.288675135, "relTol": 1e-8 },
      "theorySD": { "value": 0.083333333, "relTol": 1e-8 },
      "simMean": { "value": 0.5, "absTol": 0.005 },
      "simSD": { "value": 0.083333333, "absTol": 0.004 } } },
  { "name": "die means n = 10 after 100 single-sample steps",
    "params": { "mode": "means", "population": "die", "n": 10, "samples": 2000, "seed": 2027 },
    "run": { "steps": 100 },
    "expect": {
      "count": { "value": 100, "absTol": 0.5 },
      "popMean": { "value": 3.5, "absTol": 1e-9 },
      "popSD": { "value": 1.707825128, "relTol": 1e-9 },
      "theoryMean": { "value": 3.5, "absTol": 1e-9 },
      "theorySD": { "value": 0.540061725, "relTol": 1e-9 } } },
  { "name": "skewed population theory, n = 25",
    "params": { "mode": "means", "population": "skewed", "n": 25, "samples": 100, "seed": 2027 },
    "run": "complete",
    "expect": {
      "count": { "value": 100, "absTol": 0.5 },
      "popMean": { "value": 1.29, "absTol": 1e-9 },
      "popSD": { "value": 1.430349608, "relTol": 1e-9 },
      "theoryMean": { "value": 1.29, "absTol": 1e-9 },
      "theorySD": { "value": 0.2860699215, "relTol": 1e-9 } } }
]
```
