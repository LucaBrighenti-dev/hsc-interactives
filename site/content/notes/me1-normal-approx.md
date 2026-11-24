## Misconceptions

- **"This is part of the 2024 course."** It isn't: this page is **enrichment**. The 2024 Extension 1 course solves binomial problems exactly and does not include the normal approximation to the binomial or the continuity correction. The page is useful for the central limit theorem story, because a binomial count is $n$ times the mean of $n$ Bernoulli values, and for teachers who taught the 2017 course. Present it to students as an extension.
- **"For large $n$ the normal approximation is exact."** It is always an approximation, because a discrete distribution is being matched by a continuous curve. The error shrinks as $n$ grows: in the large-$n$ scenario it is only about $-0.00004$, but it is never exactly zero.
- **"The normal curve gives $P(X = k)$ directly."** A continuous variable has zero probability at any single point, so without the correction the approximation to $P(X = 15)$ is 0. The correction uses the area from 14.5 to 15.5, the width of the bar at 15.
- **"Large $n$ is enough, whatever $p$ is."** Both $np$ and $n(1 - p)$ matter. $B(20, 0.1)$ has $np = 2$ and is clearly skewed, and even with $n = 100$ a probability of $p = 0.01$ gives $np = 1$.
- **"$\sigma = np(1 - p)$."** That is the variance. The standard deviation is $\sqrt{np(1 - p)}$. For $B(30, 0.4)$ the variance is 7.2 and the SD is 2.683. Using 7.2 as the SD gives $z = 3/7.2 \approx 0.42$ and an approximation near 0.66, against the exact 0.9029.
- **"For $P(X \geq k)$ the corrected boundary is $k + 0.5$."** It is $k - 0.5$. The bar for $k$ runs from $k - 0.5$ to $k + 0.5$ and belongs to the event, so the area must start at its left edge. The rule is to include every bar of the event in full, and no other bars.

## 10-minute lesson flow

1. **(0–2 min) Predict.** Open *B(30, 0.4): P(X ≤ 15)* with the correction off. Ask whether the normal approximation will be too big or too small, and why.
2. **(2–4 min) Half-bars.** Read the error ($-0.0347$), then turn the continuity correction on. The boundary moves from 15 to 15.5, the hatched area takes in the whole bar at 15, and the error drops to $+0.0010$.
3. **(4–6 min) Other events.** Choose *Upper tail: P(X ≥ 10)* and ask which way the boundary should move before showing it (to 9.5). Then choose *Large n: B(100, 0.5), P(X ≤ 55)*, where the error is about $-0.00004$.
4. **(6–8 min) When it fails.** Choose *Skewed: B(20, 0.1), P(X ≤ 2)*. Compute $np = 2$ and $n(1 - p) = 18$ together and compare them with the rule of thumb on the stage. Point out the curve's area below $-0.5$, where $X$ cannot go.
5. **(8–10 min) One value, and proportions.** Choose *Single value: B(50, 0.3), P(X = 15)*: the approximation is 0 until the correction is on. To finish, divide $X$, $\mu$ and $\sigma$ by $n$ to get the sample proportion $X/n$. The $z$-scores don't change: for $B(30, 0.4)$, $X \leq 15$ and $X/30 \leq 0.5$ both give $z = 1.118$. The sampling simulator shows the same idea with simulated samples.

## Try this: answers

1. Too small. The exact probability is 0.9029, and the approximation without the correction is $\Phi\left(\frac{15 - 12}{2.683}\right) = \Phi(1.118) \approx 0.8682$, an error of $-0.0347$. The boundary at 15 cuts the bar at 15 down the middle, so the normal area leaves out the right half of that bar. That half is $\frac{1}{2}P(X = 15) \approx \frac{1}{2}(0.0783) \approx 0.039$, which accounts for most of the error.
2. The boundary moves half a unit to the right, from 15 to 15.5 ($z$ goes from 1.118 to 1.304). The hatched area now covers the whole bar at 15, not just its left half. The approximation becomes 0.9039 and the error is $+0.0010$, about 35 times smaller than before.
3. No. Here $np = 2$ and $n(1 - p) = 18$, so $np$ is well under 5. The bars are skewed to the right: $P(X = 0) \approx 0.122$, $P(X = 1) \approx 0.270$ and $P(X = 2) \approx 0.285$, with a long tail to the right. The normal curve is symmetric about 2, and it puts about 0.031 of its area below $-0.5$, where $X$ cannot go. Even with the correction, the approximation is 0.6453 against the exact 0.6769, an error of $-0.0316$.
4. The approximation is 0. With the correction off, the event is the single point $Y = 15$, and a continuous distribution gives zero probability to a single point (there is no width, so there is no area). With the correction on, the page uses $P(14.5 \leq Y \leq 15.5) \approx 0.1226$, against the exact $P(X = 15) \approx 0.1223$.
5. With $p = 0.1$, $np$ reaches 10 at $n = 100$. The bars become nearly symmetric and the curve fits them closely. Move $k$ to the middle (for example $k = 10$) to compare: the corrected approximation is 0.5662 against the exact 0.5832. The reason is that $X$ is a sum of $n$ independent Bernoulli values. By the central limit theorem, a sum (or mean) of many independent values is approximately normal, whatever their own distribution. The skewness of $B(n, p)$ is $\frac{1 - 2p}{\sqrt{np(1 - p)}}$, which shrinks like $1/\sqrt{n}$: for $p = 0.1$ it is 0.60 at $n = 20$ and 0.27 at $n = 100$.

