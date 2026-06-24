/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f172a',
        brand: {
          100: '#fef3c7',
          500: '#d97706',
          700: '#92400e'
        }
      }
    }
  },
  plugins: []
};
