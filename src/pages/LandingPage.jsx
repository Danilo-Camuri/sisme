// LandingPage.jsx — v2
// Revisões: responsividade mobile/tablet/desktop, fontes UX-corretas,
// headline CÓRTEX sem "terapeuta", ™ no Método CÓRTEX,
// cadência ampliada, "equipe de psicologia", item reformulado,
// contatos reais, links legais desativados.

import { useState, useEffect, useRef } from "react";

// ─── BREAKPOINTS ───
// mobile  < 640px
// tablet  640–1023px
// desktop ≥ 1024px
function useBreakpoint() {
  const [bp, setBp] = useState(() => {
    if (typeof window === "undefined") return "desktop";
    return window.innerWidth < 640 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop";
  });
  useEffect(() => {
    const fn = () => setBp(window.innerWidth < 640 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop");
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return bp;
}

// ─── Orb ───
function ARIAOrb({ size = 44, style = {} }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "linear-gradient(135deg, #4F8EF7, #2DB87D)",
      boxShadow: "0 0 48px rgba(79,142,247,0.28), 0 0 96px rgba(45,184,125,0.14)",
      ...style,
    }} />
  );
}

// ─── Ícones SVG ───
const IcoEscola = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /><path d="M8 7h8M8 11h6" />
  </svg>
);
const IcoFamilia = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" /><path d="M9 21V12h6v9" />
  </svg>
);
const IcoAmizades = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="12" r="6" /><circle cx="15" cy="12" r="6" />
  </svg>
);
const IcoFuturo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);
const IcoOnda = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12c2-4 4 4 6 0s4-4 6 0 4 4 6 0" />
  </svg>
);
const IcoChat = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <circle cx="9" cy="10" r="0.8" fill="currentColor" /><circle cx="12" cy="10" r="0.8" fill="currentColor" /><circle cx="15" cy="10" r="0.8" fill="currentColor" />
  </svg>
);
const IcoShield = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4F8EF7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const IcoCheck = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IcoArrow = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);
const IcoMenu = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const IcoX = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─── Scroll reveal ───
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.10 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}
function Reveal({ children, delay = 0, style = {} }) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(24px)",
      transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Label de seção ───
