import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import {
  detectCrisisLevel,
  getAberturaARIA,
  getARIASystemPrompt,
  getSummaryPrompt,
} from "./systemPrompts";

// ─── Constantes ───────────────────────────────────────────────────────────────
const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 600;
const MAX_TROCAS = 30;
const MAX_HISTORICO = 3;

// ─── Tema por horário ─────────────────────────────────────────────────────────
function getTheme(hora) {
  const noite = hora >= 20 || hora < 6;
  return {
    noite,
    bg: noite ? "#0E0D14" : "#F4F2FF",
    bgCard: noite ? "#16141F" : "#FFFFFF",
    bgSidebar: noite ? "#13111C" : "#EDE9FF",
    bgInput: noite ? "#1E1B2E" : "#FFFFFF",
    bgUserBubble: noite ? "rgba(200,166,255,0.15)" : "rgba(200,166,255,0.25)",
    bgAriaBubble: noite ? "#1E1B2E" : "#F0ECFF",
    textPrimary: noite ? "#F0EEFF" : "#1A1530",
    textSecondary: noite ? "#8B7FB8" : "#6B5FA8",
    textMuted: noite ? "#4A4268" : "#9B8FCC",
    border: noite ? "rgba(200,166,255,0.08)" : "rgba(200,166,255,0.2)",
    borderInput: noite ? "rgba(200,166,255,0.15)" : "rgba(200,166,255,0.35)",
    purple: "#C8A6FF",
    pink: "#FF9FCB",
    accent: noite ? "#C8A6FF" : "#9B6FF0",
  };
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function AriaChat() {
  const { aluno, logout } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [trocas, setTrocas] = useState(0);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [crisisLevel, setCrisisLevel] = useState(0);
  const [savingSession, setSavingSession] = useState(false);
  const [historico, setHistorico] = useState([]);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState(null);

  const hora = new Date().getHours();
  const theme = getTheme(hora);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const currentCrisisRef = useRef(0);

  const apelido = aluno?.apelido || aluno?.nome?.split(" ")[0] || "você";

  // Scroll automático
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  // Inicializar sessão
  useEffect(() => {
    if (!aluno) return;
    async function init() {
      try {
        const { data: hist } = await supabase
          .from("conversas")
          .select("resumo_sessao, ponto_retomada, construto_cortex, criado_em")
          .eq("aluno_id", aluno.id)
          .not("resumo_sessao", "is", null)
          .order("criado_em", { ascending: false })
          .limit(MAX_HISTORICO);

        const historicoFiltrado = hist || [];
        setHistorico(historicoFiltrado);

        const sp = getARIASystemPrompt(apelido, historicoFiltrado);
        setSystemPrompt(sp);

        const abertura = getAberturaARIA(apelido, hora, historicoFiltrado);
        setMessages([{ role: "assistant", content: abertura }]);
      } catch (e) {
        setError("Erro ao iniciar. Tente recarregar a página.");
      } finally {
        setInitializing(false);
      }
    }
    init();
  }, [aluno]);

  // Salvar resumo da sessão
  const saveSession = useCallback(
    async (finalMessages, nivelFinal) => {
      if (!aluno || finalMessages.length < 2) return;
      setSavingSession(true);
      try {
        const apiMessages = finalMessages
          .filter((m) => m.role !== "system")
          .map((m) => ({ role: m.role, content: m.content }));

        const res = await fetch("/.netlify/functions/anthropic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: MODEL,
            max_tokens: 400,
            system: getSummaryPrompt(),
            messages: apiMessages,
          }),
        });

        const data = await res.json();
        const rawText =
          data.content?.map((b) => b.text || "").join("") || "";

        let resumo = null;
        try {
          const clean = rawText.replace(/```json|```/g, "").trim();
          resumo = JSON.parse(clean);
        } catch {
          resumo = {
            resumo_sessao: rawText.slice(0, 600) || "Sessão encerrada.",
            construto_cortex: "C",
            ponto_retomada: null,
            nivel_crise: nivelFinal,
          };
        }

        if (!resumo.resumo_sessao) {
          resumo.resumo_sessao =
            finalMessages.length <= 3
              ? "Sessão muito curta."
              : "Sessão encerrada sem resumo gerado.";
        }

        const { data: { user } } = await supabase.auth.getUser();

        await supabase.from("conversas").insert({
          aluno_id: aluno.id,
          escola_id: aluno.escola_id,
          usuario_id: user.id,
          personagem: "aria",
          resumo_temas: resumo.resumo_sessao,
          resumo_sessao: resumo.resumo_sessao,
          construto_cortex: resumo.construto_cortex || null,
          ponto_retomada: resumo.ponto_retomada || null,
          nivel_crise_maximo: nivelFinal,
          nivel_alerta: nivelFinal,
          trocas_realizadas: trocas,
          criado_em: new Date().toISOString(),
        });

        if (nivelFinal >= 2) {
          await supabase.from("alertas").insert({
            aluno_id: aluno.id,
            escola_id: aluno.escola_id,
            nivel_alerta: nivelFinal,
            criado_em: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.error("[ARIA] Erro ao salvar sessão:", e);
      } finally {
        setSavingSession(false);
      }
    },
    [aluno, trocas]
  );

  // Enviar mensagem
  async function sendMessage() {
    if (!input.trim() || loading || sessionEnded) return;

    const userText = input.trim();
    setInput("");

    const msgCrisis = detectCrisisLevel(userText);
    const newCrisis = Math.max(currentCrisisRef.current, msgCrisis);
    currentCrisisRef.current = newCrisis;
    setCrisisLevel(newCrisis);

    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);
    const newTrocas = trocas + 1;
    setTrocas(newTrocas);

    try {
      const apiMessages = newMessages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role, content: m.content }));

      let sp = systemPrompt;
      if (newCrisis === 3) sp += "\n\nATENÇÃO NÍVEL 3: use a fala exata do protocolo de crise Nível 3. Após isso, encerre com cuidado.";
      else if (newCrisis === 2) sp += "\n\nATENÇÃO NÍVEL 2: valide intensamente e ofereça CVV 188 e orientador escolar.";
      else if (newCrisis === 1) sp += "\n\nATENÇÃO NÍVEL 1: desacelere, aprofunde escuta, fique mais tempo no acolhimento.";
      if (newTrocas >= MAX_TROCAS) sp += "\n\nENCERRAMENTO: esta é a última mensagem da sessão. Encerre de forma natural e acolhedora.";

      const res = await fetch("/.netlify/functions/anthropic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: sp,
          messages: apiMessages,
        }),
      });

      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      const text = data.content?.map((b) => b.text || "").join("") || "";

      const resCrisis = detectCrisisLevel(text);
      const finalCrisis = Math.max(newCrisis, resCrisis);
      if (finalCrisis > newCrisis) {
        currentCrisisRef.current = finalCrisis;
        setCrisisLevel(finalCrisis);
      }

      const updated = [...newMessages, { role: "assistant", content: text }];
      setMessages(updated);

      if (newTrocas >= MAX_TROCAS || finalCrisis === 3) {
        setSessionEnded(true);
        await saveSession(updated, finalCrisis);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "deu um problema técnico aqui. pode repetir?" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  async function encerrarSessao() {
    if (messages.length < 2 || savingSession) return;
    setSessionEnded(true);
    await saveSession(messages, currentCrisisRef.current);
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  if (initializing) {
    return (
      <div style={{ ...styles.fullScreen, background: theme.bg }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <ARIALogo color={theme.purple} size={48} />
          <p style={{ color: theme.textMuted, fontSize: 14, fontFamily: "DM Sans, sans-serif" }}>
            carregando...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...styles.fullScreen, background: theme.bg }}>
        <p style={{ color: "#FF9FCB", fontSize: 14 }}>{error}</p>
        <button onClick={() => window.location.reload()} style={{ ...styles.btn, background: theme.purple, color: "#0E0D14", marginTop: 16 }}>
          Recarregar
        </button>
      </div>
    );
  }

  return (
    <div style={{ ...styles.appShell, background: theme.bg, color: theme.textPrimary }}>

      {/* ── Sidebar esquerda ── */}
      <div style={{
        ...styles.sidebar,
        background: theme.bgSidebar,
        borderRight: `1px solid ${theme.border}`,
        transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.3s ease",
      }}>
        <div style={styles.sidebarHeader}>
          <ARIALogo color={theme.purple} size={28} />
          <span style={{ fontFamily: "DM Sans, sans-serif", fontWeight: 600, fontSize: 16, color: theme.purple }}>ARIA</span>
          <button onClick={() => setSidebarOpen(false)} style={{ marginLeft: "auto", background: "none", border: "none", color: theme.textMuted, cursor: "pointer", fontSize: 20 }}>×</button>
        </div>

        <p style={{ fontSize: 11, color: theme.textMuted, padding: "0 16px 8px", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "DM Sans, sans-serif" }}>
          sessões anteriores
        </p>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
          {historico.length === 0 ? (
            <p style={{ color: theme.textMuted, fontSize: 13, padding: "8px 8px", fontFamily: "DM Sans, sans-serif" }}>
              primeira sessão
            </p>
          ) : (
            historico.map((h, i) => (
              <div key={i} style={{
                padding: "10px 12px",
                borderRadius: 10,
                marginBottom: 6,
                background: theme.bgCard,
                border: `1px solid ${theme.border}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: theme.purple,
                    background: `${theme.purple}18`,
                    borderRadius: 4,
                    padding: "1px 6px",
                    fontFamily: "DM Sans, sans-serif",
                    letterSpacing: "0.04em",
                  }}>
                    {h.construto_cortex || "—"}
                  </span>
                  <span style={{ fontSize: 11, color: theme.textMuted, fontFamily: "DM Sans, sans-serif" }}>
                    {h.criado_em ? new Date(h.criado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : ""}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: theme.textSecondary, margin: 0, lineHeight: 1.5, fontFamily: "DM Sans, sans-serif" }}>
                  {h.resumo_sessao?.slice(0, 100)}{h.resumo_sessao?.length > 100 ? "..." : ""}
                </p>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: 16, borderTop: `1px solid ${theme.border}` }}>
          <button onClick={logout} style={{ ...styles.btn, background: "none", border: `1px solid ${theme.border}`, color: theme.textMuted, width: "100%", fontSize: 13 }}>
            sair
          </button>
        </div>
      </div>

      {/* Overlay sidebar mobile */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9 }} />
      )}

      {/* ── Área principal ── */}
      <div style={styles.mainArea}>

        {/* Header */}
        <div style={{ ...styles.header, background: theme.bgCard, borderBottom: `1px solid ${theme.border}` }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: theme.textMuted, display: "flex", alignItems: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg, ${theme.purple}, ${theme.pink})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ARIALogo color="#fff" size={18} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: theme.purple, fontFamily: "DM Sans, sans-serif" }}>ARIA</p>
              <p style={{ margin: 0, fontSize: 11, color: theme.textMuted, fontFamily: "DM Sans, sans-serif" }}>
                {sessionEnded ? "sessão encerrada" : loading ? "digitando..." : `${MAX_TROCAS - trocas} mensagens restantes`}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {crisisLevel >= 2 && <span title={`Nível ${crisisLevel}`} style={{ fontSize: 18 }}>⚠️</span>}
            {!sessionEnded && messages.length > 2 && (
              <button
                onClick={encerrarSessao}
                style={{ background: "none", border: `1px solid ${theme.border}`, borderRadius: 20, padding: "4px 12px", fontSize: 12, color: theme.textMuted, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}
              >
                encerrar
              </button>
            )}
          </div>
        </div>

        {/* Barra de progresso */}
        <div style={{ height: 2, background: theme.border }}>
          <div style={{
            height: "100%",
            width: `${(trocas / MAX_TROCAS) * 100}%`,
            background: trocas >= MAX_TROCAS - 5 ? theme.pink : `linear-gradient(90deg, ${theme.purple}, ${theme.pink})`,
            transition: "width 0.5s ease",
          }} />
        </div>

        {/* Mensagens */}
        <div style={{ ...styles.messagesArea }}>
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} isUser={msg.role === "user"} theme={theme} />
          ))}

          {loading && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, animation: "fadeUp 0.2s ease" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${theme.purple}, ${theme.pink})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ARIALogo color="#fff" size={14} />
              </div>
              <div style={{ ...styles.ariaBubble(theme), display: "flex", gap: 5, padding: "14px 16px", alignItems: "center" }}>
                {[0, 200, 400].map((delay) => (
                  <span key={delay} style={{ width: 7, height: 7, borderRadius: "50%", background: theme.purple, display: "inline-block", animation: `blink 1.2s ${delay}ms infinite` }} />
                ))}
              </div>
            </div>
          )}

          {sessionEnded && !savingSession && (
            <div style={{ ...styles.endCard(theme), margin: "16px 0" }}>
              <span style={{ fontSize: 28 }}>💜</span>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: theme.textPrimary, fontFamily: "DM Sans, sans-serif" }}>
                sessão encerrada
              </p>
              <p style={{ margin: 0, fontSize: 13, color: theme.textMuted, fontFamily: "DM Sans, sans-serif", lineHeight: 1.5 }}>
                vou guardar tudo isso aqui. quando você voltar, começo de onde a gente parou.
              </p>
              <button
                onClick={() => window.location.reload()}
                style={{ ...styles.btn, background: `linear-gradient(135deg, ${theme.purple}, ${theme.pink})`, color: "#0E0D14", fontWeight: 700, marginTop: 4 }}
              >
                nova sessão
              </button>
            </div>
          )}

          {savingSession && (
            <p style={{ textAlign: "center", fontSize: 12, color: theme.textMuted, fontFamily: "DM Sans, sans-serif" }}>
              guardando sessão...
            </p>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {!sessionEnded && (
          <div style={{ ...styles.inputArea, background: theme.bgCard, borderTop: `1px solid ${theme.border}` }}>
            <div style={{ ...styles.inputWrapper, background: theme.bgInput, border: `1.5px solid ${input.trim() ? theme.purple : theme.borderInput}`, transition: "border-color 0.2s" }}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="escreve aqui..."
                rows={1}
                disabled={loading || sessionEnded}
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  outline: "none",
                  resize: "none",
                  fontSize: 15,
                  lineHeight: 1.5,
                  color: theme.textPrimary,
                  fontFamily: "DM Sans, sans-serif",
                  padding: 0,
                  minHeight: 24,
                  maxHeight: 120,
                  overflowY: "auto",
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: "none",
                  background: input.trim() && !loading ? `linear-gradient(135deg, ${theme.purple}, ${theme.pink})` : theme.border,
                  cursor: input.trim() && !loading ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "background 0.2s",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={input.trim() && !loading ? "#0E0D14" : theme.textMuted} strokeWidth="2.5">
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
            <p style={{ margin: "6px 0 0", fontSize: 10, color: theme.textMuted, textAlign: "center", fontFamily: "DM Sans, sans-serif", letterSpacing: "0.04em" }}>
              Enter para enviar · Shift+Enter para nova linha
            </p>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes blink { 0%,80%,100%{opacity:0.2;transform:scale(0.8)} 40%{opacity:1;transform:scale(1)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; }
        textarea::placeholder { color: ${theme.textMuted}; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: ${theme.border}; border-radius: 2px; }
      `}</style>
    </div>
  );
}

// ─── Bubble de mensagem ───────────────────────────────────────────────────────
function MessageBubble({ msg, isUser, theme }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      alignItems: "flex-end",
      gap: 8,
      animation: "fadeUp 0.25s ease",
    }}>
      {!isUser && (
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${theme.purple}, ${theme.pink})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <ARIALogo color="#fff" size={14} />
        </div>
      )}
      <div style={isUser ? styles.userBubble(theme) : styles.ariaBubble(theme)}>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "DM Sans, sans-serif" }}>
          {msg.content}
        </p>
      </div>
    </div>
  );
}

