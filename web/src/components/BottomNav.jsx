import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, MessageSquare, CalendarDays, Apple, Dumbbell } from 'lucide-react';
import { useTheme } from '../contexts/ThemeProvider'; // Ajusta la ruta si es necesario

export default function BottomNav() {
  const { theme } = useTheme();
  const location = useLocation();

  // Helpers para comprobar la ruta activa
  const isHome = location.pathname === '/';
  const isCoach = location.pathname === '/coach';
  const isCalendar = location.pathname === '/calendar';
  const isNutrition = location.pathname === '/nutrition';
  const isTrain = location.pathname === '/workout';

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 h-16 flex items-center justify-between px-2 z-50 border-t backdrop-blur-md transition-colors duration-300"
      style={{ 
        backgroundColor: theme.navBg, 
        borderColor: theme.navBorder 
      }}
    >
      {/* 1. INICIO */}
      <NavLink to="/" className="flex-1 flex flex-col items-center justify-center h-full">
        <Home size={22} color={isHome ? theme.navActive : theme.navText} />
        <span 
          className="text-[10px] font-medium mt-1"
          style={{ color: isHome ? theme.navActive : theme.navText }}
        >
          Inicio
        </span>
      </NavLink>

      {/* 2. COACH */}
      <NavLink to="/coach" className="flex-1 flex flex-col items-center justify-center h-full">
        <MessageSquare size={22} color={isCoach ? theme.navActive : theme.navText} />
        <span 
          className="text-[10px] font-medium mt-1"
          style={{ color: isCoach ? theme.navActive : theme.navText }}
        >
          Coach
        </span>
      </NavLink>

      {/* 3. ORGANIZADOR (EL TRONO CENTRAL) */}
      <div className="flex-1 flex flex-col items-center justify-center h-full relative">
        <NavLink 
          to="/calendar" 
          className="flex flex-col items-center justify-center absolute -top-5 left-1/2 -translate-x-1/2 w-full text-center"
        >
          <motion.div 
            whileTap={{ scale: 0.92 }}
            style={{
              width: 58, 
              height: 58, 
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${theme.primary}, #FF8FA3)`,
              boxShadow: `0 6px 20px ${theme.primary}50`, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '4px solid white', 
              margin: '0 auto',
            }}
          >
            <CalendarDays size={26} color="#fff" strokeWidth={1.8} />
          </motion.div>
          <span 
            className="text-[10px] font-bold mt-1 block w-full"
            style={{ color: isCalendar ? theme.navActive : theme.navText }}
          >
            Organizador
          </span>
        </NavLink>
      </div>

      {/* 4. NUTRICIÓN */}
      <NavLink to="/nutrition" className="flex-1 flex flex-col items-center justify-center h-full">
        <Apple size={22} color={isNutrition ? theme.navActive : theme.navText} />
        <span 
          className="text-[10px] font-medium mt-1"
          style={{ color: isNutrition ? theme.navActive : theme.navText }}
        >
          Nutrición
        </span>
      </NavLink>

      {/* 5. ENTRENA */}
      <NavLink to="/workout" className="flex-1 flex flex-col items-center justify-center h-full">
        <Dumbbell size={22} color={isTrain ? theme.navActive : theme.navText} />
        <span 
          className="text-[10px] font-medium mt-1"
          style={{ color: isTrain ? theme.navActive : theme.navText }}
        >
          Entrena
        </span>
      </NavLink>

    </nav>
  );
}
