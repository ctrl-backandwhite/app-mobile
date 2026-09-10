/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      /*
       * Los colores apuntan a las variables de `global.css`, que es donde vive el tema y donde el
       * modo oscuro se resuelve solo. `<alpha-value>` es lo que mantiene vivas las opacidades de
       * utilidad (`text-base-content/60`, `bg-primary/10`).
       */
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          content: 'rgb(var(--color-primary-content) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--color-secondary) / <alpha-value>)',
          content: 'rgb(var(--color-secondary-content) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          content: 'rgb(var(--color-accent-content) / <alpha-value>)',
        },
        base: {
          100: 'rgb(var(--color-base-100) / <alpha-value>)',
          200: 'rgb(var(--color-base-200) / <alpha-value>)',
          300: 'rgb(var(--color-base-300) / <alpha-value>)',
          content: 'rgb(var(--color-base-content) / <alpha-value>)',
        },
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        info: 'rgb(var(--color-info) / <alpha-value>)',
        success: {
          DEFAULT: 'rgb(var(--color-success) / <alpha-value>)',
          content: 'rgb(var(--color-success-content) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'rgb(var(--color-warning) / <alpha-value>)',
          content: 'rgb(var(--color-warning-content) / <alpha-value>)',
        },
        error: {
          DEFAULT: 'rgb(var(--color-error) / <alpha-value>)',
          content: 'rgb(var(--color-error-content) / <alpha-value>)',
        },
      },
      /*
       * Roboto Light es la voz de la marca: el cuerpo y los titulares grandes van en 300, y el peso
       * medio queda reservado a los rótulos pequeños —botones, etiquetas, precios— donde el trazo
       * fino pierde legibilidad a tamaños de 13 px o menos.
       */
      fontFamily: {
        light: ['Roboto_300Light'],
        sans: ['Roboto_300Light'],
        regular: ['Roboto_400Regular'],
        medium: ['Roboto_500Medium'],
        bold: ['Roboto_700Bold'],
      },
      /*
       * Escala cerrada: cada tamaño trae su interlineado y su interletrado, así ninguna pantalla
       * vuelve a improvisar un `text-[17px] leading-[22px]` distinto del de al lado.
       *
       * El texto auxiliar subió de 11 a 12 px: a 11 px, y con el trazo fino de Roboto Light, las
       * segundas líneas de las listas y los pies de las tarjetas costaban de leer en pantalla.
       */
      fontSize: {
        display: ['32px', { lineHeight: '36px', letterSpacing: '-0.7px' }],
        title: ['22px', { lineHeight: '28px', letterSpacing: '-0.4px' }],
        heading: ['17px', { lineHeight: '23px', letterSpacing: '-0.2px' }],
        price: ['17px', { lineHeight: '22px', letterSpacing: '-0.3px' }],
        body: ['15px', { lineHeight: '21px', letterSpacing: '-0.08px' }],
        label: ['13px', { lineHeight: '18px', letterSpacing: '0px' }],
        caption: ['12px', { lineHeight: '17px', letterSpacing: '0.1px' }],
        // Antetítulo en versales: el interletrado abierto es lo que lo separa del texto normal.
        eyebrow: ['11px', { lineHeight: '14px', letterSpacing: '1.1px' }],
      },
      borderRadius: { field: 9, selector: 10, box: 14, sheet: 22 },
    },
  },
  plugins: [],
}
