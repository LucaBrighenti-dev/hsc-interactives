## Misconceptions

- **"Moving the slits further apart spreads the fringes out."** It squeezes them together. The fringe spacing is $\Delta y \approx \frac{\lambda L}{d}$, so doubling $d$ halves $\Delta y$. In the standard scenario, change $d$ from 0.25 mm to 0.50 mm and the fringe spacing readout falls from 4.80 mm to 2.40 mm.
- **"Each bright fringe is an image of a slit."** Two slits give a whole row of bright fringes, and their spacing changes with the wavelength, which an image would not do. Each bright fringe is a direction in which the waves from the two slits arrive in phase: the path difference is a whole number of wavelengths, $d\sin\theta = m\lambda$.
- **"The centre is bright because the slits point straight at it."** The centre is bright because every point on the centre line is the same distance from both slits. The path difference is zero, so the waves arrive in phase whatever the wavelength. That is also why the $m = 0$ maximum of a grating is white in white light.
- **"Red light is diffracted less than blue light."** In a grating the opposite is true: $\sin\theta = \frac{m\lambda}{d}$, so the longest wavelength is deviated most. At 600 lines/mm the first order is at $17.5°$ for 500 nm and $24.8°$ for 700 nm. (A prism disperses light the other way round, with violet bent most, which is where the confusion comes from.)
- **"Dark fringes are where light is destroyed."** The light is redistributed, not lost. With two slits the bright fringes reach four times the intensity of one slit alone (twice the amplitude), and the dark fringes have none, so the average over the pattern is twice one slit's intensity, which is just the light from two slits.
- **"The small-angle formula always works."** $\Delta y = \frac{\lambda L}{d}$ uses $\tan\theta \approx \sin\theta$. That is excellent for a double slit (angles well under $1°$) but not for a grating, whose maxima are at tens of degrees and are not evenly spaced on a flat screen.

## 10-minute lesson flow

1. **(0–3 min) Bright and dark.** Open *Young’s double slit, 600 nm*. Students calculate $\frac{\lambda L}{d} = \frac{(600 \times 10^{-9})(2)}{0.25 \times 10^{-3}} = 4.80 \times 10^{-3}$ m by hand, then check the fringe spacing readout. Use the set-up diagram to explain bright fringes (path difference $m\lambda$) and dark fringes (path difference $(m + \frac{1}{2})\lambda$).
2. **(3–5 min) One variable at a time.** Ask the class to predict before each change: wavelength down to 450 nm ($\Delta y$ falls to 3.60 mm), screen distance up to 4 m ($\Delta y$ doubles to 9.60 mm), slit separation up to 0.50 mm ($\Delta y$ halves to 2.40 mm). Students write the proportionalities $\Delta y \propto \lambda$, $\Delta y \propto L$ and $\Delta y \propto \frac{1}{d}$.
3. **(5–8 min) The grating.** Choose *Grating, 600 lines/mm, 500 nm*. Find $d = \frac{1}{600}$ mm $= 1.67\ \mu$m, then $\sin\theta_1 = \frac{\lambda}{d} = 0.3$ and $\theta_1 = 17.5°$. Count the orders: $|\sin\theta| < 1$ needs $m < \frac{d}{\lambda} = 3.33$, so $m = 3$ is the highest. Raise the wavelength to 700 nm and watch the third order disappear.
4. **(8–10 min) Why spectrometers use gratings.** Choose *Grating with 1000 slits lit*. The maxima stay at the same angles but the central width readout drops from 12.0 mm to 1.20 mm. Narrow lines mean two close wavelengths land as two separate lines instead of one blur.

## Try this: answers

