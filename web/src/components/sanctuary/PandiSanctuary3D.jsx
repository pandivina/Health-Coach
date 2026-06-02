// src/components/sanctuary/PandiSanctuary3D.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Componente 3D del Santuario de Pandi
// Usa @react-three/fiber + @react-three/drei
// Cuando tengas el modelo GLB, solo cambia PANDI_MODEL_URL
//
// INSTALAR:
// npm install @react-three/fiber @react-three/drei three
// ─────────────────────────────────────────────────────────────────────────────

import { Suspense, useRef, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  useGLTF, OrbitControls, Environment, ContactShadows,
  Float, Sparkles, MeshDistortMaterial, Sphere,
} from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'

// ─── CONFIGURACIÓN ────────────────────────────────────────────────────────────
// Cambia esta URL cuando tengas el modelo GLB de Pandi
// Opciones para conseguirlo gratis:
// 1. Sketchfab: busca "panda 3d model" → descarga GLB → sube a /public/models/
// 2. Spline: diseña → Export → React → copia URL
// 3. Blender: exporta tu modelo como pandi.glb → /public/models/pandi.glb
const PANDI_MODEL_URL = 'https://fftqehbzktwuohzoofeb.supabase.co/storage/v1/object/public/assets/pandi.glb'

// Colores del santuario según semáforo
const SANCTUARY_CONFIG = {
  GREEN: {
    ambientColor:   '#c8f5e8',
    pointColor:     '#2EC4B6',
    sparkleColor:   '#2EC4B6',
    fogColor:       '#e0fffe',
    groundColor:    '#a8e6cf',
    envPreset:      'dawn',
    floatSpeed:     2,
    floatIntensity: 0.8,
  },
  YELLOW: {
    ambientColor:   '#fef3c7',
    pointColor:     '#F59E0B',
    sparkleColor:   '#FCD34D',
    fogColor:       '#fffbeb',
    groundColor:    '#fde68a',
    envPreset:      'sunset',
    floatSpeed:     1.5,
    floatIntensity: 0.5,
  },
  RED: {
    ambientColor:   '#ffe4ec',
    pointColor:     '#FF8FA3',
    sparkleColor:   '#FFB3C6',
    fogColor:       '#fff0f5',
    groundColor:    '#fecdd3',
    envPreset:      'night',
    floatSpeed:     1,
    floatIntensity: 0.3,
  },
}

// ─── MODELO PANDI ─────────────────────────────────────────────────────────────
function PandiModel({ recoveryLight }) {
  const ref       = useRef()
  const config    = SANCTUARY_CONFIG[recoveryLight] || SANCTUARY_CONFIG.GREEN
  const [loaded, setLoaded] = useState(false)

  let gltf = null
  try {
    gltf = useGLTF(PANDI_MODEL_URL)
    if (!loaded) setLoaded(true)
  } catch {
    // Modelo no disponible aún — usar placeholder
  }

  // Rotación suave
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.15
    }
  })

  if (!gltf) {
    // Placeholder mientras no hay modelo — panda geométrico simple
    return <PandiPlaceholder recoveryLight={recoveryLight} />
  }

  return (
    <Float
      speed={config.floatSpeed}
      rotationIntensity={0.2}
      floatIntensity={config.floatIntensity}
    >
      <primitive
        ref={ref}
        object={gltf.scene}
        scale={1.8}
        position={[0, -0.5, 0]}
        castShadow
        receiveShadow
      />
    </Float>
  )
}

