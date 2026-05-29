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

        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h1 style={{ fontSize: '22px', marginBottom: '6px', color: 'var(--text)' }}>
            Bem-vindo de volta
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: '14px' }}>
            Entre com sua conta para continuar
          </p>
        </div>

        {error && <Alert type="error" style={{ marginBottom: 'var(--space-5)' }}>{error}</Alert>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
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
              style={{ fontSize: '13px', color: 'var(--text-2)' }}
            >
              Esqueci minha senha
            </Link>
          </div>

          <Button type="submit" fullWidth loading={loading} style={{ marginTop: 'var(--space-2)' }}>
            Entrar
          </Button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: '14px', color: 'var(--text-2)' }}>
          Primeira vez aqui?{' '}
          <Link to="/cadastro" style={{ color: 'var(--aria-action)', fontWeight: '600' }}>
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  )
}

function Logo() {
  return (
    <div style={{ marginBottom: 'var(--space-10)', display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        width: '36px', height: '36px',
        background: 'var(--aria-action)',
        borderRadius: 'var(--radius-sm)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 2C10 2 4 5 4 10.5C4 14 6.5 17 10 17C13.5 17 16 14 16 10.5C16 5 10 2 10 2Z" fill="white" fillOpacity="0.9"/>
          <circle cx="10" cy="10.5" r="2.5" fill="var(--aria-action)"/>
        </svg>
      </div>
      <span style={{ fontSize: '20px', fontWeight: '600', letterSpacing: '-0.02em', color: 'var(--text)' }}>
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
  padding: 'var(--space-6) var(--space-5)',
  background: 'var(--bg)'
}

const cardStyle = {
  width: '100%',
  maxWidth: '400px',
  background: 'var(--surface)',
  borderRadius: 'var(--radius-lg)',
  padding: '36px 32px',
  border: '1px solid var(--border)',
  boxShadow: 'var(--shadow-md)'
}
