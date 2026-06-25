// ─── BOTÓN ☰ REUTILIZABLE ─────────────────────────────────────────────────────
// Uso: <MenuButton /> — en cualquier header, abre el menú global
// Reemplaza <Link to="/profile"><div>☰</div></Link> en Home.jsx

import { motion } from 'framer-motion'
import { useGlobalMenu } from '../contexts/GlobalMenuContext'
import { useTheme } from '../contexts/ThemeProvider'

export default function MenuButton({ style = {} }) {
  const { openMenu } = useGlobalMenu()
  const { theme }    = useTheme()

  return (
    <motion.button whileTap={{ scale:0.92 }} onClick={openMenu}
      style={{ width:36, height:36, borderRadius:12,
        background:'rgba(255,255,255,0.88)', backdropFilter:'blur(8px)',
        border:'none', cursor:'pointer',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:18, ...style }}>
      ☰
    </motion.button>
  )
}
