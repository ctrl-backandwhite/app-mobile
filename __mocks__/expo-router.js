/* eslint-env jest */
const React = require('react')

/**
 * Sustituto de expo-router para las pruebas de pantalla.
 *
 * Vive en un fichero propio y no en una factoría de `jest.mock` porque esa factoría se eleva por
 * encima del módulo y no puede referenciar nada de fuera: ni el objeto del router, ni las funciones
 * que el preset de NativeWind inyecta al transformar el JSX.
 *
 * Al estar en `__mocks__/` junto a `node_modules`, Jest lo aplica automáticamente y ninguna prueba
 * necesita declararlo.
 */
const router = {
  replace: jest.fn(),
  push: jest.fn(),
  back: jest.fn(),
  navigate: jest.fn(),
}

module.exports = {
  router,
  useRouter: () => router,
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
  Redirect: ({ href }) => React.createElement('Redirect', { href }),
  Stack: Object.assign(({ children }) => React.createElement('Stack', null, children), {
    Screen: ({ children }) => React.createElement('StackScreen', null, children),
  }),
  Link: ({ children }) => React.createElement('Link', null, children),
}
