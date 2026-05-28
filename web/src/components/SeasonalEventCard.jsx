{/* Dentro del AnimatePresence, abajo de las misiones de la tarjeta */}

{/* ─── WORKOUT ADAPTADO SEGÚN ESTACIÓN ─── */}
<div className="rounded-2xl p-3 border mt-3" 
     style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>
  <div className="flex items-center gap-2 mb-1.5">
    <span style={{ fontSize: 16 }}>🏋️‍♂️</span>
    <p className="font-bold text-xs text-white">Objetivo Workout: {currentEvent.workoutFocus.goal}</p>
  </div>
  <p className="text-[10px] text-gray-400 leading-relaxed">
    {currentEvent.workoutFocus.desc}
  </p>
</div>

{/* ─── DIETA Y ALIMENTOS DE TEMPORADA ─── */}
<div className="rounded-2xl p-3 border mt-2" 
     style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>
  <div className="flex items-center gap-2 mb-1.5">
    <span style={{ fontSize: 16 }}>🍎</span>
    <p className="font-bold text-xs text-white">Nutrición: {currentEvent.dietFocus.strategy}</p>
  </div>
  
  {/* Chips de alimentos de temporada */}
  <div className="flex flex-wrap gap-1 mb-2">
    {currentEvent.dietFocus.foods.map((food, idx) => (
      <span key={idx} className="text-[9px] font-medium px-2 py-0.5 rounded-md bg-white/5 text-gray-300 border border-white/10">
        {food}
      </span>
    ))}
  </div>
  
  <p className="text-[10px] text-gray-400 bg-black/20 p-2 rounded-xl italic border border-white/5">
    💡 <strong>Tip estacional:</strong> {currentEvent.dietFocus.tip}
  </p>
</div>