1. The fringe spacing doubles, because $\Delta y \approx \frac{\lambda L}{d}$ is inversely proportional to $d$. Type 0.125 mm into the slit separation box: the spacing goes from 4.80 mm to 9.60 mm, and the first-order angle doubles from $0.1375°$ to $0.2750°$. The single-slit envelope does not change (it depends on the slit width $a$, not on $d$), so fewer fringes now fit inside the central part of the envelope.
2. For the grating, $\theta_1 = 17.46°$ and the exact position is $y_1 = L\tan\theta_1 = 0.629$ m, while the estimate $\frac{\lambda L}{d} = L\sin\theta_1 = 0.600$ m. The ratio of the two is $\frac{\tan\theta}{\sin\theta} = \frac{1}{\cos\theta} = 1.048$, so the estimate is about 5% low. For the double slit, $\theta_1 = 0.1375°$ and $\frac{1}{\cos\theta_1} = 1.000003$: the two values agree to better than one part in 100 000 (4.80001 mm against 4.80000 mm). The approximation $\sin\theta \approx \tan\theta \approx \theta$ (in radians) is only good for small angles, and double-slit angles are tiny because $d$ is hundreds of wavelengths (about 400 here).
3. In the standard pattern $d = 0.25$ mm and $a = 0.05$ mm, so $d = 5a$. The 5th bright fringe would be where $d\sin\theta = 5\lambda$, which means $a\sin\theta = \lambda$. That is exactly the condition for the first dark fringe of a single slit: in that direction each slit on its own sends no light, so there is nothing for the two slits to add together. The dashed envelope touches zero at $y \approx \frac{\lambda L}{a} = 24.0$ mm, right where the 5th fringe would be ($5 \times 4.80$ mm). The 10th order is missing for the same reason ($a\sin\theta = 2\lambda$).
4. The bright lines do not move: their angles come from $d\sin\theta = m\lambda$, which depends only on $d$ and $\lambda$, so $\theta_1$ stays at $17.46°$. Each line becomes ten times narrower: the central width falls from 12.0 mm to 1.20 mm. Next to a maximum, the first zero is where the path difference between the first and last lit slits has changed by about one wavelength. Then each slit in the first half of the grating has a partner in the second half that is half a wavelength out of step, and they cancel in pairs. Near the centre that takes an angle of only about $\frac{\lambda}{Nd}$, so ten times as many slits make each maximum ten times narrower. (Set the screen shown to $\pm 10$ mm to see the central maximum shrink.) The graph is relative to the central maximum, so it does not show that the peaks also get much brighter: at a maximum the amplitude is proportional to $N$, so the intensity is proportional to $N^2$.
5. A maximum exists only if $\sin\theta = \frac{m\lambda}{d}$ is less than 1, so $m < \frac{d}{\lambda}$. At 600 lines/mm, $d = 1667$ nm. For 500 nm, $\frac{d}{\lambda} = 3.33$, so the orders are $m = 0, \pm 1, \pm 2, \pm 3$. For 700 nm, $\frac{d}{\lambda} = 2.38$, so only $m = \pm 1, \pm 2$ exist on each side. Red is deviated most: $\theta_1 = 24.8°$ for 700 nm against $17.5°$ for 500 nm, because a longer wavelength needs a bigger angle to make a path difference of one whole wavelength. In white light every wavelength has its own angle in each order, so each order is a spectrum with violet nearest the centre and red furthest out. The $m = 0$ maximum stays white, because the path difference there is zero for every wavelength.

## Original HSC-style question

A student shines a green laser of wavelength 532 nm through two narrow slits 0.30 mm apart. A pattern of bright and dark fringes appears on a wall 2.50 m from the slits.

(a) Calculate the distance between adjacent bright fringes on the wall. (2 marks)

(b) The two slits are replaced by a diffraction grating with 500 lines per millimetre. Calculate the angle of the first-order maximum. (2 marks)

(c) Determine the highest order of maximum the grating produces, and hence the total number of bright maxima that could be observed. (2 marks)

(d) Another student uses the method from part (a) to predict that the first-order maximum from the grating is 0.665 m from the central maximum. Calculate the actual distance, and explain why the prediction is wrong. (2 marks)

(e) Explain why the maxima produced by the grating are much narrower and brighter than the fringes produced by the two slits. (3 marks)

### Worked solution

(a) The fringe angles are tiny ($\sin\theta \approx \frac{\lambda}{d} = 0.0018$), so the small-angle result applies:

$$\Delta y = \frac{\lambda L}{d} = \frac{(532 \times 10^{-9})(2.50)}{0.30 \times 10^{-3}} = 4.43 \times 10^{-3}\ \text{m} = 4.43\ \text{mm}$$

(b) The slit spacing is

$$d = \frac{1}{500}\ \text{mm} = 2.00 \times 10^{-3}\ \text{mm} = 2.00 \times 10^{-6}\ \text{m}$$

For the first order, $d\sin\theta = \lambda$:

$$\sin\theta_1 = \frac{532 \times 10^{-9}}{2.00 \times 10^{-6}} = 0.266, \quad \theta_1 = 15.4°$$

(c) A maximum needs $\sin\theta = \frac{m\lambda}{d} < 1$, so

