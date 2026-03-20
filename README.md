# Pokédex

A feature-rich Pokémon encyclopedia built with React, powered by the [PokéAPI](https://pokeapi.co). Browse every region, explore Pokémon stats, compare your favourites, build your ultimate team, and test your Pokémon knowledge — all in a polished dark-themed UI.

---

## Features

### 🗺️ Regions & Pokémon Lists
- Browse all mainline regions from Kanto to Paldea (including Hisui)
- Each region shows only Pokémon that debuted there, plus any regional forms exclusive to that region (e.g. Alolan Vulpix appears in Alola, Galarian Ponyta in Galar)
- Regional form sprites are shown correctly in the list (not the base form sprite)
- Hisui-exclusive forms (Decidueye, Typhlosion, Samurott, etc.) resolve automatically

### 🔍 Pokémon Detail Page
- Official high-resolution artwork, scaled by `base_experience` — stronger Pokémon appear larger
- Alolan Exeggutor gets an extra-tall special size; Gigantamax forms are oversized
- Japanese name displayed alongside the English name
- Color-coded type badges
- Form/variant toggle pills (regional forms, alternate formes) — with the active form highlighted; Totem forms are excluded
- Full base stat panel with animated bars, plus min/max calculations at Lv. 50 and Lv. 100 using the official competitive formula

### ⚖️ Compare
- Search two Pokémon and compare their stats head-to-head
- Mirrored bar chart — higher stat is highlighted on each row
- Base Stat Total shown for both
- Type badges displayed for each Pokémon
- Autocomplete suggestions as you type

### 👥 Team Builder
- Pick a party of 6 Pokémon using the autocomplete search
- Optional Champion Name (3–15 characters) — displayed as "Champion [Name]" in the presentation
- **Team Presentation** — cinematic Elite Four victory screen with:
  - White flash entrance
  - Spinning golden rays
  - "Champion" title reveal
  - Sprites revealed one-by-one with a bounce animation
  - Sprites are **draggable** after the reveal — reposition them freely
  - Tapping/clicking a sprite triggers a shake animation

### 🎮 Challenge
- Randomly drawn Pokémon pairs with a randomly chosen stat
- Guess which Pokémon has the higher stat to keep your streak going
- Correct answers chain — the right Pokémon becomes the next left opponent
- Stat values revealed over the official artwork after each guess
- Streak counter with personal best tracked for the session
- Game Over screen shows your score and the sprite of the Pokémon you should have picked
- Works on mobile with a responsive stacked layout

### 🔎 Search
- Navbar search bar with live autocomplete across all 1,500+ Pokémon names
- Partial name matching — "bulba" → Bulbasaur, "char" → Charmander/Charmeleon/Charizard
- Arrow key navigation through suggestions; Enter picks the top match
- Same autocomplete is available inside Compare and Team Builder slots
- Name list is fetched once and cached for the session

---

## Tech Stack

| | |
|---|---|
| Framework | React 17 (Create React App) |
| Routing | React Router DOM v5 |
| Data | [PokéAPI](https://pokeapi.co) (REST) |
| Icons | Inline SVG (no icon library dependency) |
| Fonts | Orbitron, Nunito (Google Fonts) |
| Styling | Custom CSS with CSS variables, no UI framework |

---

## Getting Started

### Prerequisites
- Node.js ≥ 18
- Yarn

### Install & Run

```bash
# Install dependencies
yarn install

# Start the development server
yarn start
```

The app will open at `http://localhost:3000`.

### Build for Production

```bash
yarn build
```

> **Node.js compatibility note:** If you are running Node v17+, the following must be present in your `package.json` scripts and a `resolutions` entry for PostCSS:
>
> ```json
> "scripts": {
>   "start": "NODE_OPTIONS=--openssl-legacy-provider react-scripts start",
>   "build": "NODE_OPTIONS=--openssl-legacy-provider react-scripts build"
> },
> "resolutions": {
>   "postcss": "^8.4.31"
> }
> ```

---

## Project Structure

```
src/
├── App.js              # Root router
├── App.css             # All component styles and animations
├── index.css           # Global base styles, CSS variables, keyframes
├── Layout.js           # Navbar (with search + hamburger), footer
├── Home.js             # Region selection grid
├── PokemonList.js      # Region Pokémon grid with regional form resolution
├── Pokemon.js          # Pokémon detail page
├── Compare.js          # Side-by-side stat comparison
├── Team.js             # Team builder + cinematic presentation
├── Challenge.js        # Higher/lower stat guessing game
├── SearchInput.js      # Shared autocomplete search component
├── typeColors.js       # Type color map + TypeBadge component
└── utils/
    └── fetchUtils.js   # checkStatus and json fetch helpers
```

---

## Data & API

All data is fetched live from the [PokéAPI](https://pokeapi.co) — no API key required.

Key endpoints used:

| Endpoint | Used for |
|---|---|
| `/pokemon/{name}` | Stats, sprites, types, artwork |
| `/pokemon-species/{id}` | Japanese name, varieties/forms |
| `/region/{name}` | Region metadata, generation link |
| `/generation/{id}` | Species list for a generation |
| `/pokedex/{name}` | Regional Pokédex (Hisui, Alola, etc.) |
| `/pokemon?limit=1500` | Full name list for autocomplete |

---

## Credits

- Pokémon data: [PokéAPI](https://pokeapi.co)
- Sprites & artwork: [PokeAPI/sprites](https://github.com/PokeAPI/sprites)
- Built by [Marques Batoon](https://github.com/marques-batoon)
