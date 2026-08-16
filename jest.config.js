const expoPreset = require('jest-expo/jest-preset')

/**
 * El preset de jest-expo aporta el entorno de React Native, los mocks de los módulos nativos
 * (SecureStore, Font, Reanimated…) y la lista de paquetes que Babel debe transformar.
 *
 * Esa lista NO se sustituye, se extiende: reescribirla desde cero deja fuera paquetes que el preset
 * sí contempla y aparecen fallos de «Cannot use import statement outside a module» en sitios que
 * nada tienen que ver con el cambio. Aquí solo se añade @noble/hashes, que se publica como ESM puro
 * y por tanto el runtime CommonJS de Jest no puede cargar sin transformar.
 */
const NEEDS_TRANSFORM = ['@noble']

module.exports = {
  ...expoPreset,
  transformIgnorePatterns: expoPreset.transformIgnorePatterns.map((pattern, index) =>
    index === 0 ? pattern.replace('(?!(', `(?!(${NEEDS_TRANSFORM.join('|')}|`) : pattern,
  ),
  moduleNameMapper: {
    ...expoPreset.moduleNameMapper,
    '^@composition/(.*)$': '<rootDir>/src/composition/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@ds/(.*)$': '<rootDir>/src/design-system/$1',
    '^@features/(.*)$': '<rootDir>/src/features/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/index.ts',
    '!src/**/__tests__/**',
    // Los dobles y ayudantes de prueba no son código de producción y no deben contar para la
    // cobertura, ni para bien ni para mal.
    '!src/**/testing/**',
  ],
  coverageThreshold: {
    global: { statements: 90, branches: 90, functions: 90, lines: 90 },
  },
}
