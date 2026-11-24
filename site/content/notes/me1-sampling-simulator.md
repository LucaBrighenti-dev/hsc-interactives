## Misconceptions

- **"A big sample makes the population normal."** The population never changes shape. Only the distribution of the sample mean $\bar{X}$ gets closer to normal as $n$ grows. In sample-means mode the top band keeps showing the population (an exponential stays skewed, a die stays flat), and the dots of a single sample still look like that population, while the histogram of means becomes a bell.
- **Mixing up the two standard deviations.** The population SD $\sigma$ describes how much single values vary. The SD of $\bar{X}$, which is $\sigma/\sqrt{n}$, describes how much sample means vary from one sample to the next. The readouts keep them apart: *Population SD σ* against *Theoretical SD*.
- **"Doubling $n$ halves the spread."** The SD of $\bar{X}$ is proportional to $1/\sqrt{n}$, so halving it takes four times the sample size. Compare $n = 25$ with $n = 100$ in the proportion scenario.
- **"More samples make the histogram narrower."** Two different numbers are in play. The sample size $n$ (values in each sample) sets the spread of $\bar{X}$. The number of samples only sets how much evidence the histogram holds: more samples make it smoother and closer to the theoretical curve, not narrower.
- **"A binomial distribution is always symmetric."** Only when $p = 0.5$. With $n = 10$ and $p = 0.1$, $P(X = 0) \approx 0.349$ and $P(X = 1) \approx 0.387$, and the tail runs out to the right. With $p$ fixed, the shape becomes more symmetric as $n$ grows.
- **"Using a fixed seed is cheating."** The seed makes a class demonstration repeatable: everyone who opens the same link sees the same samples. A different seed gives a fresh run that is just as random.

## 10-minute lesson flow

1. **(0–2 min) Predict.** Open the page on *Bernoulli trials: X ~ B(20, 0.3)* and don't press play yet. Ask which number of successes will be most common, and whether the histogram will be symmetric. Collect a few predictions.
2. **(2–4 min) Observe.** Press play (Space). The first samples arrive one a second, so read out a few rows of squares (filled for a success, hollow for a failure) and their counts, then let it speed up. When it finishes, compare *Simulated mean* and *Simulated SD* with $np = 6$ and $\sqrt{np(1 - p)} \approx 2.049$.
3. **(4–6 min) Quadruple $n$.** Choose *Proportion of successes, n = 25*. Explain that the mean of 25 values that are each 0 or 1 is the proportion of successes. Note the theoretical SD (0.098), set the x̄ axis to *Population scale* and run. Then set $n = 100$ and run again: the SD halves to 0.049 and the bars visibly narrow.
4. **(6–9 min) Any population.** Choose *Means of 5 dice*: a flat population already gives a bell. Then choose *Skewed population, n = 1*, where the histogram is the population itself. Run it again with $n = 5$ and then $n = 25$, and ask the class to describe the shape and the readouts each time.
5. **(9–10 min) Summarise.** On the board: $E(\bar{X}) = \mu$, $\operatorname{SD}(\bar{X}) = \sigma/\sqrt{n}$, and the distribution of $\bar{X}$ gets closer to normal as $n$ grows, whatever the shape of the population.

## Try this: answers

