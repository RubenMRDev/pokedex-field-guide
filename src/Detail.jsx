import { useEffect, useRef, useState } from 'react'
import {
  api, pretty, pad, typeStyle, flattenEvo, evoCondition, STAT_LABELS, MAX_DEX,
  loadTypes, defenseChart, multLabel, levelMoves, regionOf, genderText, abilityEffect,
  flavorEntries, evYield, formLabel, SPRITE, TYPE,
} from './api.js'
import { useCaughtStore, isCaught, toggleCaught } from './caught.js'

const STAT_ABBR = {
  hp: 'HP', attack: 'Atk', defense: 'Def',
  'special-attack': 'SpA', 'special-defense': 'SpD', speed: 'Spe',
}

// Hexagonal base-stats radar.
function StatRadar({ stats, color }) {
  const MAX = 200, R = 82, cx = 130, cy = 108
  const ang = i => (-90 + i * (360 / stats.length)) * Math.PI / 180
  const pt = (i, r) => [cx + Math.cos(ang(i)) * r, cy + Math.sin(ang(i)) * r]
  const shape = stats.map((s, i) => pt(i, Math.min(1, s.value / MAX) * R).join(',')).join(' ')
  const rings = [0.25, 0.5, 0.75, 1].map(f => stats.map((_, i) => pt(i, f * R).join(',')).join(' '))
  const anchor = x => (x > cx + 3 ? 'start' : x < cx - 3 ? 'end' : 'middle')
  return (
    <svg className="radar" viewBox="0 0 260 226" role="img" aria-label="Base stats radar">
      {rings.map((pts, i) => <polygon key={i} className="radar__ring" points={pts} />)}
      {stats.map((_, i) => { const [x, y] = pt(i, R); return <line key={i} className="radar__axis" x1={cx} y1={cy} x2={x} y2={y} /> })}
      <polygon className="radar__area" points={shape}
               style={{ fill: `color-mix(in oklab, ${color}, transparent 68%)`, stroke: color }} />
      {stats.map((s, i) => {
        const [lx, ly] = pt(i, R + 18)
        return (
          <text key={i} className="radar__label" x={lx} y={ly} textAnchor={anchor(lx)} dominantBaseline="middle">
            <tspan x={lx} dy="-0.3em">{s.label}</tspan>
            <tspan x={lx} dy="1.15em" className="radar__val">{s.value}</tspan>
          </text>
        )
      })}
    </svg>
  )
}

// One move row that fetches its details on first expand.
function MoveRow({ name, level }) {
  const [open, setOpen] = useState(false)
  const [info, setInfo] = useState(null)
  const toggle = () => { setOpen(o => !o); if (!info) api(`/move/${name}`).then(setInfo).catch(() => setInfo({})) }
  return (
    <div className={`move ${open ? 'is-open' : ''}`}>
      <button className="move__head" onClick={toggle} aria-expanded={open}>
        <span className="move__lv mono">{level > 0 ? `Lv ${level}` : '—'}</span>
        <span className="move__name">{pretty(name)}</span>
        <span className="move__chev" aria-hidden="true">▸</span>
      </button>
      {open && (
        <div className="move__info">
          {info
            ? <>
                {info.type && <span className="type type--sm" style={typeStyle(info.type.name)}>{info.type.name}</span>}
                {info.damage_class && <span className="move__tag">{pretty(info.damage_class.name)}</span>}
                <span className="move__tag">Power {info.power ?? '—'}</span>
                <span className="move__tag">Acc {info.accuracy ?? '—'}</span>
                <span className="move__tag">PP {info.pp ?? '—'}</span>
              </>
            : <span className="move__tag">Loading…</span>}
        </div>
      )}
    </div>
  )
}

