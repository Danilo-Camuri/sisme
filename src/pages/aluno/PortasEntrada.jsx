import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

// ─── Ícones SVG — spec: viewBox 0 0 24 24, stroke currentColor,
//     strokeWidth 1.5, strokeLinecap round, strokeLinejoin round, fill none
//     Tamanho renderizado 28x28. Área de toque 44x44.
//     "Não estou bem": cor de repouso var(--orb-pink), hover var(--error)

const IcoEscola = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 19V8l10-5 10 5v11" />
    <path d="M6 19v-7h12v7" />
    <path d="M10 19v-4h4v4" />
    <path d="M18 14h.01" />
    {/* Dobra no canto inferior direito do livro */}
    <path d="M2 8h20" />
  </svg>
);

const IcoFamilia = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12L12 3l9 9" />
    <path d="M5 10v9a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-9" />
    <path d="M15 3h3v4" />
  </svg>
);

const IcoAmizades = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="12" r="6" />
    <circle cx="15" cy="12" r="6" />
  </svg>
);

const IcoFuturo = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M16.24 7.76l-4.95 4.95" />
    <path d="M16.24 7.76H11.5M16.24 7.76V12.5" />
  </svg>
);

// Único ícone com cor de repouso diferente — recebe cor como prop
const IcoNaoEstouBem = ({ cor }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke={cor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12 C5 9, 7 15, 9 12 S13 9, 15 12 S19 15, 21 12" />
  </svg>
);

const IcoConversar = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"
    strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="12" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="16" cy="12" r="1.5" />
  </svg>
);

// ─── Definição das 6 portas ────────────────────────────────────
const PORTAS = [
  { id: "Escola",                    titulo: "escola",                    sub: "estudos, provas, ENEM, professores",     Ico: IcoEscola },
  { id: "Família",                   titulo: "família",                   sub: "pais, irmãos, casa, pressão",            Ico: IcoFamilia },
  { id: "Amizades e relacionamentos",titulo: "amizades",                  sub: "amigos, crush, conflitos, vínculos",     Ico: IcoAmizades },
  { id: "Meu futuro",                titulo: "meu futuro",                sub: "carreira, faculdade, propósito",         Ico: IcoFuturo },
  { id: "Não estou bem",             titulo: "não estou bem",             sub: "ansiedade, tristeza, esgotamento",       Ico: null },
  { id: "Só quero conversar",        titulo: "só quero conversar",        sub: "sem assunto definido, só falar",         Ico: IcoConversar },
];

// ─── Componente ───────────────────────────────────────────────
export default function PortasEntrada({ onEntrar }) {
  const { aluno, logout } = useAuth();
  const [hovered, setHovered] = useState(null);

  const apelido = aluno?.apelido || aluno?.nome?.split(" ")[0] || "você";
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "bom dia" : hora < 18 ? "boa tarde" : "boa noite";

  return (
    <div style={s.shell}>

      {/* Header */}
      <div style={s.header}>
        <ARIAOrb size={38} />
        <button onClick={logout} style={s.btnLogout} aria-label="Sair">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round">
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
        {PORTAS.map((porta) => {
          const isHov = hovered === porta.id;
          const isNaoEstouBem = porta.id === "Não estou bem";
          const corIcone = isNaoEstouBem
            ? (isHov ? "var(--error)" : "var(--orb-pink)")
            : (isHov ? "var(--aria-action)" : "var(--muted)");

          return (
            <button
              key={porta.id}
              style={{
                ...s.card,
                background: isHov ? "var(--aria-action-subtle)" : "var(--surface)",
                borderColor: isHov ? "var(--aria-action)" : "var(--border)",
                transform: isHov ? "translateY(-2px)" : "translateY(0)",
                boxShadow: isHov ? "var(--shadow-sm)" : "none",
              }}
              onMouseEnter={() => setHovered(porta.id)}
              onMouseLeave={() => setHovered(null)}
              onTouchStart={() => setHovered(porta.id)}
              onTouchEnd={() => { setHovered(null); onEntrar(porta.id); }}
              onClick={() => onEntrar(porta.id)}
            >
              {/* Área de toque mínima 44x44 garantida pelo padding do card */}
              <div style={{ color: corIcone, transition: "color var(--transition-fast)" }}>
                {isNaoEstouBem
                  ? <IcoNaoEstouBem cor={corIcone} />
                  : porta.Ico && <porta.Ico />
                }
              </div>
              <p style={{
                ...s.cardTitulo,
                color: isHov ? "var(--aria-action)" : "var(--text)",
              }}>
                {porta.titulo}
              </p>
              <p style={s.cardSub}>{porta.sub}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Orb ─────────────────────────────────────────────────────
function ARIAOrb({ size = 38 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, var(--orb-purple), var(--orb-pink))",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "var(--shadow-orb)",
      flexShrink: 0,
    }}>
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none">
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
    color: "var(--text)",
    paddingBottom: "env(safe-area-inset-bottom)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "var(--space-4) var(--space-5)",
    paddingTop: "calc(var(--space-4) + env(safe-area-inset-top))",
  },
  btnLogout: {
    background: "none", border: "none",
    cursor: "pointer", padding: "var(--space-2)",
    borderRadius: "var(--radius-sm)",
    display: "flex", alignItems: "center", justifyContent: "center",
    minWidth: 44, minHeight: 44,
  },
  saudacaoWrap: {
    padding: "var(--space-6) var(--space-6) var(--space-5)",
    animation: "fadeUp 0.35s ease",
  },
  saudacao: {
    fontSize: 26, fontWeight: 600,
    color: "var(--text)", margin: 0, lineHeight: 1.2,
  },
  pergunta: {
    fontSize: 15, color: "var(--muted)",
    margin: "var(--space-2) 0 0", fontWeight: 400,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "var(--space-3)",
    padding: "0 var(--space-4) var(--space-8)",
    flex: 1,
    animation: "fadeUp 0.40s ease",
  },
  card: {
    display: "flex", flexDirection: "column",
    alignItems: "flex-start", gap: "var(--space-2)",
    padding: "var(--space-4)",
    borderRadius: "var(--radius-md)",
    border: "1.5px solid",
    cursor: "pointer", textAlign: "left",
    transition: "all var(--transition-fast)",
    minHeight: 110,
  },
  cardTitulo: {
    fontSize: 14, fontWeight: 600,
    margin: 0, lineHeight: 1.2,
    transition: "color var(--transition-fast)",
  },
  cardSub: {
    fontSize: 12, color: "var(--muted)",
    margin: 0, lineHeight: 1.4, fontWeight: 400,
  },
};
