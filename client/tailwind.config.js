import { colors as deepSeaColors } from './src/styles/tokens.js';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        'tablet': '768px',
        'pc': '1024px',
      },
      colors: {
        ...deepSeaColors,
        premium: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6', // Aqua primary
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        dark: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155'
        }
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0 0 25px -5px rgba(34, 211, 238, 0.4), 0 0 10px -2px rgba(34, 211, 238, 0.2)',
        'neon-premium': '0 0 30px -5px rgba(192, 132, 252, 0.4)',
        'glass-inner': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'audio-wave': 'audioWave 0.4s ease-in-out infinite alternate',
        'ocean-current': 'oceanCurrent 35s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '10%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        audioWave: {
          '0%': { transform: 'scaleY(0.42)', opacity: '0.58' },
          '100%': { transform: 'scaleY(1)', opacity: '1' },
        },
        oceanCurrent: {
          '100%': { transform: 'translate3d(4%, -3%, 0) scale(1.04)' },
        }
      }
    },
  },
  plugins: [],
};
