import { useEffect, useMemo, useRef, useState } from 'react'
import { api, idFromUrl, pretty, pad, TYPE, typeStyle, MAX_DEX, loadTypes, REGIONS } from './api.js'
import Card from './Card.jsx'
import Ball from './Ball.jsx'
import { useCaughtStore, caughtCount, isCaught } from './caught.js'

const PAGE = 36
let listCache = null   // full name list, kept across mounts

export default function Index({
  query, setQuery, typeFilter, setTypeFilter,
  region, setRegion, caughtOnly, setCaughtOnly, shown, setShown,
}) {
  const [all, setAll] = useState(listCache || [])
  const [types, setTypes] = useState(null)   // { byId, byType }
  const cv = useCaughtStore()                 // re-render + recompute when catches change

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
    if (region) {
      const r = REGIONS.find(x => x.id === region)
      if (r) set = set.filter(m => m.id >= r.min && m.id <= r.max)
    }
    if (caughtOnly) set = set.filter(m => isCaught(m.id))
    if (query) {
      const q = query.toLowerCase().trim()
      set = set.filter(m => m.name.includes(q) || String(m.id) === q || pad(m.id).includes(q))
    }
    return set
  }, [all, types, typeFilter, region, caughtOnly, query, cv])

  const waiting = !all.length || (typeFilter && !types)
  const page = filtered.slice(0, shown)
  const hasMore = !waiting && shown < filtered.length
  const sentinelRef = useRef(null)

  // Infinite scroll: load the next page when the sentinel nears the viewport.
  useEffect(() => {
    if (!hasMore) return
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) setShown(s => s + PAGE) },
      { rootMargin: '300px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [hasMore])

  const onType = t => { setTypeFilter(typeFilter === t ? null : t); setShown(PAGE) }
  const total = caughtCount()

  return (
    <>
      <div className="screen-head">
        <h2 className="screen-title">National Dex</h2>
        <p className="count">
          {waiting
            ? 'Scanning…'
            : `${filtered.length} ${filtered.length === 1 ? 'entry' : 'entries'}` +
              (total ? ` · ${total} caught` : '')}
        </p>
      </div>

      <section className="controls">
        <div className="controls__row">
          <div className="search">
            <label htmlFor="q">Search</label>
            <input
              id="q" type="search" autoComplete="off" spellCheck="false"
              placeholder="bulbasaur, 0025, char…"
              value={query}
              onChange={e => { setQuery(e.target.value); setShown(PAGE) }}
            />
          </div>
          <div className="filter">
            <label htmlFor="region">Region</label>
            <select id="region" value={region || ''}
                    onChange={e => { setRegion(e.target.value || null); setShown(PAGE) }}>
              <option value="">All regions</option>
              {REGIONS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <button
            className={`caught-toggle ${caughtOnly ? 'is-on' : ''}`}
            aria-pressed={caughtOnly}
            onClick={() => { setCaughtOnly(!caughtOnly); setShown(PAGE) }}
          >
            <Ball /> Caught{total ? ` ${total}` : ''}
          </button>
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
            ? (
              <>
                {page.map(m => (
                  <Card key={m.id} id={m.id} name={m.name} types={types?.byId.get(m.id) || []} />
                ))}
                {hasMore && Array.from({ length: Math.min(filtered.length - shown, 8) }, (_, i) => (
                  <div key={`skel-${i}`} className="skel skel-card" />
                ))}
              </>
            )
            : (
              <div className="empty">
                <Ball />
                <h3>No Pokémon found.</h3>
                <p>{caughtOnly ? 'You have not caught any matching this filter.' : 'Try another name, number, or type.'}</p>
              </div>
            )}
      </div>

      {hasMore && <div ref={sentinelRef} className="scroll-sentinel" aria-hidden="true" />}
    </>
  )
}
