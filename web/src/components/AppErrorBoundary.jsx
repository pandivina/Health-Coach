// ─── components/AppErrorBoundary.jsx ─────────────────────────────────────────
// Captura cualquier crash de render en la app. En vez de pantalla en blanco,
// muestra un loader de "actualizando" y redirige al Home tras unos segundos.

import { Component } from 'react'

const REDIRECT_DELAY_MS = 2500 // tiempo mostrando el loader antes de volver al Home

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // Log para depurar luego en consola/analytics si se añade
    console.error('[AppErrorBoundary] Crash capturado:', error, info)
  }

  componentDidUpdate() {
    if (this.state.hasError) {
      this.timeoutId = setTimeout(() => {
        // Redirección dura — evita depender del router, que puede estar roto
        window.location.href = '/home'
      }, REDIRECT_DELAY_MS)
    }
  }

  componentWillUnmount() {
    clearTimeout(this.timeoutId)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999999,
          background: '#f8fafa', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg,#2EC4B6,#FF8FA3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, animation: 'pulseScale 1.4s ease-in-out infinite',
          }}>
            🐼
          </div>
          <p style={{ fontSize: 15, fontWeight: 800, color: '#1A2332', margin: 0 }}>
            Actualizando Pandi…
          </p>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>
            Te llevamos a Inicio en un momento
          </p>
          <style>{`
            @keyframes pulseScale {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.1); opacity: 0.8; }
            }
          `}</style>
        </div>
      )
    }
    return this.props.children
  }
}

export default AppErrorBoundary