function SectionLabel({ children }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.10em", color: "#4F8EF7", textTransform: "uppercase", display: "block", marginBottom: 10 }}>
      {children}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════
// NAV
// ═══════════════════════════════════════════════════════════
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const bp = useBreakpoint();
  const isMobile = bp === "mobile";

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const navBg = scrolled || menuOpen
    ? "rgba(245,244,241,0.93)"
    : "transparent";

  const links = ["Como funciona", "Para a escola", "Segurança"];

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: navBg,
      backdropFilter: scrolled || menuOpen ? "blur(14px)" : "none",
      borderBottom: scrolled || menuOpen ? "1px solid rgba(24,23,28,0.07)" : "none",
      transition: "background 0.3s ease, border 0.3s ease",
    }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 20px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Logo */}
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
          <ARIAOrb size={30} />
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text)" }}>ARIA</span>
        </a>

        {/* Desktop links */}
        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            {links.map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}
                style={{ fontSize: 14, color: "var(--text-2)", textDecoration: "none", fontWeight: 500 }}>
                {l}
              </a>
            ))}
            {/* Divisor */}
            <div style={{ width: 1, height: 16, background: "var(--border)" }} />
            {/* Acesso escolar */}
            <a href="/escola/login" style={{ fontSize: 13, color: "var(--text-2)", textDecoration: "none", fontWeight: 500 }}>
              Acesso escolar
            </a>
            {/* Entrar — aluno */}
            <a href="/login" style={{ fontSize: 13, color: "var(--text)", textDecoration: "none", fontWeight: 600 }}>
              Entrar
            </a>
            {/* CTA */}
            <a href="#contato" style={{
              background: "#4F8EF7", color: "#fff", textDecoration: "none",
              padding: "8px 18px", borderRadius: 9999, fontWeight: 600, fontSize: 13,
              boxShadow: "0 2px 12px rgba(79,142,247,0.25)",
            }}>Agendar demonstração</a>
          </div>
        )}

        {/* Mobile hamburger */}
        {isMobile && (
          <button onClick={() => setMenuOpen(o => !o)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)", padding: 4 }}>
            {menuOpen ? <IcoX /> : <IcoMenu />}
          </button>
        )}
      </div>

      {/* Mobile menu */}
      {isMobile && menuOpen && (
        <div style={{ padding: "12px 20px 20px", borderTop: "1px solid var(--border)", background: "rgba(245,244,241,0.97)" }}>
          {links.map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}
              onClick={() => setMenuOpen(false)}
              style={{ display: "block", fontSize: 16, color: "var(--text-2)", textDecoration: "none", fontWeight: 500, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
              {l}
            </a>
          ))}
          <a href="/escola/login" onClick={() => setMenuOpen(false)}
            style={{ display: "block", fontSize: 16, color: "var(--text-2)", textDecoration: "none", fontWeight: 500, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
            Acesso escolar
          </a>
          <a href="/login" onClick={() => setMenuOpen(false)}
            style={{ display: "block", fontSize: 16, color: "var(--text)", textDecoration: "none", fontWeight: 600, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
            Entrar
          </a>
          <a href="#contato" onClick={() => setMenuOpen(false)} style={{
            display: "block", marginTop: 16,
            background: "#4F8EF7", color: "#fff", textDecoration: "none", textAlign: "center",
            padding: "14px", borderRadius: 9999, fontWeight: 600, fontSize: 15,
          }}>Agendar demonstração</a>
        </div>
      )}
    </nav>
  );
}

// ═══════════════════════════════════════════════════════════
// HERO
// ═══════════════════════════════════════════════════════════
function HeroVisual({ bp }) {
  const isMobile = bp === "mobile";
  const orbSize = isMobile ? 100 : 140;
  const radius = isMobile ? 110 : 155;

  const portas = [
    { label: "escola", Ico: IcoEscola, angle: -90 },
    { label: "família", Ico: IcoFamilia, angle: -30 },
    { label: "amizades", Ico: IcoAmizades, angle: 30 },
    { label: "meu futuro", Ico: IcoFuturo, angle: 90 },
    { label: "não estou bem", Ico: IcoOnda, angle: 150 },
    { label: "só conversar", Ico: IcoChat, angle: 210 },
  ];

  const containerSize = (radius + 60) * 2;

  return (
    <div style={{ position: "relative", width: containerSize, height: containerSize, maxWidth: "100%", margin: "0 auto", flexShrink: 0 }}>
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: orbSize, height: orbSize, borderRadius: "50%",
        background: "linear-gradient(135deg, #4F8EF7, #2DB87D)",
        boxShadow: "0 0 70px rgba(79,142,247,0.38), 0 0 120px rgba(45,184,125,0.20)",
        zIndex: 2,
      }} />
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: radius * 2, height: radius * 2, borderRadius: "50%",
        border: "1px dashed rgba(79,142,247,0.22)",
      }} />
      {portas.map((p, i) => {
        const rad = (p.angle * Math.PI) / 180;
        const x = Math.cos(rad) * radius;
        const y = Math.sin(rad) * radius;
        return (
          <div key={i} style={{
            position: "absolute",
            top: `calc(50% + ${y}px)`, left: `calc(50% + ${x}px)`,
            transform: "translate(-50%, -50%)",
            background: "var(--surface)", border: "1.5px solid var(--border)",
            borderRadius: 12, padding: isMobile ? "7px 10px" : "9px 13px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            boxShadow: "var(--shadow-sm)", zIndex: 3,
            minWidth: isMobile ? 60 : 72,
            animation: `lp_float${i % 3} ${3 + (i % 2)}s ease-in-out infinite`,
          }}>
            <div style={{ color: "var(--accent)" }}><p.Ico /></div>
            <span style={{ fontSize: isMobile ? 9 : 10, fontWeight: 600, color: "var(--text-2)", whiteSpace: "nowrap" }}>{p.label}</span>
          </div>
        );
      })}
      <style>{`
        @keyframes lp_float0{0%,100%{transform:translate(-50%,-50%) translateY(0)}50%{transform:translate(-50%,-50%) translateY(-5px)}}
        @keyframes lp_float1{0%,100%{transform:translate(-50%,-50%) translateY(0)}50%{transform:translate(-50%,-50%) translateY(-7px)}}
        @keyframes lp_float2{0%,100%{transform:translate(-50%,-50%) translateY(0)}50%{transform:translate(-50%,-50%) translateY(-4px)}}
      `}</style>
    </div>
  );
}

