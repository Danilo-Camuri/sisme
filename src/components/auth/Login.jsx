import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Input, Button, Alert } from '../ui/FormElements'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', senha: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.email || !form.senha) {
      setError('Preencha e-mail e senha.')
      return
    }

    setLoading(true)
    const result = await login(form)
    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    navigate('/')
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <Logo />

        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '22px', marginBottom: '6px', fontWeight: 700, color: 'var(--text)' }}>
            bem-vindo de volta
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: '14px' }}>
            entre com sua conta para continuar
          </p>
        </div>

        {error && <Alert type="error" style={{ marginBottom: '20px' }}>{error}</Alert>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="E-mail"
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="seu@email.com"
            autoComplete="email"
            autoFocus
          />

          <Input
            label="Senha"
            type="password"
            value={form.senha}
            onChange={set('senha')}
            placeholder="••••••••"
            autoComplete="current-password"
          />

          <div style={{ textAlign: 'right', marginTop: '-8px' }}>
            <Link
              to="/recuperar-senha"
              style={{ fontSize: '13px', color: 'var(--muted)' }}
            >
              esqueci minha senha
            </Link>
          </div>

          <Button onClick={handleSubmit} fullWidth loading={loading} style={{ marginTop: '8px' }}>
            entrar
          </Button>
        </div>

        <p style={{ textAlign: 'center', marginTop: '28px', fontSize: '14px', color: 'var(--text-2)' }}>
          primeira vez aqui?{' '}
          <Link to="/cadastro" style={{ color: 'var(--aria-action)', fontWeight: '600' }}>
            criar conta
          </Link>
        </p>
      </div>
    </div>
  )
}

function Logo() {
  return (
    <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
      {/* Orb da ARIA — gradiente multicolor */}
      <div style={{
        width: '40px', height: '40px',
        borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 35%, #C8A6FF 0%, #FF9FCB 45%, #9FDFFF 75%, #FFD580 100%)',
        boxShadow: '0 0 20px rgba(200,166,255,0.4), 0 0 40px rgba(255,159,203,0.15)',
        flexShrink: 0,
      }} />
      <span style={{
        fontFamily: 'var(--font-display)',
        fontSize: '20px',
        fontWeight: '700',
        letterSpacing: '0.06em',
        color: 'var(--text)',
      }}>
        ARIA
      </span>
    </div>
  )
}

const pageStyle = {
  minHeight: '100dvh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px 20px',
  background: 'var(--bg)',
}

const cardStyle = {
  width: '100%',
  maxWidth: '400px',
  background: 'var(--surface)',
  borderRadius: 'var(--radius-lg)',
  padding: '36px 32px',
  border: '1px solid var(--border)',
  boxShadow: 'var(--shadow-md)',
}
