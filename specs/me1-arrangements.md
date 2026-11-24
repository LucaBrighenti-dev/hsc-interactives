---
id: me1-arrangements
title: "Arrangement builder"
subject: me1
engine: custom
setup: none
priority: P2
status: draft            # stub → draft → approved (Gate B)
page: /interactives/maths-ext1/arrangements.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Mathematics Extension 1","version":"2024","area":"Combinatorics","focusArea":"Permutations and combinations","year":11,"outcomes":[],"verified":false}
---
# Arrangement builder

> Backlog summary: Arrangements with restrictions, together/apart, circular tables, pigeonhole demo.

## Learning goal
Students count arrangements by reasoning rather than listing: n! for n different objects in a row, (n − 1)! round a circle, n!/(a!b!…) with repeated letters, treating a group that must stay together as one block, using the complement for "not all together", and the gap method for "no two together". They also meet the pigeonhole principle: m objects in b boxes force a box holding at least ⌈m/b⌉. The page checks every formula against a brute-force count, so students can trust (and test) their reasoning.

## What the student sees
Default view at 1920×1080 (projector theme), line mode, 6 people, the 2 highlighted people kept together:

- **Seats (top half):** 6 seats in a row (or round a table in circle mode), each holding a person token: a circle with a letter A, B, C, … The restricted group (A and B by default) is drawn with a thick orange outline and a filled corner tag "G" (group). A "Shuffle" button deals a new random arrangement (seeded, view only) and a banner says whether it satisfies the restriction ("A and B together ✓" or "✗").
- **Reasoning panel (bottom left):** the counting argument as numbered steps in KaTeX with the current numbers, e.g. "Glue A and B into one block → 5 units → 5! orders → × 2! orders inside the block = 240". Each step can be revealed in turn ("Next step"). For "no two together", the panel and the seats show the gap method: the others seated first, with ^ marks in the gaps.
- **Check panel (bottom right):** the formula count beside a brute-force count "found by checking all 720 arrangements: 240", and the fraction of arrangements that satisfy the restriction (240/720 = 1/3).
- **List them** (toggle): every arrangement as a grid of small rows, with those that satisfy the restriction filled and the others hollow, and a count "240 of 720 satisfy". *Line and word modes:* one arrangement per row (distinct orderings only, for words), in dictionary order. *Circle mode:* the n! seatings are grouped into their (n − 1)! rotation classes, one class per row, with the n rotations of that seating side by side; a class is filled when its seatings satisfy the restriction (rotations of a seating all satisfy it or all fail). This shows why each round-table arrangement is counted once, not n times. *Cap:* at most 120 arrangements (or, in circle mode, 120 seatings: 24 classes of 5) are drawn at once, which covers 5 people in a row, round tables of up to 5, and BANANA (60). Larger cases show the first 120 rows with the label "showing the first 120 of 720", and the counts stay exact. Cells keep 18 px text at 1920×1080; the grid scrolls inside the stage rather than shrinking.
- **Word mode:** the letters as tiles, identical letters sharing a colour and a subscript (A₁, A₂, A₃) that can be switched off to show why they are indistinguishable.
- **Pigeonhole mode:** b boxes and m balls. "Deal" fills the boxes as evenly as possible, the fullest box is outlined and labelled "at least ⌈m/b⌉".

## Parameters
This is a custom page (`site/assets/engines/custom/me1-arrangements/`); the spec defines the engine. Suggested single setup name: `arrangements`, listed in `meta.staticSetups`.

| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| mode | Arrange | | | | | line | enum: `line` (in a row), `circle` (round a table), `word` (letters of a word), `pigeonhole` |
| people | Number of people n | | 2 | 9 | 1 | 6 | integer; line and circle |
| group | Size of the special group k | | 2 | 4 | 1 | 2 | integer; the first k people (A, B, …); if k > n the engine uses k = n |
| restriction | Restriction | | | | | together | enum: `none`, `together` (the k people all together), `notTogether` (not all together), `noneAdjacent` (no two of the k next to each other) |
| word | Word | | | | | BANANA | string, letters only (pattern `^[A-Za-z]{1,12}$`), treated as capitals |
| items | Balls m | | 1 | 60 | 1 | 13 | integer; pigeonhole |
| boxes | Boxes b | | 1 | 12 | 1 | 4 | integer; pigeonhole |
| showList | List them | | | | | off | toggle; at most 120 rows drawn (see What the student sees) |
| showSubscripts | Label repeated letters | | | | | off | word mode |
| seed | Shuffle seed | | 1 | 99999 | 1 | 1 | integer; the Shuffle button advances a mulberry32 generator from this seed (view only) |

Formulas the engine uses (n people, special group of k; in a circle, rotations of a seating count as the same arrangement and reflections as different):

| Mode | none | together | notTogether | noneAdjacent |
| --- | --- | --- | --- | --- |
| line | n! | (n − k + 1)! · k! | n! − (n − k + 1)! · k! | (n − k)! · ⁿ⁻ᵏ⁺¹Pₖ (0 if k > n − k + 1) |
| circle | (n − 1)! | (n − k)! · k! for k < n; (n − 1)! for k = n | (n − 1)! − together | (n − k − 1)! · ⁿ⁻ᵏPₖ (0 if k > n − k) |

- Word: n!/(c₁! c₂! …), where the cᵢ are the counts of each repeated letter.
- Pigeonhole: some box holds at least ⌈m/b⌉ balls.
- **Brute force:** for line and circle, the engine lists every arrangement (for a circle, person n is fixed in seat 1, giving the (n − 1)! distinct seatings) and tests the restriction directly: "together" means the k seats form one block of consecutive seats (cyclically in a circle); "noneAdjacent" means no two of the k seats are neighbours (seat n and seat 1 are neighbours in a circle). For words of up to 8 letters it counts the distinct orderings. Larger cases report NaN (shown as "too many to list").

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | line, 6 people, k = 2, together | The block method: 5! × 2! = 240 |
| apart | line, 6 people, k = 2, noneAdjacent | Complement or gap method: 480 |
| three-apart | line, 7 people, k = 3, noneAdjacent | The gap method: 4! × ⁵P₃ = 1440 |
| round-table | circle, 6 people, k = 2, together | (n − 1)! round a table; the block in a circle |
| banana | word, BANANA | Repeated letters: 6!/(3! 2!) = 60 |
| pigeonhole | pigeonhole, 13 balls, 4 boxes | Some box must hold at least 4 |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| count | Number of arrangements (formula) | | integer (`integer: true`) |
| bruteCount | Counted by computer | | integer (`integer: true`) |
| total | Arrangements with no restriction | | integer (`integer: true`) |
| probability | Fraction that satisfy the restriction | | 4 |
| atLeast | Pigeonhole: some box holds at least | | integer (`integer: true`) |

- `total` is n! (line), (n − 1)! (circle) or the word count (word); `probability` = count/total. In word mode `probability` is 1; in pigeonhole mode `count`, `bruteCount`, `total` and `probability` are NaN and `atLeast` = ⌈m/b⌉ (NaN in the other modes).

## Assumptions shown on stage
- All people are different; letters that are the same are identical
- Round a table, rotations are the same seating; reflections (clockwise versus anticlockwise) are different
- "Together" means all k special people in one unbroken block

## Try this (3–5 predict, observe, explain prompts)
1. Predict: 6 people in a row with A and B together. Is the answer 5!, 5! × 2 or 6! − 5!? Reveal the reasoning steps to check.
2. Observe: switch to "no two together" for the same 6 people. Add the two answers. What do you notice, and why?
3. Predict: with 7 people and the 3 special people, which is bigger: "not all together" or "no two together"? Explain the difference.
4. Observe: switch to the round table with 6 people. Why is the total 120, not 720? Set 4 people and turn on "List them": each row holds one seating and its 4 rotations.
5. Explain: in the pigeonhole preset, press Deal to share the 13 balls as evenly as possible. Why can no way of sharing them avoid a box with at least 4?

