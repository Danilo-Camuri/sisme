import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import {
  detectCrisisLevel,
  getAberturaARIA,
  getARIASystemPrompt,
  getSummaryPrompt,
  montarBlocoMemoria,
} from "./systemPrompts";

// ─── Constantes ───────────────────────────────────────────────
const MODEL      = "claude-haiku-4-5-20251001";  // Revertido: sonnet-4-20250514 não existe, usar haiku confirmado
const MAX_TOKENS = 600;
const MAX_TROCAS = 15;   // BUG 2: resumo gerado a cada 15 trocas
const MAX_HIST   = 5;   // Etapa 2: últimas 5 sessões para memória longitudinal

// ─── Helpers ──────────────────────────────────────────────────
function fmtData(iso) {
  if (!iso) return "";
  const d    = new Date(iso);
  const hoje = new Date();
  const diff = Math.floor((hoje - d) / 86400000);
  if (diff === 0) return "hoje";
  if (diff === 1) return "ontem";
  if (diff < 7)  return `${diff} dias atrás`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function tituloSessao(resumo) {
  if (!resumo) return "sessão sem título";

  // Limpar JSON bruto antigo (formato legado: {"resumo_narrativo":"..."})
  let texto = typeof resumo === "string" ? resumo : "";
  if (texto.startsWith("{")) {
    try {
      const parsed = JSON.parse(texto);
      texto = parsed.resumo_sessao || parsed.resumo_narrativo || "";
    } catch {
      texto = "";
    }
  }

  // Remover textos genéricos que não dizem nada
  const genericos = ["sessão encerrada", "sessão muito curta", "sessão encerrada sem resumo"];
  if (!texto || genericos.some(g => texto.toLowerCase().startsWith(g))) {
    return "sessão sem resumo";
  }

  // Pegar as primeiras 7 palavras como título
  const words = texto.trim().split(/\s+/).slice(0, 7).join(" ");
  return words.length > 0 ? words.toLowerCase() : "sessão sem título";
}

// ─── Label legível dos construtos CÓRTEX ─────────────────────
function construtoLabel(letra) {
  const labels = {
    C: "Carga emocional",
    O: "Organização e foco",
    R: "Relações interpessoais",
    T: "Tensão e ativação",
    E: "Energia e vitalidade",
    X: "Xeque existencial",
  };
  return labels[letra] || letra;
}

// ─── BUG 1: chave de persistência local por aluno ─────────────
function getStorageKey(alunoId) { return `aria_msgs_${alunoId}`; }

function saveLocal(alunoId, msgs, trocas, crisisLevel) {
  try {
    sessionStorage.setItem(getStorageKey(alunoId), JSON.stringify({ msgs, trocas, crisisLevel, ts: Date.now() }));
  } catch {}
}

function loadLocal(alunoId) {
  try {
    const raw = sessionStorage.getItem(getStorageKey(alunoId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // expirar após 2 horas
    if (Date.now() - parsed.ts > 2 * 60 * 60 * 1000) { sessionStorage.removeItem(getStorageKey(alunoId)); return null; }
    return parsed;
  } catch { return null; }
}

function clearLocal(alunoId) {
  try { sessionStorage.removeItem(getStorageKey(alunoId)); } catch {}
}

// ─── Componente principal ─────────────────────────────────────
export default function AriaChat({ portaEntrada = null, onNovaConversa = null }) {
  const { aluno, logout } = useAuth();

  const [messages,      setMessages]      = useState([]);
  const [input,         setInput]         = useState("");
  const [loading,       setLoading]       = useState(false);
  const [initializing,  setInitializing]  = useState(true);
  const [trocas,        setTrocas]        = useState(0);
  const [sessionEnded,  setSessionEnded]  = useState(false);
  const [crisisLevel,   setCrisisLevel]   = useState(0);
  const [savingSession, setSavingSession] = useState(false);
  const [error,         setError]         = useState(null);

  const [historico,    setHistorico]    = useState([]);
  const [systemPrompt, setSystemPrompt] = useState("");

  // BUG 3: sidebar com estado explícito e handler dedicado
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [allSessions, setAllSessions] = useState([]);

  const [humorOpen,    setHumorOpen]    = useState(false);
  const [humorValor,   setHumorValue]   = useState(null);
  const [energiaValor, setEnergiaValue] = useState(null);
  const [humorSalvo,   setHumorSalvo]   = useState(false);

  // Modal de resumo de sessão
  const [sessaoModal,  setSessaoModal]  = useState(null); // sessão selecionada

  const portaInjetadaRef = useRef(false);  // controla injeção única da porta
  const [resumoFinal, setResumoFinal] = useState(null);  // resumo exibido no encerramento
    const bottomRef   = useRef(null);
  const textareaRef = useRef(null);  // BUG 5: foco no input
  const crisisRef   = useRef(0);
  const touchStartX = useRef(null);

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
    textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
  }, [input]);

  // ── BUG 3: swipe corrigido — não conflita com sidebar ─────
  useEffect(() => {
    function onTouchStart(e) { touchStartX.current = e.touches[0].clientX; }
    function onTouchEnd(e) {
      if (touchStartX.current === null) return;
      const dx = touchStartX.current - e.changedTouches[0].clientX;
      if (dx > 70)  setSidebarOpen(false);
      if (dx < -70 && touchStartX.current < 40) setSidebarOpen(true); // só da borda esquerda
      touchStartX.current = null;
    }
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend",   onTouchEnd,   { passive: true });
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
        // BUG 1: tentar restaurar sessão do sessionStorage
        const cached = loadLocal(aluno.id);

        const { data: todas } = await supabase
          .from("conversas")
          .select("id, resumo_temas, resumo_sessao, construto_cortex, ponto_retomada, criado_em")
          .eq("aluno_id", aluno.id)
          .order("criado_em", { ascending: false })
          .limit(50);   // busca 50 para sidebar, filtra 5 com resumo para memória

        setAllSessions(todas || []);

        const comResumo = (todas || []).filter(c => c.resumo_sessao).slice(0, MAX_HIST);
        setHistorico(comResumo);

        // Etapa 3: log do bloco de memória para diagnóstico
        const blocoLog = montarBlocoMemoria(apelido, comResumo);
        console.log("[ARIA memória]\n" + blocoLog);

        const sp = getARIASystemPrompt(apelido, comResumo);
        setSystemPrompt(sp);

        const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
        const { data: ci } = await supabase
          .from("checkins")
          .select("humor, energia")
          .eq("aluno_id", aluno.id)
          .gte("criado_em", hoje.toISOString())
          .maybeSingle();
        if (ci) { setHumorValue(ci.humor); setEnergiaValue(ci.energia); setHumorSalvo(true); }

        // BUG 1: restaurar mensagens se existirem no cache
        if (cached && cached.msgs && cached.msgs.length > 0) {
          setMessages(cached.msgs);
          setTrocas(cached.trocas || 0);
          crisisRef.current = cached.crisisLevel || 0;
          setCrisisLevel(cached.crisisLevel || 0);
        } else {
          const abertura = getAberturaARIA(apelido, hora, comResumo);
          setMessages([{ role: "assistant", content: abertura }]);
        }
      } catch {
        setError("Erro ao iniciar. Recarregue a página.");
      } finally {
        setInitializing(false);
      }
    }
    init();
  }, [aluno]);

  // ── Salvar humor ──────────────────────────────────────────
  async function salvarHumor() {
    if (!humorValor || !energiaValor || humorSalvo) return;
    try {
      await supabase.from("checkins").insert({
        aluno_id: aluno.id, escola_id: aluno.escola_id,
        humor: humorValor, energia: energiaValor,
      });
      setHumorSalvo(true);
      setHumorOpen(false);
    } catch (e) { console.error("checkin:", e); }
  }

  // ── saveSession — geração de resumo via API ──────────────
  const saveSession = useCallback(async (finalMessages, nivelFinal) => {
    if (!aluno || finalMessages.length < 2) return;
    setSavingSession(true);
    try {
      // Montar histórico legível para o modelo resumir
      const historicoTexto = finalMessages
        .filter(m => m.role !== "system")
        .map(m => `${m.role === "user" ? "Aluno" : "ARIA"}: ${m.content}`)
        .join("\n");

      // Chamada conforme spec do cofundador:
      // histórico vai no CONTEÚDO da mensagem, não no system
      const res = await fetch("/.netlify/functions/anthropic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 300,
          messages: [{
            role: "user",
            content: `Com base nessa conversa, gere um resumo estruturado em JSON com exatamente estes campos:
- resumo_sessao: descrição dos temas abordados em 2 a 4 frases, sem citar falas literais
- construto_cortex: letra do construto mais ativado — C, O, R, T, E ou X
- nivel_crise: número de 0 a 3
- ponto_retomada: uma frase curta em primeira pessoa da ARIA para retomar na próxima conversa, em minúsculas

Construtos CÓRTEX: C=Carga emocional, O=Organização/foco, R=Relações interpessoais, T=Tensão/ativação, E=Energia/vitalidade, X=Xeque existencial.

Conversa:
${historicoTexto}

Responda apenas com o JSON válido, sem explicação, sem blocos de código.`,
          }],
        }),
      });

      const data    = await res.json();
      const rawText = data.content?.map(b => b.text || "").join("").trim() || "";
      console.log("[ARIA resumo] raw:", rawText);

      let resumo = null;
      try {
        // limpar qualquer markdown que o modelo possa ter adicionado
        const clean = rawText
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/```\s*$/i, "")
          .trim();
        resumo = JSON.parse(clean);
        console.log("[ARIA resumo] parsed:", resumo);
      } catch (parseErr) {
        console.warn("[ARIA resumo] parse falhou:", parseErr.message, "raw:", rawText);
        resumo = {
          resumo_sessao:    rawText.slice(0, 600) || "Sessão encerrada.",
          construto_cortex: null,
          ponto_retomada:   null,
          nivel_crise:      nivelFinal,
        };
      }

      // Garantir que resumo_sessao nunca fique genérico demais
      if (!resumo?.resumo_sessao || resumo.resumo_sessao.trim() === "") {
        resumo.resumo_sessao = finalMessages.filter(m => m.role === "user").length <= 2
          ? "Sessão muito curta para resumo."
          : "Sessão encerrada sem resumo gerado.";
      }

      // Guardar resumo para tela de encerramento
      setResumoFinal(resumo);

            const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("conversas").insert({
        aluno_id:           aluno.id,
        escola_id:          aluno.escola_id,
        usuario_id:         user.id,
        assistente:         "aria",
        porta_entrada:      portaEntrada || null,
        resumo_temas:       resumo.resumo_sessao,
        resumo_sessao:      resumo.resumo_sessao,
        construto_cortex:   resumo.construto_cortex  || null,
        ponto_retomada:     resumo.ponto_retomada    || null,
        nivel_crise_maximo: nivelFinal,
        nivel_alerta:       nivelFinal,
        trocas_realizadas:  finalMessages.filter(m => m.role === "user").length,
        criado_em:          new Date().toISOString(),
      });

      if (nivelFinal >= 2) {
        await supabase.from("alertas").insert({
          aluno_id: aluno.id, escola_id: aluno.escola_id,
          nivel_alerta: nivelFinal, criado_em: new Date().toISOString(),
        });
      }

      // BUG 1: limpar cache local após salvar no Supabase
      clearLocal(aluno.id);
    } catch (e) { console.error("[ARIA] saveSession:", e); }
    finally     { setSavingSession(false); }
  }, [aluno]);

  // ── Enviar mensagem ────────────────────────────────────────
  async function sendMessage() {
    if (!input.trim() || loading || sessionEnded) return;
    const userText = input.trim();
    setInput("");

    // BUG 5: devolver foco ao input imediatamente
    setTimeout(() => textareaRef.current?.focus(), 50);

    // Porta de entrada — injetada silenciosamente só na 1ª mensagem
    let textoParaAPI = userText;
    if (portaEntrada && !portaInjetadaRef.current) {
      textoParaAPI = `[porta: ${portaEntrada}]\n${userText}`;
      portaInjetadaRef.current = true;
    }

    const msgCrisis   = detectCrisisLevel(userText);
    const newCrisis   = Math.max(crisisRef.current, msgCrisis);
    crisisRef.current = newCrisis;
    setCrisisLevel(newCrisis);

    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);
    const newTrocas = trocas + 1;
    setTrocas(newTrocas);

    // BUG 1: salvar no sessionStorage após cada mensagem
    saveLocal(aluno.id, newMessages, newTrocas, newCrisis);

    try {
      // Última msg usa textoParaAPI (com porta) — tela mostra userText limpo
      const apiMessages = newMessages
        .filter(m => m.role !== "system")
        .map((m, i, arr) => ({
          role: m.role,
          content: (m.role === "user" && i === arr.length - 1)
            ? textoParaAPI
            : m.content,
        }));

      let sp = systemPrompt;
      if (newCrisis === 3)       sp += "\n\nATENÇÃO NÍVEL 3: use a fala exata do protocolo de crise Nível 3. Após isso, encerre com cuidado.";
      else if (newCrisis === 2)  sp += "\n\nATENÇÃO NÍVEL 2: valide intensamente e ofereça CVV 188 e orientador escolar.";
      else if (newCrisis === 1)  sp += "\n\nATENÇÃO NÍVEL 1: desacelere, aprofunde escuta.";
      if (newTrocas >= MAX_TROCAS) sp += "\n\nENCERRAMENTO: esta é a última mensagem da sessão. Encerre de forma natural e acolhedora com a fala de encerramento.";

      const res = await fetch("/.netlify/functions/anthropic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, max_tokens: MAX_TOKENS, system: sp, messages: apiMessages }),
      });
      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "";

      const resCrisis   = detectCrisisLevel(text);
      const finalCrisis = Math.max(newCrisis, resCrisis);
      if (finalCrisis > newCrisis) { crisisRef.current = finalCrisis; setCrisisLevel(finalCrisis); }

      const updated = [...newMessages, { role: "assistant", content: text }];
      setMessages(updated);

      // BUG 1: salvar no sessionStorage após resposta da ARIA
      saveLocal(aluno.id, updated, newTrocas, finalCrisis);

      // BUG 2: encerrar e gerar resumo a cada 15 trocas ou crise 3
      if (newTrocas >= MAX_TROCAS || finalCrisis === 3) {
        setSessionEnded(true);
        await saveSession(updated, finalCrisis);
      }
    } catch (err) {
      console.error("[ARIA] sendMessage erro:", err);
      setMessages(prev => [...prev, { role: "assistant", content: "deu um problema técnico aqui. pode repetir?" }]);
    } finally {
      setLoading(false);
      // BUG 5: devolver foco após resposta
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  // BUG 3: handler do menu com toggle explícito
  function toggleSidebar() {
    setSidebarOpen(prev => !prev);
  }

  async function encerrarSessao() {
    if (messages.length < 2 || savingSession) return;
    setSessionEnded(true);
    await saveSession(messages, crisisRef.current);
  }

  async function novaConversa() {
    setSidebarOpen(false);
    // Se houver callback externo (HomeAluno), volta para tela de portas
    if (onNovaConversa) { onNovaConversa(); return; }
    if (messages.length > 1 && !sessionEnded) {
      setSessionEnded(true);
      await saveSession(messages, crisisRef.current);
    }
    clearLocal(aluno?.id);
    setMessages([]);
    setTrocas(0);
    setSessionEnded(false);
    setCrisisLevel(0);
    crisisRef.current = 0;

    const { data: todas } = await supabase
      .from("conversas")
      .select("id, resumo_temas, resumo_sessao, construto_cortex, ponto_retomada, criado_em")
      .eq("aluno_id", aluno.id)
      .order("criado_em", { ascending: false })
      .limit(50);
    setAllSessions(todas || []);
    const comResumo = (todas || []).filter(c => c.resumo_sessao).slice(0, MAX_HIST);
    setHistorico(comResumo);
    console.log("[ARIA memória nova conversa]\n" + montarBlocoMemoria(apelido, comResumo));
    const sp = getARIASystemPrompt(apelido, comResumo);
    setSystemPrompt(sp);
    const abertura = getAberturaARIA(apelido, new Date().getHours(), comResumo);
    setMessages([{ role: "assistant", content: abertura }]);
  }

  // ── Loading / erro ─────────────────────────────────────────
  if (initializing) return (
    <div style={s.loadScreen}>
      <ARIAOrb size={64} pulse />
      <p style={s.loadText}>carregando...</p>
    </div>
  );

  if (error) return (
    <div style={s.loadScreen}>
      <p style={{ color: "var(--accent-pink)", fontSize: 14, fontFamily: "var(--font-body)" }}>{error}</p>
      <button onClick={() => window.location.reload()} style={s.btnPill}>recarregar</button>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────
  return (
    <div style={s.shell}>

      {/* Overlay sidebar */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={s.overlay}
          aria-label="fechar menu"
        />
      )}

      {/* ── Modal de resumo de sessão ───────────────────────── */}
      {sessaoModal && (
        <div style={s.modalOverlay} onClick={() => setSessaoModal(null)}>
          <div style={s.modalCard} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {sessaoModal.construto_cortex && (
                  <span style={s.badge} title={construtoLabel(sessaoModal.construto_cortex)}>
                    {sessaoModal.construto_cortex}
                  </span>
                )}
                <span style={s.sessionDate}>{fmtData(sessaoModal.criado_em)}</span>
              </div>
              <button onClick={() => setSessaoModal(null)} style={s.modalClose}>×</button>
            </div>

            <div style={s.modalBody}>
              {sessaoModal.resumo_sessao && !["sessão encerrada", "sessão muito curta", "sessão sem resumo"].some(g => sessaoModal.resumo_sessao.toLowerCase().startsWith(g)) ? (
                <>
                  <p style={s.modalLabel}>o que a gente falou</p>
                  <p style={s.modalText}>{sessaoModal.resumo_sessao}</p>
                </>
              ) : (
                <p style={{ ...s.modalText, color: "var(--muted)", fontStyle: "italic" }}>
                  essa sessão não tem resumo gravado ainda.
                </p>
              )}

              {sessaoModal.ponto_retomada && (
                <>
                  <p style={{ ...s.modalLabel, marginTop: 16 }}>ficou em aberto</p>
                  <p style={{ ...s.modalText, color: "var(--accent-purple)" }}>
                    {sessaoModal.ponto_retomada}
                  </p>
                </>
              )}

              <div style={s.modalFooter}>
                <span style={s.sessionDate}>
                  {sessaoModal.trocas_realizadas ? `${sessaoModal.trocas_realizadas} trocas` : ""}
                </span>
                <button onClick={() => setSessaoModal(null)} style={s.btnPill}>
                  fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Sidebar ────────────────────────────────────────── */}
      <aside style={{
        ...s.sidebar,
        transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
      }}>
        <div style={s.sidebarTop}>
          <div style={s.sidebarBrand}>
            <ARIAOrb size={24} />
            <span style={s.brandName}>ARIA</span>
          </div>
          <button onClick={novaConversa} style={s.btnIcon} title="Nova conversa" aria-label="Nova conversa">
            <IconEditar />
          </button>
        </div>

        <div style={s.sessionList}>
          {allSessions.length === 0 ? (
            <p style={s.sessionEmpty}>primeira sessão 🌱</p>
          ) : (
            allSessions.map((sess, i) => (
              <div
                key={sess.id || i}
                style={{ ...s.sessionItem, cursor: "pointer" }}
                onClick={() => { setSessaoModal(sess); setSidebarOpen(false); }}
                role="button"
                tabIndex={0}
              >
                <div style={s.sessionHeader}>
                  {sess.construto_cortex && (
                    <span style={s.badge} title={construtoLabel(sess.construto_cortex)}>
                      {sess.construto_cortex}
                    </span>
                  )}
                  <span style={s.sessionDate}>{fmtData(sess.criado_em)}</span>
                </div>
                <p style={s.sessionTitle}>
                  {tituloSessao(sess.resumo_sessao || sess.resumo_temas)}
                </p>
                {sess.ponto_retomada && (
                  <p style={s.sessionRetomada}>↩ {sess.ponto_retomada}</p>
                )}
              </div>
            ))
          )}
        </div>

        <div style={s.sidebarFooter}>
          <div style={s.alunoInfo}>
            <div style={s.alunoAvatar}>{apelido.charAt(0).toUpperCase()}</div>
            <div style={{ overflow: "hidden" }}>
              <p style={s.alunoNome}>{aluno?.nome || apelido}</p>
              {aluno?.apelido && aluno.apelido !== aluno.nome && (
                <p style={s.alunoApelido}>{aluno.apelido}</p>
              )}
            </div>
          </div>
          <button onClick={logout} style={s.btnIcon} title="Sair" aria-label="Sair">
            <IconSair />
          </button>
        </div>
      </aside>

      {/* ── Área principal ─────────────────────────────────── */}
      <main style={s.main}>

        {/* Header */}
        <header style={s.header}>
          {/* BUG 3: botão com área de toque grande e handler correto */}
          <button
            onClick={toggleSidebar}
            style={s.btnMenu}
            aria-label="Abrir menu"
            aria-expanded={sidebarOpen}
          >
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
              <button onClick={encerrarSessao} style={s.btnEncerrar}>
                encerrar
              </button>
            )}
          </div>
        </header>

        {/* Barra de progresso */}
        <div style={s.progressTrack}>
          <div style={{
            ...s.progressFill,
            width: `${Math.min((trocas / MAX_TROCAS) * 100, 100)}%`,
            background: trocas >= MAX_TROCAS - 3
              ? "var(--accent-pink)"
              : "linear-gradient(90deg, var(--accent-purple), var(--accent-pink))",
          }} />
        </div>

        {/* Mensagens */}
        <div style={s.messages}>
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} isUser={msg.role === "user"} />
          ))}

          {loading && (
            <div style={{ ...s.msgRow, justifyContent: "flex-start" }}>
              <div style={s.ariaAvatarSmall}><ARIAOrb size={22} /></div>
              <div style={{ ...s.ariaBubble, display: "flex", gap: 5, alignItems: "center" }}>
                {[0, 200, 400].map(d => (
                  <span key={d} style={{ ...s.dot, animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          )}

          {savingSession && (
            <div style={s.savingWrap}>
              <div style={s.savingOrb} />
              <p style={s.saving}>guardando sua sessão...</p>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Card de humor colapsável */}
        {!humorSalvo && (
          <div style={s.humorCard}>
            <button onClick={() => setHumorOpen(v => !v)} style={s.humorToggle}>
              <span style={s.humorToggleText}>{humorOpen ? "fechar" : "✦ como você tá hoje?"}</span>
              <span style={{ fontSize: 11, color: "var(--muted)", transition: "transform .3s", transform: humorOpen ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
            </button>
            {humorOpen && (
              <div style={s.humorBody}>
                <div style={s.humorSection}>
                  <p style={s.humorLabel}>humor</p>
                  <div style={s.humorOptions}>
                    {[["😶","1"],["😔","2"],["😐","3"],["🙂","4"],["😄","5"]].map(([e, v]) => (
                      <button key={v} onClick={() => setHumorValue(Number(v))} style={{ ...s.humorOpt, background: humorValor === Number(v) ? "rgba(200,166,255,0.2)" : "transparent", border: humorValor === Number(v) ? "1px solid var(--accent-purple)" : "1px solid transparent" }}>{e}</button>
                    ))}
                  </div>
                </div>
                <div style={s.humorSection}>
                  <p style={s.humorLabel}>energia</p>
                  <div style={s.humorOptions}>
                    {[["🪫","1"],["😴","2"],["😑","3"],["⚡","4"],["🔥","5"]].map(([e, v]) => (
                      <button key={v} onClick={() => setEnergiaValue(Number(v))} style={{ ...s.humorOpt, background: energiaValor === Number(v) ? "rgba(200,166,255,0.2)" : "transparent", border: energiaValor === Number(v) ? "1px solid var(--accent-purple)" : "1px solid transparent" }}>{e}</button>
                    ))}
                  </div>
                </div>
                <button onClick={salvarHumor} disabled={!humorValor || !energiaValor} style={{ ...s.btnPill, width: "100%", opacity: (!humorValor || !energiaValor) ? 0.4 : 1 }}>
                  registrar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Input */}
        {!sessionEnded && (
          <div style={s.inputArea}>
            <div style={{
              ...s.inputWrapper,
              borderColor: input.trim() ? "var(--accent-purple)" : "rgba(200,166,255,0.15)",
            }}>
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
                    : "rgba(138,135,160,0.12)",
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

      {/* ── Tela de encerramento ─────────────────────────────── */}
      {sessionEnded && (
        <TelaEncerramento
          resumo={resumoFinal}
          salvando={savingSession}
          onNovaConversa={novaConversa}
        />
      )}

      <style>{`
        @keyframes fadeUp  { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes blink   { 0%,80%,100% { opacity:.2; transform:scale(.8) } 40% { opacity:1; transform:scale(1) } }
        @keyframes pulse   { 0%,100% { opacity:.6 } 50% { opacity:1 } }
        @keyframes orbGlow { 0%,100% { box-shadow:0 0 12px rgba(200,166,255,.4) } 50% { box-shadow:0 0 24px rgba(255,159,203,.5) } }
        textarea::placeholder { color: var(--muted); }
        textarea:focus        { outline: none; }
        ::-webkit-scrollbar   { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(138,135,160,.25); border-radius: 2px; }
      `}</style>
    </div>
  );
}

// ─── Tela de Encerramento ────────────────────────────────────
function TelaEncerramento({ resumo, salvando, onNovaConversa }) {
  const temResumoReal = resumo?.resumo_sessao &&
    !["sessão muito curta", "sessão encerrada"].some(g =>
      resumo.resumo_sessao.toLowerCase().startsWith(g)
    );

  return (
    <div style={te.overlay}>
      <div style={te.container}>

        {/* Orb com brilho */}
        <div style={te.orbWrap}>
          <div style={te.orbGlow} />
          <div style={te.orb}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.85)" strokeWidth="1.5"/>
              <path d="M8 14s1-2 4-2 4 2 4 2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="9"  cy="10" r="1.2" fill="white"/>
              <circle cx="15" cy="10" r="1.2" fill="white"/>
            </svg>
          </div>
        </div>

        {salvando ? (
          <>
            <p style={te.titulo}>guardando...</p>
            <p style={te.sub}>processando o resumo da conversa</p>
          </>
        ) : (
          <>
            {/* Frase de fechamento */}
            <p style={te.titulo}>foi bom conversar hoje.</p>
            <p style={te.sub}>vou lembrar disso quando você voltar.</p>

            {/* Card de resumo — só se tiver conteúdo real */}
            {temResumoReal && (
              <div style={te.card}>
                <div style={te.cardRow}>
                  <span style={te.cardLabel}>você trouxe</span>
                  {resumo.construto_cortex && (
                    <span style={te.badge}>{resumo.construto_cortex}</span>
                  )}
                </div>
                <p style={te.cardTexto}>{resumo.resumo_sessao}</p>

                {resumo.ponto_retomada && (
                  <>
                    <div style={{ ...te.cardRow, marginTop: 14 }}>
                      <span style={te.cardLabel}>ficou em aberto</span>
                    </div>
                    <p style={{ ...te.cardTexto, color: "var(--accent-purple)" }}>
                      {resumo.ponto_retomada}
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Botão único */}
            <button onClick={onNovaConversa} style={te.btn}>
              até logo
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Estilos da tela de encerramento
const te = {
  overlay: {
    position: "fixed", inset: 0,
    background: "var(--bg)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 50,
    padding: "0 24px",
    animation: "fadeUp 0.5s ease",
  },
  container: {
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: 16,
    width: "100%", maxWidth: 380,
    textAlign: "center",
  },
  orbWrap: {
    position: "relative",
    display: "flex", alignItems: "center", justifyContent: "center",
    marginBottom: 8,
  },
  orbGlow: {
    position: "absolute",
    width: 80, height: 80, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(200,166,255,0.3) 0%, transparent 70%)",
    animation: "pulse 2.5s ease-in-out infinite",
  },
  orb: {
    width: 64, height: 64, borderRadius: "50%",
    background: "linear-gradient(135deg, var(--accent-purple), var(--accent-pink))",
    display: "flex", alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  titulo: {
    fontFamily: "var(--font-display)",
    fontSize: 22, fontWeight: 400,
    color: "var(--text)", margin: 0,
    lineHeight: 1.3,
  },
  sub: {
    fontSize: 14, color: "var(--muted)",
    margin: 0, fontFamily: "var(--font-body)",
    lineHeight: 1.5,
  },
  card: {
    width: "100%",
    background: "var(--surface)",
    border: "1px solid rgba(200,166,255,0.15)",
    borderRadius: "var(--radius-sm)",
    padding: "18px 20px",
    textAlign: "left",
    marginTop: 4,
  },
  cardRow: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 10, color: "var(--muted)",
    textTransform: "uppercase", letterSpacing: "0.08em",
    fontFamily: "var(--font-body)",
  },
  badge: {
    fontSize: 10, fontWeight: 700,
    color: "var(--accent-purple)",
    background: "rgba(200,166,255,0.12)",
    borderRadius: 4, padding: "1px 6px",
    letterSpacing: "0.04em",
  },
  cardTexto: {
    fontSize: 14, color: "var(--text)",
    lineHeight: 1.65, margin: 0,
    fontFamily: "var(--font-body)",
  },
  btn: {
    marginTop: 8,
    padding: "13px 40px",
    borderRadius: 50, border: "none",
    background: "linear-gradient(135deg, var(--accent-purple), var(--accent-pink))",
    color: "#0E0D14", fontSize: 15, fontWeight: 600,
    fontFamily: "var(--font-body)",
    cursor: "pointer",
    transition: "opacity 0.2s",
    letterSpacing: "0.02em",
  },
};

// ─── Sub-componentes ──────────────────────────────────────────
function MessageBubble({ msg, isUser }) {
  return (
    <div style={{
      ...s.msgRow,
      justifyContent: isUser ? "flex-end" : "flex-start",
      animation: "fadeUp .25s ease",
    }}>
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
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, var(--accent-purple), var(--accent-pink))",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
      animation: pulse ? "orbGlow 2s ease-in-out infinite" : "none",
    }}>
      <svg width={size * .5} height={size * .5} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.85)" strokeWidth="1.5" />
        <path d="M8 14s1-2 4-2 4 2 4 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="9"  cy="10" r="1.2" fill="white" />
        <circle cx="15" cy="10" r="1.2" fill="white" />
      </svg>
    </div>
  );
}

function IconMenu() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6"  x2="21" y2="6"  />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function IconEditar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconSair() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
  shell: {
    display: "flex", height: "100dvh", overflow: "hidden",
    background: "var(--bg)", color: "var(--text)",
    fontFamily: "var(--font-body)", position: "relative",
  },
  loadScreen: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", gap: 16,
    height: "100dvh", background: "var(--bg)",
  },
  loadText: { color: "var(--muted)", fontSize: 13, fontFamily: "var(--font-body)" },

  // BUG 3: overlay com z-index alto e pointer-events corretos
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(14,13,20,0.55)",
    backdropFilter: "blur(2px)",
    zIndex: 19,
    cursor: "pointer",
  },
  sidebar: {
    position: "fixed", left: 0, top: 0, bottom: 0,
    width: 272,
    background: "var(--surface)",
    borderRight: "1px solid rgba(200,166,255,0.1)",
    display: "flex", flexDirection: "column",
    zIndex: 20,
    transition: "transform 0.28s cubic-bezier(.4,0,.2,1)",
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
    fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600,
    color: "var(--accent-purple)", letterSpacing: "0.04em",
  },
  sessionList: {
    flex: 1, overflowY: "auto",
    padding: "10px 8px",
    display: "flex", flexDirection: "column", gap: 2,
  },
  sessionEmpty: {
    color: "var(--muted)", fontSize: 13,
    padding: "12px 8px", textAlign: "center",
  },
  sessionItem: {
    padding: "10px 12px", borderRadius: "var(--radius-sm)",
    cursor: "default",
    transition: "background var(--transition)",
  },
  sessionHeader: { display: "flex", alignItems: "center", gap: 6, marginBottom: 4 },
  badge: {
    fontSize: 10, fontWeight: 700,
    color: "var(--accent-purple)",
    background: "rgba(200,166,255,0.12)",
    borderRadius: 4, padding: "1px 6px",
    letterSpacing: "0.04em",
  },
  sessionDate: { fontSize: 11, color: "var(--muted)" },
  sessionTitle: {
    fontSize: 13, color: "var(--text)", lineHeight: 1.4, margin: 0,
    overflow: "hidden", textOverflow: "ellipsis",
    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
  },
  sessionRetomada: {
    fontSize: 11, color: "var(--accent-purple)", margin: "4px 0 0",
    lineHeight: 1.4, fontStyle: "italic",
    overflow: "hidden", textOverflow: "ellipsis",
    display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical",
  },
  sidebarFooter: {
    padding: "12px 16px",
    paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
    borderTop: "1px solid rgba(200,166,255,0.08)",
    display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  alunoInfo: { display: "flex", alignItems: "center", gap: 10, overflow: "hidden", flex: 1 },
  alunoAvatar: {
    width: 32, height: 32, borderRadius: "50%",
    background: "linear-gradient(135deg, var(--accent-purple), var(--accent-pink))",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 14, fontWeight: 700, color: "#0E0D14", flexShrink: 0,
  },
  alunoNome: {
    fontSize: 13, fontWeight: 600, margin: 0, color: "var(--text)",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  alunoApelido: { fontSize: 11, margin: 0, color: "var(--muted)" },

  main: { flex: 1, display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden", minWidth: 0 },

  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "10px 14px",
    paddingTop: "calc(10px + env(safe-area-inset-top))",
    background: "var(--surface)",
    borderBottom: "1px solid rgba(200,166,255,0.1)",
    flexShrink: 0, zIndex: 5,
  },

  // BUG 3: área de toque grande para o botão de menu
  btnMenu: {
    background: "none", border: "none",
    color: "var(--muted)",
    cursor: "pointer",
    padding: "8px",           // área de toque maior
    margin: "-8px",           // compensa o padding visual
    display: "flex", alignItems: "center", justifyContent: "center",
    borderRadius: 8,
    minWidth: 40, minHeight: 40,
  },
  btnIcon: {
    background: "rgba(200,166,255,0.08)", border: "none",
    color: "var(--muted)", cursor: "pointer",
    padding: 8, borderRadius: 8,
    display: "flex", alignItems: "center", justifyContent: "center",
    minWidth: 36, minHeight: 36,
  },
  headerCenter: {
    display: "flex", alignItems: "center", gap: 10,
    flex: 1, justifyContent: "center",
  },
  headerName: {
    margin: 0, fontSize: 15, fontWeight: 600,
    color: "var(--accent-purple)", fontFamily: "var(--font-display)",
    letterSpacing: "0.04em",
  },
  onlineRow: { display: "flex", alignItems: "center", gap: 5 },
  onlineDot: { width: 7, height: 7, borderRadius: "50%", background: "#4ade80", animation: "pulse 2s ease-in-out infinite" },
  onlineText: { fontSize: 11, color: "#4ade80", letterSpacing: "0.04em" },
  headerRight: { display: "flex", alignItems: "center", gap: 8, minWidth: 80, justifyContent: "flex-end" },
  btnEncerrar: {
    background: "none", border: "1px solid rgba(200,166,255,0.2)",
    borderRadius: 20, padding: "4px 12px",
    fontSize: 12, color: "var(--muted)", cursor: "pointer",
    fontFamily: "var(--font-body)",
  },

  progressTrack: { height: 2, background: "rgba(200,166,255,0.08)", flexShrink: 0 },
  progressFill:  { height: "100%", transition: "width .5s ease, background .3s ease", borderRadius: 1 },

  messages: {
    flex: 1, overflowY: "auto",
    padding: "20px 14px 12px",
    display: "flex", flexDirection: "column", gap: 14,
  },
  msgRow: { display: "flex", alignItems: "flex-end", gap: 8, animation: "fadeUp .25s ease" },
  ariaAvatarSmall: { flexShrink: 0 },
  ariaBubble: {
    background: "var(--surface)", border: "1px solid rgba(200,166,255,0.1)",
    borderRadius: "18px 18px 18px 4px", padding: "11px 15px", maxWidth: "82%",
  },
  userBubble: {
    background: "rgba(200,166,255,0.13)", border: "1px solid rgba(200,166,255,0.22)",
    borderRadius: "18px 18px 4px 18px", padding: "11px 15px", maxWidth: "78%",
  },
  bubbleText: {
    margin: 0, fontSize: 15, lineHeight: 1.65,
    whiteSpace: "pre-wrap", wordBreak: "break-word",
    fontFamily: "var(--font-body)",
  },
  dot: {
    width: 7, height: 7, borderRadius: "50%",
    background: "var(--accent-purple)", display: "inline-block",
    animation: "blink 1.2s infinite",
  },
  endCard: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
    padding: "28px 24px", margin: "8px 0",
    background: "var(--surface)", borderRadius: "var(--radius)",
    border: "1px solid rgba(200,166,255,0.13)", textAlign: "center",
    animation: "fadeUp .4s ease",
  },
  endTitle: { margin: 0, fontSize: 16, fontWeight: 600, color: "var(--text)" },
  endSub:   { margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 },
  saving:   { textAlign: "center", fontSize: 12, color: "var(--muted)", animation: "pulse 1.2s infinite" },
  savingWrap: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
    padding: "20px 0", animation: "fadeUp .3s ease",
  },
  savingOrb: {
    width: 10, height: 10, borderRadius: "50%",
    background: "var(--accent-purple)",
    animation: "pulse 1.2s ease-in-out infinite",
  },

  humorCard: {
    margin: "0 12px 8px", background: "var(--surface)",
    border: "1px solid rgba(200,166,255,0.13)",
    borderRadius: "var(--radius-sm)", overflow: "hidden", flexShrink: 0,
  },
  humorToggle: {
    width: "100%", display: "flex", alignItems: "center",
    justifyContent: "space-between", padding: "10px 14px",
    background: "none", border: "none", cursor: "pointer",
  },
  humorToggleText: { fontSize: 13, color: "var(--accent-purple)", fontWeight: 500 },
  humorBody:    { padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 10 },
  humorSection: {},
  humorLabel:   { fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 },
  humorOptions: { display: "flex", gap: 6 },
  humorOpt:     { flex: 1, fontSize: 22, padding: "8px 4px", borderRadius: 10, cursor: "pointer", transition: "all .15s" },

  inputArea: {
    padding: "10px 12px",
    paddingBottom: "calc(10px + env(safe-area-inset-bottom))",
    background: "var(--surface)",
    borderTop: "1px solid rgba(200,166,255,0.1)",
    flexShrink: 0,
  },
  inputWrapper: {
    display: "flex", alignItems: "flex-end", gap: 8,
    background: "var(--bg)", borderRadius: 20,
    border: "1.5px solid", padding: "8px 8px 8px 14px",
    transition: "border-color 0.2s",
  },
  textarea: {
    flex: 1, background: "none", border: "none", outline: "none",
    resize: "none", fontSize: 15, lineHeight: 1.5,
    color: "var(--text)", fontFamily: "var(--font-body)",
    minHeight: 24, maxHeight: 120, overflowY: "auto", padding: 0,
  },
  btnSend: {
    width: 36, height: 36, borderRadius: "50%", border: "none",
    flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
    transition: "background 0.2s",
  },
  inputHint: {
    margin: "5px 0 0", fontSize: 10, color: "var(--muted)",
    textAlign: "center", letterSpacing: "0.04em",
  },
  btnPill: {
    padding: "12px 28px", borderRadius: 50, border: "none", cursor: "pointer",
    background: "linear-gradient(135deg, var(--accent-purple), var(--accent-pink))",
    color: "#0E0D14", fontSize: 14, fontWeight: 600,
    fontFamily: "var(--font-body)", transition: "opacity 0.2s",
  },

  // Modal de resumo
  modalOverlay: {
    position: "fixed", inset: 0,
    background: "rgba(14,13,20,0.6)",
    backdropFilter: "blur(4px)",
    zIndex: 30,
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    background: "var(--surface)",
    borderRadius: "var(--radius)",
    border: "1px solid rgba(200,166,255,0.15)",
    width: "100%", maxWidth: 420,
    overflow: "hidden",
    animation: "fadeUp .25s ease",
  },
  modalHeader: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px 12px",
    borderBottom: "1px solid rgba(200,166,255,0.1)",
  },
  modalClose: {
    background: "none", border: "none",
    color: "var(--muted)", fontSize: 22,
    cursor: "pointer", lineHeight: 1,
    padding: "0 4px",
  },
  modalBody: {
    padding: "20px",
  },
  modalLabel: {
    fontSize: 11, color: "var(--muted)",
    textTransform: "uppercase", letterSpacing: "0.08em",
    fontFamily: "var(--font-body)", marginBottom: 8,
  },
  modalText: {
    fontSize: 14, color: "var(--text)",
    lineHeight: 1.65, margin: 0,
    fontFamily: "var(--font-body)",
  },
  modalFooter: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24, paddingTop: 16,
    borderTop: "1px solid rgba(200,166,255,0.08)",
  },
};
