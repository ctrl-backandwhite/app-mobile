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