function Hero() {
  const bp = useBreakpoint();
  const isMobile = bp === "mobile";
  const isDesktop = bp === "desktop";

  return (
    <section style={{
      minHeight: isMobile ? "auto" : "100vh",
      display: "flex", alignItems: "center",
      padding: isMobile ? "88px 20px 60px" : "120px 24px 80px",
      background: "var(--bg)", position: "relative", overflow: "hidden",
    }}>
      {/* Glows */}
      <div style={{ position: "absolute", top: "15%", right: "5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,142,247,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "5%", right: "30%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(45,184,125,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{
        maxWidth: 1080, margin: "0 auto", width: "100%",
        display: isDesktop ? "grid" : "flex",
        gridTemplateColumns: isDesktop ? "1fr 1fr" : undefined,
        flexDirection: isDesktop ? undefined : "column",
        gap: isMobile ? 48 : 56,
        alignItems: "center",
      }}>
        {/* Texto */}
        <div style={{ textAlign: isMobile ? "center" : "left" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            background: "rgba(79,142,247,0.10)", border: "1px solid rgba(79,142,247,0.22)",
            borderRadius: 9999, padding: "5px 14px", marginBottom: 24,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4F8EF7" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#4F8EF7", letterSpacing: "0.06em" }}>APOIO PSICOEMOCIONAL COM IA</span>
          </div>

          <h1 style={{
            fontSize: isMobile ? 36 : bp === "tablet" ? 44 : 52,
            fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.03em",
            color: "var(--text)", margin: "0 0 18px",
          }}>
            O Ensino Médio<br />
            é difícil.<br />
            <span style={{ color: "#4F8EF7" }}>A ARIA está lá</span><br />
            quando ninguém<br />mais está.
          </h1>

          <p style={{
            fontSize: isMobile ? 16 : 17, color: "var(--text-2)", lineHeight: 1.7,
            margin: isMobile ? "0 auto 32px" : "0 0 32px", maxWidth: 460,
          }}>
            Apoio psicoemocional com IA para adolescentes, disponível 24 horas, com fundamentação clínica real e integração com a equipe da escola.
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: isMobile ? "center" : "flex-start" }}>
            <a href="#contato" style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "#4F8EF7", color: "#fff", textDecoration: "none",
              padding: isMobile ? "13px 24px" : "14px 28px",
              borderRadius: 9999, fontWeight: 600, fontSize: isMobile ? 15 : 15,
              boxShadow: "0 4px 20px rgba(79,142,247,0.30)",
            }}>
              Agendar demonstração <IcoArrow />
            </a>
            <a href="#como-funciona" style={{
              display: "inline-flex", alignItems: "center",
              background: "transparent", color: "var(--text-2)", textDecoration: "none",
              padding: isMobile ? "13px 20px" : "14px 22px",
              borderRadius: 9999, fontWeight: 500, fontSize: 15,
              border: "1.5px solid var(--border)",
            }}>
              Conhecer o produto
            </a>
          </div>
        </div>

        {/* Visual */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <HeroVisual bp={bp} />
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// PROBLEMA
// ═══════════════════════════════════════════════════════════
function Problema() {
  const bp = useBreakpoint();
  const isMobile = bp === "mobile";
  return (
    <section style={{ background: "var(--surface)", padding: isMobile ? "64px 20px" : "96px 24px" }}>
      <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
        <Reveal>
          <SectionLabel>O problema</SectionLabel>
          <h2 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 700, letterSpacing: "-0.025em", color: "var(--text)", margin: "0 0 24px", lineHeight: 1.2 }}>
            Eles já estão pedindo ajuda.<br />Só não estão pedindo para você.
          </h2>
          <p style={{ fontSize: isMobile ? 15 : 17, color: "var(--text-2)", lineHeight: 1.75, margin: "0 0 18px" }}>
            Todo dia, adolescentes de 15 a 18 anos abrem o ChatGPT para desabafar sobre a prova que reprovaram, a briga com os pais, a amizade que acabou, o futuro que não faz sentido. Eles fazem isso porque é mais fácil falar com uma tela do que com um adulto, porque não querem preocupar ninguém, porque não sabem exatamente o que estão sentindo.
          </p>
          <p style={{ fontSize: isMobile ? 15 : 17, color: "var(--text-2)", lineHeight: 1.75, margin: "0 0 18px" }}>
            O problema não é que eles usam tecnologia para isso. O problema é que a tecnologia que eles usam não foi feita para eles. Não lembra quem eles são. Não percebe quando a situação está ficando séria. Não avisa ninguém quando precisa.
          </p>
          <p style={{ fontSize: isMobile ? 15 : 17, fontWeight: 600, color: "var(--text)", lineHeight: 1.75 }}>
            A ARIA foi construída especificamente para esse momento, esse público e essa responsabilidade.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// COMO FUNCIONA — CÓRTEX
// ═══════════════════════════════════════════════════════════
function ComoFunciona() {
  const bp = useBreakpoint();
  const isMobile = bp === "mobile";

  const construtos = [
    { letra: "C", nome: "Carga emocional", desc: "Ansiedade, tensão acumulada, sensação de não conseguir dar conta." },
    { letra: "O", nome: "Organização e foco", desc: "Rotina de estudos, procrastinação, demandas acadêmicas que se acumulam." },
    { letra: "R", nome: "Relações", desc: "Família, amizades, namoro, professores e tudo que envolve vínculo." },
    { letra: "T", nome: "Tensão no corpo", desc: "Insônia, agitação, irritabilidade, aquele travar que não tem explicação." },
    { letra: "E", nome: "Energia e sentido", desc: "Motivação, prazer, disposição, vontade de fazer as coisas." },
    { letra: "X", nome: "Xeque existencial", desc: "Identidade, futuro, pertencimento, a pergunta de quem sou e o que quero." },
  ];

  const etapas = [
    { n: "01", label: "Conexão", desc: "Abertura contextual personalizada com base no histórico do aluno" },
    { n: "02", label: "Exploração", desc: "Uma pergunta de cada vez, com escuta ativa e validação" },
    { n: "03", label: "Descoberta", desc: "Identifica o que está por baixo do tema, não só o que foi dito" },
    { n: "04", label: "Insight", desc: "Entrega uma observação ou perspectiva que o aluno ainda não viu" },
    { n: "05", label: "Microação", desc: "Algo concreto e pequeno para fazer até a próxima conversa" },
    { n: "06", label: "Fechamento", desc: "A última fala é sempre da ARIA — nenhuma conversa termina no vazio" },
  ];

  return (
    <section id="como-funciona" style={{ padding: isMobile ? "64px 20px" : "96px 24px", background: "var(--bg)" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 40 : 56 }}>
            <SectionLabel>Base clínica</SectionLabel>
            {/* HEADLINE REVISADA — sem "terapeuta" */}
            <h2 style={{ fontSize: isMobile ? 24 : 34, fontWeight: 700, letterSpacing: "-0.025em", color: "var(--text)", margin: "0 0 16px", lineHeight: 1.2 }}>
              Uma presença construída a partir da<br />psicologia baseada em evidências.
            </h2>
            <p style={{ fontSize: isMobile ? 15 : 16, color: "var(--text-2)", maxWidth: 580, margin: "0 auto", lineHeight: 1.7 }}>
              Por trás de cada conversa, a ARIA opera sobre o Método CÓRTEX™, um framework clínico que identifica silenciosamente qual dimensão da vida do aluno está mais ativada naquele momento. O aluno nunca vê o método. Ele só sente que está sendo compreendido.
            </p>
          </div>
        </Reveal>

        {/* Cards CÓRTEX */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 14,
        }}>
          {construtos.map((c, i) => (
            <Reveal key={c.letra} delay={i * 55}>
              <div style={{
                background: "var(--surface)", border: "1.5px solid var(--border)",
                borderRadius: 16, padding: "20px 22px", display: "flex", gap: 14, alignItems: "flex-start",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(79,142,247,0.35)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                  background: "rgba(79,142,247,0.10)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 17, fontWeight: 800, color: "#4F8EF7",
                }}>{c.letra}</div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "0 0 4px" }}>{c.nome}</p>
                  <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0, lineHeight: 1.6 }}>{c.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Cadência — AMPLIADA */}
        <Reveal delay={200} style={{ marginTop: isMobile ? 32 : 48 }}>
          <div style={{
            background: "var(--surface)", border: "1.5px solid var(--border)",
            borderRadius: 20, padding: isMobile ? "28px 20px" : "40px 44px",
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "#4F8EF7", textTransform: "uppercase", margin: "0 0 28px" }}>
              Como cada conversa é estruturada
            </p>
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(6, 1fr)",
              gap: isMobile ? 20 : 0,
            }}>
              {etapas.map((etapa, i, arr) => (
                <div key={etapa.n} style={{
                  padding: isMobile ? "0" : "0 18px",
                  borderRight: !isMobile && i < arr.length - 1 ? "1px solid var(--border)" : "none",
                  paddingLeft: !isMobile && i === 0 ? 0 : undefined,
                }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", margin: "0 0 6px", letterSpacing: "0.04em" }}>{etapa.n}</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "0 0 6px" }}>{etapa.label}</p>
                  <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0, lineHeight: 1.55 }}>{etapa.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// CIÊNCIA
// ═══════════════════════════════════════════════════════════
function Ciencia() {
  const bp = useBreakpoint();
  const isMobile = bp === "mobile";

  const dados = [
    { fonte: "Lancet Digital Health · JMIR", texto: "Intervenções digitais baseadas em TCC produzem redução significativa de sintomas de ansiedade e depressão em adolescentes, com resultados comparáveis a intervenções presenciais de curta duração quando há personalização e engajamento ativo." },
    { fonte: "Organização Mundial da Saúde", texto: "Mais de 70% dos adolescentes com transtornos mentais não recebem tratamento. As principais barreiras são estigma, custo e falta de profissionais. Soluções digitais reduzem as três ao mesmo tempo." },
    { fonte: "American Psychological Association", texto: "Adolescentes buscam apoio emocional em plataformas digitais com muito mais frequência do que em contextos presenciais formais, especialmente para relacionamento, identidade e pressão acadêmica." },
    { fonte: "British Journal of Educational Psychology", texto: "Metanálise demonstra correlação direta entre bem-estar emocional e desempenho acadêmico. Intervenções socioeducativas nas escolas produzem ganhos mensuráveis em notas, frequência e engajamento." },
  ];

  return (
    <section style={{ background: "var(--text)", padding: isMobile ? "64px 20px" : "96px 24px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 36 : 52 }}>
            <SectionLabel>Embasamento científico</SectionLabel>
            <h2 style={{ fontSize: isMobile ? 24 : 34, fontWeight: 700, letterSpacing: "-0.025em", color: "#F5F4F1", margin: "0 0 14px", lineHeight: 1.2 }}>
              Tecnologia a serviço<br />do que a ciência já provou.
            </h2>
            <p style={{ fontSize: isMobile ? 15 : 16, color: "rgba(245,244,241,0.58)", maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
              A ARIA foi construída sobre um campo de pesquisa sólido que demonstra, com dados, por que intervenções digitais em saúde mental adolescente funcionam e por que a escola é o lugar certo para isso acontecer.
            </p>
          </div>
        </Reveal>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
          gap: 14,
        }}>
          {dados.map((d, i) => (
            <Reveal key={i} delay={i * 80}>
              <div style={{
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 16, padding: isMobile ? "22px 20px" : "26px 30px",
              }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", color: "#4F8EF7", textTransform: "uppercase", margin: "0 0 10px" }}>{d.fonte}</p>
                <p style={{ fontSize: isMobile ? 14 : 15, color: "rgba(245,244,241,0.80)", lineHeight: 1.7, margin: 0 }}>{d.texto}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={280}>
          <div style={{
            marginTop: 14,
            background: "rgba(79,142,247,0.14)", border: "1px solid rgba(79,142,247,0.24)",
            borderRadius: 16, padding: isMobile ? "20px" : "22px 30px", textAlign: "center",
          }}>
            <p style={{ fontSize: isMobile ? 14 : 16, color: "#F5F4F1", lineHeight: 1.7, margin: 0 }}>
              Cada <strong style={{ color: "#4F8EF7" }}>R$1</strong> investido em prevenção de saúde mental na adolescência gera economia de <strong style={{ color: "#4F8EF7" }}>R$4 a R$7</strong> em custos de tratamento na vida adulta.{" "}
              <span style={{ color: "rgba(245,244,241,0.45)", fontSize: 12 }}>NIMH · Lancet Commission on Global Mental Health</span>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// PARA ESCOLA — dois públicos
// ═══════════════════════════════════════════════════════════
function ParaEscola() {
  const bp = useBreakpoint();
  const isMobile = bp === "mobile";
  const isDesktop = bp === "desktop";

  return (
    <section id="para-escola" style={{ padding: isMobile ? "64px 20px" : "96px 24px", background: "var(--bg)" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 36 : 52 }}>
            <SectionLabel>Para a escola</SectionLabel>
            <h2 style={{ fontSize: isMobile ? 24 : 34, fontWeight: 700, letterSpacing: "-0.025em", color: "var(--text)", margin: "0 0 14px", lineHeight: 1.2 }}>
              Para a escola que quer fazer mais pelo aluno,<br />com estrutura e segurança para isso.
            </h2>
          </div>
        </Reveal>

        <div style={{
          display: "grid",
          gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr",
          gap: 20,
        }}>
          {/* Gestor */}
          <Reveal delay={0}>
            <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 20, padding: isMobile ? "28px 24px" : "36px" }}>
              <div style={{
                display: "inline-flex", alignItems: "center",
                background: "rgba(79,142,247,0.10)", borderRadius: 9999,
                padding: "5px 14px", marginBottom: 18,
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#4F8EF7" }}>Para o diretor e coordenador pedagógico</span>
              </div>
              <p style={{ fontSize: isMobile ? 15 : 16, color: "var(--text-2)", lineHeight: 1.75, margin: "0 0 22px" }}>
                A escola privada brasileira enfrenta uma pressão crescente: pais que cobram desempenho acadêmico, alunos que chegam emocionalmente esgotados, e uma equipe de orientação que não tem como atender 400 alunos individualmente. A ARIA não resolve tudo isso. Mas ela cobre a demanda que nenhuma estrutura escolar consegue cobrir sozinha: o entre-sessões, o fim de semana, as 23h antes de uma prova.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  "Cuidado preventivo funcionando 24 horas",
                  "Dados agregados por turma para decisões pedagógicas",
                  "Protocolo de crise que aciona a equipe automaticamente",
                  "Dados armazenados no Brasil, em conformidade com a LGPD",
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, marginTop: 1, background: "rgba(79,142,247,0.12)", color: "#4F8EF7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <IcoCheck />
                    </div>
                    <span style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Equipe de psicologia — REFORMULADO */}
          <Reveal delay={isMobile ? 0 : 120}>
            <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 20, padding: isMobile ? "28px 24px" : "36px" }}>
              <div style={{
                display: "inline-flex", alignItems: "center",
                background: "rgba(45,184,125,0.10)", borderRadius: 9999,
                padding: "5px 14px", marginBottom: 18,
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#2DB87D" }}>Para a equipe de psicologia</span>
              </div>
              <p style={{ fontSize: isMobile ? 15 : 16, color: "var(--text-2)", lineHeight: 1.75, margin: "0 0 22px" }}>
                A ARIA não substitui o seu trabalho. Ela o amplifica. Enquanto você atende casos clínicos e conduz grupos, a ARIA cuida da demanda cotidiana. Quando um aluno chega até você, você já tem contexto do que aconteceu, o padrão emocional mais recorrente e os alertas que foram disparados.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  "Contexto acumulado do aluno ao longo do tempo, disponível para você",
                  "Alertas em tempo real quando um aluno precisa de atenção",
                  "Dashboard com padrões por turma e período",
                  "Você controla o que vê e quando intervém",
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, marginTop: 1, background: "rgba(45,184,125,0.12)", color: "#2DB87D", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <IcoCheck />
                    </div>
                    <span style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// SEGURANÇA
// ═══════════════════════════════════════════════════════════
function Seguranca() {
  const bp = useBreakpoint();
  const isMobile = bp === "mobile";
  const isDesktop = bp === "desktop";

  const niveis = [
    { n: 0, label: "Sofrimento cotidiano", cor: "#2DB87D", bgCor: "rgba(45,184,125,0.09)", desc: "Ansiedade de prova, briga com amigo, estresse de fim de bimestre. A ARIA acolhe, explora e oferece perspectiva. Nenhuma ação externa." },
    { n: 1, label: "Sofrimento elevado", cor: "#F0A030", bgCor: "rgba(240,160,48,0.09)", desc: "Sinais de isolamento, desesperança ou esgotamento prolongado. A ARIA aprofunda a escuta e sugere que o aluno converse com um adulto de confiança." },
    { n: 2, label: "Risco moderado", cor: "#E05252", bgCor: "rgba(224,82,82,0.09)", desc: "Sinais de automutilação sem risco imediato. A ARIA acolhe, informa o orientador via dashboard e oferece o CVV (188)." },
    { n: 3, label: "Risco imediato", cor: "#C0392B", bgCor: "rgba(192,57,43,0.11)", desc: "Ideação suicida ativa. A ARIA para tudo, orienta ligar para o CVV imediatamente e aciona alerta automático para o orientador escolar." },
  ];

  return (
    <section id="seguranca" style={{ padding: isMobile ? "64px 20px" : "96px 24px", background: "var(--surface)" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <div style={{
          display: isDesktop ? "grid" : "flex",
          gridTemplateColumns: isDesktop ? "1fr 1fr" : undefined,
          flexDirection: isDesktop ? undefined : "column",
          gap: isMobile ? 36 : 56,
          alignItems: "start",
        }}>
          <Reveal>
            <div>
              <SectionLabel>Protocolo de segurança</SectionLabel>
              <h2 style={{ fontSize: isMobile ? 24 : 34, fontWeight: 700, letterSpacing: "-0.025em", color: "var(--text)", margin: "0 0 18px", lineHeight: 1.2 }}>
                Quando as coisas ficam sérias, a ARIA sabe o que fazer.
              </h2>
              <p style={{ fontSize: isMobile ? 15 : 16, color: "var(--text-2)", lineHeight: 1.75, margin: "0 0 18px" }}>
                O protocolo de crise foi desenvolvido com rigor clínico por psicólogo com CRP ativo, especialista em TCC e Terapia do Esquema. A plataforma monitora continuamente o nível de sofrimento em cada conversa e age de forma diferenciada em cada situação.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(79,142,247,0.08)", border: "1px solid rgba(79,142,247,0.15)", borderRadius: 12, padding: "13px 16px" }}>
                <IcoShield />
                <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0, lineHeight: 1.5 }}>
                  Danilo Camuri Teixeira Lopes, Mestre em Psicologia, especialista em TCC e Terapia do Esquema. CRP 21/02554.
                </p>
              </div>
            </div>
          </Reveal>

          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {niveis.map((n, i) => (
              <Reveal key={n.n} delay={i * 70}>
                <div style={{ background: n.bgCor, border: `1.5px solid ${n.cor}28`, borderRadius: 14, padding: "16px 18px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 9999, flexShrink: 0,
                    background: n.cor, color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 800,
                  }}>{n.n}</div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "0 0 4px" }}>{n.label}</p>
                    <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0, lineHeight: 1.55 }}>{n.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// CTA FINAL — contatos reais
// ═══════════════════════════════════════════════════════════
function CTAFinal() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const bp = useBreakpoint();
  const isMobile = bp === "mobile";

  return (
    <section id="contato" style={{ padding: isMobile ? "64px 20px" : "96px 24px", background: "var(--bg)" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
        <Reveal>
          <ARIAOrb size={60} style={{ margin: "0 auto 24px" }} />
          <h2 style={{ fontSize: isMobile ? 26 : 38, fontWeight: 700, letterSpacing: "-0.025em", color: "var(--text)", margin: "0 0 14px", lineHeight: 1.15 }}>
            Sua escola pode ser a primeira<br />a oferecer isso aos alunos.
          </h2>
          <p style={{ fontSize: isMobile ? 15 : 17, color: "var(--text-2)", lineHeight: 1.7, margin: "0 0 36px" }}>
            A ARIA está disponível para escolas privadas brasileiras. Agende uma demonstração e veja o produto funcionando em 30 minutos.
          </p>

          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 36 }}>
            <a href="mailto:danilocamurilopes@gmail.com" style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "#4F8EF7", color: "#fff", textDecoration: "none",
              padding: isMobile ? "13px 22px" : "14px 28px",
              borderRadius: 9999, fontWeight: 600, fontSize: isMobile ? 14 : 15,
              boxShadow: "0 4px 20px rgba(79,142,247,0.30)",
            }}>
              Agendar demonstração <IcoArrow />
            </a>
            <a href="https://wa.me/5586999606217" style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "transparent", color: "var(--text-2)", textDecoration: "none",
              padding: isMobile ? "13px 18px" : "14px 22px",
              borderRadius: 9999, fontWeight: 500, fontSize: isMobile ? 14 : 15,
              border: "1.5px solid var(--border)",
            }}>
              Falar pelo WhatsApp
            </a>
          </div>

          {!enviado ? (
            <div>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 10 }}>Prefere receber mais informações primeiro?</p>
              <div style={{ display: "flex", gap: 8, maxWidth: 400, margin: "0 auto" }}>
                <input
                  type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  style={{
                    flex: 1, padding: "11px 16px", borderRadius: 9999, fontSize: 14,
                    border: "1.5px solid var(--border)", background: "var(--surface)",
                    color: "var(--text)", outline: "none",
                  }}
                />
                <button
                  onClick={() => { if (email) setEnviado(true); }}
                  style={{
                    background: "var(--text)", color: "var(--bg)",
                    padding: "11px 18px", borderRadius: 9999,
                    fontWeight: 600, fontSize: 14, border: "none", cursor: "pointer",
                  }}
                >Enviar</button>
              </div>
            </div>
          ) : (
            <div style={{ background: "rgba(45,184,125,0.10)", border: "1px solid rgba(45,184,125,0.25)", borderRadius: 12, padding: "13px 20px" }}>
              <p style={{ color: "#2DB87D", fontWeight: 600, margin: 0, fontSize: 15 }}>Recebemos seu contato. Em breve a gente chega.</p>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// RODAPÉ — links legais desativados por ora
// ═══════════════════════════════════════════════════════════
function Footer() {
  const bp = useBreakpoint();
  const isMobile = bp === "mobile";
  return (
    <footer style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", padding: isMobile ? "32px 20px" : "40px 24px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 7 }}>
              <ARIAOrb size={26} />
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>ARIA</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: 0, maxWidth: 240, lineHeight: 1.6 }}>
              Apoio psicoemocional para o Ensino Médio.
            </p>
          </div>
          <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", color: "var(--muted)", textTransform: "uppercase", margin: "0 0 10px" }}>Produto</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {[["Como funciona", "#como-funciona"], ["Para a escola", "#para-escola"], ["Segurança", "#seguranca"]].map(([l, h]) => (
                  <a key={l} href={h} style={{ fontSize: 13, color: "var(--text-2)", textDecoration: "none" }}>{l}</a>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", color: "var(--muted)", textTransform: "uppercase", margin: "0 0 10px" }}>Legal</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <a href="/privacidade" style={{ fontSize: 13, color: "var(--text-2)", textDecoration: "none" }}>Política de privacidade</a>
                <a href="/termos" style={{ fontSize: 13, color: "var(--text-2)", textDecoration: "none" }}>Termos de uso</a>
                <a href="/protecao-a-vida" style={{ fontSize: 13, color: "var(--text-2)", textDecoration: "none" }}>Política de proteção à vida</a>
              </div>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", color: "var(--muted)", textTransform: "uppercase", margin: "0 0 10px" }}>Contato</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <a href="mailto:danilocamurilopes@gmail.com" style={{ fontSize: 13, color: "var(--text-2)", textDecoration: "none" }}>danilocamurilopes@gmail.com</a>
                <a href="https://wa.me/5586999606217" style={{ fontSize: 13, color: "var(--text-2)", textDecoration: "none" }}>WhatsApp (86) 99960-6217</a>
              </div>
            </div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid var(--border)", marginTop: 28, paddingTop: 20 }}>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>
            Desenvolvido com fundamentação clínica por Danilo Camuri Teixeira Lopes, Mestre em Psicologia, CRP 21/02554.
            Dados armazenados em servidores no Brasil. Todos os direitos reservados. ARIA, 2026.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════
export default function LandingPage() {
  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", background: "var(--bg)" }}>
      <Nav />
      <Hero />
      <Problema />
      <ComoFunciona />
      <Ciencia />
      <ParaEscola />
      <Seguranca />
      <CTAFinal />
      <Footer />
    </div>
  );
}