// ─── Logo ARIA ────────────────────────────────────────────────────────────────
function ARIALogo({ color = "#C8A6FF", size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" />
      <path d="M8 14s1-2 4-2 4 2 4 2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="9" cy="10" r="1.2" fill={color} />
      <circle cx="15" cy="10" r="1.2" fill={color} />
    </svg>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = {
  fullScreen: {
    minHeight: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
  },
  appShell: {
    display: "flex",
    height: "100dvh",
    overflow: "hidden",
    position: "relative",
  },
  sidebar: {
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    zIndex: 10,
    display: "flex",
    flexDirection: "column",
  },
  sidebarHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "20px 16px 16px",
    paddingTop: "calc(20px + env(safe-area-inset-top))",
  },
  mainArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    height: "100dvh",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    paddingTop: "calc(12px + env(safe-area-inset-top))",
    flexShrink: 0,
    zIndex: 5,
  },
  messagesArea: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 16px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  userBubble: (t) => ({
    background: t.bgUserBubble,
    borderRadius: "18px 18px 4px 18px",
    padding: "11px 15px",
    maxWidth: "78%",
    border: `1px solid rgba(200,166,255,0.2)`,
  }),
  ariaBubble: (t) => ({
    background: t.bgAriaBubble,
    borderRadius: "18px 18px 18px 4px",
    padding: "11px 15px",
    maxWidth: "84%",
    border: `1px solid ${t.border}`,
  }),
  endCard: (t) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    padding: "28px 24px",
    background: t.bgCard,
    borderRadius: 16,
    border: `1px solid ${t.border}`,
    textAlign: "center",
    animation: "fadeUp 0.4s ease",
  }),
  inputArea: {
    padding: "12px 16px",
    paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
    flexShrink: 0,
  },
  inputWrapper: {
    display: "flex",
    alignItems: "flex-end",
    gap: 10,
    borderRadius: 20,
    padding: "10px 10px 10px 16px",
  },
  btn: {
    padding: "10px 24px",
    borderRadius: 50,
    border: "none",
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "DM Sans, sans-serif",
    fontWeight: 500,
  },
};
