import { pad, pretty, typeStyle } from './api.js'
import PokeImg from './PokeImg.jsx'
import Ball from './Ball.jsx'
import { isCaught, toggleCaught } from './caught.js'

// Index/collection grid tile, coloured by primary type. Parent subscribes to the
// caught store, so reading isCaught() here re-renders on toggle.
export default function Card({ id, name, types = [] }) {
  const caught = isCaught(id)
  return (
    <a className={`card ${caught ? 'is-caught' : ''}`} href={`#/p/${name}`} data-dex={id}
       style={types[0] ? typeStyle(types[0]) : undefined}>
      <span className="dex mono">№ {pad(id)}</span>
      <button
        className="catch" aria-pressed={caught}
        title={caught ? 'Caught — click to release' : 'Mark as caught'}
        onClick={e => { e.preventDefault(); e.stopPropagation(); toggleCaught(id) }}
      >
        <Ball />
      </button>
      <div className="art"><PokeImg id={id} alt={pretty(name)} lazy /></div>
      <h3 className="name">{pretty(name)}</h3>
      {types.length > 0 && (
        <div className="card__types">
          {types.map(t => <span key={t} className="type type--sm" style={typeStyle(t)}>{t}</span>)}
        </div>
      )}
    </a>
  )
}
