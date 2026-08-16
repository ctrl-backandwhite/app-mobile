/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Tema daisyUI `nx036-pastel` de `frontend/src/index.css`, copiado sin reinterpretar.
      colors: {
        primary: { DEFAULT: '#0c4a97', content: '#eef4fc', dark: '#3f93ec' },
        secondary: { DEFAULT: '#123246', content: '#eaf1f6', dark: '#2a5a7e' },
        accent: { DEFAULT: '#c0862d', content: '#211505', dark: '#d39b41' },
        base: {
          100: '#fcfdfe',
          200: '#f4f6f9',
          300: '#e3e8ef',
          content: '#14212e',
          'dark-100': '#0e1a26',
          'dark-200': '#142434',
          'dark-300': '#1e3143',
          'dark-content': '#e7eef3',
        },
        info: '#2e6e8e',
        success: '#1e6b52',
        warning: '#d9962b',
        error: { DEFAULT: '#b4472e', content: '#fbf0ec' },
      },
      fontFamily: {
        light: ['Roboto_300Light'],
        sans: ['Roboto_400Regular'],
        medium: ['Roboto_500Medium'],
        bold: ['Roboto_700Bold'],
      },
      borderRadius: { field: 9, selector: 10, box: 14 },
    },
  },
  plugins: [],
}
