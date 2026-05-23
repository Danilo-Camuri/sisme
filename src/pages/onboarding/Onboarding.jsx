import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

// ─── Constantes ────────────────────────────────────────────────
const TOTAL_TELAS = 6
const CARDS_CARROSSEL = [
  { emoji: '💬', titulo: 'alguém pra ouvir',     sub: 'desabafa, processa, organiza o que tá sentindo sem julgamento, 24h por dia' },
  { emoji: '📚', titulo: 'seus estudos, do seu jeito', sub: 'método de estudo, rotina por matéria, foco, procrastinação — a ARIA te ajuda a montar seu ritmo' },
  { emoji: '🧭', titulo: 'seu futuro, agora',    sub: 'carreira, faculdade, o que você quer ser dá pra pensar junto, sem pressão' },
  { emoji: '🤝', titulo: 'pra tudo mais',        sub: 'família, amizades, crush, escola — a ARIA tá aqui pra qualquer coisa que pesar' },
]

// ─── Componente principal ──────────────────────────────────────
export default function Onboarding() {
  const { aluno, validarEscolaMatricula, cadastrar } = useAuth()
  const navigate = useNavigate()
  const [tela, setTela] = useState(0)

  // Tela 2 — carrossel
  const [cardAtivo, setCardAtivo] = useState(0)

  // Tela 3 — identificação
  const [nome,    setNome]    = useState('')
  const [apelido, setApelido] = useState('')

  // Tela 4 — escola (validação)
  const [codigo,       setCodigo]       = useState('')
  const [matricula,    setMatricula]    = useState('')
  const [validando,    setValidando]    = useState(false)
  const [validado,     setValidado]     = useState(false)
  const [erroEscola,   setErroEscola]   = useState('')
  const [escolaId,     setEscolaId]     = useState(null)
  const [alunoId,      setAlunoId]      = useState(null)

  // Tela 5 — senha (criação de conta)
  const [email,        setEmail]        = useState('')
  const [senha,        setSenha]        = useState('')
  const [erroConta,    setErroConta]    = useState('')
  const [criandoConta, setCriandoConta] = useState(false)

  // Tela 6 — mapa do dia
  const [turno,            setTurno]            = useState(null)
  const [horariosSelected, setHorariosSelected] = useState([])
  const [diasSelected,     setDiasSelected]     = useState([])
  const [salvando,         setSalvando]          = useState(false)

  // Se aluno já existe e onboarding incompleto, pula direto para tela certa
  useEffect(() => {
    if (aluno && !aluno.onboarding_ok) {
      // Já tem conta — vai para tela 5 (mapa do dia)
      if (aluno.nome) setNome(aluno.nome)
      if (aluno.apelido) setApelido(aluno.apelido)
      setTela(5)
    }
  }, [aluno])

  // Auto-avanço carrossel
  useEffect(() => {
    if (tela !== 1) return
    const t = setInterval(() => setCardAtivo(c => (c + 1) % CARDS_CARROSSEL.length), 4000)
    return () => clearInterval(t)
  }, [tela])

  // ── Handlers ────────────────────────────────────────────────

  async function validarEscola() {
    if (!codigo.trim() || !matricula.trim()) return
    setValidando(true)
    setErroEscola('')
    setValidado(false)
    const result = await validarEscolaMatricula({
      codigoEscola: codigo,
      matricula: matricula,
    })
    setValidando(false)
    if (result.error) {
      setErroEscola(result.error)
    } else {
      setEscolaId(result.escolaId)
      setAlunoId(result.alunoId)
      setValidado(true)
    }
  }

  async function criarConta() {
    if (!email.trim() || !senha.trim()) return
    if (senha.length < 8) { setErroConta('a senha precisa ter pelo menos 8 caracteres'); return }
    setCriandoConta(true)
    setErroConta('')
    const result = await cadastrar({
      email,
      senha,
      nome: nome.trim() || 'Aluno',
      escolaId,
      alunoId,
    })
    setCriandoConta(false)
    if (result.error) {
      setErroConta(result.error)
    } else {
      setTela(5)
    }
  }

  function toggleHorario(h) {
    setHorariosSelected(prev =>
      prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h]
    )
  }

  function toggleDia(d) {
    setDiasSelected(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    )
  }

  async function concluir() {
    setSalvando(true)
    const alunoAtual = aluno
    if (!alunoAtual) { setSalvando(false); return }

    await supabase.from('alunos').update({
      nome:               nome.trim() || alunoAtual.nome,
      apelido:            apelido.trim() || nome.trim() || alunoAtual.nome?.split(' ')[0],
      turno:              turno || null,
      horarios_preferidos: horariosSelected.length ? horariosSelected : null,
      dias_pesados:       diasSelected.length ? diasSelected : null,
      onboarding_ok:      true,
    }).eq('id', alunoAtual.id)

    setSalvando(false)
    navigate('/', { replace: true })
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div style={s.shell}>
      {/* Barra de progresso no topo */}
      <div style={s.progressBar}>
        {Array.from({ length: TOTAL_TELAS }).map((_, i) => (
          <div key={i} style={{
            ...s.progressSeg,
            background: i <= tela
              ? 'var(--accent-purple)'
              : 'rgba(200,166,255,0.12)',
          }} />
        ))}
      </div>

      {/* ── Tela 0 — Boas-vindas ─────────────────────────── */}
      {tela === 0 && (
        <div style={s.tela}>
          <div style={s.orbWrap}>
            <ConicOrb />
          </div>
          <h1 style={s.h1}>oi, eu sou a ARIA.</h1>
          <p style={s.sub}>sua parceira de 24h — pra tudo que você não sabe com quem falar.</p>
          <button style={s.btnPill} onClick={() => setTela(1)}>começar</button>
        </div>
      )}

      {/* ── Tela 1 — Carrossel ───────────────────────────── */}
      {tela === 1 && (
        <div style={{ ...s.tela, gap: 0 }}>
          {/* Indicador de bolinhas */}
          <div style={s.dotsRow}>
            {CARDS_CARROSSEL.map((_, i) => (
              <button
                key={i}
                onClick={() => setCardAtivo(i)}
                style={{
                  ...s.dotBtn,
                  background: i === cardAtivo ? 'var(--accent-purple)' : 'rgba(200,166,255,0.2)',
                  width: i === cardAtivo ? 24 : 8,
                }}
              />
            ))}
          </div>

          {/* Card ativo */}
          <div style={s.carrosselCard}>
            <span style={s.cardEmoji}>{CARDS_CARROSSEL[cardAtivo].emoji}</span>
            <h2 style={s.cardTitulo}>{CARDS_CARROSSEL[cardAtivo].titulo}</h2>
            <p style={s.cardSub}>{CARDS_CARROSSEL[cardAtivo].sub}</p>

            {/* Swipe areas */}
            <button
              onClick={() => setCardAtivo(c => (c - 1 + CARDS_CARROSSEL.length) % CARDS_CARROSSEL.length)}
              style={s.swipeArea('left')}
              aria-label="anterior"
            />
            <button
              onClick={() => setCardAtivo(c => (c + 1) % CARDS_CARROSSEL.length)}
              style={s.swipeArea('right')}
              aria-label="próximo"
            />
          </div>

          <div style={s.footerFixo}>
            <button style={s.btnPill} onClick={() => setTela(2)}>quero isso</button>
          </div>
        </div>
      )}

      {/* ── Tela 2 — Consentimento ───────────────────────── */}
      {tela === 2 && (
        <div style={s.tela}>
          <p style={s.telaTexto}>antes de começar, só uma coisa importante.</p>
          <div style={s.consentCard}>
            {[
              { e: '🔒', t: 'Suas conversas são suas. A escola não lê o que você escreve aqui.' },
              { e: '👨‍👩‍👧', t: 'Seus pais autorizaram seu acesso junto com a escola.' },
              { e: '⚠️', t: 'Em situações de risco real, o orientador da escola pode ser acionado — mas sempre com cuidado e respeito.' },
            ].map((item, i) => (
              <div key={i} style={s.consentItem}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{item.e}</span>
                <p style={s.consentText}>{item.t}</p>
              </div>
            ))}
          </div>
          <button style={s.btnPill} onClick={() => setTela(3)}>entendi, pode continuar</button>
        </div>
      )}

      {/* ── Tela 3 — Identificação ───────────────────────── */}
      {tela === 3 && (
        <div style={s.tela}>
          <p style={s.telaTexto}>como você se chama?</p>
          <div style={s.fieldsCol}>
            <InputField
              placeholder="seu nome completo"
              value={nome}
              onChange={e => setNome(e.target.value)}
            />
            <div>
              <InputField
                placeholder="como você quer que eu te chame?"
                value={apelido}
                onChange={e => setApelido(e.target.value)}
              />
              <p style={s.fieldHint}>pode ser apelido, nome do meio, qualquer coisa</p>
            </div>
          </div>
          <button
            style={{ ...s.btnPill, opacity: !nome.trim() ? 0.45 : 1 }}
            onClick={() => { if (nome.trim()) setTela(4) }}
          >
            continuar
          </button>
        </div>
      )}

      {/* ── Tela 4 — Escola ──────────────────────────────── */}
      {tela === 4 && (
        <div style={s.tela}>
          <p style={s.telaTexto}>agora a parte da escola.</p>
          <div style={s.fieldsCol}>
            <InputField
              placeholder="código da sua escola"
              value={codigo}
              onChange={e => { setCodigo(e.target.value); setValidado(false); setErroEscola('') }}
              onBlur={validarEscola}
              autoCapitalize="characters"
            />
            <div style={{ position: 'relative' }}>
              <InputField
                placeholder="sua matrícula"
                value={matricula}
                onChange={e => { setMatricula(e.target.value); setValidado(false); setErroEscola('') }}
                onBlur={validarEscola}
              />
              {/* Indicadores de status */}
              {validando && (
                <div style={s.inputStatus}>
                  <Spinner />
                </div>
              )}
              {validado && !validando && (
                <div style={s.inputStatus}>
                  <span style={{ color: '#4ade80', fontSize: 18 }}>✓</span>
                </div>
              )}
            </div>
            {erroEscola && <p style={s.erroPink}>{erroEscola}</p>}
          </div>

          {/* Campo email e senha após validação */}
          {validado && (
            <div style={{ ...s.fieldsCol, marginTop: 8 }}>
              <p style={{ ...s.fieldHint, fontSize: 13, color: 'rgba(200,166,255,0.7)', marginBottom: 4 }}>
                agora cria seu acesso
              </p>
              <InputField
                placeholder="seu e-mail"
                value={email}
                onChange={e => setEmail(e.target.value)}
                type="email"
              />
              <InputField
                placeholder="crie uma senha (mínimo 8 caracteres)"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                type="password"
              />
              {erroConta && <p style={s.erroPink}>{erroConta}</p>}
            </div>
          )}

          <button
            style={{ ...s.btnPill, opacity: (!validado || criandoConta) ? 0.45 : 1 }}
            onClick={() => { if (validado && !criandoConta) criarConta() }}
          >
            {criandoConta ? 'criando conta...' : 'confirmar'}
          </button>
        </div>
      )}

      {/* ── Tela 5 — Mapa do dia ─────────────────────────── */}
      {tela === 5 && (
        <div style={{ ...s.tela, overflowY: 'auto', justifyContent: 'flex-start', paddingTop: 8 }}>
          <div>
            <h2 style={s.h2}>me conta um pouco da sua rotina.</h2>
            <p style={{ ...s.sub, textAlign: 'left', marginTop: 4 }}>
              assim eu sei os melhores momentos pra aparecer.
            </p>
          </div>

          {/* Bloco 1 — turno (seleção única) */}
          <BlocoSelecao titulo="você estuda...">
            {[['Manhã','manha'],['Tarde','tarde'],['Integral','integral']].map(([label, val]) => (
              <PillOption
                key={val}
                label={label}
                selected={turno === val}
                onClick={() => setTurno(t => t === val ? null : val)}
              />
            ))}
          </BlocoSelecao>

          {/* Bloco 2 — horários (múltipla) */}
          <BlocoSelecao titulo="melhores momentos pra conversar">
            {['Antes das aulas','Intervalo','Depois das aulas','À noite','Fim de semana'].map(h => (
              <PillOption
                key={h}
                label={h}
                selected={horariosSelected.includes(h)}
                onClick={() => toggleHorario(h)}
              />
            ))}
          </BlocoSelecao>

          {/* Bloco 3 — dias pesados (múltipla) */}
          <BlocoSelecao titulo="dias mais pesados pra você">
            {['Seg','Ter','Qua','Qui','Sex'].map(d => (
              <PillOption
                key={d}
                label={d}
                selected={diasSelected.includes(d)}
                onClick={() => toggleDia(d)}
              />
            ))}
          </BlocoSelecao>

          <button
            style={{ ...s.btnPill, marginTop: 8, opacity: salvando ? 0.6 : 1 }}
            onClick={() => { if (!salvando) concluir() }}
          >
            {salvando ? 'salvando...' : 'pronto, pode começar'}
          </button>
        </div>
      )}

      <style>{`
        @keyframes orbSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes orbPulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50%       { transform: scale(1.06); opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        input::placeholder { color: rgba(138,135,160,0.6); }
        input:focus { outline: none; }
      `}</style>
    </div>
  )
}

