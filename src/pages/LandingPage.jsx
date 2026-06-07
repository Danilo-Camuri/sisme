// LandingPage.jsx
// Landing page pública da ARIA — rota "/"
// Usa os mesmos tokens do aria-tokens.css e padrões visuais do app

import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

// Força tema claro na landing — independente do horário
function useForceLightTheme() {
  useEffect(() => {
    const prev = document.documentElement.getAttribute("data-theme");
    document.documentElement.setAttribute("data-theme", "light");
    return () => {
      if (prev) document.documentElement.setAttribute("data-theme", prev);
      else document.documentElement.removeAttribute("data-theme");
    };
  }, []);
}

// ─── Orb reutilizável (mesmo padrão do Login.jsx e PortasEntrada.jsx) ───
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

// ─── Ícones SVG (mesmos do PortasEntrada.jsx) ───
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
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const IcoBrain = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2a2.5 2.5 0 0 1 5 0M9.5 2C7 2 5 4 5 6.5c0 1.5.7 2.8 1.8 3.7C5.7 11.1 5 12.4 5 14c0 2.2 1.5 4 3.5 4.5V21h7v-2.5C17.5 18 19 16.2 19 14c0-1.6-.7-2.9-1.8-3.8C18.3 9.3 19 8 19 6.5 19 4 17 2 14.5 2" />
    <path d="M12 6v6M9 9h6" />
  </svg>
);
const IcoCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IcoArrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

// ─── Hook de scroll reveal ───
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

// ─── Componente de seção com reveal ───
function Reveal({ children, delay = 0, style = {} }) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(28px)",
      transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── NAV ───
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? "rgba(245,244,241,0.88)" : "transparent",
      backdropFilter: scrolled ? "blur(12px)" : "none",
      borderBottom: scrolled ? "1px solid rgba(24,23,28,0.07)" : "none",
      transition: "all 0.3s ease",
    }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ARIAOrb size={32} />
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text)" }}>ARIA</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 28, fontSize: 14, color: "var(--text-2)" }}>
          <a href="#como-funciona" style={{ color: "var(--text-2)", textDecoration: "none" }}>Como funciona</a>
          <a href="#para-escola" style={{ color: "var(--text-2)", textDecoration: "none" }}>Para a escola</a>
          <a href="#seguranca" style={{ color: "var(--text-2)", textDecoration: "none" }}>Segurança</a>
          <a href="#contato" style={{
            background: "#4F8EF7", color: "#fff", textDecoration: "none",
            padding: "8px 18px", borderRadius: 9999, fontWeight: 600, fontSize: 13,
          }}>Agendar demonstração</a>
        </div>
      </div>
    </nav>
  );
}

// ─── HERO ───
function Hero() {
  return (
    <section style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      padding: "120px 24px 80px", background: "var(--bg)",
      position: "relative", overflow: "hidden",
    }}>
      {/* Glow de fundo sutil */}
      <div style={{
        position: "absolute", top: "20%", right: "10%",
        width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(79,142,247,0.07) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "10%", right: "25%",
        width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(45,184,125,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: 1080, margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>

        {/* Texto */}
        <div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(79,142,247,0.10)", border: "1px solid rgba(79,142,247,0.20)",
            borderRadius: 9999, padding: "5px 14px", marginBottom: 28,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4F8EF7" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#4F8EF7", letterSpacing: "0.04em" }}>APOIO PSICOEMOCIONAL COM IA</span>
          </div>

          <h1 style={{
            fontSize: "clamp(36px, 4vw, 54px)", fontWeight: 700,
            lineHeight: 1.1, letterSpacing: "-0.03em",
            color: "var(--text)", margin: "0 0 20px",
          }}>
            O Ensino Médio<br />
            é difícil.<br />
            <span style={{ color: "#4F8EF7" }}>A ARIA está lá</span><br />
            quando ninguém<br />mais está.
          </h1>

          <p style={{ fontSize: 17, color: "var(--text-2)", lineHeight: 1.7, margin: "0 0 36px", maxWidth: 460 }}>
            Apoio psicoemocional com IA para adolescentes, disponível 24 horas, com fundamentação clínica real e integração com a equipe da escola.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href="#contato" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#4F8EF7", color: "#fff", textDecoration: "none",
              padding: "14px 28px", borderRadius: 9999, fontWeight: 600, fontSize: 15,
              boxShadow: "0 4px 20px rgba(79,142,247,0.30)",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 28px rgba(79,142,247,0.40)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(79,142,247,0.30)"; }}
            >
              Agendar demonstração <IcoArrow />
            </a>
            <a href="#como-funciona" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "transparent", color: "var(--text-2)", textDecoration: "none",
              padding: "14px 24px", borderRadius: 9999, fontWeight: 500, fontSize: 15,
              border: "1.5px solid var(--border)",
            }}>
              Conhecer o produto
            </a>
          </div>
        </div>

        {/* Orb visual com portas orbitando */}
        <HeroVisual />
      </div>
    </section>
  );
}

