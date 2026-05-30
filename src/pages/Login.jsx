import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { signIn } = useAuth()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await signIn(email, password)
    if (error) setError('Correo o contraseña incorrectos')
    setLoading(false)
  }

  return (
    <div style={{
      width: '100%', maxWidth: 430, height: '100%',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', padding: '32px 24px'
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 20,
          background: 'var(--gg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <i className="ti ti-wallet" style={{ fontSize: 32, color: 'var(--white)' }} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
          Mis finanzas
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text2)' }}>Bienvenida, Daniela</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="toast toast--error" style={{ position: 'static', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Correo electrónico</label>
          <input
            className="form-input"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@correo.cl"
            required
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Contraseña</label>
          <input
            className="form-input"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          className="btn btn--primary"
          disabled={loading}
          style={{ marginTop: 8 }}
        >
          {loading ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Entrar'}
        </button>
      </form>

      <p style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', marginTop: 20 }}>
        ¿Olvidaste tu contraseña? Escríbele a César 😄
      </p>
    </div>
  )
}
