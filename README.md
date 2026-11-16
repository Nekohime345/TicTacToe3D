# Tic Tac Toe 3D

A responsive, two-player tic-tac-toe game built with React, Vite, and React Three Fiber.

## Getting started

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Use **Play** to start a round. Players take turns selecting squares; **New Game** resets the board. The camera editor and performance panel are available on screen.

## Project layout

```text
src/
  components/
    board/       3D board, cells, and X/O marks
    scene/       Camera animation and WebGL performance sampling
    ui/          Camera editor and performance display
  game/          Board constants and tic-tac-toe rules
  App.jsx        Game state and top-level scene/UI composition
  App.css        Game and interface styles
  index.css      Global page reset and root sizing
  main.jsx       React entry point
```

## Scripts

- `npm run dev` starts the local development server.
- `npm run build` creates the production bundle in `dist/`.
- `npm run preview` serves the production bundle locally.
- `npm run lint` checks the source with ESLint.
