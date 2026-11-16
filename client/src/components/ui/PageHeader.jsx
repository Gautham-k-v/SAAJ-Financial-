export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">{eyebrow}</p>
        ) : null}
        <h1 className={`text-2xl font-semibold tracking-tight text-navy-900 ${eyebrow ? 'mt-1' : ''}`}>
          {title}
        </h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p> : null}
      </div>
      {actions}
    </div>
  )
}
