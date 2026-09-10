const expoPreset = require('jest-expo/jest-preset')

/**
 * El preset de jest-expo aporta el entorno de React Native, los mocks de los módulos nativos
 * (SecureStore, Font, Reanimated…) y la lista de paquetes que Babel debe transformar.
 *
 * Esa lista NO se sustituye, se extiende: reescribirla desde cero deja fuera paquetes que el preset
 * sí contempla y aparecen fallos de «Cannot use import statement outside a module» en sitios que
 * nada tienen que ver con el cambio.
 *
 * Aquí solo se añade @noble/hashes, que se publica como ESM puro y por tanto el runtime CommonJS de
 * Jest no puede cargar sin transformar.
 */
const NEEDS_TRANSFORM = ['@noble']

module.exports = {
  ...expoPreset,
  transformIgnorePatterns: expoPreset.transformIgnorePatterns.map((pattern, index) =>
    index === 0 ? pattern.replace('(?!(', `(?!(${NEEDS_TRANSFORM.join('|')}|`) : pattern,
  ),
  moduleNameMapper: {
    ...expoPreset.moduleNameMapper,
    /*
     * Los iconos, por su compilado CommonJS.
     *
     * lucide-react-native apunta su campo `react-native` al `.mjs`, que es el que resuelve el
     * preset, y el transformador de Babel solo mira ficheros `.js`, `.jsx`, `.ts` y `.tsx`: la
     * extensión `.mjs` se le escapa y el fichero llega sin transformar con su `export` dentro.
     * Ampliar `transformIgnorePatterns` no arregla nada porque el problema no es la lista, es la
     * extensión. Apuntar al CommonJS que el propio paquete publica lo resuelve sin transformar mil
     * quinientos iconos en cada ejecución.
     */
    '^lucide-react-native$':
      '<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js',
    '^@composition/(.*)$': '<rootDir>/src/composition/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@ds/(.*)$': '<rootDir>/src/design-system/$1',
    '^@features/(.*)$': '<rootDir>/src/features/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  /**
   * Los 5 segundos que trae Jest por defecto se quedan cortos en la PRIMERA ejecución sobre una
   * máquina limpia: con la caché de transformación fría, montar una pantalla entera con React
   * Native Testing Library puede pasar de ese margen y la prueba falla por tiempo aunque el código
   * esté bien. En integración continua la caché siempre está fría, así que ocurriría en cada
   * ejecución; en local solo la primera vez, que es lo que lo hace difícil de diagnosticar.
   */
  testTimeout: 30000,
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
