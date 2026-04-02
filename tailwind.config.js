/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#1A1A1A',
        surface: '#2A2A2A',
        border: '#3A3A3A',
        brand: {
          primary: '#4A8FE8',
          dark: '#2D6FBF',
          light: '#74AEFF',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#CCCCCC',
          muted: '#888888',
        },
        danger: '#FF4444',
        warning: '#FFB800',
        success: '#4CAF50',
      },
      fontFamily: {
        sans: ['Noto Sans JP', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

