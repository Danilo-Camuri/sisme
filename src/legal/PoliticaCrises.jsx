// PoliticaCrises.jsx — rota /protecao-a-vida
// Versão 1.0 · Junho de 2026

import LegalLayout, { BoxDestaque, BoxAtencao, BoxVerde, Tabela, NivelRisco } from "./LegalLayout";

function H2({ children }) {
  return <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", margin: "40px 0 14px", letterSpacing: "-0.02em", paddingBottom: 10, borderBottom: "1.5px solid var(--border)" }}>{children}</h2>;
}
function P({ children }) {
  return <p style={{ fontSize: 15, color: "var(--text-2)", lineHeight: 1.75, margin: "0 0 16px" }}>{children}</p>;
}

export default function PoliticaCrises() {
  return (
    <LegalLayout titulo="Política de Resposta a Crises e Proteção à Vida" versao="Versão 1.0">

      <BoxDestaque>
        Este documento descreve como a ARIA identifica, classifica e responde a situações de sofrimento emocional intenso ou risco à integridade física dos adolescentes usuários. Destina-se a pais, responsáveis legais, orientadores escolares e gestores que precisam compreender exatamente o que acontece — e o que não acontece — quando a plataforma identifica um sinal de risco.
      </BoxDestaque>

      <H2>1. Apresentação</H2>
      <P>A ARIA reconhece que parte das interações pode envolver sofrimento emocional significativo ou risco à integridade física. Embora não seja serviço de saúde, a plataforma foi desenhada com protocolos clínicos estruturados para identificar, registrar e encaminhar essas situações com responsabilidade.</P>

      <H2>2. Princípios orientadores</H2>
      <Tabela
        headers={["Princípio", "Aplicação prática"]}
        rows={[
          ["Proteção da vida", "A preservação da vida prevalece sobre o sigilo. Em risco iminente, a ARIA compartilha informações mínimas com o orientador escolar e orienta o aluno a acionar emergência"],
          ["Melhor interesse", "Toda decisão do protocolo prioriza o bem-estar e a segurança do adolescente"],
          ["Proporcionalidade", "A resposta é calibrada ao nível de risco. Não há alarmes generalizados"],
          ["Confidencialidade", "As conversas permanecem sigilosas em todos os níveis. O compartilhamento ocorre somente nos Níveis 2 e 3, limitado ao mínimo necessário"],
          ["Transparência", "O aluno é informado em tempo real quando um alerta é enviado. Nenhuma notificação acontece às suas costas"],
          ["Não abandono", "A ARIA não encerra a conversa após identificar risco. Permanece presente e acolhedora"],
        ]}
      />

      <H2>3. Limites de atuação</H2>
      <Tabela
        headers={["A ARIA É e FAZ", "A ARIA NÃO É e NÃO FAZ"]}
        rows={[
          ["Plataforma de apoio psicoemocional preventivo", "Serviço de emergência, hospital ou clínica"],
          ["Identifica sinais compatíveis com risco emocional", "Realiza diagnóstico clínico nem avaliação psicológica formal"],
          ["Aciona protocolo de crise e notifica o orientador escolar", "Contata pais, SAMU ou Bombeiros diretamente — isso cabe à escola e ao aluno"],
          ["Informa o aluno quando um alerta é enviado ao orientador", "Compartilha o conteúdo das conversas com nenhuma parte, em nenhum nível"],
        ]}
      />

      <H2>4. Os quatro níveis de risco e as respostas do protocolo</H2>
      <P>A ARIA monitora continuamente o nível de sofrimento emocional. A classificação é automática, baseada em critérios estruturados, e possui finalidade exclusivamente preventiva. Não constitui diagnóstico clínico.</P>

      <NivelRisco
        nivel={0}
        label="Sofrimento cotidiano"
        cor="#2DB87D"
        bgCor="rgba(45,184,125,0.07)"
        sinais={[
          "Ansiedade relacionada a provas e deadlines",
          "Conflitos com colegas ou familiares de baixa intensidade",
          "Frustrações amorosas e dificuldades escolares comuns",
          "Preocupações cotidianas sem padrão de cronificação",
        ]}
        acoes={[
          "Acolhimento emocional, escuta ativa e apoio reflexivo",
          "Sugestões de organização emocional e microações práticas",
        ]}
        extra="Nenhum alerta é gerado. O sigilo é integral."
      />

      <NivelRisco
        nivel={1}
        label="Sofrimento significativo"
        cor="#F0A030"
        bgCor="rgba(240,160,48,0.07)"
        sinais={[
          "Sentimentos persistentes de tristeza ou vazio",
          "Isolamento social progressivo",
          "Desesperança leve, sem pensamentos de autolesão",
          "Sofrimento emocional recorrente ao longo de múltiplas sessões",
        ]}
        acoes={[
          "Aprofundamento da escuta e validação emocional",
          "Incentivo à busca de apoio junto a adulto de confiança",
          "Reforço de estratégias de autocuidado e rotina",
          "Registro interno do padrão no perfil longitudinal",
        ]}
        extra="Nenhum alerta institucional é gerado. O sigilo é integral."
      />

      <NivelRisco
        nivel={2}
        label="Risco moderado"
        cor="#E05252"
        bgCor="rgba(224,82,82,0.07)"
        sinais={[
          "Relatos recorrentes relacionados à morte ou ao desejo de sumir",
          "Histórico de automutilação sem caráter imediato",
          "Sofrimento emocional intenso e persistente, sem melhora entre sessões",
        ]}
        acoes={[
          "Acolhimento especializado dentro dos limites da plataforma",
          "Recomendação para busca de apoio profissional presencial",
          "Disponibilização do CVV (188) e outros canais de apoio",
          "Geração automática de alerta ao orientador escolar designado",
          "Informação ao aluno em tempo real de que o alerta foi enviado",
        ]}
        extra="Base legal: Art. 11, II, f da LGPD (tutela da saúde). Informações compartilhadas: nome, escola, turma, nível de risco, data e hora. Sem conteúdo das conversas."
      />

      <NivelRisco
        nivel={3}
        label="Risco iminente à vida"
        cor="#C0392B"
        bgCor="rgba(192,57,43,0.09)"
        sinais={[
          "Ideação suicida ativa com ou sem plano estruturado",
          "Automutilação em curso ou recém realizada",
          "Ameaça imediata à integridade física própria ou de terceiro",
          "Relato de plano com meio e intenção definidos",
        ]}
        acoes={[
          "Interrupção do fluxo convencional da conversa",
          "Orientação direta e urgente para acionar o CVV (188) imediatamente",
          "Disponibilização de todos os canais de emergência",
          "Geração automática de alerta urgente ao orientador escolar",
          "Informação ao aluno em tempo real de que o alerta foi enviado",
          "Permanência da plataforma presente — a conversa não é encerrada",
        ]}
        extra="Base legal: Art. 7º, VII da LGPD + Resoluções do CFP. Informações compartilhadas: nome, escola, turma, nível de risco, data e hora. Sem conteúdo das conversas."
      />

      <H2>5. Fluxo do protocolo</H2>
      <Tabela
        headers={["Nível", "Situação", "Alerta ao orientador", "Aluno é informado?", "Base legal"]}
        rows={[
          ["0", "Sofrimento cotidiano", "Não", "N/A", "N/A"],
          ["1", "Sofrimento significativo", "Não", "N/A", "N/A"],
          ["2", "Risco moderado", "Sim — automático", "Sim — tempo real", "Art. 11, II, f"],
          ["3", "Risco iminente à vida", "Sim — URGENTE", "Sim — tempo real", "Art. 7º, VII + CFP"],
        ]}
      />

      <H2>6. Informações compartilhadas nos alertas</H2>
      <Tabela
        headers={["O alerta CONTÉM", "O alerta NÃO contém"]}
        rows={[
          ["Nome completo do aluno", "Conteúdo integral ou parcial das conversas"],
          ["Escola e turma", "Reflexões, relatos ou confidências do aluno"],
          ["Nível de risco identificado (2 ou 3)", "Diagnóstico ou interpretação clínica"],
          ["Data e hora do evento", "Histórico de sessões anteriores"],
          ["Recomendação de acompanhamento imediato", "Informações familiares ou relacionais do aluno"],
        ]}
      />

      <H2>7. Canais de emergência</H2>
      <BoxAtencao>
        <strong>A ARIA não é serviço de emergência.</strong> Em situações de risco imediato à vida, o aluno deve buscar ajuda presencial imediatamente.
      </BoxAtencao>
      <Tabela
        headers={["Canal", "Quando acionar"]}
        rows={[
          ["CVV — 188 (24h, gratuito)", "Sempre que o adolescente precisar conversar sobre sofrimento emocional intenso ou ideação suicida"],
          ["SAMU — 192", "Situações de risco médico imediato, automutilação com sequências físicas"],
          ["Bombeiros — 193", "Emergências com risco à vida que demandem resgate"],
          ["Polícia Militar — 190", "Situações de risco envolvendo violência ou ameaça de terceiros"],
        ]}
      />

      <H2>8. Responsabilidades de cada parte</H2>
      <Tabela
        headers={["Parte", "Responsabilidades", "O que está fora do seu escopo"]}
        rows={[
          ["ARIA", "Identificar sinais de risco · Acionar protocolo · Notificar orientador · Informar aluno · Disponibilizar canais de emergência · Registrar o incidente · Permanecer presente", "Garantir que a escola atue · Contatar pais ou SAMU · Realizar qualquer ação presencial"],
          ["Escola", "Designar o orientador que receberá os alertas · Garantir que o orientador possa agir · Adotar medidas institucionais adequadas", "Acessar o conteúdo das conversas · Usar alertas para fins disciplinares"],
          ["Pais e responsáveis", "Manter diálogo aberto com o adolescente · Buscar apoio profissional quando recomendado", "Exigir acesso ao conteúdo das conversas — esse direito não existe neste produto"],
          ["Orientador escolar", "Receber e avaliar os alertas · Agir conforme juízo profissional · Contatar pais quando necessário", "Interpretar o alerta como diagnóstico · Encaminhar o alerta para terceiros não autorizados"],
        ]}
      />

      <H2>9. Limitações do protocolo</H2>
      <BoxAviso>
        O protocolo de crise é baseado em IA e critérios probabilísticos. Como qualquer sistema de triagem, possui limitações que precisam ser conhecidas.
      </BoxAviso>
      <Tabela
        headers={["Limitação", "O que isso significa na prática"]}
        rows={[
          ["Falsos positivos", "A plataforma pode identificar risco onde não há. O aluno pode estar usando linguagem figurada ou expressão intensa sem intenção de autolesão. O orientador deve avaliar com discernimento"],
          ["Falsos negativos", "A plataforma pode não identificar risco onde ele existe. Adolescentes que omitem informações ou usam linguagem codificada podem não acionar o protocolo"],
          ["Recusa do aluno", "Se o adolescente recusar o acionamento de emergência, a ARIA não pode forçar nenhuma ação. Permanece presente e transfere a responsabilidade de ação presencial à escola"],
          ["Classificação não é diagnóstico", "Os níveis de risco são classificações operacionais, não clínicas. Não representam previsão de comportamento futuro"],
          ["Ação presencial depende da escola", "A ARIA esgota o que pode fazer de forma remota. A ação presencial que pode salvar uma vida depende da escola ter um orientador pronto para agir"],
        ]}
      />

      <H2>10. Pré-requisitos operacionais da escola</H2>
      <BoxVerde>
        <strong>O que a escola precisa ter pronto antes de ativar a ARIA para os alunos:</strong>
        <ul style={{ margin: "12px 0 0", paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>Designar formalmente o orientador escolar que receberá os alertas de crise</li>
          <li style={{ marginBottom: 6 }}>Garantir que esse orientador tenha e-mail institucional monitorado</li>
          <li style={{ marginBottom: 6 }}>Definir protocolo interno para agir quando o alerta chegar</li>
          <li style={{ marginBottom: 6 }}>Ter clareza de que alertas de Nível 3 exigem ação imediata, não agendamento</li>
        </ul>
      </BoxVerde>

      <H2>11. Legislação aplicável</H2>
      <ul style={{ paddingLeft: 20 }}>
        {[
          "Constituição Federal — Art. 227 (proteção integral da criança e do adolescente)",
          "ECA (Lei 8.069/1990)",
          "LGPD (Lei 13.709/2018) — Art. 7º VII e Art. 11, II, f",
          "Marco Civil da Internet (Lei 12.965/2014)",
          "Resoluções do CFP sobre sigilo profissional em situações de risco de vida",
          "Código de Ética Profissional do Psicólogo",
        ].map((item, i) => (
          <li key={i} style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.65, marginBottom: 5 }}>{item}</li>
        ))}
      </ul>

    </LegalLayout>
  );
}

// Componente BoxAviso inline pra não precisar de import extra
function BoxAviso({ children }) {
  return (
    <div style={{
      background: "rgba(240,160,48,0.08)", border: "1.5px solid rgba(240,160,48,0.25)",
      borderRadius: 14, padding: "20px 24px", marginBottom: 24, fontSize: 14, lineHeight: 1.7, color: "var(--text)",
    }}>
      {children}
    </div>
  );
}
