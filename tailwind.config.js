/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#0E1E24',
          surface: '#16282F',
          border: '#233A42',
          text: '#F4F1EA',
          muted: '#8FA3A8',
          accent: '#E5A15C',
          accentSoft: '#3A2F22',
          warn: '#E0B84D',
          danger: '#E17B62',
        },
      },
      fontFamily: {
        sans: ['"General Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'ui-serif', 'serif'],
      },
      borderRadius: {
        card: '1.5rem',
        pill: '9999px',
      },
    },
  },
  plugins: [],
};