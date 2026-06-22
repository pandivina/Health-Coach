import { Component } from 'react'

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('[AppErrorBoundary]', error, info)
  }

  componentDidUpdate() {
    if (!this.state.hasError) return

    // Contar intentos para evitar bucle infinito
    const key = 'pandi_error_count'
    const count = parseInt(sessionStorage.getItem(key) || '0')

    if (count >= 1) {
      // Demasiados crashes — limpiar y esperar sin redirigir
      sessionStorage.removeItem(key)
      return
    }

    sessionStorage.setItem(key, String(count + 1))

    this.timeoutId = setTimeout(() => {
      window.location.href = '/home'
    }, 10000)
  }

  componentWillUnmount() {
    clearTimeout(this.timeoutId)
  }

  handleReset() {
    sessionStorage.removeItem('pandi_error_count')
    this.setState({ hasError: false })
    window.location.href = '/home'
  }

  render() {
    if (this.state.hasError) {
      const count = parseInt(sessionStorage.getItem('pandi_error_count') || '0')
      const looping = count >= 3

      return (
        <div style={{
          position:'fixed', inset:0, zIndex:999999,
          background:'#f8fafa', display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center', gap:16, padding:32,
        }}>
          <div style={{
            width:56, height:56, borderRadius:16,
            background:'linear-gradient(135deg,#2EC4B6,#FF8FA3)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:28,
            animation: looping ? 'none' : 'pulseScale 1.4s ease-in-out infinite',
          }}>
            🐼
          </div>

          {looping ? (
            <>
              <p style={{ fontSize:15, fontWeight:800, color:'#1A2332', margin:0, textAlign:'center' }}>
                Algo no va bien
              </p>
              <p style={{ fontSize:12, color:'#9CA3AF', margin:0, textAlign:'center', maxWidth:260 }}>
                Pandi ha encontrado un problema. Toca para intentarlo de nuevo.
              </p>
              <button onClick={() => this.handleReset()}
                style={{ padding:'12px 28px', borderRadius:16, border:'none', cursor:'pointer',
                  background:'linear-gradient(135deg,#2EC4B6,#FF8FA3)', color:'white',
                  fontWeight:700, fontSize:14 }}>
                Reintentar
              </button>
            </>
          ) : (
            <>
              <p style={{ fontSize:15, fontWeight:800, color:'#1A2332', margin:0 }}>
                Actualizando Pandi…
              </p>
              <p style={{ fontSize:12, color:'#9CA3AF', margin:0 }}>
                Te llevamos a Inicio en un momento
              </p>
            </>
          )}

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