// ─── Sub-componentes ──────────────────────────────────────────

function ConicOrb() {
  return (
    <div style={{
      width: 160, height: 160,
      borderRadius: '50%',
      background: 'conic-gradient(from 0deg, #C8A6FF, #FF9FCB, #9FDFFF, #FFD580, #C8A6FF)',
      animation: 'orbSpin 8s linear infinite, orbPulse 3s ease-in-out infinite',
      boxShadow: '0 0 60px rgba(200,166,255,0.35), 0 0 120px rgba(255,159,203,0.15)',
      flexShrink: 0,
    }} />
  )
}

function InputField({ placeholder, value, onChange, type = 'text', onBlur, autoCapitalize }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={() => setFocused(true)}
      autoCapitalize={autoCapitalize}
      style={{
        width: '100%',
        padding: '14px 16px',
        borderRadius: 'var(--radius-sm)',
        border: `1.5px solid ${focused ? 'var(--accent-purple)' : 'rgba(255,255,255,0.08)'}`,
        background: '#17151F',
        color: 'var(--text-dark)',
        fontSize: 15,
        fontFamily: 'var(--font-body)',
        boxSizing: 'border-box',
        transition: 'border-color 0.2s',
      }}
    />
  )
}

function Spinner() {
  return (
    <div style={{
      width: 18, height: 18,
      border: '2px solid rgba(200,166,255,0.2)',
      borderTop: '2px solid var(--accent-purple)',
      borderRadius: '50%',
      animation: 'orbSpin 0.7s linear infinite',
    }} />
  )
}

