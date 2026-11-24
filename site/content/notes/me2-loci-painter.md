## Misconceptions

- **"$|z + 1 - i| = 2$ is a circle centred at $1 - i$."** Rewrite it as $|z - (-1 + i)| = 2$ first: $|z - a|$ is the distance from $a$, so the centre is $-1 + i$. The legend always shows a condition in the form $|z - a|$, with the centre written out.
- **"$\arg(z - 1) = \frac{\pi}{4}$ is the line $y = x - 1$."** It is only half of that line: the ray leaving $1$ in the direction $\frac{\pi}{4}$. The point $-i$ lies on the line but not on the ray, because $\arg(-i - 1) = -\frac{3\pi}{4}$. The vertex $1$ is not on the ray either, because $\arg 0$ is undefined. The stage draws it as a hollow ring.
- **"$<$ and $\leq$ give the same picture."** The regions differ only on the boundary, and that is exactly what a sketch must show. A strict inequality ($<$, $>$) has a dashed boundary that is not included; $\leq$ and $\geq$ have a solid boundary that is included. In *Strict boundary*, the point $3 + i$ sits on the circle and fails $<$ but passes $\leq$.
- **"$\arg(z - a)$ is measured at the origin."** The angle is measured at the vertex $a$, from a line through $a$ parallel to the positive real axis. The stage draws that reference line dashed at each vertex.
- **"$\arg z < -\frac{\pi}{2}$ includes the negative real axis."** Points on the negative real axis have principal argument $\pi$, not $-\pi$, so they are not in $\arg z < -\frac{\pi}{2}$. They are in $\arg z \geq \frac{\pi}{2}$. Each argument inequality therefore has a second edge along $\arg(z - a) = \pi$: dashed (excluded) for $<$ and $\leq$, solid (included) for $>$ and $\geq$.
- **"The greatest $\arg z$ on a circle is at the top of the circle."** It is at the point where a ray from $O$ just touches the circle. For $|z - (3 + 4i)| = 2$, the top point $3 + 6i$ has argument $\tan^{-1} 2 \approx 1.107$, but the tangent point has argument $\tan^{-1}\frac{4}{3} + \sin^{-1}\frac{2}{5} \approx 1.339$.
- **"The greatest $|z|$ on a circle comes from adding the radius to the real and imaginary parts."** For $|z - (3 + 4i)| = 2$ this gives $5 + 6i$, which is not even on the circle ($|2 + 2i| \neq 2$). The farthest point lies on the line through $O$ and the centre: the greatest $|z|$ is $|3 + 4i| + 2 = 7$, at $\frac{7}{5}(3 + 4i) = 4.2 + 5.6i$, and the least is $5 - 2 = 3$.

## 10-minute lesson flow

1. **(0–2 min) Read it aloud, then predict.** Before you show the stage, write the two conditions of *Disc and arg z ≥ 0* on the board. Read $|z - (1 + i)| \leq 2$ as "the distance from $1 + i$ is at most 2" and $\arg z \geq 0$ as "the direction from $0$ is between $0$ and $\pi$". Students sketch the region, then compare their sketches with the stage. Ask about the origin (try-this prompt 5).
2. **(2–4 min) Solid, dashed, hollow.** Choose *Strict boundary* and run try-this prompt 1. Then choose *Ray* and drag $z$ around the vertex (prompt 2): the ray is a half-line with a hollow ring at its start.
3. **(4–7 min) Equal distances.** Choose *Perpendicular bisector*. The test point $2 + i$ is the midpoint of $1$ and $3 + 2i$, and the readouts show both distances as $1.41$. Derive the line on the board by squaring both moduli:

   $$(x - 1)^2 + y^2 = (x - 3)^2 + (y - 2)^2$$

   This simplifies to $4x + 4y = 12$, that is, $x + y = 3$. Check this against the legend. Then choose *Half-plane* (prompt 3): changing $=$ to $\leq$ keeps the line and shades the side nearer $a$.
