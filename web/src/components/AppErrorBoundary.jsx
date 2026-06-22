import { Component } from 'react'

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, info: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[AppErrorBoundary]', error, info)
    this.setState({ info })
  }

  componentDidUpdate() {
    if (!this.state.hasError) return
    const key = 'pandi_error_count'
    const count = parseInt(sessionStorage.getItem(key) || '0')
    if (count >= 1) { sessionStorage.removeItem(key); return }
    sessionStorage.setItem(key, String(count + 1))
    this.timeoutId = setTimeout(() => { window.location.href = '/home' }, 10000)
  }

  componentWillUnmount() { clearTimeout(this.timeoutId) }

  handleReset() {
    sessionStorage.removeItem('pandi_error_count')
    this.setState({ hasError: false, error: null, info: null })
    window.location.href = '/home'
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const count      = parseInt(sessionStorage.getItem('pandi_error_count') || '0')
    const showButton = count === 0
    const errorMsg   = this.state.error?.message || String(this.state.error || 'Error desconocido')
    const stack      = this.state.info?.componentStack || this.state.error?.stack || ''
    // Extraer solo el primer componente del stack para mostrarlo limpio
    const firstComp  = stack.split('\n').find(l => l.trim().startsWith('at '))?.trim() || ''

    return (
      <div style={{
        position:'fixed', inset:0, zIndex:999999, background:'#f8fafa',
        display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', gap:12, padding:24, overflowY:'auto',
      }}>
        <div style={{ width:48, height:48, borderRadius:14,
          background:'linear-gradient(135deg,#2EC4B6,#FF8FA3)',
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>
          🐼
        </div>

        <p style={{ fontSize:15, fontWeight:800, color:'#1A2332', margin:0, textAlign:'center' }}>
          {showButton ? 'Actualizando Pandi…' : 'Algo ha fallado'}
        </p>

        {/* Caja del error — siempre visible */}
        <div style={{ width:'100%', maxWidth:420, background:'#1A2332', borderRadius:16,
          padding:'14px 16px', textAlign:'left' }}>
          <p style={{ fontSize:11, fontWeight:800, color:'#EF4444',
            margin:'0 0 6px', textTransform:'uppercase', letterSpacing:'.05em' }}>
            Error
          </p>
          <p style={{ fontSize:12, color:'#F9FAFB', margin:'0 0 8px',
            wordBreak:'break-word', lineHeight:1.5, fontFamily:'monospace' }}>
            {errorMsg}
          </p>
          {firstComp && (
            <>
              <p style={{ fontSize:11, fontWeight:800, color:'#9CA3AF',
                margin:'0 0 4px', textTransform:'uppercase', letterSpacing:'.05em' }}>
                Componente
              </p>
              <p style={{ fontSize:11, color:'#D1D5DB', margin:0,
                wordBreak:'break-word', fontFamily:'monospace' }}>
                {firstComp}
              </p>
            </>
          )}
        </div>

        <div style={{ display:'flex', gap:10, marginTop:4 }}>
          <button onClick={() => this.handleReset()}
            style={{ padding:'11px 24px', borderRadius:14, border:'none', cursor:'pointer',
              background:'linear-gradient(135deg,#2EC4B6,#FF8FA3)', color:'white',
              fontWeight:700, fontSize:13 }}>
            Ir a Inicio
          </button>
          <button onClick={() => { sessionStorage.clear(); window.location.reload() }}
            style={{ padding:'11px 20px', borderRadius:14, border:'none', cursor:'pointer',
              background:'#F3F4F6', color:'#6B7280', fontWeight:700, fontSize:13 }}>
            Recargar
          </button>
        </div>

        <p style={{ fontSize:10, color:'#D1D5DB', margin:0, textAlign:'center' }}>
          {showButton ? 'Redirigiendo en 10s…' : 'Captura esta pantalla y envíala al desarrollador'}
        </p>
      </div>
    )
  }
}

export default AppErrorBoundary
