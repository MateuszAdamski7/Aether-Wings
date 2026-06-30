# Aether Wings

**Aether Wings** is a retro-futuristic 3D arcade infinite runner. Players pilot a customizable spaceship down a three-lane cyberpunk runway, dodging sector-specific obstacles, picking up power-ups (Shields, Magnets, and Slow-Mo), and collecting crystals. Accumulating crystals charges a Hyperboost gauge, allowing players to activate an invulnerability state and trigger sonic blasts that shatter hazards. Outside the run, players spend collected crystals in the Garage to unlock ship skins with unique passives, purchase tech tree upgrades, and track active gameplay challenges.

---

## 🛠 Technology Stack

The application is built on the following technologies:
- **Core Framework**: React (TypeScript)
- **3D Rendering**: Three.js via [React Three Fiber (R3F)](https://r3f.docs.pmnd.rs/) & [@react-three/drei](https://github.com/pmndrs/drei)
- **Post-Processing Glow**: [@react-three/postprocessing](https://github.com/pmndrs/postprocessing)
- **State Management**: [Zustand](https://zustand.docs.pmnd.rs/) (slice pattern)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Bundler**: Vite

---

## 📂 Project Architecture

We enforce a strict boundary between the **3D Render Viewport** and the **2D UI Overlay screens**:

```
src/
├── App.tsx             # App shell, captures keyboard inputs, switches screen views
├── index.css           # Global typography & retro CRT scanline styling
├── main.tsx            # React DOM mounting
├── assets/             # Images & static assets
├── utils/
│   └── audio.ts        # Synthwave music tracks & arcade sound effect triggers
├── config/
│   └── gameConfig.ts   # Central configuration database (lanes, skins, upgrades tree)
├── store/              # Central State Management (Zustand)
│   ├── types.ts        # TypeScript interface definitions for slices & entities
│   ├── gameSlice.ts    # Core gameplay tick, player coordinates, obstacles, collisions
│   ├── garageSlice.ts  # Meta-progression upgrades & skins purchasing/equipping
│   ├── settingsSlice.ts# Sound mute & low/high graphics settings
│   ├── missionSlice.ts # Challenge list loader
│   └── useGameStore.ts # Merged Zustand store entrypoint hook
└── components/
    ├── 3d/             # 3D viewport canvas & R3F components
    │   ├── GameCanvas.tsx  # Canvas container, chase camera, and post-processing composer
    │   ├── Ship.tsx        # Player 3D spaceship geometry, bank tilts, disintegration
    │   ├── Track.tsx       # Infinite scrolling grid roadway shader & neon rails
    │   ├── Crystals.tsx    # Spawning crystal points & magnetic homing pull path
    │   ├── Obstacles.tsx   # Hazardous neon walls, moving barriers
    │   ├── PowerUps.tsx    # Magnet, Shield, and Slow-Mo collectible items
    │   └── Environment.tsx # Sunset background sun shader, mountains, skyscraper assets
    └── ui/             # 2D overlay overlays (HUD, main menu, game over)
        ├── ErrorBoundary.tsx# Crash screen fallback for WebGL/3D canvas issues
        ├── GameHUD.tsx     # Player HUD overlay (Score, speed, energy, power-up timers)
        ├── GameOver.tsx    # Re-run selection, final stats, high scores confetti
        └── MainMenu.tsx    # Garage skin selector, tech tree nodes, start trigger
```

---

## ⚡️ State Engine & Game Loop

State is fully managed via Zustand and updated on every frame.

### 1. Unified Slices
The state store is split into four slices merged inside [useGameStore.ts]:
- **`gameSlice`**: Tracks frame-by-frame physics like ship coordinates (`shipX`), Z progress (`playerZ`), speed, distance, active power-ups, spawned items, and runs the collision checking loop.
- **`garageSlice`**: Manages tech tech tree upgrades, skin equipping, and wallet balances (`lifetimeCrystals`).
- **`settingsSlice`**: Persists user configuration choices (audio mute, graphics profile) to `localStorage`.
- **`missionSlice`**: Evaluates challenge accomplishments.

### 2. The Frame Tick Loop
Inside [GameCanvas.tsx], the `GameLoopManager` calls the game store's `tick(dt)` action on every requestAnimationFrame render step:
```typescript
useFrame((state, delta) => {
  const clampedDelta = Math.min(delta, 0.1);
  tick(clampedDelta);
});
```
This updates position, obstacles, pulls magnet crystals, checks shield timers, and advances distance.

---

## 👩‍💻 Developer Recipes (How-To Guides)

Here are step-by-step guides on how to implement new features.

### 🚀 How to Add a New Ship Skin
1. Open [src/config/gameConfig.ts] and add a skin object to the `SKINS` array:
   ```typescript
   { 
     id: 'hyper', 
     name: 'Hyperion Gold', 
     color: '#ffaa00', 
     cost: 80, 
     description: 'Passive: Starts with 1.5x speed' 
   }
   ```
2. Open [src/components/3d/Ship.tsx]. Inside `Ship()`, search for `equippedSkin` statements and design your 3D mesh representation.
   - Add geometry in the JSX layout under `Fuselage`, `Canopy`, and `Wings`:
     ```jsx
     {equippedSkin === 'hyper' ? (
       <mesh castShadow>
         <coneGeometry args={[0.2, 1.8, 3]} />
         <meshStandardMaterial color="#ffe600" metalness={0.9} />
       </mesh>
     ) : ...}
     ```
3. Update passive skills inside `startGame` or `tick` in [gameSlice.ts]:
   ```typescript
   const isHyper = state.upgrades.equippedSkin === 'hyper';
   ```

### 🔧 How to Add a New Upgrade Tech Node
1. Open [src/store/types.ts]. Add a field to the `GameStoreUpgrades` interface:
   ```typescript
   export interface GameStoreUpgrades {
     ...
     engine_speed_boost: boolean; // your new upgrade
   }
   ```
2. Define the default state value in `garageSlice.ts` inside `defaultUpgrades`:
   ```typescript
   const defaultUpgrades = {
     ...
     engine_speed_boost: false,
   };
   ```
3. Open [src/config/gameConfig.ts] and add the node to `UPGRADE_NODES`:
   ```typescript
   {
     id: 'engine_speed_boost',
     name: 'Hyper Velocity',
     description: 'Permanently increases base engine speed limit by 5 units/s.',
     cost: 45,
     branch: 'ENGINE',
     tier: 2,
     prerequisite: 'engine_boost_1',
     icon: Gauge, // imported from lucide-react
     effectLabel: 'Base speed +5'
   }
   ```
4. Define its cost and prerequisite mappings in `NODE_COSTS` and `PREREQUISITES` at the bottom of `gameConfig.ts` to allow purchases.
5. Reference the upgrade node inside [gameSlice.ts] (e.g. adjust base/max speed limits when starting the run).

### 🏆 How to Add a New Mission Template
1. Open [src/config/gameConfig.ts] and add a challenge descriptor to `MISSION_TEMPLATES`:
   ```typescript
   { 
     type: 'CRASH_COUNT', 
     description: 'Survive for $target seconds in a single run', 
     targets: [30, 60, 90], 
     rewardBase: 15 
   }
   ```
2. Integrate the tracking checks inside the mission progress evaluator located in `gameSlice.ts` under the `tick` function:
   ```typescript
   } else if (m.type === 'CRASH_COUNT') {
     current = Math.floor(newDistance / 30); // your custom progress evaluation logic
   }
   ```

---

## ⌨️ Development Commands

Run these terminal commands within the project root:

- **Launch Development Server**:
  ```bash
  npm run dev
  ```
- **Run Typescript Typecheck**:
  ```bash
  npx tsc --noEmit
  ```
- **Compile Production Bundle**:
  ```bash
  npm run build
  ```

---

## 🚀 Quick Start Guide

Follow these steps to set up and launch the game locally:

### 1. Download & Prepare the Project
Unpack or clone the workspace files into your local directory:
```bash
cd "aether wings"
```

### 2. Install Dependencies
Install all required package dependencies:
```bash
npm install
```

### 3. Run the Development Server
Start the Vite local development instance:
```bash
npm run dev
```

### 4. Launch in Browser
Once the dev server is active, open your web browser and navigate to:
👉 **[http://localhost:5173](http://localhost:5173)**

---

## 🌐 Production Live Build

The compiled production build of **Aether Wings** is hosted live at:
👉 **[https://aether-wings.vercel.app/](https://aether-wings.vercel.app/)**
