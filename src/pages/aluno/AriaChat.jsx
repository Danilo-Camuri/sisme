import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import {
  detectCrisisLevel,
  getAberturaARIA,
  getARIASystemPrompt,
  getSummaryPrompt,
} from "./systemPrompts";

// ─── Constantes ───────────────────────────────────────────────
const MODEL     = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 600;
const MAX_TROCAS = 30;
const MAX_HIST   = 3;

// ─── Helpers ──────────────────────────────────────────────────
function fmtData(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const hoje = new Date();
  const diff = Math.floor((hoje - d) / 86400000);
  if (diff === 0) return "hoje";
  if (diff === 1) return "ontem";
  if (diff < 7)  return `${diff} dias atrás`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function tituloSessao(resumo) {
  if (!resumo) return "sessão sem título";
  const s = typeof resumo === "string" ? resumo : resumo.resumo_narrativo || "";
  const words = s.trim().split(/\s+/).slice(0, 5).join(" ");
  return words.length > 0 ? words.toLowerCase() : "sessão";
}

// ─── Componente ───────────────────────────────────────────────
export default function AriaChat() {
  const { aluno, logout } = useAuth();

  // estado da conversa
  const [messages,      setMessages]      = useState([]);
  const [input,         setInput]         = useState("");
  const [loading,       setLoading]       = useState(false);
  const [initializing,  setInitializing]  = useState(true);
  const [trocas,        setTrocas]        = useState(0);
  const [sessionEnded,  setSessionEnded]  = useState(false);
  const [crisisLevel,   setCrisisLevel]   = useState(0);
  const [savingSession, setSavingSession] = useState(false);
  const [error,         setError]         = useState(null);

  // histórico e prompt
  const [historico,    setHistorico]    = useState([]);
  const [systemPrompt, setSystemPrompt] = useState("");

  // sidebar
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [allSessions, setAllSessions]   = useState([]);

  // card de humor
  const [humorOpen,    setHumorOpen]    = useState(false);
  const [humorValor,   setHumorValue]   = useState(null);
  const [energiaValor, setEnergiaValue] = useState(null);
  const [humorSalvo,   setHumorSalvo]   = useState(false);

  // refs
  const bottomRef      = useRef(null);
  const textareaRef    = useRef(null);
  const crisisRef      = useRef(0);
  const sidebarRef     = useRef(null);
  const touchStartX    = useRef(null);

  const hora    = new Date().getHours();
  const apelido = aluno?.apelido || aluno?.nome?.split(" ")[0] || "você";

  // ── Scroll automático ──────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Auto-resize textarea ───────────────────────────────────
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height =
      Math.min(textareaRef.current.scrollHeight, 120) + "px";
  }, [input]);

  // ── Swipe para fechar sidebar (mobile) ─────────────────────
  useEffect(() => {
    function onTouchStart(e) { touchStartX.current = e.touches[0].clientX; }
    function onTouchEnd(e) {
      if (touchStartX.current === null) return;
      const dx = touchStartX.current - e.changedTouches[0].clientX;
      if (dx > 60) setSidebarOpen(false);   // swipe left = fecha
      if (dx < -60) setSidebarOpen(true);   // swipe right = abre
      touchStartX.current = null;
    }
    document.addEventListener("touchstart", onTouchStart);
    document.addEventListener("touchend",   onTouchEnd);
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend",   onTouchEnd);
    };
  }, []);

  // ── Inicializar ────────────────────────────────────────────
  useEffect(() => {
    if (!aluno) return;
    async function init() {
      try {
        // buscar todas as sessões para a sidebar
        const { data: todas } = await supabase
          .from("conversas")
          .select("id, resumo_temas, resumo_sessao, construto_cortex, ponto_retomada, criado_em")
          .eq("aluno_id", aluno.id)
          .order("criado_em", { ascending: false })
          .limit(30);

        setAllSessions(todas || []);

        // últimas 3 com resumo para contexto
        const comResumo = (todas || [])
          .filter(c => c.resumo_sessao)
          .slice(0, MAX_HIST);
        setHistorico(comResumo);

        const sp = getARIASystemPrompt(apelido, comResumo);
        setSystemPrompt(sp);

        // verificar check-in de hoje
        const hoje = new Date(); hoje.setHours(0,0,0,0);
        const { data: ci } = await supabase
          .from("checkins")
          .select("humor, energia")
          .eq("aluno_id", aluno.id)
          .gte("criado_em", hoje.toISOString())
          .maybeSingle();
        if (ci) { setHumorValue(ci.humor); setEnergiaValue(ci.energia); setHumorSalvo(true); }

        // mensagem de abertura da ARIA
        const abertura = getAberturaARIA(apelido, hora, comResumo);
        setMessages([{ role: "assistant", content: abertura }]);
      } catch (e) {
        setError("Erro ao iniciar. Recarregue a página.");
      } finally {
        setInitializing(false);
      }
    }
    init();
  }, [aluno]);

  // ── Salvar humor no Supabase ───────────────────────────────
  async function salvarHumor() {
    if (!humorValor || !energiaValor || humorSalvo) return;
    try {
      await supabase.from("checkins").insert({
        aluno_id:  aluno.id,
        escola_id: aluno.escola_id,
        humor:     humorValor,
        energia:   energiaValor,
      });
      setHumorSalvo(true);
      setHumorOpen(false);
    } catch (e) { console.error("checkin:", e); }
  }

  // ── Salvar resumo da sessão ────────────────────────────────
  const saveSession = useCallback(async (finalMessages, nivelFinal) => {
    if (!aluno || finalMessages.length < 2) return;
    setSavingSession(true);
    try {
      const apiMessages = finalMessages
        .filter(m => m.role !== "system")
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch("/.netlify/functions/anthropic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL, max_tokens: 400,
          system: getSummaryPrompt(),
          messages: apiMessages,
        }),
      });
      const data   = await res.json();
      const rawText = data.content?.map(b => b.text || "").join("") || "";

      let resumo = null;
      try   { resumo = JSON.parse(rawText.replace(/```json|```/g, "").trim()); }
      catch { resumo = { resumo_sessao: rawText.slice(0, 600) || "Sessão encerrada.", nivel_crise: nivelFinal }; }
      if (!resumo?.resumo_sessao) resumo = { ...resumo, resumo_sessao: "Sessão muito curta.", nivel_crise: nivelFinal };

      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("conversas").insert({
        aluno_id:          aluno.id,
        escola_id:         aluno.escola_id,
        usuario_id:        user.id,
        assistente:        "aria",
        resumo_temas:      resumo.resumo_sessao,
        resumo_sessao:     resumo.resumo_sessao,
        construto_cortex:  resumo.construto_cortex || null,
        ponto_retomada:    resumo.ponto_retomada   || null,
        nivel_crise_maximo: nivelFinal,
        nivel_alerta:      nivelFinal,
        trocas_realizadas: trocas,
        criado_em:         new Date().toISOString(),
      });

      if (nivelFinal >= 2) {
        await supabase.from("alertas").insert({
          aluno_id:    aluno.id,
          escola_id:   aluno.escola_id,
          nivel_alerta: nivelFinal,
          criado_em:   new Date().toISOString(),
        });
      }
    } catch (e) { console.error("[ARIA] saveSession:", e); }
    finally     { setSavingSession(false); }
  }, [aluno, trocas]);

  // ── Enviar mensagem ────────────────────────────────────────
  async function sendMessage() {
    if (!input.trim() || loading || sessionEnded) return;
    const userText = input.trim();
    setInput("");

    const msgCrisis  = detectCrisisLevel(userText);
    const newCrisis  = Math.max(crisisRef.current, msgCrisis);
    crisisRef.current = newCrisis;
    setCrisisLevel(newCrisis);

    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);
    const newTrocas = trocas + 1;
    setTrocas(newTrocas);

    try {
      const apiMessages = newMessages
        .filter(m => m.role !== "system")
        .map(m => ({ role: m.role, content: m.content }));

      let sp = systemPrompt;
      if (newCrisis === 3) sp += "\n\nATENÇÃO NÍVEL 3: use a fala exata do protocolo de crise Nível 3. Após isso, encerre com cuidado.";
      else if (newCrisis === 2) sp += "\n\nATENÇÃO NÍVEL 2: valide intensamente e ofereça CVV 188 e orientador escolar.";
      else if (newCrisis === 1) sp += "\n\nATENÇÃO NÍVEL 1: desacelere, aprofunde escuta.";
      if (newTrocas >= MAX_TROCAS) sp += "\n\nENCERRAMENTO: última mensagem. Encerre de forma natural e acolhedora.";

      const res = await fetch("/.netlify/functions/anthropic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, max_tokens: MAX_TOKENS, system: sp, messages: apiMessages }),
      });
      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "";

      const resCrisis  = detectCrisisLevel(text);
      const finalCrisis = Math.max(newCrisis, resCrisis);
      if (finalCrisis > newCrisis) { crisisRef.current = finalCrisis; setCrisisLevel(finalCrisis); }

      const updated = [...newMessages, { role: "assistant", content: text }];
      setMessages(updated);

      if (newTrocas >= MAX_TROCAS || finalCrisis === 3) {
        setSessionEnded(true);
        await saveSession(updated, finalCrisis);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "deu um problema técnico aqui. pode repetir?" }]);
    } finally { setLoading(false); }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  async function novaConversa() {
    setSidebarOpen(false);
    if (messages.length > 1 && !sessionEnded) {
      setSessionEnded(true);
      await saveSession(messages, crisisRef.current);
    }
    setMessages([]);
    setTrocas(0);
    setSessionEnded(false);
    setCrisisLevel(0);
    crisisRef.current = 0;
    // recarregar histórico e abertura
    const { data: todas } = await supabase
      .from("conversas")
      .select("id, resumo_temas, resumo_sessao, construto_cortex, ponto_retomada, criado_em")
      .eq("aluno_id", aluno.id)
      .order("criado_em", { ascending: false })
      .limit(30);
    setAllSessions(todas || []);
    const comResumo = (todas || []).filter(c => c.resumo_sessao).slice(0, MAX_HIST);
    setHistorico(comResumo);
    const sp = getARIASystemPrompt(apelido, comResumo);
    setSystemPrompt(sp);
    const abertura = getAberturaARIA(apelido, new Date().getHours(), comResumo);
    setMessages([{ role: "assistant", content: abertura }]);
  }

  // ── Loading inicial ────────────────────────────────────────
  if (initializing) return (
    <div style={s.loadScreen}>
      <ARIAOrb size={64} pulse />
      <p style={s.loadText}>carregando...</p>
    </div>
  );

  if (error) return (
    <div style={s.loadScreen}>
      <p style={{ color: "var(--accent-pink)", fontSize: 14, fontFamily: "var(--font-body)" }}>{error}</p>
      <button onClick={() => window.location.reload()} style={s.btnPrimary}>recarregar</button>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────
  return (
    <div style={s.shell}>

      {/* ══ SIDEBAR ══════════════════════════════════════════ */}
      <>
        {/* Overlay */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={s.overlay}
          />
        )}

        <aside
          ref={sidebarRef}
          style={{ ...s.sidebar, transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)" }}
        >
          {/* Topo sidebar */}
          <div style={s.sidebarTop}>
            <div style={s.sidebarBrand}>
              <ARIAOrb size={24} />
              <span style={s.brandName}>ARIA</span>
            </div>
            <button onClick={novaConversa} style={s.btnNovaConversa} title="Nova conversa">
              <IconEditar />
            </button>
          </div>

          {/* Lista de sessões */}
          <div style={s.sessionList}>
            {allSessions.length === 0 ? (
              <p style={s.sessionEmpty}>primeira sessão 🌱</p>
            ) : (
              allSessions.map((sess, i) => (
                <div key={sess.id || i} style={s.sessionItem}>
                  <div style={s.sessionHeader}>
                    {sess.construto_cortex && (
                      <span style={s.badge}>{sess.construto_cortex}</span>
                    )}
                    <span style={s.sessionDate}>{fmtData(sess.criado_em)}</span>
                  </div>
                  <p style={s.sessionTitle}>
                    {tituloSessao(sess.resumo_sessao || sess.resumo_temas)}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Rodapé sidebar */}
          <div style={s.sidebarFooter}>
            <div style={s.alunoInfo}>
              <div style={s.alunoAvatar}>
                {apelido.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={s.alunoNome}>{aluno?.nome || apelido}</p>
                {aluno?.apelido && aluno.apelido !== aluno.nome && (
                  <p style={s.alunoApelido}>{aluno.apelido}</p>
                )}
              </div>
            </div>
            <button onClick={logout} style={s.btnLogout} title="Sair">
              <IconSair />
            </button>
          </div>
        </aside>
      </>

      {/* ══ ÁREA PRINCIPAL ═══════════════════════════════════ */}
      <main style={s.main}>

        {/* ── Header ── */}
        <header style={s.header}>
          <button onClick={() => setSidebarOpen(v => !v)} style={s.btnMenu} aria-label="Menu">
            <IconMenu />
          </button>

          <div style={s.headerCenter}>
            <ARIAOrb size={34} />
            <div>
              <p style={s.headerName}>ARIA</p>
              <div style={s.onlineRow}>
                <span style={s.onlineDot} />
                <span style={s.onlineText}>online</span>
              </div>
            </div>
          </div>

          <div style={s.headerRight}>
            {crisisLevel >= 2 && <span title={`atenção nível ${crisisLevel}`} style={{ fontSize: 18 }}>⚠️</span>}
            {!sessionEnded && messages.length > 2 && (
              <button
                onClick={async () => { setSessionEnded(true); await saveSession(messages, crisisRef.current); }}
                style={s.btnEncerrar}
              >
                encerrar
              </button>
            )}
          </div>
        </header>

        {/* ── Barra de progresso ── */}
        <div style={s.progressTrack}>
          <div style={{
            ...s.progressFill,
            width: `${Math.min((trocas / MAX_TROCAS) * 100, 100)}%`,
            background: trocas >= MAX_TROCAS - 5
              ? "var(--accent-pink)"
              : "linear-gradient(90deg, var(--accent-purple), var(--accent-pink))",
          }} />
        </div>

        {/* ── Mensagens ── */}
        <div style={s.messages}>
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} isUser={msg.role === "user"} />
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ ...s.msgRow, justifyContent: "flex-start", animation: "fadeUp .2s ease" }}>
              <div style={s.ariaAvatarSmall}><ARIAOrb size={22} /></div>
              <div style={s.ariaBubble}>
                <span style={{ ...s.dot, animationDelay: "0ms" }} />
                <span style={{ ...s.dot, animationDelay: "200ms" }} />
                <span style={{ ...s.dot, animationDelay: "400ms" }} />
              </div>
            </div>
          )}

          {/* Sessão encerrada */}
          {sessionEnded && !savingSession && (
            <div style={s.endCard}>
              <span style={{ fontSize: 28 }}>💜</span>
              <p style={s.endTitle}>sessão encerrada</p>
              <p style={s.endSub}>
                vou guardar tudo isso aqui. quando você voltar, começo de onde a gente parou.
              </p>
              <button onClick={novaConversa} style={s.btnPrimary}>
                nova conversa
              </button>
            </div>
          )}

          {savingSession && (
            <p style={s.saving}>guardando sessão...</p>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Card de humor (colapsável, acima do input) ── */}
        {!humorSalvo && (
          <div style={s.humorCard}>
            <button
              onClick={() => setHumorOpen(v => !v)}
              style={s.humorToggle}
            >
              <span style={s.humorToggleText}>
                {humorOpen ? "fechar" : "✦ como você tá hoje?"}
              </span>
              <span style={{ fontSize: 12, color: "var(--muted)", transition: "transform .3s", transform: humorOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
            </button>

            {humorOpen && (
              <div style={s.humorBody}>
                <div style={s.humorSection}>
                  <p style={s.humorLabel}>humor</p>
                  <div style={s.humorOptions}>
                    {[["😶","1"],["😔","2"],["😐","3"],["🙂","4"],["😄","5"]].map(([emoji, val]) => (
                      <button
                        key={val}
                        onClick={() => setHumorValue(Number(val))}
                        style={{ ...s.humorOpt, background: humorValor === Number(val) ? "rgba(200,166,255,0.2)" : "transparent", border: humorValor === Number(val) ? "1px solid var(--accent-purple)" : "1px solid transparent" }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={s.humorSection}>
                  <p style={s.humorLabel}>energia</p>
                  <div style={s.humorOptions}>
                    {[["🪫","1"],["😴","2"],["😑","3"],["⚡","4"],["🔥","5"]].map(([emoji, val]) => (
                      <button
                        key={val}
                        onClick={() => setEnergiaValue(Number(val))}
                        style={{ ...s.humorOpt, background: energiaValor === Number(val) ? "rgba(200,166,255,0.2)" : "transparent", border: energiaValor === Number(val) ? "1px solid var(--accent-purple)" : "1px solid transparent" }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={salvarHumor}
                  disabled={!humorValor || !energiaValor}
                  style={{ ...s.btnPrimary, width: "100%", opacity: (!humorValor || !energiaValor) ? 0.4 : 1 }}
                >
                  registrar
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Input ── */}
        {!sessionEnded && (
          <div style={s.inputArea}>
            <div style={s.inputWrapper}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="escreve aqui..."
                rows={1}
                disabled={loading}
                style={s.textarea}
                aria-label="mensagem"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                style={{
                  ...s.btnSend,
                  background: input.trim() && !loading
                    ? "linear-gradient(135deg, var(--accent-purple), var(--accent-pink))"
                    : "rgba(138,135,160,0.15)",
                  cursor: input.trim() && !loading ? "pointer" : "default",
                }}
                aria-label="enviar"
              >
                <IconSend active={!!(input.trim() && !loading)} />
              </button>
            </div>
            <p style={s.inputHint}>Enter para enviar · Shift+Enter para nova linha</p>
          </div>
        )}
      </main>

      <style>{`
        @keyframes fadeUp  { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes blink   { 0%,80%,100% { opacity:.2; transform:scale(.8) } 40% { opacity:1; transform:scale(1) } }
        @keyframes pulse   { 0%,100% { opacity:.6 } 50% { opacity:1 } }
        @keyframes orbGlow { 0%,100% { box-shadow: 0 0 12px rgba(200,166,255,.4) } 50% { box-shadow: 0 0 24px rgba(255,159,203,.5) } }
        textarea::placeholder { color: var(--muted); }
        textarea:focus        { outline: none; }
        ::-webkit-scrollbar   { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(138,135,160,.3); border-radius: 2px; }
      `}</style>
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────

function MessageBubble({ msg, isUser }) {
  return (
    <div style={{ ...s.msgRow, justifyContent: isUser ? "flex-end" : "flex-start", animation: "fadeUp .25s ease" }}>
      {!isUser && <div style={s.ariaAvatarSmall}><ARIAOrb size={22} /></div>}
      <div style={isUser ? s.userBubble : s.ariaBubble}>
        <p style={s.bubbleText}>{msg.content}</p>
      </div>
    </div>
  );
}

function ARIAOrb({ size = 36, pulse = false }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: "50%",
      background: "linear-gradient(135deg, var(--accent-purple), var(--accent-pink))",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
      animation: pulse ? "orbGlow 2s ease-in-out infinite" : "none",
    }}>
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" />
        <path d="M8 14s1-2 4-2 4 2 4 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="9"  cy="10" r="1.2" fill="white" />
        <circle cx="15" cy="10" r="1.2" fill="white" />
      </svg>
    </div>
  );
}

function IconMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6"  x2="21" y2="6"  />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function IconEditar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconSair() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function IconSend({ active }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke={active ? "#0E0D14" : "var(--muted)"} strokeWidth="2.5" strokeLinecap="round">
      <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
    </svg>
  );
}

// ─── Estilos ──────────────────────────────────────────────────
const s = {
  // shell
  shell: {
    display: "flex",
    height: "100dvh",
    overflow: "hidden",
    background: "var(--bg)",
    color: "var(--text)",
    fontFamily: "var(--font-body)",
    position: "relative",
  },

  // loading
  loadScreen: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", gap: 16,
    height: "100dvh", background: "var(--bg)",
  },
  loadText: { color: "var(--muted)", fontSize: 13, fontFamily: "var(--font-body)" },

  // overlay sidebar
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(14,13,20,0.6)",
    backdropFilter: "blur(2px)",
    zIndex: 19,
  },

  // sidebar
  sidebar: {
    position: "fixed", left: 0, top: 0, bottom: 0,
    width: 272,
    background: "var(--surface)",
    borderRight: "1px solid rgba(200,166,255,0.12)",
    display: "flex", flexDirection: "column",
    zIndex: 20,
    transition: "transform 0.3s cubic-bezier(.4,0,.2,1)",
    willChange: "transform",
  },
  sidebarTop: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "20px 16px 14px",
    paddingTop: "calc(20px + env(safe-area-inset-top))",
    borderBottom: "1px solid rgba(200,166,255,0.08)",
  },
  sidebarBrand: { display: "flex", alignItems: "center", gap: 10 },
  brandName: {
    fontFamily: "var(--font-display)",
    fontSize: 18, fontWeight: 600,
    color: "var(--accent-purple)",
    letterSpacing: "0.04em",
  },
  btnNovaConversa: {
    background: "rgba(200,166,255,0.1)",
    border: "1px solid rgba(200,166,255,0.2)",
    borderRadius: 8, padding: "6px 8px",
    cursor: "pointer", display: "flex",
    alignItems: "center", justifyContent: "center",
    transition: "background var(--transition)",
  },

  sessionList: {
    flex: 1, overflowY: "auto",
    padding: "10px 8px",
    display: "flex", flexDirection: "column", gap: 4,
  },
  sessionEmpty: {
    color: "var(--muted)", fontSize: 13,
    padding: "12px 8px", textAlign: "center",
    fontFamily: "var(--font-body)",
  },
  sessionItem: {
    padding: "10px 12px",
    borderRadius: "var(--radius-sm)",
    cursor: "default",
    transition: "background var(--transition)",
  },
  sessionHeader: {
    display: "flex", alignItems: "center",
    gap: 6, marginBottom: 4,
  },
  badge: {
    fontSize: 10, fontWeight: 700,
    color: "var(--accent-purple)",
    background: "rgba(200,166,255,0.12)",
    borderRadius: 4, padding: "1px 6px",
    letterSpacing: "0.04em",
    fontFamily: "var(--font-body)",
  },
  sessionDate: {
    fontSize: 11, color: "var(--muted)",
    fontFamily: "var(--font-body)",
  },
  sessionTitle: {
    fontSize: 13, color: "var(--text)",
    fontFamily: "var(--font-body)",
    lineHeight: 1.4, margin: 0,
    overflow: "hidden", textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
  },

  sidebarFooter: {
    padding: "12px 16px",
    paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
    borderTop: "1px solid rgba(200,166,255,0.08)",
    display: "flex", alignItems: "center",
    justifyContent: "space-between", gap: 8,
  },
  alunoInfo: { display: "flex", alignItems: "center", gap: 10, overflow: "hidden" },
  alunoAvatar: {
    width: 32, height: 32, borderRadius: "50%",
    background: "linear-gradient(135deg, var(--accent-purple), var(--accent-pink))",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 14, fontWeight: 700, color: "#0E0D14",
    flexShrink: 0,
  },
  alunoNome: {
    fontSize: 13, fontWeight: 600, margin: 0,
    color: "var(--text)", fontFamily: "var(--font-body)",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  alunoApelido: {
    fontSize: 11, margin: 0, color: "var(--muted)",
    fontFamily: "var(--font-body)",
  },
  btnLogout: {
    background: "none", border: "none",
    cursor: "pointer", padding: 6,
    display: "flex", alignItems: "center",
    flexShrink: 0,
  },

  // main
  main: {
    flex: 1, display: "flex", flexDirection: "column",
    height: "100dvh", overflow: "hidden", minWidth: 0,
  },

  // header
  header: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    paddingTop: "calc(12px + env(safe-area-inset-top))",
    background: "var(--surface)",
    borderBottom: "1px solid rgba(200,166,255,0.1)",
    flexShrink: 0, zIndex: 5,
  },
  btnMenu: {
    background: "none", border: "none",
    cursor: "pointer", padding: 6,
    display: "flex", alignItems: "center",
    borderRadius: 8,
  },
  headerCenter: {
    display: "flex", alignItems: "center", gap: 10,
    flex: 1, justifyContent: "center",
  },
  headerName: {
    margin: 0, fontSize: 15, fontWeight: 600,
    color: "var(--accent-purple)",
    fontFamily: "var(--font-display)",
    letterSpacing: "0.04em",
  },
  onlineRow: { display: "flex", alignItems: "center", gap: 5 },
  onlineDot: {
    width: 7, height: 7, borderRadius: "50%",
    background: "#4ade80",
    animation: "pulse 2s ease-in-out infinite",
  },
  onlineText: {
    fontSize: 11, color: "#4ade80",
    fontFamily: "var(--font-body)",
    letterSpacing: "0.04em",
  },
  headerRight: {
    display: "flex", alignItems: "center",
    gap: 8, minWidth: 80, justifyContent: "flex-end",
  },
  btnEncerrar: {
    background: "none",
    border: "1px solid rgba(200,166,255,0.2)",
    borderRadius: 20, padding: "4px 12px",
    fontSize: 12, color: "var(--muted)",
    cursor: "pointer", fontFamily: "var(--font-body)",
    transition: "border-color var(--transition)",
  },

  // progresso
  progressTrack: { height: 2, background: "rgba(200,166,255,0.08)", flexShrink: 0 },
  progressFill:  { height: "100%", transition: "width .5s ease, background .3s ease", borderRadius: 1 },

  // mensagens
  messages: {
    flex: 1, overflowY: "auto",
    padding: "20px 16px 12px",
    display: "flex", flexDirection: "column", gap: 14,
  },
  msgRow: { display: "flex", alignItems: "flex-end", gap: 8 },
  ariaAvatarSmall: { flexShrink: 0 },

  ariaBubble: {
    background: "var(--surface)",
    border: "1px solid rgba(200,166,255,0.12)",
    borderRadius: "18px 18px 18px 4px",
    padding: "11px 15px",
    maxWidth: "82%",
    display: "flex", gap: 5, alignItems: "center",
  },
  userBubble: {
    background: "rgba(200,166,255,0.14)",
    border: "1px solid rgba(200,166,255,0.25)",
    borderRadius: "18px 18px 4px 18px",
    padding: "11px 15px",
    maxWidth: "78%",
  },
  bubbleText: {
    margin: 0, fontSize: 15, lineHeight: 1.65,
    whiteSpace: "pre-wrap", wordBreak: "break-word",
    fontFamily: "var(--font-body)",
  },
  dot: {
    width: 7, height: 7, borderRadius: "50%",
    background: "var(--accent-purple)",
    display: "inline-block",
    animation: "blink 1.2s infinite",
  },

  // fim de sessão
  endCard: {
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: 10,
    padding: "28px 24px", margin: "8px 0",
    background: "var(--surface)",
    borderRadius: "var(--radius)",
    border: "1px solid rgba(200,166,255,0.15)",
    textAlign: "center",
    animation: "fadeUp .4s ease",
  },
  endTitle: {
    margin: 0, fontSize: 16, fontWeight: 600,
    color: "var(--text)", fontFamily: "var(--font-body)",
  },
  endSub: {
    margin: 0, fontSize: 13, color: "var(--muted)",
    fontFamily: "var(--font-body)", lineHeight: 1.5,
  },
  saving: {
    textAlign: "center", fontSize: 12,
    color: "var(--muted)", fontFamily: "var(--font-body)",
    animation: "pulse 1.2s infinite",
  },

  // card humor
  humorCard: {
    margin: "0 12px 8px",
    background: "var(--surface)",
    border: "1px solid rgba(200,166,255,0.15)",
    borderRadius: "var(--radius-sm)",
    overflow: "hidden",
    flexShrink: 0,
  },
  humorToggle: {
    width: "100%", display: "flex",
    alignItems: "center", justifyContent: "space-between",
    padding: "10px 14px",
    background: "none", border: "none",
    cursor: "pointer",
  },
  humorToggleText: {
    fontSize: 13, color: "var(--accent-purple)",
    fontFamily: "var(--font-body)", fontWeight: 500,
  },
  humorBody: {
    padding: "0 14px 14px",
    display: "flex", flexDirection: "column", gap: 10,
  },
  humorSection: {},
  humorLabel: {
    fontSize: 11, color: "var(--muted)",
    textTransform: "uppercase", letterSpacing: "0.06em",
    marginBottom: 6, fontFamily: "var(--font-body)",
  },
  humorOptions: { display: "flex", gap: 6 },
  humorOpt: {
    flex: 1, fontSize: 22, padding: "8px 4px",
    borderRadius: 10, cursor: "pointer",
    transition: "all .15s",
  },

  // input
  inputArea: {
    padding: "10px 12px",
    paddingBottom: "calc(10px + env(safe-area-inset-bottom))",
    background: "var(--surface)",
    borderTop: "1px solid rgba(200,166,255,0.1)",
    flexShrink: 0,
  },
  inputWrapper: {
    display: "flex", alignItems: "flex-end", gap: 8,
    background: "var(--bg)",
    border: "1.5px solid rgba(200,166,255,0.2)",
    borderRadius: 20, padding: "8px 8px 8px 14px",
    transition: "border-color var(--transition)",
  },
  textarea: {
    flex: 1, background: "none", border: "none",
    outline: "none", resize: "none",
    fontSize: 15, lineHeight: 1.5,
    color: "var(--text)",
    fontFamily: "var(--font-body)",
    minHeight: 24, maxHeight: 120,
    overflowY: "auto", padding: 0,
  },
  btnSend: {
    width: 36, height: 36, borderRadius: "50%",
    border: "none", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "background var(--transition)",
  },
  inputHint: {
    margin: "5px 0 0", fontSize: 10,
    color: "var(--muted)", textAlign: "center",
    fontFamily: "var(--font-body)", letterSpacing: "0.04em",
  },

  // botões globais
  btnPrimary: {
    padding: "10px 24px", borderRadius: 50,
    border: "none", cursor: "pointer",
    background: "linear-gradient(135deg, var(--accent-purple), var(--accent-pink))",
    color: "#0E0D14", fontSize: 14, fontWeight: 600,
    fontFamily: "var(--font-body)",
    transition: "opacity var(--transition)",
  },
};
