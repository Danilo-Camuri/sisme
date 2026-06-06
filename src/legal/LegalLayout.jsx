// LegalLayout.jsx — Layout compartilhado para todas as páginas legais da ARIA
// Usa os mesmos tokens do aria-tokens.css

import { useEffect } from "react";

// ─── Orb ───
function ARIAOrb({ size = 32 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "linear-gradient(135deg, #4F8EF7, #2DB87D)",
      boxShadow: "0 0 24px rgba(79,142,247,0.30)",
    }} />
  );
}

// ─── Caixa de destaque azul (intro) ───
export function BoxDestaque({ children }) {
  return (
    <div style={{
      background: "rgba(79,142,247,0.08)",
      border: "1.5px solid rgba(79,142,247,0.20)",
      borderRadius: 14, padding: "20px 24px",
      marginBottom: 36, fontSize: 15, lineHeight: 1.7,
      color: "var(--text)",
    }}>
      {children}
    </div>
  );
}

// ─── Caixa de atenção laranja/vermelha ───
export function BoxAtencao({ children }) {
  return (
    <div style={{
      background: "rgba(224,82,82,0.07)",
      border: "1.5px solid rgba(224,82,82,0.22)",
      borderRadius: 14, padding: "20px 24px",
      marginBottom: 24, fontSize: 14, lineHeight: 1.7,
      color: "var(--text)",
    }}>
      {children}
    </div>
  );
}

// ─── Caixa de aviso amarela ───
export function BoxAviso({ children }) {
  return (
    <div style={{
      background: "rgba(240,160,48,0.08)",
      border: "1.5px solid rgba(240,160,48,0.25)",
      borderRadius: 14, padding: "20px 24px",
      marginBottom: 24, fontSize: 14, lineHeight: 1.7,
      color: "var(--text)",
    }}>
      {children}
    </div>
  );
}

// ─── Caixa pré-requisitos verde ───
export function BoxVerde({ children }) {
  return (
    <div style={{
      background: "rgba(45,184,125,0.07)",
      border: "1.5px solid rgba(45,184,125,0.22)",
      borderRadius: 14, padding: "20px 24px",
      marginBottom: 24, fontSize: 14, lineHeight: 1.7,
      color: "var(--text)",
    }}>
      {children}
    </div>
  );
}

// ─── Tabela responsiva ───
export function Tabela({ headers, rows }) {
  return (
    <div style={{ overflowX: "auto", marginBottom: 24, borderRadius: 12, border: "1.5px solid var(--border)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 500 }}>
        <thead>
          <tr style={{ background: "rgba(79,142,247,0.07)" }}>
            {headers.map((h, i) => (
              <th key={i} style={{
                padding: "12px 16px", textAlign: "left",
                fontWeight: 700, color: "var(--text)",
                fontSize: 12, letterSpacing: "0.03em",
                borderBottom: "1.5px solid var(--border)",
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: ri < rows.length - 1 ? "1px solid var(--border)" : "none" }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{
                  padding: "12px 16px", color: "var(--text-2)",
                  lineHeight: 1.55, verticalAlign: "top",
                }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Nível de risco (para a política de crises) ───
export function NivelRisco({ nivel, label, cor, bgCor, sinais, acoes, extra }) {
  return (
    <div style={{
      border: `1.5px solid ${cor}30`,
      background: bgCor,
      borderRadius: 16, padding: "24px", marginBottom: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9999,
          background: cor, color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: 16, flexShrink: 0,
        }}>{nivel}</div>
        <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: 0 }}>{label}</p>
      </div>
      {sinais && (
        <>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: cor, textTransform: "uppercase", margin: "0 0 8px" }}>Sinais típicos</p>
          <ul style={{ margin: "0 0 14px", paddingLeft: 18 }}>
            {sinais.map((s, i) => <li key={i} style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 3 }}>{s}</li>)}
          </ul>
        </>
      )}
      {acoes && (
        <>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: cor, textTransform: "uppercase", margin: "0 0 8px" }}>O que a plataforma faz</p>
          <ul style={{ margin: "0 0 8px", paddingLeft: 18 }}>
            {acoes.map((a, i) => <li key={i} style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 3 }}>{a}</li>)}
          </ul>
        </>
      )}
      {extra && <p style={{ fontSize: 13, fontWeight: 600, color: cor, margin: 0, marginTop: 8 }}>{extra}</p>}
    </div>
  );
}

// ─── Layout principal ───
export default function LegalLayout({ titulo, versao, children }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", background: "var(--bg)", minHeight: "100vh" }}>
      {/* Nav mínima */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(245,244,241,0.93)", backdropFilter: "blur(14px)",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 20px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
            <ARIAOrb size={28} />
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text)" }}>ARIA</span>
          </a>
          <a href="/" style={{ fontSize: 13, color: "var(--text-2)", textDecoration: "none", fontWeight: 500 }}>
            ← Voltar ao início
          </a>
        </div>
      </nav>

      {/* Cabeçalho do documento */}
      <div style={{ background: "var(--text)", padding: "56px 24px 48px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <ARIAOrb size={40} />
            <div>
              <p style={{ fontSize: 12, color: "rgba(245,244,241,0.50)", margin: "0 0 2px", letterSpacing: "0.06em", textTransform: "uppercase" }}>ARIA — Plataforma de Apoio Psicoemocional</p>
              <p style={{ fontSize: 12, color: "rgba(245,244,241,0.40)", margin: 0 }}>INSTITUTO CORTEX DE PSICOLOGIA LTDA · CNPJ 59.217.063/0001-47</p>
            </div>
          </div>
          <h1 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 700, letterSpacing: "-0.025em", color: "#F5F4F1", margin: "0 0 12px", lineHeight: 1.15 }}>
            {titulo}
          </h1>
          <p style={{ fontSize: 13, color: "rgba(245,244,241,0.45)", margin: 0 }}>{versao} · Junho de 2026</p>
        </div>
      </div>

      {/* Conteúdo */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 80px" }}>
        {children}
      </div>

      {/* Rodapé do documento */}
      <div style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", padding: "28px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, lineHeight: 1.7 }}>
          INSTITUTO CORTEX DE PSICOLOGIA LTDA · CNPJ 59.217.063/0001-47 · Teresina/PI<br />
          DPO: Danilo Camuri Teixeira Lopes · CRP 21/02554 · <a href="mailto:danilocamurilopes@gmail.com" style={{ color: "#4F8EF7" }}>danilocamurilopes@gmail.com</a>
        </p>
      </div>
    </div>
  );
}
