import { useSyncExternalStore } from 'react'

// Tiny "caught" store backed by localStorage, shared across the app.
const KEY = 'pokedex-caught'
let ids = new Set()
try { ids = new Set(JSON.parse(localStorage.getItem(KEY) || '[]')) } catch {}

let version = 0
const subs = new Set()
const emit = () => { version++; subs.forEach(f => f()) }

export const isCaught = id => ids.has(id)
export const caughtCount = () => ids.size
export function toggleCaught(id) {
  if (ids.has(id)) ids.delete(id); else ids.add(id)
  try { localStorage.setItem(KEY, JSON.stringify([...ids])) } catch {}
  emit()
}

const subscribe = fn => { subs.add(fn); return () => subs.delete(fn) }
// Subscribe a component to caught changes; returns a version that bumps on every toggle.
export const useCaughtStore = () => useSyncExternalStore(subscribe, () => version)
