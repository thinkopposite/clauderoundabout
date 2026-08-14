# Roundabout node calculator

An inverted-bowl sightline and capacity study for treating urban roundabouts as event venues.
Enter an inscribed circle diameter and the tool returns ring circumference, island geometry,
seated and standing capacity, a row-by-row rake schedule holding a constant C-value, and a
program-fit check against standard pitch and circuit dimensions.

Built for the *Break the Bowl* competition entry.

## Run it

### On GitHub Pages, no build step

1. Push `index.html` and `app.jsx` to the repository root.
2. Settings → Pages → Source: **Deploy from a branch**, branch `main`, folder `/ (root)`.
3. Open `https://<user>.github.io/<repo>/`.

React, React DOM and Babel load from a CDN, and `app.jsx` is compiled in the browser. Nothing
to install and no build pipeline to maintain.

Note that this only works over HTTP. Opening `index.html` by double-clicking it will fail,
because the browser blocks the `file://` fetch of `app.jsx`. To preview locally:

```
python3 -m http.server 8000
```

then visit `http://localhost:8000`.

### As a Vite project

In-browser Babel compilation adds roughly a second to first paint and ships a compiler the
visitor does not need. If the tool becomes something you demo often, move to a build:

```
npm create vite@latest roundabout -- --template react
```

Then:

- copy `app.jsx` into `src/App.jsx`
- restore `import React, { useState, useMemo } from "react";` at the top
- change `function RoundaboutNodeCalculator()` to `export default function App()`
- delete the `ReactDOM.createRoot` block at the bottom — Vite's `src/main.jsx` handles it
- move the Google Fonts `<link>` tags into `index.html`
- set `base: "/<repo>/"` in `vite.config.js` so Pages resolves assets correctly

Deploy with the official `actions/deploy-pages` workflow, or `npm run build` and publish `dist`.

## Method

C-value is solved row by row rather than from a single closed-form rake:

```
C = h(n)·(D − T)/D − h(n−1)
```

where `h` is eye height above the point of focus, `D` is the horizontal distance from the row's
eye to the focus, and `T` is row depth. The tool inverts this to find the riser that holds the
target C, then reports where the required riser exceeds 0.55 m and stops being a buildable step.

Because the front row in an inverted bowl sits almost directly above the action, `D` starts small
and the rake steepens quickly. That is a genuine property of the typology, not an artefact.

## Assumptions worth checking before publishing numbers

- Seat count applies a 0.85 factor for aisles and vomitories.
- Standing density is 0.40 m²/person, inside the common 0.3–0.5 m²/person band. Local code governs.
- Roadway width, apron and setback are user inputs, not derived from any national geometric standard.
- Pitch dimensions are nominal playing areas plus stated runoff, not full competition envelopes.

## Licence

Add one before making the repository public. MIT is the usual choice for a tool like this.
