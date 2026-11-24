## Misconceptions

- **"Multiply the real parts, then multiply the imaginary parts."** This gives $(2 + i)(1 + i) = 2 + i$, which is wrong. Expanding gives $2 + 2i + i + i^2 = 1 + 3i$. On the stage the product is clearly not on the line through $z_1$: its modulus is $\sqrt{10} = \sqrt{5} \times \sqrt{2}$, the product of the moduli, and its direction is $\theta_1 + \theta_2$.
- **"$\arg(z_1 z_2)$ is always $\arg z_1 + \arg z_2$."** This holds only up to a multiple of $2\pi$. The sum can leave $(-\pi, \pi]$, and then the principal argument is the sum minus (or plus) $2\pi$. For example, $(-1 + i)^2 = -2i$: the arguments add to $\frac{3\pi}{4} + \frac{3\pi}{4} = \frac{3\pi}{2}$, but $\arg(-2i) = -\frac{\pi}{2}$. When this happens the stage says so in words ("Outside (−π, π], so …").
- **"$\arg(-1) = -\pi$."** The principal argument lies in $-\pi < \arg z \leq \pi$, so the negative real axis has argument $\pi$, never $-\pi$. Set the operation to *Powers of z₁ (de Moivre)*, $z_1 = i$ and $n = 2$: the result is $-1$ with argument $\pi$ ($3.14$ rad).
- **"Multiplying by $i$ reflects a point in the line $y = x$."** It is a quarter turn anticlockwise about the origin: $i(2 + i) = -1 + 2i$, whereas the reflection of $2 + i$ in $y = x$ is $1 + 2i$. The modulus stays the same and the argument grows by $\frac{\pi}{2}$.
- **"The $n$th roots of $w$ lie on the unit circle."** Only when $|w| = 1$. The roots of $z^n = w$ lie on the circle of radius $|w|^{1/n}$: the roots of $z^4 = -4$ lie on $|z| = \sqrt{2}$.
- **"An equation like $z^4 = -4$ has one answer, perhaps with a $\pm$."** It has exactly four roots, equally spaced at angles of $\frac{2\pi}{4} = \frac{\pi}{2}$ round the circle. Students who take a "fourth root" of $-4$ on a calculator find none at all, or only one.

## 10-minute lesson flow

1. **(0–2 min) Predict, then reveal.** Open *Multiply: (2 + i)(1 + i)* and cover the right-hand panel and the readouts. Students compute $|z_1| = \sqrt{5}$, $|z_2| = \sqrt{2}$, $\theta_1 = \tan^{-1}\frac{1}{2}$ and $\theta_2 = \frac{\pi}{4}$, then predict $|z_1 z_2|$ and $\arg(z_1 z_2)$. Reveal: $\sqrt{10}$ and $1.25$ rad.
2. **(2–4 min) Rotate, then stretch.** Point to the dashed arc labelled "rotate θ₂", which carries $z_1$ round to the direction of the product, and then to the dashed line labelled "× |z₂|", which stretches it. The two dashed triangles ($0, 1, z_2$ and $0, z_1, z_1 z_2$) are similar, because multiplying by $z_1$ maps the first onto the second. Write $r_1 \operatorname{cis}\theta_1 \times r_2 \operatorname{cis}\theta_2 = r_1 r_2 \operatorname{cis}(\theta_1 + \theta_2)$. Switch to *Rotate by i* for a quick, clean case.
3. **(4–7 min) Powers.** Choose *Power spiral*. Each power is the previous one rotated by $\theta$ and scaled by $r$, so the points lie on a spiral. Drag $z_1$ inside the unit circle (the spiral winds in to 0), onto it (the points stay on the circle) and outside it (the spiral winds out). Write de Moivre's theorem, $(r \operatorname{cis}\theta)^n = r^n \operatorname{cis} n\theta$, then choose *de Moivre: (−1 + i)⁵* to see $5 \times \frac{3\pi}{4} = \frac{15\pi}{4}$ wrap back to $-\frac{\pi}{4}$.
4. **(7–10 min) Roots.** Choose *Roots of unity* and step $n$ from 3 upwards: a regular polygon with a vertex at 1 and spacing $\frac{2\pi}{n}$. Ask why the roots sum to zero (the panel says "Sum of the roots = 0"): turning the whole polygon through $\frac{2\pi}{n}$ leaves it unchanged, so the sum $S$ satisfies $\omega S = S$ with $\omega \neq 1$, which forces $S = 0$. Finish with *Roots of z⁴ = −4* and try-this prompt 5.