4. **(7–10 min) Two conditions together.** Choose *Ray meets circle* (prompt 4): the ray and the circle meet at $2 + 2i$ only, because the other solution is the excluded vertex $0$. Finish with *Sector*: $-\frac{\pi}{4} \leq \arg z < \frac{\pi}{3}$ has one solid edge and one dashed edge, and its vertex is excluded.

**Extension (extremes on a circle).** Set condition 1 to $|z - a| = r$ with $a_1 = 3 + 4i$ and $r_1 = 2$, condition 2 to $\arg(z - a) = \theta$ with $a_2 = 0$, and the axis range to 7. Step $\theta_2$ up from $20°$ and watch "Where they meet". At first the ray misses the circle. It touches the circle at about $29.6°$, cuts it twice from there to about $76.7°$, where it touches again, and then misses it. Those two tangent angles, $0.516$ and $1.339$ rad, are the least and greatest values of $\arg z$ on the circle. Dragging the test point round the circle, the $|z - a_2|$ readout ($= |z|$) runs from 3 to 7.

## Try this: answers

1. No. $z - (2 + i) = 1$, so $|z - (2 + i)| = 1$, which is not less than 1. The point is on the circle, and with $<$ the circle is a dashed boundary that is not included. The verdict reads "1 < 1? no", and *z in the set* shows 0. With $\leq$ the boundary becomes solid, the verdict reads "1 ≤ 1? yes", and the readout changes to 1.
2. $\arg(z - 1) = \frac{\pi}{4}$ holds exactly on the ray $z = 1 + t(1 + i)$, $t > 0$, which is the part of the line $y = x - 1$ with $x > 1$. At $z = 1$, $z - 1 = 0$ has no argument, so the verdict reads "undefined, so no", and the vertex is a hollow ring. At $z = -i$, $z - 1 = -1 - i$ has argument $-\frac{3\pi}{4} \approx -2.36$, so the condition fails. The point $-i$ is on the line $y = x - 1$ but in the opposite direction from the vertex.
3. $|z| \leq |z - 2i|$ means "at least as close to $0$ as to $2i$". The boundary is the perpendicular bisector of $0$ and $2i$, which is the horizontal line $\operatorname{Im} z = 1$, drawn solid because of the $\leq$. The region is the half-plane on the side of $0$: $y \leq 1$. In algebra, $x^2 + y^2 \leq x^2 + (y - 2)^2$ gives $0 \leq 4 - 4y$, so $y \leq 1$. The test point $3 + 0.5i$ is in the region: $|z| = \sqrt{9.25} \approx 3.04$ and $|z - 2i| = \sqrt{11.25} \approx 3.35$.
4. They meet only at $2 + 2i$. On the ray, $z = t(1 + i)$ with $t > 0$, so

   $$|z - 2|^2 = (t - 2)^2 + t^2 = 4 \implies 2t^2 - 4t = 0 \implies t = 0 \text{ or } t = 2$$

   The solution $t = 0$ is the vertex, which is not on the ray. At the origin, $|0 - 2| = 2$, so the origin is on the circle, but $\arg 0$ is undefined. So $z = 0$ fails $\arg z = \frac{\pi}{4}$, and the verdict reads "undefined, so no".
5. The origin is in the disc, because $|0 - (1 + i)| = \sqrt{2} \approx 1.41 \leq 2$. But $\arg 0$ is undefined, so the origin fails $\arg z \geq 0$: the vertex of an argument condition is never in its set. The rest of the real axis inside the disc *is* included. The positive real axis has argument $0 \geq 0$, and the negative real axis has argument $\pi \geq 0$. So the shaded set is the part of the disc on or above the real axis, with only the origin removed.

## Original HSC-style question

The complex number $z$ satisfies $|z - 1 - \sqrt{3}\,i| = 1$.

(a) Sketch the locus of $z$ on an Argand diagram. (2 marks)

(b) Find the greatest and least values of $|z|$. (2 marks)

