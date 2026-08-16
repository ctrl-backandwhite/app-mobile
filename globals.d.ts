/** Espía del enrutador que instala jest.setup.js, para poder afirmar a dónde navega cada pantalla. */
declare const routerMock: {
  replace: jest.Mock
  push: jest.Mock
  back: jest.Mock
  navigate: jest.Mock
}

/**
 * El tsconfig limita los tipos globales a `jest` para no arrastrar las APIs de Node a una
 * aplicación que no las tiene, y sin @types/node el `global` que usan las pruebas no existe para
 * TypeScript. Se declara aquí solo lo que hace falta, sin abrir la puerta al resto de Node.
 */
declare const global: typeof globalThis & { routerMock: typeof routerMock }
