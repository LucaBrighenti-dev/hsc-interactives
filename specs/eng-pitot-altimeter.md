---
id: eng-pitot-altimeter
title: "Pitot-static and altimeter"
subject: eng
engine: aero
setup: pitot-static
priority: P1
status: draft            # stub → draft → approved (Gate B)
page: /interactives/engineering/pitot-altimeter.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Engineering Studies","version":"2011","area":"Aeronautical engineering","subtopic":"Engineering mechanics and hydraulics","year":12,"outcomes":["H3.1"],"url":"https://www.nsw.gov.au/education-and-training/nesa/curriculum/tas/engineering-studies-stage-6-2011","verified":true}
  - {"course":"Engineering Studies","version":"2026","focusArea":"Aeronautical and aerospace engineering","subtopic":"Propulsion and measurement systems","year":12,"outcomes":["ES-12-04"],"url":"https://curriculum.nsw.edu.au/learning-areas/tas/engineering-studies-11-12-2026/content/year-12/fa66e557c0","verified":true}
---
# Pitot-static and altimeter

> Backlog summary: Airspeed from total minus static pressure; altitude from static pressure.

## Learning goal
Students see how an aircraft measures its airspeed and altitude from pressure alone. A pitot tube senses total pressure and the static ports sense static pressure; their difference is the dynamic pressure ½ρV², from which the airspeed indicator works out V. The altimeter turns static pressure into altitude using the standard atmosphere, so it reads correctly only when set to the day's sea-level pressure (QNH). Students explain why indicated airspeed reads low at altitude and why flying from high to low pressure without resetting the altimeter is dangerous.

