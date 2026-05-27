// HomeAluno.jsx
// Orquestra o fluxo: PortasEntrada → AriaChat
// O aluno vê as portas primeiro, escolhe, e entra no chat com contexto injetado.

import { useState } from "react";
import PortasEntrada from "./PortasEntrada";
import AriaChat from "./AriaChat";

export default function HomeAluno() {
  const [portaEscolhida, setPortaEscolhida] = useState(null);

  if (!portaEscolhida) {
    return <PortasEntrada onEntrar={(porta) => setPortaEscolhida(porta)} />;
  }

  return (
    <AriaChat
      portaEntrada={portaEscolhida}
      onNovaConversa={() => setPortaEscolhida(null)}
    />
  );
}
