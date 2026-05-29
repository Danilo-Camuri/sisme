import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Input, Button, Alert } from '../ui/FormElements'
import { supabase } from '../../lib/supabase'

export function RecuperarSenha() {
  const { recuperarSenha } = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) {
      setStatus('error')
      setMessage('Informe seu e-mail.')
      return
    }

    setLoading(true)
    const result = await recuperarSenha(email)
    setLoading(false)

    if (result.error) {
      setStatus('error')
      setMessage(result.error)
    } else {
      setStatus('success')
      setMessage(`Enviamos um link para ${email}. Verifique sua caixa de entrada e pasta de spam.`)
    }
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <Logo />

        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '20px', marginBottom: '6px', color: 'var(--text)' }}>Recuperar senha</h1>
          <p style={{ color: 'var(--text-2)', fontSize: '14px' }}>
            Informe seu e-mail e enviaremos um link para criar uma nova senha
          </p>
        </div>

        {status && (
          <div style={{ marginBottom: '20px' }}>
            <Alert type={status}>{message}</Alert>
          </div>
        )}

        {status !== 'success' && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="E-mail"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoFocus
            />
            <Button type="submit" fullWidth loading={loading}>
              Enviar link de recuperação
            </Button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-2)' }}>
          <Link to="/login" style={{ color: 'var(--aria-action)' }}>Voltar para o login</Link>
        </p>
      </div>
    </div>
  )
}

export function NovaSenha() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ senha: '', senhaConfirm: '' })
  const [errors, setErrors] = useState({})
  const [globalError, setGlobalError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field) {
    return e => {
      setForm(f => ({ ...f, [field]: e.target.value }))
      setErrors(er => ({ ...er, [field]: '' }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = {}

    if (!form.senha) errs.senha = 'Informe a nova senha'
    else if (form.senha.length < 8) errs.senha = 'Mínimo 8 caracteres'
    if (form.senha !== form.senhaConfirm) errs.senhaConfirm = 'As senhas não coincidem'

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: form.senha })
    setLoading(false)

    if (error) {
      setGlobalError('Não foi possível atualizar a senha. O link pode ter expirado.')
      return
    }

    navigate('/', { replace: true })
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <Logo />

        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '20px', marginBottom: '6px', color: 'var(--text)' }}>Nova senha</h1>
          <p style={{ color: 'var(--text-2)', fontSize: '14px' }}>
            Crie uma senha nova para sua conta
          </p>
        </div>

        {globalError && (
          <div style={{ marginBottom: '20px' }}>
            <Alert type="error">{globalError}</Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Nova senha"
            type="password"
            value={form.senha}
            onChange={set('senha')}
            placeholder="Mínimo 8 caracteres"
            error={errors.senha}
            autoFocus
          />
          <Input
            label="Confirme a nova senha"
            type="password"
            value={form.senhaConfirm}
            onChange={set('senhaConfirm')}
            placeholder="Repita a senha"
            error={errors.senhaConfirm}
          />
          <Button type="submit" fullWidth loading={loading} style={{ marginTop: '8px' }}>
            Salvar nova senha
          </Button>
        </form>
      </div>
    </div>
  )
}

function Logo() {
  return (
    <div style={{ marginBottom: '36px', display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        width: '36px', height: '36px',
        background: 'var(--aria-action)',
        borderRadius: '10px',
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
  padding: '24px 20px',
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
