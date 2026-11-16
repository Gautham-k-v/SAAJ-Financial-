export function SaajMark({ tone = 'navy', className = 'h-9 w-9' }) {
  const background = tone === 'teal' ? '#0F766E' : '#0C2341'

  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill={background} />
      <rect x="8" y="8" width="16" height="4" rx="2" fill="#5EEAD4" />
      <rect x="8" y="14" width="10" height="4" rx="2" fill="#FFFFFF" />
      <rect x="8" y="20" width="16" height="4" rx="2" fill="#99F6E4" />
    </svg>
  )
}

export function SaajWordmark({ light = false, markTone }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <SaajMark tone={markTone ?? (light ? 'teal' : 'navy')} />
      <span
        className={`text-lg font-semibold tracking-[0.16em] ${light ? 'text-white' : 'text-navy-900'}`}
      >
        SAAJ
      </span>
    </span>
  )
}
