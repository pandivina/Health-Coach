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
  
  // 2. ESTADO DE CARGA: Si no ha cargado el tema, mostramos esto
  if (!loaded) {
    return <div style={{ height: '100dvh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>🐾</div>
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
         SECCIÓN: Navegación inferior
         Nota: Si tu navegación es un componente separado (ej: <Navbar />), colócalo aquí abajo.
      */}
    </div>
  )
}
