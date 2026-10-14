# Robot Maze Kinematics Sandbox: Spec v0.2 (Levels 1-3)

Oct 13, 2026 · Firman Nugraha

## Contents

1. [Summary and locked decisions](#1-summary-and-locked-decisions)
2. [Coordinate and grid rules](#2-coordinate-and-grid-rules)
3. [Map design rules](#3-map-design-rules)
4. [Stage flow](#4-stage-flow)
5. [Answer sheets](#5-answer-sheets)
6. [Graph tasks (Level 2 and up)](#6-graph-tasks-level-2-and-up)
7. [Scoring](#7-scoring)
8. [Run log and screens](#8-run-log-and-screens)
9. [Worked examples](#9-worked-examples)
10. [Open decisions](#10-open-decisions)

**Glossary.** *Bilangan bulat* = whole number. *Bentuk akar* = surd (root) form, such as √2900 or 10√29.

## 1. Summary and locked decisions

Students analyse how two robots move through a maze. They choose a route, calculate distance, displacement, speed, velocity and time, and from Level 2 sketch motion graphs. Each stage runs in one of four modes: path only, measurement only, graph sketch only, or combined. Students never program the robot.

| Decision | Locked value |
| --- | --- |
| Student role | Route chooser, analyst and graph sketcher; no coding |
| Units | cm; 1 grid cell = 10 cm |
| Axes | +x right, +y up, origin at Start |
| Level 1 | Axis-aligned legs only; path and measurement modes covering speed, leg velocity, distance and displacement; true x-t and y-t graphs shown read-only after the final run |
| Level 2 | Still axis-aligned; adds total time, average speed and velocity, and graph modes (x-t, y-t, distance-t) |
| Level 3 | Adds diagonal legs; Pythagoras only, no trigonometry |
| Levels 4-5 | Speed zones, then curves (outside this spec) |
| Diagonals | Level 3 only; any Pythagorean triple up to the size cap in the map rules; endpoints on grid points |
| Finish point | Any grid point (graph maps with student-chosen routes use a junction lattice; see map rule 7) |
| Displacement magnitude | Student chooses bilangan bulat or bentuk akar; bentuk akar on a perfect square earns ¾ of the mark (see [Scoring](#7-scoring)) |
| Speeds | 10, 20 or 30 cm/s; hidden in measurement and combined modes, given in graph sketch mode |
| Robots per stage | Two, with different speeds and the same finish; Robot B's route is preset in Level 1, and students choose both routes from Level 2 |
| Attempts | Two runs per map; each score takes its better value |
| Rating | Separate scores for route, prediction and graph |
| Answer matching | Exact; average speed and velocity accepted as fractions or as decimals rounded to 1 decimal |
| Platform | Browser (HTML) first; Unity game packs later, so maps and logs stay as plain data |

## 2. Coordinate and grid rules

Every position is a grid point, so students can write a displacement vector from the start and end points alone.

- The origin (0, 0) is the Start point. +x points right and +y points up.
- 1 grid cell = 10 cm. Map axes are labelled in cm (0, 10, 20, ...).
- A **route** is an ordered list of grid points. A **leg** is the straight stretch between two consecutive points.
- Displacement vector = final point − initial point, written (Δx, Δy) in cm.
- Turns are instantaneous in the model: speed stays constant and velocity changes direction at the point. Tell students this is a simplification.

## 3. Map design rules

These rules are for whoever designs the maps; students never see them. They keep every answer clean enough for exact matching and every graph point on a snap grid.

1. **Grid.** All route points sit on integer cell coordinates (multiples of 10 cm).
2. **Levels 1-2 legs.** Axis-aligned only (up, down, left, right).
3. **Level 3 legs.** Axis-aligned, plus diagonals whose cell legs form any Pythagorean triple, within a recommended size cap of hypotenuse ≤ 17 cells (170 cm) and longest leg ≤ 15 cells (150 cm). That allows these triples, in either orientation:

   | Triple (cells) | Legs (cm) | Hypotenuse (cm) |
   | --- | --- | --- |
   | 3-4-5 | 30, 40 | 50 |
   | 6-8-10 | 60, 80 | 100 |
   | 9-12-15 | 90, 120 | 150 |
   | 5-12-13 | 50, 120 | 130 |
   | 8-15-17 | 80, 150 | 170 |

   The cap keeps the diagonal on a 20 × 20 cell map, and keeps the squares students work with at 15² = 225 or less in cells.
4. **Finish point.** Any grid point, with no quota of perfect-square results (rule 7 adds a lattice for graph maps with student-chosen routes). For a finish offset of (10a, 10b) cm the displacement magnitude is 10√(a² + b²) cm, which is a whole number only when a² + b² is a perfect square. Random offsets rarely give perfect squares, so the bentuk akar penalty will seldom trigger unless some maps are chosen on purpose.
5. **Speeds.** Each robot's speed is 10, 20 or 30 cm/s, and the two robots in a stage differ. Which robot is faster varies by map.
6. **Whole seconds.** Each robot's total route length is divisible by its speed (multiples of 20 cm at 20 cm/s, 30 cm at 30 cm/s). The calibration strip is also divisible by the speed, and always takes 3 s:

   | Speed | Strip length |
   | --- | --- |
   | 10 cm/s | 30 cm |
   | 20 cm/s | 60 cm |
   | 30 cm/s | 90 cm |

7. **Whole-second legs wherever graphs are involved.** Every leg of each robot's route is a multiple of that robot's distance per second (10, 20 or 30 cm), so the graph time axis snaps to 1 s. In path-only and measurement-only maps only the totals in rule 6 must divide. When the student chooses the routes and graphs are involved, Start, Finish and every junction sit on a lattice whose spacing is the least common multiple of the two speeds in cm:

   | Speed pair | Lattice spacing |
   | --- | --- |
   | 10 and 20 cm/s | 20 cm |
   | 10 and 30 cm/s | 30 cm |
   | 20 and 30 cm/s | 60 cm |

8. **Routes.** Each map has at least three valid routes with different distances, and one unique shortest route (no ties).
9. **Preset route for Robot B** (Level 1 and preset modes). Valid, ends at the same finish, not the shortest, and a different distance from Robot A's best route. Vary it between the longest and the second-shortest route across maps, so that "not B's route" is not a cue.
10. **Level 3 decoy diagonals.** In at least one map in three, the tempting diagonal sits on a longer overall route, so students must add up distances rather than assume diagonals win.
11. **Level 3 graph maps.** A diagonal must also take whole seconds for each robot. Pair 10 with 20 cm/s and use 6-8-10, or pair 10 with 30 cm/s and use 9-12-15. The 20 and 30 cm/s pair has no diagonal within the size cap.

## 4. Stage flow

Every stage runs in one of four modes, and each mode uses a subset of the same steps. The Run button stays locked until the student has completed every earlier step in that mode.

| Mode | Available from | Student does | Routes | Speeds | Score |
| --- | --- | --- | --- | --- | --- |
| Path only | Level 1 | Chooses routes, no calculation | Level 1: A chosen, B preset. Level 2 up: both chosen | Hidden | Route |
| Measurement only | Level 1 | Calibrates, then fills in the answer sheet | Both preset | Hidden | Prediction |
| Graph sketch only | Level 2 | Sketches graphs for both robots | Both preset | Given | Graph |
| Combined | Level 1 (Level 2 adds graphs) | All steps in order | Level 1: A chosen, B preset. Level 2 up: both chosen | Hidden | All that apply |

### Steps

1. **Calibrate.** Each robot drives a separate straight strip of known length next to a clock that shows whole seconds at the start and end. Students read the length and the time.
2. **Choose routes.** The student taps grid points to build a route from Start to Finish along open corridors: Robot A's route in Level 1, and both robots' routes from Level 2. A robot without a student route follows a preset route, shown as a dashed line in a different colour.
3. **Predict.** The student fills in the answer sheet for both robots.
4. **Sketch** (Level 2 and up). The student picks up to two graphs from x-t, y-t and distance-t, and places breakpoints for both robots.
5. **Run.** Both robots start together and follow their routes at their hidden speeds. The clock is visible and the log is recorded.
6. **Score.** The result screen marks every answer and shows the scores that apply to the mode. In Level 1 the final result screen also draws the true x-t and y-t graphs read-only, with one ungraded prompt such as "why is x-t flat at the start?".

### Two runs per map

A map allows two runs, and each score takes its better value.

- **After run 1** the result screen shows marks only: each item's mark and the name of the root error, with no true values, no log and no true graphs. The student may correct the sheet, routes or sketches and run again.
- **After the final run** (run 2, or run 1 if the student stops there) the full reveal appears: true values, true graphs over the student's sketches, the side-by-side comparison and the log.

Run 1 still shows the clock, so total times are visible. That is why run 2 is a retry and not an independent attempt.

How the graph picker and the two-graph limit look on screen is left for the UI discussion.

## 5. Answer sheets

The measurement sheet has five items per robot in Level 1 (10 per stage) and eight items per robot from Level 2 (16 per stage). Every answer needs a unit, and vector signs matter.

| # | Item (per robot) | How students get it | Depends on | From |
| --- | --- | --- | --- | --- |
| 1 | Speed (cm/s) | Calibration length / clock time | none | Level 1 |
| 2 | Velocity on a highlighted leg (cm/s, vector) | Speed in the leg's direction, e.g. (0, +20) | 1 | Level 1 |
| 3 | Total distance (cm) | Sum of leg lengths | none | Level 1 |
| 4 | Displacement vector (cm) | Final point − initial point | none | Level 1 |
| 5 | Displacement magnitude (cm) | Pythagoras on item 4; the student picks the form, bilangan bulat or bentuk akar | 4 | Level 1 |
| 6 | Total time (s) | Item 3 / item 1 | 1, 3 | Level 2 |
| 7 | Average speed (cm/s) | Item 3 / item 6 | 3, 6 | Level 2 |
| 8 | Average velocity (cm/s, vector) | Item 4 / item 6 | 4, 6 | Level 2 |

**Level 3 changes.** Item 3 now includes diagonal legs, whose lengths come from Pythagoras on the grid legs. Item 2 stays on axis-aligned legs by default. Asking for velocity on a diagonal leg is optional and uses proportion on the leg's own triple: each velocity component is speed × (leg component / hypotenuse), so leg (30, 40) at 20 cm/s gives (12, 16) cm/s.

**What the sheet should make visible.** Both robots share the same displacement but have different distances, times and average velocities. Average speed equals the robot's constant speed, while the size of the average velocity is smaller unless the route is a straight line.

## 6. Graph tasks (Level 2 and up)

The student picks up to two of these graphs at a time. In graph sketch mode the speeds are given, so the task tests graph skill and not speed measurement.

| Graph | Axes | What students should see |
| --- | --- | --- |
| x-t | x (cm) against time (s) | Slope is the x-velocity; flat while the robot moves only in y; falls when it moves left |
| y-t | y (cm) against time (s) | Slope is the y-velocity; flat while the robot moves only in x; falls when it moves down |
| distance-t | Distance travelled (cm) against time (s) | A straight line at constant speed, slope equal to the speed, never decreasing; its end value is item 3 |

**Sketching.** The student places one breakpoint per route point (start, each corner, end). The position axes snap to 10 cm and the time axis snaps to 1 s, because every leg takes whole seconds. The system joins the points with straight lines.

A graph of displacement magnitude against time is left out because it curves at every turn (√(x² + y²)). The x-t and y-t graphs already are the displacement components from Start.

## 7. Scoring

Each stage gives up to three separate scores, and only the ones that match the mode are shown. A student who picks a good route by eye but calculates badly cannot hide behind the route score.

| Score | Formula |
| --- | --- |
| Route | 100 × shortest available distance / distance of the student's route, rounded to a whole number, for each robot whose route the student chose. The stage's route score is their mean. 100 means the shortest route. At constant speed the shortest route is also the fastest, so distance is enough. |
| Prediction | Points earned / total items × 100, over both robots' answer sheets |
| Graph | Correct breakpoints / total breakpoints × 100, over the graphs the student sketched |

**Best of two:** each score takes the better of its run 1 and run 2 values.

### Marking each item

| Mark | Meaning | Points |
| --- | --- | --- |
| ✓ | Matches the true value | 1 |
| ◐ | Wrong only because an earlier answer was wrong; correctly calculated from the student's own earlier value | 1 |
| ¾ | Correct value in the wrong form: bentuk akar chosen for a perfect square (item 5 only) | 0.75 |
| ✗ | Wrong, and not explained by an earlier wrong answer (the root error) | 0 |

After run 1 the result screen names the root error without its true value (for example, "speed is wrong") and lists the ◐ items it caused. True values appear after the final run. The "Depends on" column in the answer sheet decides which items can be ◐.

### Item 5: bilangan bulat or bentuk akar

The student decides the form. The radicand is Δx² + Δy² in cm².

- **Perfect-square radicand** (2500, 3600, 10000, ...): the correct answer is a whole number (50, 60, 100 cm). Any bentuk akar form of it earns ¾, and the result screen says the number was a perfect square.
- **Radicand that is not a perfect square** (for example 2900): the correct answer is bentuk akar, simplified or not, so √2900 and 10√29 both earn full marks. Choosing bilangan bulat, or typing a decimal, is ✗.
- **Wrong radicand:** ✗, or ◐ if it follows from the student's own wrong displacement vector.

### Matching rules

- Items 1-4 and 6 are whole numbers and must match exactly.
- Average speed and average velocity (items 7-8) are accepted as the exact fraction (60/7) or as a decimal equal to the true value rounded to 1 decimal place (8.6).
- Graph breakpoints must match in both time and value on the snap grid.
- Units and vector signs are required; a missing unit is wrong.

### Anti-guessing

- Run stays locked until every field the mode asks for is filled, a route is submitted where the mode asks for one, and every graph breakpoint is placed.
- Two runs per map: each score takes its better value, and run 1 shows marks only.

## 8. Run log and screens

### Run log

The log has one row per start, corner and end, so students can check each leg against their own working. Each row gives the position and distance travelled at that time, and the velocity that begins there. The end row has zero velocity. The true x-t, y-t and distance-t graphs are drawn straight from these rows.

| Column | Meaning |
| --- | --- |
| `t_s` | Time (s) |
| `robot` | Robot ID (A or B) |
| `x_cm`, `y_cm` | Position (cm) |
| `d_cm` | Distance travelled so far (cm) |
| `vx_cm_s`, `vy_cm_s` | Velocity that begins at this row (cm/s) |
| `leg` | Leg number that begins here, or `end` |

Example log for Robot A on the [Level 3 worked example](#level-3-example):

```csv
t_s,robot,x_cm,y_cm,d_cm,vx_cm_s,vy_cm_s,leg
0,A,0,0,0,0,20,1
2,A,0,40,40,12,16,2
4.5,A,30,80,90,20,0,3
6,A,60,80,120,0,0,end
```

At each corner the speed stays 20 cm/s while the velocity changes, which makes the difference between speed and velocity visible.

### Screens

1. **Map.** Grid with cm axes, Start, Finish and walls. Students build routes by tapping points (Robot A only in Level 1, both robots from Level 2). Any robot without a student route shows a dashed preset route. There is no running total of route length, so students must calculate it.
2. **Calibration.** A straight strip per robot beside the clock.
3. **Answer sheet.** The items for each robot, with units, and the bilangan bulat or bentuk akar choice on item 5.
4. **Graph sketch** (Level 2 and up). Graph picker with at most two graphs on screen, and snap-grid plotting. Layout to be settled in the UI discussion.
5. **Run.** Both robots moving with the clock; no speed readout in measurement and combined modes.
6. **Result.** After run 1: marks per item and the name of the root error. After the final run: true values, true graphs over the student's sketches, side-by-side comparison, the run log, and in Level 1 the read-only x-t and y-t graphs with one ungraded prompt.

## 9. Worked examples

All examples start at (0, 0). The Level 1 and Level 3 maps finish at (60, 80), where the radicand is 60² + 80² = 10000, a perfect square, so the displacement magnitude is 100 cm as a whole number.

### Level 1 example

Calibration: Robot A covers 60 cm in 3 s; Robot B covers 30 cm in 3 s. The shortest available route is 140 cm.

- **Robot A** (student's route, here the shortest): (0, 0) → (0, 80) → (60, 80)
- **Robot B** (preset detour): (0, 0) → (0, −20) → (60, −20) → (60, 80)

| Item | Robot A | Robot B |
| --- | --- | --- |
| 1 Speed | 60 / 3 = 20 cm/s | 30 / 3 = 10 cm/s |
| 2 Velocity on one leg | Leg 1: (0, +20) cm/s | Leg 2: (+10, 0) cm/s |
| 3 Distance | 80 + 60 = 140 cm | 20 + 60 + 100 = 180 cm |
| 4 Displacement vector | (60, 80) cm | (60, 80) cm |
| 5 Displacement magnitude | √(60² + 80²) = 100 cm | 100 cm |

Route score for the 140 cm route: 100. A student who picked the 180 cm route would score 100 × 140 / 180 = 78.

### Item 5 form examples

Every offset is a multiple of 10 cm, so the radicand is always a multiple of 100 and the simplified form is 10√(a² + b²). Accepting √2900 as well as 10√29 spares students that simplification step.

| Finish offset (cm) | Radicand (cm²) | Correct form | Full marks | Penalised |
| --- | --- | --- | --- | --- |
| (0, 70) | 4900 | Bilangan bulat: 70 cm | 70 | √4900 earns ¾ |
| (30, 40) | 2500 | Bilangan bulat: 50 cm | 50 | √2500 earns ¾ |
| (60, 80) | 10000 | Bilangan bulat: 100 cm | 100 | √10000 earns ¾ |
| (20, 50) | 2900 | Bentuk akar | √2900 or 10√29 | 53.9, or 54 as a whole number, is ✗ |
| (40, 50) | 4100 | Bentuk akar | √4100 or 10√41 | A decimal is ✗ |

### Level 2 example (graph sketch)

Same map and routes as the Level 1 example, with speeds given: Robot A at 20 cm/s and Robot B at 10 cm/s. Breakpoints are (time in s, value in cm).

| Graph | Robot A (3 breakpoints) | Robot B (4 breakpoints) |
| --- | --- | --- |
| x-t | (0, 0), (4, 0), (7, 60) | (0, 0), (2, 0), (8, 60), (18, 60) |
| y-t | (0, 0), (4, 80), (7, 80) | (0, 0), (2, −20), (8, −20), (18, 80) |
| distance-t | (0, 0), (4, 80), (7, 140) | (0, 0), (2, 20), (8, 80), (18, 180) |

- Robot A's x-t is flat for 4 s while it only moves up, then rises at 20 cm/s.
- Robot B's y-t dips to −20 cm and then climbs, while its distance-t keeps rising: a detour shows up as a fall in position but never in distance.
- Both robots end at the same x and y values, (60, 80), but at different times (7 s and 18 s), and the distance-t graphs end at different heights (140 cm and 180 cm).
- A student who sketches two graphs places 14 breakpoints, and the graph score counts how many are on the right (time, value).

Level 2 also adds the time and average items (6-8) for the same routes. Fractions are accepted as well as 1-decimal values.

| Item | Robot A | Robot B |
| --- | --- | --- |
| 6 Total time | 140 / 20 = 7 s | 180 / 10 = 18 s |
| 7 Average speed | 140 / 7 = 20 cm/s | 180 / 18 = 10 cm/s |
| 8 Average velocity | (60/7, 80/7) cm/s ≈ (8.6, 11.4) cm/s | (10/3, 40/9) cm/s ≈ (3.3, 4.4) cm/s |

### Level 3 example

Calibration is the same as above. A wall blocks the centre diagonal, so the shortest available route is 120 cm.

- **Robot A** (student's route, here the shortest): (0, 0) → (0, 40) → (30, 80) → (60, 80), with the middle leg a 30-40-50 diagonal
- **Robot B** (preset): (0, 0) → (0, 80) → (60, 80)

| Item | Robot A | Robot B |
| --- | --- | --- |
| 1 Speed | 20 cm/s | 10 cm/s |
| 2 Velocity on one leg | Leg 1: (0, +20) cm/s | Leg 1: (0, +10) cm/s |
| 3 Distance | 40 + √(30² + 40²) + 30 = 40 + 50 + 30 = 120 cm | 80 + 60 = 140 cm |
| 4 Displacement vector | (60, 80) cm | (60, 80) cm |
| 5 Displacement magnitude | 100 cm | 100 cm |
| 6 Total time | 120 / 20 = 6 s | 140 / 10 = 14 s |
| 7 Average speed | 120 / 6 = 20 cm/s | 140 / 14 = 10 cm/s |
| 8 Average velocity | (60/6, 80/6) = (10, 13.3) cm/s | (60/14, 80/14) = (4.3, 5.7) cm/s |

Optional diagonal item for Robot A, leg 2: 20 × (30/50, 40/50) = (12, 16) cm/s. Its speed is √(12² + 16²) = 20 cm/s, the same as on the axis-aligned legs.

## 10. Open decisions

Nothing in Levels 1-3 is blocking now.

**Settled in the latest rounds:** Robot B preset in Level 1 and student-chosen from Level 2; read-only true graphs on the Level 1 result screen; whole-second legs wherever graphs are involved; best of two runs.

**Left for later discussion:** the UI (graph picker, whether each panel plots both robots), the rule for unlocking the next level, and Levels 4-5.

**Minor defaults** (change if you disagree):

- Route score is a percentage, not stars.
- The optional diagonal-velocity item is off.
- No score is needed to unlock the next level.
- Maps are hand-designed, with no student map editor.
- Each graph panel plots both robots, one line each (to confirm in the UI discussion).

**Out of scope for this spec:** Level 4 speed zones and Level 5 curves, acceleration, v-t graphs, velocity components on arbitrary angles, physical slopes and gravity, and any robot programming or line-following logic.
