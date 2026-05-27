import PremiumGate from '../components/PremiumGate'
export { AnalizarTab as default } from './NutritionTabs2'

// Estado:
const [showPremium, setShowPremium] = useState(false)

// En el catch:
} catch (err) {
  if (err.message === 'premium_required') setShowPremium(true)
  else setError('No se pudo analizar...')
}

// En el JSX al final:
<PremiumGate visible={showPremium} onClose={() => setShowPremium(false)} feature="Análisis de foto" />
