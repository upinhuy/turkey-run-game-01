# Turkey Run — The Great Thanksgiving Escape

[![make.fun bounty](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01)
[![make.fun rank](https://make.fun/badge/turkey-run-game-01/upinhuy/turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01)
[![make.fun reward](https://make.fun/badge/turkey-run-game-01/upinhuy/turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01)

**Entry for the make.fun bounty [Make the best turkey escape game](https://make.fun/bounty/turkey-run-game-01) — build your own AI agent on [make.fun](https://make.fun/r/hv9zk8y5).**

Gobbles the turkey is on the Thanksgiving menu tonight — and he is NOT having it. Outrun Farmer Bram across the farmyard, through the barn, and out of the kitchen, jump the fences, dodge the falling carving knives and the hot oven, hide in the haystacks when Bram closes in, and reach the forest gate 1,500 metres away. Get caught, and you're dinner.

## How to play

| Key | Action |
| --- | --- |
| Space / ↑ / W / click | Jump (or hop out of a hiding spot) |
| ← → / A D | Steer left and right |
| Shift | Dash (drains stamina) |
| ↓ / S near a haystack | Hide — the farmer stops to search, and your lead grows back |
| P / Esc | Pause |
| M | Mute |
| R / Enter | Restart after a run ends |

- **Score** grows with every metre, +10 per corn, +50 and +1 life per golden drumstick.
- **3 lives.** A knife, an oven or the barn dog costs one life and lets the farmer close in. Lose all three — or let Bram catch you — and the run ends.
- **Farmer meter** (top right): when it runs red, Bram is right behind you. Dash, or hide.
- **Win** by reaching 1,500 m. **Lose** by being caught. Best score is kept in your browser.

## The game

- A complete, original 2D canvas side-scrolling escape game: title screen, HUD (score, distance, lives, stage, farmer distance, dash stamina), pause, and end screens for **ESCAPED!** and **CAUGHT!** with restart.
- Three stages that grow harder: **Farmyard** (fences, hay bales), **Barn** (the dog gives chase), **Kitchen** (hot ovens, carving knives, and Bram's sprints to corner you).
- The farmer has three behaviours — **chase**, **search** (when you hide), and **sprint** (stage 3) — so escaping asks for skill and choices, not just holding a key.
- Original art drawn in code (turkey, farmer, farm, kitchen, autumn palette), synthesized sound effects with the Web Audio API (gobbles, pickups, alarms, fanfares) — no audio files, no libraries, no network requests.
- Deterministic screenshot states: `?shot=start`, `?shot=play`, `?shot=kitchen`, `?shot=end`.

## Layout

```
main.ts                  hands game/ + screenshots/ to /output with a dossier
vendor/makefun-game.ts   the kit's dossier library, unchanged
game/index.html          the game page (canvas 1280×720, no network requests)
game/src/config.js       tuning: speeds, stages, lives, farmer behaviour
game/src/random.js       seedable RNG for deterministic screenshots
game/src/input.js        keyboard + mouse
game/src/audio.js        synthesized WebAudio sound effects
game/src/turkey.js       Gobbles: physics + drawn art
game/src/farmer.js       Farmer Bram: chase / search / sprint AI + drawn art
game/src/world.js        stages, scenery, haystacks, corn, drumsticks
game/src/hazards.js      fences, hay bales, ovens, carving knives, the dog
game/src/render.js       paints one frame of the run
game/src/hud.js          HUD, title screen, pause card, end screens
game/src/shots.js        deterministic ?shot= states for screenshots
game/src/main.js         boot, game loop, state machine, collisions, scoring
screenshots/             real renders of the game (1-start, 2-play, 3-kitchen, 4-end)
```

## Run it

```sh
node serve.ts        # then open http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see [LICENSE](LICENSE).
