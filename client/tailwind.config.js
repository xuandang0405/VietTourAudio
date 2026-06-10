/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Roboto', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        phone: '0 28px 80px rgba(8, 63, 77, 0.18)'
      }
    }
  },
  plugins: []
};
