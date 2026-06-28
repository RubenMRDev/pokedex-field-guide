import { useEffect, useState } from 'react'
import { api, idFromUrl, pretty, loadTypes, MAX_DEX, abilityEffect } from './api.js'
import Card from './Card.jsx'
import Ball from './Ball.jsx'

// Every Pokémon that has a given ability.
export default function Collection({ ability }) {
  const [state, setState] = useState(null)   // { items, effect } | 'error'
  const [types, setTypes] = useState(null)

  useEffect(() => {
    let alive = true
    setState(null)
    ;(async () => {
      try {
        const a = await api(`/ability/${ability.toLowerCase()}`)
        const items = a.pokemon
          .map(x => ({ name: x.pokemon.name, id: idFromUrl(x.pokemon.url) }))
          .filter(m => m.id <= MAX_DEX)
          .sort((p, q) => p.id - q.id)
        if (alive) setState({ items, effect: abilityEffect(a) })
      } catch {
        if (alive) setState('error')
      }
    })()
    loadTypes().then(setTypes)
    return () => { alive = false }
  }, [ability])

  return (
    <>
      <div className="detail-top"><a className="back" href="#/">← Back to the guide</a></div>

      {state === 'error' ? (
        <div className="empty">
          <Ball />
          <h3>No ability called “{pretty(ability)}”.</h3>
        </div>
      ) : (
        <>
          <div className="screen-head">
            <h2 className="screen-title">Ability · {pretty(ability)}</h2>
            <p className="count">{state ? `${state.items.length} Pokémon` : 'Scanning…'}</p>
          </div>
          {state?.effect && <p className="lead">{state.effect}</p>}
          <div className="grid">
            {state
              ? state.items.map(m => (
                  <Card key={m.id} id={m.id} name={m.name} types={types?.byId.get(m.id) || []} />
                ))
              : Array.from({ length: 12 }, (_, i) => <div key={i} className="skel skel-card" />)}
          </div>
        </>
      )}
    </>
  )
}
