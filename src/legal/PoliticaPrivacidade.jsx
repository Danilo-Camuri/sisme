// PoliticaPrivacidade.jsx — rota /privacidade
// Versão 1.1 · Junho de 2026

import LegalLayout, { BoxDestaque, BoxAtencao, Tabela } from "./LegalLayout";

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

export default function PoliticaPrivacidade() {
  return (
    <LegalLayout titulo="Política de Privacidade" versao="Versão 1.1">

      <BoxDestaque>
        Este documento foi escrito para ser lido, não apenas para existir. Se você é pai, mãe, adolescente ou gestor escolar, escrevemos pensando em você. Usamos linguagem simples porque acreditamos que transparência real não precisa de juridiqês. Aqui você vai encontrar respostas honestas sobre o que fazemos com os dados da ARIA, por quê e com quem.
      </BoxDestaque>

      <H2>1. Quem somos</H2>
      <P>A ARIA é uma plataforma digital de apoio psicoemocional desenvolvida para adolescentes do Ensino Médio de escolas privadas brasileiras. É desenvolvida e operada pelo INSTITUTO CORTEX DE PSICOLOGIA LTDA, sob responsabilidade técnica do psicólogo Danilo Camuri Teixeira Lopes (CRP 21/02554), Mestre em Psicologia, especialista em TCC e Terapia do Esquema.</P>
      <P><strong>Controlador dos Dados Pessoais:</strong> INSTITUTO CORTEX DE PSICOLOGIA LTDA, CNPJ 59.217.063/0001-47, Teresina/PI.</P>
      <P><strong>DPO:</strong> Danilo Camuri Teixeira Lopes, CRP 21/02554.</P>
      <P><strong>Infraestrutura:</strong> dados armazenados em território brasileiro. Nenhum dado pessoal é transferido para servidores no exterior para fins de armazenamento.</P>

      <H2>2. A quem esta política se aplica</H2>
      <ul>
        <Li>Alunos do Ensino Médio que utilizam a plataforma (15 a 18 anos)</Li>
        <Li>Responsáveis legais que autorizam o uso via TCLE digital</Li>
        <Li>Orientadores educacionais e psicólogos escolares que acessam o painel de monitoramento</Li>
        <Li>Gestores e diretores das escolas contratantes</Li>
      </ul>

      <H2>3. Dados que coletamos</H2>
      <P>A ARIA coleta apenas os dados estritamente necessários. Nada é coletado por curiosidade ou conveniência.</P>
      <H3>3.1 Dados de identificação</H3>
      <ul>
        <Li>Nome completo e apelido preferido</Li>
        <Li>Endereço de e-mail e número de matrícula escolar</Li>
        <Li>Código da escola, turno, série e turma</Li>
      </ul>
      <H3>3.2 Dados de uso e comportamento</H3>
      <ul>
        <Li>Horários de acesso, porta de entrada escolhida por sessão</Li>
        <Li>Frequência e regularidade das sessões</Li>
      </ul>
      <H3>3.3 Dados gerados nas conversas</H3>
      <ul>
        <Li>Conteúdo integral das conversas com a ARIA</Li>
        <Li>Construto emocional predominante identificado (os 6 eixos do Método CÓRTEX™)</Li>
        <Li>Nível de sofrimento identificado ao fim de cada sessão (escala 0 a 3)</Li>
        <Li>Resumo automático de cada sessão e ponto de retomada sugerido</Li>
        <Li>Perfil longitudinal consolidado a partir da terceira sessão</Li>
      </ul>
      <BoxAtencao>
        <strong>Dado sensível — atenção redobrada.</strong> As informações geradas durante as conversas são classificadas como dados sensíveis de saúde, nos termos do Art. 11 da LGPD. Esses dados recebem proteção técnica e jurídica reforçada.
      </BoxAtencao>

      <H2>4. Como usamos os dados</H2>
      <H3>4.1 Personalização</H3>
      <P>A ARIA usa seu nome preferido, histórico de sessões e perfil longitudinal para iniciar conversas contextualizadas.</P>
      <H3>4.2 Memória longitudinal</H3>
      <P>Os resumos de sessão e padrões identificados são armazenados para que a ARIA possa acompanhar a evolução do aluno e oferecer suporte cada vez mais preciso.</P>
      <H3>4.3 Monitoramento preventivo de crises</H3>
      <P>A cada conversa, a ARIA avalia continuamente o nível de sofrimento. Quando identificados sinais de risco, o sistema aciona protocolos de segurança.</P>
      <H3>4.4 Relatórios institucionais agregados</H3>
      <P>A escola recebe painéis com dados agregados por turma. Esses dados nunca identificam alunos individualmente.</P>

      <H2>5. Uso de Inteligência Artificial</H2>
      <P>A ARIA utiliza IA para processar informações e gerar respostas personalizadas. A inteligência artificial da ARIA:</P>
      <ul>
        <Li>não realiza diagnósticos clínicos</Li>
        <Li>não substitui psicólogos, psiquiatras ou médicos</Li>
        <Li>não emite laudos ou pareceres</Li>
        <Li>não prescreve medicamentos</Li>
        <Li>não produz decisões com efeitos acadêmicos, jurídicos ou disciplinares</Li>
      </ul>

      <H2>7. Quem tem acesso aos dados</H2>
      <Tabela
        headers={["Tipo de dado", "Aluno", "Orientador escolar", "Direção / Gestão", "Processadora de IA"]}
        rows={[
          ["Conteúdo das conversas", "Acesso total (só os seus)", "Sem acesso", "Sem acesso", "Processamento técnico apenas*"],
          ["Alertas de crise (Nível 2–3)", "Não visível", "Recebe alertas individuais", "Sem acesso individual", "Sem acesso"],
          ["Tendências por turma (agregadas)", "Sem acesso", "Acesso completo", "Acesso ao painel institucional", "Sem acesso"],
          ["Dados de identificação", "Acesso total (só os seus)", "Somente nome e turma via alerta", "Lista de matrículas cadastradas", "Sem acesso"],
          ["Perfil longitudinal", "Acesso total (só o seu)", "Sem acesso ao conteúdo", "Sem acesso", "Sem acesso"],
        ]}
      />
      <P>*A processadora de IA processa conversas em tempo real regida por DPA com obrigações de confidencialidade e restrições de uso.</P>

      <H2>8. Quem não tem acesso</H2>
      <ul>
        <Li><strong>Pais e responsáveis</strong> não têm acesso ao conteúdo das conversas do adolescente.</Li>
        <Li><strong>A escola</strong> não tem acesso ao conteúdo das conversas, apenas a alertas de crise e tendências agregadas sem identificação individual.</Li>
        <Li><strong>Anunciantes e parceiros comerciais</strong> nunca têm acesso a dados individuais dos alunos. A ARIA não vende dados. Nunca.</Li>
      </ul>

      <H2>9. Base legal para o tratamento</H2>
      <H3>Para dados comuns</H3>
      <ul>
        <Li>Consentimento do titular (Art. 7º, I da LGPD)</Li>
        <Li>Consentimento dos pais via TCLE digital</Li>
        <Li>Legítimo interesse para segurança e autenticação (Art. 7º, IX)</Li>
      </ul>
      <H3>Para dados sensíveis de saúde</H3>
      <ul>
        <Li>Consentimento específico e destacado (Art. 11, I da LGPD)</Li>
        <Li>Tutela da saúde para o protocolo de crise (Art. 11, II, f)</Li>
      </ul>
      <H3>Para dados de menores</H3>
      <ul>
        <Li>Consentimento parental obrigatório (Art. 14 da LGPD)</Li>
        <Li>Não coletamos dados de menores de 15 anos</Li>
      </ul>

      <H2>10. Situações de exceção</H2>
      <P>A regra é a confidencialidade. Mas em risco iminente à vida (Nível 3), a ARIA gera alerta automático para o orientador escolar com nome, horário e nível de risco, sem reproduzir o conteúdo da conversa. O aluno é informado em tempo real. Isso está alinhado com o Art. 7º, VII da LGPD e as Resoluções do CFP sobre sigilo em situações de risco.</P>
      <P>Em caso de ordem judicial formal, os dados solicitados serão fornecidos nos limites da determinação legal (Marco Civil da Internet, Art. 10, §1º).</P>

      <H2>11. Por quanto tempo guardamos os dados</H2>
      <ul>
        <Li><strong>Durante o uso ativo:</strong> dados mantidos integralmente.</Li>
        <Li><strong>Quando o aluno sai da escola:</strong> dados anonimizados em até 30 dias, salvo solicitação de exclusão total ou pendência de protocolo de crise.</Li>
        <Li><strong>Quando o contrato da escola é encerrado:</strong> dados anonimizados ou excluídos em até 60 dias.</Li>
        <Li><strong>Alertas de crise:</strong> mantidos por até 5 anos, conforme normas do CFP.</Li>
      </ul>

      <H2>12. Seus direitos</H2>
      <ul>
        <Li><strong>Acesso:</strong> cópia de todos os dados armazenados</Li>
        <Li><strong>Correção:</strong> atualização de dados incorretos</Li>
        <Li><strong>Exclusão:</strong> apagamento completo e irreversível dos dados</Li>
        <Li><strong>Portabilidade:</strong> dados em formato JSON ou CSV</Li>
        <Li><strong>Revogação do consentimento:</strong> a qualquer momento</Li>
        <Li><strong>Oposição:</strong> a tratamentos específicos</Li>
        <Li><strong>Revisão de decisões automatizadas:</strong> solicitação de revisão humana</Li>
      </ul>
      <P>Envie um e-mail ao DPO: <a href="mailto:danilocamurilopes@gmail.com" style={{ color: "#4F8EF7" }}>danilocamurilopes@gmail.com</a>. Prazo de resposta: até 15 dias úteis.</P>

      <H2>13. Como protegemos seus dados</H2>
      <ul>
        <Li>Criptografia em trânsito (HTTPS/TLS) e em repouso</Li>
        <Li>Row Level Security (RLS): cada aluno acessa apenas seus próprios dados</Li>
        <Li>Autenticação segura com código da escola, matrícula e senha</Li>
        <Li>Dados armazenados no Brasil</Li>
        <Li>Acesso privilegiado restrito ao responsável técnico com log de auditoria</Li>
      </ul>

      <H2>14. Encarregado de Dados (DPO)</H2>
      <BoxDestaque>
        <strong>Danilo Camuri Teixeira Lopes</strong><br />
        Responsável Técnico e DPO · CRP 21/02554<br />
        INSTITUTO CORTEX DE PSICOLOGIA LTDA · CNPJ 59.217.063/0001-47<br />
        E-mail: <a href="mailto:danilocamurilopes@gmail.com" style={{ color: "#4F8EF7" }}>danilocamurilopes@gmail.com</a><br />
        Prazo de resposta: até 15 dias úteis
      </BoxDestaque>
      <P>Você também pode registrar reclamações na ANPD: <a href="https://www.gov.br/anpd" style={{ color: "#4F8EF7" }} target="_blank" rel="noreferrer">www.gov.br/anpd</a></P>

      <H2>15. Cookies</H2>
      <P>A ARIA usa cookies apenas para finalidades técnicas essenciais: manter a sessão autenticada, preferências de tema e funcionamento do PWA. Não usamos cookies de rastreamento, analytics com identificação individual ou pixels de publicidade.</P>

      <H2>16. Alterações nesta política</H2>
      <P>Notificaremos com pelo menos 15 dias de antecedência, por e-mail e por aviso na plataforma. Para alterações que envolvam dados sensíveis, coletaremos novo consentimento.</P>

      <H2>17. Legislação aplicável</H2>
      <ul>
        <Li>LGPD (Lei 13.709/2018)</Li>
        <Li>Marco Civil da Internet (Lei 12.965/2014)</Li>
        <Li>ECA (Lei 8.069/1990)</Li>
        <Li>Resoluções do CFP sobre sigilo profissional e ética em tecnologia</Li>
        <Li>Diretrizes da ANPD</Li>
      </ul>
      <P>Foro: Comarca de Teresina, Estado do Piauí, com preferência para resolução amigável prévia.</P>

    </LegalLayout>
  );
}
