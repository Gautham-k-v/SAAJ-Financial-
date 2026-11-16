export function EmptyState({ title, description }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="text-sm font-semibold text-navy-900">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{description}</p>
    </div>
  )
}