1. The most likely value is $X = 6$: $P(X = 6) = \binom{20}{6}(0.3)^6(0.7)^{14} \approx 0.192$, just ahead of $P(X = 5) \approx 0.179$ and $P(X = 7) \approx 0.164$. The histogram is not quite symmetric. The left tail stops at 0, only 6 below the mean, while the right tail stretches towards 20 (although $P(X \geq 13) \approx 0.001$), so the distribution is slightly skewed to the right. With seed 2027, the 2000 samples give a simulated mean of 5.964 and a simulated SD of 2.053, against $np = 6$ and $\sqrt{4.2} \approx 2.049$.
2. At $n = 25$ the theoretical SD is $\sqrt{0.24/25} \approx 0.098$, and at $n = 100$ it is $\sqrt{0.24/100} \approx 0.049$. Four times the sample size halves the spread, because the SD of $\bar{X}$ is $\sigma/\sqrt{n}$ and $\sqrt{4} = 2$. With seed 2027 the simulated SDs are 0.0989 and 0.0495. The scenario opens on *Zoom in*, which rescales the axis to fit the spread, so the bars look just as wide at both sizes. Read the tick labels, or switch the x̄ axis to *Population scale* to see the histogram narrow.
3. With $n = 1$ each "mean" is a single value, so the histogram reproduces the population: bars near 0.40, 0.25, 0.15, 0.10, 0.06 and 0.04 at the values 0 to 5, with the normal curve fitting badly. With $n = 25$ the means pile up around $\mu = 1.29$ in a near-normal bell with SD $1.430/\sqrt{25} \approx 0.286$ (seed 2027 gives a simulated SD of 0.2865). A slight right skew can still show in the tail. This is the central limit theorem at work.
4. *Theoretical mean*, *Theoretical SD*, *Population mean μ* and *Population SD σ* stay exactly the same, and so does the final count of samples drawn: they depend only on $n$, $p$ and the number of samples asked for. *Latest X*, *Simulated mean* and *Simulated SD* change (seed 2027 gives 5.964 and 2.053; seed 2028 gives 6.020 and 2.076), because they come from the random draws. Running either seed again repeats its numbers exactly, because the seed fixes the whole sequence of pseudo-random numbers.
5. The variances of independent values add, but their SDs don't. For the total $T$ of 10 rolls, $\operatorname{Var}(T) = 10\sigma^2$, so $\operatorname{SD}(T) = \sqrt{10}\,\sigma$. The mean is $\bar{X} = T/10$, so

   $$\operatorname{SD}(\bar{X}) = \frac{\sqrt{10}\,\sigma}{10} = \frac{\sigma}{\sqrt{10}}$$

   which is $1.708/3.162 \approx 0.540$. The value 0.171 is $\sigma/10$, which would need the total of 10 rolls to vary no more than a single roll does. High and low rolls partly cancel in a total, but not completely. To check, choose *Means of 5 dice* and set $n = 10$: the theoretical SD reads 0.5401, and seed 2027 gives a simulated SD of 0.5348.

## Original HSC-style question

A spinner lands on red with probability 0.35 on each spin, independently of all other spins. For the $i$th spin, let $X_i = 1$ if the spinner lands on red and $X_i = 0$ otherwise. A student spins it 80 times. Let $Y = X_1 + X_2 + \cdots + X_{80}$ be the number of reds, and let $\bar{X} = Y/80$ be the mean of the 80 values, which is the proportion of spins that land on red.

(a) Show that $E(X_i) = 0.35$ and $\operatorname{Var}(X_i) = 0.2275$. (2 marks)

(b) State the distribution of $Y$, and find its mean and standard deviation. (2 marks)

(c) Find $E(\bar{X})$, and show that the standard deviation of $\bar{X}$ is approximately 0.0533. (2 marks)

(d) Use the central limit theorem to estimate $P(\bar{X} > 0.45)$. You may use $P(Z \leq 1.87) = 0.9693$ and $P(Z \leq 1.88) = 0.9699$, where $Z \sim N(0, 1)$. (2 marks)

(e) How many spins would be needed to halve the standard deviation of $\bar{X}$ found in part (c)? (1 mark)

### Worked solution

(a) $X_i$ is 1 with probability 0.35 and 0 with probability 0.65.

$$E(X_i) = 1 \times 0.35 + 0 \times 0.65 = 0.35$$

$$E(X_i^2) = 1^2 \times 0.35 + 0^2 \times 0.65 = 0.35$$

Then $\operatorname{Var}(X_i) = E(X_i^2) - [E(X_i)]^2$, so

$$\operatorname{Var}(X_i) = 0.35 - 0.1225 = 0.2275$$

(b) $Y$ counts the successes in 80 independent trials, each with probability of success 0.35, so $Y \sim B(80, 0.35)$.

$$E(Y) = np = 80 \times 0.35 = 28$$

Using $\operatorname{Var}(Y) = np(1 - p)$,

$$\operatorname{Var}(Y) = 80 \times 0.35 \times 0.65 = 18.2$$

$$\operatorname{SD}(Y) = \sqrt{18.2} \approx 4.27$$

(c) Dividing by 80 divides the mean by 80 and the variance by $80^2$.

