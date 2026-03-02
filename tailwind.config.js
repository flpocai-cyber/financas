/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        dark: {
          900: '#0a0a0f',
          800: '#111118',
          700: '#1a1a2e',
          600: '#16213e',
          500: '#0f3460',
        },
        brand: {
          green: '#00d4aa',
          blue: '#4f8ef7',
          purple: '#7c3aed',
          red: '#f43f5e',
          yellow: '#fbbf24',
        }
      }
    },
  },
  plugins: [],
}
