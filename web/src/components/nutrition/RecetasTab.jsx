import React from 'react';
import BentoRecipeCard from './BentoRecipeCard'; // Importas la tarjeta Bento desde la misma carpeta
import { useTheme } from '../../contexts/ThemeProvider';

// Array de recetas de ejemplo simulando lo que te traerías de tu base de datos o IA
const RECETAS_BENTO_MOCK = [
  {
    title: "Bowl Salmon Zen de Pandi",
    calories: 580,
    time: "15 min",
    macros: { protein: "38g", carbs: "60g", fat: "18g" },
    ingredients: [
      { name: "Salmón a la plancha", qty: "120g", emoji: "🐟" },
      { name: "Base de Arroz Sushi", qty: "80g", emoji: "🍚" },
      { name: "Aguacate fresco", qty: "1/2 unidad", emoji: "🥑" },
      { name: "Edamame", qty: "50g", emoji: "🫛" }
    ]
  },
  {
    title: "Bento Fitness: Pollo Teriyaki",
    calories: 520,
    time: "20 min",
    macros: { protein: "42g", carbs: "55g", fat: "12g" },
    ingredients: [
      { name: "Pechuga de pollo", qty: "150g", emoji: "🍗" },
      { name: "Arroz jazmín", qty: "70g", emoji: "🍚" },
      { name: "Floretes de brócoli", qty: "100g", emoji: "🥦" },
      { name: "Salsa Teriyaki ligera", qty: "15ml", emoji: "🥢" }
    ]
  }
];

export default function RecetasTab() {
  const { theme } = useTheme();

  return (
    <div className="space-y-6 py-2" data-tour="nutrition-recipes-content">
      {/* Cabecera interna del tab */}
      <div className="px-1">
        <h2 className="text-base font-bold mb-1" style={{ color: theme.text }}>
          Recomendaciones Bento de Hoy
        </h2>
        <p className="text-xs" style={{ color: theme.textMuted }}>
          Completa los ingredientes de tu caja para desbloquear experiencia de Nutrición.
        </p>
      </div>

      {/* Grid o lista que renderiza cada caja bento */}
      <div className="flex flex-col gap-4">
        {RECETAS_BENTO_MOCK.map((receta, index) => (
          <BentoRecipeCard key={index} recipe={receta} />
        ))}
      </div>
    </div>
  );
}
export { RecetasTab as default } from './NutritionComponents'
