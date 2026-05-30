import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

// Escola — livro aberto limpo
const IcoEscola = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <path d="M8 7h8M8 11h6" />
  </svg>
);

// Família — casa simples
const IcoFamilia = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
    <path d="M9 21V12h6v9" />
  </svg>
);

// Amizades — dois círculos Venn
const IcoAmizades = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="12" r="6" />
    <circle cx="15" cy="12" r="6" />
  </svg>
);

// Meu futuro — bússola
const IcoFuturo = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

// Não estou bem — linha ondulada
const IcoNaoEstouBem = ({ cor }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke={cor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12c2-4 4 4 6 0s4-4 6 0 4 4 6 0" />
  </svg>
);

// Só quero conversar — balão de fala
const IcoConversar = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <circle cx="9" cy="10" r="0.8" fill="currentColor" />
    <circle cx="12" cy="10" r="0.8" fill="currentColor" />
    <circle cx="15" cy="10" r="0.8" fill="currentColor" />
  </svg>
);

const PORTAS = [
  { id: "Escola",                     titulo: "escola",           sub: "estudos, provas, ENEM, professores",  Ico: IcoEscola },
  { id: "Família",                    titulo: "família",          sub: "pais, irmãos, casa, pressão",         Ico: IcoFamilia },
  { id: "Amizades e relacionamentos", titulo: "amizades",         sub: "amigos, crush, conflitos, vínculos",  Ico: IcoAmizades },
  { id: "Meu futuro",                 titulo: "meu futuro",       sub: "carreira, faculdade, propósito",      Ico: IcoFuturo },
  { id: "Não estou bem",              titulo: "não estou bem",    sub: "ansiedade, tristeza, esgotamento",    Ico: null },
  { id: "Só quero conversar",         titulo: "só quero conversar", sub: "sem assunto definido, só falar",   Ico: IcoConversar },
];

export default function PortasEntrada({ onEntrar }) {
  const { aluno, logout } = useAuth();
  const [hovered, setHovered] = useState(null);

  const apelido = aluno?.apelido || aluno?.nome?.split(" ")[0] || "você";
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "bom dia" : hora < 18 ? "boa tarde" : "boa noite";

  return (
    <div style={s.shell}>
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

      <div style={s.saudacaoWrap}>
        <p style={s.saudacao}>{saudacao}, {apelido}.</p>
        <p style={s.pergunta}>sobre o que você quer falar hoje?</p>
      </div>

      <div style={s.grid}>
        {PORTAS.map((porta) => {
          const isHov = hovered === porta.id;
          const isNaoEstouBem = porta.id === "Não estou bem";
          const corIcone = isNaoEstouBem
            ? (isHov ? "var(--error)" : "var(--muted)")
            : (isHov ? "var(--accent)" : "var(--muted)");

          return (
            <button
              key={porta.id}
              style={{
                ...s.card,
                background: isHov ? "var(--accent-subtle)" : "var(--surface)",
                borderColor: isHov ? "var(--accent)" : "var(--border)",
                transform: isHov ? "translateY(-2px)" : "translateY(0)",
                boxShadow: isHov ? "var(--shadow-sm)" : "none",
              }}
              onMouseEnter={() => setHovered(porta.id)}
              onMouseLeave={() => setHovered(null)}
              onTouchStart={() => setHovered(porta.id)}
              onTouchEnd={() => { setHovered(null); onEntrar(porta.id); }}
              onClick={() => onEntrar(porta.id)}
            >
              <div style={{ color: corIcone, transition: "color var(--transition-fast)" }}>
                {isNaoEstouBem
                  ? <IcoNaoEstouBem cor={corIcone} />
                  : porta.Ico && <porta.Ico />
                }
              </div>
              <p style={{ ...s.cardTitulo, color: isHov ? "var(--accent)" : "var(--text)" }}>
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

function ARIAOrb({ size = 38 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, var(--orb-purple), var(--orb-pink))",
      boxShadow: "var(--shadow-orb)",
      flexShrink: 0,
    }} />
  );
}

const s = {
  shell: {
    minHeight: "100dvh", display: "flex", flexDirection: "column",
    background: "var(--bg)", color: "var(--text)",
    paddingBottom: "env(safe-area-inset-bottom)",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "var(--space-4) var(--space-5)",
    paddingTop: "calc(var(--space-4) + env(safe-area-inset-top))",
  },
  btnLogout: {
    background: "none", border: "none", cursor: "pointer",
    padding: "var(--space-2)", borderRadius: "var(--radius-sm)",
    display: "flex", alignItems: "center", justifyContent: "center",
    minWidth: 44, minHeight: 44,
  },
  saudacaoWrap: { padding: "var(--space-6) var(--space-6) var(--space-5)", animation: "fadeUp 0.35s ease" },
  saudacao: { fontSize: 26, fontWeight: 600, color: "var(--text)", margin: 0, lineHeight: 1.2 },
  pergunta: { fontSize: 15, color: "var(--muted)", margin: "var(--space-2) 0 0", fontWeight: 400 },
  grid: {
    display: "grid", gridTemplateColumns: "repeat(2, 1fr)",
    gap: "var(--space-3)", padding: "0 var(--space-4) var(--space-8)",
    flex: 1, animation: "fadeUp 0.40s ease",
  },
  card: {
    display: "flex", flexDirection: "column", alignItems: "flex-start",
    gap: "var(--space-2)", padding: "var(--space-4)",
    borderRadius: "var(--radius-md)", border: "1.5px solid",
    cursor: "pointer", textAlign: "left",
    transition: "all var(--transition-fast)", minHeight: 110,
  },
  cardTitulo: { fontSize: 14, fontWeight: 600, margin: 0, lineHeight: 1.2, transition: "color var(--transition-fast)" },
  cardSub: { fontSize: 12, color: "var(--muted)", margin: 0, lineHeight: 1.4, fontWeight: 400 },
};
