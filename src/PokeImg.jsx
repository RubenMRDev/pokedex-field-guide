import { useState } from 'react'
import { ARTWORK, SPRITE } from './api.js'

// Official artwork with a graceful fallback to the basic sprite.
export default function PokeImg({ id, alt, className, lazy }) {
  const [src, setSrc] = useState(ARTWORK(id))
  return (
    <img
      className={className}
      alt={alt}
      src={src}
      loading={lazy ? 'lazy' : undefined}
      onError={() => { if (src !== SPRITE(id)) setSrc(SPRITE(id)) }}
    />
  )
}
