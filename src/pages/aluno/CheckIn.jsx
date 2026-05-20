import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

// Perguntas alinhadas ao Método CÓRTEX (construtos C e E)
const HUMOR_OPCOES = [
  { valor: 1, emoji: '😶', label: 'Vazio' },
  { valor: 2, emoji: '😔', label: 'Pesado' },
  { valor: 3, emoji: '😐', label: 'Neutro' },
  { valor: 4, emoji: '🙂', label: 'Bem' },
  { valor: 5, emoji: '😄', label: 'Ótimo' }
]

const ENERGIA_OPCOES = [
  { valor: 1, emoji: '🪫', label: 'No zero' },
  { valor: 2, emoji: '😴', label: 'Cansado' },
  { valor: 3, emoji: '😑', label: 'Mais ou menos' },
  { valor: 4, emoji: '⚡', label: 'Com gás' },
  { valor: 5, emoji: '🔥', label: 'No topo' }
]

export default function CheckIn() {
  const { aluno } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState('humor') // humor | energia | nota | salvando | ok
  const [humor, setHumor] = useState(null)
  const [energia, setEnergia] = useState(null)
  const [nota, setNota] = useState('')
  const [jaFez, setJaFez] = useState(false)
  const [checando, setChecando] = useState(true)

  const nome = aluno?.nome?.split(' ')[0] ?? 'você'
  const personagem = aluno?.personagem ?? 'tina'

  useEffect(() => {
    if (aluno) verificarCheckinHoje()
  }, [aluno])

  async function verificarCheckinHoje() {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const { data } = await supabase
      .from('checkins')
      .select('id')
      .eq('aluno_id', aluno.id)
      .gte('criado_em', hoje.toISOString())
      .maybeSingle()

    setJaFez(!!data)
    setChecando(false)
  }

  async function salvar() {
    setStep('salvando')

    const { error } = await supabase.from('checkins').insert({
      aluno_id: aluno.id,
      escola_id: aluno.escola_id,
      humor,
      energia,
      nota: nota.trim() || null
    })

    if (error) {
      console.error('Erro ao salvar check-in:', error)
      setStep('nota')
      return
    }

    setStep('ok')
  }

  function avancarParaApp() {
    navigate('/home')
  }

  if (checando) return <Carregando />

  if (jaFez) {
    return (
      <Shell>
        <div style={centralized}>
          <span style={{ fontSize: '48px' }}>✅</span>
          <h2 style={heading}>Check-in de hoje já feito</h2>
          <p style={body}>Você já registrou como está hoje. Volte amanhã.</p>
          <BotaoPrimario onClick={avancarParaApp}>
            Ir para o início
          </BotaoPrimario>
        </div>
      </Shell>
    )
  }

  if (step === 'ok') {
    const humorEscolhido = HUMOR_OPCOES.find(o => o.valor === humor)
    const falas = {
      tina: {
        1: 'Obrigada por aparecer mesmo assim. Isso já é muito.',
        2: 'Tá pesado, eu entendo. Fico feliz que você veio.',
        3: 'Tudo bem estar no neutro. Como foi o dia até agora?',
        4: 'Que bom. Cuida desse bem-estar.',
        5: 'Que ótimo! Aproveita esse momento.'
      },
      leo: {
        1: 'Valeu por registrar. Isso importa, mesmo quando tá difícil.',
        2: 'Pesado. Reconhecer isso já é um passo.',
        3: 'Neutro tá de boa. Às vezes é o que tem.',
        4: 'Bem. Segura isso.',
        5: 'No topo. Aproveita.'
      }
    }

    const fala = falas[personagem]?.[humor] ?? 'Obrigado por registrar.'

    return (
      <Shell>
        <div style={centralized}>
          <span style={{ fontSize: '56px' }}>{humorEscolhido?.emoji}</span>
          <div style={bolhaPersonagem}>
            <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.6' }}>{fala}</p>
          </div>
          <BotaoPrimario onClick={avancarParaApp}>
            Ir para o início
          </BotaoPrimario>
        </div>
      </Shell>
    )
  }

  if (step === 'salvando') {
    return <Carregando mensagem="Salvando..." />
  }

  return (
    <Shell>
      {/* Header */}
      <div style={header}>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Check-in de hoje
        </span>
        <ProgressDots step={step} />
      </div>

      {/* Humor */}
      {step === 'humor' && (
        <div style={tela}>
          <div style={perguntaWrap}>
            <p style={perguntaLabel}>Como você está chegando hoje,</p>
            <p style={{ ...perguntaLabel, color: 'var(--text-primary)', fontWeight: '500' }}>
              {nome}?
            </p>
          </div>

          <div style={opcoesGrid}>
            {HUMOR_OPCOES.map(op => (
              <OpcaoBtn
                key={op.valor}
                emoji={op.emoji}
                label={op.label}
                selecionado={humor === op.valor}
                onClick={() => setHumor(op.valor)}
              />
            ))}
          </div>

          <BotaoPrimario
            onClick={() => setStep('energia')}
            disabled={!humor}
          >
            Continuar
          </BotaoPrimario>
        </div>
      )}

      {/* Energia */}
      {step === 'energia' && (
        <div style={tela}>
          <div style={perguntaWrap}>
            <p style={perguntaLabel}>Como está sua energia</p>
            <p style={{ ...perguntaLabel, color: 'var(--text-primary)', fontWeight: '500' }}>
              agora?
            </p>
          </div>

          <div style={opcoesGrid}>
            {ENERGIA_OPCOES.map(op => (
              <OpcaoBtn
                key={op.valor}
                emoji={op.emoji}
                label={op.label}
                selecionado={energia === op.valor}
                onClick={() => setEnergia(op.valor)}
              />
            ))}
          </div>

          <BotaoPrimario
            onClick={() => setStep('nota')}
            disabled={!energia}
          >
            Continuar
          </BotaoPrimario>

          <button
            onClick={() => setStep('humor')}
            style={btnVoltar}
          >
            Voltar
          </button>
        </div>
      )}

      {/* Nota opcional */}
      {step === 'nota' && (
        <div style={tela}>
          <div style={perguntaWrap}>
            <p style={perguntaLabel}>Tem alguma coisa que você quer</p>
            <p style={{ ...perguntaLabel, color: 'var(--text-primary)', fontWeight: '500' }}>
              registrar antes de começar?
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Opcional. Só você vê isso.
            </p>
          </div>

          <textarea
            value={nota}
            onChange={e => setNota(e.target.value)}
            placeholder="Pode escrever qualquer coisa..."
            maxLength={500}
            style={textareaStyle}
          />

          <BotaoPrimario onClick={salvar}>
            Registrar
          </BotaoPrimario>

          <button onClick={() => setStep('energia')} style={btnVoltar}>
            Voltar
          </button>
        </div>
      )}
    </Shell>
  )
}

