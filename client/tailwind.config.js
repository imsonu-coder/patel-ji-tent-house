/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F7EBDD',
        maroon: '#6B1E2B',
        darkMaroon: '#45121C',
        gold: '#C79A3B',
        lightGold: '#E7CC91',
        textPrimary: '#33201D',
        textMuted: '#806C66',
        paper: '#FFFDF9'
      },
      boxShadow: {
        soft: '0 10px 30px rgba(107, 30, 43, 0.12)'
      }
    }
  },
  plugins: []
}
