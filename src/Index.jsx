import { useEffect, useMemo, useState } from 'react'
import { api, idFromUrl, pretty, pad, TYPE, typeStyle, MAX_DEX, loadTypes } from './api.js'
import Card from './Card.jsx'

const PAGE = 36
let listCache = null   // full name list, kept across mounts

export default function Index({ query, setQuery, typeFilter, setTypeFilter, shown, setShown }) {
  const [all, setAll] = useState(listCache || [])
  const [types, setTypes] = useState(null)   // { byId, byType }

  useEffect(() => {
    if (!listCache) {
      api('/pokemon?limit=100000&offset=0').then(d => {
        listCache = d.results
          .map(r => ({ name: r.name, id: idFromUrl(r.url) }))
          .filter(m => m.id <= MAX_DEX)
        setAll(listCache)
      })
    }
    loadTypes().then(setTypes)
  }, [])

  const filtered = useMemo(() => {
    let set = all
    if (typeFilter && types) set = set.filter(m => types.byId.get(m.id)?.includes(typeFilter))
    if (query) {
      const q = query.toLowerCase().trim()
      set = set.filter(m => m.name.includes(q) || String(m.id) === q || pad(m.id).includes(q))
    }
    return set
  }, [all, types, typeFilter, query])

  const waiting = !all.length || (typeFilter && !types)
  const page = filtered.slice(0, shown)

  const onType = t => {
    setTypeFilter(typeFilter === t ? null : t)
    setShown(PAGE)
  }

  return (
    <>
      <div className="screen-head">
        <h2 className="screen-title">National Dex</h2>
        <p className="count">
          {waiting
            ? 'Scanning…'
            : `${filtered.length} ${filtered.length === 1 ? 'entry' : 'entries'}` +
              (typeFilter ? ` · ${pretty(typeFilter)}` : '')}
        </p>
      </div>

      <section className="controls">
        <div className="search">
          <label htmlFor="q">Search the guide</label>
          <input
            id="q" type="search" autoComplete="off" spellCheck="false"
            placeholder="bulbasaur, 0025, char…"
            value={query}
            onChange={e => { setQuery(e.target.value); setShown(PAGE) }}
          />
        </div>
        <div className="chips" role="group" aria-label="Filter by type">
          {Object.keys(TYPE).map(t => (
            <button
              key={t} className="chip" style={typeStyle(t)}
              aria-pressed={typeFilter === t}
              onClick={() => onType(t)}
            >{t}</button>
          ))}
        </div>
      </section>

      <div className="grid">
        {waiting
          ? Array.from({ length: 12 }, (_, i) => <div key={i} className="skel skel-card" />)
          : page.length
            ? page.map(m => (
                <Card key={m.id} id={m.id} name={m.name} types={types?.byId.get(m.id) || []} />
              ))
            : (
              <div className="empty">
                <span className="ball" aria-hidden="true" />
                <h3>No Pokémon found.</h3>
                <p>Try another name, number, or type.</p>
              </div>
            )}
      </div>

      {!waiting && shown < filtered.length && (
        <div className="more">
          <button className="btn" onClick={() => setShown(shown + PAGE)}>Load more</button>
        </div>
      )}
    </>
  )
}
