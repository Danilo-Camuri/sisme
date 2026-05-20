import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/FormElements'

const TOTAL_STEPS = 4

export default function Onboarding() {
  const { aluno } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [personagem, setPersonagem] = useState(null)
  const [saving, setSaving] = useState(false)

  const nome = aluno?.nome?.split(' ')[0] ?? 'você'

  async function salvarPersonagem(escolha) {
    setPersonagem(escolha)
    setStep(3)
  }

  async function concluirOnboarding() {
    setSaving(true)
    await supabase
      .from('alunos')
      .update({ personagem, onboarding_ok: true })
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
              ? 'var(--accent-primary)'
              : i < step
                ? 'rgba(124,106,247,0.4)'
                : 'rgba(255,255,255,0.1)'
          }} />
        ))}
      </div>

      {/* Screens */}
      <div style={content}>
        {step === 0 && <StepBoasVindas nome={nome} onNext={() => setStep(1)} />}
        {step === 1 && <StepSobreSisme onNext={() => setStep(2)} />}
        {step === 2 && <StepEscolha onEscolher={salvarPersonagem} />}
        {step === 3 && personagem && (
          <StepApresentacao
            personagem={personagem}
            nome={nome}
            onConcluir={concluirOnboarding}
            saving={saving}
          />
        )}
      </div>
    </div>
  )
}

// ─── Tela 1: Boas-vindas ─────────────────────────────────────
function StepBoasVindas({ nome, onNext }) {
  return (
    <div style={screen}>
      <div style={iconWrap('#7c6af7')}>
        <SismeIcon />
      </div>

      <div style={textBlock}>
        <h1 style={heading}>Oi, {nome}.</h1>
        <p style={body}>
          Que bom que você está aqui. O SISME é um espaço só seu, dentro da escola,
          para você falar sobre como está se sentindo de verdade.
        </p>
        <p style={body}>
          Sem julgamento. Sem nota. Sem ninguém lendo o que você escreve.
        </p>
      </div>

      <Button fullWidth onClick={onNext}>
        Continuar
      </Button>
    </div>
  )
}

// ─── Tela 2: Sobre o SISME ───────────────────────────────────
function StepSobreSisme({ onNext }) {
  const cards = [
    {
      icon: '💬',
      titulo: 'Conversa com IA',
      texto: 'Você vai poder conversar com um personagem que sabe escutar, sem pressa e sem julgamento.'
    },
    {
      icon: '🔒',
      titulo: 'Privacidade de verdade',
      texto: 'Suas conversas não são gravadas. Só temas gerais chegam à psicóloga, nunca o que você disse.'
    },
    {
      icon: '🎧',
      titulo: 'Trilhas de áudio',
      texto: 'Exercícios curtos de respiração e foco para usar quando precisar.'
    },
    {
      icon: '📓',
      titulo: 'Registro pessoal',
      texto: 'Um espaço para escrever o que quiser. Só você acessa.'
    }
  ]

  return (
    <div style={screen}>
      <h1 style={{ ...heading, marginBottom: '8px' }}>O que você vai encontrar aqui</h1>
      <p style={{ ...body, marginBottom: '28px' }}>Simples assim.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
        {cards.map(c => (
          <div key={c.titulo} style={featureCard}>
            <span style={{ fontSize: '24px', lineHeight: 1 }}>{c.icon}</span>
            <div>
              <p style={{ fontWeight: '500', fontSize: '15px', marginBottom: '2px' }}>{c.titulo}</p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{c.texto}</p>
            </div>
          </div>
        ))}
      </div>

      <Button fullWidth onClick={onNext} style={{ marginTop: '28px' }}>
        Entendi, continuar
      </Button>
    </div>
  )
}

// ─── Tela 3: Escolha de personagem ───────────────────────────
function StepEscolha({ onEscolher }) {
  const [hover, setHover] = useState(null)

  return (
    <div style={screen}>
      <div style={textBlock}>
        <h1 style={heading}>Com quem você quer conversar?</h1>
        <p style={body}>
          Escolha o personagem com quem você prefere falar. Você pode mudar depois se quiser.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
        <PersonagemCard
          id="tina"
          nome="Tina"
          idade="24 anos"
          descricao="Escuta antes de falar. Acolhedora, presente, sem pressa. Faz você se sentir visto sem se sentir analisado."
          cor="#a78bfa"
          corBg="rgba(167,139,250,0.08)"
          corBorder={hover === 'tina' ? 'rgba(167,139,250,0.5)' : 'rgba(167,139,250,0.15)'}
          emoji="🌙"
          onHover={() => setHover('tina')}
          onLeave={() => setHover(null)}
          onEscolher={() => onEscolher('tina')}
        />
        <PersonagemCard
          id="leo"
          nome="Léo"
          idade="26 anos"
          descricao="Vai direto ao ponto sem ser frio. Respeita sua inteligência, faz perguntas que movem."
          cor="#34d399"
          corBg="rgba(52,211,153,0.08)"
          corBorder={hover === 'leo' ? 'rgba(52,211,153,0.5)' : 'rgba(52,211,153,0.15)'}
          emoji="⚡"
          onHover={() => setHover('leo')}
          onLeave={() => setHover(null)}
          onEscolher={() => onEscolher('leo')}
        />
      </div>

      <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '16px' }}>
        A escolha é sua, independente de qualquer coisa.
      </p>
    </div>
  )
}

