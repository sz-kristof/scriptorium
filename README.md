# Scriptorium

Copy an illuminated manuscript by hand. Run the quill along the letters and the ink fills them; ink outside the letters stains the page, and too many stains get the leaf torn out. Finish a page and the illuminator's work blooms over it. Then trouble comes: earthquakes, and more to follow.

Three.js, no engine. Text in Pirata One, initials in Uncial Antiqua, HUD in IM Fell English.

## Run it

```bash
npm install
npm run dev
```

Then open the printed localhost address. `npm run build` writes a static site to `dist/`; pushes to `main` publish it to GitHub Pages.

## Playing

- Hold the left mouse button to write. On the big initial the quill turns to gold by itself.
- Scroll to zoom in on the spot under the cursor.
- Take a finished page by its bottom corner to turn it; drag the left page to look back.
- Press **D** (or the small "dev" tag) for the dev panel: finish a layer or page, skip a wait, reset or ruin the page, shake the earth, jump to any page.

## Where things are

- `src/pages.js`: the chronicle, one line per page, with the margin doodle and optional miniature (`public/pictures`).
- `src/page.js`: text layout, letter masks, the guide, the illumination and its reveal timeline.
- `src/paint.js`: the nib, the ink spread inside letters, spill counting.
- `src/book.js`: the codex and the turning leaf. `src/scene.js`: desk, candle, quill, camera, earthquake.
- `src/constants.js`: the knobs (tolerance, spill budget, how much of a letter counts as done).
