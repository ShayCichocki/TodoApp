/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f0f5f0',
          100: '#dce8dc',
          200: '#b8d4b8',
          300: '#8db88d',
          400: '#649664',
          500: '#4a7c4a',
          600: '#3a6239',
          700: '#2f4e2f',
          800: '#263e26',
          900: '#1d301d',
        },
        moss: {
          50: '#f4f7f0',
          100: '#e6edda',
          200: '#cfddb8',
          300: '#afc48d',
          400: '#8fa766',
          500: '#6d8a47',
          600: '#566e38',
          700: '#43552d',
          800: '#374527',
          900: '#2f3a22',
        },
        sage: {
          50: '#f6f7f4',
          100: '#e9ede5',
          200: '#d5dccf',
          300: '#b5c2ab',
          400: '#93a483',
          500: '#768864',
          600: '#5d6b4f',
          700: '#4a5540',
          800: '#3d4636',
          900: '#343c2f',
        },
      },
    },
  },
  plugins: [],
}