// ─── PLACEHOLDER GEOMÉTRICO (mientras no hay modelo GLB) ─────────────────────
function PandiPlaceholder({ recoveryLight }) {
  const ref    = useRef()
  const config = SANCTUARY_CONFIG[recoveryLight] || SANCTUARY_CONFIG.GREEN

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y  = Math.sin(state.clock.elapsedTime * 0.4) * 0.2
      ref.current.position.y  = Math.sin(state.clock.elapsedTime * 1.2) * 0.08 - 0.3
    }
  })

  const color = new THREE.Color(config.pointColor)

  return (
    <Float speed={2} rotationIntensity={0.1} floatIntensity={0.6}>
      <group ref={ref} position={[0, -0.3, 0]}>
        {/* Cuerpo */}
        <mesh position={[0, 0, 0]} castShadow>
          <sphereGeometry args={[0.55, 32, 32]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.1} />
        </mesh>
        {/* Cabeza */}
        <mesh position={[0, 0.75, 0]} castShadow>
          <sphereGeometry args={[0.42, 32, 32]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.1} />
        </mesh>
        {/* Orejas */}
        {[[-0.3, 1.1], [0.3, 1.1]].map(([x, y], i) => (
          <mesh key={i} position={[x, y, 0]} castShadow>
            <sphereGeometry args={[0.14, 16, 16]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
          </mesh>
        ))}
        {/* Manchas ojos */}
        {[[-0.15, 0.82, 0.35], [0.15, 0.82, 0.35]].map(([x, y, z], i) => (
          <mesh key={i} position={[x, y, z]} castShadow>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
          </mesh>
        ))}
        {/* Ojos brillantes */}
        {[[-0.14, 0.84, 0.42], [0.14, 0.84, 0.42]].map(([x, y, z], i) => (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
          </mesh>
        ))}
        {/* Nariz */}
        <mesh position={[0, 0.7, 0.4]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
        {/* Brazos */}
        {[[-0.65, 0.1, 0], [0.65, 0.1, 0]].map(([x, y, z], i) => (
          <mesh key={i} position={[x, y, z]} rotation={[0, 0, i === 0 ? 0.4 : -0.4]} castShadow>
            <capsuleGeometry args={[0.14, 0.35, 8, 16]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} />
          </mesh>
        ))}
        {/* Patas */}
        {[[-0.25, -0.65, 0.1], [0.25, -0.65, 0.1]].map(([x, y, z], i) => (
          <mesh key={i} position={[x, y, z]} castShadow>
            <capsuleGeometry args={[0.15, 0.2, 8, 16]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} />
          </mesh>
        ))}
        {/* Aura emisiva */}
        <mesh position={[0, 0.2, 0]}>
          <sphereGeometry args={[0.8, 32, 32]} />
          <meshStandardMaterial
            color={config.pointColor}
            transparent
            opacity={0.06}
            emissive={config.pointColor}
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>
    </Float>
  )
}

// ─── SUELO DEL SANTUARIO ──────────────────────────────────────────────────────
function SanctuaryGround({ recoveryLight }) {
  const config = SANCTUARY_CONFIG[recoveryLight] || SANCTUARY_CONFIG.GREEN
  return (
    <group>
      {/* Plataforma circular */}
      <mesh position={[0, -1.1, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.8, 2, 0.1, 64]} />
        <meshStandardMaterial color={config.groundColor} roughness={0.8} metalness={0.05} />
      </mesh>
      {/* Sombra de contacto */}
      <ContactShadows
        position={[0, -1.05, 0]}
        opacity={0.35}
        scale={4}
        blur={2.5}
        far={4}
      />
    </group>
  )
}

// ─── ILUMINACIÓN DINÁMICA ─────────────────────────────────────────────────────
function DynamicLighting({ recoveryLight }) {
  const lightRef = useRef()
  const config   = SANCTUARY_CONFIG[recoveryLight] || SANCTUARY_CONFIG.GREEN

  useFrame((state) => {
    if (lightRef.current) {
      lightRef.current.intensity = 1.2 + Math.sin(state.clock.elapsedTime * 1.5) * 0.3
    }
  })

  return (
    <>
      <ambientLight intensity={0.6} color={config.ambientColor} />
      <pointLight
        ref={lightRef}
        position={[0, 3, 2]}
        intensity={1.5}
        color={config.pointColor}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
      />
      <pointLight position={[-3, 1, -1]} intensity={0.4} color={config.ambientColor} />
      <pointLight position={[3, 1, -1]}  intensity={0.4} color={config.ambientColor} />
      {/* Luz de relleno desde abajo — efecto mágico */}
      <pointLight position={[0, -1, 1]} intensity={0.3} color={config.pointColor} />
    </>
  )
}

// ─── PARTÍCULAS MÁGICAS ───────────────────────────────────────────────────────
function MagicParticles({ recoveryLight }) {
  const config = SANCTUARY_CONFIG[recoveryLight] || SANCTUARY_CONFIG.GREEN
  return (
    <Sparkles
      count={40}
      scale={[4, 4, 4]}
      size={1.5}
      speed={0.4}
      opacity={0.6}
      color={config.sparkleColor}
      noise={0.2}
    />
  )
}

// ─── ESCENA COMPLETA ──────────────────────────────────────────────────────────
function SanctuaryScene({ recoveryLight }) {
  const config = SANCTUARY_CONFIG[recoveryLight] || SANCTUARY_CONFIG.GREEN
  const { scene } = useThree()

  useEffect(() => {
    scene.fog = new THREE.FogExp2(config.fogColor, 0.08)
    scene.background = new THREE.Color(config.fogColor)
  }, [recoveryLight])

  return (
    <>
      <DynamicLighting recoveryLight={recoveryLight} />
      <Environment preset={config.envPreset} />
      <MagicParticles recoveryLight={recoveryLight} />
      <SanctuaryGround recoveryLight={recoveryLight} />
      <PandiModel recoveryLight={recoveryLight} />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2}
        autoRotate={false}
      />
    </>
  )
}

// ─── LOADING FALLBACK ─────────────────────────────────────────────────────────
function SanctuaryLoader({ recoveryLight }) {
  const config = SANCTUARY_CONFIG[recoveryLight] || SANCTUARY_CONFIG.GREEN
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: config.fogColor,
    }}>
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        style={{ fontSize: 64 }}
      >
        🐼
      </motion.div>
      <motion.p
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        style={{ fontSize: 12, color: config.pointColor, fontWeight: 600, marginTop: 12 }}
      >
        Preparando el santuario…
      </motion.p>
    </div>
  )
}

// ─── COMPONENTE EXPORTADO ─────────────────────────────────────────────────────
export default function PandiSanctuary3D({
  recoveryLight = 'GREEN',
  height        = 420,
  showControls  = false,
}) {
  return (
    <div style={{ width: '100%', height, position: 'relative', overflow: 'hidden' }}>
      <Canvas
        shadows
        camera={{ position: [0, 1.5, 5], fov: 45 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true, alpha: false }}
      >
        <Suspense fallback={null}>
          <SanctuaryScene recoveryLight={recoveryLight} />
        </Suspense>
      </Canvas>

      {/* Fallback 2D mientras carga */}
      <Suspense fallback={<SanctuaryLoader recoveryLight={recoveryLight} />}>
        <div style={{ display: 'none' }} />
      </Suspense>
    </div>
  )
}

// Precargar el modelo si existe
try { useGLTF.preload(PANDI_MODEL_URL) } catch {}
