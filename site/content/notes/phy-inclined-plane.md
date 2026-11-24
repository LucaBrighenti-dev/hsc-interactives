## Misconceptions

- **"Friction always equals $\mu N$."** Only kinetic friction is fixed at $\mu_k N$. Static friction is a response force: it supplies only what is needed to stop the block sliding, up to a limit of $\mu_s N$. In the default scenario the friction is 24.5 N while $\mu_s N$ is 25.5 N. The two bars on the stage (friction needed, and the most static friction can give) make the difference visible.
- **"The normal force always equals $mg$."** On a slope, $N = mg\cos\theta$: at 30° the 49 N block has $N = 42.4$ N. An applied force with a component off the surface changes $N$ again. Pull the crate at 30° above the floor and $N$ drops from 100 N to 70 N.
- **"Heavier blocks slide more easily."** Doubling the mass doubles $mg\sin\theta$, but it also doubles $N$ and so doubles $\mu_s N$. The mass cancels, and the block slips when $\tan\theta > \mu_s$ whatever its mass.
- **"Friction always acts down the slope."** Friction opposes the sliding, or the tendency to slide, of the block relative to the surface. A block resting on a slope on its own would slide down, so friction acts up the slope. Push it hard up the slope (the *Pushed up the slope with 60 N* scenario) and friction acts down the slope.
- **"The weight's component along the slope is $mg\cos\theta$."** It is $mg\sin\theta$. A quick check: at $\theta = 0$ there is no component along a level floor, and $\sin 0 = 0$. Turn on *Show components* to see both dashed components with their values.
- **"Once it starts sliding, it barely accelerates."** Because $\mu_k < \mu_s$, friction drops the moment sliding starts, so the net force jumps from zero to a definite value. This is why a heavy box is harder to start than to keep moving.

## 10-minute lesson flow

1. **(0–3 min) Free body diagram.** Open the default scenario (*30° slope: friction just holds*). Ask students to sketch the forces on the block before you reveal the stage. Then check $W\sin\theta = 49 \times 0.5 = 24.5$ N and $N = 49\cos 30° = 42.4$ N by hand against the readouts.
2. **(3–6 min) Angle of repose.** Ask the class to predict what a 2° rise will do, then raise $\theta$ in 0.5° steps until the verdict changes to *SLIPS DOWN THE SLOPE* (between 30.5° and 31°). Show that the block slips when $mg\sin\theta > \mu_s mg\cos\theta$, that is when $\tan\theta > \mu_s$, so $\theta = \tan^{-1} 0.6 = 31.0°$. Change the mass to show it cancels.
3. **(6–8 min) Sliding.** Choose *35° slope: slides down*. Derive $a = g(\sin\theta - \mu_k\cos\theta) = 9.8(0.5736 - 0.4 \times 0.8192) = 2.41$ m/s² and compare with the readout.
4. **(8–10 min) Level floor.** Choose *Engineering crate (g = 10)*. Raise $F$ from 40 N to 50 N (it holds) and then 51 N: the acceleration jumps to 2.1 m/s². Finish by setting the direction of $F$ to 30° to show that pulling upwards reduces $N$, and so reduces the friction.

## Try this: answers