## Try this: answers

1. $|z_1| = \sqrt{5} \approx 2.236$ and $|z_2| = \sqrt{2} \approx 1.414$, so $|z_1 z_2| = \sqrt{10} \approx 3.16$. $\theta_1 = \tan^{-1}\frac{1}{2} \approx 0.464$ and $\theta_2 = \frac{\pi}{4} \approx 0.785$, so $\arg(z_1 z_2) \approx 1.249$, which is inside $(-\pi, \pi]$ and needs no adjustment. The readouts show $1.00$, $3.00$, $3.16$ and $1.25$ rad: the product is $1 + 3i$. As a bonus, this proves $\tan^{-1}\frac{1}{2} + \frac{\pi}{4} = \tan^{-1} 3$.
2. $|i| = 1$ and $\arg i = \frac{\pi}{2}$, so multiplying by $i$ turns any point a quarter turn anticlockwise about the origin and leaves its modulus unchanged. In Cartesian form, $i(a + bi) = -b + ai$. Wherever $z_1$ is dragged, the result has the same length as $z_1$ and is perpendicular to it. With $z_2 = 2i$ (set Im $z_2$ to 2), the turn is still $\frac{\pi}{2}$ but the length doubles: $(2 + i)(2i) = -2 + 4i$, with modulus $2\sqrt{5} \approx 4.47$ and the same argument, $2.03$ rad. This point is on the top edge of the plane, so raise the axis range to 5 to see it clearly.
3. On the unit circle $r = 1$, so $r^n = 1$ for every $n$: the spiral becomes the unit circle itself, and the powers march round it in equal steps of $\theta$. Dragged points snap to the 0.1 grid, so use a grid point on the circle such as $0.6 + 0.8i$ (modulus exactly 1, argument $\tan^{-1}\frac{4}{3} \approx 0.927$ rad, or $53.1°$). Thirteen steps of $53.1°$ go almost twice round the circle ($690.7°$). A point such as $0.7 + 0.7i$ looks as if it is on the circle but has modulus $0.990$, so its powers creep slowly inwards: $0.990^{13} \approx 0.88$.
4. The root 1 is always there, because $1^n = 1$ (it is the principal root, $k = 0$). As $n$ grows, the regular polygon gains a vertex each time, the spacing $\frac{2\pi}{n}$ shrinks, and the polygon fills out towards the unit circle. Two more patterns are worth drawing out: for even $n$, $-1$ is also a root; and the roots are always symmetric in the real axis ($\omega^k$ and $\omega^{n-k}$ are conjugates), because $z^n - 1$ has real coefficients.
5. Write $-4 = 4 \operatorname{cis}\pi$ and $z = r \operatorname{cis}\theta$. Then $z^4 = r^4 \operatorname{cis} 4\theta$, so $r^4 = 4$ and $4\theta = \pi + 2k\pi$. Hence $r = \sqrt{2}$ and $\theta = \frac{\pi}{4} + \frac{k\pi}{2}$; in principal form, $\theta = \frac{\pi}{4}, \frac{3\pi}{4}, -\frac{3\pi}{4}, -\frac{\pi}{4}$. Since $\sqrt{2}\operatorname{cis}\frac{\pi}{4} = 1 + i$ and so on, the roots are $1 + i$, $-1 + i$, $-1 - i$ and $1 - i$. They lie on the circle $|z| = \sqrt{2}$ at equal spacings of $\frac{\pi}{2}$, so they are the vertices of a square, of side 2 (for example, from $1 + i$ to $-1 + i$). Check: $(1 + i)^2 = 2i$, so $(1 + i)^4 = (2i)^2 = -4$.

