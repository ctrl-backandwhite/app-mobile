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

/**
 * Parámetros de la ruta activa. Las pantallas con parámetro —la ficha, por ejemplo— los leen de
 * `useLocalSearchParams`, así que la prueba necesita poder fijarlos antes de montar.
 */
let localParams = {}

function setLocalSearchParams(params) {
  localParams = params ?? {}
}

/**
 * En la aplicación, `useFocusEffect` corre el efecto cada vez que la pantalla vuelve al frente. En
 * una prueba la pantalla se monta una vez y ya está delante, así que basta con un efecto de montaje:
 * lo que se comprueba es que la pantalla carga sus datos, no el ciclo de la navegación.
 */
function useFocusEffect(effect) {
  React.useEffect(effect, [effect])
}

module.exports = {
  router,
  useRouter: () => router,
  useFocusEffect,
  useLocalSearchParams: () => localParams,
  setLocalSearchParams,
  useSegments: () => [],
  Redirect: ({ href }) => React.createElement('Redirect', { href }),
  Stack: Object.assign(({ children }) => React.createElement('Stack', null, children), {
    Screen: ({ children }) => React.createElement('StackScreen', null, children),
  }),
  Link: ({ children }) => React.createElement('Link', null, children),
}
