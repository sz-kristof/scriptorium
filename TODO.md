# Scriptorium – plan

Done (step 1, 2026-09-17): readable Pirata One text, funnier page texts, margin drolleries (snail, goat, monk, rabbit) that appear with the illumination, gold and black chosen by what the nib touches (initial can be painted at any time), pages turned by hand (drag or click the bottom corner of a finished page; drag the left page to look back), the goose chronicle texts, 98% + every letter blob at least 90% to finish, letter counters count as spills like any gap, 2 px tolerance, 0.7% spill budget, mouse-wheel zoom toward the cursor, each letter flashes and settles into solid paint when it is inked, page 1 has a miniature (public/pictures/page1.png) that takes colour with a slow staged illumination (initial, border, then the picture painted in with a wash-then-colour sweep), four pages, quill inking with per-pixel coverage, ink that spreads to the letter's edges around the nib (one pass per stroke fills it), spill budget with the leaf torn out, gold initial, illumination bloom, page turn, book closing, end card.

Dev panel: press ` (backquote) or F2: finish layer / finish page / skip wait / reset page / ruin / jump to page 1-4.

## Next
- [ ] Page texture is soft when zoomed right in (1024 px wide); consider 2048 for the page canvas.
- [ ] Pages 5 to 10 of the chronicle are missing (the user sent 1-4 and 11-30); slot them in before "A plague of frogs".
- [x] Earthquake: once per page from page 2, 10-40 s in; camera shake with jolts, dust, props rattle (scene.js `quake`, main.js `tickTrouble`); dev button.
- [ ] More obstacles, one per page at first: a fly lands on the line you are writing, the candle gutters and the page goes dark, a draught tries to turn the page, ink runs dry so you must dip in the inkwell, a sneeze.
- [ ] Pen knife: scrape a small mistake off the parchment (limited uses, leaves a thin patch).
- [ ] More pages (X pages), a table of contents / progress stack of finished leaves.
- [ ] Sound: nib scratch, page rustle, candle, a bell when a page is done.
- [ ] Score per page: time, spills, neatness.
- [ ] Rubrics: red words inside the text as a third ink.
- [ ] Miniatures for pages 2 to 4 (same ChatGPT prompt recipe: flat colours, thick outlines, transparent sky, 1536x1024).
- [ ] Optional: paintable miniatures (colour regions as layers, quill takes the region's colour).
