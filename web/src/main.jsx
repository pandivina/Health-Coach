import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ThemeProvider } from './contexts/ThemeProvider'
import { GuidedTourProvider } from './contexts/GuidedTourProvider'
import SpotlightOverlay from './components/tour/SpotlightOverlay'
import GuidedTour from './components/tour/GuidedTour'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <GuidedTourProvider>
        <App />
        <SpotlightOverlay />
        <GuidedTour />
      </GuidedTourProvider>
    </ThemeProvider>
  </React.StrictMode>
)
