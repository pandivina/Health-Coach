-- ============================================================
-- HEALTH COACH — Supabase Schema
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. PERFILES DE USUARIO
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  age INTEGER,
  sex TEXT CHECK (sex IN ('male','female','other')),
  height_cm FLOAT,
  weight_kg FLOAT,
  goal TEXT CHECK (goal IN ('lose_fat','gain_muscle','maintain','recomp','health')),
  activity_level TEXT CHECK (activity_level IN ('sedentary','light','moderate','intense')),
  sleep_hours FLOAT DEFAULT 7,
  allergies TEXT[] DEFAULT '{}',
  is_smoker BOOLEAN DEFAULT false,
  wants_quit_smoking BOOLEAN DEFAULT false,
  onboarding_done BOOLEAN DEFAULT false,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak INTEGER DEFAULT 0,
  last_active DATE,
  pet_name TEXT DEFAULT 'Panda',
  pet_type TEXT DEFAULT 'panda',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. OBJETIVOS NUTRICIONALES
CREATE TABLE IF NOT EXISTS nutrition_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  calories INTEGER DEFAULT 2000,
  protein_g INTEGER DEFAULT 150,
  carbs_g INTEGER DEFAULT 200,
  fat_g INTEGER DEFAULT 65,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. REGISTRO DE COMIDAS
CREATE TABLE IF NOT EXISTS meal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  meal_type TEXT CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  food_name TEXT NOT NULL,
  calories FLOAT DEFAULT 0,
  protein_g FLOAT DEFAULT 0,
  carbs_g FLOAT DEFAULT 0,
  fat_g FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DESPENSA
CREATE TABLE IF NOT EXISTS pantry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  ingredient TEXT NOT NULL,
  quantity FLOAT DEFAULT 1,
  unit TEXT DEFAULT 'unidad',
  category TEXT DEFAULT 'otros',
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RECETAS GENERADAS
CREATE TABLE IF NOT EXISTS generated_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  ingredients JSONB DEFAULT '[]',
  instructions TEXT,
  calories FLOAT DEFAULT 0,
  protein_g FLOAT DEFAULT 0,
  prep_time INTEGER DEFAULT 30,
  cooked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ENTRENAMIENTOS
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  name TEXT NOT NULL,
  exercises JSONB DEFAULT '[]',
  calories_burned FLOAT DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SUEÑO
CREATE TABLE IF NOT EXISTS sleep_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  hours FLOAT NOT NULL,
  quality INTEGER CHECK (quality BETWEEN 1 AND 5) DEFAULT 3,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ESTADO EMOCIONAL
CREATE TABLE IF NOT EXISTS mood_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  mood INTEGER CHECK (mood BETWEEN 1 AND 5) NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. HIDRATACIÓN
CREATE TABLE IF NOT EXISTS hydration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  glasses INTEGER DEFAULT 0,
  goal INTEGER DEFAULT 8,
  UNIQUE(user_id, date)
);

-- 10. PROGRAMA ANTI-TABACO
CREATE TABLE IF NOT EXISTS smoking_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  quit_date DATE,
  cigarettes_per_day INTEGER DEFAULT 10,
  cost_per_pack FLOAT DEFAULT 5.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. INFORMES DIARIOS
CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  calories_consumed FLOAT DEFAULT 0,
  calories_burned FLOAT DEFAULT 0,
  sleep_hours FLOAT,
  mood INTEGER,
  hydration_glasses INTEGER DEFAULT 0,
  coach_insight TEXT DEFAULT '',
  recommendation TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 12. LOGROS
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT '🏆',
  earned_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. SUSCRIPCIONES
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free','premium')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hydration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE smoking_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas: cada usuario solo ve/edita sus datos
DO $$ 
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'nutrition_goals','meal_logs','pantry_items','generated_recipes',
    'workouts','sleep_logs','mood_logs','hydration_logs','smoking_logs',
    'daily_reports','achievements','subscriptions'
  ] LOOP
    EXECUTE format('
      CREATE POLICY "Users own data on %I"
      ON %I FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    ', t, t);
  END LOOP;
END $$;

CREATE POLICY "Users own profile" ON user_profiles FOR ALL
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Trigger: crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.nutrition_goals (user_id)
  VALUES (NEW.id)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.subscriptions (user_id)
  VALUES (NEW.id)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
