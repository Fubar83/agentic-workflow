# My agentic workflow

Slides and speaker notes for an internal talk, plus the agent setup it
describes.

```
index.html      the slides, one <section class="slide"> each
NOTES.md        speaker notes, one section per slide, then an appendix
css/deck.css    theme and components
js/deck.js      navigation
js/pong.js      FSP playing pong on the closing slide
js/flow.js      draws the Mermaid flowchart on slide 8
agentic-setup/  the skills and agents the talk describes (see its README)
```

No build step. Two Google Fonts and Mermaid, which draws the flowchart on
slide 8, load from CDNs. Offline, the fonts fall back and slide 8 shows the
loop as one line of text.

## Presenting

Open `index.html` in a browser and press <kbd>F</kbd> for fullscreen. Keep
`NOTES.md` open on a second screen; its sections match the slide counter.

| Key | Action |
| --- | --- |
| <kbd>←</kbd> <kbd>→</kbd> | Previous / next slide |
| <kbd>Space</kbd> | Next slide |
| <kbd>Home</kbd> <kbd>End</kbd> | First / last slide |
| <kbd>O</kbd> | Overview; click a slide to open it |
| <kbd>F</kbd> | Fullscreen |
| <kbd>T</kbd> | Light / dark theme |
| <kbd>?</kbd> | Shortcut list |

The URL holds the slide number (`#7`), so a reload keeps your place. Swipe
works on touch screens.

To export a PDF, print to PDF in landscape with background graphics enabled.
Print styles place one slide per page.

## Editing slides

Each `<section class="slide">` is one slide. Adding, removing, or reordering
sections updates the counter and navigation automatically. If you change the
order, update the section numbers in `NOTES.md` to match.

Children of an element with `data-anim` fade in one after another when the
slide opens.

```html
<section class="slide">
  <header class="slide__head">
    <span class="eyebrow">Chapter · topic</span>
    <h2>Headline</h2>
  </header>
  <ul class="ticks" data-anim>
    <li>Short point</li>
  </ul>
</section>
```

Keep slide text short. Detail belongs in `NOTES.md`.

The flowchart on slide 8 is Mermaid. Its source is the
`<script type="text/x-mermaid">` on that slide in `index.html`, and
[mermaid.live](https://mermaid.live) previews it. Its colours come from
`css/deck.css`, so it follows the theme.

## Components

| Class | Use |
| --- | --- |
| `slide--title` | Opening and closing slides |
| `slide--section` | Chapter divider; add `.ghost` for the outlined numeral |
| `slide--split` | Text and a visual side by side; put the visual first to mirror it |
| `.steps`, `.steps--bare` | Numbered list, with or without descriptions |
| `.ticks` | Short list with square markers |
| `.bullets` | Icon, heading, and one line |
| `.cols` + `.tool` | Cards side by side |
| `.code` | Code or prompt text; `.c` dim, `.k` accent, `.s` string |
| `.footnote` | Small monospace line under a block |
| `.badge` | Small inline label |
| `.cursor` | Blinking block cursor after the element |
| `.card--pong` | C64-style screen for the pong game on the closing slide, drawn by `js/pong.js` |
| `.flowchart` | Mermaid flowchart with a one-line fallback, drawn by `js/flow.js` |

`css/deck.css` also contains `.agenda`, `.stack`, `.flow`, `.stats`, and
`slide--quote`, which the current deck does not use.

## Theme

All colours are variables at the top of `css/deck.css`.

- Base palette after Polestar's: near-black `--space`, off-white `--snow`,
  grey `--magnesium`, and gold `--gold` as the only accent.
- Square corners, hairline borders, and spaced monospace labels.
- A fixed hairline frame, a faint background grid, and a slide number in the
  top margin.
- Retro details: faint CRT scanlines, `RUN` behind the demo title, and on
  the closing slide a blinking cursor after `Ready.` and FSP playing pong on
  a screen in Commodore 64 colours (`--c64-*`).

Dark is the default. <kbd>T</kbd> switches to the light palette.

## Tools mentioned in the talk

- [`wag`](https://github.com/fubar83/wag): my tool for creating feature
  folders with a worktree per repository.
- [`twg`](https://developer.atlassian.com/cloud/twg-cli/): Atlassian's
  Teamwork Graph CLI, used by the skills to read and comment on Jira.
- `cpyolo`: my alias that starts Copilot CLI with the Sol agent in yolo mode.
