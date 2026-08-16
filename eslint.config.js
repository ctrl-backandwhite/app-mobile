// Configuración plana de ESLint 9. El formato .eslintrc quedó obsoleto en la versión 9.
const expo = require('eslint-config-expo/flat')
const boundaries = require('eslint-plugin-boundaries')

/**
 * La regla de dependencia de la arquitectura hexagonal se verifica aquí, no en una revisión: el
 * dominio no puede importar de `data` ni de `presentation`, y una violación rompe el lint.
 *
 * `core` y `shared` son la excepción deliberada del dominio: aportan tipos puros —Result, AppError—
 * sin dependencias de plataforma, así que importarlos no lo ata a ninguna infraestructura.
 */
module.exports = [
  ...expo,
  {
    ignores: ['node_modules/**', '.expo/**', 'dist/**', 'android/**', 'ios/**', 'expo-env.d.ts'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'app', mode: 'file', pattern: 'app/**/*' },
        // Raíz de composición: el único sitio que conoce todas las capas a la vez, porque su
        // trabajo es precisamente cablearlas. Aislarlo aquí evita que `core` acabe dependiendo de
        // una feature concreta solo para poder construir el contenedor.
        { type: 'composition', mode: 'file', pattern: 'src/composition/**/*' },
        { type: 'core', mode: 'file', pattern: 'src/core/**/*' },
        { type: 'ds', mode: 'file', pattern: 'src/design-system/**/*' },
        { type: 'shared', mode: 'file', pattern: 'src/shared/**/*' },
        { type: 'domain', mode: 'file', pattern: 'src/features/*/domain/**/*' },
        { type: 'data', mode: 'file', pattern: 'src/features/*/data/**/*' },
        { type: 'presentation', mode: 'file', pattern: 'src/features/*/presentation/**/*' },
      ],
      'boundaries/ignore': ['**/__tests__/**/*', '**/*.test.{ts,tsx}'],
    },
    rules: {
      'boundaries/element-types': [
        2,
        {
          default: 'disallow',
          rules: [
            { from: 'domain', allow: ['domain', 'shared', 'core'] },
            { from: 'data', allow: ['data', 'domain', 'core', 'shared'] },
            { from: 'presentation', allow: ['presentation', 'domain', 'core', 'ds', 'shared', 'composition'] },
            {
              from: 'composition',
              allow: ['composition', 'domain', 'data', 'presentation', 'core', 'ds', 'shared'],
            },
            {
              from: 'app',
              allow: ['app', 'composition', 'presentation', 'domain', 'core', 'ds', 'shared'],
            },
            { from: 'core', allow: ['core', 'shared'] },
            { from: 'ds', allow: ['ds', 'core', 'shared'] },
            { from: 'shared', allow: ['shared'] },
          ],
        },
      ],
    },
  },
]
