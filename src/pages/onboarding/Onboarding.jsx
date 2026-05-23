import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/FormElements'

const TOTAL_STEPS = 3

export default function Onboarding() {
  const { aluno } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [apelido, setApelido] = useState('')
  const [saving, setSaving] = useState(false)

  const nome = aluno?.nome?.split(' ')[0] ?? 'você'

  async function concluirOnboarding() {
    setSaving(true)
    await supabase
      .from('alunos')
      .update({
        apelido: apelido.trim() || nome,
        onboarding_ok: true,
      })
      .eq('id', aluno.id)
    setSaving(false)
    navigate('/', { replace: true })
  }

  return (
    <div style={shell}>
      {/* Progress dots */}
      <div style={dotsRow}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div key={i} style={{
            ...dot,
            background: i === step
              ? '#C8A6FF'
              : i < step
                ? 'rgba(200,166,255,0.4)'
                : 'rgba(255,255,255,0.1)'
          }} />
        ))}
      </div>

      <div style={content}>
        {step === 0 && <StepBoasVindas nome={nome} onNext={() => setStep(1)} />}
        {step === 1 && <StepSobreARIA onNext={() => setStep(2)} />}
        {step === 2 && (
          <StepApelido
            nome={nome}
            apelido={apelido}
            setApelido={setApelido}
            onConcluir={concluirOnboarding}
            saving={saving}
          />
        )}
      </div>
    </div>
  )
}

function StepBoasVindas({ nome, onNext }) {
  return (
    <div style={screen}>
      <div style={logoWrap}>
        <ARIALogo size={64} />
      </div>
      <div style={textBlock}>
        <h1 style={heading}>oi, {nome}.</h1>
        <p style={body}>
          eu sou a ARIA. fui criada pra estar aqui com você — não pra te avaliar,
          não pra contar pra ninguém o que você sente. só pra ouvir de verdade.
        </p>
        <p style={body}>
          sem julgamento. sem nota. sem ninguém lendo o que você escreve.
        </p>
      </div>
      <Button fullWidth onClick={onNext}>continuar</Button>
    </div>
  )
}

function StepSobreARIA({ onNext }) {
  const cards = [
    { emoji: '💬', titulo: 'conversa de verdade', texto: 'eu lembro de uma sessão pra outra. quando você voltar, começo de onde a gente parou.' },
    { emoji: '🔒', titulo: 'privacidade total', texto: 'suas conversas não são gravadas. só temas gerais chegam à psicóloga, nunca o que você disse.' },
    { emoji: '🌙', titulo: 'aqui quando precisar', texto: 'de manhã, de tarde, de noite. pode aparecer com o que tiver na cabeça.' },
  ]

  return (
    <div style={screen}>
      <h1 style={{ ...heading, marginBottom: 4 }}>o que você vai encontrar aqui</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
        {cards.map(c => (
          <div key={c.titulo} style={featureCard}>
            <span style={{ fontSize: 24 }}>{c.emoji}</span>
            <div>
              <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 2, color: '#C8A6FF', fontFamily: 'DM Sans, sans-serif' }}>{c.titulo}</p>
              <p style={{ fontSize: 13, color: 'rgba(240,238,255,0.6)', lineHeight: 1.5, margin: 0, fontFamily: 'DM Sans, sans-serif' }}>{c.texto}</p>
            </div>
          </div>
        ))}
      </div>
      <Button fullWidth onClick={onNext} style={{ marginTop: 8 }}>entendi, continuar</Button>
    </div>
  )
}

function StepApelido({ nome, apelido, setApelido, onConcluir, saving }) {
  return (
    <div style={screen}>
      <div style={logoWrap}>
        <ARIALogo size={48} />
      </div>
      <div style={textBlock}>
        <h1 style={heading}>como você quer ser chamado?</h1>
        <p style={body}>
          pode ser seu nome, apelido, o que quiser. é como vou te chamar nas nossas conversas.
        </p>
      </div>

      <input
        value={apelido}
        onChange={e => setApelido(e.target.value)}
        placeholder={nome}
        maxLength={30}
        autoFocus
        style={{
          width: '100%',
          padding: '14px 16px',
          borderRadius: 12,
          border: '1.5px solid rgba(200,166,255,0.3)',
          background: '#1E1B2E',
          color: '#F0EEFF',
          fontSize: 16,
          fontFamily: 'DM Sans, sans-serif',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />

      <Button fullWidth onClick={onConcluir} loading={saving}>
        começar
      </Button>
    </div>
  )
}

function ARIALogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="#C8A6FF" strokeWidth="1.5" />
      <path d="M8 14s1-2 4-2 4 2 4 2" stroke="#C8A6FF" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="9" cy="10" r="1.2" fill="#C8A6FF" />
      <circle cx="15" cy="10" r="1.2" fill="#C8A6FF" />
    </svg>
  )
}

const shell = {
  minHeight: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '24px 24px 40px',
  paddingTop: 'calc(24px + env(safe-area-inset-top))',
  background: `radial-gradient(ellipse at top, rgba(200,166,255,0.1) 0%, #0E0D14 55%)`,
  fontFamily: 'DM Sans, sans-serif',
}

const dotsRow = { display: 'flex', gap: 8, marginBottom: 40 }
const dot = { width: 8, height: 8, borderRadius: 4, transition: 'background 0.3s' }
const content = { width: '100%', maxWidth: 420, flex: 1, display: 'flex', flexDirection: 'column' }

const screen = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 20,
  width: '100%',
  flex: 1,
}

const logoWrap = {
  width: 80, height: 80,
  borderRadius: 24,
  background: 'rgba(200,166,255,0.1)',
  border: '1px solid rgba(200,166,255,0.2)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

const heading = {
  fontFamily: 'DM Sans, sans-serif',
  fontSize: 26,
  fontWeight: 600,
  lineHeight: 1.2,
  textAlign: 'center',
  width: '100%',
  color: '#F0EEFF',
  margin: 0,
}

const body = {
  fontSize: 15,
  color: 'rgba(240,238,255,0.6)',
  lineHeight: 1.7,
  textAlign: 'center',
  margin: 0,
  fontFamily: 'DM Sans, sans-serif',
}

const textBlock = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  width: '100%',
  alignItems: 'center',
}

const featureCard = {
  background: '#16141F',
  border: '1px solid rgba(200,166,255,0.1)',
  borderRadius: 14,
  padding: '14px 16px',
  display: 'flex',
  gap: 14,
  alignItems: 'flex-start',
  width: '100%',
}
