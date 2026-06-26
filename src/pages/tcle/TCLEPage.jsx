// src/pages/tcle/TCLEPage.jsx
// Página pública de assinatura do TCLE — acessível em /tcle/:codigoEscola
// Não exige login. Fluxo em 6 passos conforme spec jurídica aprovada.

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

// ─── Orb ──────────────────────────────────────────────────────
function ARIAOrb({ size = 40 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #4F8EF7, #2DB87D)',
      boxShadow: '0 0 32px rgba(79,142,247,0.28)',
    }} />
  );
}

// ─── Hash SHA-256 (Web Crypto API) ────────────────────────────
async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── Máscara CPF ──────────────────────────────────────────────
function maskCPF(v) {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
}

function validCPF(cpf) {
  const n = cpf.replace(/\D/g, '');
  return n.length === 11 && !/^(\d)\1+$/.test(n);
}

// ─── Texto completo do TCLE (renderizado na página) ───────────
const TCLE_TEXTO = `TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO — TCLE-ARIA-v1.0-junho2026

IDENTIFICAÇÃO DA PLATAFORMA
Plataforma: ARIA — Apoio Psicoemocional Digital para Adolescentes
Desenvolvida por: Instituto Córtex de Psicologia
Responsável técnico: Danilo Camuri Teixeira Lopes, Mestre em Psicologia, CRP 21/02554

1. O QUE É A ARIA

A ARIA é uma plataforma digital de apoio psicoemocional destinada a adolescentes do Ensino Médio de escolas privadas brasileiras. Utiliza inteligência artificial baseada em evidências clínicas para oferecer escuta ativa, acolhimento emocional e orientação preventiva. Está disponível 24 horas por dia, 7 dias por semana, diretamente pelo navegador do celular ou computador.

2. O QUE A ARIA NÃO É

A ARIA não é um serviço de saúde mental clínico. Não substitui psicólogo, psiquiatra, médico, terapeuta ou qualquer profissional de saúde. Não realiza diagnósticos. Não prescreve tratamentos. Não é uma linha de crise. Em situações de emergência, o adolescente deve ligar para o SAMU (192), CVV (188) ou ir ao pronto-socorro mais próximo.

3. COMO FUNCIONA

O adolescente acessa a plataforma, escolhe um tema (escola, família, amizades, futuro, saúde emocional) e conversa com a ARIA por texto. As conversas são processadas por um modelo de inteligência artificial com fundamentação em Terapia Cognitivo-Comportamental, Terapia do Esquema, ACT e Terapia Focada na Compaixão. A ARIA não tem memória entre sessões além do resumo estruturado gerado ao final de cada conversa.

4. DADOS COLETADOS E TRATAMENTO

4.1 Dados de identificação: nome, apelido, matrícula, e-mail e data de nascimento do adolescente. Base legal: execução de contrato (Art. 7º, V, LGPD).

4.2 Dados de uso: horários de acesso, porta de entrada escolhida, número de trocas por sessão. Base legal: legítimo interesse (Art. 7º, IX, LGPD).

4.3 Dados sensíveis de saúde: conteúdo das conversas e perfil emocional longitudinal gerado a partir delas. Base legal: consentimento específico e destacado do responsável legal (Art. 11, I, LGPD).

4.4 Dados de crise: alertas gerados em situações de risco identificadas pelo sistema. Base legal: proteção da vida (Art. 11, II, "e", LGPD). Retidos por até 5 anos por exigência do Conselho Federal de Psicologia.

5. CONFIDENCIALIDADE

O conteúdo das conversas é sigiloso. Os pais e responsáveis legais não têm acesso ao conteúdo das conversas. A escola não tem acesso ao conteúdo das conversas. O acesso é restrito à infraestrutura técnica operada pelo Instituto Córtex de Psicologia.

6. EXCEÇÃO: PROTOCOLO DE CRISE

Quando o sistema identifica sinais de risco à integridade física do adolescente (nível 3 no protocolo interno), um alerta estruturado é enviado ao orientador escolar responsável. O alerta não reproduz o conteúdo literal da conversa — contém apenas a identificação do aluno e o nível de urgência. Isso constitui a única situação em que a escola é notificada.

7. COMPARTILHAMENTO COM TERCEIROS

As conversas são processadas pelo serviço de inteligência artificial da Anthropic PBC (San Francisco, EUA), operado com contrato de confidencialidade e sem uso dos dados para treinamento de modelos. O armazenamento ocorre em servidores da Supabase localizados em São Paulo, Brasil.

8. DIREITOS DO TITULAR

O responsável legal pode, a qualquer momento: (a) solicitar acesso aos dados de identificação e uso do adolescente; (b) solicitar correção de dados incorretos; (c) revogar este consentimento por e-mail ao DPO (danilocamurilopes@gmail.com). A revogação implica bloqueio imediato do acesso à plataforma e início do processo de anonimização em 30 dias.

9. PRAZO DE RETENÇÃO

Dados de identificação e uso: enquanto a conta estiver ativa + 12 meses. Dados de crise: até 5 anos. Dados anonimizados para pesquisa: indeterminado.

10. CONTATO DO DPO

Encarregado de Proteção de Dados: Danilo Camuri Teixeira Lopes
E-mail: danilocamurilopes@gmail.com
Endereço: Teresina, Piauí, Brasil

Versão do documento: TCLE-ARIA-v1.0-junho2026`;

