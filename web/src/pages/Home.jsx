import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import { useTheme } from '../contexts/ThemeProvider'
import { usePandiState } from '../contexts/PandiStateContext'
// Importamos tu mascota 3D con la ruta correcta
import Sanctuary from '../components/sanctuary/PandiSanctuary3D' 

export default function Home() {
  const { profile } = useStore()
  const { loaded } = useTheme()
  const pandiContext = usePandiState()
  
  // Estado para datos (más adelante conectaremos esto con tu base de datos)
  const [waterGlasses, setWaterGlasses] = useState(0);
  
  if (!loaded) return <div style={{ height: '100dvh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>🐾</div>

  const name = profile?.name?.split(' ')[0] || 'Compi'

  return (
    <div style={{ minHeight: '100dvh', background: '#f8fafa', paddingBottom: '100px' }}>
      
      {/* 1. MASCOTA 3D */}
      <section id="mascota">
         <Sanctuary 
            recoveryLight={pandiContext?.recoveryLight || 'GREEN'} 
            profile={profile} 
            name={name} 
         />
      </section>

      {/* 2. BIENVENIDA */}
      <section id="contenido" style={{ padding: '0 16px', marginTop: '20px' }}>
         <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Bienvenido, {name}</h2>
         
         {/* 3. WIDGET DE HIDRATACIÓN (Diseño premium) */}
         <div style={{ 
            background: 'white', 
            padding: '20px', 
            borderRadius: '20px', 
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)', 
            marginTop: '20px' 
         }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#666' }}>Hidratación</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
               <span style={{ fontSize: '32px' }}>💧</span>
               <div>
                  <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{waterGlasses}</span>
                  <span style={{ marginLeft: '5px' }}>/ 8 vasos</span>
               </div>
            </div>
         </div>
      </section>
    </div>
  )
}