function HeroVisual() {
  const portas = [
    { label: "escola", Ico: IcoEscola, angle: -90 },
    { label: "família", Ico: IcoFamilia, angle: -30 },
    { label: "amizades", Ico: IcoAmizades, angle: 30 },
    { label: "meu futuro", Ico: IcoFuturo, angle: 90 },
    { label: "não estou bem", Ico: IcoOnda, angle: 150 },
    { label: "só conversar", Ico: IcoChat, angle: 210 },
  ];
  const radius = 170;

  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "1", maxWidth: 440, margin: "0 auto" }}>
      {/* Orb central */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 160, height: 160, borderRadius: "50%",
        background: "linear-gradient(135deg, #4F8EF7, #2DB87D)",
        boxShadow: "0 0 80px rgba(79,142,247,0.35), 0 0 140px rgba(45,184,125,0.18)",
        zIndex: 2,
      }} />

      {/* Anel pontilhado */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: radius * 2, height: radius * 2, borderRadius: "50%",
        border: "1px dashed rgba(79,142,247,0.20)",
      }} />

      {/* Cartões orbitando */}
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
            borderRadius: 14, padding: "10px 14px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
            boxShadow: "var(--shadow-sm)", zIndex: 3,
            minWidth: 80, cursor: "default",
            animation: `float${i % 3} ${3 + (i % 2)}s ease-in-out infinite`,
          }}>
            <div style={{ color: "var(--accent)" }}><p.Ico /></div>
            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-2)", whiteSpace: "nowrap" }}>{p.label}</span>
          </div>
        );
      })}

      <style>{`
        @keyframes float0 { 0%,100%{transform:translate(-50%,-50%) translateY(0)} 50%{transform:translate(-50%,-50%) translateY(-5px)} }
        @keyframes float1 { 0%,100%{transform:translate(-50%,-50%) translateY(0)} 50%{transform:translate(-50%,-50%) translateY(-7px)} }
        @keyframes float2 { 0%,100%{transform:translate(-50%,-50%) translateY(0)} 50%{transform:translate(-50%,-50%) translateY(-4px)} }
      `}</style>
    </div>
  );
}