// ─── Checkbox item ────────────────────────────────────────────
function CheckItem({ checked, onChange, children, disabled = false }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'flex-start', gap: 12, cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1, padding: '6px 0',
    }}>
      <div
        onClick={disabled ? undefined : onChange}
        style={{
          width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 1,
          border: `2px solid ${checked ? '#4F8EF7' : '#ccc'}`,
          background: checked ? '#4F8EF7' : '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        {checked && (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <span style={{ fontSize: 14, color: '#18171C', lineHeight: 1.6 }}>{children}</span>
    </label>
  );
}

// ─── Bloco de aceite ──────────────────────────────────────────
function BlocoAceite({ titulo, items, checked, onChange, borderColor, bgColor, tituloColor, disabled = false }) {
  return (
    <div style={{
      border: `1.5px solid ${borderColor}`,
      background: bgColor,
      borderRadius: 16,
      padding: '20px 20px 16px',
      marginBottom: 16,
    }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: tituloColor, margin: '0 0 14px', letterSpacing: '0.01em' }}>
        {titulo}
      </p>
      {items.map((item, i) => (
        <CheckItem
          key={i}
          checked={checked[i]}
          onChange={() => onChange(i)}
          disabled={disabled}
        >
          {item}
        </CheckItem>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default function TCLEPage() {
  const { codigoEscola } = useParams();
  const [passo, setPasso] = useState(1); // 1=ident escola, 2=form, 3=doc, 4=blocos, 5=sucesso, 'erro'

  // Escola
  const [escola, setEscola] = useState(null);
  const [loadingEscola, setLoadingEscola] = useState(true);
  const [erroEscola, setErroEscola] = useState('');

  // Formulário
  const [nomeResp, setNomeResp] = useState('');
  const [cpf, setCpf] = useState('');
  const [matricula, setMatricula] = useState('');
  const [erroForm, setErroForm] = useState('');
  const [loadingForm, setLoadingForm] = useState(false);
  const [alunoEncontrado, setAlunoEncontrado] = useState(null);

  // Scroll do documento
  const docRef = useRef(null);
  const blocoRef = useRef(null);
  const [docLido, setDocLido] = useState(false);
  const [blocoCVisivel, setBlocoCVisivel] = useState(false);

  // Checkboxes
  const [blocA, setBlocA] = useState(Array(8).fill(false));
  const [blocB, setBlocB] = useState(Array(3).fill(false));
  const [blocC, setBlocC] = useState(Array(4).fill(false));

  // Submissão
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [erroSubmit, setErroSubmit] = useState('');
  const [nomeAluno, setNomeAluno] = useState('');

  // Forçar tema claro
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.getAttribute('data-theme');
    html.setAttribute('data-theme', 'light');
    return () => { if (prev) html.setAttribute('data-theme', prev); else html.removeAttribute('data-theme'); };
  }, []);

  // Buscar escola pelo código da URL
  useEffect(() => {
    async function buscarEscola() {
      if (!codigoEscola) { setErroEscola('Código de escola não informado.'); setLoadingEscola(false); return; }
      const { data, error } = await supabase
        .from('escolas')
        .select('id, nome, codigo')
        .eq('codigo', codigoEscola.toUpperCase())
        .single();
      if (error || !data) {
        setErroEscola('Código de escola não encontrado. Verifique o link recebido da escola.');
      } else {
        setEscola(data);
      }
      setLoadingEscola(false);
    }
    buscarEscola();
  }, [codigoEscola]);

  // Observer para scroll do documento
  useEffect(() => {
    if (passo !== 3) return;
    const el = docRef.current;
    if (!el) return;
    const fn = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
      if (atBottom) setDocLido(true);
    };
    el.addEventListener('scroll', fn);
    return () => el.removeEventListener('scroll', fn);
  }, [passo]);

  // Observer para Bloco C visível
  useEffect(() => {
    if (passo !== 4) return;
    const el = blocoRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setBlocoCVisivel(true); }, { threshold: 0.8 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [passo]);

  // Validar formulário
  async function handleForm(e) {
    e.preventDefault();
    setErroForm('');
    if (!nomeResp.trim()) { setErroForm('Informe o nome completo do responsável.'); return; }
    if (!validCPF(cpf)) { setErroForm('CPF inválido.'); return; }
    if (!matricula.trim()) { setErroForm('Informe a matrícula do aluno.'); return; }

    setLoadingForm(true);

    // Verificar matrícula na escola
    const { data: aluno } = await supabase
      .from('alunos')
      .select('id, nome, matricula, tcle_assinado, escola_id')
      .eq('matricula', matricula.trim().toUpperCase())
      .eq('escola_id', escola.id)
      .single();

    if (!aluno) {
      setErroForm('Essa matrícula não foi encontrada. Confere com a escola e tenta de novo.');
      setLoadingForm(false); return;
    }

    // Verificar se TCLE já está assinado
    const { data: tclePrev } = await supabase
      .from('tcle_registros')
      .select('id')
      .eq('aluno_matricula', matricula.trim().toUpperCase())
      .eq('escola_codigo', codigoEscola.toUpperCase())
      .eq('tcle_assinado', true)
      .eq('revogado', false)
      .single();

    if (tclePrev) {
      setErroForm('Esta matrícula já possui autorização registrada.');
      setLoadingForm(false); return;
    }

    setAlunoEncontrado(aluno);
    setNomeAluno(aluno.nome || 'o aluno');
    setLoadingForm(false);
    setPasso(3);
  }

  // Confirmar leitura do doc e ir para os blocos
  function handleDocLido() { setPasso(4); }

  // Toggle checkboxes
  const toggleA = (i) => setBlocA(p => { const n = [...p]; n[i] = !n[i]; return n; });
  const toggleB = (i) => setBlocB(p => { const n = [...p]; n[i] = !n[i]; return n; });
  const toggleC = (i) => { if (!blocoCVisivel) return; setBlocC(p => { const n = [...p]; n[i] = !n[i]; return n; }); };

  const todosAceitos = blocA.every(Boolean) && blocB.every(Boolean) && blocC.every(Boolean);

  // Submeter TCLE
  async function handleSubmit() {
    if (!todosAceitos) return;
    setLoadingSubmit(true);
    setErroSubmit('');

    try {
      const cpfHash = await sha256(cpf.replace(/\D/g, ''));
      const docHash = await sha256(TCLE_TEXTO);

      const res = await fetch('/.netlify/functions/tcle-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escola_codigo: codigoEscola.toUpperCase(),
          escola_id: escola.id,
          aluno_matricula: matricula.trim().toUpperCase(),
          aluno_id: alunoEncontrado.id,
          responsavel_nome: nomeResp.trim(),
          responsavel_cpf_hash: cpfHash,
          hash_documento: docHash,
          bloco_a_aceito: true,
          bloco_b_aceito: true,
          bloco_c_aceito: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setErroSubmit(data.error || 'Erro ao registrar. Tente novamente.');
      } else {
        setPasso(5);
      }
    } catch (err) {
      setErroSubmit('Erro de conexão. Verifique sua internet e tente novamente.');
    }
    setLoadingSubmit(false);
  }

  // ─── Estilos base ──────────────────────────────────────────
  const page = { minHeight: '100dvh', background: '#F5F4F1', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: '#18171C' };
  const header = { background: '#fff', borderBottom: '1px solid rgba(24,23,28,0.09)', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 10 };
  const container = { maxWidth: 600, margin: '0 auto', padding: '32px 20px 64px' };
  const card = { background: '#fff', borderRadius: 20, padding: '28px 24px', boxShadow: '0 1px 3px rgba(24,23,28,0.07)', border: '1px solid rgba(24,23,28,0.07)' };
  const inputStyle = { width: '100%', padding: '13px 16px', borderRadius: 12, border: '1.5px solid rgba(24,23,28,0.18)', fontSize: 15, background: '#fff', color: '#18171C', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' };
  const labelStyle = { fontSize: 13, fontWeight: 600, color: '#4A4858', marginBottom: 6, display: 'block' };
  const btnPrimary = (disabled) => ({
    width: '100%', padding: '15px 24px', borderRadius: 9999, border: 'none',
    background: disabled ? 'rgba(79,142,247,0.4)' : '#4F8EF7',
    color: '#fff', fontSize: 16, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    minHeight: 52, boxSizing: 'border-box', transition: 'background 0.15s',
  });

  // ─── RENDER ────────────────────────────────────────────────
  return (
    <div style={page}>
      {/* Header */}
      <div style={header}>
        <ARIAOrb size={28} />
        <span style={{ fontSize: 16, fontWeight: 700, color: '#18171C' }}>ARIA</span>
        <span style={{ fontSize: 13, color: '#9490A8', marginLeft: 4 }}>Autorização de uso</span>
      </div>

      <div style={container}>

        {/* Loading escola */}
        {loadingEscola && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <ARIAOrb size={48} style={{ margin: '0 auto 16px' }} />
            <p style={{ color: '#9490A8', fontSize: 14 }}>Verificando escola...</p>
          </div>
        )}

        {/* Erro escola */}
        {!loadingEscola && erroEscola && (
          <div style={{ ...card, textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ fontSize: 16, color: '#E05252', marginBottom: 8, fontWeight: 600 }}>Link inválido</p>
            <p style={{ fontSize: 14, color: '#4A4858' }}>{erroEscola}</p>
          </div>
        )}

        {/* Passo 1 — Info escola + intro */}
        {!loadingEscola && !erroEscola && passo === 1 && escola && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <ARIAOrb size={56} style={{ margin: '0 auto 16px' }} />
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                Autorização para uso da ARIA
              </h1>
              <p style={{ fontSize: 15, color: '#4A4858', lineHeight: 1.6, margin: 0 }}>
                Escola: <strong>{escola.nome}</strong>
              </p>
            </div>

            <div style={{ ...card, marginBottom: 16 }}>
              <p style={{ fontSize: 14, color: '#4A4858', lineHeight: 1.7, margin: '0 0 12px' }}>
                A ARIA é uma plataforma de apoio emocional para adolescentes, disponível 24h. Para que seu filho(a) possa criar uma conta, precisamos da sua autorização formal.
              </p>
              <p style={{ fontSize: 14, color: '#4A4858', lineHeight: 1.7, margin: 0 }}>
                Este processo leva cerca de <strong>5 minutos</strong> e exige a leitura do Termo de Consentimento completo.
              </p>
            </div>

            <button style={btnPrimary(false)} onClick={() => setPasso(2)}>
              Começar autorização
            </button>
          </div>
        )}

        {/* Passo 2 — Formulário de identificação */}
        {passo === 2 && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>Identificação</h2>
            <p style={{ fontSize: 14, color: '#4A4858', margin: '0 0 24px' }}>
              Preencha seus dados e a matrícula do aluno para continuar.
            </p>
            <div style={card}>
              <form onSubmit={handleForm}>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Seu nome completo</label>
                  <input
                    style={inputStyle}
                    value={nomeResp}
                    onChange={e => setNomeResp(e.target.value)}
                    placeholder="Nome completo do responsável"
                    autoComplete="name"
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Seu CPF</label>
                  <input
                    style={inputStyle}
                    value={cpf}
                    onChange={e => setCpf(maskCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    inputMode="numeric"
                    autoComplete="off"
                  />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>Matrícula do aluno</label>
                  <input
                    style={inputStyle}
                    value={matricula}
                    onChange={e => setMatricula(e.target.value)}
                    placeholder="Conforme informado pela escola"
                    autoCapitalize="characters"
                  />
                </div>
                {erroForm && (
                  <div style={{ background: 'rgba(224,82,82,0.08)', border: '1px solid rgba(224,82,82,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
                    <p style={{ color: '#E05252', fontSize: 13, margin: 0 }}>{erroForm}</p>
                  </div>
                )}
                <button type="submit" style={btnPrimary(loadingForm)} disabled={loadingForm}>
                  {loadingForm ? 'Verificando...' : 'Continuar'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Passo 3 — Documento completo */}
        {passo === 3 && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>Leia o Termo completo</h2>
            <p style={{ fontSize: 14, color: '#4A4858', margin: '0 0 16px' }}>
              Role até o final para liberar o próximo passo.
            </p>
            <div
              ref={docRef}
              style={{
                background: '#fff', borderRadius: 16, padding: '24px 20px',
                height: 420, overflowY: 'scroll',
                border: '1px solid rgba(24,23,28,0.09)',
                fontSize: 13, color: '#18171C', lineHeight: 1.8,
                whiteSpace: 'pre-wrap', marginBottom: 16,
              }}
            >
              {TCLE_TEXTO}
            </div>
            <button
              style={btnPrimary(!docLido)}
              disabled={!docLido}
              onClick={handleDocLido}
            >
              {docLido ? 'Li o Termo — continuar' : 'Role até o final para continuar'}
            </button>
          </div>
        )}

        {/* Passo 4 — Blocos de aceite */}
        {passo === 4 && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>Declaração de consentimento</h2>
            <p style={{ fontSize: 14, color: '#4A4858', margin: '0 0 20px', lineHeight: 1.6 }}>
              Marque todos os itens abaixo para concluir a autorização.
            </p>

            {/* Bloco A */}
            <BlocoAceite
              titulo="Declaro estar ciente de que:"
              borderColor="rgba(24,23,28,0.12)"
              bgColor="#FAFAF9"
              tituloColor="#18171C"
              items={[
                'li integralmente este Termo de Consentimento Livre e Esclarecido',
                'compreendi o que é a ARIA e o que ela não é',
                'a ARIA utiliza inteligência artificial, sem atendimento humano em tempo real',
                'a ARIA não substitui psicólogo, psiquiatra, médico ou serviço de emergência',
                'o conteúdo das conversas do adolescente é sigiloso e não terei acesso a ele',
                'em situações de risco à vida, a plataforma poderá acionar alerta ao orientador escolar',
                'o processamento das conversas ocorre via serviço de IA terceirizado com contrato de confidencialidade',
                'estou ciente dos Termos de Uso e da Política de Privacidade da ARIA',
              ]}
              checked={blocA}
              onChange={toggleA}
            />

            {/* Bloco B */}
            <BlocoAceite
              titulo="Autorizo expressamente (dados comuns):"
              borderColor="rgba(79,142,247,0.3)"
              bgColor="rgba(79,142,247,0.04)"
              tituloColor="#185FA5"
              items={[
                'o tratamento dos dados de identificação e uso da plataforma do adolescente identificado neste TCLE',
                'a utilização da plataforma ARIA pelo adolescente identificado neste documento',
                'o envio de notificações contextuais pela ARIA ao adolescente',
              ]}
              checked={blocB}
              onChange={toggleB}
            />

            {/* Bloco C — dados sensíveis */}
            <div ref={blocoRef}>
              <BlocoAceite
                titulo="AUTORIZAÇÃO ESPECÍFICA E DESTACADA PARA DADOS SENSÍVEIS DE SAÚDE (Art. 11, I da LGPD):"
                borderColor="#E05252"
                bgColor="rgba(224,82,82,0.06)"
                tituloColor="#E05252"
                items={[
                  'autorizo o tratamento do conteúdo das conversas do adolescente, classificado como dado sensível de saúde',
                  'autorizo a geração e o armazenamento do perfil emocional longitudinal do adolescente',
                  'autorizo o monitoramento preventivo de sofrimento emocional e o acionamento do protocolo de crise quando necessário',
                  'autorizo o envio de alertas ao orientador escolar exclusivamente em situações de risco à integridade física do adolescente',
                ]}
                checked={blocC}
                onChange={toggleC}
                disabled={!blocoCVisivel}
              />
              {!blocoCVisivel && (
                <p style={{ fontSize: 12, color: '#9490A8', textAlign: 'center', marginTop: -8, marginBottom: 16 }}>
                  Role até aqui para liberar os itens acima
                </p>
              )}
            </div>

            {erroSubmit && (
              <div style={{ background: 'rgba(224,82,82,0.08)', border: '1px solid rgba(224,82,82,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
                <p style={{ color: '#E05252', fontSize: 13, margin: 0 }}>{erroSubmit}</p>
              </div>
            )}

            <button
              style={btnPrimary(!todosAceitos || loadingSubmit)}
              disabled={!todosAceitos || loadingSubmit}
              onClick={handleSubmit}
            >
              {loadingSubmit ? 'Registrando autorização...' : 'Confirmar Autorização'}
            </button>

            <p style={{ fontSize: 12, color: '#9490A8', textAlign: 'center', marginTop: 12, lineHeight: 1.6 }}>
              Ao confirmar, seus dados serão registrados com hash SHA-256 e timestamp de aceite conforme exigência da LGPD.
            </p>
          </div>
        )}

        {/* Passo 5 — Sucesso */}
        {passo === 5 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(45,184,125,0.12)', border: '2px solid #2DB87D',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2DB87D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 10px', color: '#18171C' }}>
              Autorização registrada.
            </h2>
            <p style={{ fontSize: 15, color: '#4A4858', lineHeight: 1.7, margin: '0 0 24px', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
              <strong>{nomeAluno}</strong> já pode criar a conta na ARIA. Compartilhe o link da plataforma com ele(a): <strong>sisme2.netlify.app/cadastro</strong>
            </p>
            <p style={{ fontSize: 13, color: '#9490A8', lineHeight: 1.6 }}>
              O registro foi feito com timestamp e hash do documento para fins de auditoria LGPD. Para revogar esta autorização a qualquer momento, entre em contato pelo e-mail danilocamurilopes@gmail.com.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
