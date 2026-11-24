---
id: me1-induction-dominoes
title: "Induction stepper"
subject: me1
engine: custom
setup: none
priority: P2
status: draft            # stub → draft → approved (Gate B)
page: /interactives/maths-ext1/induction-dominoes.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Mathematics Extension 1","version":"2024","area":"Proof","focusArea":"Proof by mathematical induction","year":12,"outcomes":[],"verified":false}
---
# Induction stepper

> Backlog summary: Base case, assumption and k + 1 step revealed line by line.

## Learning goal
Students understand the structure of a proof by mathematical induction (base case, inductive hypothesis, inductive step, conclusion) through the domino picture: the first domino must fall, and each falling domino must knock over the next. They see why both parts are essential, using statements where the base case fails, where the step fails, and where a statement is true for many cases but not all, and they practise the algebra of the k + 1 step for sums, divisibility and inequalities.

## What the student sees
Default view at 1920×1080 (projector theme), the sum of the first n odd numbers, dominoes n = 1 to 12:

- **Domino row (top third):** 12 upright dominoes labelled n = 1, 2, 3, … Each shows a small check of P(n) underneath, e.g. "1 + 3 + 5 = 9 = 3²". Pressing play pushes the first domino at the base case; each domino that falls tips the next, one every 0.2 s. A domino whose statement is false does not fall: it is drawn with a thick outline and a ✗, and the chain stops there. Dominoes before the base case (n < n₀) are greyed out with the label "not claimed".
- **Proof panel (bottom two-thirds):** the induction proof for the chosen statement, revealed one line at a time with "Next line" (or the `reveal` slider). Each line has a tag: **Base case**, **Assume**, **Prove**, **Step**, **Conclusion**. The line that uses the assumption is highlighted where the assumed expression is substituted. For a statement where the proof breaks down, the failing line is marked ✗ with a short reason.
- **Checker (right):** "Check n = …": the left side, the right side and whether P(n) holds, for any n from 1 to 60.

## Parameters
This is a custom page (`site/assets/engines/custom/me1-induction-dominoes/`); the spec defines the engine. Suggested single setup name: `dominoes` (time-based: the dominoes fall over time).

| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| statement | Statement | | | | | odd-sum | enum: `odd-sum`, `square-sum`, `divisible`, `inequality`, `false-base`, `euler` (see the table below). Select |
| start | Base case n₀ | | 1 | 10 | 1 | 1 | integer; where the first push happens |
| upTo | Dominoes up to n = | | 5 | 60 | 1 | 12 | integer |
| nCheck | Check n = | | 1 | 60 | 1 | 3 | integer |
| reveal | Proof lines shown | | 0 | 6 | 1 | 0 | integer |
| timeScale | Playback speed | × | 0.25 | 2 | 0.25 | 1 | |

The statements (all for whole numbers n ≥ 1; the default base case is shown in brackets):

| Key | Statement P(n) | lhs | rhs | P(n) holds when |
| --- | --- | --- | --- | --- |
| odd-sum | 1 + 3 + … + (2n − 1) = n² (n₀ = 1) | the sum | n² | lhs = rhs |
| square-sum | 1² + 2² + … + n² = n(n + 1)(2n + 1)/6 (n₀ = 1) | the sum | n(n + 1)(2n + 1)/6 | lhs = rhs |
| divisible | 5ⁿ + 3 is divisible by 4 (n₀ = 1) | 5ⁿ + 3 | the largest multiple of 4 not above lhs | lhs = rhs |
| inequality | 2ⁿ > n² (n₀ = 5) | 2ⁿ | n² | lhs > rhs |
| false-base | n² + n + 1 is even (n₀ = 1) | n² + n + 1 | the largest even number not above lhs | lhs = rhs |
| euler | n² − n + 41 is prime (n₀ = 1) | n² − n + 41 | its smallest prime factor | lhs = rhs |

Exact integer arithmetic: the engine uses BigInt for `divisible` (5⁶⁰ has 42 digits); `lhs` and `rhs` are reported as Numbers (rounded for very large n, which only affects the display).

Domino timing (the run): with a fixed step of 1/60 s, one domino falls every 12 steps. Let L be the length of the chain: the number of consecutive n from n₀ up to `upTo` for which P(n) holds (L = 0 if P(n₀) is false). After s steps, **fallen = min(⌊s/12⌋, L)**. The run is complete when ⌊s/12⌋ ≥ L + 1 if the chain was stopped by a false P(n) within the range (one extra beat shows the domino that stays up), or when ⌊s/12⌋ ≥ L if every domino up to `upTo` falls. Changing any parameter except `reveal` and `timeScale` resets the run.

