import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

// ─── Definição das 6 portas ───────────────────────────────────
const PORTAS = [
  {
    id: "Escola",
    titulo: "escola",
    sub: "estudos, provas, ENEM, professores",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    id: "Família",
    titulo: "família",
    sub: "pais, irmãos, casa, pressão",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    id: "Amizades e relacionamentos",
    titulo: "amizades",
    sub: "amigos, crush, conflitos, vínculos",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
  },
  {
    id: "Meu futuro",
    titulo: "meu futuro",
    sub: "carreira, faculdade, propósito",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polygon points="10 8 16 12 10 16 10 8"/>
      </svg>
    ),
  },
  {
    id: "Não estou bem",
    titulo: "não estou bem",
    sub: "ansiedade, tristeza, esgotamento",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M8 15s1.5-2 4-2 4 2 4 2"/>
        <line x1="9" y1="9" x2="9.01" y2="9"/>
        <line x1="15" y1="9" x2="15.01" y2="9"/>
      </svg>
    ),
  },
  {
    id: "Só quero conversar",
    titulo: "só quero conversar",
    sub: "sem assunto definido, só falar",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
];

// ─── Componente ───────────────────────────────────────────────
export default function PortasEntrada({ onEntrar }) {
  const { aluno, logout } = useAuth();
  const [hovered, setHovered] = useState(null);

  const apelido = aluno?.apelido || aluno?.nome?.split(" ")[0] || "você";
  const hora = new Date().getHours();
  const saudacao =
    hora < 12 ? "bom dia" :
    hora < 18 ? "boa tarde" :
    "boa noite";

  return (
    <div style={s.shell}>

      {/* Header */}
      <div style={s.header}>
        <div style={s.ariaOrb}>
          <ARIAOrb />
        </div>
        <button onClick={logout} style={s.btnLogout} title="Sair">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>

      {/* Saudação */}
      <div style={s.saudacaoWrap}>
        <p style={s.saudacao}>{saudacao}, {apelido}.</p>
        <p style={s.pergunta}>sobre o que você quer falar hoje?</p>
      </div>

      {/* Grid de portas */}
      <div style={s.grid}>
        {PORTAS.map((porta) => (
          <button
            key={porta.id}
            style={{
              ...s.card,
              background: hovered === porta.id
                ? "rgba(200,166,255,0.12)"
                : "var(--surface)",
              borderColor: hovered === porta.id
                ? "rgba(200,166,255,0.4)"
                : "rgba(200,166,255,0.12)",
              transform: hovered === porta.id ? "translateY(-2px)" : "translateY(0)",
            }}
            onMouseEnter={() => setHovered(porta.id)}
            onMouseLeave={() => setHovered(null)}
            onTouchStart={() => setHovered(porta.id)}
            onTouchEnd={() => { setHovered(null); onEntrar(porta.id); }}
            onClick={() => onEntrar(porta.id)}
          >
            <div style={{
              ...s.cardIcon,
              color: hovered === porta.id ? "var(--accent-purple)" : "var(--muted)",
            }}>
              {porta.icon}
            </div>
            <p style={{
              ...s.cardTitulo,
              color: hovered === porta.id ? "var(--accent-purple)" : "var(--text)",
            }}>
              {porta.titulo}
            </p>
            <p style={s.cardSub}>{porta.sub}</p>
          </button>
        ))}
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Orb da ARIA ─────────────────────────────────────────────
function ARIAOrb() {
  return (
    <div style={{
      width: 40, height: 40, borderRadius: "50%",
      background: "linear-gradient(135deg, var(--accent-purple), var(--accent-pink))",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.85)" strokeWidth="1.5"/>
        <path d="M8 14s1-2 4-2 4 2 4 2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="9"  cy="10" r="1.2" fill="white"/>
        <circle cx="15" cy="10" r="1.2" fill="white"/>
      </svg>
    </div>
  );
}

// ─── Estilos ──────────────────────────────────────────────────
const s = {
  shell: {
    minHeight: "100dvh",
    display: "flex",
    flexDirection: "column",
    background: "var(--bg)",
    fontFamily: "var(--font-body)",
    color: "var(--text)",
    padding: "0 0 env(safe-area-inset-bottom)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    paddingTop: "calc(16px + env(safe-area-inset-top))",
  },
  ariaOrb: { display: "flex", alignItems: "center", gap: 10 },
  btnLogout: {
    background: "none", border: "none",
    color: "var(--muted)", cursor: "pointer",
    padding: 8, borderRadius: 8,
    display: "flex", alignItems: "center",
  },
  saudacaoWrap: {
    padding: "24px 24px 20px",
    animation: "fadeUp 0.4s ease",
  },
  saudacao: {
    fontFamily: "var(--font-display)",
    fontSize: 26,
    fontWeight: 400,
    color: "var(--text)",
    margin: 0,
    lineHeight: 1.2,
  },
  pergunta: {
    fontSize: 15,
    color: "var(--muted)",
    margin: "6px 0 0",
    fontFamily: "var(--font-body)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 10,
    padding: "0 16px 32px",
    flex: 1,
    animation: "fadeUp 0.45s ease",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
    padding: "18px 16px",
    borderRadius: "var(--radius-sm)",
    border: "1.5px solid",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.2s ease",
    fontFamily: "var(--font-body)",
  },
  cardIcon: {
    transition: "color 0.2s",
    flexShrink: 0,
  },
  cardTitulo: {
    fontSize: 14,
    fontWeight: 600,
    margin: 0,
    lineHeight: 1.2,
    transition: "color 0.2s",
  },
  cardSub: {
    fontSize: 12,
    color: "var(--muted)",
    margin: 0,
    lineHeight: 1.4,
    fontFamily: "var(--font-body)",
  },
};
