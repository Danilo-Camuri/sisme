import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

export default function Home() {
  const { aluno, logout } = useAuth()
  const navigate = useNavigate()
  const [checkinHoje, setCheckinHoje] = useState(null)
  const [checando, setChecando] = useState(true)

  const nome = aluno?.nome?.split(' ')[0] ?? 'você'
  const personagem = aluno?.personagem ?? 'tina'
  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  useEffect(() => {
    if (aluno) verificarCheckin()
  }, [aluno])

  async function verificarCheckin() {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const { data } = await supabase
      .from('checkins')
      .select('humor, energia, criado_em')
      .eq('aluno_id', aluno.id)
      .gte('criado_em', hoje.toISOString())
      .maybeSingle()
    setCheckinHoje(data)
    setChecando(false)
  }

  const HUMOR_EMOJI = { 1: '😶', 2: '😔', 3: '😐', 4: '🙂', 5: '😄' }
  const ENERGIA_EMOJI = { 1: '🪫', 2: '😴', 3: '😑', 4: '⚡', 5: '🔥' }

  return (
    <div style={shell}>
      {/* Header */}
      <div style={header}>
        <div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>{saudacao}</p>
          <h1 style={{ fontSize: '22px', fontFamily: 'var(--font-display)', fontWeight: '500', margin: 0 }}>
            {nome}
          </h1>
        </div>
        <button onClick={logout} style={btnSair}>Sair</button>
      </div>

      {/* Card de check-in */}
      {!checando && (
        checkinHoje ? (
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={cardLabel}>Check-in de hoje</p>
                <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                  <div style={statItem}>
                    <span style={{ fontSize: '28px' }}>{HUMOR_EMOJI[checkinHoje.humor]}</span>
                    <span style={statLabel}>Humor</span>
                  </div>
                  <div style={statItem}>
                    <span style={{ fontSize: '28px' }}>{ENERGIA_EMOJI[checkinHoje.energia]}</span>
                    <span style={statLabel}>Energia</span>
                  </div>
                </div>
              </div>
              <span style={{
                fontSize: '11px', color: 'var(--accent-success)',
                background: 'rgba(74,222,128,0.1)',
                border: '1px solid rgba(74,222,128,0.2)',
                borderRadius: '20px', padding: '3px 10px'
              }}>
                ✓ Feito
              </span>
            </div>
          </div>
        ) : (
          <button onClick={() => navigate('/checkin')} style={cardBtn}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={cardLabel}>Check-in de hoje</p>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  Como você está chegando hoje?
                </p>
              </div>
              <span style={{ fontSize: '24px' }}>→</span>
            </div>
          </button>
        )
      )}

      {/* Menu principal */}
      <div style={menuGrid}>
        <MenuCard
          emoji={personagem === 'tina' ? '🌙' : '⚡'}
          titulo={`Conversar com ${personagem === 'tina' ? 'Tina' : 'Léo'}`}
          descricao="Abrir uma sessão"
          cor={personagem === 'tina' ? '#a78bfa' : '#34d399'}
          onClick={() => navigate('/conversa')}
        />
        <MenuCard
          emoji="🎧"
          titulo="Trilhas de áudio"
          descricao="Exercícios curtos"
          cor="#fb923c"
          onClick={() => navigate('/trilhas')}
          em_breve
        />
        <MenuCard
          emoji="📓"
          titulo="Registro pessoal"
          descricao="Só você acessa"
          cor="#60a5fa"
          onClick={() => navigate('/registro')}
          em_breve
        />
      </div>
    </div>
  )
}

function MenuCard({ emoji, titulo, descricao, cor, onClick, em_breve }) {
  return (
    <button
      onClick={em_breve ? undefined : onClick}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '18px',
        textAlign: 'left',
        cursor: em_breve ? 'default' : 'pointer',
        opacity: em_breve ? 0.6 : 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        flex: 1,
        minWidth: 'calc(50% - 6px)'
      }}
    >
      <span style={{ fontSize: '26px' }}>{emoji}</span>
      <div>
        <p style={{ fontSize: '14px', fontWeight: '500', margin: 0, color: cor }}>{titulo}</p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
          {em_breve ? 'Em breve' : descricao}
        </p>
      </div>
    </button>
  )
}

const shell = {
  minHeight: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  padding: '24px 20px 40px',
  paddingTop: 'calc(24px + env(safe-area-inset-top))',
  gap: '20px',
  background: `radial-gradient(ellipse at top, rgba(124,106,247,0.08) 0%, var(--bg) 55%)`
}

const header = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start'
}

const btnSair = {
  background: 'none',
  border: 'none',
  color: 'var(--text-muted)',
  fontSize: '13px',
  cursor: 'pointer',
  padding: '4px'
}

const card = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  padding: '18px'
}

const cardBtn = {
  background: 'var(--bg-card)',
  border: '1px solid rgba(124,106,247,0.3)',
  borderRadius: 'var(--radius-md)',
  padding: '18px',
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%'
}

const cardLabel = {
  fontSize: '12px',
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  margin: 0,
  fontWeight: '500'
}

const statItem = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4px'
}

const statLabel = {
  fontSize: '11px',
  color: 'var(--text-muted)'
}

const menuGrid = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '12px'
}
