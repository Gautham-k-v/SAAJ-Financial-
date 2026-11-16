import { CircleAlert } from 'lucide-react'
import { Button } from './Button'

export function ErrorState({ title, message, onRetry }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-white px-6 py-14 text-center shadow-sm" role="alert">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-rose-50 text-rose-700">
        <CircleAlert className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-navy-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{message}</p>
      {onRetry ? (
        <Button className="mt-6" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}
