import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

const KEY = 'pokedex-tour-done'

export function startTour() {
  driver({
    showProgress: true,
    nextBtnText: 'Next',
    prevBtnText: 'Back',
    doneBtnText: 'Got it',
    steps: [
      { element: '.brand', popover: { title: 'Welcome, Trainer', description: 'A field guide to every Pokémon, powered by PokéAPI. Here is the quick tour.' } },
      { element: '#q', popover: { title: 'Search', description: 'Find any Pokémon by name or Pokédex number.' } },
      { element: '.chips', popover: { title: 'Filter by type', description: 'Tap a type to show only Pokémon of that type.' } },
      { element: '.region', popover: { title: 'Region', description: 'Narrow the list to a region, from Kanto to Paldea.' } },
      { element: '.caught-toggle', popover: { title: 'Favourites', description: 'Mark your favourites (saved on this device) and toggle to show only them.' } },
      { element: '.card', popover: { title: 'Open an entry', description: 'Click any Pokémon for stats, types, defences, evolutions and more.', side: 'top' } },
    ],
    onDestroyed: () => { try { localStorage.setItem(KEY, '1') } catch {} },
  }).drive()
}

export function maybeStartTour() {
  try { if (!localStorage.getItem(KEY)) startTour() } catch {}
}
