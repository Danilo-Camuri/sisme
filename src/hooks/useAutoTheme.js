// useAutoTheme.js
// Aplica tema claro (6h–18h) ou escuro (18h–6h) automaticamente.
// Verifica o horário a cada 60 segundos.
// Usa o atributo data-theme="dark" no document.documentElement.

import { useEffect } from 'react'

function getThemeForHour(hour) {
  // Claro: 6h até 17h59 | Escuro: 18h até 5h59
  return hour >= 6 && hour < 18 ? 'light' : 'dark'
}

function applyTheme(theme) {
  const root = document.documentElement
  if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark')
  } else {
    root.removeAttribute('data-theme')
  }
}

export function useAutoTheme() {
  useEffect(() => {
    // Aplica imediatamente na montagem
    const now = new Date()
    applyTheme(getThemeForHour(now.getHours()))

    // Verifica a cada 60 segundos
    const interval = setInterval(() => {
      const hora = new Date().getHours()
      applyTheme(getThemeForHour(hora))
    }, 60_000)

    return () => clearInterval(interval)
  }, [])
}

// Exporta também como utilitário standalone para uso fora de componentes
export { applyTheme, getThemeForHour }
