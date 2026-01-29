# CLAUDE.md – Ski Rainbow

## Project Overview

**Ski Rainbow** is a browser-based 2D ski racing game built with vanilla HTML, CSS, and JavaScript (Canvas API). The player skis down a snowy slope, dodging rocks and flying unicorns, with the goal of reaching a rainbow finish line guarded by two unicorns.

## File Structure

```
skirainbow/
├── index.html   # Entry point – loads canvas, UI overlays, styles, and game script
├── style.css    # All visual styling for the UI (menus, buttons, score display)
├── game.js      # Complete game logic: input, physics, spawning, rendering, game loop
└── CLAUDE.md    # This file
```

## Architecture

The game is a single-page app with **no build step, no dependencies, and no frameworks**. Everything runs client-side in one `<canvas>` element.

### game.js structure

| Section | Description |
|---|---|
| **Constants** | Tuning values: track length, gravity, speeds, snowflake count |
| **State** | Single `state` object holds all mutable game data (player, obstacles, unicorns, trees, particles, distance, score) |
| **Input** | Keyboard listeners populate a `keys` map; `ArrowLeft`/`ArrowRight`/`A`/`D` steer, `Space` jumps |
| **Spawning** | Functions create rocks, flying unicorns, and trees at timed intervals |
| **Update** | Per-frame logic: movement, gravity, collision detection, distance tracking, entity lifecycle |
| **Drawing** | All rendering via Canvas 2D API – player, trees, rocks, unicorns (with animated wings), finish line rainbow arch with two unicorn statues |
| **Game loop** | `requestAnimationFrame`-based loop calling `update()` then `draw()` |

### Key game mechanics

- **Scrolling**: The world scrolls toward the player at `PLAYER_SPEED_DOWN` (4 px/frame). Obstacles, trees, and snowflakes move downward to simulate downhill skiing.
- **Jumping**: `Space` applies `JUMP_FORCE` (-12) and gravity pulls back. While airborne, collisions are disabled (the player jumps over obstacles).
- **Collision**: Axis-aligned bounding-box overlap check with a 4px inset for fairness.
- **Finish line**: Appears when `distance > TRACK_LENGTH - 2000`. A rainbow arch with two unicorn figures scrolls into view. Reaching `TRACK_LENGTH` triggers win.

## Development

### Running locally

Open `index.html` in any modern browser. No server needed (all file:// compatible).

For a local dev server:
```sh
# Python
python3 -m http.server 8000

# Node (npx)
npx serve .
```

### Making changes

- **Tuning gameplay**: Edit constants at the top of `game.js` (`TRACK_LENGTH`, `GRAVITY`, `JUMP_FORCE`, `PLAYER_SPEED_DOWN`, `PLAYER_LATERAL_SPEED`).
- **Adding obstacle types**: Add a spawn function, push to the relevant array in `state`, move in `update()`, draw in `draw()`, and add collision check.
- **Styling UI**: Edit `style.css`. The canvas itself is styled programmatically in `game.js`.

### Code conventions

- **No build tools or transpilation** – plain ES2020 JavaScript.
- **Single state object** – all mutable game state lives in the `state` variable, reset cleanly by `resetGame()`.
- **Functional draw helpers** – each visual element has its own `draw*` function (e.g., `drawTree`, `drawFlyingUnicorn`, `drawFinishUnicorn`).
- **No external assets** – all graphics are drawn procedurally on the canvas.
- **Frame-based timing** – logic assumes ~60fps via `requestAnimationFrame`. No delta-time normalization.

### Testing

There is no automated test suite. Test by playing the game in a browser:
1. Verify the start screen appears and the Start button works.
2. Steer left/right and confirm boundary clamping.
3. Jump over a rock to confirm collision is skipped while airborne.
4. Collide with a rock or unicorn to confirm game-over triggers.
5. Reach the finish line to confirm the win screen and rainbow arch render.

## Useful context for AI assistants

- The entire game logic is in **one file** (`game.js`, ~400 lines). Read it fully before making changes.
- `state` is the single source of truth. Never store game data outside it.
- The `update()` function is the place for all per-frame logic; `draw()` is purely visual.
- Collision uses AABB with an inset (`pBox`). Jumping sets `p.jumping = true`, which disables collision.
- The finish line is not a persistent entity — it is drawn dynamically based on distance remaining.
