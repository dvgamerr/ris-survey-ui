import { useState } from 'preact/hooks'
import { authClient } from '../lib/auth-client'
import { toast } from '../lib/toast'

export default function AuthForm () {
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: Event) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      const res = mode === 'in'
        ? await authClient.signIn.email({ email: email.trim(), password })
        : await authClient.signUp.email({ name: name.trim(), email: email.trim(), password })
      if (res.error) {
        toast(mode === 'in' ? 'Email or Password wrong.' : (res.error.message || 'Sign-up failed.'), 'error')
        setBusy(false)
        return
      }
      location.href = '/'
    } catch (ex: any) {
      toast(ex?.message || 'Request failed.', 'error')
      setBusy(false)
    }
  }

  return (
    <div class="login-form">
      <h2 data-testid="auth-title">{mode === 'in' ? 'Sign-In' : 'Register'}</h2>
      <form onSubmit={onSubmit} class="mt-3">
        {mode === 'up' && (
          <div class="form-group">
            <label for="name">Name</label>
            <input id="name" class="form-control" required maxLength={50} value={name} onInput={e => setName((e.target as HTMLInputElement).value)} placeholder="Your name" />
          </div>
        )}
        <div class="form-group">
          <label for="email">Email</label>
          <input id="email" type="email" class="form-control" required value={email} onInput={e => setEmail((e.target as HTMLInputElement).value)} placeholder="you@example.com" />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input id="password" type="password" class="form-control" required minLength={6} value={password} onInput={e => setPassword((e.target as HTMLInputElement).value)} placeholder="Password" />
        </div>
        <button type="submit" class="btn btn-success" disabled={busy}>
          {busy ? 'Please wait...' : mode === 'in' ? 'Login' : 'Register'}
        </button>
        <button type="button" class="btn btn-link" data-testid="auth-toggle" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>
          {mode === 'in' ? 'Create an account' : 'I already have an account'}
        </button>
      </form>
    </div>
  )
}