export default function Detail({ name }) {
  const [data, setData] = useState(null)   // { p, s, types, abilities, evo, locations }
  const [error, setError] = useState(null)
  const [shiny, setShiny] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [formName, setFormName] = useState(null)
  const [flavorIdx, setFlavorIdx] = useState(null)
  const audioRef = useRef(null)
  useCaughtStore()

  useEffect(() => {
    let alive = true
    setData(null); setError(null); setShiny(false)
    const active = formName || name
    ;(async () => {
      try {
        const p = await api(`/pokemon/${active.toLowerCase()}`)
        const [s, types, abilityJsons, enc] = await Promise.all([
          api(p.species.url).catch(() => null),
          loadTypes(),
          Promise.all(p.abilities.map(a => api(a.ability.url).catch(() => null))),
          api(p.location_area_encounters).catch(() => []),
        ])
        let evo = []
        if (s?.evolution_chain?.url) {
          const chain = await api(s.evolution_chain.url)
          evo = flattenEvo(chain.chain)
        }
        const abilities = p.abilities.map((a, i) => ({
          name: a.ability.name, hidden: a.is_hidden, effect: abilityEffect(abilityJsons[i]),
        }))
        // ponytail: cap location list; some Pokémon are found in 100+ areas.
        const locations = [...new Set((enc || []).map(e => pretty(e.location_area.name)))].slice(0, 12)
        if (alive) setData({ p, s, types, abilities, evo, locations })
      } catch {
        if (alive) setError(`No creature called “${pretty(name)}” lives in this guide.`)
      }
    })()
    return () => { alive = false }
  }, [name, formName])

  useEffect(() => {
    document.title = data ? `${pretty(data.p.name)} · Pokédex` : 'Pokédex'
  }, [data])

  // Stop the cry (and the lens) when leaving the page.
  useEffect(() => () => {
    if (audioRef.current) audioRef.current.pause()
    window.dispatchEvent(new Event('cry-stop'))
  }, [])

  const playCry = () => {
    const url = data?.p.cries?.latest
    if (!url) return
    if (!audioRef.current) {
      audioRef.current = new Audio(url)
      audioRef.current.volume = 0.4
      audioRef.current.addEventListener('ended', () => { setPlaying(false); window.dispatchEvent(new Event('cry-stop')) })
    }
    audioRef.current.currentTime = 0
    audioRef.current.play().then(() => { setPlaying(true); window.dispatchEvent(new Event('cry-play')) }).catch(() => {})
  }

  if (error) {
    return (
      <>
        <div className="detail-top"><a className="back" href="#/">← Back to the guide</a></div>
        <div className="empty">
          <span className="ball" aria-hidden="true" />
          <h3>{error}</h3>
          <p>Check the spelling, or browse the full guide instead.</p>
        </div>
      </>
    )
  }

  if (!data) {
    return (
      <>
        <div className="detail-top"><a className="back" href="#/">← Back to the guide</a></div>
        <div className="detail">
          <div className="skel" style={{ aspectRatio: '1 / 1', borderRadius: '22px' }} />
          <div>
            <div className="skel" style={{ height: '1rem', width: '40%', marginBottom: '1rem' }} />
            <div className="skel" style={{ height: '3rem', width: '70%', marginBottom: '1rem' }} />
            <div className="skel" style={{ height: '6rem', width: '100%' }} />
          </div>
        </div>
      </>
    )
  }

  const { p, s, types, abilities, evo, locations } = data
  const primary = p.types[0]?.type.name || 'normal'
  const primaryColor = TYPE[primary] || '#777777'
  const genus = s?.genera.find(g => g.language.name === 'en')?.genus || 'Pokémon'
  const bst = p.stats.reduce((sum, st) => sum + st.base_stat, 0)
  const evs = evYield(p)
  const radarStats = p.stats.map(st => ({ label: STAT_ABBR[st.stat.name] || pretty(st.stat.name), value: st.base_stat }))

  const cid = s?.id || p.id
  const caught = isCaught(cid)

  const entries = flavorEntries(s)
  const fIdx = flavorIdx ?? Math.max(0, entries.length - 1)
  const flavor = entries[fIdx]?.text || ''

  const varieties = s?.varieties?.length > 1 ? s.varieties : null

  const oa = p.sprites.other?.['official-artwork'] || {}
  const artDefault = oa.front_default || p.sprites.front_default || SPRITE(p.id)
  const artShiny = oa.front_shiny || p.sprites.front_shiny || artDefault
  const art = shiny ? artShiny : artDefault
  const hasShiny = !!(oa.front_shiny || p.sprites.front_shiny)

  const chart = defenseChart(p.types.map(t => t.type.name), types.byType)
  const ent = Object.entries(chart)
  const weak = ent.filter(([, m]) => m > 1).sort((a, b) => b[1] - a[1])
  const resist = ent.filter(([, m]) => m < 1 && m > 0).sort((a, b) => a[1] - b[1])
  const immune = ent.filter(([, m]) => m === 0)

  const moves = levelMoves(p)

  const facts = [
    ['Height', <>{(p.height / 10).toFixed(1)}<small> m</small></>],
    ['Weight', <>{(p.weight / 10).toFixed(1)}<small> kg</small></>],
    s && ['Region', regionOf(s.generation?.name)],
    s && ['Gender', genderText(s.gender_rate)],
    s && ['Catch rate', s.capture_rate],
    s && ['Base friendship', s.base_happiness],
    p.base_experience && ['Base exp', p.base_experience],
    s?.egg_groups?.length && ['Egg groups', s.egg_groups.map(g => pretty(g.name)).join(', ')],
    s?.growth_rate && ['Growth rate', pretty(s.growth_rate.name)],
    p.held_items?.length && ['Held items', p.held_items.map(h => pretty(h.item.name)).join(', ')],
  ].filter(Boolean)

  return (
    <>
      <div className="detail-top">
        <a className="back" href="#/">← Back to the guide</a>
        <nav className="dex-nav mono" aria-label="Adjacent entries">
          {prevNext(p)}
        </nav>
      </div>

      <article className="detail">
        <figure className="plate" style={typeStyle(primary)}>
          {hasShiny && (
            <button
              className={`shiny ${shiny ? 'is-on' : ''}`}
              onClick={() => setShiny(v => !v)}
              aria-pressed={shiny}
              title="Toggle shiny"
            >✦ Shiny</button>
          )}
          <img src={art} alt={`${pretty(p.name)}${shiny ? ' (shiny)' : ''}`}
               onError={e => { if (!e.target.src.endsWith(`/pokemon/${p.id}.png`)) e.target.src = SPRITE(p.id) }} />
        </figure>

        <div className="info">
          {(s?.is_legendary || s?.is_mythical) && (
            <p className="badges">
              {s.is_legendary && <span className="legend">Legendary</span>}
              {s.is_mythical && <span className="legend legend--myth">Mythical</span>}
            </p>
          )}
          <p className="dex-big mono">№ {pad(cid)}</p>
          <h1 className="name">{pretty(s?.name || p.name)}</h1>
          <p className="genus">{genus}</p>

          {varieties && (
            <div className="forms">
              {varieties.map(v => (
                <button
                  key={v.pokemon.name}
                  className={`form ${v.pokemon.name === p.name ? 'is-on' : ''}`}
                  onClick={() => setFormName(v.pokemon.name)}
                >{formLabel(v.pokemon.name, s.name)}</button>
              ))}
            </div>
          )}

          <div className="info-actions">
            <button
              className={`cry ${playing ? 'is-playing' : ''}`}
              onClick={playCry}
              disabled={!p.cries?.latest}
              aria-label="Play cry"
            >
              <span className="cry__bars" aria-hidden="true"><i /><i /><i /></span>
              Hear cry
            </button>
            <button
              className={`catch-btn ${caught ? 'is-on' : ''}`}
              aria-pressed={caught}
              onClick={() => toggleCaught(cid)}
            >
              <span className="ball" aria-hidden="true" /> {caught ? 'Caught' : 'Catch'}
            </button>
            <div className="types">
              {p.types.map(t => (
                <span key={t.type.name} className="type" style={typeStyle(t.type.name)}>{t.type.name}</span>
              ))}
            </div>
          </div>

          {flavor && (
            <div className="flavor-wrap">
              <p className="flavor">{flavor}</p>
              {entries.length > 1 && (
                <label className="flavor-ver-wrap">
                  Pokédex entry from{' '}
                  <select className="flavor-ver" value={fIdx} onChange={e => setFlavorIdx(Number(e.target.value))}>
                    {entries.map((e, i) => (
                      <option key={i} value={i}>{e.version ? pretty(e.version) : `Entry ${i + 1}`}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          )}

          <dl className="facts">
            {facts.map(([label, value]) => (
              <div className="fact" key={label}>
                <dt>{label}</dt>
                <dd className={label === 'Height' || label === 'Weight' ? 'mono' : undefined}>{value}</dd>
              </div>
            ))}
          </dl>

          {abilities.length > 0 && (
            <section className="block">
              <h2>Abilities</h2>
              <div className="abilities">
                {abilities.map(a => (
                  <div className="ability" key={a.name}>
                    <strong>
                      <a className="link" href={`#/ability/${a.name}`}>{pretty(a.name)}</a>
                      {a.hidden && <em> · hidden</em>}
                    </strong>
                    {a.effect && <span>{a.effect}</span>}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="block">
            <h2>Base stats <span className="bst">Total {bst}</span></h2>
            <div className="stats-viz"><StatRadar stats={radarStats} color={primaryColor} /></div>
            {evs && <p className="ev">EV yield: <b>{evs}</b></p>}
          </section>

          <section className="block">
            <h2>Type defenses</h2>
            <div className="eff">
              {[['Weak to', weak], ['Resists', resist], ['Immune to', immune]].map(([label, group]) =>
                group.length > 0 && (
                  <div className="eff__row" key={label}>
                    <span className="eff__label">{label}</span>
                    <div className="eff__items">
                      {group.map(([t, m]) => (
                        <span key={t} className="type type--sm" style={typeStyle(t)}>
                          {t} <b>{multLabel(m)}</b>
                        </span>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          </section>

          {evo.length > 1 && (
            <section className="block">
              <h2>Evolution line</h2>
              <div className="evo__row">
                {evo.map((e, i) => (
                  <span key={e.id} style={{ display: 'contents' }}>
                    {i > 0 && (
                      <span className="evo__arrow">
                        <span className="evo__cond">{evoCondition(e.how)}</span>→
                      </span>
                    )}
                    <a className={`evo__stage ${e.id === cid ? 'is-current' : ''}`} href={`#/p/${e.id}`}>
                      <img loading="lazy" alt={pretty(e.name)}
                           src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${e.id}.png`}
                           onError={ev => { ev.target.onerror = null; ev.target.src = SPRITE(e.id) }} />
                      <span>{pretty(e.name)}</span>
                    </a>
                  </span>
                ))}
              </div>
            </section>
          )}

          {locations.length > 0 && (
            <section className="block">
              <h2>Where to find</h2>
              <div className="locs">
                {locations.map(l => <span className="loc" key={l}>{l}</span>)}
              </div>
            </section>
          )}

          {moves.length > 0 && (
            <details className="moves">
              <summary>Moves learned by level-up <span>({moves.length})</span></summary>
              <div className="moves__list">
                {moves.map(m => <MoveRow key={m.name} name={m.name} level={m.level} />)}
              </div>
            </details>
          )}
        </div>
      </article>
    </>
  )
}

// Prev/next by national dex number (uses the species id, stable across forms).
function prevNext(p) {
  const id = Number(p.species.url.split('/').filter(Boolean).pop())
  return (
    <>
      {id > 1 ? <a href={`#/p/${id - 1}`}>← {pad(id - 1)}</a> : <span>←</span>}
      {id < MAX_DEX ? <a href={`#/p/${id + 1}`}>{pad(id + 1)} →</a> : <span>→</span>}
    </>
  )
}