## Original HSC-style question

*Enrichment, in the style of the 2017 course. Part (d) is the 2024-course version.*

In a large city, 18% of households own an electric vehicle. A random sample of 200 households is surveyed. Let $X$ be the number of households in the sample that own an electric vehicle, and let $\hat{p} = X/200$ be the sample proportion.

(a) Find the mean and standard deviation of $\hat{p}$. (2 marks)

(b) Use a normal approximation, without a continuity correction, to estimate $P(\hat{p} > 0.22)$. You may use $P(Z \leq 1.47) = 0.9292$, where $Z \sim N(0, 1)$. (2 marks)

(c) Explain why a normal approximation is reasonable here. (1 mark)

(d) State the distribution of $X$. Write $P(\hat{p} > 0.22)$ as a binomial sum, and compare its value, 0.0618 to 4 decimal places (found with technology), with your answer to part (b). (2 marks)

### Worked solution

(a) The sample is a tiny fraction of the city's households, so the 200 households can be treated as independent trials with $p = 0.18$.

$$E(\hat{p}) = p = 0.18$$

$$\operatorname{Var}(\hat{p}) = \frac{p(1 - p)}{n} = \frac{0.18 \times 0.82}{200}$$

This is 0.000738, so $\operatorname{SD}(\hat{p}) = \sqrt{0.000738} \approx 0.0272$.

(b) Approximate $\hat{p}$ by a normal distribution with mean 0.18 and standard deviation 0.0272.

$$z = \frac{0.22 - 0.18}{0.02717} \approx 1.47$$

Since $P(Z > 1.47) = 1 - 0.9292 = 0.0708$,

$$P(\hat{p} > 0.22) \approx 0.071$$

(c) $np = 200 \times 0.18 = 36$ and $n(1 - p) = 200 \times 0.82 = 164$ are both well above 5 (and above 10), so the binomial distribution of $X$ is close to symmetric and bell-shaped.

(d) $X \sim B(200, 0.18)$. Since $\hat{p} > 0.22$ means $X > 44$, that is $X \geq 45$, the probability $P(\hat{p} > 0.22) = P(X \geq 45)$ is

$$\sum_{k=45}^{200} \binom{200}{k} (0.18)^k (0.82)^{200 - k}$$

This equals $1 - P(X \leq 44) \approx 0.0618$. The normal approximation in part (b) overestimates it by about 0.009, or roughly 15%.

**Teacher's note.** On this page, set $n = 200$, $p = 0.18$, $P(X \geq k)$ and $k = 45$. With the correction off, the boundary is 45 and the approximation is 0.0488, yet the same event written as $X > 44$ gave 0.0708 in part (b). That mismatch is exactly what the continuity correction resolves. With the correction on, the boundary is 44.5, halfway between the two, and the approximation is 0.0589, within 0.003 of the exact 0.0618.

## Assumptions and limits

- **Enrichment.** The normal approximation to the binomial, and the continuity correction, are beyond the 2024 Extension 1 course, which finds binomial probabilities exactly. The stage says so in its first assumption line.
- **The binomial model.** $X \sim B(n, p)$: $n$ independent trials, each with the same probability $p$.
- **The normal model.** $Y \sim N(np, np(1 - p))$ has the same mean and SD as $X$. Each bar is 1 wide, so its area equals $P(X = k)$, and the bars and the density curve share one vertical scale.
- **Rule of thumb.** "$np$ and $n(1 - p)$ both at least 5" (some texts use 10) is only a guide. The approximation is worst in the tails and when $p$ is far from 0.5, even when the rule is met.
- **Exact values.** Exact probabilities are sums of the binomial formula, computed with logarithms so that large $n$ is safe. $\Phi$ comes from a series accurate to about $10^{-15}$. The error readout is the normal approximation minus the exact value.
- **Events.** The page offers $P(X \leq k)$, $P(X \geq k)$ and $P(X = k)$. For an interval, use differences, for example $P(4 \leq X \leq 8) = P(X \leq 8) - P(X \leq 3)$. The $z$-score readout is blank for $P(X = k)$, which has two boundaries.
- **Ranges.** $n$ runs from 1 to 200, $p$ from 0.01 to 0.99, and $k$ is lowered to $n$ if it would exceed it.

## Syllabus links

- Mathematics Extension 1 11–12 (2024), Year 12, *The binomial distribution and sampling distribution of the mean* (outcome ME1-12-06): [focus area on the NSW Curriculum website](https://curriculum.nsw.edu.au/learning-areas/mathematics/mathematics-extension-1-11-12-2024/content/year-12/fab1724c5e). The page supports the focus area's work on the mean and standard deviation of a binomial distribution and the central limit theorem. Its normal approximation goes beyond the focus area, which finds binomial probabilities exactly.
- [Mathematics Extension 1 11–12 (2024) syllabus overview](https://curriculum.nsw.edu.au/learning-areas/mathematics/mathematics-extension-1-11-12-2024/overview).
