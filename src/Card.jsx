import { pad, pretty, typeStyle } from './api.js'
import PokeImg from './PokeImg.jsx'

// Index/collection grid tile, coloured by primary type.
export default function Card({ id, name, types = [] }) {
  return (
    <a className="card" href={`#/p/${name}`} data-dex={id} style={types[0] ? typeStyle(types[0]) : undefined}>
      <span className="dex mono">№ {pad(id)}</span>
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
