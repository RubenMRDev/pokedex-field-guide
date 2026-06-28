# Pokédex field guide

**Live demo → [pokedex-field-guide.vercel.app](https://pokedex-field-guide.vercel.app)**

An illustrated Pokédex built as the red scanning device itself: drenched red shell, glossy blue lens, status LEDs and a recessed screen. Powered by the free [PokéAPI](https://pokeapi.co/).

Built with **React + Vite**, no UI framework, hash routing, all data fetched live from PokéAPI.

## Features

- **Browse** every Pokémon with type-coloured cards; search by name or number; filter by type.
- **Detail view** for each Pokémon:
  - Official artwork with a **shiny toggle** and a **cry** player.
  - Canonical **type badges** and a computed **type-defense chart** (weak / resists / immune with multipliers).
  - **Base stats** with total (BST) and **EV yield**.
  - Species data: region, gender ratio, catch rate, base friendship, egg groups, growth rate, held items, base experience.
  - **Evolution line** with conditions (level, item, trade, friendship…).
  - **Alternate forms** (Mega, Gigantamax, regional) switcher.
  - **Pokédex entries** per game.
  - **Abilities** with descriptions; click one to see every Pokémon that has it.
  - **Level-up moves**.
- Legendary / Mythical badges, where-to-find locations, prev/next navigation.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
npm run preview  # preview the build
```

## Notes

Pokémon and all related media are © Nintendo / Game Freak / The Pokémon Company. This is a non-commercial fan project; data and artwork come from PokéAPI.