## Teacher notes outline
- Misconceptions to target: forgetting the k! orders inside a block; "apart" for three people meaning "not all together" (versus no two together); treating circular arrangements as n!; dividing by 2 for a circle when reflections are distinct (only for necklaces and keyrings); dividing by the wrong factorials for repeated letters; reading the pigeonhole principle as "every box has at least ⌈m/b⌉".
- 10-minute lesson flow: 0–2 min predict the default; 2–4 min reveal the block steps and the brute-force check; 4–6 min the complement and the gap method (apart, three-apart); 6–8 min the round table; 8–10 min BANANA, then the pigeonhole preset.
- Original HSC-style question idea: eight students, including Mia, Noah and Priya, are to sit in a row of eight chairs. (a) How many seatings have Mia, Noah and Priya all together? (b) How many have no two of them next to each other? (c) The same eight sit at a round table. Find the probability that Mia and Noah sit next to each other. Full question and worked solution go in the notes file. (Answers: 6! × 3! = 4320; 5! × ⁶P₃ = 14 400; 2/7.)

## Accessibility notes
- Second cues beyond colour: special people have a thick outline and a "G" tag; satisfying arrangements in the list are filled and others hollow; the banner uses ✓ or ✗ with words; repeated letters can show subscripts.
- Keyboard: all parameters are panel controls; Shuffle, Next step and Deal are buttons, and List them is a toggle.
- Stage aria-label (from `describe()`), for example: "Six people in a row, with A and B kept together. 240 of the 720 arrangements satisfy this, one third. The computer's count agrees."

## Engine change requests
Custom engine, built in Wave 2 from this spec: params and outputs as above; static (one setup, listed in `meta.staticSetups`); a `model.js` with the formulas and the brute-force counter, unit-tested against the acceptance numbers below.

## Acceptance
Every number below comes from the formula and hand calculation shown here; the formulas were also compared with a brute-force enumeration for every line and circle case with n = 3 … 8 and k = 2 … 4 (0 mismatches). All values are exact integers or simple fractions (tolerance 1e-9).

- **Check 1, no restriction.** 5 people in a row: 5! = **120**; brute force **120**; probability **1**.
- **Check 2, together (default).** 6 people, A and B together: glue them into one block, leaving 5 units: 5! = 120 orders, × 2! inside the block = **240**. Total 6! = **720**; probability 240/720 = **1/3**.
- **Check 3, no two together.** Same 6 people: complement 720 − 240 = 480. Gap method: seat the other 4 (4! = 24 ways), giving 5 gaps; place A and B in different gaps in order: ⁵P₂ = 20; 24 × 20 = **480**.
- **Check 4, a group of three in a row of seven.** Together: block plus 4 others = 5 units: 5! × 3! = 120 × 6 = **720**. Not all together: 7! − 720 = 5040 − 720 = **4320**. No two together: seat the other 4 (4! = 24), 5 gaps, ⁵P₃ = 60: 24 × 60 = **1440**.
- **Check 5, round table of six.** Total (6 − 1)! = **120**. A and B together: the block and 4 others are 5 units round the table: (5 − 1)! = 24, × 2! = **48**; probability 48/120 = **0.4**. No two together: seat the other 4 round the table, (4 − 1)! = 6 ways, leaving 4 gaps: ⁴P₂ = 12; 6 × 12 = **72** (= 120 − 48).
- **Check 6, repeated letters.** BANANA: 6 letters with A three times and N twice: 6!/(3! 2!) = 720/12 = **60** (brute force 60). MISSISSIPPI: 11 letters with I ×4, S ×4, P ×2: 11!/(4! 4! 2!) = 39 916 800/1152 = **34 650** (too many letters for the brute force).
- **Check 7, pigeonhole.** 13 balls in 4 boxes: if every box held at most 3, there would be at most 12 balls, so some box holds at least ⌈13/4⌉ = **4**. With 12 balls, ⌈12/4⌉ = **3**.

