/** Espía del enrutador que instala jest.setup.js, para poder afirmar a dónde navega cada pantalla. */
declare const routerMock: {
  replace: jest.Mock
  push: jest.Mock
  back: jest.Mock
  navigate: jest.Mock
}
