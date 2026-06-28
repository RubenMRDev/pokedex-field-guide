// Crisp SVG Poké Ball; colours and size are driven by CSS (.pball*).
export default function Ball({ className = '' }) {
  return (
    <svg className={`pball ${className}`} viewBox="0 0 100 100" aria-hidden="true">
      <path className="pball__top" d="M5 50a45 45 0 0 1 90 0Z" />
      <path className="pball__bot" d="M5 50a45 45 0 0 0 90 0Z" />
      <line className="pball__band" x1="6" y1="50" x2="94" y2="50" />
      <circle className="pball__ring" cx="50" cy="50" r="45" />
      <circle className="pball__btn" cx="50" cy="50" r="15" />
      <circle className="pball__core" cx="50" cy="50" r="8" />
    </svg>
  )
}