1. At 32° the block slides down the slope. The weight's component along the slope is $49\sin 32° = 26.0$ N, but static friction can supply at most $\mu_s N = 0.6 \times 41.6 = 24.9$ N. Kinetic friction is then $0.4 \times 41.6 = 16.6$ N, so $a = (26.0 - 16.6)/5 = 1.87$ m/s² down the slope. The block starts to slide when $mg\sin\theta = \mu_s mg\cos\theta$, that is when $\tan\theta = \mu_s$, so $\theta = \tan^{-1} 0.6 = 30.96°$. On the slider it still holds at 30.5° and slides at 31°. The *Angle of repose* readout shows the same value.
2. No. The angle of repose stays at 31.0° for any mass. Both $mg\sin\theta$ and $\mu_s N = \mu_s mg\cos\theta$ are proportional to $m$, so the condition for slipping, $mg\sin\theta > \mu_s mg\cos\theta$, simplifies to $\tan\theta > \mu_s$, which has no $m$ in it. With 50 kg at 30°, the friction is 245 N and $\mu_s N$ is 254.6 N: ten times larger, with the same verdict.
3. Static friction is not fixed at $\mu_s N$. It adjusts to whatever keeps the block in equilibrium, up to that limit. The block is at rest, so the forces along the slope balance: $f = mg\sin\theta = 24.5$ N. The 25.5 N is the most that static friction could supply. If friction really were 25.5 N, there would be a net force of 1.0 N up the slope and the block would accelerate up the slope by itself, which never happens.
4. The crate moves only when the push is greater than $\mu_s N = 0.5 \times 10 \times 10 = 50$ N. At exactly 50 N it is on the point of slipping and the model still counts it as at rest. At 51 N it slides, and friction drops from the static value (50 N) to the kinetic value $\mu_k N = 0.3 \times 100 = 30$ N. The net force jumps from 0 to $51 - 30 = 21$ N, so $a = 21/10 = 2.1$ m/s². The jump happens because $\mu_k < \mu_s$, which is why a heavy box is harder to start than to keep moving.
5. Pulling at 30° above the floor, the upward component $F\sin 30°$ carries part of the crate's weight, so $N = 100 - 0.5F$ and the friction limit $\mu_s N$ falls. The crate moves when $F\cos 30° > 0.5(100 - 0.5F)$, which gives $F > 50/(\cos 30° + 0.5\sin 30°) = 44.8$ N. On the slider, 44 N holds ($N = 78$ N, $\mu_s N = 39$ N, against $F\cos 30° = 38.1$ N) and 45 N slides ($N = 77.5$ N, $a = 1.57$ m/s²). A horizontal push needs more than 50 N because none of it reduces $N$. Extension: the smallest pull is at the angle $\tan^{-1}\mu_s = 26.6°$ (44.7 N). Pulling more steeply than that wastes force, and pushing downwards at an angle (a negative direction) increases $N$ and makes the crate harder to move.

## Original HSC-style question

A crate of mass 12 kg rests on a ramp inclined at 25° to the horizontal. The coefficient of static friction between the crate and the ramp is 0.45, and the coefficient of kinetic friction is 0.32. Take $g = 9.8$ m s⁻².

(a) Show that the crate will slide down the ramp if it is released from rest. (2 marks)

(b) Calculate the acceleration of the crate as it slides down the ramp. (2 marks)

(c) A worker pushes the crate with a force parallel to the ramp so that it moves up the ramp at constant speed. Calculate the size of this force. (2 marks)

(d) The worker stops the crate part-way up the ramp, holding it at rest, then pushes up the ramp with the force found in part (c). Explain, with calculations, why the crate does not start to move, and find the smallest force parallel to the ramp that would start it moving up the ramp. (3 marks)

### Worked solution

(a) The weight is $W = mg = 12 \times 9.8 = 117.6$ N. Resolve it along and perpendicular to the ramp.

$$W\sin 25° = 117.6 \times 0.4226 = 49.70 \text{ N (down the ramp)}$$

$$N = W\cos 25° = 117.6 \times 0.9063 = 106.58 \text{ N}$$

The largest friction force static friction can supply is

$$\mu_s N = 0.45 \times 106.58 = 47.96 \text{ N}$$

Since $49.70 > 47.96$, static friction cannot hold the crate, so it slides down the ramp. (Equivalently, $\tan 25° = 0.466 > \mu_s = 0.45$.)

(b) While the crate slides down, kinetic friction acts up the ramp.

$$f_k = \mu_k N = 0.32 \times 106.58 = 34.11 \text{ N}$$

Applying $F_{\text{net}} = ma$ along the ramp, with down the ramp positive:

$$a = \frac{49.70 - 34.11}{12} = \frac{15.59}{12} = 1.30 \text{ m s}^{-2}$$

so the acceleration is 1.30 m s⁻² down the ramp. This agrees with $a = g(\sin\theta - \mu_k\cos\theta) = 9.8(0.4226 - 0.2900) = 1.30$ m s⁻².