Proof lines (revealed one at a time; written for this page, with the current statement's algebra):
- **odd-sum:** (1) Base case n = 1: LHS = 1, RHS = 1² = 1, true. (2) Assume true for n = k: 1 + 3 + … + (2k − 1) = k². (3) Prove for n = k + 1: 1 + 3 + … + (2k − 1) + (2k + 1) = (k + 1)². (4) LHS = k² + (2k + 1), by the assumption. (5) = (k + 1)² = RHS. (6) True for n = 1, and true for n = k + 1 whenever true for n = k, so true for all n ≥ 1.
- **square-sum:** (1) n = 1: LHS = 1, RHS = 1·2·3/6 = 1. (2) Assume Σ i² to k = k(k + 1)(2k + 1)/6. (3) Prove Σ i² to k + 1 = (k + 1)(k + 2)(2k + 3)/6. (4) LHS = k(k + 1)(2k + 1)/6 + (k + 1)² = (k + 1)[k(2k + 1) + 6(k + 1)]/6. (5) = (k + 1)(2k² + 7k + 6)/6 = (k + 1)(k + 2)(2k + 3)/6 = RHS. (6) Conclusion.
- **divisible:** (1) n = 1: 5 + 3 = 8 = 4 × 2. (2) Assume 5ᵏ + 3 = 4m for some integer m. (3) Prove 5ᵏ⁺¹ + 3 is a multiple of 4. (4) 5ᵏ⁺¹ + 3 = 5(5ᵏ + 3) − 12 = 5(4m) − 12. (5) = 4(5m − 3), a multiple of 4 since 5m − 3 is an integer. (6) Conclusion.
- **inequality (n₀ = 5):** (1) n = 5: 2⁵ = 32 > 25 = 5². (2) Assume 2ᵏ > k² for some k ≥ 5. (3) Prove 2ᵏ⁺¹ > (k + 1)². (4) 2ᵏ⁺¹ = 2 · 2ᵏ > 2k², by the assumption. (5) 2k² − (k + 1)² = k² − 2k − 1 = (k − 1)² − 2 > 0 for k ≥ 3, so 2k² > (k + 1)². (6) Conclusion for all n ≥ 5. With n₀ set to 1, line (1) is true but the step only works for k ≥ 3, so the chain breaks at n = 2: the page marks line (5) ✗ "needs k ≥ 3".
- **false-base:** (1) n = 1: 1 + 1 + 1 = 3, which is odd: ✗ the base case fails. (2) Assume k² + k + 1 = 2m. (3) Prove (k + 1)² + (k + 1) + 1 is even. (4) (k + 1)² + (k + 1) + 1 = (k² + k + 1) + 2(k + 1) = 2m + 2(k + 1). (5) = 2(m + k + 1), even: the step is valid. (6) ✗ No conclusion: without a base case no domino falls (in fact n² + n + 1 = n(n + 1) + 1 is always odd).
- **euler:** (1) n = 1: 41 is prime. (2) Assume k² − k + 41 is prime. (3) Prove (k + 1)² − (k + 1) + 41 is prime. (4) It equals (k² − k + 41) + 2k. (5) ✗ Knowing one number is prime says nothing about whether adding 2k gives a prime: there is no valid step. (6) ✗ Checking cases is not a proof: n = 41 gives 41² = 1681.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | odd-sum, n₀ = 1, up to 12, check n = 3 | A first proof by induction |
| sum-of-squares | square-sum, n₀ = 1, up to 12, check n = 10 | The algebra of the step |
| divisibility | divisible, n₀ = 1, up to 12, check n = 6 | Rewriting 5ᵏ⁺¹ + 3 using the assumption |
| inequality | inequality, n₀ = 5, up to 12, check n = 5 | A base case that is not 1 |
| inequality-wrong-start | inequality, n₀ = 1, up to 12, check n = 2 | The step needs k ≥ 3: the chain breaks at 2 |
| no-base-case | false-base, n₀ = 1, up to 12, check n = 3 | The step works but nothing starts the chain |
| many-cases | euler, n₀ = 1, up to 45, check n = 41 | True for n = 1 to 40, then false: cases are not proof |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| lhs | Left side at the checked n | | exact integer (`integer: true`) |
| rhs | Right side at the checked n | | exact integer (`integer: true`) |
| holds | P(n) holds at the checked n (1 = yes, 0 = no) | | exact integer |
| fallen | Dominoes fallen | | exact integer |
| firstFailure | First n ≥ n₀ (up to the last domino) where P(n) is false (0 = none) | | exact integer |

## Assumptions shown on stage
- n is a whole number; each domino stands for one statement P(n)
- A domino falls only if its own statement is true and the one before it fell
- Checking many cases is shown for contrast: it is not a proof

## Try this (3–5 predict, observe, explain prompts)
1. Predict: in the default, if domino 7 is knocked over, must domino 8 fall? What does the proof need to show for that?
2. Observe: open the no-base-case preset and reveal lines 2 to 5. Is the step correct? Now press play. What happens, and why?
3. Predict: in the inequality preset, what happens if you change the base case from 5 to 1? Press play and check where the chain stops.
4. Observe: in the many-cases preset, check n = 1 to 10. Would you believe the statement? Now check n = 41.
5. Explain: in the divisibility proof, why do we rewrite 5ᵏ⁺¹ + 3 so that 5ᵏ + 3 appears?

## Teacher notes outline
- Misconceptions to target: the base case is a formality (the no-base-case preset); "assume true for n = k" assumes what we want to prove (it is a conditional step, not a claim); checking many cases proves the statement (the Euler preset); the inductive step can be proved by checking a few values of k; the base case must always be n = 1 (the inequality preset).
- 10-minute lesson flow: 0–2 min the domino picture with the default; 2–5 min reveal the default proof line by line, naming each part; 5–7 min no-base-case and many-cases to show both parts are needed; 7–9 min inequality with n₀ = 1 then 5; 9–10 min students write the divisibility step before revealing it.
- Original HSC-style question idea: prove by mathematical induction that 7ⁿ − 3ⁿ is divisible by 4 for all integers n ≥ 1. Then explain what is wrong with this argument: "Assume 3ᵏ > k³. Then 3ᵏ⁺¹ = 3 · 3ᵏ > 3k³ > (k + 1)³, so 3ⁿ > n³ for all n ≥ 1", and find the smallest valid base case. Full question and worked solution go in the notes file. (3ⁿ > n³ fails at n = 3, where 27 = 27, and holds for n ≥ 4.)

## Accessibility notes
- Second cues beyond colour: fallen dominoes lie flat, standing ones are upright; a false statement's domino has a thick outline and ✗; greyed dominoes are labelled "not claimed"; proof lines have text tags (Base case, Assume, Prove, Step, Conclusion) and ✗ marks with reasons.
- Keyboard: Space plays and pauses, `.` advances one step, `R` resets; "Next line" is a button and `reveal` a slider.
- Stage aria-label (from `describe()`), for example: "Induction on 1 + 3 + … + (2n − 1) = n² from n = 1 to 12. 5 of 12 dominoes have fallen. Proof: 3 of 6 lines shown."
- With `prefers-reduced-motion`, dominoes switch from standing to fallen without the tipping animation.

## Engine change requests
Custom engine, built in Wave 2 from this spec: params and outputs as above; time-based (fixed step 1/60 s, `timeScale` 0.25–2, `meta.stepSize` 12 so one press of Step tips one domino); a `model.js` with the six statements (BigInt where needed), the chain length and the timing rule, unit-tested against the acceptance numbers below.

## Acceptance
Every number below comes from the formula and hand calculation shown here (all exact integers; tolerance 1e-9). The outputs `lhs`, `rhs`, `holds` and `firstFailure` do not depend on time; `fallen` follows the timing rule above.

- **Check 1, sum of squares at n = 10.** 1 + 4 + 9 + 16 + 25 + 36 + 49 + 64 + 81 + 100 = **385**; 10 × 11 × 21/6 = 2310/6 = **385**; **holds**.
- **Check 2, default run to the end.** Every P(n) holds for n = 1 … 12 (for example 1 + 3 + 5 = 9 = 3²), so L = 12: **fallen = 12**, **firstFailure = 0**.
- **Check 3, after 36 steps.** ⌊36/12⌋ = 3, so **fallen = min(3, 12) = 3**.
- **Check 4, the inequality near the base case.** n = 4: 2⁴ = **16**, 4² = **16**, 16 > 16 is false: **holds = 0**. n = 5: 32 > 25: holds.
- **Check 5, inequality from n₀ = 5.** P(5), P(6), … P(12) all hold (32 > 25, 64 > 36, …, 4096 > 144), so L = 12 − 5 + 1 = 8: **fallen = 8**, **firstFailure = 0**.
- **Check 6, inequality from n₀ = 1.** P(1): 2 > 1 holds; P(2): 4 > 4 fails. L = 1: **fallen = 1**, **firstFailure = 2**.
- **Check 7, no base case.** n² + n + 1 = n(n + 1) + 1 is odd for every n (n(n + 1) is even), so P(1) fails: L = 0, **fallen = 0**, **firstFailure = 1**. At n = 3: lhs = 9 + 3 + 1 = **13**, rhs = **12**, **holds = 0**.
- **Check 8, Euler's polynomial.** n² − n + 41 is prime for n = 1 … 40, but at n = 41 it is 41² − 41 + 41 = **1681** = 41 × 41, smallest prime factor **41**: L = 40, **fallen = 40**, **firstFailure = 41** (with dominoes up to 45).
- **Check 9, divisibility at n = 6.** 5⁶ + 3 = 15 625 + 3 = **15 628** = 4 × 3907, so rhs = **15 628** and **holds = 1**.

```acceptance
[
  { "name": "sum of squares checked at n = 10",
    "params": { "statement": "square-sum", "start": 1, "upTo": 12, "nCheck": 10 },
    "run": "complete",
    "expect": {
      "lhs": { "value": 385, "absTol": 1e-9 },
      "rhs": { "value": 385, "absTol": 1e-9 },
      "holds": { "value": 1, "absTol": 1e-9 } } },
  { "name": "odd sums: all 12 dominoes fall",
    "params": { "statement": "odd-sum", "start": 1, "upTo": 12, "nCheck": 3 },
    "run": "complete",
    "expect": { "fallen": { "value": 12, "absTol": 1e-9 }, "firstFailure": { "value": 0, "absTol": 1e-9 } } },
  { "name": "odd sums: three dominoes after 36 steps",
    "params": { "statement": "odd-sum", "start": 1, "upTo": 12, "nCheck": 3 },
    "run": { "steps": 36 },
    "expect": { "fallen": { "value": 3, "absTol": 1e-9 } } },
  { "name": "2^n > n^2 fails at n = 4",
    "params": { "statement": "inequality", "start": 5, "upTo": 12, "nCheck": 4 },
    "run": "complete",
    "expect": {
      "lhs": { "value": 16, "absTol": 1e-9 },
      "rhs": { "value": 16, "absTol": 1e-9 },
      "holds": { "value": 0, "absTol": 1e-9 } } },
  { "name": "2^n > n^2 from n = 5: eight dominoes",
    "params": { "statement": "inequality", "start": 5, "upTo": 12, "nCheck": 5 },
    "run": "complete",
    "expect": {
      "holds": { "value": 1, "absTol": 1e-9 },
      "fallen": { "value": 8, "absTol": 1e-9 },
      "firstFailure": { "value": 0, "absTol": 1e-9 } } },
  { "name": "2^n > n^2 from n = 1: the chain breaks at 2",
    "params": { "statement": "inequality", "start": 1, "upTo": 12, "nCheck": 2 },
    "run": "complete",
    "expect": { "fallen": { "value": 1, "absTol": 1e-9 }, "firstFailure": { "value": 2, "absTol": 1e-9 } } },
  { "name": "no base case: nothing falls",
    "params": { "statement": "false-base", "start": 1, "upTo": 12, "nCheck": 3 },
    "run": "complete",
    "expect": {
      "fallen": { "value": 0, "absTol": 1e-9 },
      "firstFailure": { "value": 1, "absTol": 1e-9 },
      "lhs": { "value": 13, "absTol": 1e-9 },
      "rhs": { "value": 12, "absTol": 1e-9 },
      "holds": { "value": 0, "absTol": 1e-9 } } },
  { "name": "Euler's polynomial fails at n = 41",
    "params": { "statement": "euler", "start": 1, "upTo": 45, "nCheck": 41 },
    "run": "complete",
    "expect": {
      "fallen": { "value": 40, "absTol": 1e-9 },
      "firstFailure": { "value": 41, "absTol": 1e-9 },
      "lhs": { "value": 1681, "absTol": 1e-9 },
      "rhs": { "value": 41, "absTol": 1e-9 } } },
  { "name": "5^6 + 3 is a multiple of 4",
    "params": { "statement": "divisible", "start": 1, "upTo": 12, "nCheck": 6 },
    "run": "complete",
    "expect": {
      "lhs": { "value": 15628, "absTol": 1e-9 },
      "rhs": { "value": 15628, "absTol": 1e-9 },
      "holds": { "value": 1, "absTol": 1e-9 } } }
]
```
