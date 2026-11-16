import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { SaajWordmark } from '../../components/brand/SaajMark'
import { Button } from '../../components/ui/Button'
import { IconButton } from '../../components/ui/IconButton'
import { TextField } from '../../components/ui/TextField'
import { LoginShowcase } from '../../components/auth/LoginShowcase'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { endAgentSession, hasAgentSession } from '../../services/access'
import { notePreviewOpened } from '../../services/settingsService'
import { hasPreviewSession, startPreviewSession } from '../../utils/previewSession'

const emptyValues = { email: '', password: '' }

function validate(values) {
  const errors = {}
  const email = values.email.trim()

  if (!email) {
    errors.email = 'Enter the admin email address.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email address.'
  }

  if (!values.password) {
    errors.password = 'Enter the password.'
  } else if (values.password.length < 8) {
    errors.password = 'Use at least 8 characters.'
  }

  return errors
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [values, setValues] = useState(emptyValues)
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  useDocumentTitle('Sign in')

  if (hasPreviewSession()) {
    return <Navigate to="/dashboard" replace />
  }

  if (hasAgentSession()) {
    return <Navigate to="/agent" replace />
  }

  function update(field) {
    return (event) => {
      setValues((current) => ({ ...current, [field]: event.target.value }))
      setErrors((current) => ({ ...current, [field]: undefined }))
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)

    const firstInvalid = ['email', 'password'].find((field) => nextErrors[field])
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus()
      return
    }

    endAgentSession()
    startPreviewSession()
    notePreviewOpened()
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <LoginShowcase />
      <section className="flex items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <SaajWordmark />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">Administrator</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-navy-900">Sign in</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Open the daily book. Collection agents use their own sign-in and cannot open this desk.
          </p>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
            Sign-in does not check an account yet. Any valid email and a password of at least 8
            characters opens the dashboard preview.
          </div>

          <form className="mt-6 space-y-5" noValidate onSubmit={handleSubmit}>
            <TextField
              id="email"
              label="Email"
              type="email"
              name="email"
              autoComplete="username"
              inputMode="email"
              spellCheck={false}
              placeholder="admin@saaj.example"
              value={values.email}
              error={errors.email}
              onChange={update('email')}
            />
            <TextField
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              placeholder="At least 8 characters"
              value={values.password}
              error={errors.password}
              onChange={update('password')}
              trailing={
                <IconButton
                  label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </IconButton>
              }
            />
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>
          <p className="mt-6 text-sm text-slate-500">
            <Link to="/agent/login" className="font-semibold text-teal-800 hover:text-teal-900">
              Collection agent sign in
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}