$$E(\bar{X}) = \frac{E(Y)}{80} = \frac{28}{80} = 0.35$$

$$\operatorname{Var}(\bar{X}) = \frac{\operatorname{Var}(Y)}{80^2} = \frac{18.2}{6400}$$

This is $0.00284375 = \sigma^2/n = 0.2275/80$, as expected. So $\operatorname{SD}(\bar{X}) = \sqrt{0.00284375} \approx 0.0533$.

(d) $\bar{X}$ is the mean of $n = 80$ independent values with $\mu = 0.35$ and $\sigma^2 = 0.2275$. Since $n$ is large, the central limit theorem says $\bar{X}$ is approximately normal with mean 0.35 and standard deviation 0.0533.

$$z = \frac{0.45 - 0.35}{0.0533} \approx 1.88$$

Since $P(Z > 1.88) = 1 - 0.9699 = 0.0301$,

$$P(\bar{X} > 0.45) \approx 0.030$$

(e) $\operatorname{SD}(\bar{X}) = \sigma/\sqrt{n}$. To halve it, $\sqrt{n}$ must double, so $n$ must be multiplied by 4: $4 \times 80 = 320$ spins. Check: $\sqrt{0.2275/320} \approx 0.0267$, which is half of 0.0533.

**Teacher's note.** A computer gives the exact binomial value $P(Y \geq 37) \approx 0.0247$ (since $\bar{X} > 0.45$ means $Y > 36$). The central limit estimate is close but not exact, because $\bar{X}$ moves in steps of $1/80$ and the normal curve smooths over them. To show the class, choose *Proportion of successes, n = 25*, then set $p = 0.35$, $n = 80$ and the number of samples to 20 000. Compare the *Theoretical SD* readout (0.05333) with part (c), then run it.

## Assumptions and limits

- **Independence.** Every trial, and every value within a sample, is independent of the others, as when sampling with replacement or from a very large population. Successive samples are independent too.
- **Pseudo-random numbers.** The draws come from a seeded generator (mulberry32). They behave as random numbers for this purpose, and the same seed always gives the same samples, so a shared link reproduces a demonstration exactly.
- **A real simulation.** In Bernoulli-trial mode each sample really is $n$ trials, each one a random number compared with $p$. The binomial formula is used only for the blue rings.
- **Two different counts.** The sample size $n$ (1 to 100) is the number of values in each sample. The number of samples (10 to 20 000) is how many times the sampling is repeated. Only $n$ changes the theoretical SD.
- **Simulated SD.** This is the SD of the statistics drawn so far (the values of $X$ or $\bar{X}$), dividing by the number of samples minus 1. It is blank until two samples exist. It varies from run to run: with a few thousand samples it is usually within a few per cent of the theoretical SD.
- **The normal curve.** $N(\mu, \sigma^2/n)$ is the central limit theorem's approximation. It is exact only for a normal population, and for a small $n$ with a skewed population it visibly misfits.
- **Bins and axes.** Means of whole-number populations (the die, Bernoulli and right-skewed populations) take values in steps of $1/n$, and each bar covers a whole number of those steps. *Zoom in* shows $\mu \pm 4.5\sigma/\sqrt{n}$, so the axis rescales whenever $n$ changes; compare spreads on *Population scale*. Any values beyond the axis are counted and reported on the stage rather than drawn.
- **Playback.** Drawing starts at one sample a second and speeds up to the top speed. Step (`.`) draws exactly one sample. Changing the draw mode, population, $p$, $\lambda$, $n$, the x̄ axis or the seed starts a new run.

## Syllabus links

- Mathematics Extension 1 11–12 (2024), Year 12, *The binomial distribution and sampling distribution of the mean* (outcome ME1-12-06): [focus area on the NSW Curriculum website](https://curriculum.nsw.edu.au/learning-areas/mathematics/mathematics-extension-1-11-12-2024/content/year-12/fab1724c5e). This page supports its work on Bernoulli and binomial random variables, their means and variances, and the distribution of the sample mean, including the central limit theorem.
- [Mathematics Extension 1 11–12 (2024) syllabus overview](https://curriculum.nsw.edu.au/learning-areas/mathematics/mathematics-extension-1-11-12-2024/overview).
