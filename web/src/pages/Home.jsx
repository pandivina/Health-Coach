import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import { useTheme } from '../contexts/ThemeProvider'
import { usePandiState } from '../contexts/PandiStateContext'
// IMPORTANTE: Asegúrate de que esta ruta sea la correcta para tu archivo Sanctuary
import Sanctuary from '../components/sanctuary/PandiSanctuary3D'

export default function Home() {
  // 1. DATOS DEL USUARIO
  const { profile, user } = useStore()
  const { loaded } = useTheme()
  const pandiContext = usePandiState()
  const [waterGlasses, setWaterGlasses] = useState(0);
  
  // 2. ESTADO DE CARGA: Si no ha cargado el tema, mostramos esto
 if (!loaded) return <div>Cargando...</div>;

  return (
    <div style={{ minHeight: '100dvh', background: '#f8fafa', paddingBottom: '100px' }}>
      <h1>Bienvenido, {profile?.name?.split(' ')[0] || 'Compi'}</h1>
      
      {/* Ahora waterGlasses existe y no dará error */}
      <p>Vasos de agua: {waterGlasses}</p>
    </div>
  )
}

  // 3. DATOS PREVIOS PARA EL SANTUARIO
  const recoveryLight = pandiContext?.recoveryLight || 'GREEN'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? '¡Buenos días' : hour < 20 ? '¡Buenas tardes' : '¡Buenas noches'
  const name = profile?.name?.split(' ')[0] || 'Compi'

  // 4. RENDERIZADO
  return (
    <div style={{ minHeight: '100dvh', background: '#f8fafa', paddingBottom: '100px' }}>
      
      {/* SECCIÓN: Mascota / Sanctuary */}
      <section id="mascota">
         <Sanctuary 
            recoveryLight={recoveryLight} 
            profile={profile} 
            greeting={greeting} 
            name={name} 
         />
      </section>

      {/* SECCIÓN: Contenido Principal */}
      <section id="contenido" style={{ padding: '0 16px', marginTop: '20px' }}>
         <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Bienvenido, {name}</h2>
         <p>Aquí verás tus tareas y datos una vez los integres.</p>
      </section>

      {/* 
      {/* --- WIDGET DE PRUEBA: HIDRATACIÓN --- */}
<div style={{ 
  background: 'white', 
  padding: '16px', 
  borderRadius: '20px', 
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)', 
  marginTop: '20px',
  marginRight: '16px',
  marginLeft: '16px'
}}>
  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Hidratación</h3>
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <span style={{ fontSize: '24px' }}>💧</span>
    <p style={{ margin: 0 }}>Llevas registrados: <strong>{waterGlasses || 0}</strong> vasos</p>
  </div>
</div>
         SECCIÓN: Navegación inferior
         Nota: Si tu navegación es un componente separado (ej: <Navbar />), colócalo aquí abajo.
      */}
    </div>
  )
}