```acceptance
[
  { "name": "5 people in a row",
    "params": { "mode": "line", "people": 5, "group": 2, "restriction": "none" },
    "run": "static",
    "expect": {
      "count": { "value": 120, "absTol": 1e-9 },
      "bruteCount": { "value": 120, "absTol": 1e-9 },
      "probability": { "value": 1, "absTol": 1e-9 } } },
  { "name": "6 in a row, A and B together",
    "params": { "mode": "line", "people": 6, "group": 2, "restriction": "together" },
    "run": "static",
    "expect": {
      "count": { "value": 240, "absTol": 1e-9 },
      "bruteCount": { "value": 240, "absTol": 1e-9 },
      "total": { "value": 720, "absTol": 1e-9 },
      "probability": { "value": 0.3333333333, "absTol": 1e-9 } } },
  { "name": "6 in a row, A and B apart",
    "params": { "mode": "line", "people": 6, "group": 2, "restriction": "noneAdjacent" },
    "run": "static",
    "expect": { "count": { "value": 480, "absTol": 1e-9 }, "bruteCount": { "value": 480, "absTol": 1e-9 } } },
  { "name": "7 in a row, three together",
    "params": { "mode": "line", "people": 7, "group": 3, "restriction": "together" },
    "run": "static",
    "expect": { "count": { "value": 720, "absTol": 1e-9 }, "bruteCount": { "value": 720, "absTol": 1e-9 } } },
  { "name": "7 in a row, three not all together",
    "params": { "mode": "line", "people": 7, "group": 3, "restriction": "notTogether" },
    "run": "static",
    "expect": { "count": { "value": 4320, "absTol": 1e-9 }, "bruteCount": { "value": 4320, "absTol": 1e-9 } } },
  { "name": "7 in a row, no two of the three together",
    "params": { "mode": "line", "people": 7, "group": 3, "restriction": "noneAdjacent" },
    "run": "static",
    "expect": { "count": { "value": 1440, "absTol": 1e-9 }, "bruteCount": { "value": 1440, "absTol": 1e-9 } } },
  { "name": "round table of 6, A and B together",
    "params": { "mode": "circle", "people": 6, "group": 2, "restriction": "together" },
    "run": "static",
    "expect": {
      "total": { "value": 120, "absTol": 1e-9 },
      "count": { "value": 48, "absTol": 1e-9 },
      "bruteCount": { "value": 48, "absTol": 1e-9 },
      "probability": { "value": 0.4, "absTol": 1e-9 } } },
  { "name": "round table of 6, A and B apart",
    "params": { "mode": "circle", "people": 6, "group": 2, "restriction": "noneAdjacent" },
    "run": "static",
    "expect": { "count": { "value": 72, "absTol": 1e-9 }, "bruteCount": { "value": 72, "absTol": 1e-9 } } },
  { "name": "BANANA",
    "params": { "mode": "word", "word": "BANANA" },
    "run": "static",
    "expect": { "count": { "value": 60, "absTol": 1e-9 }, "bruteCount": { "value": 60, "absTol": 1e-9 } } },
  { "name": "MISSISSIPPI",
    "params": { "mode": "word", "word": "MISSISSIPPI" },
    "run": "static",
    "expect": { "count": { "value": 34650, "absTol": 1e-9 } } },
  { "name": "pigeonhole 13 balls in 4 boxes",
    "params": { "mode": "pigeonhole", "items": 13, "boxes": 4 },
    "run": "static",
    "expect": { "atLeast": { "value": 4, "absTol": 1e-9 } } },
  { "name": "pigeonhole 12 balls in 4 boxes",
    "params": { "mode": "pigeonhole", "items": 12, "boxes": 4 },
    "run": "static",
    "expect": { "atLeast": { "value": 3, "absTol": 1e-9 } } }
]
```
