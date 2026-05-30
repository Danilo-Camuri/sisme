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
        <Logo />
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h1 style={{ fontSize: '22px', marginBottom: '6px', color: 'var(--text)' }}>
            bem-vindo de volta
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: '14px' }}>
            entre com sua conta para continuar
          </p>
        </div>
        {error && <Alert type="error" style={{ marginBottom: 'var(--space-5)' }}>{error}</Alert>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input label="E-mail" type="email" value={form.email} onChange={set('email')}
            placeholder="seu@email.com" autoComplete="email" autoFocus />
          <Input label="Senha" type="password" value={form.senha} onChange={set('senha')}
            placeholder="••••••••" autoComplete="current-password" />
          <div style={{ textAlign: 'right', marginTop: '-8px' }}>
            <Link to="/recuperar-senha" style={{ fontSize: '13px', color: 'var(--text-2)' }}>
              esqueci minha senha
            </Link>
          </div>
          <Button type="submit" fullWidth loading={loading} style={{ marginTop: 'var(--space-2)' }}>
            entrar
          </Button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: '14px', color: 'var(--text-2)' }}>
          primeira vez aqui?{' '}
          <Link to="/cadastro" style={{ color: 'var(--accent)', fontWeight: '600' }}>
            criar conta
          </Link>
        </p>
      </div>
    </div>
  )
}

function Logo() {
  return (
    <div style={{ marginBottom: 'var(--space-10)', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--orb-purple), var(--orb-pink))',
        boxShadow: 'var(--shadow-orb)',
        flexShrink: 0,
      }} />
      <span style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.02em', color: 'var(--text)' }}>
        ARIA
      </span>
    </div>
  )
}

const pageStyle = {
  minHeight: '100dvh', display: 'flex',
  alignItems: 'center', justifyContent: 'center',
  padding: 'var(--space-6) var(--space-5)',
  background: 'var(--bg)'
}

const cardStyle = {
  width: '100%', maxWidth: '400px',
  background: 'var(--surface)',
  borderRadius: 'var(--radius-lg)',
  padding: '36px 32px',
  border: '1px solid var(--border)',
  boxShadow: 'var(--shadow-md)'
}
