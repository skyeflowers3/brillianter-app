---
name: vector-interactions
description: >-
  UI conventions for building interactive vector lessons in this app (draggable
  SVG vectors, scaling, subtraction, head-to-tail addition, snapping, labels).
  Use when creating or editing any vector lesson, skill-check, or SVG coordinate-plane
  interaction, or when the user mentions vectors, dragging, scaling, head-to-tail,
  snapping, or vector labels.
---

# Vector Interaction Conventions

UI conventions for interactive vector lessons. Follow these so every lesson feels consistent. Reuse the existing primitives in `src/components/svg/` and `src/lib/` rather than reinventing them.

## Drag vector heads to scale

Scaling is done by dragging the **head (tip)** of a vector, never with sliders or floating endpoint dots. The tail stays fixed; the head moves along (or through) the vector's direction.

- Render with `Vector` (`src/components/svg/Vector.tsx`) and `draggable`, wiring pointer handlers from `useSvgPointer` (`src/hooks/useSvgPointer.ts`).
- Convert the dragged point to a scalar with `scalarFromPoint`, then `snapScalar` (`src/lib/scalarMultiply.ts`). Negative scalars are allowed — the head passes through the origin to flip direction.
- `Vector` already renders a visible `vector__handle` plus a larger invisible `vector__hit-target` so the head is easy to grab. Don't add separate drag dots.

## Reverse button for subtraction

For `A − B`, give the learner a **Reverse** button that flips `B` into `−B` (see `VectorSubtractQuestion.tsx`). Subtraction = reverse, then head-to-tail add.

- Show `B` as a static dashed arrow with a "Reverse B" button before reversal; after reversal label it `−B` and enable the connect/draw steps.
- Don't make the learner type a negative scalar to subtract — the button is the interaction.

## Head-to-tail addition

Combine vectors by connecting them **head-to-tail**, then drawing the resulting vector from the original tail to the final head.

- Pattern: scale the first vector → drag the second vector's tail onto the first vector's head → draw the result. See `HeadToTailFullQuestion.tsx` and `ConstructComboQuestion.tsx`.
- The result vector is its own draggable `Vector` in `--lesson-vector-sum` color, drawn from the origin.

## Lock vector after scaling (sequential gating)

Steps unlock automatically as each is completed — there is **no explicit "Lock" button**. Once a vector is scaled/placed correctly, treat it as locked and move focus to the next step, guided by a single status line.

- Enforce the order with derived booleans (e.g. `scaledAOk` → `connectedOk` → `scaledBOk` → `drawnOk`) that enable the next handle. See gating in `ConstructComboQuestion.tsx` / `validation.ts`.
- Gated (guided Q1–Q2) requires each step to be *correct* before unlocking the next; ungated (Q3+) gates by *action* (e.g. connected) but lets the learner submit a typed answer freely.

## Snap interactions

Snap dragged values to clean targets so interactions land precisely.

- Scalars: `snapScalar` (respects the question's `coefficient` `min`/`max`/`step`).
- Positions/components: snap to integer grid points; compare with `equalsWithTolerance` (`src/lib/vectorMath.ts`) using the question's `tolerance`.

## Dynamic labels

Labels reflect the current state, not a fixed string.

- A scaled vector reads `A`, `2A`, `−B`, `3B`, etc. — derive it (e.g. `scaledLabel(scale, 'A')`), don't hardcode.
- Pass the label via `Vector`'s `label` prop; hide it for zero-length vectors (pass `undefined`).

## Avoid overlapping labels

All labels go through the shared layout system so they never sit on the axes, grid numbers, vectors, other labels, or endpoints.

- `Vector` registers its label automatically via `useVectorLabel` (`src/components/svg/vectorLabelRegistry.ts`); the layout is solved in `VectorLabels.tsx`.
- For a floating coordinate/point label (e.g. a target point), use `PointLabel` (`src/components/svg/PointLabel.tsx`) so it participates in collision avoidance. Don't draw bare `<text>` labels inside the plane.
- Avoid manual `labelOffset` nudges — they bypass collision avoidance. Only use one as a last resort when the auto-layout genuinely can't resolve a spot.

## Keep SVG uncluttered

Show only what the current step needs.

- Always render inside `CoordinatePlane` (`src/components/svg/CoordinatePlane.tsx`); use its `min`/`max` to size the plane to the problem.
- Reveal elements progressively: hide the result vector until the path is connected; hide a target point in construct mode; show static/dashed guides only until the relevant step begins.
- Overlay/decoration elements (combo dots, span lines) must set `pointerEvents="none"` so they never steal drags from real handles.
- Prefer the equation/answer row below the plane for typed input rather than crowding the canvas with text.
