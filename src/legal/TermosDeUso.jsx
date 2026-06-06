// TermosDeUso.jsx — rota /termos
// Versão 1.0 · Junho de 2026

import LegalLayout, { BoxDestaque, BoxAtencao } from "./LegalLayout";

function H2({ children }) {
  return <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", margin: "40px 0 14px", letterSpacing: "-0.02em", paddingBottom: 10, borderBottom: "1.5px solid var(--border)" }}>{children}</h2>;
}
function P({ children }) {
  return <p style={{ fontSize: 15, color: "var(--text-2)", lineHeight: 1.75, margin: "0 0 16px" }}>{children}</p>;
}
function Li({ children }) {
  return <li style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.65, marginBottom: 5 }}>{children}</li>;
}

export default function TermosDeUso() {
  return (
    <LegalLayout titulo="Termos de Uso" versao="Versão 1.0">

      <BoxDestaque>
        Estes Termos de Uso regulam o acesso e a utilização da plataforma ARIA por alunos, pais ou responsáveis legais e escolas parceiras. Ao acessar ou utilizar a plataforma, o usuário, seus pais ou responsáveis legais e a instituição de ensino parceira declaram ter lido, compreendido e concordado com estes Termos e com a Política de Privacidade.
      </BoxDestaque>

      <H2>1. O que é a ARIA</H2>
      <P>A ARIA é uma plataforma digital de apoio psicoemocional para adolescentes regularmente matriculados no Ensino Médio de escolas privadas brasileiras, operada pelo INSTITUTO CORTEX DE PSICOLOGIA LTDA (CNPJ 59.217.063/0001-47), sob responsabilidade técnica do psicólogo Danilo Camuri Teixeira Lopes, CRP 21/02554.</P>
      <P>Por meio de inteligência artificial e metodologias da psicologia baseada em evidências, a ARIA oferece: acolhimento e escuta estruturada; apoio reflexivo e organização emocional; incentivo ao autoconhecimento; e suporte para questões relacionadas à vida escolar, familiar, social e ao planejamento de futuro.</P>

      <H2>2. O que a ARIA não é</H2>
      <P>A ARIA não constitui serviço de psicoterapia, atendimento psicológico, atendimento psiquiátrico, serviço médico ou serviço de emergência. A ARIA não:</P>
      <ul>
        <Li>realiza diagnóstico clínico</Li>
        <Li>emite laudos, pareceres ou atestados</Li>
        <Li>realiza avaliação psicológica formal</Li>
        <Li>prescreve medicamentos</Li>
        <Li>substitui psicólogos, psiquiatras ou médicos</Li>
        <Li>substitui serviços de emergência ou atendimento presencial especializado</Li>
      </ul>

      <H2>3. Quem pode usar a plataforma</H2>
      <P>O acesso à ARIA é restrito a estudantes regularmente matriculados em escolas parceiras, com idade entre 15 e 18 anos, cadastrados mediante código válido fornecido pela escola e com autorização formal dos pais ou responsáveis via TCLE. O acesso por menores de 15 anos é expressamente vedado.</P>

      <H2>4. Consentimento dos pais e responsáveis legais</H2>
      <P>O uso da ARIA depende da autorização prévia dos pais ou responsáveis legais, nos termos do Art. 14 da LGPD e do ECA. O TCLE integra estes Termos de Uso para todos os fins legais. Sem consentimento válido, o acesso não será autorizado.</P>

      <H2>5. Uso de inteligência artificial e transparência</H2>
      <P>Ao utilizar a plataforma, o usuário reconhece que:</P>
      <ul>
        <Li>está interagindo com uma inteligência artificial, não com um profissional humano</Li>
        <Li>as respostas são produzidas por modelos computacionais treinados especificamente para este serviço</Li>
        <Li>não existe acompanhamento humano individual em tempo real durante cada interação</Li>
        <Li>as respostas podem apresentar limitações inerentes à tecnologia</Li>
        <Li>nenhuma resposta deve ser interpretada como diagnóstico, parecer ou recomendação médica</Li>
      </ul>

      <H2>6. Responsabilidades da ARIA</H2>
      <P>Dentro do escopo deste serviço, a ARIA compromete-se a manter a plataforma disponível com esforços razoáveis, oferecer apoio psicoemocional baseado em métodos científicos validados, manter e acionar o protocolo de crise, preservar a confidencialidade das interações e adotar medidas técnicas adequadas à proteção dos dados.</P>
      <P>A ARIA não garante resultados clínicos, melhora de condições de saúde mental, resolução de conflitos ou desempenho acadêmico específico.</P>

      <H2>7. Responsabilidades do usuário</H2>
      <P>Ao utilizar a ARIA, o usuário compromete-se a:</P>
      <ul>
        <Li>utilizar a plataforma de forma ética e para fins estritamente pessoais</Li>
        <Li>fornecer informações verdadeiras durante as interações</Li>
        <Li>manter suas credenciais protegidas e não compartilhá-las com terceiros</Li>
        <Li>não ceder ou transferir sua conta</Li>
        <Li>não utilizar as respostas da ARIA como base exclusiva para decisões de saúde</Li>
        <Li>respeitar a legislação brasileira em todas as interações</Li>
      </ul>

      <H2>8. Condutas proibidas</H2>
      <P>É vedado ao usuário:</P>
      <ul>
        <Li>compartilhar credenciais de acesso ou utilizar contas de terceiros</Li>
        <Li>tentar manipular ou induzir comportamentos inadequados no sistema de IA</Li>
        <Li>realizar engenharia reversa ou análise não autorizada da plataforma</Li>
        <Li>utilizar sistemas automatizados para extração de dados (scraping)</Li>
        <Li>solicitar conteúdo sexual, ofensivo ou ilegal</Li>
        <Li>utilizar a plataforma para fins comerciais ou de pesquisa não autorizada</Li>
      </ul>
      <P>A violação de qualquer item acima poderá resultar em suspensão imediata do acesso.</P>

      <H2>9. Protocolo de crise e proteção à vida</H2>
      <P>A ARIA monitora continuamente sinais de sofrimento emocional intenso ou risco à integridade física. Quando identificados indícios relevantes de risco, a plataforma pode apresentar orientações emergenciais, recomendar contato com serviços especializados, disponibilizar o CVV (188) e gerar alertas para o orientador escolar com informações limitadas ao nome do usuário e nível de risco, sem reproduzir o conteúdo das conversas.</P>
      <P>O usuário será informado em tempo real quando um alerta de crise for enviado ao orientador escolar.</P>

      <H2>10. Situações de emergência</H2>
      <BoxAtencao>
        <strong>A ARIA não é um serviço de emergência.</strong> Em situações de risco imediato à vida, ligue imediatamente para os serviços competentes:
        <ul style={{ margin: "12px 0 0", paddingLeft: 20 }}>
          <li style={{ marginBottom: 4 }}>CVV: <strong>188</strong> (24 horas, gratuito)</li>
          <li style={{ marginBottom: 4 }}>SAMU: <strong>192</strong></li>
          <li style={{ marginBottom: 4 }}>Bombeiros: <strong>193</strong></li>
          <li>Polícia Militar: <strong>190</strong></li>
        </ul>
      </BoxAtencao>

      <H2>11. Confidencialidade das conversas</H2>
      <P>O conteúdo das conversas não é disponibilizado a pais, responsáveis, professores, coordenadores, direção escolar, outros alunos ou terceiros. A escola recebe exclusivamente alertas de crise (com informações mínimas) e informações estatísticas agregadas sem identificação individual.</P>

      <H2>12. Segurança da informação</H2>
      <P>A ARIA adota criptografia em trânsito e em repouso, controle de acesso seguro, Row Level Security (RLS) no banco de dados, monitoramento de segurança e atualizações periódicas. Incidentes de segurança serão comunicados à ANPD e aos titulares afetados conforme a legislação.</P>

      <H2>13. Não realização de decisões automatizadas relevantes</H2>
      <P>A ARIA não realiza decisões automatizadas com efeitos acadêmicos, disciplinares, administrativos ou jurídicos sobre os usuários. Quaisquer classificações internas têm finalidade exclusivamente operacional e preventiva, não produzindo efeitos jurídicos ou disciplinares.</P>

      <H2>14. Limitação de responsabilidade</H2>
      <P>Dentro dos limites da legislação brasileira, o INSTITUTO CORTEX DE PSICOLOGIA LTDA não será responsabilizado por danos decorrentes do uso fora do escopo destes Termos, interpretações indevidas das respostas da IA, decisões de saúde tomadas exclusivamente com base nas respostas da ARIA, informações falsas fornecidas pelo usuário, ou interrupções de serviço por eventos fora do controle razoável da plataforma.</P>
      <P>Esta limitação não afasta direitos garantidos pelo Código de Defesa do Consumidor (Lei 8.078/1990).</P>

      <H2>15. Propriedade intelectual</H2>
      <P>Pertencem exclusivamente ao INSTITUTO CORTEX DE PSICOLOGIA LTDA todos os direitos sobre a ARIA, incluindo a marca, o Método CÓRTEX™, a arquitetura conversacional, os protocolos clínicos, os algoritmos, a identidade visual e os conteúdos da plataforma. É vedada qualquer reprodução ou exploração sem autorização prévia e expressa do titular.</P>

      <H2>18. Alterações destes Termos</H2>
      <P>Para alterações substanciais que afetem direitos dos usuários, será concedido aviso prévio de pelo menos 15 dias, por e-mail e por aviso na plataforma. O uso continuado após o prazo implica aceite das alterações.</P>

      <H2>20. Legislação aplicável</H2>
      <ul>
        <Li>Código de Defesa do Consumidor (Lei 8.078/1990)</Li>
        <Li>LGPD (Lei 13.709/2018)</Li>
        <Li>Marco Civil da Internet (Lei 12.965/2014)</Li>
        <Li>ECA (Lei 8.069/1990)</Li>
      </ul>
      <P>Foro: Comarca de Teresina, Estado do Piauí, com preferência para resolução amigável prévia.</P>

      <H2>22. Contato</H2>
      <BoxDestaque>
        <strong>Danilo Camuri Teixeira Lopes</strong> · Responsável Técnico e DPO · CRP 21/02554<br />
        INSTITUTO CORTEX DE PSICOLOGIA LTDA · CNPJ 59.217.063/0001-47<br />
        E-mail: <a href="mailto:danilocamurilopes@gmail.com" style={{ color: "#4F8EF7" }}>danilocamurilopes@gmail.com</a><br />
        Prazo de resposta: até 15 dias úteis
      </BoxDestaque>

    </LegalLayout>
  );
}
