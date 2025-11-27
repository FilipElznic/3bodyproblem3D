# 3-Body Problem 3D

Interactive React + Three.js playground that visualizes classic gravitational three-body scenarios in real time. The app uses `@react-three/fiber`, Drei helpers, and a custom velocity-Verlet integrator (with optional collision response) to keep the simulation numerically stable even when the masses venture close to one another.

## Features

- **Canonical scenarios** – switch among a deterministic 2-body orbit, the famous figure-eight choreography, or randomly generated chaotic systems.
- **Physics-focused integration** – sub-stepped velocity-Verlet integrator with optional collision resolution and per-body softening, tuned for the infinity-loop solution to remain stable indefinitely.
- **Interactive tooling** – on-screen Leva panel exposes gravity, time-scale, and camera focus controls at runtime.
- **Immersive presentation** – starfield background, emissive trails, and orbit controls for free camera exploration.

## Getting Started

```bash
npm install
npm run dev
```

Vite will print the local development URL (default `http://localhost:5173`). Hot-module reload keeps the scene live as you tweak physics or visuals.

### Available Scripts

| Command           | Description                                           |
| ----------------- | ----------------------------------------------------- |
| `npm run dev`     | Start Vite in development mode.                       |
| `npm run build`   | Type-check and produce a production bundle (`dist/`). |
| `npm run preview` | Serve the already built bundle locally.               |
| `npm run lint`    | Run eslint against the TypeScript source.             |

## Simulation Controls

- **Scenario buttons** – `2-Body`, `Figure-8`, and `Random` presets populate the scene with different initial conditions. The figure-eight mode disables collision impulses so the mathematical solution is preserved.
- **Reset / Nudge** – quickly restart the active scenario or introduce a tiny velocity perturbation to explore sensitivity to initial conditions.
- **Leva panel** – adjust the effective gravitational constant, slow down or speed up time, and lock the camera onto a specific body.
- **OrbitControls** – pan, zoom, and rotate the view freely with your mouse or touchpad.

## Project Structure

```
src/
  main.tsx                # React app entrypoint
  App.tsx                 # Root component managing landing page / simulation state
  index.css               # Global styles and Tailwind directives
  types.ts                # BodyState definition and shared types
  components/
    LandingPage.tsx       # Educational landing page with physics equations
    ThreeBodyScene.tsx    # Core 3D scene, physics integrator, UI overlay
```

## Notes

- The figure-eight preset uses published initial positions/velocities scaled to scene units; if you modify masses or gravity, keep them balanced to retain the closed-form orbit.
- Post-processing (Bloom) is commented out due to a known compatibility issue with `@react-three/postprocessing` and the current Three.js version. Update those packages if you want to re-enable it.

Feel free to extend the project with additional bodies, shader effects, or data export to compare against analytical solutions!
