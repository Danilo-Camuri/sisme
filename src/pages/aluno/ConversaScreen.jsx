import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { getTinaSystemPrompt, getLeoSystemPrompt, getSummaryPrompt } from "./systemPrompts";

// ─── Constantes ────────────────────────────────────────────────────────────────
const MAX_TROCAS = 20;
const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 600;
const MAX_HISTORICO_RESUMOS = 3;

// ─── Utilitários ───────────────────────────────────────────────────────────────
function detectCrisisLevel(text) {
  const t = text.toLowerCase();

  // Nível 3 — ideação suicida / autolesão explícita
  const nivel3 = [
    "quero me matar", "vou me matar", "me machucar", "acabar com tudo",
    "não quero mais viver", "me suicidar", "tirar minha vida",
    "não quero mais existir", "melhor morrer",
  ];
  if (nivel3.some((p) => t.includes(p))) return 3;

  // Nível 2 — ideação passiva / desaparecimento
  const nivel2 = [
    "se eu sumisse", "se eu não existisse", "ninguém notaria",
    "não vejo sentido em continuar", "pra quê continuar",
    "tanto faz se eu estiver aqui", "desaparecer pra sempre",
    "não aguentar mais", "simplesmente parar tudo",
  ];
  if (nivel2.some((p) => t.includes(p))) return 2;

  // Nível 1 — sofrimento intenso / sinais de alerta
  const nivel1 = [
    "não tô nada", "vazio", "não sinto nada", "tanto faz",
    "ninguém me entende", "não tenho ninguém", "completamente sozinho",
    "não vejo sentido", "não consigo mais", "tô no limite",
    "cansado de tudo", "não aguento mais", "colapso",
  ];
  if (nivel1.some((p) => t.includes(p))) return 1;

  return 0;
}

