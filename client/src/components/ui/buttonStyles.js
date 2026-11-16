const variants = {
  primary: 'bg-teal-700 text-white hover:bg-teal-800 focus-visible:outline-teal-700',
  secondary:
    'border border-slate-200 bg-white text-navy-900 hover:bg-slate-50 focus-visible:outline-teal-700',
}

const sizes = {
  md: 'h-11 px-4 text-sm',
  sm: 'h-9 px-3 text-sm',
}

export function buttonClasses({ variant = 'primary', size = 'md', className = '' } = {}) {
  return `inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`
}
