/* PokéAPI access + shared helpers. No deps. */

const API = 'https://pokeapi.co/api/v2'
export const ARTWORK = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
export const SPRITE  = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
export const MAX_DEX = 1025   // ponytail: cap at last species; forms (id>10000) excluded — no official artwork

// Canonical franchise type colours (the recognisable badge palette). Single source of
// truth for badges, chips, plates and stat bars; tints are derived in CSS via color-mix.
export const TYPE = {
  normal: '#A8A77A', fire: '#EE8130', water: '#6390F0', electric: '#F7D02C',
  grass: '#7AC74C', ice: '#96D9D6', fighting: '#C22E28', poison: '#A33EA1',
  ground: '#E2BF65', flying: '#A98FF3', psychic: '#F95587', bug: '#A6B91A',
  rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC', dark: '#705746',
  steel: '#B7B7CE', fairy: '#D685AD',
}

// Relative luminance, to choose readable text on a solid type badge.
const lum = hex => {
  const n = parseInt(hex.slice(1), 16)
  return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255
}

// CSS custom props for a type: --tc the colour, --tk readable text on it (React style object).
export const typeStyle = t => {
  const c = TYPE[t] || '#777777'
  return { '--tc': c, '--tk': lum(c) > 0.62 ? 'oklch(0.30 0.03 70)' : 'oklch(0.98 0.01 250)' }
}

export const STAT_LABELS = {
  hp: 'HP', attack: 'Attack', defense: 'Defense',
  'special-attack': 'Sp. Atk', 'special-defense': 'Sp. Def', speed: 'Speed',
}

const cache = new Map()
export async function api(path) {
  const url = path.startsWith('http') ? path : API + path
  if (cache.has(url)) return cache.get(url)
  const res = await fetch(url)
  if (!res.ok) throw new Error(res.status)
  const data = await res.json()
  cache.set(url, data)
  return data
}

export const idFromUrl = url => Number(url.split('/').filter(Boolean).pop())
export const pretty = s => s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
export const pad = n => String(n).padStart(4, '0')

export function pickFlavor(s) {
  if (!s) return ''
  const e = s.flavor_text_entries.find(x => x.language.name === 'en')
  return e ? e.flavor_text.replace(/[\n\f\r]+/g, ' ').trim() : ''
}

// ponytail: branching evolution trees (Eevee etc.) are flattened into one ordered list.
// `how` carries the evolution_details that produced this stage from its parent.
export function flattenEvo(node, acc = [], how = null) {
  acc.push({ name: node.species.name, id: idFromUrl(node.species.url), how })
  node.evolves_to.forEach(child => flattenEvo(child, acc, child.evolution_details[0]))
  return acc
}

export function evoCondition(d) {
  if (!d) return ''
  if (d.min_level) return `Lv. ${d.min_level}`
  if (d.item) return `Use ${pretty(d.item.name)}`
  if (d.trigger?.name === 'trade') return d.held_item ? `Trade holding ${pretty(d.held_item.name)}` : 'Trade'
  if (d.min_happiness) return 'High friendship'
  if (d.min_affection) return 'High affection'
  if (d.known_move_type) return `Knows ${pretty(d.known_move_type.name)} move`
  if (d.location) return `At ${pretty(d.location.name)}`
  if (d.trigger?.name) return pretty(d.trigger.name)
  return ''
}

// All 18 /type endpoints, fetched once and memoised. Powers filtering, card colours,
// and the defensive type chart. byId: id -> [type names]; byType: name -> full type json.
let typesPromise = null
export function loadTypes() {
  if (typesPromise) return typesPromise
  const names = Object.keys(TYPE)
  typesPromise = Promise.all(names.map(t => api(`/type/${t}`))).then(list => {
    const byType = {}, byId = new Map()
    list.forEach((data, i) => {
      const name = names[i]
      byType[name] = data
      data.pokemon.forEach(({ slot, pokemon }) => {
        const id = idFromUrl(pokemon.url)
        const arr = byId.get(id) || []
        arr[slot - 1] = name
        byId.set(id, arr)
      })
    })
    byId.forEach((arr, id) => byId.set(id, arr.filter(Boolean)))
    return { byType, byId }
  })
  return typesPromise
}

