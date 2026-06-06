// ConformidadeLGPD.jsx — rota /lgpd (sem link público na nav)
// Documento técnico-regulatório para gestores e diretores de escolas parceiras
// Versão 1.0 · Junho de 2026

import LegalLayout, { BoxDestaque, BoxAtencao, BoxVerde, Tabela } from "./LegalLayout";

function H2({ children }) {
  return <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", margin: "40px 0 14px", letterSpacing: "-0.02em", paddingBottom: 10, borderBottom: "1.5px solid var(--border)" }}>{children}</h2>;
}
function H3({ children }) {
  return <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: "22px 0 8px" }}>{children}</h3>;
}
function P({ children }) {
  return <p style={{ fontSize: 15, color: "var(--text-2)", lineHeight: 1.75, margin: "0 0 16px" }}>{children}</p>;
}
function Li({ children }) {
  return <li style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.65, marginBottom: 5 }}>{children}</li>;
}

export default function ConformidadeLGPD() {
  return (
    <LegalLayout titulo="Documento de Adequação à LGPD" versao="Versão 1.0 · Uso interno e apresentação institucional">

      <BoxDestaque>
        Este documento foi elaborado para que gestores e diretores de escolas privadas possam avaliar a conformidade da plataforma ARIA com a LGPD (Lei 13.709/2018) antes da decisão de contratação. Não minimizamos riscos — descrevemos como cada risco é identificado e gerenciado. Transparência é a base de uma parceria responsável.
      </BoxDestaque>

      <H2>1. Base legal para o tratamento de dados</H2>
      <Tabela
        headers={["Categoria de dado", "Base legal", "Artigo LGPD", "Observação"]}
        rows={[
          ["Identificação do aluno", "Consentimento", "Art. 7º, I", "Obtido via TCLE assinado pelos responsáveis"],
          ["Dados de uso e navegação", "Consentimento + Legítimo interesse", "Art. 7º, I e IX", "Legítimo interesse cobre logs de segurança e autenticação"],
          ["Conteúdo das conversas", "Consentimento específico e destacado", "Art. 11, I", "Obtido separadamente no TCLE (Bloco C)"],
          ["Construtos emocionais (Método CÓRTEX™)", "Consentimento específico e destacado", "Art. 11, I", "Dado sensível de saúde — proteção reforçada"],
          ["Perfil longitudinal", "Consentimento específico e destacado", "Art. 11, I", "Dado sensível — requer autorização destacada no TCLE"],
          ["Protocolo de crise — alertas", "Tutela da saúde", "Art. 11, II, f", "Compartilhamento mínimo com orientador escolar"],
          ["Dados de menores (todos)", "Consentimento parental", "Art. 14 e §1º", "Princípio do melhor interesse do menor — TCLE obrigatório"],
        ]}
      />

      <H2>2. Dados sensíveis — enquadramento e proteção</H2>
      <P>A LGPD define como dados sensíveis aqueles relacionados à saúde (Art. 5º, II). Dados de saúde mental se enquadram nessa categoria. A ARIA trata as seguintes categorias como dados sensíveis:</P>
      <Tabela
        headers={["Tipo de dado sensível", "Por que é dado de saúde"]}
        rows={[
          ["Conteúdo das conversas", "Pode conter relatos de sofrimento emocional, conflitos e informações diretamente relacionadas à saúde mental"],
          ["Construtos CÓRTEX™", "São classificações do estado emocional em 6 eixos clínicos — equivalem a indicadores psicológicos"],
          ["Nível de sofrimento (escala 0–3)", "Avaliação do nível de angústia emocional com impacto direto no protocolo de crise"],
          ["Perfil longitudinal", "Consolida padrões emocionais ao longo do tempo — o dado de maior sensibilidade por revelar tendências persistentes"],
        ]}
      />
      <P>Para esses dados, a ARIA adota: consentimento específico e destacado no TCLE (Bloco C); acesso restrito apenas ao aluno e, em crise, ao orientador escolar designado; criptografia em trânsito e em repouso; Row Level Security no banco de dados.</P>

      <H2>3. Mapeamento de dados (RoPA simplificado)</H2>
      <Tabela
        headers={["Categoria", "Finalidade", "Base legal", "Retenção", "Quem acessa"]}
        rows={[
          ["Nome, e-mail, matrícula", "Identificação e acesso", "Art. 7º, I", "Até 30 dias após desligamento", "Aluno (próprios dados). Escola: apenas lista de matrículas"],
          ["Horários e frequência de acesso", "Notificações e personalização", "Art. 7º, I", "Até 30 dias após desligamento", "Somente o aluno. Escola: tendências agregadas por turma"],
          ["Conteúdo das conversas", "Apoio psicoemocional e memória longitudinal", "Art. 11, I", "Até 30 dias após desligamento", "Somente o aluno. Processadora de IA: processamento técnico em tempo real regido por DPA"],
          ["Construtos CÓRTEX™ + nível de sofrimento", "Monitoramento preventivo", "Art. 11, I e II,f", "Até 30 dias após desligamento", "Somente o aluno. Escola: tendências agregadas sem identificação individual"],
          ["Perfil longitudinal", "Personalização progressiva do suporte", "Art. 11, I", "Até 30 dias após desligamento", "Somente o aluno. Nenhum acesso externo"],
          ["Alertas de crise (Nível 2 e 3)", "Proteção à vida", "Art. 11, II, f", "Até 5 anos ou prazo legal", "Orientador escolar designado (nome + nível de risco apenas)"],
          ["Tendências por turma (agregadas)", "Painel institucional", "Art. 7º, IX", "Até encerramento do contrato", "Gestor e orientador. Dados completamente anonimizados"],
        ]}
      />

      <H2>4. Medidas técnicas de segurança</H2>
      <Tabela
        headers={["Medida", "Descrição técnica"]}
        rows={[
          ["Criptografia em trânsito", "Todo tráfego entre dispositivo e servidores criptografado via HTTPS/TLS"],
          ["Criptografia em repouso", "Dados armazenados criptografados. Acesso físico ao servidor não permite leitura sem a chave"],
          ["Row Level Security (RLS)", "Cada usuário só pode ler e gravar seus próprios registros. Impossível acessar dados de outro aluno"],
          ["Autenticação segura", "Código de escola + matrícula + senha. Suporte a 2FA. Credenciais armazenadas com hash criptográfico"],
          ["Dados no Brasil", "Infraestrutura de armazenamento em território nacional. Dados não replicados para servidores no exterior"],
          ["Logs de auditoria", "Registros de acesso privilegiado com timestamp, identificação do operador e operação realizada"],
          ["Atualizações de segurança", "Dependências e sistemas revisados periodicamente para eliminar vulnerabilidades conhecidas"],
        ]}
      />

      <H2>5. Medidas organizacionais</H2>
      <Tabela
        headers={["Medida", "Descrição"]}
        rows={[
          ["Acesso privilegiado restrito", "Apenas o responsável técnico (DPO) possui acesso privilegiado ao banco de dados"],
          ["DPA com processadora de IA (Anthropic)", "Opera sob Contrato de Processamento de Dados com cláusulas de confidencialidade e restrição de uso. Incorpora as Cláusulas-Padrão Contratuais (CPCs) da ANPD conforme Resolução CD/ANPD 19/2024"],
          ["Registro de atividades (RoPA)", "A ARIA mantém registro documentado de todas as atividades de tratamento de dados"],
          ["Política de mínimo de dados", "Apenas os dados estritamente necessários à finalidade declarada são coletados"],
          ["Documentação jurídica completa", "Política de Privacidade, Termos de Uso, TCLE Digital e este Documento de Adequação — todos em versão pública e acessível"],
        ]}
      />

      <H2>6. Direitos dos titulares</H2>
      <Tabela
        headers={["Direito", "O que significa", "Como exercer"]}
        rows={[
          ["Acesso (Art. 18, I)", "Receber cópia de todos os dados armazenados", "E-mail ao DPO. Prazo: 15 dias úteis"],
          ["Correção (Art. 18, III)", "Corrigir dados incorretos ou desatualizados", "E-mail ao DPO com indicação do dado"],
          ["Exclusão (Art. 18, VI)", "Apagar todos os dados — implica encerramento da conta", "E-mail ao DPO. Exclusão irreversível em até 15 dias"],
          ["Portabilidade (Art. 18, V)", "Receber os dados em formato JSON ou CSV", "E-mail ao DPO com especificação do formato"],
          ["Revogação do consentimento (Art. 8º, §5º)", "Retirar autorização do TCLE — não afeta dados já tratados licitamente", "E-mail ao DPO. Implica suspensão do acesso"],
          ["Oposição (Art. 18, IX)", "Opor-se a tratamentos específicos", "E-mail ao DPO com especificação do tratamento"],
          ["Revisão automatizada (Art. 20)", "Solicitar revisão humana de decisões automatizadas", "E-mail ao DPO (a ARIA não produz decisões disciplinares)"],
        ]}
      />
      <BoxDestaque>
        <strong>Canal de exercício de direitos</strong><br />
        E-mail do DPO: <a href="mailto:danilocamurilopes@gmail.com" style={{ color: "#4F8EF7" }}>danilocamurilopes@gmail.com</a> (provisório — será atualizado após aquisição do domínio institucional)<br />
        Prazo de resposta: até 15 dias úteis<br />
        Recurso externo: <a href="https://www.gov.br/anpd" target="_blank" rel="noreferrer" style={{ color: "#4F8EF7" }}>ANPD — www.gov.br/anpd</a>
      </BoxDestaque>

      <H2>7. Transferência internacional de dados</H2>
      <BoxAtencao>
        <strong>Contexto regulatório vigente.</strong> A Resolução CD/ANPD 19/2024 está em vigência obrigatória desde agosto de 2025. Os EUA não possuem Decisão de Adequação emitida pela ANPD. A transferência de dados para a Anthropic (EUA) exige as Cláusulas-Padrão Contratuais (CPCs) aprovadas pela ANPD.
      </BoxAtencao>
      <Tabela
        headers={["Aspecto", "Tratamento adotado pela ARIA"]}
        rows={[
          ["Mecanismo legal", "O DPA com a Anthropic incorpora as CPCs aprovadas pela ANPD pela Resolução CD/ANPD 19/2024"],
          ["Não armazenamento pelo processador", "A Anthropic processa conversas em tempo real para geração de respostas. O DPA proíbe armazenamento autônomo ou uso para treinar modelos"],
          ["Dado transmitido", "Somente o conteúdo da conversação ativa (sessão corrente). Sem dados de identificação do aluno"],
          ["Dado NÃO transmitido", "Perfil longitudinal, construtos históricos, nível de sofrimento acumulado, dados de identificação. Esses dados ficam no Brasil"],
          ["Consentimento", "O TCLE informa explicitamente ao responsável legal que o processamento das conversas ocorre via serviço de IA terceirizado com DPA e CPCs da ANPD"],
        ]}
      />

      <H2>8. Síntese do RIPD — Relatório de Impacto à Proteção de Dados</H2>
      <H3>Mapa de riscos e mitigações</H3>
      <Tabela
        headers={["Risco", "Probabilidade / Impacto", "Mitigação adotada"]}
        rows={[
          ["Acesso não autorizado a dados de saúde", "Baixa / Alto", "RLS por usuário, criptografia em repouso, acesso restrito ao DPO, logs de auditoria"],
          ["Uso indevido da IA em situação de crise", "Baixa / Alto", "Monitoramento em 4 níveis, alertas automáticos, CVV sempre disponível, revisão periódica dos protocolos"],
          ["Transferência internacional sem salvaguarda", "Mitigado / Alto", "DPA com Anthropic incorporando CPCs da ANPD (Resolução 19/2024)"],
          ["Consentimento inválido de menor", "Baixa / Alto", "TCLE em três zonas com Bloco C destacado para dados sensíveis. Acesso bloqueado sem consentimento registrado"],
          ["IA interpretada como diagnóstico", "Média / Médio", "Cláusula de não diagnóstico em todos os documentos e mensagens de contextualização na interface"],
          ["Acesso por menor de 15 anos", "Baixa / Médio", "Confirmação de matrícula pela escola, data de nascimento obrigatória no TCLE, acesso bloqueado sem código institucional"],
        ]}
      />

      <H2>9. Responsabilidades da escola como parceira</H2>
      <Tabela
        headers={["ARIA — Controladora dos dados", "Escola — Parceira institucional"]}
        rows={[
          ["Define as finalidades e os meios de tratamento dos dados", "Não define finalidades de tratamento — não é controladora conjunta dos dados individuais"],
          ["Coleta e armazena todos os dados dos alunos", "Confirma a matrícula dos alunos e fornece os códigos de acesso"],
          ["Garante o cumprimento dos direitos dos titulares", "Orienta pais e responsáveis sobre o canal de exercício de direitos (DPO da ARIA)"],
          ["Mantém sigilo do conteúdo das conversas", "Não acessa o conteúdo das conversas — a escola concorda com isso ao contratar"],
          ["Aciona o protocolo de crise e envia alertas ao orientador", "Designa o orientador que receberá os alertas e deve ter condições de agir"],
          ["Fornece painel com dados agregados e anonimizados", "Utiliza os dados agregados exclusivamente para gestão do bem-estar da turma"],
        ]}
      />
      <BoxVerde>
        <strong>O que a escola não precisa fazer:</strong>
        <ul style={{ margin: "10px 0 0", paddingLeft: 20 }}>
          <li style={{ marginBottom: 4 }}>A escola não precisa elaborar seu próprio RIPD para a ARIA</li>
          <li style={{ marginBottom: 4 }}>A escola não precisa ser signatária dos TCLEs individuais dos alunos</li>
          <li style={{ marginBottom: 4 }}>A escola não é responsabilizada por falhas de segurança na plataforma ARIA</li>
          <li>O contrato de parceria define expressamente essas delimitações de responsabilidade</li>
        </ul>
      </BoxVerde>

      <H2>10. Encarregado de Dados (DPO)</H2>
      <BoxDestaque>
        <strong>Danilo Camuri Teixeira Lopes</strong><br />
        Mestre em Psicologia · Especialista em TCC e Terapia do Esquema · CRP 21/02554<br />
        Responsável Técnico e Encarregado de Proteção de Dados<br />
        INSTITUTO CORTEX DE PSICOLOGIA LTDA · CNPJ 59.217.063/0001-47<br />
        E-mail: <a href="mailto:danilocamurilopes@gmail.com" style={{ color: "#4F8EF7" }}>danilocamurilopes@gmail.com</a><br />
        Prazo de resposta: até 15 dias úteis
      </BoxDestaque>
      <P>O DPO da ARIA é simultaneamente o responsável técnico com formação clínica em psicologia. As decisões sobre tratamento de dados de saúde mental de adolescentes são tomadas por profissional com compreensão clínica do impacto dessas informações, não apenas por uma perspectiva jurídica ou técnica.</P>

    </LegalLayout>
  );
}