(c) Show that $\frac{\pi}{6} \leq \arg z \leq \frac{\pi}{2}$. (2 marks)

(d) On a new diagram, shade the region where both $|z - 1 - \sqrt{3}\,i| \leq 1$ and $|z| \leq |z - 2|$, and describe its boundary. (2 marks)

(e) Find the exact greatest value of $|z|$ for $z$ in the region in part (d). (2 marks)

### Worked solution

(a) Write the condition as $|z - (1 + \sqrt{3}\,i)| = 1$. The locus is the circle with centre $C = 1 + \sqrt{3}\,i$ and radius 1. Its centre is a distance 1 from the imaginary axis, so it touches the imaginary axis at $\sqrt{3}\,i$. Its lowest point, $1 + (\sqrt{3} - 1)i$, is above the real axis, so the whole circle lies in the first quadrant (touching the imaginary axis).

(b) $|C| = \sqrt{1 + 3} = 2$ and $\arg C = \frac{\pi}{3}$. The nearest and farthest points of the circle from $O$ lie on the line through $O$ and $C$, at distances $|C| - 1$ and $|C| + 1$. So the least value of $|z|$ is 1, at $\operatorname{cis}\frac{\pi}{3} = \frac{1}{2} + \frac{\sqrt{3}}{2}i$, and the greatest is 3, at $3\operatorname{cis}\frac{\pi}{3} = \frac{3}{2} + \frac{3\sqrt{3}}{2}i$.

(c) The extreme arguments occur where a ray from $O$ is tangent to the circle. At a point of contact $T$, the radius $CT$ is perpendicular to $OT$, so triangle $OTC$ has a right angle at $T$, with hypotenuse $OC = 2$ and $CT = 1$. The angle $\alpha$ between $OT$ and $OC$ therefore satisfies

$$\sin\alpha = \frac{CT}{OC} = \frac{1}{2}, \quad \text{so} \quad \alpha = \frac{\pi}{6}$$

Every point of the circle lies between the two tangents, so

$$\frac{\pi}{3} - \frac{\pi}{6} \leq \arg z \leq \frac{\pi}{3} + \frac{\pi}{6}, \quad \text{that is,} \quad \frac{\pi}{6} \leq \arg z \leq \frac{\pi}{2}$$

The upper value agrees with part (a): the circle touches the imaginary axis, where $\arg z = \frac{\pi}{2}$.

(d) $|z| \leq |z - 2|$ means $z$ is at least as close to $0$ as to $2$. The perpendicular bisector of $0$ and $2$ is the line $\operatorname{Re} z = 1$, so this is the half-plane $\operatorname{Re} z \leq 1$. (In algebra, $x^2 + y^2 \leq (x - 2)^2 + y^2$ gives $4x \leq 4$.) The line $\operatorname{Re} z = 1$ passes through the centre $C$, so the region is the left half of the disc. Its boundary is the diameter from $1 + (\sqrt{3} - 1)i$ to $1 + (\sqrt{3} + 1)i$ together with the left semicircle, and all of it is included, because both inequalities are non-strict.

(e) The point $3\operatorname{cis}\frac{\pi}{3}$ from part (b) has real part $\frac{3}{2} > 1$, so it is not in the region. The greatest $|z|$ is therefore less than 3. A point inside the half-disc can be moved directly away from $O$ until it reaches the boundary, so the greatest value occurs on the boundary.

- On the diameter, $z = 1 + yi$, so $|z|^2 = 1 + y^2$, which is greatest at the top end, $y = 1 + \sqrt{3}$.
- On the semicircle, let $\psi$ be the angle $\angle OCZ$. By the cosine rule, $|z|^2 = OC^2 + CZ^2 - 2 \cdot OC \cdot CZ\cos\psi = 5 - 4\cos\psi$, which grows as $\psi$ grows. The direction from $C$ to $O$ is $\frac{4\pi}{3}$, and the left semicircle covers the directions $\frac{\pi}{2}$ to $\frac{3\pi}{2}$ from $C$. So $\psi$ is greatest, at $\frac{4\pi}{3} - \frac{\pi}{2} = \frac{5\pi}{6}$, at the top end of the diameter.