## Original HSC-style question

Let $\omega = \cos\frac{2\pi}{5} + i\sin\frac{2\pi}{5}$.

(a) Show that $\omega^5 = 1$, and hence that $1 + \omega + \omega^2 + \omega^3 + \omega^4 = 0$. (2 marks)

(b) Show that $\omega^4 = \overline{\omega}$ and $\omega^3 = \overline{\omega^2}$. (2 marks)

(c) Hence show that $\cos\frac{2\pi}{5} + \cos\frac{4\pi}{5} = -\frac{1}{2}$. (2 marks)

(d) The points representing $1, \omega, \omega^2, \omega^3$ and $\omega^4$ on the Argand diagram are the vertices of a regular pentagon. Show that the area of the pentagon is $\frac{5}{2}\sin\frac{2\pi}{5}$. (2 marks)

(e) Use part (c) to show that $\cos\frac{2\pi}{5} = \frac{\sqrt{5} - 1}{4}$. (2 marks)

### Worked solution

(a) By de Moivre's theorem,

$$\omega^5 = \cos 2\pi + i\sin 2\pi = 1$$

Since $\sin\frac{2\pi}{5} \neq 0$, $\omega \neq 1$. Factorising,

$$0 = \omega^5 - 1 = (\omega - 1)(\omega^4 + \omega^3 + \omega^2 + \omega + 1)$$

and since $\omega - 1 \neq 0$, the second factor is zero: $1 + \omega + \omega^2 + \omega^3 + \omega^4 = 0$.

(b) $|\omega| = 1$, so $\omega\overline{\omega} = |\omega|^2 = 1$ and

$$\overline{\omega} = \frac{1}{\omega} = \frac{\omega^5}{\omega} = \omega^4$$

Then $\overline{\omega^2} = \left(\overline{\omega}\right)^2 = \omega^8 = \omega^5 \cdot \omega^3 = \omega^3$.

(c) Group the sum in part (a) in pairs:

$$0 = 1 + (\omega + \omega^4) + (\omega^2 + \omega^3)$$

By part (b), the pairs are $\omega + \overline{\omega}$ and $\omega^2 + \overline{\omega^2}$, and $z + \overline{z} = 2\operatorname{Re} z$. By de Moivre's theorem, $\omega^2 = \cos\frac{4\pi}{5} + i\sin\frac{4\pi}{5}$, so

$$0 = 1 + 2\cos\frac{2\pi}{5} + 2\cos\frac{4\pi}{5}$$

Rearranging, $\cos\frac{2\pi}{5} + \cos\frac{4\pi}{5} = -\frac{1}{2}$.

(d) Joining each vertex to the origin $O$ splits the pentagon into five congruent triangles. Each has two sides of length 1 (every $\omega^k$ has modulus 1) and an angle of $\frac{2\pi}{5}$ between them at $O$. So the area is

$$5 \times \frac{1}{2} \times 1 \times 1 \times \sin\frac{2\pi}{5} = \frac{5}{2}\sin\frac{2\pi}{5}$$

which is about $2.378$ square units.

(e) Let $c = \cos\frac{2\pi}{5}$. By the double angle formula, $\cos\frac{4\pi}{5} = 2c^2 - 1$, so part (c) gives

$$c + 2c^2 - 1 = -\frac{1}{2}, \quad \text{so} \quad 4c^2 + 2c - 1 = 0$$

By the quadratic formula,

$$c = \frac{-2 \pm \sqrt{4 + 16}}{8} = \frac{-1 \pm \sqrt{5}}{4}$$