// Defensive multipliers: attacking type name -> damage taken (0, 0.25, 0.5, 1, 2, 4).
export function defenseChart(pokeTypes, byType) {
  const mult = Object.fromEntries(Object.keys(TYPE).map(t => [t, 1]))
  pokeTypes.forEach(t => {
    const dr = byType[t]?.damage_relations
    if (!dr) return
    dr.double_damage_from.forEach(x => { mult[x.name] *= 2 })
    dr.half_damage_from.forEach(x => { mult[x.name] *= 0.5 })
    dr.no_damage_from.forEach(x => { mult[x.name] *= 0 })
  })
  return mult
}
export const multLabel = m => (m === 0.25 ? '¼×' : m === 0.5 ? '½×' : m === 0 ? '0×' : `${m}×`)

// Level-up moves, deduped to earliest level, sorted. ponytail: level-up only (the dex staple);
// machine/tutor/egg moves omitted.
export function levelMoves(p) {
  const seen = new Map()
  p.moves.forEach(m => {
    const levels = m.version_group_details
      .filter(d => d.move_learn_method.name === 'level-up')
      .map(d => d.level_learned_at)
    if (!levels.length) return
    const lv = Math.min(...levels)
    if (!seen.has(m.move.name) || lv < seen.get(m.move.name)) seen.set(m.move.name, lv)
  })
  return [...seen]
    .map(([name, level]) => ({ name, level }))
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
}

const REGION = {
  'generation-i': 'Kanto', 'generation-ii': 'Johto', 'generation-iii': 'Hoenn',
  'generation-iv': 'Sinnoh', 'generation-v': 'Unova', 'generation-vi': 'Kalos',
  'generation-vii': 'Alola', 'generation-viii': 'Galar', 'generation-ix': 'Paldea',
}
export const regionOf = gen => REGION[gen] || pretty(gen || '')

export function genderText(rate) {
  if (rate < 0) return 'Genderless'
  const f = (rate / 8) * 100
  const fmt = n => (Number.isInteger(n) ? n : n.toFixed(1))
  return `${fmt(100 - f)}% ♂ · ${fmt(f)}% ♀`
}

// English short effect for an ability (falls back to a flavor entry).
export function abilityEffect(json) {
  if (!json) return ''
  const e = json.effect_entries?.find(x => x.language.name === 'en')
  if (e?.short_effect) return e.short_effect
  return json.flavor_text_entries?.find(x => x.language.name === 'en')?.flavor_text || ''
}

// Unique English Pokédex entries with the game they came from (ordered oldest -> newest).
export function flavorEntries(s) {
  if (!s) return []
  const seen = new Set(), out = []
  s.flavor_text_entries.forEach(e => {
    if (e.language.name !== 'en') return
    const text = e.flavor_text.replace(/[\n\f\r]+/g, ' ').trim()
    if (seen.has(text)) return
    seen.add(text)
    out.push({ version: e.version?.name || '', text })
  })
  return out
}

// EV yield, e.g. "2 Sp. Atk".
export const evYield = p =>
  p.stats.filter(s => s.effort > 0)
    .map(s => `${s.effort} ${STAT_LABELS[s.stat.name] || pretty(s.stat.name)}`)
    .join(', ')

// Short label for an alternate form ("charizard-mega-x" -> "Mega X", default -> "Base").
export function formLabel(varietyName, speciesName) {
  const f = varietyName.startsWith(speciesName + '-')
    ? varietyName.slice(speciesName.length + 1)
    : (varietyName === speciesName ? '' : varietyName)
  return f ? pretty(f) : 'Base'
}
