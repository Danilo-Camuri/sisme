import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Input, Button, Alert } from '../ui/FormElements'

const STEPS = ['escola', 'conta', 'senha']
const TITLES = ['Sua escola', 'Seus dados', 'Sua senha']
const SUBTITLES = [
  'Informe o código da escola e sua matrícula',
  'Como vamos te chamar e como te encontrar',
  'Crie uma senha para proteger sua conta'
]

export default function Cadastro() {
  const { validarEscolaMatricula, cadastrar } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    codigoEscola: '',
    matricula: '',
    nome: '',
    email: '',
    senha: '',
    senhaConfirm: ''
  })
  // Guardamos escolaId e alunoId após validação do step 0
  const [validacao, setValidacao] = useState({ escolaId: null, alunoId: null })
  const [errors, setErrors] = useState({})
  const [globalError, setGlobalError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmacaoEmail, setConfirmacaoEmail] = useState(false)

  function set(field) {
    return e => {
      setForm(f => ({ ...f, [field]: e.target.value }))
      setErrors(er => ({ ...er, [field]: '' }))
      setGlobalError('')
    }
  }

  function validateLocal() {
    const errs = {}
    if (step === 0) {
      if (!form.codigoEscola.trim()) errs.codigoEscola = 'Informe o código da escola'
      if (!form.matricula.trim()) errs.matricula = 'Informe sua matrícula'
    }
    if (step === 1) {
      if (!form.nome.trim()) errs.nome = 'Informe seu nome'
      if (!form.email.trim()) errs.email = 'Informe seu e-mail'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'E-mail inválido'
    }
    if (step === 2) {
      if (!form.senha) errs.senha = 'Crie uma senha'
      else if (form.senha.length < 8) errs.senha = 'Mínimo 8 caracteres'
      if (form.senha !== form.senhaConfirm) errs.senhaConfirm = 'As senhas não coincidem'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleNext(e) {
    e.preventDefault()
    if (!validateLocal()) return

    // Step 0: valida escola e matrícula no servidor antes de avançar
    if (step === 0) {
      setLoading(true)
      const result = await validarEscolaMatricula({
        codigoEscola: form.codigoEscola,
        matricula: form.matricula
      })
      setLoading(false)

      if (result.error) {
        setGlobalError(result.error)
        return
      }

      setValidacao({ escolaId: result.escolaId, alunoId: result.alunoId })
      setStep(1)
      return
    }

    // Steps intermediários: avança
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
      return
    }

    // Step final: cria a conta
    setLoading(true)
    const result = await cadastrar({
      email: form.email,
      senha: form.senha,
      nome: form.nome,
      escolaId: validacao.escolaId,
      alunoId: validacao.alunoId
    })
    setLoading(false)

    if (result.error) {
      setGlobalError(result.error)
      return
    }

    if (result.confirmacaoEmail) {
      setConfirmacaoEmail(true)
    } else {
      navigate('/')
    }
  }

  if (confirmacaoEmail) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <Logo />
          <Alert type="success">
            <div>
              <strong>Confirme seu e-mail</strong>
              <p style={{ marginTop: '6px', lineHeight: '1.5' }}>
                Enviamos um link de confirmação para <strong>{form.email}</strong>.
                Clique no link para ativar sua conta e depois volte aqui para entrar.
              </p>
            </div>
          </Alert>
          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-2)' }}>
            <Link to="/login" style={{ color: 'var(--aria-action)' }}>Voltar para o login</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <Logo />
        <StepIndicator step={step} total={STEPS.length} />

        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '20px', marginBottom: '4px' }}>{TITLES[step]}</h1>
          <p style={{ color: 'var(--text-2)', fontSize: '14px' }}>{SUBTITLES[step]}</p>
        </div>

        {globalError && (
          <div style={{ marginBottom: '20px' }}>
            <Alert type="error">{globalError}</Alert>
          </div>
        )}

        <form onSubmit={handleNext} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {step === 0 && (
            <>
              <Input
                label="Código da escola"
                value={form.codigoEscola}
                onChange={set('codigoEscola')}
                placeholder="Ex: TESTE2025"
                error={errors.codigoEscola}
                hint="Você recebeu este código da sua escola"
                autoCapitalize="characters"
                autoFocus
              />
              <Input
                label="Matrícula"
                value={form.matricula}
                onChange={set('matricula')}
                placeholder="Seu número de matrícula"
                error={errors.matricula}
                hint="O mesmo número que aparece no seu boletim"
              />
            </>
          )}

          {step === 1 && (
            <>
              <Input
                label="Seu nome"
                value={form.nome}
                onChange={set('nome')}
                placeholder="Como você quer ser chamado"
                error={errors.nome}
                autoFocus
              />
              <Input
                label="E-mail"
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="seu@email.com"
                error={errors.email}
                hint="Usado para recuperar sua senha"
                autoComplete="email"
              />
            </>
          )}

          {step === 2 && (
            <>
              <Input
                label="Crie uma senha"
                type="password"
                value={form.senha}
                onChange={set('senha')}
                placeholder="Mínimo 8 caracteres"
                error={errors.senha}
                autoComplete="new-password"
                autoFocus
              />
              <Input
                label="Confirme a senha"
                type="password"
                value={form.senhaConfirm}
                onChange={set('senhaConfirm')}
                placeholder="Repita a senha"
                error={errors.senhaConfirm}
                autoComplete="new-password"
              />
            </>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            {step > 0 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setStep(s => s - 1); setGlobalError('') }}
                style={{ flex: 1 }}
              >
                Voltar
              </Button>
            )}
            <Button type="submit" loading={loading} style={{ flex: 2 }}>
              {step < STEPS.length - 1 ? 'Continuar' : 'Criar conta'}
            </Button>
          </div>
        </form>

        <p style={{ textAlign: 'center', marginTop: '28px', fontSize: '14px', color: 'var(--text-2)' }}>
          Já tem conta?{' '}
          <Link to="/login" style={{ color: 'var(--aria-action)', fontWeight: '500' }}>
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}

function StepIndicator({ step, total }) {
  return (
    <div style={{ display: 'flex', gap: '6px', marginBottom: '28px' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height: '3px', flex: 1, borderRadius: '2px',
          background: i <= step ? 'var(--aria-action)' : 'var(--border)',
          transition: 'background 0.3s'
        }} />
      ))}
    </div>
  )
}

function Logo() {
  return (
    <div style={{ marginBottom: '36px', display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        width: '36px', height: '36px', background: 'var(--aria-action)',
        borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 2C10 2 4 5 4 10.5C4 14 6.5 17 10 17C13.5 17 16 14 16 10.5C16 5 10 2 10 2Z" fill="white" fillOpacity="0.9"/>
          <circle cx="10" cy="10.5" r="2.5" fill="var(--aria-action)"/>
        </svg>
      </div>
      <span style={{ fontFamily: 'var(--font)', fontSize: '20px', fontWeight: '600', letterSpacing: '-0.02em' }}>
        SISME
      </span>
    </div>
  )
}

const pageStyle = {
  minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '24px 20px',
  background: `radial-gradient(ellipse at top, rgba(124,106,247,0.12) 0%, var(--bg) 60%)`
}

const cardStyle = {
  width: '100%', maxWidth: '400px', background: 'var(--surface)',
  borderRadius: 'var(--radius-lg)', padding: '36px 32px', border: '1px solid var(--border)'
}
