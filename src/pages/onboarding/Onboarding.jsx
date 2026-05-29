import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

const TOTAL_TELAS = 6

const CARDS = [
  {
    titulo: "alguém pra ouvir de verdade",
    sub: "a ARIA escuta tudo. sem julgamento, sem conselho que você não pediu.",
  },
  {
    titulo: "escola ta pesando?",
    sub: "organiza a rotina, entende o que trava, encontra um jeito que funciona pra você, não pra todo mundo.",
  },
  {
    titulo: "seu futuro, agora",
    sub: "não sabe o que quer da vida? tudo bem. dá pra pensar nisso junto, sem pressão e sem ninguém te dizendo o que você deve querer.",
  },
  {
    titulo: "família, amizades, crush, o que for",
    sub: "não precisa ter nome pro que tá sentindo. se tá incomodando, já é motivo suficiente.",
  },
]

export default function Onboarding() {
  const { aluno, validarEscolaMatricula, cadastrar } = useAuth()
  const navigate = useNavigate()
  const [tela, setTela] = useState(0)
  const [cardAtivo, setCardAtivo] = useState(0)
  const [nome,    setNome]    = useState('')
  const [apelido, setApelido] = useState('')
  const [codigo,     setCodigo]     = useState('')
  const [matricula,  setMatricula]  = useState('')
  const [validando,  setValidando]  = useState(false)
  const [validado,   setValidado]   = useState(false)
  const [erroEscola, setErroEscola] = useState('')
  const [escolaId,   setEscolaId]   = useState(null)
  const [alunoId,    setAlunoId]    = useState(null)
  const [email,       setEmail]       = useState('')
  const [senha,       setSenha]       = useState('')
  const [erroConta,   setErroConta]   = useState('')
  const [criandoConta,setCriandoConta]= useState(false)
  const [turno,             setTurno]             = useState(null)
  const [horariosSelected,  setHorariosSelected]  = useState([])
  const [diasSelected,      setDiasSelected]      = useState([])
  const [salvando,          setSalvando]           = useState(false)

  const proximaTela = () => setTela(t => t + 1)

  async function validarEscola() {
    if (!codigo.trim() || !matricula.trim()) return
    setValidando(true); setErroEscola(''); setValidado(false)
    const result = await validarEscolaMatricula({ codigoEscola: codigo, matricula })
    setValidando(false)
    if (result.error) { setErroEscola(result.error) }
    else { setEscolaId(result.escolaId); setAlunoId(result.alunoId); setValidado(true) }
  }

  async function criarConta() {
    if (!email.trim() || !senha.trim()) return
    if (senha.length < 8) { setErroConta('a senha precisa ter pelo menos 8 caracteres'); return }
    setCriandoConta(true); setErroConta('')
    const result = await cadastrar({ email, senha, nome: nome.trim() || 'Aluno', escolaId, alunoId })
    setCriandoConta(false)
    if (result.error) { setErroConta(result.error) }
    else { setTela(5) }
  }

  function toggleHorario(h) { setHorariosSelected(p => p.includes(h) ? p.filter(x => x !== h) : [...p, h]) }
  function toggleDia(d)     { setDiasSelected(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d]) }

  async function concluir() {
    setSalvando(true)
    if (!aluno) { setSalvando(false); return }
    await supabase.from('alunos').update({
      nome:                nome.trim() || aluno.nome,
      apelido:             apelido.trim() || nome.trim() || aluno.nome?.split(' ')[0],
      turno:               turno || null,
      horarios_preferidos: horariosSelected.length ? horariosSelected : null,
      dias_pesados:        diasSelected.length ? diasSelected : null,
      onboarding_ok:       true,
    }).eq('id', aluno.id)
    setSalvando(false)
    navigate('/', { replace: true })
  }

  return (
    <div style={s.shell}>
      {/* Barra de progresso */}
      <div style={s.progress}>
        {Array.from({ length: TOTAL_TELAS }).map((_, i) => (
          <div key={i} style={{
            ...s.progressSeg,
            background: i <= tela ? 'var(--aria-action)' : 'var(--border)',
          }} />
        ))}
      </div>

      {/* Tela 0 — Boas-vindas */}
      {tela === 0 && (
        <div style={s.tela}>
          <ARIAOrbGrande />
          <div style={s.textBlock}>
            <h1 style={s.h1}>oi, eu sou a ARIA.</h1>
            <p style={s.sub}>pra quando você precisa falar mas não sabe com quem.</p>
          </div>
          <Btn onClick={proximaTela}>começar</Btn>
        </div>
      )}

      {/* Tela 1 — Carrossel */}
      {tela === 1 && (
        <div style={{ ...s.tela, gap: 0, justifyContent: 'flex-start', paddingTop: 32 }}>
          {/* Dots */}
          <div style={s.dotsRow}>
            {CARDS.map((_, i) => (
              <button key={i} onClick={() => setCardAtivo(i)} style={{
                ...s.dot,
                width: i === cardAtivo ? 24 : 8,
                background: i === cardAtivo ? 'var(--aria-action)' : 'var(--border-strong)',
              }} />
            ))}
          </div>
          {/* Card */}
          <div style={s.carrosselCard} key={cardAtivo}>
            <h2 style={s.cardTitulo}>{CARDS[cardAtivo].titulo}</h2>
            <p style={s.cardSub}>{CARDS[cardAtivo].sub}</p>
            <Seta dir="left"  onClick={() => setCardAtivo(c => (c - 1 + CARDS.length) % CARDS.length)} />
            <Seta dir="right" onClick={() => setCardAtivo(c => (c + 1) % CARDS.length)} />
          </div>
          <div style={s.footerFixo}>
            <Btn onClick={proximaTela}>quero isso</Btn>
          </div>
        </div>
      )}

      {/* Tela 2 — Consentimento */}
      {tela === 2 && (
        <div style={s.tela}>
          <h1 style={{ ...s.h1, textAlign: 'left', width: '100%' }}>
            três coisas que você merece saber.
          </h1>
          <div style={s.consentCard}>
            {[
              "o que você fala aqui fica aqui. a escola não tem acesso às suas conversas.",
              "seus pais e sua escola sabem que você está aqui e toparam.",
              "se você estiver em perigo de verdade, a ARIA pode chamar alguém da escola pra te ajudar. é a única exceção.",
            ].map((txt, i) => (
              <div key={i} style={s.consentItem}>
                <div style={s.consentNum}>{i + 1}</div>
                <p style={s.consentText}>{txt}</p>
              </div>
            ))}
          </div>
          <Btn onClick={proximaTela}>entendi, pode continuar</Btn>
        </div>
      )}

      {/* Tela 3 — Nome e apelido */}
      {tela === 3 && (
        <div style={s.tela}>
          <h1 style={s.h1}>como você se chama?</h1>
          <div style={s.fieldsCol}>
            <Campo placeholder="seu nome completo" value={nome} onChange={e => setNome(e.target.value)} />
            <div>
              <Campo placeholder="como você quer que eu te chame?" value={apelido} onChange={e => setApelido(e.target.value)} />
              <p style={s.hint}>como seus amigos te chamam</p>
            </div>
          </div>
          <Btn onClick={proximaTela} disabled={!nome.trim()}>continuar</Btn>
        </div>
      )}

      {/* Tela 4 — Escola e conta */}
      {tela === 4 && (
        <div style={s.tela}>
          <h1 style={s.h1}>confirma sua escola pra continuar.</h1>
          <div style={s.fieldsCol}>
            <Campo placeholder="código da sua escola" value={codigo}
              onChange={e => { setCodigo(e.target.value); setValidado(false); setErroEscola('') }}
              onBlur={validarEscola} autoCapitalize="characters" />
            <div style={{ position: 'relative' }}>
              <Campo placeholder="sua matrícula" value={matricula}
                onChange={e => { setMatricula(e.target.value); setValidado(false); setErroEscola('') }}
                onBlur={validarEscola} />
              {validando && <div style={s.statusWrap}><Spinner /></div>}
              {validado && !validando && <div style={s.statusWrap}><span style={{ color: 'var(--success)', fontSize: 18 }}>✓</span></div>}
            </div>
            {erroEscola && <p style={s.erroText}>{erroEscola}</p>}

            {validado && (
              <div style={{ ...s.fieldsCol, marginTop: 8 }}>
                <p style={{ fontSize: 14, color: 'var(--aria-action)', fontWeight: 500 }}>
                  deu certo. agora cria seu acesso.
                </p>
                <Campo placeholder="seu e-mail" value={email} onChange={e => setEmail(e.target.value)} type="email" />
                <Campo placeholder="crie uma senha com pelo menos 8 caracteres" value={senha} onChange={e => setSenha(e.target.value)} type="password" />
                {erroConta && <p style={s.erroText}>{erroConta}</p>}
              </div>
            )}
          </div>
          <Btn onClick={criarConta} disabled={!validado || criandoConta}>
            {criandoConta ? 'criando conta...' : 'criar minha conta'}
          </Btn>
        </div>
      )}

      {/* Tela 5 — Mapa do dia */}
      {tela === 5 && (
        <div style={{ ...s.tela, justifyContent: 'flex-start', overflowY: 'auto', paddingTop: 24 }}>
          <h1 style={s.h1}>me conta um pouco da sua rotina.</h1>
          <p style={s.sub}>assim eu apareço quando faz sentido, não quando atrapalha.</p>

          <BlocoSel titulo="você estuda no turno da">
            {[['Manhã','manha'],['Tarde','tarde'],['Integral','integral']].map(([label, val]) => (
              <Pill key={val} label={label} sel={turno === val} onClick={() => setTurno(t => t === val ? null : val)} />
            ))}
          </BlocoSel>

          <BlocoSel titulo="melhores momentos pra conversar">
            {['Antes das aulas','Intervalo','Depois das aulas','À noite','Fim de semana'].map(h => (
              <Pill key={h} label={h} sel={horariosSelected.includes(h)} onClick={() => toggleHorario(h)} />
            ))}
          </BlocoSel>

          <BlocoSel titulo="dias mais pesados pra você">
            {['Seg','Ter','Qua','Qui','Sex'].map(d => (
              <Pill key={d} label={d} sel={diasSelected.includes(d)} onClick={() => toggleDia(d)} />
            ))}
          </BlocoSel>

          <Btn onClick={concluir} style={{ marginTop: 8 }}>
            {salvando ? 'salvando...' : 'pronto, pode começar'}
          </Btn>
        </div>
      )}

      <style>{`
        @keyframes orbSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(10px);} to {opacity:1;transform:translateY(0);} }
        input::placeholder { color: var(--muted); }
        input:focus { outline: none; border-color: var(--border-focus) !important; }
      `}</style>
    </div>
  )
}

