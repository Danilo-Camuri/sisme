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
          <h1 style={{ fontSize: '22px', marginBottom: '6px' }}>Bem-vindo de volta</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Entre com sua conta para continuar
          </p>
        </div>

        {error && <Alert type="error" style={{ marginBottom: '20px' }}>{error}</Alert>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
              style={{ fontSize: '13px', color: 'var(--text-secondary)' }}
            >
              Esqueci minha senha
            </Link>
          </div>

          <Button type="submit" fullWidth loading={loading} style={{ marginTop: '8px' }}>
            Entrar
          </Button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '28px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Primeira vez aqui?{' '}
          <Link to="/cadastro" style={{ color: 'var(--accent-primary)', fontWeight: '500' }}>
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  )
}

function Logo() {
  return (
    <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        width: '36px', height: '36px',
        background: 'var(--accent-primary)',
        borderRadius: '10px',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 2C10 2 4 5 4 10.5C4 14 6.5 17 10 17C13.5 17 16 14 16 10.5C16 5 10 2 10 2Z" fill="white" fillOpacity="0.9"/>
          <circle cx="10" cy="10.5" r="2.5" fill="var(--accent-primary)"/>
        </svg>
      </div>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '600', letterSpacing: '-0.02em' }}>
        SISME
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
  background: `radial-gradient(ellipse at top, rgba(124,106,247,0.12) 0%, var(--bg) 60%)`
}

const cardStyle = {
  width: '100%',
  maxWidth: '400px',
  background: 'var(--bg-card)',
  borderRadius: 'var(--radius-lg)',
  padding: '36px 32px',
  border: '1px solid var(--border)'
}
