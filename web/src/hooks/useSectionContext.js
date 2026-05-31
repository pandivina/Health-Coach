// src/hooks/useSectionContext.js
// ─────────────────────────────────────────────────────────────────────────────
// Hook que cada pantalla usa para publicar su contexto al coach.
// El coach recoge window.__pandi_section__ en cada mensaje.
//
// USO EN CADA PANTALLA:
//   useSectionContext('nutrition', {
//     caloriesConsumed: 1200,
//     caloriesTarget: 2000,
//     proteinConsumed: 80,
//     proteinTarget: 150,
//     lastMeal: 'Pollo con arroz',
//   })
//
// El hook limpia el contexto automáticamente al desmontar la pantalla.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react'

// Secciones disponibles con sus etiquetas para el system prompt
export const SECTION_LABELS = {
  home:         'Pantalla principal (resumen del día)',
  nutrition:    'Módulo de Nutrición',
  workout:      'Módulo de Entrenamiento',
  sleep:        'Módulo de Sueño',
  mood:         'Módulo de Bienestar y Estado de Ánimo',
  hydration:    'Módulo de Hidratación',
  smoking:      'Módulo de Control del Tabaco',
  health:       'Módulo de Seguimiento de Salud',
  coach:        'Chat con el Coach',
  profile:      'Perfil del Usuario',
  pet:          'Santuario de Pandi',
  report:       'Informe Diario',
  calendar:     'Calendario',
}

export function useSectionContext(section, data = {}) {
  useEffect(() => {
    // Publicar contexto
    window.__pandi_section__ = {
      section,
      label:     SECTION_LABELS[section] || section,
      data,
      enteredAt: new Date().toISOString(),
    }

    // Limpiar al salir de la pantalla
    return () => {
      if (window.__pandi_section__?.section === section) {
        window.__pandi_section__ = null
      }
    }
  }, [section, JSON.stringify(data)])
}

// Versión imperativa para actualizar el contexto sin re-render
// Útil cuando los datos cambian frecuentemente (ej: calorías en tiempo real)
export function updateSectionContext(data) {
  if (window.__pandi_section__) {
    window.__pandi_section__.data = {
      ...window.__pandi_section__.data,
      ...data,
    }
  }
}
