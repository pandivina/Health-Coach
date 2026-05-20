import { motion } from 'framer-motion'
import { Bell, BellOff } from 'lucide-react'
import { usePushNotifications } from '../hooks/usePushNotifications'
import { useTheme } from '../contexts/ThemeProvider'

export default function NotificationSetup() {
  const { theme } = useTheme()
  const { supported, permission, subscribed, loading, subscribe, unsubscribe } = usePushNotifications()

  if (!supported) return null

  const blocked = permission === 'denied'

  return (
    <motion.div
      whileTap={!blocked && !loading ? { scale: 0.97 } : {}}
      onClick={!blocked && !loading ? (subscribed ? unsubscribe : subscribe) : undefined}
      className="card flex items-center gap-4 mb-3"
      style={{
        cursor:  blocked || loading ? 'default' : 'pointer',
        border:  `1px solid ${subscribed ? theme.primary + '40' : theme.border}`,
        opacity: loading ? 0.7 : 1,
      }}>

      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: subscribed ? `${theme.primary}20` : theme.surface2 }}>
        {subscribed
          ? <Bell    size={18} style={{ color: theme.primary }} />
          : <BellOff size={18} style={{ color: theme.textMuted }} />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm" style={{ color: theme.text }}>
          {blocked    ? 'Notificaciones bloqueadas'  :
           subscribed ? 'Notificaciones activas'     :
                        'Activar notificaciones'}
        </p>
        <p className="text-xs" style={{ color: theme.textMuted }}>
          {blocked    ? 'Actívalas en los ajustes del navegador' :
           subscribed ? 'Agua · Comidas · Movimiento · Sueño'    :
                        'Recordatorios inteligentes de Pandi 🐼'}
        </p>
      </div>

      {!blocked && (
        <div className="w-10 h-6 rounded-full relative flex-shrink-0"
          style={{ background: subscribed ? theme.primary : theme.surface2 }}>
          <motion.div
            animate={{ x: subscribed ? 16 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm" />
        </div>
      )}
    </motion.div>
  )
}