// ─── Subcomponentes ───────────────────────────────────────────

function OpcaoBtn({ emoji, label, selecionado, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        padding: '16px 8px',
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${selecionado ? 'var(--accent-primary)' : 'var(--border)'}`,
        background: selecionado ? 'rgba(124,106,247,0.12)' : 'var(--bg-card)',
        cursor: 'pointer',
        transition: 'all 0.15s',
        flex: 1,
        minWidth: 0
      }}
    >
      <span style={{ fontSize: '28px', lineHeight: 1 }}>{emoji}</span>
      <span style={{
        fontSize: '11px',
        color: selecionado ? 'var(--accent-primary)' : 'var(--text-muted)',
        fontWeight: selecionado ? '500' : '400',
        whiteSpace: 'nowrap'
      }}>
        {label}
      </span>
    </button>
  )
}

function ProgressDots({ step }) {
  const steps = ['humor', 'energia', 'nota']
  const idx = steps.indexOf(step)
  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      {steps.map((_, i) => (
        <div key={i} style={{
          width: '6px', height: '6px', borderRadius: '3px',
          background: i <= idx ? 'var(--accent-primary)' : 'var(--border)',
          transition: 'background 0.2s'
        }} />
      ))}
    </div>
  )
}

function BotaoPrimario({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '14px',
        borderRadius: 'var(--radius-sm)',
        background: disabled ? 'var(--bg-elevated)' : 'var(--accent-primary)',
        color: disabled ? 'var(--text-muted)' : '#fff',
        border: 'none',
        fontSize: '15px',
        fontWeight: '500',
        fontFamily: 'var(--font-body)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.15s'
      }}
    >
      {children}
    </button>
  )
}

function Carregando({ mensagem = '' }) {
  return (
    <Shell>
      <div style={centralized}>
        <div style={{
          width: '32px', height: '32px',
          border: '2px solid var(--border)',
          borderTopColor: 'var(--accent-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        {mensagem && <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{mensagem}</p>}
      </div>
    </Shell>
  )
}

function Shell({ children }) {
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: `radial-gradient(ellipse at top, rgba(124,106,247,0.08) 0%, var(--bg) 60%)`,
      padding: '24px 24px 40px',
      paddingTop: 'calc(24px + env(safe-area-inset-top))',
      paddingBottom: 'calc(40px + env(safe-area-inset-bottom))'
    }}>
      {children}
    </div>
  )
}

// ─── Estilos ──────────────────────────────────────────────────

const header = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '40px'
}

const tela = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  flex: 1
}

const perguntaWrap = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  marginBottom: '8px'
}

const perguntaLabel = {
  fontSize: '22px',
  fontFamily: 'var(--font-display)',
  color: 'var(--text-secondary)',
  margin: 0,
  lineHeight: '1.3'
}

const opcoesGrid = {
  display: 'flex',
  gap: '8px',
  width: '100%'
}

const textareaStyle = {
  width: '100%',
  minHeight: '140px',
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  padding: '16px',
  fontSize: '15px',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)',
  lineHeight: '1.6',
  resize: 'none',
  outline: 'none',
  boxSizing: 'border-box'
}

const btnVoltar = {
  background: 'none',
  border: 'none',
  color: 'var(--text-muted)',
  fontSize: '14px',
  cursor: 'pointer',
  padding: '8px',
  textAlign: 'center',
  width: '100%'
}

const centralized = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '20px',
  textAlign: 'center'
}

const heading = {
  fontFamily: 'var(--font-display)',
  fontSize: '22px',
  fontWeight: '500',
  margin: 0
}

const body = {
  fontSize: '15px',
  color: 'var(--text-secondary)',
  margin: 0,
  lineHeight: '1.6'
}

const bolhaPersonagem = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  padding: '18px 20px',
  maxWidth: '320px',
  textAlign: 'left'
}
