import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Flame, Check, ChevronRight, Scale } from 'lucide-react';
import { useTheme } from '../contexts/ThemeProvider'; // Tu contexto de tema

export default function BentoRecipeCard({ recipe }) {
  const { theme } = useTheme();
  const [checkedIngredients, setCheckedIngredients] = useState({});
  const [isCompleted, setIsCompleted] = useState(false);

  // Datos de ejemplo por si acaso (Sustituir por props reales del backend)
  const data = recipe || {
    title: "Bowl de Pollo Teriyaki con Brócoli",
    image: "/images/teriyaki-bowl.jpg", // O usa un placeholder/emoji si no hay foto
    calories: 520,
    time: "20 min",
    macros: { protein: "42g", carbs: "55g", fat: "12g" },
    ingredients: [
      { name: "Pechuga de pollo", qty: "150g", emoji: "🍗" },
      { name: "Arroz jazmín", qty: "70g", emoji: "🍚" },
      { name: "Floretes de brócoli", qty: "100g", emoji: "🥦" },
      { name: "Salsa Teriyaki ligera", qty: "15ml", emoji: "🥢" },
      { name: "Semillas de sésamo", qty: "1 cdta", emoji: "🌱" }
    ]
  };

  const toggleIngredient = (index) => {
    setCheckedIngredients(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="w-full max-w-md mx-auto p-2">
      {/* CONTENEDOR BENTO BOX PRINCIPAL */}
      <div 
        className="rounded-3xl p-3 grid grid-cols-6 gap-2.5 shadow-sm overflow-hidden"
        style={{ backgroundColor: theme.surface2, border: `2.5px solid ${theme.border}` }}
      >
        
        {/* 1. CELDA PRINCIPAL: EL PLATO (Ocupa 4 de 6 columnas y fila doble) */}
        <div 
          className="col-span-4 row-span-2 rounded-2xl p-3 flex flex-col justify-between relative overflow-hidden h-44 group"
          style={{ backgroundColor: theme.surface, border: `1.5px solid ${theme.border}` }}
        >
          {/* Fondo sutil o imagen */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none" />
          
          <div className="z-10">
            <span className="text-2xl mb-1 block">🍱</span>
            <h3 className="font-extrabold text-sm leading-tight text-gray-800" style={{ color: theme.text }}>
              {data.title}
            </h3>
          </div>

          <div className="flex gap-2 z-10">
            <div className="flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold bg-orange-500/10 text-orange-600">
              <Flame size={12} />
              {data.calories} kcal
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold bg-blue-500/10 text-blue-600">
              <Clock size={12} />
              {data.time}
            </div>
          </div>
        </div>

        {/* 2. CELDA SECUNDARIA: MACRONUTRIENTES (Ocupa 2 de 6 columnas, vertical) */}
        <div 
          className="col-span-2 row-span-2 rounded-2xl p-2.5 flex flex-col justify-around text-center h-44"
          style={{ backgroundColor: theme.surface, border: `1.5px solid ${theme.border}` }}
        >
          <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">Macros</p>
          
          <div>
            <span className="text-[10px] font-bold block text-orange-500">P</span>
            <span className="text-xs font-black" style={{ color: theme.text }}>{data.macros.protein}</span>
          </div>
          <div className="w-full h-[2px] bg-gray-100 rounded-full" />
          <div>
            <span className="text-[10px] font-bold block text-yellow-500">H</span>
            <span className="text-xs font-black" style={{ color: theme.text }}>{data.macros.carbs}</span>
          </div>
          <div className="w-full h-[2px] bg-gray-100 rounded-full" />
          <div>
            <span className="text-[10px] font-bold block text-emerald-500">G</span>
            <span className="text-xs font-black" style={{ color: theme.text }}>{data.macros.fat}</span>
          </div>
        </div>

        {/* 3. SUB-BENTO: LISTADO DE INGREDIENTES DESGLOSADOS */}
        <div className="col-span-6 mt-1">
          <p className="text-[10px] font-black uppercase tracking-wider mb-2 px-1" style={{ color: theme.textLight }}>
            Ingredientes (Prepara tu caja)
          </p>
          
          {/* Mapeo asimétrico estilo Bento para ingredientes */}
          <div className="grid grid-cols-2 gap-2">
            {data.ingredients.map((ing, index) => {
              const isChecked = checkedIngredients[index];
              return (
                <motion.button
                  key={index}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => toggleIngredient(index)}
                  className="rounded-xl p-2 flex items-center justify-between text-left transition-all relative overflow-hidden"
                  style={{ 
                    backgroundColor: isChecked ? '#F9731610' : theme.surface, 
                    border: `1.5px solid ${isChecked ? '#F9731650' : theme.border}` 
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg flex-shrink-0">{ing.emoji}</span>
                    <div className="min-w-0">
                      <p 
                        className="text-xs font-bold truncate leading-tight"
                        style={{ 
                          color: isChecked ? theme.textMuted : theme.text,
                          textDecoration: isChecked ? 'line-through' : 'none'
                        }}
                      >
                        {ing.name}
                      </p>
                      <p className="text-[10px] font-medium text-gray-400">{ing.qty}</p>
                    </div>
                  </div>
                  
                  {/* Mini Checkbox estilo Bento */}
                  <div 
                    className="w-4 h-4 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ml-1"
                    style={{ 
                      backgroundColor: isChecked ? '#F97316' : theme.surface2,
                      border: isChecked ? 'none' : `1px solid ${theme.border}`
                    }}
                  >
                    {isChecked && <Check size={10} color="#fff" strokeWidth={3} />}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* 4. BOTÓN DE ACCIÓN: LOG DE LA RECETA COMPLETADA */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsCompleted(!isCompleted)}
          className="col-span-6 mt-1 py-2.5 rounded-xl font-extrabold text-xs text-white shadow-sm flex items-center justify-center gap-2 transition-all"
          style={{ 
            background: isCompleted ? theme.success : `linear-gradient(135deg, #F97316, #FF7E40)`,
            boxShadow: isCompleted ? 'none' : `0 4px 12px rgba(249, 115, 22, 0.2)`
          }}
        >
          {isCompleted ? (
            <>
              <Check size={14} strokeWidth={2.5} />
              ¡Almuerzo Añadido al Calendario! (+15 XP) 🐼
            </>
          ) : (
            <>
              ¡Cocinar este Bento!
              <ChevronRight size={14} />
            </>
          )}
        </motion.button>

      </div>
    </div>
  );
}
