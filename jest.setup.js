/**
 * AsyncStorage necesita su módulo nativo, que en Jest no existe. La propia librería publica un
 * sustituto en memoria; sin él, cualquier prueba que monte el contenedor de dependencias falla con
 * «NativeModule: AsyncStorage is null».
 */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
)

/**
 * El SDK de la pasarela es otro módulo NATIVO que en Jest no existe: importarlo falla igual, con
 * «NativeModule … is null». La librería no publica ningún sustituto, así que lo escribe la casa en
 * `__mocks__/stripe-react-native.js`.
 *
 * El sustituto NO puede vivir dentro de esta factoría —como sí vive el de AsyncStorage— porque pinta
 * componentes: la factoría se eleva por encima del módulo y no puede referenciar nada de fuera, ni
 * siquiera las funciones que el preset de NativeWind inyecta al transformarlos.
 */
jest.mock('@stripe/stripe-react-native', () => require('./__mocks__/stripe-react-native'))

const { router } = require('expo-router')

/**
 * El sustituto de expo-router vive en `__mocks__/expo-router.js` y Jest lo aplica solo. Aquí se
 * expone su router en el ámbito global para poder afirmar a dónde navega cada pantalla sin
 * reimportarlo en cada fichero, y se limpian los espías entre pruebas.
 */
global.routerMock = router
global.setLocalSearchParams = require('expo-router').setLocalSearchParams

beforeEach(() => {
  global.setLocalSearchParams({})
  router.replace.mockClear()
  router.push.mockClear()
  router.back.mockClear()
  router.navigate.mockClear()
})
