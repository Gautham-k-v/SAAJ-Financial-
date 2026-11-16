import { customerInitials } from '../../utils/customers'

const sizes = {
  sm: 'h-14 w-14 text-sm',
  md: 'h-20 w-20 text-base',
  lg: 'h-28 w-28 text-xl',
}

export function CustomerPhoto({ name, photograph, size = 'md' }) {
  const frame = `shrink-0 rounded-2xl object-cover ${sizes[size]}`

  if (photograph) {
    return <img src={photograph} alt="" className={frame} />
  }

  return (
    <div className={`grid place-items-center bg-navy-900 font-semibold text-white ${frame}`}>
      {name.trim() ? customerInitials(name) : 'CU'}
    </div>
  )
}
