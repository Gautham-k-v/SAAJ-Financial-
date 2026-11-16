const tones = {
  light: 'text-slate-600 hover:bg-slate-100',
  dark: 'text-slate-300 hover:bg-white/10 hover:text-white',
}

export function IconButton({ label, tone = 'light', className = '', ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`grid h-10 w-10 place-items-center rounded-lg transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 ${tones[tone]} ${className}`}
      {...props}
    />
  )
}