(c) Moving up the ramp, kinetic friction acts down the ramp. At constant speed the net force is zero, so the push balances both the weight component and friction.

$$F = W\sin 25° + \mu_k N = 49.70 + 34.11 = 83.8 \text{ N}$$

(d) With the crate at rest and $F = 83.8$ N, the net force along the ramp without friction would be

$$83.8 - 49.70 = 34.1 \text{ N up the ramp}$$

Static friction can supply up to 47.96 N, which is more than 34.1 N. So static friction supplies 34.1 N down the ramp, the forces balance, and the crate stays at rest. To start it moving up the ramp, the push must exceed the weight component plus the largest static friction:

$$F > W\sin 25° + \mu_s N = 49.70 + 47.96 = 97.7 \text{ N}$$

It takes more force to start the crate moving than to keep it moving, because $\mu_s > \mu_k$.

To check on the page, set $\theta = 25°$, $m = 12$ kg, $\mu_s = 0.45$, $\mu_k = 0.32$ and $g = 9.8$: it slips down at 1.30 m/s². With $F = 84$ N it stays at rest (friction 34.3 N down the slope), and with $F = 98$ N it slides up.

## Assumptions and limits

- **Particle model.** The block is a point at its centre: there is no toppling or rotation, and the applied force acts through the centre. A tall block pushed near its top can tip before it slides, which this page does not model.
- **Simple friction model.** $\mu_s$ and $\mu_k$ are constants that do not depend on speed or contact area. Static friction takes any value up to $\mu_s N$; kinetic friction is exactly $\mu_k N$. Real surfaces only roughly follow this.
- **The block starts at rest.** The page solves one instant: it decides whether a block at rest stays at rest or starts to slide, and gives the acceleration at that moment. It does not animate the motion, and it cannot show a block that is already moving (for example, one sliding up the slope and slowing down), where friction opposes the velocity rather than the push. Part (c) of the question above is a constant-speed case that the page can only show as "at rest" (see part (d)).
- **On the point of slipping.** When the push exactly equals $\mu_s N$, the page counts the block as at rest. It slides only when the push is greater.
- **$\mu_k$ is never above $\mu_s$.** If $\mu_k > \mu_s$ is entered, the page uses $\mu_k = \mu_s$ and says so on the stage. Otherwise a block released from rest could appear to slide uphill.
- **Lifting off.** If the applied force pulls off the surface harder than the block presses into it ($F\sin\phi > mg\cos\theta$), the normal force would be negative. The page says the block lifts off, sets $N$ and friction to zero, and shows no acceleration, because the slope model no longer applies.
- **Directions.** The slope angle runs from 0° (a level floor) to 80°. The direction of $F$ is measured from up the slope, anticlockwise positive: 0° pushes up the slope, 90° pulls straight off the surface, 180° pushes down the slope.
- **g.** The Physics scenarios use $g = 9.8$ m/s². The Engineering crate scenario uses 10 m/s², as Engineering Studies does. The value in use is shown at the top right of the stage.
- **Fixed ramp, no air resistance.** The ramp is rigid and does not move.

## Syllabus links

- Physics: [Physics Stage 6 Syllabus (2017)](https://www.nsw.gov.au/education-and-training/nesa/curriculum/science/physics-stage-6-2017), Module 2: Dynamics (forces and friction).
- Physics: [Physics 11–12 (2025), Year 11 Fundamentals of mechanics](https://curriculum.nsw.edu.au/learning-areas/science/physics-11-12-2025/content/year-11/fa874ba975) (motion on inclined planes).
- Engineering Studies (the *Static friction on a horizontal plane* listing, the Engineering crate scenario): [Engineering Studies Stage 6 Syllabus (2011)](https://www.nsw.gov.au/education-and-training/nesa/curriculum/tas/engineering-studies-stage-6-2011), Braking systems, and [Engineering Studies 11–12 (2026), Year 11 Applied engineering analysis](https://curriculum.nsw.edu.au/learning-areas/tas/engineering-studies-11-12-2026/content/year-11/faa305594d).