// ─── Sub-componentes ──────────────────────────────────────────

function ARIAOrbGrande() {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        position: 'absolute', width: 120, height: 120, borderRadius: '50%',
        background: 'radial-gradient(circle, var(--aria-action-subtle) 0%, transparent 70%)',
        animation: 'orbPulse 3s ease-in-out infinite',
      }} />
      <div style={{
        width: 96, height: 96, borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--orb-purple), var(--orb-pink))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: 'var(--shadow-orb)',
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.85)" strokeWidth="1.5"/>
          <path d="M8 14s1-2 4-2 4 2 4 2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="9"  cy="10" r="1.2" fill="white"/>
          <circle cx="15" cy="10" r="1.2" fill="white"/>
        </svg>
      </div>
    </div>
  )
}

function Btn({ children, onClick, disabled = false, style = {} }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        width: '100%', padding: '14px 24px',
        borderRadius: 'var(--radius-full)',
        border: 'none',
        background: disabled ? 'var(--border)' : 'var(--aria-action)',
        color: disabled ? 'var(--muted)' : 'var(--aria-action-text)',
        fontSize: 15, fontWeight: 600, cursor: disabled ? 'default' : 'pointer',
        transition: 'all var(--transition-fast)',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

function Campo({ placeholder, value, onChange, type = 'text', onBlur, autoCapitalize }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      type={type} placeholder={placeholder} value={value}
      onChange={onChange} onBlur={onBlur}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      autoCapitalize={autoCapitalize}
      style={{
        width: '100%', padding: '14px 16px',
        borderRadius: 'var(--radius-sm)',
        border: `1.5px solid ${focused ? 'var(--aria-action)' : 'var(--border-strong)'}`,
        background: 'var(--surface)',
        color: 'var(--text)', fontSize: 15,
        boxSizing: 'border-box',
        transition: 'border-color var(--transition-fast)',
      }}
    />
  )
}