// ─── Componente Principal ──────────────────────────────────────────────────────
export default function ConversaScreen({ onBack }) {
  const [aluno, setAluno] = useState(null);
  const [personagem, setPersonagem] = useState("tina");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [trocas, setTrocas] = useState(0);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [crisisLevel, setCrisisLevel] = useState(0);
  const [savingSession, setSavingSession] = useState(false);
  const [previousSummaries, setPreviousSummaries] = useState([]);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // Scroll automático
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Ajustar altura do textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  // Carregar dados do aluno e iniciar sessão
  useEffect(() => {
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setError("Sessão expirada. Faça login novamente."); return; }

        const { data: alunoData, error: alunoError } = await supabase
          .from("alunos")
          .select("id, nome, personagem")
          .eq("usuario_id", user.id)
          .single();

        if (alunoError || !alunoData) { setError("Não foi possível carregar seus dados."); return; }

        setAluno(alunoData);
        const p = alunoData.personagem || "tina";
        setPersonagem(p);

        // Buscar últimos 3 resumos de sessões anteriores
        const { data: conversasData } = await supabase
          .from("conversas")
          .select("resumo_temas, criado_em")
          .eq("aluno_id", alunoData.id)
          .order("criado_em", { ascending: false })
          .limit(MAX_HISTORICO_RESUMOS);

        const resumos = conversasData
          ? conversasData
              .filter((c) => c.resumo_temas?.resumo_narrativo)
              .map((c) => c.resumo_temas.resumo_narrativo)
          : [];

        setPreviousSummaries(resumos);

        // Montar system prompt
        const sp = p === "tina"
          ? getTinaSystemPrompt(alunoData.nome, resumos)
          : getLeoSystemPrompt(alunoData.nome, resumos);
        setSystemPrompt(sp);

        // Mensagem de abertura
        const nomeExibido = alunoData.nome?.split(" ")[0] || "";
        const aberturas = {
          tina: resumos.length > 0
            ? `Oi${nomeExibido ? ", " + nomeExibido : ""}. Que bom te ver por aqui de novo. Como você tá?`
            : `Oi${nomeExibido ? ", " + nomeExibido : ""}. Que bom ter você aqui. Como você tá hoje?`,
          leo: resumos.length > 0
            ? `Oi${nomeExibido ? ", " + nomeExibido : ""}. Voltou. Como tá sendo essa semana?`
            : `Oi${nomeExibido ? ", " + nomeExibido : ""}. Pode falar o que tiver na cabeça. O que tá acontecendo?`,
        };

        setMessages([{ role: "assistant", content: aberturas[p] }]);
      } catch (e) {
        setError("Erro ao iniciar a conversa. Tente novamente.");
      } finally {
        setInitializing(false);
      }
    }
    init();
  }, []);

  // Salvar resumo ao encerrar sessão
  const saveSessionSummary = useCallback(async (finalMessages, nivel) => {
    if (!aluno || finalMessages.length < 2) return;
    setSavingSession(true);
    try {
      // Pedir resumo à API — sem transcrição bruta, apenas temas
      const conversaParaResumo = finalMessages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch("/.netlify/functions/anthropic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 500,
          system: getSummaryPrompt(personagem),
          messages: conversaParaResumo,
        }),
      });

      if (!response.ok) throw new Error("Falha ao gerar resumo");

      const data = await response.json();
      const rawText = data.content?.map((b) => b.text || "").join("") || "";

      let resumoTemas = null;
      try {
        const clean = rawText.replace(/```json|```/g, "").trim();
        resumoTemas = JSON.parse(clean);
      } catch {
        resumoTemas = { resumo_narrativo: rawText.slice(0, 500), nivel_crise_detectado: nivel };
      }

      // Salvar APENAS o resumo — sem transcrição bruta
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("conversas").insert({
        aluno_id: aluno.id,
        usuario_id: user.id,
        personagem,
        resumo_temas: resumoTemas,
        nivel_crise_maximo: nivel,
        trocas_realizadas: trocas,
        criado_em: new Date().toISOString(),
      });

      // Gerar alerta se crise Nível 2 ou 3
      if (nivel >= 2) {
        await supabase.from("alertas").insert({
          aluno_id: aluno.id,
          nivel: nivel,
          descricao: `Sessão com ${personagem === "tina" ? "Tina" : "Léo"} detectou sinais de crise Nível ${nivel}.`,
          resumo: resumoTemas?.resumo_narrativo || "",
          criado_em: new Date().toISOString(),
          lido: false,
        });
      }
    } catch (e) {
      console.error("Erro ao salvar resumo:", e);
    } finally {
      setSavingSession(false);
    }
  }, [aluno, personagem, trocas]);

  // Enviar mensagem
  async function sendMessage() {
    if (!input.trim() || loading || sessionEnded) return;

    const userMessage = input.trim();
    setInput("");

    // Detectar nível de crise na fala do aluno
    const msgCrisis = detectCrisisLevel(userMessage);
    const newCrisisLevel = Math.max(crisisLevel, msgCrisis);
    setCrisisLevel(newCrisisLevel);

    const newMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    const newTrocas = trocas + 1;
    setTrocas(newTrocas);

    try {
      // Montar mensagens para a API (sem mensagem de sistema inline)
      const apiMessages = newMessages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role, content: m.content }));

      let finalSystemPrompt = systemPrompt;

      // Injetar instrução de crise no system prompt se necessário
      if (newCrisisLevel === 3) {
        finalSystemPrompt += "\n\nATENÇÃO IMEDIATA: O adolescente apresentou sinais de crise Nível 3. Use EXATAMENTE a fala de Nível 3 do seu personagem. Após isso, encerre a sessão com cuidado.";
      } else if (newCrisisLevel === 2) {
        finalSystemPrompt += "\n\nATENÇÃO: Sinais de Nível 2 detectados. Valide profundamente. Ofereça conexão com a psicóloga escolar usando a fala de Nível 2 do seu personagem.";
      } else if (newCrisisLevel === 1) {
        finalSystemPrompt += "\n\nMONITORAMENTO: Sinais de Nível 1 detectados. Desacelere, valide intensamente, fique mais tempo no acolhimento antes de avançar.";
      }

      // Adicionar contexto de encerramento se chegou no limite
      const isLastExchange = newTrocas >= MAX_TROCAS;
      if (isLastExchange) {
        finalSystemPrompt += "\n\nENCERRAMENTO: Esta é a última troca da sessão. Encerre a conversa de forma natural e acolhedora usando uma das suas falas de encerramento de sessão adequada ao tom da conversa.";
      }

      const response = await fetch("/.netlify/functions/anthropic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: finalSystemPrompt,
          messages: apiMessages,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || "Erro na API");
      }

      const data = await response.json();
      const assistantText = data.content?.map((b) => b.text || "").join("") || "";

      // Detectar crise também na resposta do personagem (para monitoramento)
      const responseCrisis = detectCrisisLevel(assistantText);
      const finalCrisisLevel = Math.max(newCrisisLevel, responseCrisis);
      if (finalCrisisLevel > newCrisisLevel) setCrisisLevel(finalCrisisLevel);

      const updatedMessages = [...newMessages, { role: "assistant", content: assistantText }];
      setMessages(updatedMessages);

      // Encerrar sessão
      if (isLastExchange || finalCrisisLevel === 3) {
        setSessionEnded(true);
        await saveSessionSummary(updatedMessages, finalCrisisLevel);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: personagem === "tina"
            ? "Desculpa, tive um problema técnico agora. Pode tentar de novo?"
            : "Deu um erro técnico aqui. Tenta de novo.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // Handle Enter
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  const isTina = personagem === "tina";
  const accentColor = isTina ? "#C084FC" : "#60A5FA";
  const accentGlow = isTina ? "rgba(192,132,252,0.15)" : "rgba(96,165,250,0.15)";
  const avatarEmoji = isTina ? "🌸" : "🌊";
  const personagemNome = isTina ? "Tina" : "Léo";

  if (initializing) {
    return (
      <div style={styles.loadingScreen}>
        <div style={{ ...styles.loadingDot, background: accentColor }} />
        <p style={styles.loadingText}>Carregando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorScreen}>
        <p style={styles.errorText}>{error}</p>
        <button style={styles.backBtn} onClick={onBack}>Voltar</button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={{ ...styles.header, borderBottomColor: accentGlow }}>
        <button style={styles.backButton} onClick={onBack} aria-label="Voltar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M5 12l7 7M5 12l7-7" />
          </svg>
        </button>

        <div style={styles.headerCenter}>
          <div style={{ ...styles.avatar, background: accentGlow, border: `1.5px solid ${accentColor}` }}>
            <span style={styles.avatarEmoji}>{avatarEmoji}</span>
          </div>
          <div>
            <p style={{ ...styles.headerName, color: accentColor }}>{personagemNome}</p>
            <p style={styles.headerSub}>
              {sessionEnded ? "sessão encerrada" : `${MAX_TROCAS - trocas} trocas restantes`}
            </p>
          </div>
        </div>

        <div style={styles.headerRight}>
          {crisisLevel >= 2 && (
            <div style={styles.crisisIndicator} title={`Nível de atenção ${crisisLevel}`}>
              <span style={{ fontSize: 16 }}>⚠️</span>
            </div>
          )}
        </div>
      </div>

      {/* Barra de progresso */}
      <div style={styles.progressBar}>
        <div
          style={{
            ...styles.progressFill,
            width: `${(trocas / MAX_TROCAS) * 100}%`,
            background: trocas >= MAX_TROCAS - 3 ? "#F87171" : accentColor,
          }}
        />
      </div>

      {/* Mensagens */}
      <div style={styles.messagesArea}>
        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            msg={msg}
            isUser={msg.role === "user"}
            accentColor={accentColor}
            accentGlow={accentGlow}
            avatarEmoji={avatarEmoji}
          />
        ))}

        {loading && (
          <div style={styles.typingRow}>
            <div style={{ ...styles.typingAvatar, background: accentGlow }}>
              <span style={{ fontSize: 14 }}>{avatarEmoji}</span>
            </div>
            <div style={{ ...styles.typingBubble, borderColor: accentGlow }}>
              <span style={{ ...styles.typingDot, animationDelay: "0ms", background: accentColor }} />
              <span style={{ ...styles.typingDot, animationDelay: "200ms", background: accentColor }} />
              <span style={{ ...styles.typingDot, animationDelay: "400ms", background: accentColor }} />
            </div>
          </div>
        )}

        {sessionEnded && !savingSession && (
          <div style={styles.sessionEndCard}>
            <span style={{ fontSize: 24 }}>✦</span>
            <p style={styles.sessionEndTitle}>Sessão encerrada</p>
            <p style={styles.sessionEndSub}>
              Obrigado por conversar hoje. Quando quiser voltar, é só abrir o app.
            </p>
            <button
              style={{ ...styles.sessionEndBtn, background: accentColor }}
              onClick={onBack}
            >
              Voltar ao início
            </button>
          </div>
        )}

        {savingSession && (
          <div style={styles.savingCard}>
            <div style={{ ...styles.savingDot, background: accentColor }} />
            <p style={styles.savingText}>Encerrando sessão...</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!sessionEnded && (
        <div style={styles.inputArea}>
          <div style={{ ...styles.inputWrapper, borderColor: input.trim() ? accentColor : "rgba(255,255,255,0.08)" }}>
            <textarea
              ref={textareaRef}
              style={styles.textarea}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escreva aqui..."
              rows={1}
              disabled={loading || sessionEnded}
              aria-label="Mensagem"
            />
            <button
              style={{
                ...styles.sendBtn,
                background: input.trim() && !loading ? accentColor : "rgba(255,255,255,0.06)",
                cursor: input.trim() && !loading ? "pointer" : "default",
              }}
              onClick={sendMessage}
              disabled={!input.trim() || loading || sessionEnded}
              aria-label="Enviar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={input.trim() && !loading ? "#0a0a0f" : "rgba(255,255,255,0.3)"} strokeWidth="2.5">
                <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
          <p style={styles.inputHint}>Enter para enviar · Shift+Enter para nova linha</p>
        </div>
      )}

      <style>{`
        @keyframes blink {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        textarea::placeholder { color: rgba(255,255,255,0.2); }
        textarea:focus { outline: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>
    </div>
  );
}

// ─── Bubble de mensagem ────────────────────────────────────────────────────────
function MessageBubble({ msg, isUser, accentColor, accentGlow, avatarEmoji }) {
  return (
    <div
      style={{
        ...styles.messageRow,
        justifyContent: isUser ? "flex-end" : "flex-start",
        animation: "fadeSlideUp 0.25s ease",
      }}
    >
      {!isUser && (
        <div style={{ ...styles.msgAvatar, background: accentGlow }}>
          <span style={{ fontSize: 14 }}>{avatarEmoji}</span>
        </div>
      )}
      <div
        style={{
          ...styles.bubble,
          background: isUser ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
          borderColor: isUser ? "rgba(255,255,255,0.12)" : accentGlow,
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          maxWidth: isUser ? "78%" : "84%",
          alignSelf: isUser ? "flex-end" : "flex-start",
        }}
      >
        <p style={styles.bubbleText}>{msg.content}</p>
      </div>
    </div>
  );
}

// ─── Estilos ───────────────────────────────────────────────────────────────────
const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100dvh",
    background: "#0a0a0f",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    color: "#e8e8f0",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px 12px",
    borderBottom: "1px solid",
    background: "rgba(10,10,15,0.95)",
    backdropFilter: "blur(10px)",
    flexShrink: 0,
    zIndex: 10,
  },
  backButton: {
    background: "none",
    border: "none",
    color: "rgba(255,255,255,0.5)",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    minWidth: 32,
  },
  headerCenter: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flex: 1,
    justifyContent: "center",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: { fontSize: 18 },
  headerName: {
    fontSize: 15,
    fontWeight: "600",
    margin: 0,
    lineHeight: 1.2,
    letterSpacing: "0.02em",
  },
  headerSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.3)",
    margin: 0,
    fontFamily: "system-ui, sans-serif",
    letterSpacing: "0.04em",
  },
  headerRight: {
    minWidth: 32,
    display: "flex",
    justifyContent: "flex-end",
  },
  crisisIndicator: {
    display: "flex",
    alignItems: "center",
  },
  progressBar: {
    height: 2,
    background: "rgba(255,255,255,0.05)",
    flexShrink: 0,
  },
  progressFill: {
    height: "100%",
    transition: "width 0.5s ease, background 0.3s ease",
    borderRadius: 1,
  },
  messagesArea: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 16px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  messageRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: 8,
  },
  msgAvatar: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bubble: {
    padding: "11px 14px",
    border: "1px solid",
    lineHeight: 1.6,
  },
  bubbleText: {
    margin: 0,
    fontSize: 15,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  typingRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: 8,
    animation: "fadeSlideUp 0.2s ease",
  },
  typingAvatar: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  typingBubble: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "14px 16px",
    borderRadius: "18px 18px 18px 4px",
    border: "1px solid",
    background: "rgba(255,255,255,0.04)",
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    display: "inline-block",
    animation: "blink 1.2s infinite",
  },
  sessionEndCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    padding: "28px 24px",
    margin: "8px 0",
    background: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.07)",
    textAlign: "center",
    animation: "fadeSlideUp 0.4s ease",
  },
  sessionEndTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
    letterSpacing: "0.02em",
  },
  sessionEndSub: {
    margin: 0,
    fontSize: 13,
    color: "rgba(255,255,255,0.4)",
    fontFamily: "system-ui, sans-serif",
    lineHeight: 1.5,
  },
  sessionEndBtn: {
    marginTop: 6,
    padding: "10px 24px",
    border: "none",
    borderRadius: 50,
    color: "#0a0a0f",
    fontSize: 14,
    fontWeight: "700",
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
    letterSpacing: "0.03em",
  },
  savingCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "12px",
    animation: "fadeSlideUp 0.3s ease",
  },
  savingDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    animation: "pulse 1.2s infinite",
  },
  savingText: {
    margin: 0,
    fontSize: 12,
    color: "rgba(255,255,255,0.3)",
    fontFamily: "system-ui, sans-serif",
  },
  inputArea: {
    padding: "12px 16px 20px",
    flexShrink: 0,
    background: "rgba(10,10,15,0.97)",
    backdropFilter: "blur(10px)",
  },
  inputWrapper: {
    display: "flex",
    alignItems: "flex-end",
    gap: 10,
    background: "rgba(255,255,255,0.04)",
    borderRadius: 20,
    border: "1.5px solid",
    padding: "10px 10px 10px 16px",
    transition: "border-color 0.2s ease",
  },
  textarea: {
    flex: 1,
    background: "none",
    border: "none",
    color: "#e8e8f0",
    fontSize: 15,
    lineHeight: 1.5,
    resize: "none",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    padding: 0,
    minHeight: 24,
    maxHeight: 120,
    overflowY: "auto",
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "background 0.2s ease",
  },
  inputHint: {
    margin: "6px 0 0",
    fontSize: 10,
    color: "rgba(255,255,255,0.15)",
    textAlign: "center",
    fontFamily: "system-ui, sans-serif",
    letterSpacing: "0.04em",
  },
  loadingScreen: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100dvh",
    background: "#0a0a0f",
    gap: 12,
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    animation: "pulse 1.2s infinite",
  },
  loadingText: {
    margin: 0,
    fontSize: 13,
    color: "rgba(255,255,255,0.3)",
    fontFamily: "system-ui, sans-serif",
  },
  errorScreen: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100dvh",
    background: "#0a0a0f",
    gap: 16,
    padding: 24,
  },
  errorText: {
    margin: 0,
    fontSize: 14,
    color: "#F87171",
    textAlign: "center",
    fontFamily: "system-ui, sans-serif",
  },
  backBtn: {
    padding: "10px 24px",
    background: "rgba(255,255,255,0.08)",
    border: "none",
    borderRadius: 50,
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
  },
};
