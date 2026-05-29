import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

// ─── Ícones SVG fiéis ao design do cofundador
//     viewBox 0 0 24 24 | stroke currentColor | strokeWidth 1.5
//     strokeLinecap round | strokeLinejoin round | fill none
//     Tamanho renderizado 28x28 | Área de toque 44x44
//     "Não estou bem": stroke recebe cor como prop (orb-pink em repouso, error em hover)

// Escola — livro aberto com dobra no canto inferior direito
const IcoEscola = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 6.5C2 6.5 7 5 12 5s10 1.5 10 1.5V20s-5-1.5-10-1.5S2 20 2 20V6.5z" />
    <path d="M12 5v13.5" />
    <path d="M18.5 18.5L20 20" />
  </svg>
);

// Família — telhado triangular com chaminé e base horizontal
const IcoFamilia = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20h20" />
    <path d="M4 20L12 6l8 14" />
    <rect x="15" y="9" width="3" height="5" />
  </svg>
);

// Amizades — dois círculos sobrepostos estilo Venn
const IcoAmizades = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="12" r="6" />
    <circle cx="15" cy="12" r="6" />
  </svg>
);

// Meu futuro — círculo com agulha diamante diagonal
const IcoFuturo = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9.5" />
    <path d="M7.5 16.5L12 8l4.5 8.5" />
    <path d="M7.5 16.5L16.5 7.5" />
  </svg>
);

// Não estou bem — linha ondulada horizontal (stroke via prop para cor diferente)
const IcoNaoEstouBem = ({ cor }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke={cor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12 C4 8.5, 6 15.5, 8 12 C10 8.5, 12 15.5, 14 12 C16 8.5, 18 15.5, 20 12" />
  </svg>
);

// Só quero conversar — três pontos preenchidos centralizados
const IcoConversar = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="7"  cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="17" cy="12" r="2" />
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
