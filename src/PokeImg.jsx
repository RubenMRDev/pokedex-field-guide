import { useState } from 'react'
import { ARTWORK, SPRITE } from './api.js'

// Official artwork with a shimmer skeleton until it loads, and a fallback to the basic sprite.
export default function PokeImg({ id, alt, className, lazy }) {
  const [src, setSrc] = useState(ARTWORK(id))
  const [loaded, setLoaded] = useState(false)
  return (
    <>
      {!loaded && <span className="img-skel skel" aria-hidden="true" />}
      <img
        className={className}
        alt={alt}
        src={src}
        loading={lazy ? 'lazy' : undefined}
        style={{ opacity: loaded ? 1 : 0 }}
        onLoad={() => setLoaded(true)}
        onError={() => { if (src !== SPRITE(id)) setSrc(SPRITE(id)); else setLoaded(true) }}
      />
    </>
  )
}
