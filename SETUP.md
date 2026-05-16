# 🚀 HEALTH COACH — Guía de Instalación Completa

Sigue estos pasos **en orden**. No te saltes ninguno.

---

## PASO 1 — Supabase: Crear el proyecto

1. Ve a **https://supabase.com** → New project
2. Ponle nombre: `health-coach`, elige región cercana, guarda la contraseña de BD
3. Espera a que el proyecto esté listo (~1 min)

---

## PASO 2 — Supabase: Ejecutar el schema

1. En el panel de Supabase → **SQL Editor** → New query
2. Abre el archivo `database/schema.sql`
3. Copia todo el contenido → pégalo en el editor → **Run**
4. Debes ver: "Success. No rows returned"

---

## PASO 3 — Supabase: Obtener las claves

1. En el panel → **Settings** → **API**
2. Copia:
   - **Project URL** → `SUPABASE_URL` y `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`
   - **service_role key** (¡secreta!) → `SUPABASE_SERVICE_ROLE_KEY`

---

## PASO 4 — Anthropic: Obtener API Key

1. Ve a **https://console.anthropic.com** → API Keys → Create key
2. Guarda la clave: `sk-ant-api03-...`

---

## PASO 5 — Backend: Configurar variables

```bash
cd health-coach/backend
cp .env.example .env
```

Abre `.env` y rellena:
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
ANTHROPIC_API_KEY=sk-ant-api03-...
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

---

## PASO 6 — Backend: Instalar dependencias y arrancar

```bash
cd health-coach/backend
npm install
npm run dev
```

Debes ver: `🚀 Health Coach API running on port 3001`

Para verificar que funciona:
```bash
curl http://localhost:3001/health
# → {"status":"ok","timestamp":"..."}
```

---

## PASO 7 — Frontend: Configurar variables

```bash
cd health-coach/web
cp .env.example .env
```

Abre `.env` y rellena:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
VITE_API_URL=http://localhost:3001
```

---

## PASO 8 — Frontend: Instalar dependencias y arrancar

```bash
cd health-coach/web
npm install
npm run dev
```

Debes ver: `VITE v5.x  ready in xxx ms → Local: http://localhost:5173`

Abre **http://localhost:5173** en el navegador.

---

## PASO 9 — Supabase: Configurar Auth (Email)

1. En Supabase → **Authentication** → **Settings**
2. En "Email Auth" asegúrate que está habilitado
3. Para desarrollo, desactiva "Confirm email" (Email Confirmations → OFF)
   - Esto permite registrarse sin confirmar email en desarrollo
4. Cuando estés en producción, vuelve a activarlo

---

## PASO 10 — Probar la app

1. Ve a **http://localhost:5173**
2. Crea una cuenta con email y contraseña
3. Completa el **Onboarding** (4 pasos)
4. Explora el **Home** con tus datos
5. Prueba el **Coach IA** → escribe "¿Cómo voy hoy?"
6. Registra comida en **Nutrición**
7. Genera **Recetas** (primero añade ingredientes en Despensa)
8. Ve a **Tu Día** para ver el informe diario

---

## DEPLOY A PRODUCCIÓN

### Frontend → Vercel

```bash
cd health-coach/web
npm install -g vercel
vercel
```

Variables de entorno en Vercel Dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL` → URL de tu backend en Railway

### Backend → Railway

1. Ve a **https://railway.app** → New Project → Deploy from GitHub
2. Selecciona la carpeta `backend/`
3. En Variables añade todas las del `.env`:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`
   - `PORT=3001`
   - `CORS_ORIGIN=https://tu-app.vercel.app`

---

## ESTRUCTURA DE ARCHIVOS

```
health-coach/
├── database/
│   └── schema.sql              ← Ejecutar en Supabase SQL Editor
├── backend/
│   ├── .env.example            ← Copiar a .env y rellenar
│   ├── package.json
│   ├── server.js               ← Punto de entrada del servidor
│   ├── middleware/
│   │   └── auth.js             ← Verificación JWT Supabase
│   └── routes/
│       ├── auth.js             ← GET/PUT /api/auth/profile
│       ├── coach.js            ← POST /api/coach
│       ├── nutrition.js        ← POST /api/nutrition/analyze-photo, /barcode
│       ├── pantry.js           ← POST /api/pantry/upload-receipt, GET /items
│       ├── recipes.js          ← POST /api/recipes/generate, /cook/:id
│       └── reports.js          ← GET /api/report/today
└── web/
    ├── .env.example            ← Copiar a .env y rellenar
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── index.css
        ├── App.jsx             ← Router + ProtectedRoute
        ├── lib/
        │   ├── supabase.js     ← Cliente Supabase
        │   └── api.js          ← Llamadas al backend
        ├── store/
        │   └── useStore.js     ← Zustand global store
        ├── components/
        │   ├── Layout.jsx      ← Wrapper con nav
        │   └── BottomNav.jsx   ← Navegación inferior
        └── pages/
            ├── Auth.jsx        ← Login / Registro
            ├── Onboarding.jsx  ← Setup inicial (4 pasos)
            ├── Home.jsx        ← Dashboard principal
            ├── Coach.jsx       ← Chat con IA
            ├── Nutrition.jsx   ← Registro de comidas
            ├── Pantry.jsx      ← Despensa
            ├── Recipes.jsx     ← Recetas IA
            ├── Workout.jsx     ← Entrenamiento
            ├── Sleep.jsx       ← Sueño
            ├── Mood.jsx        ← Estado emocional
            ├── Hydration.jsx   ← Hidratación
            ├── Smoking.jsx     ← Dejar de fumar
            ├── DailyReport.jsx ← Tu Día
            ├── Pet.jsx         ← Mascota + gamificación
            └── Profile.jsx     ← Perfil + logout
```

---

## COMANDOS DE REFERENCIA

```bash
# Backend
cd backend && npm run dev       # Desarrollo
cd backend && npm start         # Producción

# Frontend
cd web && npm run dev           # Desarrollo
cd web && npm run build         # Build producción
cd web && npm run preview       # Preview del build
```

---

## SOLUCIÓN DE PROBLEMAS FRECUENTES

**❌ "No token provided"**
→ El frontend no está enviando el token JWT. Verifica que `VITE_API_URL` apunta al backend correcto.

**❌ "Invalid or expired token"**
→ La `SUPABASE_SERVICE_ROLE_KEY` en el backend es incorrecta. Cópiala de Supabase → Settings → API → service_role.

**❌ "relation does not exist"**
→ El schema SQL no se ejecutó correctamente. Repite el Paso 2 en Supabase.

**❌ Pantalla en blanco**
→ Abre la consola del navegador (F12). Si dice "VITE_SUPABASE_URL undefined", el archivo `.env` no existe o las variables no tienen el prefijo `VITE_`.

**❌ CORS error**
→ La variable `CORS_ORIGIN` en el backend no coincide con la URL del frontend. Deben ser exactamente iguales (con o sin slash final).

**❌ Coach no responde**
→ Verifica que `ANTHROPIC_API_KEY` es válida. Prueba: `curl -H "x-api-key: sk-..." https://api.anthropic.com/v1/models`