function BlocoSelecao({ titulo, children }) {
  return (
    <div style={{ width: '100%' }}>
      <p style={{
        fontSize: 13, color: 'var(--muted)',
        marginBottom: 10, fontFamily: 'var(--font-body)',
        letterSpacing: '0.02em',
      }}>
        {titulo}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {children}
      </div>
    </div>
  )
}

function PillOption({ label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px',
        borderRadius: 50,
        border: `1px solid ${selected ? 'transparent' : 'rgba(255,255,255,0.07)'}`,
        background: selected ? 'var(--accent-purple)' : '#17151F',
        color: selected ? '#0E0D14' : 'var(--text-dark)',
        fontSize: 14,
        fontFamily: 'var(--font-body)',
        fontWeight: selected ? 600 : 400,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {label}
    </button>
  )
}

// ─── Estilos ──────────────────────────────────────────────────
const s = {
  shell: {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: '#0E0D14',
    color: 'var(--text-dark)',
    fontFamily: 'var(--font-body)',
    padding: '0 0 env(safe-area-inset-bottom)',
    overflowX: 'hidden',
  },

  progressBar: {
    display: 'flex',
    gap: 4,
    width: '100%',
    padding: 'calc(env(safe-area-inset-top) + 12px) 20px 0',
    flexShrink: 0,
  },
  progressSeg: {
    flex: 1, height: 3,
    borderRadius: 2,
    transition: 'background 0.4s ease',
  },

  tela: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    width: '100%',
    maxWidth: 420,
    padding: '24px 24px 32px',
    animation: 'fadeUp 0.35s ease',
  },

  orbWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  h1: {
    fontFamily: 'var(--font-display)',
    fontSize: 28,
    fontWeight: 400,
    color: '#F0EEF8',
    textAlign: 'center',
    margin: 0,
    lineHeight: 1.2,
  },
  h2: {
    fontFamily: 'var(--font-display)',
    fontSize: 22,
    fontWeight: 400,
    color: '#F0EEF8',
    margin: 0,
    lineHeight: 1.3,
  },
  sub: {
    fontSize: 15,
    color: 'var(--muted)',
    textAlign: 'center',
    margin: 0,
    lineHeight: 1.6,
    fontFamily: 'var(--font-body)',
  },
  telaTexto: {
    fontSize: 17,
    color: '#F0EEF8',
    textAlign: 'center',
    margin: 0,
    lineHeight: 1.5,
    fontFamily: 'var(--font-body)',
    fontWeight: 500,
  },

  btnPill: {
    padding: '14px 36px',
    borderRadius: 50,
    border: 'none',
    background: 'var(--accent-purple)',
    color: '#0E0D14',
    fontSize: 15,
    fontWeight: 600,
    fontFamily: 'var(--font-body)',
    cursor: 'pointer',
    transition: 'opacity 0.2s, transform 0.1s',
    flexShrink: 0,
    letterSpacing: '0.02em',
  },

  // Carrossel
  dotsRow: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  dotBtn: {
    height: 8,
    borderRadius: 4,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    padding: 0,
  },
  carrosselCard: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
    padding: '0 24px',
    position: 'relative',
    animation: 'fadeUp 0.3s ease',
  },
  cardEmoji: { fontSize: 64, lineHeight: 1 },
  cardTitulo: {
    fontFamily: 'var(--font-display)',
    fontSize: 22,
    fontWeight: 400,
    color: '#F0EEF8',
    textAlign: 'center',
    margin: 0,
  },
  cardSub: {
    fontSize: 14,
    color: 'var(--muted)',
    textAlign: 'center',
    lineHeight: 1.65,
    margin: 0,
    maxWidth: 300,
  },
  swipeArea: (side) => ({
    position: 'absolute',
    top: 0, bottom: 0,
    [side]: 0,
    width: '30%',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  }),
  footerFixo: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    padding: '16px 24px 0',
  },

  // Consentimento
  consentCard: {
    width: '100%',
    background: '#17151F',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 'var(--radius)',
    padding: '20px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  consentItem: {
    display: 'flex',
    gap: 14,
    alignItems: 'flex-start',
  },
  consentText: {
    fontSize: 14,
    color: 'rgba(240,238,248,0.8)',
    lineHeight: 1.6,
    margin: 0,
    fontFamily: 'var(--font-body)',
  },

  // Identificação / Escola
  fieldsCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    width: '100%',
  },
  fieldHint: {
    fontSize: 12,
    color: 'var(--muted)',
    marginTop: 5,
    fontFamily: 'var(--font-body)',
  },
  inputStatus: {
    position: 'absolute',
    right: 14, top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex', alignItems: 'center',
  },
  erroPink: {
    fontSize: 13,
    color: 'var(--accent-pink)',
    fontFamily: 'var(--font-body)',
    margin: 0,
    lineHeight: 1.4,
  },
}