$$m < \frac{d}{\lambda} = \frac{2.00 \times 10^{-6}}{532 \times 10^{-9}} = 3.76$$

The highest order is $m = 3$ (at $\sin\theta_3 = 0.798$, $\theta_3 = 52.9°$). The maxima are $m = 0, \pm 1, \pm 2, \pm 3$: seven bright maxima in total.

(d) On a flat wall the position is $y = L\tan\theta$:

$$y_1 = 2.50 \times \tan 15.43° = 2.50 \times 0.2759 = 0.690\ \text{m}$$

The method from part (a) uses $y = \frac{m\lambda L}{d}$, which assumes $\tan\theta \approx \sin\theta$. That only holds for small angles. At $15.4°$, $\tan\theta$ is about 4% larger than $\sin\theta$, so the prediction (0.665 m) is 0.025 m too small.

(e) At a principal maximum the path difference between neighbouring slits is a whole number of wavelengths, so the waves from all $N$ lit slits arrive in phase. Move slightly away from that direction and each slit's wave falls a little further out of step with the one before it. With two slits, cancellation needs a path difference of half a wavelength between them, which happens only halfway to the next fringe, so the fringes are broad. With hundreds of slits, the waves cancel in pairs as soon as the path difference between the first and last lit slits has changed by about one wavelength (each slit in one half of the grating is then half a wavelength out of step with a partner in the other half). That happens a very small angle from the maximum, about $\frac{\lambda}{Nd}$ radians, so the maxima are very narrow. They are also bright: all $N$ amplitudes add at the maximum, so the intensity there is proportional to $N^2$, while the light between the maxima almost entirely cancels. The grating concentrates the light into a few sharp lines.

**Marking notes.** (a) Correct substitution in consistent SI units, answer with unit. (b) $d$ from lines per mm, then the angle. (c) Uses $\sin\theta \le 1$ and counts both sides plus the centre. (d) Uses $\tan$ for the exact position and links the error to the small-angle approximation. (e) For full marks: in phase at the maxima for all slits, cancellation close to each maximum when there are many slits, and brightness from many slits adding in phase.

## Assumptions and limits

- **Light.** Monochromatic and coherent plane waves arrive square-on to the slits, and every slit is lit equally. Real laser beams are brighter in the middle, which softens the outer orders a little.
- **Far field.** The pattern is the far-field (Fraunhofer) pattern, $I = I_0\left[\frac{\sin\beta}{\beta}\right]^2\left[\frac{\sin N\gamma}{N\sin\gamma}\right]^2$ with $\beta = \frac{\pi a\sin\theta}{\lambda}$ and $\gamma = \frac{\pi d\sin\theta}{\lambda}$. This assumes the screen is far away compared with the size of the lit area. For the *Grating with 1000 slits lit* scenario the lit width is $Nd = 1.67$ mm, so on a bare screen 2 m away each line could not look narrower than the laser spot; spectrometers view the pattern through a telescope focused at infinity, which gives the far-field result.
- **Positions.** Positions on the screen are exact, $y = L\tan\theta$. The green ticks show where the small-angle formula $y = \frac{m\lambda L}{d}$ (or $\frac{m\lambda L}{a}$ for a single slit) would put each fringe, so students can see where it fails.
- **Intensity.** The graph shows intensity relative to the central maximum, as a function of angle. It ignores the extra dimming at large angles on a flat screen (the screen is further away and tilted to the light there), so the outer grating orders would look fainter than drawn.
- **Colour.** The screen colour is an approximation of how the wavelength looks; outside about 380–750 nm the pattern is drawn in grey.
- **Readouts.** For a single slit, "first-order angle" and "first-order position" mean the first dark fringe, $a\sin\theta = \lambda$. A grating has no single fringe spacing (its maxima are not evenly spaced on a flat screen), so that readout shows a dash.
- **Slits.** In the double slit the slit width cannot exceed the separation; a larger value is capped at $d$ and the stage says so.

## Syllabus links

- Physics Stage 6 (2017), Module 7: The Nature of Light, light and the wave model: [Physics Stage 6 Syllabus (2017)](https://www.nsw.gov.au/education-and-training/nesa/curriculum/science/physics-stage-6-2017)
- Physics 11–12 (2025), Year 12, Nature of light: [Physics 11–12 (2025) Year 12 content](https://curriculum.nsw.edu.au/learning-areas/science/physics-11-12-2025/content/year-12/fae0634d66)
