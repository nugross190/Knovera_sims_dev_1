# Robot Maze Kinematics Sandbox: Spec v0.3 (Levels 1-3)

Oct 14, 2026 · Firman Nugraha

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
11. [Changes from v0.2](#11-changes-from-v02)

**Glossary.** *Bilangan bulat* = whole number. *Bentuk akar* = surd (root) form, such as √2900 or 10√29.

## 1. Summary and locked decisions

Students analyse how two robots move through a maze. They choose a route, calculate distance, displacement, speed, velocity and time, and from Level 2 sketch motion graphs. Each stage runs in one of four modes: path only, measurement only, graph sketch only, or combined. Students never program the robot.

| Decision | Locked value |
| --- | --- |
| Student role | Route chooser, analyst and graph sketcher; no coding |
| Units | cm; 1 grid cell = 10 cm |
| Axes | +x right, +y up, origin at Start |
| Level 1 | Axis-aligned legs only; path-only and measurement-only modes (no combined mode) covering speed, leg velocity, distance and displacement; true x-t and y-t graphs shown read-only after the final run |
| Level 2 | Still axis-aligned; adds total time, average speed and velocity, graph modes (x-t, y-t, distance-t) and combined mode |
| Level 3 | Adds diagonal legs; Pythagoras only, no trigonometry |
| Levels 4-5 | Speed zones, then curves (outside this spec) |
| Diagonals | Level 3 only; 3-4-5 family only (3-4-5, 6-8-10, 9-12-15 cells); endpoints on grid points |
| Finish point | Any grid point (graph maps with student-chosen routes use a junction lattice; see map rule 7) |
| Displacement magnitude | Student chooses bilangan bulat or bentuk akar; bentuk akar on a perfect square earns ¾ of the mark (see [Scoring](#7-scoring)) |
| Speeds | 10, 20 or 30 cm/s; hidden in measurement and combined modes, given in graph sketch mode |
| Robots per stage | Two, with different speeds, the same finish and always different routes; Robot B's route is preset in Level 1, and students choose both routes from Level 2 |
| Attempts | Two runs per map; each score takes its better value |
| Rating | Separate scores for route, prediction and graph |
| Answer matching | Exact; average speed and velocity accepted as fractions or as decimals rounded to 1 decimal; one form per vector in Levels 1-2, mixed forms allowed from Level 3; decimal comma or point |
| Platform | Browser (HTML) first; Unity game packs later, so maps and logs stay as plain data |

## 2. Coordinate and grid rules

Every position is a grid point, so students can write a displacement vector from the start and end points alone.

- The origin (0, 0) is the Start point. +x points right and +y points up.
- 1 grid cell = 10 cm. Map axes are labelled in cm (0, 10, 20, ...).
- A **route** is an ordered list of grid points. A **leg** is the straight stretch between two consecutive points. A route that passes straight through a junction does not turn there, so that junction is not a route point.
- Displacement vector = final point − initial point, written (Δx, Δy) in cm.
- Turns are instantaneous in the model: speed stays constant and velocity changes direction at the point. Tell students this is a simplification.

## 3. Map design rules

These rules are for whoever designs the maps; students never see them. They keep every answer clean enough for exact matching and every graph point on a snap grid. The map validator (`npm run validate`) checks them automatically: rules 1-12 on each map, and rules 13-14 across each level as warnings.

1. **Grid.** All route points sit on integer cell coordinates (multiples of 10 cm).
2. **Levels 1-2 legs.** Axis-aligned only (up, down, left, right).
3. **Level 3 legs.** Axis-aligned, plus diagonals from the 3-4-5 family only, in either orientation:

   | Triple (cells) | Legs (cm) | Hypotenuse (cm) | Velocity components at 10 / 20 / 30 cm/s |
   | --- | --- | --- | --- |
   | 3-4-5 | 30, 40 | 50 | (6, 8) / (12, 16) / (18, 24) |
   | 6-8-10 | 60, 80 | 100 | same as above |
   | 9-12-15 | 90, 120 | 150 | same as above |

   Every diagonal has the direction ratio 3 : 4 : 5, so its velocity components are always whole numbers (speed × 3/5 and speed × 4/5). The cap keeps the diagonal on a 20 × 20 cell map, and the squares students work with at 15² = 225 or less in cells.
4. **Finish point.** Any grid point, with no quota of perfect-square results (rule 7 adds a lattice for graph maps with student-chosen routes). For a finish offset of (10a, 10b) cm the displacement magnitude is 10√(a² + b²) cm, which is a whole number only when a² + b² is a perfect square. Random offsets rarely give perfect squares, so the bentuk akar penalty will seldom trigger unless some maps are chosen on purpose.
5. **Speeds.** Each robot's speed is 10, 20 or 30 cm/s, and the two robots in a stage differ. Which robot is faster varies by map.
6. **Whole seconds.** Each robot's total route length is divisible by its speed (multiples of 20 cm at 20 cm/s, 30 cm at 30 cm/s). The calibration strip takes a whole number of seconds from 2 to 4, and the duration varies across maps so students divide rather than learn "length ÷ 3":

   | Speed | Strip length at 2 s / 3 s / 4 s |
   | --- | --- |
   | 10 cm/s | 20 / 30 / 40 cm |
   | 20 cm/s | 40 / 60 / 80 cm |
   | 30 cm/s | 60 / 90 / 120 cm |

7. **Whole-second legs wherever graphs are involved.** Every leg of each robot's route is a multiple of that robot's distance per second (10, 20 or 30 cm), so the graph time axis snaps to 1 s. In path-only and measurement-only maps only the totals in rule 6 must divide. When the student chooses the routes and graphs are involved, Start, Finish and every junction sit on a lattice whose spacing is the least common multiple of the two speeds in cm:

   | Speed pair | Lattice spacing |
   | --- | --- |
   | 10 and 20 cm/s | 20 cm |
   | 10 and 30 cm/s | 30 cm |
   | 20 and 30 cm/s | 60 cm |

8. **Routes.** Each map has at least three valid routes with different distances, and one unique shortest route (no ties). A valid route never visits the same point twice.
9. **Different routes.** The two robots in a stage never take the same route. The Run button stays locked while two student-chosen routes are identical, and preset routes always differ.
10. **Preset Robot B in Level 1 path mode.** Valid, ends at the same finish, not the shortest, and a different distance from Robot A's best route. Vary it between the longest and the second-shortest route across maps, so that "not B's route" is not a cue.
11. **Preset routes in measurement-only and graph-sketch-only modes.** Any valid routes, including the shortest, as long as they differ (rule 9). These modes have no route score, so a preset shortest route gives nothing away.
12. **Level 3 graph maps.** A diagonal must also take whole seconds for each robot. Pair 10 with 20 cm/s and use 6-8-10, or pair 10 with 30 cm/s and use 9-12-15. The 20 and 30 cm/s pair has no diagonal within the size cap.
13. **Level 3 decoy diagonals.** In at least one map in three, the tempting diagonal sits on a longer overall route, so students must add up distances rather than assume diagonals win.
14. **Negative directions.** Sign errors are the most common velocity mistake, so in at least one map in three per level the highlighted leg (item 2) points left or down. In Level 2 graph maps, at least one map in two has a route with a leftward or downward leg, so a position graph falls while distance-t keeps rising.

## 4. Stage flow

Every stage runs in one of four modes, and each mode uses a subset of the same steps. The Run button stays locked until the student has completed every earlier step in that mode.

| Mode | Available from | Student does | Routes | Speeds | Score |
| --- | --- | --- | --- | --- | --- |
| Path only | Level 1 | Chooses routes, no calculation | Level 1: A chosen, B preset. Level 2 up: both chosen | Hidden | Route |
| Measurement only | Level 1 | Calibrates, then fills in the answer sheet | Both preset | Hidden | Prediction |
| Graph sketch only | Level 2 | Sketches graphs for both robots | Both preset | Given | Graph |
| Combined | Level 2 | All steps in order | Both chosen | Hidden | All three |

### Steps

1. **Calibrate.** Each robot drives a separate straight strip of known length next to a clock that shows whole seconds at the start and end. Students read the length and the time.
2. **Choose routes.** The student taps grid points to build a route from Start to Finish along open corridors: Robot A's route in Level 1, and both robots' routes from Level 2. A robot without a student route follows a preset route, shown as a dashed line in a different colour. The two routes must differ.
3. **Predict.** The student fills in the answer sheet for both robots.
4. **Sketch** (Level 2 and up). The student picks up to two graphs from x-t, y-t and distance-t, and places breakpoints for both robots.
5. **Run.** Both robots start together and follow their routes at their hidden speeds. The clock is visible and the log is recorded.
6. **Score.** The result screen marks every answer and shows the scores that apply to the mode. After the final run every stage ends with one ungraded "explain" prompt tied to the map's main contrast, such as "both robots ended at (60, 80) cm; why did they take different times?". In Level 1 the final result screen also draws the true x-t and y-t graphs read-only, and the prompt refers to them, such as "why is x-t flat at the start?".

### Two runs per map

A map allows two runs, and each score takes its better value.

- **After run 1** the result screen shows marks only: each item's mark and the name of the root error, with no true values, no log and no true graphs. The student may correct the sheet, routes or sketches and run again.
- **After the final run** (run 2, or run 1 if the student stops there) the full reveal appears: true values, true graphs over the student's sketches, the side-by-side comparison, the log and the explain prompt.

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

**Input format.**

- A vector is entered as two signed component boxes, x and y, so students never have to type brackets or commas.
- Each item has a unit dropdown that starts blank and offers cm, cm/s, s and cm². A blank or wrong unit makes the item ✗.
- Item 5 offers a choice between bilangan bulat (one box) and bentuk akar (a coefficient box and a radicand box, k√r, where k may be left empty for 1).

**Highlighted leg (item 2).** On a preset route the map names the leg. On a student-chosen route the system highlights the first axis-aligned leg that points left or down, or the first axis-aligned leg if none does, so negative velocities come up whenever the route allows. A Level 3 route made only of diagonals (a single straight line) highlights its diagonal, solved by proportion.

**Level 3 changes.** Item 3 now includes diagonal legs, whose lengths come from Pythagoras on the grid legs. Item 2 stays on axis-aligned legs by default. Asking for velocity on a diagonal leg is optional and uses proportion on the leg's own triple: each velocity component is speed × (leg component / hypotenuse), so leg (30, 40) at 20 cm/s gives (12, 16) cm/s. With the 3-4-5 family only, the result is always a whole number.

**What the sheet should make visible.** Both robots share the same displacement but have different distances, times and average velocities. Average speed equals the robot's constant speed, while the size of the average velocity is smaller unless the route is a straight line.

## 6. Graph tasks (Level 2 and up)

The student picks up to two of these graphs at a time. In graph sketch mode the speeds are given, so the task tests graph skill and not speed measurement.

| Graph | Axes | What students should see |
| --- | --- | --- |
| x-t | x (cm) against time (s) | Slope is the x-velocity; flat while the robot moves only in y; falls when it moves left |
| y-t | y (cm) against time (s) | Slope is the y-velocity; flat while the robot moves only in x; falls when it moves down |
| distance-t | Distance travelled (cm) against time (s) | A straight line at constant speed, slope equal to the speed, never decreasing; its end value is item 3 |

**Sketching.** The student places one breakpoint per route point (start, each corner, end). The position axes snap to 10 cm and the time axis snaps to 1 s, because every leg takes whole seconds. The system joins the points with straight lines. Each panel plots both robots, one line each.

A graph of displacement magnitude against time is left out because it curves at every turn (√(x² + y²)). The x-t and y-t graphs already are the displacement components from Start.

## 7. Scoring

Each stage gives up to three separate scores, and only the ones that match the mode are shown. A student who picks a good route by eye but calculates badly cannot hide behind the route score.

| Score | Formula |
| --- | --- |
| Route, Level 1 | 100 × shortest available distance / distance of Robot A's route, rounded to a whole number |
| Route, Level 2 up | 100 × (shortest + second-shortest available distance) / (distance of A's route + distance of B's route), rounded to a whole number. The routes must differ, so the best pair is the two shortest routes in either order. |
| Prediction | Points earned / total items × 100, over both robots' answer sheets |
| Graph | Points earned / total breakpoints × 100, over the graphs the student sketched |

100 means the best possible routes. At constant speed the shortest route is also the fastest, so distance is enough.

**Best of two:** each score takes the better of its run 1 and run 2 values.

### Marking each item

| Mark | Meaning | Points |
| --- | --- | --- |
| ✓ | Matches the true value | 1 |
| ◐ | Wrong only because an earlier answer was wrong; correctly calculated from the student's own earlier value | 1 |
| ¾ | Correct value in the wrong form: bentuk akar chosen for a perfect square (item 5 only) | 0.75 |
| ✗ | Wrong, and not explained by an earlier wrong answer (the root error) | 0 |

After run 1 the result screen names the root error without its true value (for example, "speed is wrong") and lists the ◐ items it caused. True values appear after the final run. The "Depends on" column in the answer sheet decides which items can be ◐.

### Graph breakpoints and ◐

A breakpoint scores 1 when its time and value both match. In combined mode the speeds are hidden, so a wrong speed (item 1) would otherwise shift every breakpoint after the start. A breakpoint whose value is right and whose time matches the student's own speed therefore counts as ◐: its time is the distance travelled to that point ÷ the student's item 1 speed, rounded to the nearest whole second (halves round up). Values never earn ◐, because they do not depend on speed. In graph sketch mode the speeds are given, so there is no ◐.

### Item 5: bilangan bulat or bentuk akar

The student decides the form. The radicand is Δx² + Δy² in cm².

- **Perfect-square radicand** (2500, 3600, 10000, ...): the correct answer is a whole number (50, 60, 100 cm). Any bentuk akar form of it earns ¾, and the result screen says the number was a perfect square.
- **Radicand that is not a perfect square** (for example 2900): the correct answer is bentuk akar, simplified or not, so √2900 and 10√29 both earn full marks. Choosing bilangan bulat, or typing a decimal, is ✗.
- **Wrong radicand:** ✗, or ◐ if it follows from the student's own wrong displacement vector.

### Matching rules

- Items 1-4 and 6 are whole numbers and must match exactly.
- Average speed and average velocity (items 7-8) are accepted as the exact fraction (60/7) or as a decimal equal to the true value rounded to 1 decimal place (8.6).
- A decimal may use a comma or a point (8,6 or 8.6).
- **One form per vector in Levels 1-2.** Both components of item 8 must use the same form: (60/7, 80/7) or (8.6, 11.4), but not (60/7, 11.4). A whole-number component, such as the 10 in (10, 13.3), fits either form. From Level 3 mixed forms are accepted.
- Graph breakpoints must match in both time and value on the snap grid.
- Units and vector signs are required; a missing unit is wrong.

### Root error labels

When the pattern of a wrong answer shows a known misconception, the result screen names it instead of the plain "item is wrong". The system checks these in order and uses the first that fits.

| Pattern in the student's answer | Label shown |
| --- | --- |
| Unit blank or wrong | "Unit missing or wrong" |
| Item 2 or item 4 has the right size but a wrong sign | "Check the direction sign" |
| Item 3 equals the true displacement magnitude, or item 5 equals the true distance | "Distance and displacement mixed up" |
| Item 4 equals the sum of the x legs and the sum of the y legs without signs | "Added path lengths instead of final − initial" |
| Item 5 typed as a decimal or whole number when the radicand is not a perfect square | "Not a perfect square: use bentuk akar" |
| Item 6 equals item 3 × item 1 | "Multiplied instead of divided" |
| Item 8's size equals the robot's speed on a route that is not straight | "Average velocity is not the speed" |
| Item 8 mixes a fraction with a decimal (Levels 1-2) | "Use one form for both components" |
| Anything else | "<item name> is wrong" |

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
3. **Answer sheet.** The items for each robot, with component boxes for vectors, a unit dropdown on every item, and the bilangan bulat or bentuk akar choice on item 5.
4. **Graph sketch** (Level 2 and up). Graph picker with at most two graphs on screen, and snap-grid plotting. Layout to be settled in the UI discussion.
5. **Run.** Both robots moving with the clock; no speed readout in measurement and combined modes.
6. **Result.** After run 1: marks per item and the name of the root error. After the final run: true values, true graphs over the student's sketches, side-by-side comparison, the run log, the explain prompt, and in Level 1 the read-only x-t and y-t graphs.

## 9. Worked examples

All examples start at (0, 0). The Level 1 and Level 3 maps finish at (60, 80), where the radicand is 60² + 80² = 10000, a perfect square, so the displacement magnitude is 100 cm as a whole number.

### Level 1 example

Calibration: Robot A covers 60 cm in 3 s; Robot B covers 30 cm in 3 s. The shortest available route is 140 cm.

- **Robot A** (the student's route in path mode, preset in measurement mode; here the shortest): (0, 0) → (0, 80) → (60, 80)
- **Robot B** (preset detour): (0, 0) → (0, −20) → (60, −20) → (60, 80)

| Item | Robot A | Robot B |
| --- | --- | --- |
| 1 Speed | 60 / 3 = 20 cm/s | 30 / 3 = 10 cm/s |
| 2 Velocity on one leg | Leg 1: (0, +20) cm/s | Leg 2: (+10, 0) cm/s |
| 3 Distance | 80 + 60 = 140 cm | 20 + 60 + 100 = 180 cm |
| 4 Displacement vector | (60, 80) cm | (60, 80) cm |
| 5 Displacement magnitude | √(60² + 80²) = 100 cm | 100 cm |

Route score in path mode for the 140 cm route: 100. A student who picked the 180 cm route would score 100 × 140 / 180 = 78.

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

Level 2 also adds the time and average items (6-8) for the same routes. Fractions are accepted as well as 1-decimal values, but not both in one vector.

| Item | Robot A | Robot B |
| --- | --- | --- |
| 6 Total time | 140 / 20 = 7 s | 180 / 10 = 18 s |
| 7 Average speed | 140 / 7 = 20 cm/s | 180 / 18 = 10 cm/s |
| 8 Average velocity | (60/7, 80/7) cm/s ≈ (8.6, 11.4) cm/s | (10/3, 40/9) cm/s ≈ (3.3, 4.4) cm/s |

In Level 2, (60/7, 11.4) for Robot A's item 8 is ✗ ("Use one form for both components").

**Graph ◐ in combined mode.** Suppose the same routes run in combined mode and the student reads Robot A's speed as 10 cm/s instead of 20. Item 1 is ✗. If they then sketch A's x-t as (0, 0), (8, 0), (14, 60), all three breakpoints match their own speed (80 / 10 = 8 s, 140 / 10 = 14 s), so they count as ◐ and the graph task does not punish the calibration error twice.

**Route score in combined or Level 2 path mode.** If the map's two shortest routes are 140 cm and 180 cm, a student who sends A along 140 cm and B along 180 cm scores 100 × (140 + 180) / (140 + 180) = 100, whichever robot takes which route.

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

From Level 3 mixed forms are accepted, so (10, 40/3) and (30/7, 5.7) are also full marks.

Optional diagonal item for Robot A, leg 2: 20 × (30/50, 40/50) = (12, 16) cm/s. Its speed is √(12² + 16²) = 20 cm/s, the same as on the axis-aligned legs.

## 10. Open decisions

Nothing in Levels 1-3 is blocking now.

**Settled in v0.3:** graph ◐ follows the student's own speed; the two robots always take different routes; preset routes in measurement and graph modes can be any valid route; diagonals use the 3-4-5 family only; Level 1 has path-only and measurement-only modes; one form per vector in Levels 1-2, mixed from Level 3.

**Left for later discussion:**

- The UI (graph picker layout).
- The rule for unlocking the next level.
- UI language: the prototype is in English with the Indonesian terms for item 5; a full Bahasa Indonesia version needs a decision.
- A possible later task for combined mode: with the speeds known from calibration, assign the two routes so both robots finish as early as possible (the slower robot should take the shorter route). It is good t = d / v reasoning, but it changes the route score, so it is not in v0.3.
- Levels 4-5.

**Minor defaults** (change if you disagree):

- Route score is a percentage, not stars.
- The optional diagonal-velocity item is off.
- No score is needed to unlock the next level.
- Maps are hand-designed, with no student map editor.

**Out of scope for this spec:** Level 4 speed zones and Level 5 curves, acceleration, v-t graphs, velocity components on arbitrary angles, physical slopes and gravity, and any robot programming or line-following logic.

## 11. Changes from v0.2

**Decided by Firman:**

- Graph breakpoints earn ◐ when they follow the student's own wrong speed ([Graph breakpoints and ◐](#graph-breakpoints-and-)).
- The two robots always take different routes (map rule 9). Because of this, the Level 2 route score uses the two shortest routes (Scoring).
- Preset routes in measurement-only and graph-sketch-only modes can be any valid route (map rule 11).
- Diagonals use the 3-4-5 family only, so diagonal velocity components are always whole numbers (map rule 3).
- Level 1 offers path-only and measurement-only modes; combined mode starts in Level 2.
- Item 8 must use one form for both components in Levels 1-2; mixed forms are accepted from Level 3.

**Recommended by Claude as a fellow physics teacher (veto any of these):**

- Calibration strips take 2-4 s rather than always 3 s, so students divide instead of learning a pattern (map rule 6).
- Highlighted legs and Level 2 graph routes regularly point left or down, to practise signs (map rule 14). On student-chosen routes the system picks a negative leg when there is one (Answer sheets).
- Vectors are entered as two signed component boxes and units from a dropdown, so the sheet tests physics and not typing (Answer sheets).
- Decimal commas are accepted, since Indonesian students write 8,6 (Matching rules).
- An ungraded explain prompt ends every stage, not just Level 1, to close the predict-observe-explain cycle (Steps).
- Root errors are named after the misconception when the answer pattern shows one, for example "distance and displacement mixed up" (Root error labels).
