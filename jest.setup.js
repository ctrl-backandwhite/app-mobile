/**
 * AsyncStorage necesita su módulo nativo, que en Jest no existe. La propia librería publica un
 * sustituto en memoria; sin él, cualquier prueba que monte el contenedor de dependencias falla con
 * «NativeModule: AsyncStorage is null».
 */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
)

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