Both cases give the same point, $1 + (1 + \sqrt{3})i$. There,

$$|z|^2 = 1 + (1 + \sqrt{3})^2 = 5 + 2\sqrt{3}$$

so the greatest value of $|z|$ is $\sqrt{5 + 2\sqrt{3}} \approx 2.91$.

**Teacher's note.** To show the class, set condition 1 to $|z - a| \leq r$ with $a_1 = 1 + 1.7i$ and $r_1 = 1$ (the sliders move in steps of 0.1, so $1.7$ stands in for $\sqrt{3} \approx 1.732$). Set condition 2 to $|z - a| \leq |z - b|$ with $a_2 = 0$ and $b_2 = 2$. The stage shades the half-disc and writes the second condition as $x \leq 1$. Drag the test point to the top of the diameter: the $|z - a_2|$ readout is $|z|$, and it shows about $2.9$.

## Assumptions and limits

- **Principal arguments.** $\arg$ is the principal argument, $-\pi < \arg z \leq \pi$. The angle $\theta$ is entered in whole degrees from $-179°$ to $180°$, so the ray in the negative real direction is $\theta = 180°$ ($\pi$), never $-180°$.
- **The cut along $\arg = \pi$.** Because arguments are principal values, every argument inequality has a second edge along the ray from $a$ at angle $\pi$. That edge is excluded (dashed) for $<$ and $\leq$, and included (solid) for $>$ and $\geq$. With $\theta = 180°$ there is no separate edge.
- **Shading.** Regions are shaded by testing a fine grid of points, one every 2 screen pixels, with the exact boundary curves drawn on top. An equation ($=$) is drawn as a thick curve and not shaded. If no point in view satisfies every condition, the legend says so.
- **"And" only.** Two conditions are joined by "and": both must hold. A region made of two pieces joined by "or", such as $\arg z \geq \frac{3\pi}{4}$ or $\arg z \leq -\frac{3\pi}{4}$, cannot be built on this page.
- **Boundaries and the test point.** A point on a boundary (to within about $10^{-9}$) satisfies $=$, $\leq$ and $\geq$ but not $<$ or $>$. The vertex of an argument condition never satisfies it, because $\arg 0$ is undefined; its readout shows "—".
- **Readouts.** Distances and arguments are measured from the test point $z$ to $a_1$, $b_1$, $a_2$ and $b_2$. Arguments are in radians, to 3 significant figures. A readout shows "—" when it doesn't apply (for example, $|z - b_1|$ when condition 1 is not a bisector). *z in the set* is 1 when $z$ satisfies every condition and 0 otherwise.
- **Entering values.** Points move in steps of 0.1 within $-10$ to $10$, and the radius from 0.1 to 10. Dragged points snap to the 0.1 grid (or to a whole number when close). A dragged angle snaps to $1°$, or to a multiple of $15°$ when within $3°$.
- **Equal points.** If $a = b$ in a bisector condition, every point is the same distance from both. Then $=$, $\leq$ and $\geq$ hold everywhere, $<$ and $>$ hold nowhere, and no line is drawn.

## Syllabus links

- Mathematics Extension 2 11–12 (2024), Year 12, *Introduction to complex numbers* (outcome ME2-12-03): [focus area on the NSW Curriculum website](https://curriculum.nsw.edu.au/learning-areas/mathematics/mathematics-extension-2-11-12-2024/content/year-12/fa0be3067b). This page supports its work on curves and regions in the complex plane defined by conditions on modulus and argument, including circles, rays, perpendicular bisectors and the regions they bound, their Cartesian equations, and where two loci meet.
- [Mathematics Extension 2 11–12 (2024) syllabus overview](https://curriculum.nsw.edu.au/learning-areas/mathematics/mathematics-extension-2-11-12-2024/overview).