// ─── PROBLEMA ───
function Problema() {
  return (
    <section style={{ background: "var(--surface)", padding: "96px 24px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
        <Reveal>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "#4F8EF7", textTransform: "uppercase" }}>O problema</span>
          <h2 style={{ fontSize: "clamp(28px, 3.5vw, 42px)", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--text)", margin: "12px 0 24px", lineHeight: 1.15 }}>
            Eles já estão pedindo ajuda.<br />Só não estão pedindo para você.
          </h2>
          <p style={{ fontSize: 17, color: "var(--text-2)", lineHeight: 1.75, margin: "0 0 20px" }}>
            Todo dia, adolescentes de 15 a 18 anos abrem o ChatGPT para desabafar sobre a prova que reprovaram, a briga com os pais, a amizade que acabou, o futuro que não faz sentido. Eles fazem isso porque é mais fácil falar com uma tela do que com um adulto, porque não querem preocupar ninguém, porque não sabem exatamente o que estão sentindo.
          </p>
          <p style={{ fontSize: 17, color: "var(--text-2)", lineHeight: 1.75, margin: "0 0 20px" }}>
            O problema não é que eles usam tecnologia para isso. O problema é que a tecnologia que eles usam não foi feita para eles. Não lembra quem eles são. Não percebe quando a situação está ficando séria. Não avisa ninguém quando precisa.
          </p>
          <p style={{ fontSize: 17, fontWeight: 600, color: "var(--text)", lineHeight: 1.75 }}>
            A ARIA foi construída especificamente para esse momento, esse público e essa responsabilidade.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

// ─── COMO FUNCIONA — CÓRTEX ───
function ComoFunciona() {
  const construtos = [
    { letra: "C", nome: "Carga emocional", desc: "Ansiedade, tensão acumulada, sensação de não conseguir dar conta." },
    { letra: "O", nome: "Organização e foco", desc: "Rotina de estudos, procrastinação, demandas acadêmicas que se acumulam." },
    { letra: "R", nome: "Relações", desc: "Família, amizades, namoro, professores e tudo que envolve vínculo." },
    { letra: "T", nome: "Tensão no corpo", desc: "Insônia, agitação, irritabilidade, aquele travar que não tem explicação." },
    { letra: "E", nome: "Energia e sentido", desc: "Motivação, prazer, disposição, vontade de fazer as coisas." },
    { letra: "X", nome: "Xeque existencial", desc: "Identidade, futuro, pertencimento, a pergunta de quem sou e o que quero." },
  ];

  return (
    <section id="como-funciona" style={{ padding: "96px 24px", background: "var(--bg)" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "#4F8EF7", textTransform: "uppercase" }}>Base clínica</span>
            <h2 style={{ fontSize: "clamp(26px, 3vw, 38px)", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--text)", margin: "12px 0 16px", lineHeight: 1.2 }}>
              Uma presença inteligente que pensa como terapeuta<br />e fala como amiga.
            </h2>
            <p style={{ fontSize: 16, color: "var(--text-2)", maxWidth: 600, margin: "0 auto", lineHeight: 1.7 }}>
              Por trás de cada conversa, a ARIA opera sobre o Método CÓRTEX, um framework clínico que identifica silenciosamente qual dimensão da vida do aluno está mais ativada naquele momento. O aluno nunca vê o método. Ele só sente que está sendo compreendido.
            </p>
          </div>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          {construtos.map((c, i) => (
            <Reveal key={c.letra} delay={i * 60}>
              <div style={{
                background: "var(--surface)", border: "1.5px solid var(--border)",
                borderRadius: 16, padding: "24px", display: "flex", gap: 16, alignItems: "flex-start",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(79,142,247,0.35)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  background: "rgba(79,142,247,0.10)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, fontWeight: 800, color: "#4F8EF7", letterSpacing: "-0.02em",
                }}>{c.letra}</div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "0 0 4px" }}>{c.nome}</p>
                  <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0, lineHeight: 1.6 }}>{c.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Cadência clínica */}
        <Reveal delay={200} style={{ marginTop: 56 }}>
          <div style={{
            background: "var(--surface)", border: "1.5px solid var(--border)",
            borderRadius: 20, padding: "36px 40px",
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.07em", color: "#4F8EF7", textTransform: "uppercase", margin: "0 0 20px" }}>Como cada conversa é estruturada</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 0 }}>
              {[
                { n: "01", label: "Conexão", desc: "Abertura contextual com histórico real do aluno" },
                { n: "02", label: "Exploração", desc: "Uma pergunta de cada vez, escuta ativa" },
                { n: "03", label: "Descoberta", desc: "Identifica o que está por baixo do tema" },
                { n: "04", label: "Insight", desc: "Entrega algo que o aluno ainda não viu" },
                { n: "05", label: "Microação", desc: "Algo concreto e pequeno para fazer" },
                { n: "06", label: "Fechamento", desc: "A última fala é sempre da ARIA" },
              ].map((etapa, i, arr) => (
                <div key={etapa.n} style={{
                  padding: "0 20px", borderRight: i < arr.length - 1 ? "1px solid var(--border)" : "none",
                  paddingLeft: i === 0 ? 0 : 20,
                }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", margin: "0 0 4px" }}>{etapa.n}</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: "0 0 4px" }}>{etapa.label}</p>
                  <p style={{ fontSize: 12, color: "var(--text-2)", margin: 0, lineHeight: 1.5 }}>{etapa.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── CIÊNCIA ───
function Ciencia() {
  const dados = [
    {
      fonte: "Lancet Digital Health · JMIR",
      texto: "Intervenções digitais baseadas em TCC produzem redução significativa de sintomas de ansiedade e depressão em adolescentes, com resultados comparáveis a intervenções presenciais de curta duração quando há personalização e engajamento ativo.",
    },
    {
      fonte: "Organização Mundial da Saúde",
      texto: "Mais de 70% dos adolescentes com transtornos mentais não recebem tratamento. As principais barreiras são estigma, custo e falta de profissionais. Soluções digitais reduzem as três ao mesmo tempo.",
    },
    {
      fonte: "American Psychological Association",
      texto: "Adolescentes buscam apoio emocional em plataformas digitais com muito mais frequência do que em contextos presenciais formais, especialmente para relacionamento, identidade e pressão acadêmica.",
    },
    {
      fonte: "British Journal of Educational Psychology",
      texto: "Metanálise demonstra correlação direta entre bem-estar emocional e desempenho acadêmico. Intervenções socioeducativas nas escolas produzem ganhos mensuráveis em notas, frequência e engajamento.",
    },
  ];

  return (
    <section style={{ background: "var(--text)", padding: "96px 24px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "#4F8EF7", textTransform: "uppercase" }}>Embasamento científico</span>
            <h2 style={{ fontSize: "clamp(26px, 3vw, 38px)", fontWeight: 700, letterSpacing: "-0.03em", color: "#F5F4F1", margin: "12px 0 16px", lineHeight: 1.2 }}>
              Tecnologia a serviço<br />do que a ciência já provou.
            </h2>
            <p style={{ fontSize: 16, color: "rgba(245,244,241,0.60)", maxWidth: 540, margin: "0 auto", lineHeight: 1.7 }}>
              A ARIA foi construída sobre um campo de pesquisa sólido que demonstra, com dados, por que intervenções digitais em saúde mental adolescente funcionam e por que a escola é o lugar certo para isso acontecer.
            </p>
          </div>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(460px, 1fr))", gap: 16 }}>
          {dados.map((d, i) => (
            <Reveal key={i} delay={i * 80}>
              <div style={{
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 16, padding: "28px 32px",
              }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#4F8EF7", textTransform: "uppercase", margin: "0 0 12px" }}>{d.fonte}</p>
                <p style={{ fontSize: 15, color: "rgba(245,244,241,0.80)", lineHeight: 1.7, margin: 0 }}>{d.texto}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={300}>
          <div style={{
            marginTop: 32,
            background: "rgba(79,142,247,0.15)", border: "1px solid rgba(79,142,247,0.25)",
            borderRadius: 16, padding: "24px 32px", textAlign: "center",
          }}>
            <p style={{ fontSize: 16, color: "#F5F4F1", lineHeight: 1.7, margin: 0 }}>
              Cada <strong style={{ color: "#4F8EF7" }}>R$1</strong> investido em prevenção de saúde mental na adolescência gera economia de <strong style={{ color: "#4F8EF7" }}>R$4 a R$7</strong> em custos de tratamento na vida adulta.{" "}
              <span style={{ color: "rgba(245,244,241,0.55)", fontSize: 13 }}>NIMH · Lancet Commission on Global Mental Health</span>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── PARA ESCOLA (dois públicos) ───
function ParaEscola() {
  return (
    <section id="para-escola" style={{ padding: "96px 24px", background: "var(--bg)" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "#4F8EF7", textTransform: "uppercase" }}>Para a escola</span>
            <h2 style={{ fontSize: "clamp(26px, 3vw, 38px)", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--text)", margin: "12px 0 16px", lineHeight: 1.2 }}>
              Para a escola que quer fazer mais pelo aluno,<br />com estrutura e segurança para isso.
            </h2>
          </div>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Gestor */}
          <Reveal delay={0}>
            <div style={{
              background: "var(--surface)", border: "1.5px solid var(--border)",
              borderRadius: 20, padding: "36px", height: "100%",
            }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "rgba(79,142,247,0.10)", borderRadius: 9999,
                padding: "5px 14px", marginBottom: 20,
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#4F8EF7" }}>Para o diretor e coordenador pedagógico</span>
              </div>
              <p style={{ fontSize: 16, color: "var(--text-2)", lineHeight: 1.75, margin: "0 0 24px" }}>
                A escola privada brasileira enfrenta uma pressão crescente: pais que cobram desempenho acadêmico, alunos que chegam emocionalmente esgotados, e uma equipe de orientação que não tem como atender 400 alunos individualmente. A ARIA não resolve tudo isso. Mas ela cobre a demanda que nenhuma estrutura escolar consegue cobrir sozinha: o entre-sessões, o fim de semana, as 23h antes de uma prova.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  "Cuidado preventivo funcionando 24 horas",
                  "Dados agregados por turma para decisões pedagógicas",
                  "Protocolo de crise que aciona a equipe automaticamente",
                  "LGPD compliant, dados no Brasil",
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                      background: "rgba(79,142,247,0.12)", color: "#4F8EF7",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}><IcoCheck /></div>
                    <span style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Psicóloga */}
          <Reveal delay={120}>
            <div style={{
              background: "var(--surface)", border: "1.5px solid var(--border)",
              borderRadius: 20, padding: "36px", height: "100%",
            }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "rgba(45,184,125,0.10)", borderRadius: 9999,
                padding: "5px 14px", marginBottom: 20,
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#2DB87D" }}>Para a psicóloga e o orientador educacional</span>
              </div>
              <p style={{ fontSize: 16, color: "var(--text-2)", lineHeight: 1.75, margin: "0 0 24px" }}>
                A ARIA não substitui o seu trabalho. Ela o amplifica. Enquanto você atende casos clínicos e conduz grupos, a ARIA cuida da demanda cotidiana. Quando um aluno chega até você, a ARIA já tem um histórico do que aconteceu, o padrão emocional mais recorrente e os alertas que foram disparados.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  "Histórico longitudinal do aluno disponível",
                  "Alertas em tempo real para o orientador",
                  "Dashboard com padrões por turma e período",
                  "Você controla o que vê e quando intervém",
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                      background: "rgba(45,184,125,0.12)", color: "#2DB87D",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}><IcoCheck /></div>
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

// ─── SEGURANÇA ───
function Seguranca() {
  const niveis = [
    { n: 0, label: "Sofrimento cotidiano", cor: "#2DB87D", bgCor: "rgba(45,184,125,0.10)", desc: "Ansiedade de prova, briga com amigo, estresse de fim de bimestre. A ARIA acolhe, explora e oferece perspectiva. Nenhuma ação externa." },
    { n: 1, label: "Sofrimento elevado", cor: "#F0A030", bgCor: "rgba(240,160,48,0.10)", desc: "Sinais de isolamento, desesperança ou esgotamento prolongado. A ARIA aprofunda a escuta e sugere que o aluno converse com um adulto de confiança." },
    { n: 2, label: "Risco moderado", cor: "#E05252", bgCor: "rgba(224,82,82,0.10)", desc: "Sinais de automutilação sem risco imediato. A ARIA acolhe, informa o orientador via dashboard e oferece o CVV (188)." },
    { n: 3, label: "Risco imediato", cor: "#C0392B", bgCor: "rgba(192,57,43,0.12)", desc: "Ideação suicida ativa. A ARIA para tudo, orienta ligar para o CVV imediatamente e aciona alerta automático para o orientador escolar." },
  ];

  return (
    <section id="seguranca" style={{ padding: "96px 24px", background: "var(--surface)" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "start" }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "#4F8EF7", textTransform: "uppercase" }}>Protocolo de segurança</span>
              <h2 style={{ fontSize: "clamp(26px, 3vw, 38px)", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--text)", margin: "12px 0 20px", lineHeight: 1.2 }}>
                Quando as coisas ficam sérias, a ARIA sabe o que fazer.
              </h2>
              <p style={{ fontSize: 16, color: "var(--text-2)", lineHeight: 1.75, margin: "0 0 20px" }}>
                O protocolo de crise foi desenvolvido com rigor clínico por psicólogo com CRP ativo, especialista em TCC e Terapia do Esquema. A plataforma monitora continuamente o nível de sofrimento em cada conversa e age de forma diferenciada em cada situação.
              </p>
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                background: "rgba(79,142,247,0.08)", border: "1px solid rgba(79,142,247,0.15)",
                borderRadius: 12, padding: "14px 18px", marginTop: 8,
              }}>
                <IcoShield style={{ color: "#4F8EF7", flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0, lineHeight: 1.5 }}>
                  Danilo Camuri Teixeira Lopes, Mestre em Psicologia, especialista em TCC e Terapia do Esquema. CRP 21/02554.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {niveis.map((n, i) => (
                <Reveal key={n.n} delay={i * 80}>
                  <div style={{
                    background: n.bgCor, border: `1.5px solid ${n.cor}30`,
                    borderRadius: 14, padding: "18px 20px", display: "flex", gap: 16, alignItems: "flex-start",
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 9999, flexShrink: 0,
                      background: n.cor, color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 800,
                    }}>{n.n}</div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: "0 0 4px" }}>{n.label}</p>
                      <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0, lineHeight: 1.55 }}>{n.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── CTA FINAL ───
function CTAFinal() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);

  return (
    <section id="contato" style={{ padding: "96px 24px", background: "var(--bg)" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
        <Reveal>
          <ARIAOrb size={64} style={{ margin: "0 auto 28px" }} />
          <h2 style={{ fontSize: "clamp(28px, 3.5vw, 44px)", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--text)", margin: "0 0 16px", lineHeight: 1.15 }}>
            Sua escola pode ser a primeira<br />a oferecer isso aos alunos.
          </h2>
          <p style={{ fontSize: 17, color: "var(--text-2)", lineHeight: 1.7, margin: "0 0 40px" }}>
            A ARIA está disponível para escolas privadas brasileiras. Agende uma demonstração e veja o produto funcionando em 30 minutos.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 40 }}>
            <a href="mailto:contato@aria.school" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#4F8EF7", color: "#fff", textDecoration: "none",
              padding: "15px 32px", borderRadius: 9999, fontWeight: 600, fontSize: 16,
              boxShadow: "0 4px 20px rgba(79,142,247,0.30)",
            }}>
              Agendar demonstração <IcoArrow />
            </a>
            <a href="https://wa.me/5585999999999" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "transparent", color: "var(--text-2)", textDecoration: "none",
              padding: "15px 28px", borderRadius: 9999, fontWeight: 500, fontSize: 15,
              border: "1.5px solid var(--border)",
            }}>
              Falar pelo WhatsApp
            </a>
          </div>

          {/* Email opt-in */}
          {!enviado ? (
            <div>
              <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 12 }}>Prefere receber mais informações primeiro?</p>
              <div style={{ display: "flex", gap: 8, maxWidth: 420, margin: "0 auto" }}>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  style={{
                    flex: 1, padding: "12px 16px", borderRadius: 9999, fontSize: 14,
                    border: "1.5px solid var(--border)", background: "var(--surface)",
                    color: "var(--text)", outline: "none",
                  }}
                />
                <button
                  onClick={() => { if (email) setEnviado(true); }}
                  style={{
                    background: "var(--text)", color: "var(--bg)",
                    padding: "12px 20px", borderRadius: 9999, fontWeight: 600, fontSize: 14,
                    border: "none", cursor: "pointer",
                  }}
                >Enviar</button>
              </div>
            </div>
          ) : (
            <div style={{
              background: "rgba(45,184,125,0.10)", border: "1px solid rgba(45,184,125,0.25)",
              borderRadius: 12, padding: "14px 20px",
            }}>
              <p style={{ color: "#2DB87D", fontWeight: 600, margin: 0 }}>Recebemos seu contato. Em breve a gente chega.</p>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}

// ─── RODAPÉ ───
function Footer() {
  return (
    <footer style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", padding: "40px 24px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 32 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <ARIAOrb size={28} />
              <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>ARIA</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: 0, maxWidth: 260, lineHeight: 1.6 }}>
              Apoio psicoemocional para o Ensino Médio.
            </p>
          </div>
          <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "var(--muted)", textTransform: "uppercase", margin: "0 0 12px" }}>Produto</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {["Como funciona", "Base clínica", "Para a escola", "Segurança"].map(l => (
                  <a key={l} href={`#${l.toLowerCase().replace(" ", "-")}`} style={{ fontSize: 13, color: "var(--text-2)", textDecoration: "none" }}>{l}</a>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "var(--muted)", textTransform: "uppercase", margin: "0 0 12px" }}>Legal</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <a href="/privacidade" style={{ fontSize: 13, color: "var(--text-2)", textDecoration: "none" }}>Política de privacidade</a>
                <a href="/termos" style={{ fontSize: 13, color: "var(--text-2)", textDecoration: "none" }}>Termos de uso</a>
                <span style={{ fontSize: 13, color: "var(--muted)" }}>LGPD</span>
              </div>
            </div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid var(--border)", marginTop: 32, paddingTop: 24 }}>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>
            Desenvolvido com fundamentação clínica por Danilo Camuri Teixeira Lopes, Mestre em Psicologia, CRP 21/02554.
            Dados armazenados em servidores no Brasil. Todos os direitos reservados. ARIA, 2026.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── PÁGINA PRINCIPAL ───
export default function LandingPage() {
  useForceLightTheme();
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
