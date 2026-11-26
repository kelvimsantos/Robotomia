/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      colors: {
        surface: {
          950: '#0a0e12',
          900: '#10161c',
          850: '#161e26',
          800: '#1d2731',
          700: '#2a3743',
          600: '#3a4b5a',
        },
        accent: {
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
        },
        good: { 400: '#34d399', 500: '#10b981' },
        warn: { 400: '#fbbf24', 500: '#f59e0b' },
        bad: { 400: '#f87171', 500: '#ef4444' },
      },
      animation: {
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
        'blink': 'blink 4s step-end infinite',
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.75', transform: 'scale(0.97)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.2' },
        },
      },
    },
  },
  plugins: [],
};
