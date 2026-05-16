/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: {
          DEFAULT: '#0e0e1a',
          2: '#161628',
          3: '#1e1e35',
        },
        accent: {
          DEFAULT: '#6366f1',
          orange: '#f97316',
          green: '#22c55e',
          red: '#ef4444',
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #f97316, #6366f1)',
        'gradient-card': 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(249,115,22,0.05))',
      },
    },
  },
  plugins: [],
}
