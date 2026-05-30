import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Input, Alert } from '../ui/FormElements'

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
    if (!form.email || !form.senha) { setError('Preencha e-mail e senha.'); return }
    setLoading(true)
    const result = await login(form)
    setLoading(false)
    if (result.error) { setError(result.error); return }
    navigate('/')
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>

        {/* Logo */}
        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'linear-gradient(135deg, #4F8EF7, #2DB87D)',
            boxShadow: '0 0 24px rgba(79,142,247,0.35)',
            flexShrink: 0,
          }} />
          <span style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.02em', color: 'var(--text)' }}>
            ARIA
          </span>
        </div>

        {/* Título */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '6px', color: 'var(--text)' }}>
            Bem-vindo de volta
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: '14px' }}>
            Entre com sua conta para continuar
          </p>
        </div>

        {error && (
          <div style={{ marginBottom: '20px' }}>
            <Alert type="error">{error}</Alert>
          </div>
        )}

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
            <Link to="/recuperar-senha" style={{ fontSize: '13px', color: 'var(--text-2)' }}>
              Esqueci minha senha
            </Link>
          </div>

          {/* Botão azul fixo — não depende de token nem de tema */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '8px',
              width: '100%',
              padding: '16px 24px',
              borderRadius: '9999px',
              border: 'none',
              background: loading ? 'rgba(79,142,247,0.6)' : '#4F8EF7',
              color: '#FFFFFF',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              minHeight: '52px',
              boxSizing: 'border-box',
              WebkitAppearance: 'none',
              transition: 'opacity 0.15s ease',
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-2)' }}>
          Primeira vez aqui?{' '}
          <Link to="/cadastro" style={{ color: '#4F8EF7', fontWeight: '600' }}>
            Criar conta
          </Link>
        </p>

      </div>
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