Since $0 < \frac{2\pi}{5} < \frac{\pi}{2}$, $c > 0$, so $c = \frac{\sqrt{5} - 1}{4} \approx 0.309$.

**Teacher's note.** To show the class, choose *Roots of unity* and set $n = 5$. The stage draws the regular pentagon with the spacing $\frac{2\pi}{5}$ marked, labels the roots $1, \omega, \omega^2, \omega^3, \omega^4$, and reports "Sum of the roots = 0". The conjugate pairs in part (b) are mirror images in the real axis. Switch *Show arguments in* to degrees to see the spacing as $72°$.

## Assumptions and limits

- **Principal arguments.** Every argument on the page is the principal value, $-\pi < \arg z \leq \pi$, measured anticlockwise from the positive real axis. The negative real axis has argument $\pi$. The argument of 0 is undefined, and its readout shows "—".
- **Units.** Argument readouts are always in radians (3 significant figures). *Show arguments in* changes only the labels on the stage, which use exact multiples of $\pi$ (denominators up to 12) where they exist and 3 significant figures otherwise. Moduli on the stage are shown as surds where possible, such as $\sqrt{10} \approx 3.16$.
- **The plane.** Both axes use the same scale, so circles stay circular and angles are true. Points stay inside the square $-10 \leq \operatorname{Re} z, \operatorname{Im} z \leq 10$: a modulus entered in polar form that would leave the square is shortened along its ray.
- **Entering points.** Cartesian sliders move in steps of 0.1. Polar entry takes the modulus in steps of 0.1 and the argument in whole degrees. Dragging snaps to the 0.1 grid (or to a whole number when close); in polar form it snaps the modulus to 0.1 and the argument to $1°$ (or to a multiple of $15°$ when within $3°$).
- **Powers.** $z^0, z^1, \ldots, z^n$ ($n$ up to 16) are found by repeated multiplication, so the page checks de Moivre's theorem rather than assuming it. The curve through them is $r^t \operatorname{cis}(t\theta)$ for $0 \leq t \leq n$, using the principal argument $\theta$. Only whole-number values of $t$ give powers; the curve between them is a guide for the eye.
- **Roots.** The $n$ roots of $z^n = w$ ($2 \leq n \leq 12$) are computed from the formula below, with $k = 0, 1, \ldots, n - 1$.

  $$z_k = |w|^{1/n}\operatorname{cis}\left(\frac{\arg w + 2k\pi}{n}\right)$$

  The result readouts give the principal root ($k = 0$). In "zⁿ = z₁" mode, $w$ is set with the $z_1$ controls, but the roots are labelled $z_0, z_1, \ldots$ on the stage: the root labelled $z_1$ is the second root, not the input $z_1$. Point this out to students.
- **Special cases.** Dividing by $z_2 = 0$ shows "undefined" and the result readouts show "—". If $z_1 = 0$ when finding powers, every power from $z^1$ on is 0. If $w = 0$, every root is 0.
- **Rounding.** Computed components smaller than $10^{-12}$ of the larger component are treated as 0, so $i^2$ is exactly $-1$ with argument $\pi$, not a tiny negative imaginary part with argument close to $-\pi$.

## Syllabus links

- Mathematics Extension 2 11–12 (2024), Year 12, *Introduction to complex numbers* (outcome ME2-12-03): [focus area on the NSW Curriculum website](https://curriculum.nsw.edu.au/learning-areas/mathematics/mathematics-extension-2-11-12-2024/content/year-12/fa0be3067b). This page supports its work on the arithmetic of complex numbers in Cartesian and modulus–argument forms, the geometry of addition, multiplication, division and conjugates on the Argand diagram, de Moivre's theorem, and the solutions of $z^n = w$, including the roots of unity.
- [Mathematics Extension 2 11–12 (2024) syllabus overview](https://curriculum.nsw.edu.au/learning-areas/mathematics/mathematics-extension-2-11-12-2024/overview).
