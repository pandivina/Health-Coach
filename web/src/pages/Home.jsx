import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
// ... tus otras importaciones aquí ...

export default function Home() {
  // ==========================================
  // 1. ESTADOS (Aquí guardamos los datos)
  // ==========================================
  const { profile, user } = useStore()
  const { loaded } = useTheme()
  const [data, setData] = useState({ meals: [], workout: null, hydration: 0 })

  // ==========================================
  // 2. LÓGICA / EFECTOS (Aquí pedimos los datos)
  // ==========================================
  useEffect(() => {
    if (!user) return
    // Aquí cargarías tus datos de Supabase
  }, [user])

  // ==========================================
  // 3. ESTADO DE CARGA (Aquí protegemos la UI)
  // ==========================================
  if (!loaded) {
    return <div style={{ height: '100dvh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Cargando...</div>
  }

  // ==========================================
  // 4. RENDERIZADO (Aquí es donde ocurre la magia visual)
  // ==========================================
  return (
    <div style={{ minHeight: '100dvh', background: '#f8fafa', paddingBottom: '100px' }}>
      
      {/* SECCIÓN: Mascota / Sanctuary */}
      <section id="mascota">
         {/* Aquí va tu componente Sanctuary */}
      </section>

      {/* SECCIÓN: Contenido Principal */}
      <section id="contenido" style={{ padding: '0 16px' }}>
         <h1>Bienvenido, {profile?.name?.split(' ')[0] || 'Compi'}</h1>
         {/* Aquí irían tus tareas, widgets, etc */}
      </section>

      {/* SECCIÓN: Navegación inferior */}
      <nav id="navbar">
         {/* Aquí están tus botones de Inicio, Coach, etc */}
      </nav>
    </div>
  )
}