Syllabus fit: 2011 Aeronautical Engineering (flight instruments, pitot-static system, Bernoulli's principle); 2026 Aeronautical and aerospace engineering, Year 12, propulsion and measurement systems. Pitched at Stage 6: Δp = ½ρV², density falling with altitude (from a table or graph); the standard atmosphere's formulas are used by the page, not by students.

## What the student sees
Default view at 1920×1080, light projector theme:

- **Left half:** a cutaway of an aircraft nose with a pitot tube facing the airflow and a static port flush on the fuselage side. Two pipes run back to an instrument panel. Each pipe is labelled with its pressure ("p_t = 102 305 Pa", "p_s = 101 325 Pa"); a U-tube manometer between them shows the difference Δp as a height of liquid, labelled in Pa.
- **Instrument panel:** an airspeed indicator (dial in knots, with the m/s value beneath) and an altimeter (dial in feet, with metres beneath and the subscale setting in hPa in a window). Both needles move as the sliders change.
- **Right half:** a vertical atmosphere column from 0 to 11 000 m with the aircraft at its true altitude, temperature and density profiles drawn beside it, and two markers: true altitude (solid line, labelled) and indicated altitude (dashed line, labelled). When they differ, the gap is dimensioned ("altimeter error +84 m").
- **Footer:** the assumptions.

Static setup: play, step and reset are hidden.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| altitude | Altitude h | m | 0 | 11000 | 100 | 0 | true altitude; the page's default preset sets 1000 m |
| airspeed | Airspeed V | m/s | 5 | 100 | 0.5 | 40 | true airspeed; the page's default preset sets 60 m/s |
| seaLevelPressure | Sea-level pressure today | hPa | 950 | 1050 | 0.25 | 1013.25 | |
| altimeterSetting | Altimeter setting (QNH) | hPa | 950 | 1050 | 0.25 | 1013.25 | |

These keys, ranges and engine defaults match the aero engine's `meta` on `origin/w1/engine-aero` (checked 25 November 2026). Up to 100 m/s the flow stays below Mach 0.3, so the incompressible formula is fair.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | 1000 m, 60 m/s, 1013.25 hPa, set 1013.25 | a standard day: instruments read true |
| sea-level | 0 m, 40 m/s | Δp = 980 Pa, the easy hand calculation |
| cruise | 3000 m, 60 m/s | thinner air: indicated airspeed about 14% low |
| high-to-low | 1000 m, 60 m/s, sea-level pressure 1003.25, set 1013.25 | flying into lower pressure without resetting: the altimeter over-reads |
| reset-qnh | high-to-low with the setting 1003.25 | resetting to QNH fixes it |
| tropopause | 11 000 m, 100 m/s | the top of the troposphere: −56.5 °C |

g is not set on this page: the standard atmosphere uses its own fixed g₀ = 9.80665 m/s² (the footer says so).

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| staticPressure | Static pressure p_s | Pa | 6 |
| totalPressure | Total (pitot) pressure p_t | Pa | 6 |
| pressureDifference | Pressure difference Δp = p_t − p_s | Pa | 3 |
| density | Air density ρ | kg/m³ | 4 |
| temperature | Air temperature | K | 5 |
| trueAirspeed | Airspeed from the pressures and ρ | m/s | 3 |
| indicatedAirspeed | Indicated airspeed (sea-level density) | m/s | 3 |
| mach | Mach number | | 3 |
| pressureAltitude | Pressure altitude (set 1013.25) | m | 4 |
| indicatedAltitude | Altimeter reading | m | 4 |
| altimeterError | Altimeter error (reading − true) | m | 3 |

## Assumptions shown on stage
- International Standard Atmosphere (ISA) troposphere, shifted to today's sea-level pressure
- Incompressible flow: p_t − p_s = ½ρV² (reads low above about Mach 0.3)
- Airspeed indicator calibrated with sea-level density 1.225 kg/m³
- No instrument, position or temperature errors; still air

## Try this (3–5 predict, observe, explain prompts)
1. Predict: if the airspeed doubles, what happens to the pressure difference across the manometer? Observe it.
2. Observe: climb from 0 to 3000 m at a steady true airspeed of 60 m/s. What happens to the airspeed indicator, and why?
3. Predict, then observe: in **high-to-low**, will the altimeter read higher or lower than the true altitude? Which is the dangerous direction?
4. Explain: why does resetting the subscale to today's sea-level pressure make the altimeter read true again?
5. Observe: at 11 000 m, how much lower are the temperature and the pressure than at sea level?

## Teacher notes outline
- Misconceptions to target: the pitot tube measures speed directly (it measures pressure); the airspeed indicator shows true airspeed at every altitude; an altimeter measures height above the ground (it measures pressure); air pressure falls linearly with height.
- 10-minute lesson flow: (1) sea level: Δp = ½ × 1.225 × 40² = 980 Pa by hand; (2) climb and watch indicated airspeed fall below true; (3) the altimeter as a pressure gauge; (4) high-to-low: the over-reading and why pilots reset to QNH; (5) a link to the flight forces page: lift also depends on ½ρV².
- Original HSC-style question idea: at an altitude where ρ = 0.82 kg/m³, a pitot-static system measures a pressure difference of 1640 Pa. Find the true airspeed and the airspeed an indicator calibrated for 1.225 kg/m³ shows. Worked solution: V = √(2 × 1640/0.82) = √4000 = 63.2 m/s; V_i = √(2 × 1640/1.225) = √2677.6 = 51.7 m/s.

## Accessibility notes
The two pressures are labelled in text on their pipes; the dial needles have value labels beneath in both units. True and indicated altitude markers differ by line style (solid against dashed) and carry text labels. All sliders are keyboard operable. Stage label: "Aircraft at … metres, … metres per second. Static pressure … pascals, total pressure … pascals, difference … pascals. Indicated airspeed … metres per second; altimeter reads … metres."

## Engine change requests
None. Every param and output used here exists in the aero engine's `meta` on `origin/w1/engine-aero` (checked 25 November 2026), and `pitot-static` is a static setup there.

## Acceptance
Every number below comes from the formula and hand calculation shown here. ISA constants: T₀ = 288.15 K, p₀ = 101 325 Pa, lapse rate L = 0.0065 K/m, R = 287.053 J/(kg·K), g₀ = 9.80665 m/s², so the exponent g₀/(RL) = 5.25588. Troposphere: T = T₀ − Lh; p = p₀(T/T₀)^5.25588; ρ = p/(RT). Pitot: p_t = p_s + ½ρV²; V_i = √(2Δp/1.225). Altimeter: H(p) = (T₀/L)[1 − (p/p₀)^(1/5.25588)]; reading = H(p_s) − H(setting). A different sea-level pressure shifts the whole ISA by H(sea-level pressure).

- **Check 1, sea level at 40 m/s.** p_s = **101 325 Pa**; ρ = 101 325/(287.053 × 288.15) = 1.225 kg/m³; Δp = ½ × 1.225 × 40² = **980 Pa**; p_t = **102 305 Pa**; indicated = true = **40 m/s**.
- **Check 2, 3000 m at 60 m/s.** T = 288.15 − 19.5 = **268.65 K**. p_s = 101 325 × (268.65/288.15)^5.25588 = 101 325 × 0.691917 = **70 108.5 Pa**. ρ = 70 108.5/(287.053 × 268.65) = **0.909122 kg/m³**. Δp = ½ × 0.909122 × 3600 = **1636.42 Pa**. V_i = √(2 × 1636.42/1.225) = √2671.71 = **51.689 m/s**, which is 13.9% below the true 60 m/s. Mach = 60/√(1.4 × 287.053 × 268.65) = 60/328.58 = **0.18261**.
- **Check 3, 11 000 m.** T = 288.15 − 71.5 = **216.65 K**. p_s = 101 325 × (216.65/288.15)^5.25588 = **22 632.0 Pa**, the ISA tropopause value.
- **Check 4, altimeter set 10 hPa low on a standard day, at sea level.** Reading = H(101 325) − H(100 325) = 0 − 44 330.8 × [1 − (100 325/101 325)^0.190263] = **−83.577 m**.
- **Check 5, high to low.** Today's sea-level pressure is 1003.25 hPa, so the atmosphere is the ISA shifted down by H(100 325 Pa) = 83.577 m. At a true 1000 m the static pressure is the ISA value at 1083.577 m: p_s = **88 967.2 Pa**. With the subscale left at 1013.25 the altimeter reads H(p_s) − 0 = **1083.58 m**, an error of **+83.58 m** (reads high: the aircraft is lower than the pilot thinks). With the subscale reset to 1003.25 it reads 1083.577 − 83.577 = **1000 m**.
- **Question idea check.** V = √(3280/0.82) = 63.246 m/s; V_i = √(3280/1.225) = 51.746 m/s.

The engine's ISA density at sea level is 1.22500002 kg/m³ (p₀/(RT₀) with R = 287.05287), a relative difference of 1.5 × 10⁻⁸, inside every tolerance below.

```acceptance
[
  { "name": "sea level, 40 m/s: Δp = ½ρV² = 980 Pa", "params": { "altitude": 0, "airspeed": 40, "seaLevelPressure": 1013.25, "altimeterSetting": 1013.25 }, "run": "static",
    "expect": { "staticPressure": { "value": 101325, "relTol": 1e-9 }, "pressureDifference": { "value": 980, "relTol": 1e-6 }, "totalPressure": { "value": 102305, "relTol": 1e-9 }, "trueAirspeed": { "value": 40, "relTol": 1e-9 }, "indicatedAirspeed": { "value": 40, "relTol": 1e-6 }, "indicatedAltitude": { "value": 0, "absTol": 1e-6 } } },
  { "name": "3000 m, 60 m/s: density and indicated airspeed", "params": { "altitude": 3000, "airspeed": 60, "seaLevelPressure": 1013.25, "altimeterSetting": 1013.25 }, "run": "static",
    "expect": { "temperature": { "value": 268.65, "absTol": 1e-9 }, "staticPressure": { "value": 70108.526, "relTol": 1e-6 }, "density": { "value": 0.90912186, "relTol": 1e-6 }, "pressureDifference": { "value": 1636.4194, "relTol": 1e-6 }, "indicatedAirspeed": { "value": 51.688539, "relTol": 1e-6 }, "mach": { "value": 0.18260508, "relTol": 1e-6 } } },
  { "name": "ISA tropopause, 11 000 m", "params": { "altitude": 11000, "airspeed": 100, "seaLevelPressure": 1013.25, "altimeterSetting": 1013.25 }, "run": "static",
    "expect": { "temperature": { "value": 216.65, "absTol": 1e-9 }, "staticPressure": { "value": 22632.04, "relTol": 1e-6 } } },
  { "name": "altimeter set 10 hPa low reads 84 m low", "params": { "altitude": 0, "airspeed": 40, "seaLevelPressure": 1013.25, "altimeterSetting": 1003.25 }, "run": "static",
    "expect": { "indicatedAltitude": { "value": -83.576747, "relTol": 1e-6 } } },
  { "name": "high to low without resetting: reads 84 m high", "params": { "altitude": 1000, "airspeed": 60, "seaLevelPressure": 1003.25, "altimeterSetting": 1013.25 }, "run": "static",
    "expect": { "staticPressure": { "value": 88967.184, "relTol": 1e-6 }, "indicatedAltitude": { "value": 1083.576747, "relTol": 1e-6 }, "altimeterError": { "value": 83.576747, "relTol": 1e-5 } } },
  { "name": "reset to QNH: reads true", "params": { "altitude": 1000, "airspeed": 60, "seaLevelPressure": 1003.25, "altimeterSetting": 1003.25 }, "run": "static",
    "expect": { "indicatedAltitude": { "value": 1000, "absTol": 1e-6 }, "altimeterError": { "value": 0, "absTol": 1e-6 } } }
]
```