function Spinner() {
  return (
    <div style={{
      width: 18, height: 18,
      border: '2px solid var(--border)',
      borderTop: '2px solid var(--aria-action)',
      borderRadius: '50%',
      animation: 'orbSpin 0.7s linear infinite',
    }} />
  )
}

function BlocoSel({ titulo, children }) {
  return (
    <div style={{ width: '100%' }}>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 10, fontWeight: 500 }}>{titulo}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{children}</div>
    </div>
  )
}

function Pill({ label, sel, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 16px', borderRadius: 'var(--radius-full)',
      border: `1.5px solid ${sel ? 'var(--aria-action)' : 'var(--border-strong)'}`,
      background: sel ? 'var(--aria-action-subtle)' : 'var(--surface)',
      color: sel ? 'var(--aria-action)' : 'var(--text-2)',
      fontSize: 14, fontWeight: sel ? 600 : 400,
      cursor: 'pointer', transition: 'all var(--transition-fast)',
      minHeight: 44,
    }}>
      {label}
    </button>
  )
}

function Seta({ dir, onClick }) {
  return (
    <button onClick={onClick} style={{
      position: 'absolute', top: '50%', transform: 'translateY(-50%)',
      [dir === 'left' ? 'left' : 'right']: 0,
      width: '30%', height: '100%',
      background: 'none', border: 'none', cursor: 'pointer',
    }} aria-label={dir === 'left' ? 'anterior' : 'próximo'} />
  )
}

