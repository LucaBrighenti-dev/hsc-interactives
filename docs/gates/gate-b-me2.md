# Gate B: Mathematics Extension 2 specs

**For:** Luca (delegated to the orchestrator) · **Written:** 25 November 2026 · **Task:** W1-SPEC-me2 · **Branch:** `w1/specs-me2`

Each spec is in `specs/<id>.md` with status `draft`. For each one, check that the learning goal suits the 2024 Ext 2 course, the parameter ranges suit a classroom, the acceptance numbers look right, and the prompts make students think (guide §10). Every acceptance number has its formula and hand working in the spec. An independent script recomputed every expected value from closed forms (0 failures); the time-based ones were also checked against an RK4 run at dt = 1/240 s.

The two argand specs use the exact keys of the `argand` meta on `origin/w1/engine-argand` (commit 8caa8d0), and their 17 checks (56 values) also pass when run through that engine's own model, with its presets and parameter syncing. No space3d or particle2d meta had been pushed, so those specs list their keys under "Engine change requests" as keys to reconcile.

## P0

- **me2-argand-explorer** (argand / operations). Goal: multiplying by z₂ rotates by arg z₂ and scales by |z₂|; de Moivre as a spiral of powers; the roots of zⁿ = w form a regular n-gon. Key numbers: (2 + i)(1 + i) = 1 + 3i, modulus √10 = 3.16228, argument 1.24905 = 0.46365 + π/4; (1 + 3i)/(1 + i) = 2 + i; (−1 + i)⁵ = 4 − 4i, argument −π/4; principal root of z⁴ = −4 is 1 + i; i² = −1 with argument π (not −π); (2 + i)i = −1 + 2i, same modulus √5.

## P1

- **me2-3d-lines-spheres** (space3d / lines-spheres). Goal: vector equation of a line; classify two lines as intersecting, parallel or skew; line–sphere intersections from a quadratic in λ and its discriminant. Key numbers (line 1 = (1, 2, 3) + λ(1, −1, 2)): skew with (2, 0, 1) + μ(1, 1, 1), distance 9/√14 = 2.40535, angle 61.8745°; intersecting with (0, −1, 3) + μ(1, 1, 1) at (2, 1, 5), λ = 1, μ = 2; parallel with v = −2u, distance √(59/6) = 3.13581; coincident; sphere centre (1, 1, 1), R = 3 cut by (1, 0, 5) + λ(0, 1, −1) at λ = 1, 4 (Δ = 36, chord √18); tangent at λ = 3 (Δ = 0); R = 2 misses (Δ = −4).
- **me2-loci-painter** (argand / loci). Goal: read |z − a| as distance and arg(z − a) as direction from a; sketch circles, discs, bisectors, half-planes, rays and sectors; included (solid) and excluded (dashed, hollow) boundaries; two conditions together; test a point. Key numbers: z = 3 + i is on |z − (2 + i)| = 1, so it fails `<` and passes `≤`; arg(z − 1) = π/4 contains 2 + i but not −i (argument −3π/4); the midpoint 2 + i of 1 and 3 + 2i is √2 from both; the default region |z − (1 + i)| ≤ 2 and arg z ≥ 0 contains 1 + 2i but not 2 − 0.5i (argument −0.24498); the ray arg z = π/4 meets |z − 2| = 2 at 2 + 2i but not at the excluded vertex 0. Requested from the engine: extremes of |z| and arg z on a circle (for |z − (3 + 4i)| = 2: 3 to 7, and 0.51578 to 1.33881).
- **me2-resisted-motion** (particle2d / resisted-1d). Goal: equations of motion with kv and kv² resistance, horizontal and vertical; terminal velocity; lower and earlier maximum height; the equation changes at the top; kv coasting has a finite limiting distance. Key numbers (g = 9.8): m = 1, k = 0.5 falling from rest: v_T = 19.6 m/s, v(10) = −19.4679 m/s, x(10) = −157.064 m; m = 1, k = 0.1 (kv²): v_T = √98 = 9.89949 m/s, v(5) = −9.89850 m/s, x(5) = −42.5665 m; thrown up at 20 m/s: H = 8.12816 m at 1.12246 s (kv², vs 20.41 m with no resistance) and H = 12.4307 m at 1.40660 s (kv); horizontal m = 2, k = 0.5, v₀ = 10: x(4) = 25.2848 m, limit 40 m; kv² coasting: v(2) = 4 m/s, x(2) = 10 ln 5 = 16.0944 m.
- **me2-shm** (particle2d / shm). Goal: SHM as ẍ = −n²(x − c) and as the projection of a point turning on a circle; amplitude, period, phase, greatest speed and acceleration from the initial conditions; v² = n²(a² − (x − c)²). Key numbers: n = 2, x₀ = 3, v₀ = 8 gives a = 5, period π, α = −0.92730, greatest speed 10, greatest acceleration 20; at t = 1 s, x = 2.38875 m, v = −8.78496 m/s; n = 3, c = −1, x₀ = 2, v₀ = −6 gives a = √13 = 3.60555, period 2π/3, α = 0.58800; n = 0.5, c = 1, x₀ = 1, v₀ = 1 gives x(2) = 1 + 2 sin 1 = 2.68294 m.

## Listing on another subject's page

- **me2-projectile-drag** uses the `me2-drag` preset of `phy-projectile-lab` (owned by the Physics spec writer). Suggestion: Ext 2 solves projectiles with resistance proportional to velocity, because the kv² case has no closed form. So use `{ speed: 30, angle: 45, drag: 'linear', k: 0.2, g: 9.8 }` with m = 1 kg (not the quadratic example in guide §5.2). Closed-form values the Physics spec could check: v_T = mg/k = 49 m/s, time to top (m/k) ln(1 + kv₀ sin θ/(mg)) = 1.79858 s, greatest height 17.9356 m (22.96 m without drag), horizontal asymptote mv₀ cos θ/k = 106.066 m, and (solved numerically) flight time 3.84197 s and range 56.8772 m (91.84 m without drag).

## Engine change requests (summary)

- `argand` (keys already match): root-sum outputs for nth roots; a `build` slider for "rotate, then scale"; extremes of |z| and arg z on a modulus condition, with an overlay; per-condition verdict outputs.
- `space3d`: keys for `lines-spheres`, including three-number `list` params for points and directions; relative tolerances for parallel, intersecting and tangent; clamp the cosine before cos⁻¹.
- `particle2d`: keys for `resisted-1d` and `shm`; v against x (the phase plot) and v² against x graphs; SHM given by n and c (not m and k); t = n·dt with completion after round(duration/dt) steps; a parameter change resets to t = 0.
