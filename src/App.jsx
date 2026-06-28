import { useEffect, useState } from 'react'
import Index from './Index.jsx'
import Detail from './Detail.jsx'
import Collection from './Collection.jsx'

export default function App() {
  const [hash, setHash] = useState(window.location.hash)

  // Index filter state lives here so it survives navigating into a detail and back.
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState(null)
  const [shown, setShown] = useState(36)

  useEffect(() => {
    const onHash = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => { window.scrollTo(0, 0) }, [hash])

  const path = hash.slice(1)
  const mP = path.match(/^\/p\/([^/]+)/)
  const mA = path.match(/^\/ability\/([^/]+)/)

  let view
  if (mP) view = <Detail name={decodeURIComponent(mP[1])} />
  else if (mA) view = <Collection ability={decodeURIComponent(mA[1])} />
  else view = (
    <Index
      query={query} setQuery={setQuery}
      typeFilter={typeFilter} setTypeFilter={setTypeFilter}
      shown={shown} setShown={setShown}
    />
  )

  return (
    <div className="pokedex">
      <header className="hood">
        <div className="lens" aria-hidden="true" />
        <div className="leds" aria-hidden="true">
          <span className="led led--r" />
          <span className="led led--y" />
          <span className="led led--g" />
        </div>
        <a className="brand" href="#/">
          <span className="ball" aria-hidden="true" />
          <span className="brand__name">Pokédex</span>
        </a>
        <p className="hood__tag">National field guide<br />powered by PokéAPI</p>
      </header>

      <main className="screen">
        <div className="screen-inner" key={hash || 'home'}>
          {view}
        </div>
      </main>

      <footer className="creds">
        <span>Data &amp; artwork from <a href="https://pokeapi.co/" target="_blank" rel="noopener">PokéAPI</a>.</span>
        <span>Pokémon © Nintendo / Game Freak. A non-commercial fan project.</span>
      </footer>
    </div>
  )
}