function PersonagemCard({ nome, idade, descricao, cor, corBg, corBorder, emoji, onHover, onLeave, onEscolher }) {
  return (
    <button
      onClick={onEscolher}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onTouchStart={onHover}
      onTouchEnd={onLeave}
      style={{
        width: '100%',
        background: corBg,
        border: `1px solid ${corBorder}`,
        borderRadius: 'var(--radius-md)',
        padding: '20px',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'border-color 0.2s, transform 0.1s',
        display: 'flex',
        gap: '16px',
        alignItems: 'flex-start'
      }}
    >
      <div style={{
        width: '52px', height: '52px',
        borderRadius: '16px',
        background: `${cor}22`,
        border: `1px solid ${cor}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '24px',
        flexShrink: 0
      }}>
        {emoji}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '500', color: cor }}>{nome}</span>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{idade}</span>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>{descricao}</p>
      </div>
    </button>
  )
}

// ─── Tela 4: Apresentação do personagem escolhido ────────────
const FALAS = {
  tina: [
    "Oi. Fico feliz que você escolheu conversar comigo.",
    "Pode trazer o que quiser aqui, não tem assunto certo ou errado. Quando algo estiver pesando, quando você não souber bem o que está sentindo, ou só quiser falar sobre o que está acontecendo, eu estou aqui.",
    "A gente começa quando você quiser."
  ],
  leo: [
    "E aí. Boa escolha, vamos conversar.",
    "Não precisa saber o que quer falar antes de abrir o chat. A gente descobre no caminho. Só precisa aparecer.",
    "Quando estiver pronto, é só chamar."
  ]
}

const CORES_PERSONAGEM = {
  tina: { cor: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)', emoji: '🌙' },
  leo:  { cor: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.2)',  emoji: '⚡' }
}

function StepApresentacao({ personagem, nome, onConcluir, saving }) {
  const { cor, bg, border, emoji } = CORES_PERSONAGEM[personagem]
  const falas = FALAS[personagem]
  const nomePers = personagem === 'tina' ? 'Tina' : 'Léo'

  return (
    <div style={screen}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '100%', marginBottom: '8px' }}>
        <div style={{
          width: '56px', height: '56px',
          borderRadius: '18px',
          background: bg,
          border: `1px solid ${border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '28px'
        }}>
          {emoji}
        </div>
        <div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '2px' }}>Você escolheu</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '500', color: cor }}>{nomePers}</p>
        </div>
      </div>

      <div style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 'var(--radius-md)',
        padding: '20px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        {falas.map((fala, i) => (
          <p key={i} style={{
            fontSize: '15px',
            color: 'var(--text-primary)',
            lineHeight: '1.65',
            margin: 0,
            opacity: 0,
            animation: `fadeUp 0.4s ease ${i * 0.25}s forwards`
          }}>
            {fala}
          </p>
        ))}
        <style>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>

      <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
        Você pode mudar de personagem a qualquer momento nas configurações.
      </p>

      <Button fullWidth onClick={onConcluir} loading={saving}>
        Começar
      </Button>
    </div>
  )
}

// ─── Estilos base ────────────────────────────────────────────
const shell = {
  minHeight: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '24px 24px 40px',
  background: `radial-gradient(ellipse at top, rgba(124,106,247,0.1) 0%, var(--bg) 55%)`
}

const dotsRow = {
  display: 'flex',
  gap: '8px',
  marginBottom: '40px',
  paddingTop: 'env(safe-area-inset-top)'
}

const dot = {
  width: '8px', height: '8px',
  borderRadius: '4px',
  transition: 'background 0.3s, width 0.3s'
}

const content = {
  width: '100%',
  maxWidth: '420px',
  flex: 1,
  display: 'flex',
  flexDirection: 'column'
}

const screen = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '20px',
  width: '100%',
  flex: 1,
  animation: 'slideIn 0.3s ease',
}

const heading = {
  fontFamily: 'var(--font-display)',
  fontSize: '26px',
  fontWeight: '500',
  lineHeight: '1.2',
  textAlign: 'center',
  width: '100%'
}

const body = {
  fontSize: '15px',
  color: 'var(--text-secondary)',
  lineHeight: '1.7',
  textAlign: 'center',
  margin: 0
}

const textBlock = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  width: '100%',
  alignItems: 'center'
}

const iconWrap = (cor) => ({
  width: '72px', height: '72px',
  background: `${cor}22`,
  border: `1px solid ${cor}44`,
  borderRadius: '22px',
  display: 'flex', alignItems: 'center', justifyContent: 'center'
})

const featureCard = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '14px 16px',
  display: 'flex',
  gap: '14px',
  alignItems: 'flex-start',
  width: '100%'
}

function SismeIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 20 20" fill="none">
      <path d="M10 2C10 2 4 5 4 10.5C4 14 6.5 17 10 17C13.5 17 16 14 16 10.5C16 5 10 2 10 2Z" fill="#7c6af7" fillOpacity="0.9"/>
      <circle cx="10" cy="10.5" r="2.5" fill="#0f0f1a"/>
    </svg>
  )
}