// ─── Estilos ──────────────────────────────────────────────────
const s = {
  shell: {
    minHeight: '100dvh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', background: 'var(--bg)',
    padding: '0 0 env(safe-area-inset-bottom)',
    overflowX: 'hidden',
  },
  progress: {
    display: 'flex', gap: 4, width: '100%',
    padding: 'calc(env(safe-area-inset-top) + 12px) 20px 0',
    flexShrink: 0,
  },
  progressSeg: {
    flex: 1, height: 3, borderRadius: 2,
    transition: 'background var(--transition-base)',
  },
  tela: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 20, width: '100%', maxWidth: 420,
    padding: '24px 24px 32px',
    animation: 'fadeUp 0.30s ease',
  },
  textBlock: { display: 'flex', flexDirection: 'column', gap: 10, width: '100%', alignItems: 'center' },
  h1: { fontSize: 26, fontWeight: 700, color: 'var(--text)', textAlign: 'center', margin: 0, lineHeight: 1.2 },
  sub: { fontSize: 15, color: 'var(--muted)', textAlign: 'center', margin: 0, lineHeight: 1.6, fontWeight: 400 },
  dotsRow: { display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  dot: { height: 8, borderRadius: 4, border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', padding: 0 },
  carrosselCard: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 16, width: '100%', padding: '0 24px',
    position: 'relative', animation: 'fadeUp 0.25s ease',
  },
  cardTitulo: { fontSize: 22, fontWeight: 700, color: 'var(--text)', textAlign: 'center', margin: 0 },
  cardSub:    { fontSize: 14, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.65, margin: 0, maxWidth: 300 },
  footerFixo: { width: '100%', padding: '16px 24px 0', display: 'flex', justifyContent: 'center' },
  consentCard: {
    width: '100%', background: 'var(--surface)',
    border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
    padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 18,
    boxShadow: 'var(--shadow-sm)',
  },
  consentItem: { display: 'flex', gap: 14, alignItems: 'flex-start' },
  consentNum: {
    width: 24, height: 24, borderRadius: '50%',
    background: 'var(--aria-action-subtle)',
    color: 'var(--aria-action)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, flexShrink: 0,
  },
  consentText: { fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, margin: 0 },
  fieldsCol: { display: 'flex', flexDirection: 'column', gap: 12, width: '100%' },
  hint: { fontSize: 12, color: 'var(--muted)', marginTop: 5 },
  statusWrap: {
    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
    display: 'flex', alignItems: 'center',
  },
  erroText: { fontSize: 13, color: 'var(--error)', margin: 0, lineHeight: 1.4 },
}
