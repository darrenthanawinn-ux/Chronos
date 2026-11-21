# CHRONOS: ZERO-HOUR

> **AI Wargaming & Opponent Digital-Twin Engine for Cloud9 VALORANT & Game Changers**  
> *Built for Cloud9 x JetBrains: Sky's The Limit Hackathon 2026 — Category 1 (VAL/GC)*

**CHRONOS: ZERO-HOUR** turns raw GRID esports telemetry into a real-time, 60fps tactical wargaming simulator. Instead of relying on static spreadsheets or passive VOD scrubbing, Cloud9 coaches can model opponent tendencies as a living "Digital Twin," drop hypothetical counter-utility mid-round, re-simulate enemy pathing and Operator sightlines on the fly, and export stage-ready pre-match prep briefs.

---

## Core Features

* **Opponent "Digital Twin" Ghost Simulation:** Animates 5 enemy "Ghosts" across an architectural top-down tactical map using round coordinates, economy states, and ability-cast timestamps—complete with role badges, utility effects, and dynamic Operator sightline cones.
* **Interactive Counter-Strat Sandbox:** Pause at any round timestamp, select Cloud9 counter-utility (`C9 Smoke`, `C9 Flash`, `C9 Area Denial`), click directly on the canvas to deploy it, and hit **Re-Simulate** to recalculate enemy rotation delays, sightline clipping, and round win-probability deltas.
* **Automated Behavioral "If-Then" Tells:** Surfaces high-signal conditional patterns mined from historical rounds (e.g., utility triggers linked to fakes or rotations). Clicking any Tell jumps straight to that moment on the round timeline.
* **"Kill-Switch" Vulnerability Profiler:** Identifies the key player or utility anchor whose early elimination disrupts the opponent's round structure and quantifies the resulting win-rate shift.
* **One-Click Pre-Match Prep Brief:** Generates a clean, copyable coaching summary featuring counter-strat timings, sightline denial metrics, Kill-Switch targets, and win-probability gains.
* **Zero-Friction Instant War Room:** Ships with pre-compiled pro-tier match scenarios so evaluators can launch and test simulations immediately with zero external API keys required.

---

## Win-Probability & Simulation Model

To estimate how counter-utility shifts round outcomes during wargaming runs, **CHRONOS: ZERO-HOUR** pairs spatial geometry checks with a logistic impact formulation:

$$P(\text{Win}_{\text{C9}}) = \frac{1}{1 + e^{-\left(\beta_0 + \beta_1 \Delta t_{\text{rot}} + \beta_2 S_{\text{denial}} + \beta_3 U_{\text{disrupt}}\right)}}$$

* $\Delta t_{\text{rot}}$: Additional rotation/hesitation delay forced onto enemy Ghosts when primary paths or angles are contested.
* $S_{\text{denial}}$: Share of enemy Operator sightline coverage clipped by map walls or Cloud9 smoke placement.
* $U_{\text{disrupt}}$: Early site-execute and utility-timing disruption score.

---

## Tech Stack & JetBrains Workflow

* **Frontend & 60fps Canvas:** Next.js, React, TypeScript, Tailwind CSS, HTML5 Canvas, Framer Motion, `lucide-react`
* **Telemetry & Analytics Logic:** TypeScript / Python probabilistic & schema adapter modules (`gridTelemetryAdapter.ts`)
* **JetBrains Tools Used:**
  * **WebStorm:** Primary IDE for the tactical war room UI, state management, and 60fps HTML5 Canvas simulation.
  * **PyCharm:** Prototyping and validating probability and correlation logic.
  * **JetBrains Air & Junie:** Assisting with raycasting/sightline math, enemy Ghost pathing recalculation, and GRID telemetry schema mapping.

---

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   npm run dev

## Project Structure
├── app/                  # Next.js App Router pages, layout, and styles
├── components/           # Tactical canvas, sidebars, timeline scrubber, and prep brief modal
├── lib/                  # Simulation engine, mock GRID scenarios, and telemetry adapters
└── public/               # Static assets
