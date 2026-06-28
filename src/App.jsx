import { useEffect, useState } from 'react'
import Index from './Index.jsx'
import Detail from './Detail.jsx'
import Collection from './Collection.jsx'
import Ball from './Ball.jsx'

function parseFilters(hash) {
  const qi = hash.indexOf('?')
  const sp = new URLSearchParams(qi >= 0 ? hash.slice(qi + 1) : '')
  return {
    query: sp.get('q') || '',
    typeFilter: sp.get('type') || null,
    region: sp.get('region') || null,
    caughtOnly: sp.get('caught') === '1',
  }
}

export default function App() {
  const [hash, setHash] = useState(window.location.hash)
  const init = parseFilters(window.location.hash)

  // Index filter state lives here so it survives navigating into a detail and back.
  const [query, setQuery] = useState(init.query)
  const [typeFilter, setTypeFilter] = useState(init.typeFilter)
  const [region, setRegion] = useState(init.region)
  const [caughtOnly, setCaughtOnly] = useState(init.caughtOnly)
  const [shown, setShown] = useState(36)
  const [lensOn, setLensOn] = useState(false)

  useEffect(() => {
    const onHash = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => { window.scrollTo(0, 0) }, [hash])

  // The lens glows while a cry is playing.
  useEffect(() => {
    const on = () => setLensOn(true)
    const off = () => setLensOn(false)
    window.addEventListener('cry-play', on)
    window.addEventListener('cry-stop', off)
    return () => { window.removeEventListener('cry-play', on); window.removeEventListener('cry-stop', off) }
  }, [])

  const path = hash.slice(1)
  const mP = path.match(/^\/p\/([^/]+)/)
  const mA = path.match(/^\/ability\/([^/]+)/)
  const onIndex = !mP && !mA

  // Mirror index filters into the URL. replaceState updates the address bar without a
  // reload, without firing hashchange, and without remounting (so the search keeps focus).
  useEffect(() => {
    if (!onIndex) return
    const sp = new URLSearchParams()
    if (query) sp.set('q', query)
    if (typeFilter) sp.set('type', typeFilter)
    if (region) sp.set('region', region)
    if (caughtOnly) sp.set('caught', '1')
    const qs = sp.toString()
    const next = qs ? `#/?${qs}` : '#/'
    if (window.location.hash !== next) window.history.replaceState(null, '', next)
  }, [onIndex, query, typeFilter, region, caughtOnly])

  // Key by route only (ignore the query string) so filtering never remounts the view.
  const routeKey = mP ? `p/${mP[1]}` : mA ? `ability/${mA[1]}` : 'index'

  let view
  if (mP) view = <Detail name={decodeURIComponent(mP[1])} />
  else if (mA) view = <Collection ability={decodeURIComponent(mA[1])} />
  else view = (
    <Index
      query={query} setQuery={setQuery}
      typeFilter={typeFilter} setTypeFilter={setTypeFilter}
      region={region} setRegion={setRegion}
      caughtOnly={caughtOnly} setCaughtOnly={setCaughtOnly}
      shown={shown} setShown={setShown}
    />
  )

  return (
    <div className="pokedex">
      <header className="hood">
        <div className={`lens ${lensOn ? 'is-active' : ''}`} aria-hidden="true" />
        <div className="leds" aria-hidden="true">
          <span className="led led--r" />
          <span className="led led--y" />
          <span className="led led--g" />
        </div>
        <a className="brand" href="#/">
          <Ball />
          <span className="brand__name">Pokédex</span>
        </a>
        <p className="hood__tag">National field guide<br />powered by PokéAPI</p>
      </header>

      <main className="screen">
        <div className="screen-inner" key={routeKey}>
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
